// // app/api/send-user-notification/route.js
// import { Resend } from "resend";
// import { NextResponse } from "next/server";

// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function POST(request) {
//   try {
//     const {
//       userId,
//       status,
//       type,
//       itemName,
//       amount,
//       reason,
//       cryptoName,
//       userEmail,
//     } = await request.json();

//     if (!userId || !status || !type || !userEmail) {
//       return NextResponse.json(
//         { error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const companyName = "Highest Data Fintech Solutions";
//     const logoUrl =
//       "https://firebasestorage.googleapis.com/v0/b/haven-aa6a7.firebasestorage.app/o/general%2FHIGHEST%20ICON%20COLORED.png?alt=media&token=2eea2fd9-4677-4297-8a4b-e6119ba3c9e8";
//     const orderItem = type === "giftCard" ? itemName : cryptoName || itemName;

//     let subject, userHtml;

//     if (status === "approved") {
//       subject = `${
//         type === "giftCard" ? "Gift Card" : "Crypto"
//       } Order Approved`;
//       userHtml = `
//         <div style="font-family: Arial, sans-serif; color: #333;">
//           <div style="text-align: center; margin-bottom: 20px;">
//             <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
//             <h2>${companyName}</h2>
//           </div>
//           <p>Your ${
//             type === "giftCard" ? "gift card" : "crypto"
//           } order for <strong>${orderItem}</strong> worth <strong>₦${amount}</strong> has been <span style="color:green;font-weight:bold;">APPROVED</span>.</p>
//           <p>We will process your transaction shortly. Thank you for choosing us!</p>
//           <br>
//           <p>Best regards,<br>${companyName} Team</p>
//         </div>
//       `;
//     } else if (status === "rejected") {
//       subject = `${
//         type === "giftCard" ? "Gift Card" : "Crypto"
//       } Order Rejected`;
//       userHtml = `
//         <div style="font-family: Arial, sans-serif; color: #333;">
//           <div style="text-align: center; margin-bottom: 20px;">
//             <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
//             <h2>${companyName}</h2>
//           </div>
//           <p>We regret to inform you that your ${
//             type === "giftCard" ? "gift card" : "crypto"
//           } order for <strong>${orderItem}</strong> worth <strong>₦${amount}</strong> has been <span style="color:red;font-weight:bold;">REJECTED</span>.</p>
//           <p><strong>Reason:</strong> ${reason || "Not specified"}.</p>
//           <p>Please review and try again, or contact support for assistance.</p>
//           <br>
//           <p>Best regards,<br>${companyName} Team</p>
//         </div>
//       `;
//     } else {
//       return NextResponse.json(
//         { error: `Unsupported status: ${status}` },
//         { status: 400 }
//       );
//     }

//     await resend.emails.send({
//       from: `${companyName} <info@highestdata.com.ng>`,
//       to: userEmail,
//       subject,
//       html: userHtml,
//     });

//     return NextResponse.json({ success: true }, { status: 200 });
//   } catch (error) {
//     console.error("Error sending user notification:", error);
//     return NextResponse.json(
//       { error: "Failed to send notification", details: error.message },
//       { status: 500 }
//     );
//   }
// }

