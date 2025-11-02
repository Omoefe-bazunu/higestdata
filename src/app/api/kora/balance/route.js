// app/api/kora/balance/route.js
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(
      "https://api.korapay.com/merchant/api/v1/balances",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    console.log("Kora balance:", data);

    if (!response.ok || !data.status) {
      throw new Error(data.message || "Failed to fetch balance");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Balance fetch error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
