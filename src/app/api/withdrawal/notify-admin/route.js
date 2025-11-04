// app/api/withdrawal/notify-admin/route.js
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL =
  process.env.ADMINEMAIL || "highestdatafintechsolutions@gmail.com";
const COMPANY_NAME = "Highest Data Fintech Solutions";

export async function POST(request) {
  try {
    const {
      userName,
      userEmail,
      amount,
      bankName,
      accountNumber,
      accountName,
      reference,
    } = await request.json();

    if (
      !userName ||
      !userEmail ||
      !amount ||
      !bankName ||
      !accountNumber ||
      !accountName ||
      !reference
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const subject = `New Withdrawal Request: ₦${amount.toLocaleString()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px;">
        <h2>${COMPANY_NAME}</h2>
        <p><strong>New withdrawal request submitted:</strong></p>
        <ul>
          <li><strong>User:</strong> ${userName} (${userEmail})</li>
          <li><strong>Amount:</strong> ₦${amount.toLocaleString()}</li>
          <li><strong>Bank:</strong> ${bankName}</li>
          <li><strong>Account:</strong> ${accountNumber} - ${accountName}</li>
          <li><strong>Reference:</strong> ${reference}</li>
        </ul>
        <p>Please log in to the admin panel to approve or reject.</p>
      </div>
    `;

    await resend.emails.send({
      from: `${COMPANY_NAME} <info@highestdata.com.ng>`,
      to: ADMIN_EMAIL,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin withdrawal email error:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}
