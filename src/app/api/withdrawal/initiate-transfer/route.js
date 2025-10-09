import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  increment,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export async function POST(request) {
  try {
    const {
      userId,
      amount,
      recipientCode,
      bankName,
      accountNumber,
      accountName,
    } = await request.json();

    if (!userId || !amount || !recipientCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user wallet balance
    const userRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const walletBalance = userDoc.data().walletBalance || 0;

    // Check sufficient balance (including ₦50 fee)
    const fee = 50;
    const totalAmount = amount + fee;

    if (walletBalance < totalAmount) {
      return NextResponse.json(
        { error: "Insufficient wallet balance" },
        { status: 400 }
      );
    }

    // Generate transfer reference
    const reference = `WDR_${uuidv4().replace(/-/g, "_").substring(0, 40)}`;

    // Initiate Paystack transfer
    const response = await fetch("https://api.paystack.co/transfer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: "balance",
        amount: amount * 100, // Convert to kobo
        recipient: recipientCode,
        reason: "Wallet Withdrawal",
        reference,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to initiate transfer" },
        { status: response.status }
      );
    }

    // Deduct from wallet immediately
    await updateDoc(userRef, {
      walletBalance: increment(-totalAmount),
    });

    // Create withdrawal transaction record
    const transactionsRef = collection(
      firestore,
      "users",
      userId,
      "transactions"
    );
    await addDoc(transactionsRef, {
      userId,
      description: `Withdrawal to ${bankName} - ${accountNumber}`,
      amount: totalAmount,
      fee,
      type: "debit",
      status: "Pending",
      date: new Date().toLocaleDateString(),
      createdAt: new Date().toISOString(),
      paystackReference: reference,
      transferCode: data.data.transfer_code,
      paymentMethod: "bank_transfer",
      metadata: {
        recipientCode,
        bankName,
        accountNumber,
        accountName,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Withdrawal initiated successfully",
      reference,
      transferCode: data.data.transfer_code,
    });
  } catch (error) {
    console.error("Initiate transfer error:", error);
    return NextResponse.json(
      { error: "Failed to initiate withdrawal" },
      { status: 500 }
    );
  }
}
