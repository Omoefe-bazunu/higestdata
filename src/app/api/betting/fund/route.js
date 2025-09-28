// app/api/betting/fund/route.js
// API route for funding betting accounts using eBills

import { NextResponse } from "next/server";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";

// eBills API Configuration
const EBILLS_AUTH_URL = "https://ebills.africa/wp-json/jwt-auth/v1/token";
const EBILLS_API_URL = "https://ebills.africa/wp-json/api/v2/";
const EBILLS_USERNAME = process.env.EBILLS_USERNAME;
const EBILLS_PASSWORD = process.env.EBILLS_PASSWORD;

// Cache token for reuse (in production, use Redis or similar)
let cachedToken = null;
let tokenExpiry = null;

// Get access token from eBills
async function getEbillsToken() {
  // Return cached token if still valid
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await fetch(EBILLS_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: EBILLS_USERNAME,
        password: EBILLS_PASSWORD,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("eBills auth error:", response.status, errorText);

      if (response.status === 400)
        throw new Error("Invalid request parameters");
      if (response.status === 401)
        throw new Error("Invalid eBills credentials");
      if (response.status === 403)
        throw new Error("IP not whitelisted with eBills");
      throw new Error(`eBills authentication failed: ${response.status}`);
    }

    const data = await response.json();

    if (!data.token) {
      throw new Error(data.message || "No token received from eBills");
    }

    // Cache token (assume 23 hours validity)
    cachedToken = data.token;
    tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

    return cachedToken;
  } catch (error) {
    console.error("Error getting eBills token:", error);
    throw error;
  }
}

// Fund betting account via eBills API
async function fundBettingAccount(
  token,
  requestId,
  customerId,
  serviceId,
  amount
) {
  try {
    const payload = {
      request_id: requestId,
      customer_id: customerId,
      service_id: serviceId,
      amount: amount,
    };

    const response = await fetch(`${EBILLS_API_URL}betting`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("eBills betting API error:", response.status, errorText);
      throw new Error(`eBills betting API failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error funding betting account:", error);
    throw error;
  }
}

// Generate unique request ID
function generateRequestId(userId, serviceType = "betting") {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `req_${timestamp}_${serviceType}_${userId.slice(-6)}_${random}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId, serviceType, amount, provider, customerId } = body;

    // Validate required fields
    if (!userId || !serviceType || !amount || !provider || !customerId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required fields: userId, serviceType, amount, provider, customerId",
        },
        { status: 400 }
      );
    }

    // Validate amount
    const transactionAmount = parseFloat(amount);
    if (isNaN(transactionAmount) || transactionAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    // Minimum amount validation
    if (transactionAmount < 50) {
      return NextResponse.json(
        { success: false, message: "Minimum funding amount is ₦50" },
        { status: 400 }
      );
    }

    // Validate service type
    if (serviceType !== "betting") {
      return NextResponse.json(
        { success: false, message: "Invalid service type" },
        { status: 400 }
      );
    }

    // Run transaction to ensure atomic operations
    const result = await runTransaction(firestore, async (transaction) => {
      // Get user document
      const userDocRef = doc(firestore, "users", userId);
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists()) {
        throw new Error("User not found");
      }

      const userData = userDoc.data();
      const currentBalance = userData.walletBalance || 0;

      // Check if user has sufficient balance
      if (currentBalance < transactionAmount) {
        throw new Error("Insufficient wallet balance");
      }

      // Get eBills token
      const token = await getEbillsToken();

      // Generate unique request ID
      const requestId = generateRequestId(userId, "betting");

      // Create transaction record first (pending status)
      const transactionData = {
        userId,
        requestId,
        serviceType: "betting",
        provider,
        customerId,
        amount: transactionAmount,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const transactionRef = await addDoc(
        collection(firestore, "transactions"),
        transactionData
      );

      // Call eBills API to fund betting account
      let ebillsResponse;
      try {
        ebillsResponse = await fundBettingAccount(
          token,
          requestId,
          customerId,
          provider,
          transactionAmount
        );
      } catch (ebillsError) {
        // Update transaction as failed
        transaction.update(transactionRef, {
          status: "failed",
          errorMessage: ebillsError.message,
          updatedAt: serverTimestamp(),
        });
        throw ebillsError;
      }

      // Check eBills response
      if (!ebillsResponse || ebillsResponse.status !== "success") {
        const errorMessage =
          ebillsResponse?.message || "eBills API call failed";

        // Update transaction as failed
        transaction.update(transactionRef, {
          status: "failed",
          errorMessage,
          ebillsResponse,
          updatedAt: serverTimestamp(),
        });

        throw new Error(errorMessage);
      }

      // Deduct amount from user's wallet
      const newBalance = currentBalance - transactionAmount;
      transaction.update(userDocRef, {
        walletBalance: newBalance,
        updatedAt: serverTimestamp(),
      });

      // Update transaction as successful
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
      message: `₦${transactionAmount.toLocaleString()} has been credited to your ${provider} account`,
      data: {
        transactionId: result.transactionId,
        requestId: result.requestId,
        amount: transactionAmount,
        provider,
        customerId,
        newBalance: result.newBalance,
      },
    });
  } catch (error) {
    console.error("Betting funding error:", error);

    // Return appropriate error response
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

// GET method to check API status or get transaction details
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    if (requestId) {
      // Query transaction by requestId
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

      return NextResponse.json({
        success: true,
        data: {
          id: transactionDoc.id,
          ...transactionData,
        },
      });
    }

    // Return API status
    return NextResponse.json({
      success: true,
      message: "Betting API is operational",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Betting API GET error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
