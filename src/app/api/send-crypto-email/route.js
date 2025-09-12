import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    const { orderType, amount, crypto, walletAddress, sendingWalletAddress } =
      await req.json();

    const adminEmail = process.env.NEXT_PUBLIC_ADMINEMAIL;
    const adminEmails = adminEmail.split(",").map((email) => email.trim());

    const subject = `${orderType} Order Placed: ${amount} NGN for ${crypto}`;
    const textContent =
      orderType === "Buy"
        ? `A new crypto buy order has been placed.
         - Amount: ${amount} NGN
         - Cryptocurrency: ${crypto}
         - Receiving Wallet: ${walletAddress}`
        : `A new crypto sell order has been placed.
         - Amount: ${amount} NGN
         - Cryptocurrency: ${crypto}
         - Sending Wallet: ${sendingWalletAddress}`;

    const { data, error } = await resend.emails.send({
      from: "Crypto Trade App <onboarding@resend.dev>",
      to: adminEmails,
      subject: subject,
      html: `<p>${textContent.replace(/\n/g, "<br>")}</p>`,
    });

    if (error) {
      return NextResponse.json({ error }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