import { Resend } from "resend";
import { NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMINEMAIL = process.env.ADMINEMAIL || "info@highestdata.com.ng"; // Where admin alerts go

export async function POST(request) {
  try {
    const {
      userId,
      status, // 'negotiating', 'negotiation_accepted', 'negotiation_rejected', 'approved', 'rejected'
      type,
      itemName,
      amount,
      reason,
      cryptoName,
      userEmail,
      negotiationDetails, // { oldRate, newRate, oldPayout, newPayout }
    } = await request.json();

    if (!userId || !status || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const companyName = "Highest Data Fintech Solutions";
    const logoUrl =
      "https://firebasestorage.googleapis.com/v0/b/haven-aa6a7.firebasestorage.app/o/general%2FHIGHEST%20ICON%20COLORED.png?alt=media&token=2eea2fd9-4677-4297-8a4b-e6119ba3c9e8";
    const orderItem = type === "giftCard" ? itemName : cryptoName || itemName;

    let subject, htmlContent, recipientEmail;

    // Default Recipient is the User
    recipientEmail = userEmail;

    // --- HTML TEMPLATES ---

    if (status === "approved") {
      subject = `${
        type === "giftCard" ? "Gift Card" : "Crypto"
      } Order Approved`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
            <h2>${companyName}</h2>
          </div>
          <p>Your ${
            type === "giftCard" ? "gift card" : "crypto"
          } order for <strong>${orderItem}</strong> worth <strong>₦${amount.toLocaleString()}</strong> has been <span style="color:green;font-weight:bold;">APPROVED</span>.</p>
          <p>We will process your transaction shortly.</p>
          <br><p>Best regards,<br>${companyName} Team</p>
        </div>`;
    } else if (status === "rejected") {
      subject = `${
        type === "giftCard" ? "Gift Card" : "Crypto"
      } Order Rejected`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
            <h2>${companyName}</h2>
          </div>
          <p>Your order for <strong>${orderItem}</strong> has been <span style="color:red;font-weight:bold;">REJECTED</span>.</p>
          <p><strong>Reason:</strong> ${reason || "Not specified"}.</p>
          <p>Please contact support for assistance.</p>
          <br><p>Best regards,<br>${companyName} Team</p>
        </div>`;
    } else if (status === "negotiating") {
      // ADMIN -> USER (Proposing new rate)
      subject = `Action Required: Rate Renegotiation for ${orderItem}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoUrl}" alt="${companyName}" style="max-width: 150px; height: auto;" />
            <h2>${companyName}</h2>
          </div>
          <p>Hello,</p>
          <p>We cannot process your <strong>${orderItem}</strong> transaction at the current rate due to market fluctuations or card status.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Proposed New Rate:</strong> ${
              negotiationDetails?.newRate
            }/$</p>
            <p><strong>New Payout:</strong> ₦${negotiationDetails?.newPayout?.toLocaleString()}</p>
            <p><strong>Reason:</strong> ${reason}</p>
          </div>
          <p>Please log in to your dashboard to <strong>Accept</strong> or <strong>Decline</strong> this offer.</p>
          <br><p>Best regards,<br>${companyName} Team</p>
        </div>`;
    } else if (status === "negotiation_accepted") {
      // USER -> ADMIN (User Accepted)
      recipientEmail = ADMINEMAIL; // Send to Admin
      subject = `[ACTION] User ACCEPTED Renegotiation: ${orderItem}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Renegotiation Accepted</h2>
          <p>User <strong>${userEmail}</strong> has ACCEPTED the new rate for <strong>${orderItem}</strong>.</p>
          <ul>
             <li><strong>New Payout:</strong> ₦${negotiationDetails?.newPayout?.toLocaleString()}</li>
             <li><strong>New Rate:</strong> ${negotiationDetails?.newRate}</li>
          </ul>
          <p>Please proceed to Approve the transaction in the Admin Dashboard.</p>
        </div>`;
    } else if (status === "negotiation_rejected") {
      // USER -> ADMIN (User Declined)
      recipientEmail = ADMINEMAIL; // Send to Admin
      subject = `[ALERT] User DECLINED Renegotiation: ${orderItem}`;
      htmlContent = `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color:red;">Renegotiation Declined</h2>
          <p>User <strong>${userEmail}</strong> has DECLINED the offer for <strong>${orderItem}</strong>.</p>
          <p><strong>User's Reason:</strong> ${reason}</p>
          <p>Please review the transaction in the Admin Dashboard.</p>
        </div>`;
    } else {
      return NextResponse.json(
        { error: `Unsupported status: ${status}` },
        { status: 400 }
      );
    }

    // Send Email
    await resend.emails.send({
      from: `${companyName} <info@highestdata.com.ng>`,
      to: recipientEmail,
      subject,
      html: htmlContent,
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification", details: error.message },
      { status: 500 }
    );
  }
}
