// app/api/email-verification/verify/route.js
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
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedToken = token.trim();

    // Query for user with matching email and token
    const usersRef = collection(firestore, "users");
    const q = query(
      usersRef,
      where("email", "==", normalizedEmail),
      where("verificationToken", "==", normalizedToken)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json(
        { message: "Invalid email or code" },
        { status: 400 }
      );
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    // Check if token has expired (30 minutes)
    if (userData.tokenCreatedAt) {
      // Firestore Timestamp has a toDate() method
      const tokenDate = userData.tokenCreatedAt.toDate();
      const thirtyMinutesInMs = 30 * 60 * 1000;
      const isExpired = Date.now() - tokenDate.getTime() > thirtyMinutesInMs;

      if (isExpired) {
        return NextResponse.json(
          { message: "Code expired. Please request a new one." },
          { status: 400 }
        );
      }
    }

    // Update user document - mark as verified and clear token
    await updateDoc(userDoc.ref, {
      isVerified: true,
      verificationToken: null,
      tokenCreatedAt: null,
    });

    return NextResponse.json({
      message: "Email verified successfully!",
    });
  } catch (error) {
    console.error("Verification error:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);

    return NextResponse.json(
      { message: "Server error. Please try again." },
      { status: 500 }
    );
  }
}
