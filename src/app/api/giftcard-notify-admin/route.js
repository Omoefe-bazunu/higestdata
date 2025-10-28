// app/api/giftcard-notify-admin/route.js
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = "highestdatafintechsolutions@gmail.com";

export async function POST(request) {
  try {
    const {
      submissionId,
      giftCardName,
      faceValue,
      currency,
      ratePerUnit,
      payoutNaira,
      userId,
      userEmail,
      imageCount,
    } = await request.json();

    if (
      !submissionId ||
      !giftCardName ||
      !faceValue ||
      !currency ||
      !ratePerUnit ||
      !payoutNaira ||
      !userId ||
      !userEmail
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const companyName = "Highest Data Fintech Solutions";
    const logoUrl =
      "https://firebasestorage.googleapis.com/v0/b/haven-aa6a7.firebasestorage.app/o/general%2FHIGHEST%20ICON%20COLORED.png?alt=media&token=2eea2fd9-4677-4297-8a4b-e6119ba3c9e8";

    const adminSubject = `New Gift Card Sell Order: ${giftCardName} (${currency})`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
          <h2>${companyName}</h2>
        </div>
        <p>A new gift card sell order has been submitted.</p>
        <ul>
          <li><strong>Submission ID:</strong> ${submissionId}</li>
          <li><strong>Gift Card Name:</strong> ${giftCardName}</li>
          <li><strong>Face Value:</strong> ${faceValue.toFixed(
            2
          )} ${currency}</li>
          <li><strong>Rate:</strong> ₦${ratePerUnit.toLocaleString()} per ${currency}</li>
          <li><strong>Payout (NGN):</strong> ₦${payoutNaira.toLocaleString()}</li>
          <li><strong>User ID:</strong> ${userId}</li>
          ${
            imageCount
              ? `<li><strong>Image Count:</strong> ${imageCount}</li>`
              : ""
          }
        </ul>
        <p>Please review the order in the admin panel.</p>
      </div>
    `;

    const userSubject = `Your Gift Card Sell Order for ${giftCardName} Has Been Received`;
    const userHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
          <h2>${companyName}</h2>
        </div>
        <p>Thank you for submitting your gift card sell order!</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li><strong>Gift Card Name:</strong> ${giftCardName}</li>
          <li><strong>Amount:</strong> ${faceValue.toFixed(2)} ${currency}</li>
          <li><strong>Rate:</strong> ₦${ratePerUnit.toLocaleString()} per ${currency}</li>
          <li><strong>Expected Payout (NGN):</strong> ₦${payoutNaira.toLocaleString()}</li>
          ${
            imageCount
              ? `<li><strong>Images Uploaded:</strong> ${imageCount}</li>`
              : ""
          }
        </ul>
        <p>We are processing your order. You'll receive an update once it's reviewed (typically 15–30 minutes).</p>
        <p>Best regards,<br>${companyName} Team</p>
      </div>
    `;

    await resend.emails.send({
      from: `${companyName} <info@highestdata.com.ng>`,
      to: ADMIN_EMAIL,
      subject: adminSubject,
      html: adminHtml,
    });

    await resend.emails.send({
      from: `${companyName} <info@higher.com.ng>`,
      to: userEmail,
      subject: userSubject,
      html: userHtml,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error sending gift card notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification", details: error.message },
      { status: 500 }
    );
  }
}
