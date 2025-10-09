import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch("https://api.paystack.co/bank?currency=NGN", {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch banks");
    }

    // Remove duplicates by bank code
    const uniqueBanks = [
      ...new Map(data.data.map((bank) => [bank.code, bank])).values(),
    ];

    // Log for debugging
    if (data.data.length !== uniqueBanks.length) {
      console.warn(
        "Duplicate bank codes detected:",
        data.data.length - uniqueBanks.length
      );
    }

    return NextResponse.json({ banks: uniqueBanks });
  } catch (error) {
    console.error("Fetch banks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch banks", details: error.message },
      { status: 500 }
    );
  }
}
