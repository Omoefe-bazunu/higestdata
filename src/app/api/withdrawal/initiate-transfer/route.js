import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { amount, recipientCode, reference } = await request.json();

    if (!amount || !recipientCode || !reference) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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
