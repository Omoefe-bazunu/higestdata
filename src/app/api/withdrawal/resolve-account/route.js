//app/api/withdrawal/resolve-account/route.js

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
      `${process.env.PROXY_URL}/withdrawal/resolve-account`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountNumber, bankCode }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to resolve account" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Resolve account error:", error);
    return NextResponse.json(
      { error: "Failed to resolve account", details: error.message },
      { status: 500 }
    );
  }
}
