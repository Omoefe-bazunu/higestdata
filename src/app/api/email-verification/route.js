// app/api/email-verification/route.js
import { firestore } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email, token } = await req.json();
    if (!email || !token) {
      return NextResponse.json(
        { message: "Email and token are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const usersRef = collection(firestore, "users");
    const q = query(
      usersRef,
      where("email", "==", normalizedEmail),
      where("verificationToken", "==", token.trim())
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return NextResponse.json(
        { message: "Invalid email or token" },
        { status: 400 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const tokenDate =
      userData.tokenCreatedAt?.toDate?.() || new Date(userData.tokenCreatedAt);

    if (Date.now() - tokenDate.getTime() > 1000 * 60 * 30) {
      return NextResponse.json(
        { message: "Token expired. Please request a new one." },
        { status: 400 }
      );
    }

    await updateDoc(userDoc.ref, {
      isVerified: true,
      verificationToken: null,
      tokenCreatedAt: null,
    });

    return NextResponse.json(
      { message: "Verification successful" },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// Add OPTIONS handler
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
