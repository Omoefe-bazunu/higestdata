import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { accountNumber, bankCode } = await request.json();

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { error: "Account number and bank code are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to resolve account" },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      accountName: data.data.account_name,
      accountNumber: data.data.account_number,
    });
  } catch (error) {
    console.error("Resolve account error:", error);
    return NextResponse.json(
      { error: "Failed to resolve account" },
      { status: 500 }
    );
  }
}
