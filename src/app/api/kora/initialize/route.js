import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { userId } = await request.json();

    const reference = `KRA_${userId}_${Date.now()}`;

    return NextResponse.json({
      publicKey: process.env.KORA_PUBLIC_KEY,
      reference,
    });
  } catch (error) {
    console.error("Initialize error:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
