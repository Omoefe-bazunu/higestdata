// API ROUTE: /api/exam-cards/purchase/route.js
// ============================================================================

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
import { purchaseExamCard, getAccountInfo } from "@/lib/naijaresultpins";

function generateRequestId(userId) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `req_${timestamp}_exam_${userId.slice(-6)}_${random}`;
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, cardTypeId, quantity } = body;

    if (!userId || !cardTypeId || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty < 1 || qty > 100) {
      return NextResponse.json(
        { error: "Invalid quantity (1-100)" },
        { status: 400 }
      );
    }

    // Fetch exam card rates from Firestore
    const ratesDoc = await getDoc(doc(firestore, "settings", "examCardRates"));
    if (!ratesDoc.exists()) {
      return NextResponse.json(
        { error: "Exam card rates not configured" },
        { status: 400 }
      );
    }

    const rates = ratesDoc.data().rates || {};
    const cardRate = rates[cardTypeId];

    if (!cardRate) {
      return NextResponse.json(
        { error: "Card type not found" },
        { status: 404 }
      );
    }

    const unitPrice = cardRate.finalPrice || 0;
    const totalAmount = unitPrice * qty;

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

      // Check NaijaResultPins balance
      const accountInfo = await getAccountInfo();
      const nrpBalance = parseFloat(accountInfo[0]?.wallet_balance || 0);

      const baseAmount = cardRate.basePrice * qty;
      if (nrpBalance < baseAmount) {
        throw new Error("Insufficient platform balance");
      }

      const requestId = generateRequestId(userId);
      const transactionData = {
        userId,
        requestId,
        serviceType: "exam-card",
        cardTypeId,
        cardName: cardRate.name,
        quantity: qty,
        unitPrice,
        totalAmount,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const transactionRef = await addDoc(
        collection(firestore, "transactions"),
        transactionData
      );

      let nrpResponse;
      try {
        nrpResponse = await purchaseExamCard(cardTypeId, qty, requestId);
      } catch (nrpError) {
        transaction.update(transactionRef, {
          status: "failed",
          errorMessage: nrpError.message,
          updatedAt: serverTimestamp(),
        });
        throw nrpError;
      }

      if (!nrpResponse || !nrpResponse.status) {
        const errorMessage = nrpResponse?.message || "Purchase failed";
        transaction.update(transactionRef, {
          status: "failed",
          errorMessage,
          nrpResponse,
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
        nrpResponse,
        previousBalance: currentBalance,
        newBalance,
        cards: nrpResponse.cards || [],
        updatedAt: serverTimestamp(),
      });

      return {
        success: true,
        transactionId: transactionRef.id,
        requestId,
        nrpResponse,
        previousBalance: currentBalance,
        newBalance,
      };
    });

    return NextResponse.json({
      success: true,
      message: `${qty} ${cardRate.name} purchased successfully`,
      data: {
        transactionId: result.transactionId,
        requestId: result.requestId,
        quantity: qty,
        unitPrice,
        totalAmount,
        cards: result.nrpResponse.cards || [],
        newBalance: result.newBalance,
      },
    });
  } catch (error) {
    console.error("Exam card purchase error:", error);

    if (error.message === "User not found") {
      return NextResponse.json(
        { error: "User account not found" },
        { status: 404 }
      );
    }

    if (error.message === "Insufficient wallet balance") {
      return NextResponse.json(
        { error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    if (error.message === "Insufficient platform balance") {
      return NextResponse.json(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Transaction failed" },
      { status: 500 }
    );
  }
}
