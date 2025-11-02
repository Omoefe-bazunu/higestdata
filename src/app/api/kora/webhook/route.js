import { NextResponse } from "next/server";
import crypto from "crypto";
import { firestore } from "@/lib/firebaseConfig";
import { doc, updateDoc, collection, addDoc } from "firebase/firestore";

export async function POST(request) {
  const body = await request.json();
  const signature = request.headers.get("x-korapay-signature");
  const hash = crypto
    .createHmac("sha256", process.env.KORA_SECRET_KEY)
    .update(JSON.stringify(body.data))
    .digest("hex");

  if (hash !== signature)
    return NextResponse.json({ error: "Invalid sig" }, { status: 400 });

  const { reference, status } = body.data;

  if (body.event === "transfer.success" && status === "success") {
    const txSnap = await firestore
      .collection("users")
      .where("transactions.reference", "==", reference)
      .get();
    if (!txSnap.empty) {
      const txDoc = txSnap.docs[0];
      await updateDoc(txDoc.ref, { status: "success" });
    }
  }

  return NextResponse.json({ status: "ok" });
}
