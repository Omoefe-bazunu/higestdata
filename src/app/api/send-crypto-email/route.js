import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const {
      orderType,
      amount,
      crypto,
      walletAddress,
      sendingWalletAddress,
      userEmail,
    } = await request.json();

    if (!orderType || !amount || !crypto || !userEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const companyName = "Highest Data Fintech Solutions";
    const adminEmail = "highestdatafintechsolutions@gmail.com";
    const logoUrl =
      "https://firebasestorage.googleapis.com/v0/b/haven-aa6a7.firebasestorage.app/o/general%2FHIGHEST%20ICON%20COLORED.png?alt=media&token=2eea2fd9-4677-4297-8a4b-e6119ba3c9e8";

    // Admin email content
    const adminSubject = `${orderType} Order Placed: ₦${amount} for ${crypto}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
          <h2>${companyName}</h2>
        </div>
        <p>A new crypto ${orderType.toLowerCase()} order has been placed.</p>
        <ul>
          <li><strong>Amount:</strong> ₦${amount.toLocaleString()}</li>
          <li><strong>Cryptocurrency:</strong> ${crypto}</li>
          ${
            orderType === "Buy"
              ? `<li><strong>Receiving Wallet:</strong> ${
                  walletAddress || "N/A"
                }</li>`
              : `<li><strong>Sending Wallet:</strong> ${
                  sendingWalletAddress || "N/A"
                }</li>`
          }
        </ul>
        <p>Please review the order in the admin panel.</p>
      </div>
    `;

    // User email content
    const userSubject = `Your ${orderType} Order for ${crypto} Has Been Placed`;
    const userHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
          <h2>${companyName}</h2>
        </div>
        <p>Thank you for placing a ${orderType.toLowerCase()} order with us!</p>
        <p><strong>Order Details:</strong></p>
        <ul>
          <li><strong>Amount:</strong> ₦${amount.toLocaleString()}</li>
          <li><strong>Cryptocurrency:</strong> ${crypto}</li>
          ${
            orderType === "Buy"
              ? `<li><strong>Receiving Wallet:</strong> ${
                  walletAddress || "N/A"
                }</li>`
              : `<li><strong>Sending Wallet:</strong> ${
                  sendingWalletAddress || "N/A"
                }</li>`
          }
        </ul>
        <p>We are processing your order. You'll receive an update once it's reviewed.</p>
        <p>Best regards,<br>${companyName} Team</p>
      </div>
    `;

    // Send email to admin
    await resend.emails.send({
      from: `${companyName} <info@highestdata.com.ng>`,
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml,
    });

    // Send email to user
    await resend.emails.send({
      from: `${companyName} <info@highestdata.com.ng>`,
      to: userEmail,
      subject: userSubject,
      html: userHtml,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error sending crypto order notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification", details: error.message },
      { status: 500 }
    );
  }
}
