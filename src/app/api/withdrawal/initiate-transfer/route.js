//app/api/withdrawal/initiate-transfer/route.js

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

    const response = await fetch(
      `${process.env.PROXY_URL}/withdrawal/initiate-transfer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount, recipientCode, reference }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to initiate transfer" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Initiate transfer error:", error);
    return NextResponse.json(
      { error: "Failed to initiate withdrawal" },
      { status: 500 }
    );
  }
}
