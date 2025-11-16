// app/api/withdrawal/notify-user/route.js
import { NextResponse } from "next/server";
import { Resend } from "resend";
//

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL =
  process.env.ADMINEMAIL || "highestdatafintechsolutions@gmail.com";
const COMPANY_NAME = "Highest Data Fintech Solutions";
const LOGO_URL =
  "https://firebasestorage.googleapis.com/v0/b/haven-aa6a7.firebasestorage.app/o/general%2FHIGHEST%20ICON%20COLORED.png?alt=media&token=2eea2fd9-4677-4297-8a4b-e6119ba3c9e8";

export async function POST(request) {
  try {
    const {
      email,
      userName,
      amount,
      status,
      reference,
      bankName,
      accountNumber,
    } = await request.json();

    if (!email || !userName || !amount || !status || !reference) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const isCompleted = status === "completed";
    const subject = isCompleted
      ? `Withdrawal Completed: ₦${amount.toLocaleString()}`
      : `Withdrawal Failed: ₦${amount.toLocaleString()}`;

    const message = isCompleted
      ? `Your withdrawal of <strong>₦${amount.toLocaleString()}</strong> has been successfully processed and sent to <strong>${bankName}</strong> (<strong>${accountNumber}</strong>).`
      : `Your withdrawal request of <strong>₦${amount.toLocaleString()}</strong> was rejected. The amount has been refunded to your wallet.`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${LOGO_URL}" alt="${COMPANY_NAME}" style="max-width: 150px; height: auto;" />
          <h2>${COMPANY_NAME}</h2>
        </div>
        <h3>${subject}</h3>
        <p>Hello <strong>${userName}</strong>,</p>
        <p>${message}</p>
        <ul style="list-style: none; padding: 0;">
          <li><strong>Reference:</strong> ${reference}</li>
          <li><strong>Amount:</strong> ₦${amount.toLocaleString()}</li>
          ${
            isCompleted
              ? `<li><strong>Bank:</strong> ${bankName}</li>
               <li><strong>Account:</strong> ${accountNumber}</li>`
              : ""
          }
        </ul>
        <p>Thank you for using our service.</p>
        <hr style="margin: 30px 0; border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888; text-align: center;">
          &copy; ${new Date().getFullYear()} ${COMPANY_NAME}. All rights reserved.
        </p>
      </div>
    `;

    await resend.emails.send({
      from: `${COMPANY_NAME} <info@highestdata.com.ng>`,
      to: email,
      subject,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sending withdrawal user email:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}
