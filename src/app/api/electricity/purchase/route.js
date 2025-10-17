import { NextResponse } from "next/server";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { getAccessToken, getBalance } from "@/lib/ebills";

const VALID_PROVIDERS = [
  "ikeja-electric",
  "eko-electric",
  "kano-electric",
  "portharcourt-electric",
  "jos-electric",
  "ibadan-electric",
  "kaduna-electric",
  "abuja-electric",
  "enugu-electric",
  "benin-electric",
  "aba-electric",
  "yola-electric",
];

const VALID_VARIATIONS = ["prepaid", "postpaid"];

async function verifyCustomer(token, customerId, serviceId, variationId) {
  try {
    const response = await fetch(
      `https://ebills.africa/wp-json/api/v2/verify-customer?service_id=${serviceId}&customer_id=${customerId}&variation_id=${variationId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseText = await response.text();
    console.log(
      `Verify electricity customer response: ${response.status} - ${responseText}`
    );

    if (!response.ok) {
      const error = JSON.parse(responseText);
      throw new Error(
        `Customer verification failed: ${response.status} - ${
          error.message || responseText
        }`
      );
    }

    const data = JSON.parse(responseText);
    return data.code === "success" ? data.data : null;
  } catch (error) {
    console.error("Error verifying customer:", error);
    throw error;
  }
}

async function purchaseElectricity(
  token,
  requestId,
  customerId,
  serviceId,
  variationId,
  amount
) {
  try {
    const payload = {
      request_id: requestId,
      customer_id: customerId,
      service_id: serviceId,
      variation_id: variationId,
      amount: Number(amount),
    };

    const response = await fetch(
      "https://ebills.africa/wp-json/api/v2/electricity",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await response.text();
    console.log(
      `Electricity purchase response: ${response.status} - ${responseText}`
    );

    if (!response.ok) {
      const error = JSON.parse(responseText);
      if (response.status === 400 && error.code === "missing_fields")
        throw new Error("Missing required fields");
      if (response.status === 400 && error.code === "invalid_service_id")
        throw new Error("Invalid electricity provider");
      if (response.status === 400 && error.code === "invalid_variation_id")
        throw new Error("Invalid meter type");
      if (response.status === 400 && error.code === "below_minimum_amount")
        throw new Error("Amount below minimum");
      if (response.status === 400 && error.code === "below_customer_arrears")
        throw new Error("Amount below outstanding arrears");
      if (response.status === 402 && error.code === "insufficient_funds")
        throw new Error("Insufficient eBills wallet balance");
      if (response.status === 409 && error.code === "duplicate_request_id")
        throw new Error("Duplicate request ID");
      if (response.status === 409 && error.code === "duplicate_order")
        throw new Error("Duplicate order within 3 minutes");
      if (response.status === 403 && error.code === "rest_forbidden")
        throw new Error("Unauthorized access");
      throw new Error(
        `Error purchasing electricity: ${response.status} - ${responseText}`
      );
    }

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error purchasing electricity:", error);
    throw error;
  }
}

function generateRequestId(userId) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `req_${timestamp}_electricity_${userId.slice(-6)}_${random}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, serviceType, amount, provider, customerId, variationId } =
      body;

    if (
      !userId ||
      !serviceType ||
      !amount ||
      !provider ||
      !customerId ||
      !variationId
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (serviceType !== "electricity") {
      return NextResponse.json(
        { success: false, message: "Invalid service type" },
        { status: 400 }
      );
    }

    if (!VALID_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { success: false, message: "Invalid electricity provider" },
        { status: 400 }
      );
    }

    if (!VALID_VARIATIONS.includes(variationId)) {
      return NextResponse.json(
        { success: false, message: "Invalid meter type" },
        { status: 400 }
      );
    }

    const electricityAmount = parseFloat(amount);
    if (isNaN(electricityAmount) || electricityAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    if (electricityAmount < 1000) {
      return NextResponse.json(
        { success: false, message: "Minimum purchase amount is ₦1000" },
        { status: 400 }
      );
    }

    if (electricityAmount > 100000) {
      return NextResponse.json(
        { success: false, message: "Maximum purchase amount is ₦100,000" },
        { status: 400 }
      );
    }

    const ratesDoc = await getDoc(
      doc(firestore, "settings", "electricityRates")
    );
    const electricityRates = ratesDoc.exists()
      ? ratesDoc.data()
      : { serviceCharge: 0, chargeType: "percentage" };

    const serviceCharge =
      electricityRates.chargeType === "percentage"
        ? (electricityAmount * electricityRates.serviceCharge) / 100
        : parseFloat(electricityRates.serviceCharge) || 0;

    const totalAmount = electricityAmount + serviceCharge;

    const result = await runTransaction(firestore, async (transaction) => {
      const userDocRef = doc(firestore, "users", userId);
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const currentBalance = userData.walletBalance || 0;

      if (currentBalance < totalAmount) {
        throw new Error("Insufficient wallet balance");
      }

      const token = await getAccessToken();
      const ebillsBalance = await getBalance();
      if (ebillsBalance < electricityAmount) {
        throw new Error("Insufficient eBills wallet balance");
      }

      const customerData = await verifyCustomer(
        token,
        customerId,
        provider,
        variationId
      );
      if (!customerData) {
        throw new Error("Invalid meter number or type");
      }

      if (customerData.min_purchase_amount > electricityAmount) {
        throw new Error(
          `Amount below minimum (${customerData.min_purchase_amount})`
        );
      }

      if (
        customerData.customer_arrears > 0 &&
        electricityAmount < customerData.customer_arrears
      ) {
        throw new Error(
          `Amount below outstanding arrears (${customerData.customer_arrears})`
        );
      }

      const requestId = generateRequestId(userId);
      const transactionData = {
        userId,
        requestId,
        serviceType: "electricity",
        provider,
        customerId,
        variationId,
        amount: electricityAmount,
        serviceCharge,
        totalAmount,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const transactionRef = await addDoc(
        collection(firestore, "transactions"),
        transactionData
      );

      let ebillsResponse;
      try {
        ebillsResponse = await purchaseElectricity(
          token,
          requestId,
          customerId,
          provider,
          variationId,
          electricityAmount
        );
      } catch (ebillsError) {
        transaction.update(transactionRef, {
          status: "failed",
          errorMessage: ebillsError.message,
          updatedAt: serverTimestamp(),
        });
        throw ebillsError;
      }

      if (!ebillsResponse || ebillsResponse.code !== "success") {
        const errorMessage =
          ebillsResponse?.message || "eBills API call failed";
        transaction.update(transactionRef, {
          status: "failed",
          errorMessage,
          ebillsResponse,
          updatedAt: serverTimestamp(),
        });
        throw new Error(errorMessage);
      }

      const newBalance = currentBalance - totalAmount;
      transaction.update(userDocRef, {
        walletBalance: newBalance,
        updatedAt: serverTimestamp(),
      });

      transaction.update(transactionRef, {
        status:
          ebillsResponse.data.status === "completed-api"
            ? "successful"
            : "processing",
        ebillsResponse,
        previousBalance: currentBalance,
        newBalance,
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        transactionId: transactionRef.id,
        requestId,
        ebillsResponse,
        previousBalance: currentBalance,
        newBalance,
      };
    });

    return NextResponse.json({
      success: true,
      message: `₦${electricityAmount.toLocaleString()} electricity units credited to your meter`,
      data: {
        transactionId: result.transactionId,
        requestId: result.requestId,
        amount: electricityAmount,
        serviceCharge,
        totalAmount,
        provider,
        customerId,
        variationId,
        newBalance: result.newBalance,
      },
    });
  } catch (error) {
    console.error("Electricity purchase error:", error);

    if (error.message === "User not found") {
      return NextResponse.json(
        { success: false, message: "User account not found" },
        { status: 404 }
      );
    }

    if (error.message === "Insufficient wallet balance") {
      return NextResponse.json(
        { success: false, message: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    if (error.message === "Insufficient eBills wallet balance") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Service temporarily unavailable due to insufficient platform funds",
        },
        { status: 503 }
      );
    }

    if (
      error.message.includes("below minimum") ||
      error.message.includes("below outstanding arrears")
    ) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    if (error.message === "Invalid meter number or type") {
      return NextResponse.json(
        { success: false, message: "Invalid meter number or type" },
        { status: 400 }
      );
    }

    if (error.message.includes("eBills")) {
      return NextResponse.json(
        {
          success: false,
          message: "Service temporarily unavailable. Please try again later.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Transaction failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
