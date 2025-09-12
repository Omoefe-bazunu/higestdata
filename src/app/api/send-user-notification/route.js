import { NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig"; // Ensure this path is correct
import { Resend } from "resend";
import UserNotification from "@/components/emails/UserNotification";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { userId, status, type, itemName, amount, reason, cryptoName } =
      await request.json(); // Added cryptoName to accept crypto details

    // Fetch user details from Firestore
    const userDoc = await getDoc(doc(firestore, "users", userId));
    if (!userDoc.exists()) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = userDoc.data();
    const userEmail = userData.email;
    const userName = userData.displayName || "User";

    let subject;
    let reactTemplate;

    // Determine the subject and template based on status and type
    if (status === "approved") {
      subject = `${
        type === "giftCard" ? "Gift Card" : "Crypto"
      } Sell Order Approved`;
      reactTemplate = UserNotification({
        userName,
        type, // Pass type to the component
        itemName: type === "giftCard" ? itemName : cryptoName, // Use cryptoName for crypto type
        amount,
        status: "approved",
      });
    } else if (status === "rejected") {
      subject = `${
        type === "giftCard" ? "Gift Card" : "Crypto"
      } Sell Order - Action Required`;
      reactTemplate = UserNotification({
        userName,
        type, // Pass type to the component
        itemName: type === "giftCard" ? itemName : cryptoName, // Use cryptoName for crypto type
        amount,
        status: "rejected",
        reason, // Pass reason only for rejected status
      });
    } else {
      // Handle any other unexpected statuses if necessary
      return NextResponse.json(
        { error: `Unsupported status: ${status}` },
        { status: 400 }
      );
    }

    const { error } = await resend.emails.send({
      from: "Higher Team <info@higher.com.ng>", // Must be verified on Resend
      to: [userEmail],
      subject,
      react: reactTemplate,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending user notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
