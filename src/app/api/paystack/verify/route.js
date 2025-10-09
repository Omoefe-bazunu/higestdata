import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json(
        { error: "Transaction reference is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to verify transaction" },
        { status: response.status }
      );
    }

    const transactionData = data.data;

    // Check if transaction was successful
    if (transactionData.status !== "success") {
      return NextResponse.json({
        success: false,
        message: "Transaction was not successful",
        status: transactionData.status,
      });
    }

    const userId = transactionData.metadata.userId;
    const amountInNaira = transactionData.amount / 100;

    // Return verification data to be processed on client side
    return NextResponse.json({
      success: true,
      message: "Transaction verified successfully",
      userId,
      amount: amountInNaira,
      reference,
      email: transactionData.customer.email,
      channel: transactionData.channel,
      currency: transactionData.currency,
    });
  } catch (error) {
    console.error("Paystack verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
