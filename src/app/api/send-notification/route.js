import { NextResponse } from "next/server";
import { Resend } from "resend";
import { SendAdminTemplate } from "@/components/emails/GiftCard/SendAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((email) => email.trim())
  : ["raniem57@gmail.com", "info@higher.com.ng"];

export async function POST(request) {
  try {
    const data = await request.json();
    const requiredFields = [
      "submissionId",
      "giftCardName",
      "faceValue",
      "rate",
      "payoutNaira",
      "userId",
      "imageUrl",
    ];
    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length) {
      console.error("Missing fields:", missingFields);
      return NextResponse.json(
        { error: `Missing: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = ADMIN_EMAILS.filter(
      (email) => !emailRegex.test(email)
    );
    if (invalidEmails.length) {
      console.error("Invalid emails:", invalidEmails);
      return NextResponse.json(
        { error: `Invalid emails: ${invalidEmails.join(", ")}` },
        { status: 400 }
      );
    }

    const { data: emailData, error } = await resend.emails.send({
      from: "info@higher.com.ng",
      to: ADMIN_EMAILS,
      subject: "New Gift Card Submission",
      react: <SendAdminTemplate data={data} />,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("Email sent:", emailData);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Notification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
