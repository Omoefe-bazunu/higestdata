import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export async function POST(request) {
  try {
    const { userId, otp } = await request.json();

    if (!userId || !otp) {
      return NextResponse.json(
        { error: "User ID and OTP are required" },
        { status: 400 }
      );
    }

    const userRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const storedOTP = userData.verificationToken;
    const expiryTime = userData.verificationTokenExpiry;

    if (!storedOTP || !expiryTime) {
      return NextResponse.json(
        { error: "No OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if OTP is expired
    if (new Date() > new Date(expiryTime)) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (storedOTP !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}
