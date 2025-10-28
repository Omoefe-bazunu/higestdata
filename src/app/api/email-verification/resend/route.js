// app/api/email-verification/resend/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user in Firestore
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", normalizedEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { error: "No account found with this email" },
        { status: 404 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // Check if already verified
    if (userData.isVerified) {
      return NextResponse.json(
        { error: "This account is already verified" },
        { status: 400 }
      );
    }

    // Generate new verification code
    const newVerificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // Update user document with new code
    await updateDoc(userDoc.ref, {
      verificationToken: newVerificationCode,
      tokenCreatedAt: new Date(),
    });

    // Send new verification email
    const emailResponse = await fetch(
      `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/api/email-verification/send`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          firstName: userData.name?.split(" ")[0] || "User",
          verificationCode: newVerificationCode,
        }),
      }
    );

    if (!emailResponse.ok) {
      throw new Error("Failed to send verification email");
    }

    console.log("✅ Verification code resent to:", normalizedEmail);

    return NextResponse.json(
      {
        success: true,
        message: "Verification code has been resent to your email",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error resending verification code:", error);
    return NextResponse.json(
      { error: "Failed to resend verification code", details: error.message },
      { status: 500 }
    );
  }
}
