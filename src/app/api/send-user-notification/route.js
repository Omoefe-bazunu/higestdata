// app/api/send-user-notification/route.js
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const {
      userId,
      status,
      type,
      itemName,
      amount,
      reason,
      cryptoName,
      userEmail,
    } = await request.json();

    if (!userId || !status || !type || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const companyName = "Highest Data Fintech Solutions";
    const logoUrl =
      "https://firebasestorage.googleapis.com/v0/b/haven-aa6a7.firebasestorage.app/o/general%2FHIGHEST%20ICON%20COLORED.png?alt=media&token=2eea2fd9-4677-4297-8a4b-e6119ba3c9e8";
    const orderItem = type === "giftCard" ? itemName : cryptoName || itemName;

    let subject, userHtml;

    if (status === "approved") {
      subject = `${
        type === "giftCard" ? "Gift Card" : "Crypto"
      } Order Approved`;
      userHtml = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
            <h2>${companyName}</h2>
          </div>
          <p>Your ${
            type === "giftCard" ? "gift card" : "crypto"
          } order for <strong>${orderItem}</strong> worth <strong>₦${amount}</strong> has been <span style="color:green;font-weight:bold;">APPROVED</span>.</p>
          <p>We will process your transaction shortly. Thank you for choosing us!</p>
          <br>
          <p>Best regards,<br>${companyName} Team</p>
        </div>
      `;
    } else if (status === "rejected") {
      subject = `${
        type === "giftCard" ? "Gift Card" : "Crypto"
      } Order Rejected`;
      userHtml = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
            <h2>${companyName}</h2>
          </div>
          <p>We regret to inform you that your ${
            type === "giftCard" ? "gift card" : "crypto"
          } order for <strong>${orderItem}</strong> worth <strong>₦${amount}</strong> has been <span style="color:red;font-weight:bold;">REJECTED</span>.</p>
          <p><strong>Reason:</strong> ${reason || "Not specified"}.</p>
          <p>Please review and try again, or contact support for assistance.</p>
          <br>
          <p>Best regards,<br>${companyName} Team</p>
        </div>
      `;
    } else {
      return NextResponse.json(
        { error: `Unsupported status: ${status}` },
        { status: 400 }
      );
    }

    await resend.emails.send({
      from: `${companyName} <info@highestdata.com.ng>`,
      to: userEmail,
      subject,
      html: userHtml,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error sending user notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification", details: error.message },
      { status: 500 }
    );
  }
}
