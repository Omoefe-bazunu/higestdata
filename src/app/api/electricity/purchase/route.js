import { NextResponse } from "next/server";
import {
  getAccessToken,
  getBalance,
  verifyCustomer,
  purchaseElectricity,
} from "@/lib/ebills";

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

function generateRequestId(userId) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `req_${timestamp}_electricity_${userId.slice(-6)}_${random}`;
}

export async function POST(request) {
  console.log("=== ELECTRICITY API CALLED ===");

  try {
    const body = await request.json();
    const {
      userId,
      serviceType,
      amount,
      provider,
      customerId,
      variationId,
      serviceCharge,
      totalAmount,
    } = body;

    // Validate input
    if (
      !userId ||
      !serviceType ||
      !amount ||
      !provider ||
      !customerId ||
      !variationId ||
      serviceCharge === undefined ||
      !totalAmount
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

    // Validate Firebase ID token
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("No authorization token provided");
      return NextResponse.json(
        { success: false, message: "Unauthorized: No authentication token" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    try {
      const verifyResponse = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken: token }),
        }
      );

      if (!verifyResponse.ok) {
        console.error("Token verification failed");
        return NextResponse.json(
          { success: false, message: "Unauthorized: Invalid token" },
          { status: 401 }
        );
      }

      const verifyData = await verifyResponse.json();
      const authenticatedUserId = verifyData.users[0].localId;

      if (authenticatedUserId !== userId) {
        console.error("User ID mismatch");
        return NextResponse.json(
          { success: false, message: "Unauthorized: User ID mismatch" },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error("Token verification error:", error);
      return NextResponse.json(
        { success: false, message: "Unauthorized: Token verification failed" },
        { status: 401 }
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

    // Validate serviceCharge and totalAmount
    const calculatedServiceCharge = parseFloat(serviceCharge);
    const calculatedTotalAmount = parseFloat(totalAmount);

    if (isNaN(calculatedServiceCharge) || calculatedServiceCharge < 0) {
      return NextResponse.json(
        { success: false, message: "Invalid service charge" },
        { status: 400 }
      );
    }

    if (isNaN(calculatedTotalAmount) || calculatedTotalAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid total amount" },
        { status: 400 }
      );
    }

    // Pre-flight checks before transaction
    await getAccessToken();
    const ebillsBalance = await getBalance();

    if (ebillsBalance < electricityAmount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Service temporarily unavailable due to insufficient platform funds",
        },
        { status: 503 }
      );
    }

    // Verify customer meter
    const customerData = await verifyCustomer(
      provider,
      customerId,
      variationId
    );
    if (!customerData) {
      return NextResponse.json(
        { success: false, message: "Invalid meter number or type" },
        { status: 400 }
      );
    }

    if (customerData.min_purchase_amount > electricityAmount) {
      return NextResponse.json(
        {
          success: false,
          message: `Amount below minimum (₦${customerData.min_purchase_amount})`,
        },
        { status: 400 }
      );
    }

    if (
      customerData.customer_arrears > 0 &&
      electricityAmount < customerData.customer_arrears
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Amount below outstanding arrears (₦${customerData.customer_arrears})`,
        },
        { status: 400 }
      );
    }

    const requestId = generateRequestId(userId);
    const transactionId = `txn_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    // Call eBills API
    let ebillsResponse;
    try {
      ebillsResponse = await purchaseElectricity(
        requestId,
        customerId,
        provider,
        variationId,
        electricityAmount
      );
    } catch (ebillsError) {
      console.error("eBills API error:", ebillsError);
      const transactionData = {
        userId,
        description: `Electricity purchase failed - ${provider}`,
        amount: calculatedTotalAmount,
        type: "debit",
        status: "failed",
        date: new Date().toISOString(),
        serviceType: "electricity",
        provider,
        customerId,
        variationId,
        requestId,
        electricityAmount,
        serviceCharge: calculatedServiceCharge,
        error: ebillsError.message || "eBills transaction failed",
      };

      return NextResponse.json(
        {
          success: false,
          message: ebillsError.message || "eBills transaction failed",
          transactionId,
          transactionData,
        },
        { status: 400 }
      );
    }

    if (!ebillsResponse || ebillsResponse.code !== "success") {
      const errorMessage = ebillsResponse?.message || "eBills API call failed";
      console.error("eBills response error:", errorMessage);

      const transactionData = {
        userId,
        description: `Electricity purchase failed - ${provider}`,
        amount: calculatedTotalAmount,
        type: "debit",
        status: "failed",
        date: new Date().toISOString(),
        serviceType: "electricity",
        provider,
        customerId,
        variationId,
        requestId,
        electricityAmount,
        serviceCharge: calculatedServiceCharge,
        error: errorMessage,
        ebillsResponse,
      };

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          transactionId,
          transactionData,
        },
        { status: 400 }
      );
    }

    // Return transaction data for client to save
    const transactionData = {
      userId,
      description: `Electricity purchase - ${provider}`,
      amount: calculatedTotalAmount,
      type: "debit",
      status:
        ebillsResponse.data.status === "completed-api" ? "success" : "pending",
      date: new Date().toISOString(),
      serviceType: "electricity",
      provider,
      customerId,
      variationId,
      requestId,
      electricityAmount,
      serviceCharge: calculatedServiceCharge,
      ebillsResponse,
      customerName: customerData.customer_name,
      customerAddress: customerData.customer_address,
    };

    console.log("Electricity purchase successful:", {
      transactionId,
      walletDeduction: calculatedTotalAmount,
      electricityAmount,
    });

    return NextResponse.json({
      success: true,
      message: `₦${electricityAmount.toLocaleString()} electricity units credited to your meter`,
      transactionId,
      transactionData,
      data: {
        requestId,
        amount: electricityAmount,
        serviceCharge: calculatedServiceCharge,
        totalAmount: calculatedTotalAmount,
        provider,
        customerId,
        variationId,
      },
    });
  } catch (error) {
    console.error("Electricity purchase error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Transaction failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
