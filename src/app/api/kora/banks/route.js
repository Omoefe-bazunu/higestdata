// app/api/kora/banks/route.js
import { NextResponse } from "next/server";

const PROXY_URL =
  process.env.NEXT_PUBLIC_PROXY_URL || "https://higestdata-proxy.onrender.com";

export async function GET() {
  try {
    const response = await fetch(`${PROXY_URL}/kora/banks`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch banks");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Banks fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
