// app/api/email-verification/send/route.js
import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, firstName, verificationCode } = await request.json();

    if (!email || !firstName || !verificationCode) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const companyName = "Highest Data Fintech Solutions";
    const logoUrl = "";

    // HTML content for verification email
    const verificationHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        ${
          logoUrl
            ? `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
        </div>
        `
            : ""
        }
        
        <div style="background: linear-gradient(to right, #4F46E5, #7C3AED); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Welcome to ${companyName}!</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi ${firstName},</p>
          
          <p style="font-size: 16px; margin-bottom: 20px;">
            Thank you for creating an account with ${companyName}. To complete your registration, please use the verification code below:
          </p>
          
          <div style="background: #F3F4F6; border: 2px dashed #4F46E5; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
            <div style="font-size: 32px; font-weight: bold; color: #4F46E5; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${verificationCode}
            </div>
          </div>
          
          <p style="font-size: 14px; color: #6B7280; margin-top: 30px;">
            This code will expire in 24 hours. If you didn't create an account with ${companyName}, please ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin: 0;">
            © ${new Date().getFullYear()} ${companyName}. All rights reserved.
          </p>
        </div>
      </div>
    `;

    // Send verification email to user
    const { data, error } = await resend.emails.send({
      from: `${companyName} <info@highestdata.com.ng>`, // Change to your verified domain: tolu@mountescrow.com
      to: email,
      subject: `Verify your ${companyName} account`,
      html: verificationHtml,
    });

    if (error) {
      console.error("Error sending verification email:", error);
      return NextResponse.json(
        { error: "Failed to send email", details: error.message },
        { status: 500 }
      );
    }

    console.log("✅ Verification email sent successfully to:", email);
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error) {
    console.error("Error in send email route:", error);
    return NextResponse.json(
      { error: "Failed to send email", details: error.message },
      { status: 500 }
    );
  }
}
