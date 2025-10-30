//app/api/withdrawal/create-recipient/route.js

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

    const response = await fetch(
      `${process.env.PROXY_URL}/withdrawal/create-recipient`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ accountName, accountNumber, bankCode }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to create recipient" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Create recipient error:", error);
    return NextResponse.json(
      { error: "Failed to create recipient" },
      { status: 500 }
    );
  }
}
