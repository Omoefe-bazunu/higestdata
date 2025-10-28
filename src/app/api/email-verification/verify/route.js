// app/api/email-verification/verify/route.js
import { db } from "@/lib/firebase";
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
    if (!email || !token)
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });

    const normalizedEmail = email.trim().toLowerCase();
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("email", "==", normalizedEmail),
      where("verificationToken", "==", token.trim())
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty)
      return NextResponse.json(
        { message: "Invalid email or code" },
        { status: 400 }
      );

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const tokenDate =
      userData.tokenCreatedAt?.toDate?.() || new Date(userData.tokenCreatedAt);

    if (Date.now() - tokenDate.getTime() > 30 * 60 * 1000) {
      return NextResponse.json({ message: "Code expired" }, { status: 400 });
    }

    await updateDoc(userDoc.ref, {
      isVerified: true,
      verificationToken: null,
      tokenCreatedAt: null,
    });

    return NextResponse.json({ message: "Verified" });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
