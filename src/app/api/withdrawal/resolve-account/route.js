import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { accountNumber, bankCode } = await request.json();

    // Validate inputs
    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "Account number and bank code are required" },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      console.error("Invalid account number format:", accountNumber);
      return NextResponse.json(
        { error: "Account number must be 10 digits" },
        { status: 400 }
      );
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      console.error("PAYSTACK_SECRET_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Paystack resolve account error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to resolve account" },
        { status: response.status }
      );
    }

    console.log("Paystack resolve account success:", data.data);
    return NextResponse.json({
      success: true,
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
    });
  } catch (error) {
    console.error("Resolve account error:", error);
    return NextResponse.json(
      { error: "Failed to resolve account", details: error.message },
      { status: 500 }
    );
  }
}
