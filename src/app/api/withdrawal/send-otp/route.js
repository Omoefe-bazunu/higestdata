import { NextResponse } from "next/server";
import { firestore } from "@/lib/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user data
    const userRef = doc(firestore, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in Firestore
    await updateDoc(userRef, {
      verificationToken: otp,
      verificationTokenExpiry: expiresAt.toISOString(),
    });

    // Send OTP via email
    await resend.emails.send({
      from: "Higher Exchange <info@higher.com.ng>",
      to: userData.email,
      subject: "Withdrawal OTP Verification",
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Withdrawal Verification</h2>
          <p>Your OTP for withdrawal is:</p>
          <h1 style="color: #10b981; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <br>
          <p>Best regards,<br>Higher Exchange Team</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "OTP sent successfully",
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP", details: error.message },
      { status: 500 }
    );
  }
}
