import { NextResponse } from "next/server";
import { Resend } from "resend";
import { SendAdminTemplate as EmailTemplate } from "@/components/emails/GiftCard/SendAdmin";

const resend = new Resend(process.env.RESEND_API_KEY);

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(",").map((email) => email.trim())
  : ["raniem57@gmail.com", "info@higher.com.ng"];

export async function POST(request) {
  try {
    const data = await request.json();

    const { error } = await resend.emails.send({
      from: "info@higher.com.ng", // must be verified in Resend
      to: ADMIN_EMAILS,
      subject: "New Gift Card Submission",
      react: EmailTemplate({ data }), // ✅ use React template instead of raw HTML
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email notification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
