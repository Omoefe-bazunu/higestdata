//app/api/paystack/initialize/route.js

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { email, amount, userId } = await request.json();

    if (!email || !amount || !userId) {
      return NextResponse.json(
        { error: "Email, amount, and userId are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${process.env.PROXY_URL}/paystack/initialize`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount,
          userId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to initialize transaction" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Paystack initialization error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
