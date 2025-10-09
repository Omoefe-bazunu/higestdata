import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { accountName, accountNumber, bankCode } = await request.json();

    if (!accountName || !accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    const response = await fetch("https://api.paystack.co/transferrecipient", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "nuban",
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: "NGN",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to create recipient" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      recipientCode: data.data.recipient_code,
    });
  } catch (error) {
    console.error("Create recipient error:", error);
    return NextResponse.json(
      { error: "Failed to create recipient" },
      { status: 500 }
    );
  }
}
