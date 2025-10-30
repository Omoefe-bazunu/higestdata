//app/api/withdrawal/banks/route.js

import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await fetch(`${process.env.PROXY_URL}/withdrawal/banks`);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch banks");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch banks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch banks", details: error.message },
      { status: 500 }
    );
  }
}
