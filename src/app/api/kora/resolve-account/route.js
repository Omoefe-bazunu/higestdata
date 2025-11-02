// app/api/kora/resolve-account/route.js
import { NextResponse } from "next/server";

const PROXY_URL =
  process.env.NEXT_PUBLIC_PROXY_URL || "https://higestdata-proxy.onrender.com";

export async function POST(request) {
  try {
    const { account, bank } = await request.json();

    const response = await fetch(`${PROXY_URL}/kora/resolve-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account, bank }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to resolve account");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Resolve error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
