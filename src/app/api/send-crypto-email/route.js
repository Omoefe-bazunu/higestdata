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

    const companyName = "Higher Exchange";
    const adminEmail = "highestdatafintechsolutions@gmail.com";
    const logoUrl =
      "https://firebasestorage.googleapis.com/v0/b/entcarepat.appspot.com/o/App%20Icon_GPL.webp?alt=media&token=893f7df9-4613-4477-86a4-9cf3a2880ce8";

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
      from: `${companyName} <info@higher.com.ng>`,
      to: adminEmail,
      subject: adminSubject,
      html: adminHtml,
    });

    // Send email to user
    await resend.emails.send({
      from: `${companyName} <info@higher.com.ng>`,
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
