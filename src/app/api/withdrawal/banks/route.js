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

    return NextResponse.json({ banks: data.data });
  } catch (error) {
    console.error("Fetch banks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch banks" },
      { status: 500 }
    );
  }
}
