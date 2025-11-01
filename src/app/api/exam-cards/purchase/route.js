import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import { purchaseExamCard, getAccountInfo } from "@/lib/naijaresultpins";

function generateRequestId(userId) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `req_${timestamp}_exam_${userId.slice(-6)}_${random}`;
}

export async function POST(request) {
  console.log("=== EXAM CARDS API CALLED ===");

  try {
    const body = await request.json();
    const { userId, cardTypeId, quantity } = body;

    // Validate input
    if (!userId || !cardTypeId || !quantity) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      return NextResponse.json(
        { success: false, message: "Invalid quantity (1-100)" },
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

    // Fetch exam card rates from Firestore
    const ratesDoc = await getDoc(doc(firestore, "settings", "examCardRates"));
    if (!ratesDoc.exists()) {
      return NextResponse.json(
        { success: false, message: "Exam card rates not configured" },
        { status: 400 }
      );
    }

    const rates = ratesDoc.data().rates || {};
    const cardRate = rates[cardTypeId];

    if (!cardRate) {
      return NextResponse.json(
        { success: false, message: "Card type not found" },
        { status: 404 }
      );
    }

    const unitPrice = cardRate.finalPrice || 0;
    const totalAmount = unitPrice * qty;

    // Pre-flight checks before transaction
    const accountInfo = await getAccountInfo();
    const nrpBalance = parseFloat(accountInfo[0]?.wallet_balance || 0);

    const baseAmount = cardRate.basePrice * qty;
    if (nrpBalance < baseAmount) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Service temporarily unavailable due to insufficient platform funds",
        },
        { status: 503 }
      );
    }

    const requestId = generateRequestId(userId);
    const transactionId = `txn_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;

    // Call NaijaResultPins API
    let nrpResponse;
    try {
      nrpResponse = await purchaseExamCard(cardTypeId, qty, requestId);
    } catch (nrpError) {
      console.error("NaijaResultPins API error:", nrpError);
      const transactionData = {
        userId,
        description: `Exam card purchase failed - ${cardRate.name}`,
        amount: totalAmount,
        type: "debit",
        status: "failed",
        date: new Date().toISOString(),
        serviceType: "exam-card",
        cardTypeId,
        cardName: cardRate.name,
        quantity: qty,
        unitPrice,
        requestId,
        error: nrpError.message || "NaijaResultPins transaction failed",
      };

      return NextResponse.json(
        {
          success: false,
          message: nrpError.message || "NaijaResultPins transaction failed",
          transactionId,
          transactionData,
        },
        { status: 400 }
      );
    }

    if (!nrpResponse || !nrpResponse.status) {
      const errorMessage = nrpResponse?.message || "Purchase failed";
      console.error("NaijaResultPins response error:", errorMessage);

      const transactionData = {
        userId,
        description: `Exam card purchase failed - ${cardRate.name}`,
        amount: totalAmount,
        type: "debit",
        status: "failed",
        date: new Date().toISOString(),
        serviceType: "exam-card",
        cardTypeId,
        cardName: cardRate.name,
        quantity: qty,
        unitPrice,
        requestId,
        error: errorMessage,
        nrpResponse,
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
      description: `Exam card purchase - ${cardRate.name}`,
      amount: totalAmount,
      type: "debit",
      status: "success",
      date: new Date().toISOString(),
      serviceType: "exam-card",
      cardTypeId,
      cardName: cardRate.name,
      quantity: qty,
      unitPrice,
      requestId,
      nrpResponse,
      cards: nrpResponse.cards || [],
    };

    console.log("Exam card purchase successful:", {
      transactionId,
      walletDeduction: totalAmount,
      quantity: qty,
      cards: nrpResponse.cards?.length || 0,
    });

    return NextResponse.json({
      success: true,
      message: `${qty} ${cardRate.name} purchased successfully`,
      transactionId,
      transactionData,
      data: {
        requestId,
        quantity: qty,
        unitPrice,
        totalAmount,
        cards: nrpResponse.cards || [],
        cardTypeId,
        cardName: cardRate.name,
      },
    });
  } catch (error) {
    console.error("Exam card purchase error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Transaction failed. Please try again.",
      },
      { status: 500 }
    );
  }
}
