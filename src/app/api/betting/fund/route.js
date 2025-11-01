import { NextResponse } from "next/server";
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
  console.log("=== BETTING API CALLED ===");

  try {
    const body = await request.json();
    const {
      userId,
      serviceType,
      amount,
      provider,
      customerId,
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
      serviceCharge === undefined ||
      !totalAmount
    ) {
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

    if (ebillsBalance < bettingAmount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Service temporarily unavailable due to insufficient platform funds",
        },
        { status: 503 }
      );
    }

    // Verify customer
    const customerData = await verifyCustomer(provider, customerId);
    if (!customerData) {
      return NextResponse.json(
        { success: false, message: "Invalid customer ID" },
        { status: 400 }
      );
    }

    const requestId = generateRequestId(userId, "betting");
    const transactionId = `txn_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    // Call eBills API
    let ebillsResponse;
    try {
      ebillsResponse = await fundBettingAccount(
        requestId,
        customerId,
        provider,
        bettingAmount
      );
    } catch (ebillsError) {
      console.error("eBills API error:", ebillsError);
      const transactionData = {
        userId,
        description: `Betting funding failed - ${provider}`,
        amount: calculatedTotalAmount,
        type: "debit",
        status: "failed",
        date: new Date().toISOString(),
        serviceType: "betting",
        provider,
        customerId,
        requestId,
        bettingAmount,
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
        description: `Betting funding failed - ${provider}`,
        amount: calculatedTotalAmount,
        type: "debit",
        status: "failed",
        date: new Date().toISOString(),
        serviceType: "betting",
        provider,
        customerId,
        requestId,
        bettingAmount,
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
      description: `Betting account funding - ${provider}`,
      amount: calculatedTotalAmount,
      type: "debit",
      status: "success",
      date: new Date().toISOString(),
      serviceType: "betting",
      provider,
      customerId,
      requestId,
      bettingAmount,
      serviceCharge: calculatedServiceCharge,
      ebillsResponse,
      customerName: customerData.customer_name || customerId,
    };

    console.log("Betting funding successful:", {
      transactionId,
      walletDeduction: calculatedTotalAmount,
      bettingAmount,
    });

    return NextResponse.json({
      success: true,
      message: `₦${bettingAmount.toLocaleString()} has been credited to your ${provider} account`,
      transactionId,
      transactionData,
      data: {
        requestId,
        amount: bettingAmount,
        serviceCharge: calculatedServiceCharge,
        totalAmount: calculatedTotalAmount,
        provider,
        customerId,
      },
    });
  } catch (error) {
    console.error("Betting funding error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Transaction failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
