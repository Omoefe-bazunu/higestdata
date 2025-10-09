// app/api/contact-message-notification/route.js
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = "highestdatafintechsolutions@gmail.com";

export async function POST(request) {
  try {
    const { name, email, phone, message, userId } = await request.json();

    if (!name || !email || !message || !userId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const companyName = "Higher Exchange";
    const logoUrl =
      "https://firebasestorage.googleapis.com/v0/b/entcarepat.appspot.com/o/App%20Icon_GPL.webp?alt=media&token=893f7df9-4613-4477-86a4-9cf3a2880ce8";

    // Admin email content
    const adminSubject = `New Contact Message from ${name}`;
    const adminHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
          <h2>${companyName}</h2>
        </div>
        <p>A new contact message has been received.</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          ${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ""}
          <li><strong>Message:</strong> ${message}</li>
          <li><strong>User ID:</strong> ${userId}</li>
        </ul>
        <p>Please review the message in the admin panel.</p>
      </div>
    `;

    // User email content
    const userSubject = `Your Message to ${companyName} Has Been Received`;
    const userHtml = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
          <h2>${companyName}</h2>
        </div>
        <p>Dear ${name},</p>
        <p>Thank you for reaching out to us! We have received your message and will respond shortly, typically within 24-48 hours.</p>
        <p><strong>Your Message:</strong></p>
        <p>${message}</p>
        <p>Best regards,<br>${companyName} Team</p>
      </div>
    `;

    // Send email to admin
    await resend.emails.send({
      from: `${companyName} <info@higher.com.ng>`,
      to: ADMIN_EMAIL,
      subject: adminSubject,
      html: adminHtml,
    });

    // Send email to user
    await resend.emails.send({
      from: `${companyName} <info@higher.com.ng>`,
      to: email,
      subject: userSubject,
      html: userHtml,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error sending contact notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification", details: error.message },
      { status: 500 }
    );
  }
}
