//app/api/email-verification/route.js

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
    console.log("Received payload:", { email, token });

    if (!email || !token) {
      console.log("Missing email or token");
      return NextResponse.json(
        { message: "Email and token are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log("Normalized email:", normalizedEmail);

    const usersRef = collection(firestore, "users");
    const q = query(
      usersRef,
      where("email", "==", normalizedEmail),
      where("verificationToken", "==", token.trim())
    );
    const querySnapshot = await getDocs(q);

    console.log("Query snapshot size:", querySnapshot.size);
    if (querySnapshot.empty) {
      console.log("No matching user found for email and token");
      return NextResponse.json(
        { message: "Invalid email or token" },
        { status: 400 }
      );
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    console.log("User data:", userData);

    const tokenCreatedAt = userData.tokenCreatedAt;
    if (!tokenCreatedAt) {
      console.log("No tokenCreatedAt found");
      return NextResponse.json(
        { message: "Invalid token data" },
        { status: 400 }
      );
    }

    const tokenDate = tokenCreatedAt.toDate
      ? tokenCreatedAt.toDate()
      : new Date(tokenCreatedAt);
    console.log("Token created at:", tokenDate);

    if (Date.now() - tokenDate.getTime() > 1000 * 60 * 30) {
      console.log("Token expired");
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
    console.log("User verified successfully");

    return NextResponse.json({ message: "Verification successful" });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
