import { NextResponse } from "next/server";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import {
  getAccessToken,
  getBalance,
  verifyCustomer,
  fundBettingAccount,
} from "@/lib/ebills";

const VALID_BETTING_PROVIDERS = [
  "1xBet",
  "BangBet",
  "Bet9ja",
  "BetKing",
  "BetLand",
  "BetLion",
  "BetWay",
  "CloudBet",
  "LiveScoreBet",
  "MerryBet",
  "NaijaBet",
  "NairaBet",
  "SupaBet",
];

function generateRequestId(userId, serviceType = "betting") {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `req_${timestamp}_${serviceType}_${userId.slice(-6)}_${random}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, serviceType, amount, provider, customerId } = body;

    if (!userId || !serviceType || !amount || !provider || !customerId) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (serviceType !== "betting") {
      return NextResponse.json(
        { success: false, message: "Invalid service type" },
        { status: 400 }
      );
    }

    if (!VALID_BETTING_PROVIDERS.includes(provider)) {
      return NextResponse.json(
        { success: false, message: "Invalid betting provider" },
        { status: 400 }
      );
    }

    const bettingAmount = parseFloat(amount);
    if (isNaN(bettingAmount) || bettingAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    if (bettingAmount < 100) {
      return NextResponse.json(
        { success: false, message: "Minimum funding amount is ₦100" },
        { status: 400 }
      );
    }

    if (bettingAmount > 100000) {
      return NextResponse.json(
        { success: false, message: "Maximum funding amount is ₦100,000" },
        { status: 400 }
      );
    }

    const ratesDoc = await getDoc(doc(firestore, "settings", "bettingRates"));
    const bettingRates = ratesDoc.exists()
      ? ratesDoc.data()
      : { serviceCharge: 10, chargeType: "percentage" };

    const serviceCharge =
      bettingRates.chargeType === "percentage"
        ? (bettingAmount * bettingRates.serviceCharge) / 100
        : parseFloat(bettingRates.serviceCharge) || 0;

    const totalAmount = bettingAmount + serviceCharge;

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

      await getAccessToken();
      const ebillsBalance = await getBalance();
      if (ebillsBalance < bettingAmount) {
        throw new Error("Insufficient eBills wallet balance");
      }

      const customerData = await verifyCustomer(provider, customerId);
      if (!customerData) {
        throw new Error("Invalid customer ID");
      }

      const requestId = generateRequestId(userId, "betting");

      const transactionData = {
        userId,
        requestId,
        serviceType: "betting",
        provider,
        customerId,
        bettingAmount,
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
        ebillsResponse = await fundBettingAccount(
          requestId,
          customerId,
          provider,
          bettingAmount
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
        status: "successful",
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
      message: `₦${bettingAmount.toLocaleString()} has been credited to your ${provider} account`,
      data: {
        transactionId: result.transactionId,
        requestId: result.requestId,
        bettingAmount,
        serviceCharge,
        totalAmount,
        provider,
        customerId,
        newBalance: result.newBalance,
      },
    });
  } catch (error) {
    console.error("Betting funding error:", error);

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

    if (error.message === "Invalid customer ID") {
      return NextResponse.json(
        { success: false, message: "Invalid customer ID" },
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    if (requestId) {
      const transactionsRef = collection(firestore, "transactions");
      const q = query(transactionsRef, where("requestId", "==", requestId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return NextResponse.json(
          { success: false, message: "Transaction not found" },
          { status: 404 }
        );
      }

      const transactionDoc = querySnapshot.docs[0];
      const transactionData = transactionDoc.data();

      return NextResponse.json(
        { success: true, data: { id: transactionDoc.id, ...transactionData } },
        { status: 200 }
      );
    }

    // No requestId provided — return all recent transactions (limit handled client-side or adjust as needed)
    const allTransactionsRef = collection(firestore, "transactions");
    const allSnapshot = await getDocs(allTransactionsRef);
    const transactions = allSnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json(
      { success: true, data: transactions },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
