// app/api/kora/disburse/route.js
import { NextResponse } from "next/server";

const PROXY_URL =
  process.env.NEXT_PUBLIC_PROXY_URL || "https://higestdata-proxy.onrender.com";

export async function POST(request) {
  try {
    const body = await request.json();

    const response = await fetch(`${PROXY_URL}/kora/disburse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || data.message || "Failed to process payout");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Disburse error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
