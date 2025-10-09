import { NextResponse } from "next/server";

export async function POST(request) {
  // OTP verification is now handled client-side in WithdrawalModal.jsx
  // This route can be a placeholder or removed if not needed for other purposes
  return NextResponse.json(
    { error: "OTP verification is handled client-side" },
    { status: 400 }
  );
}
