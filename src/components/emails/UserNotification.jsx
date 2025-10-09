// components/emails/UserNotification.js

export default function UserNotification({
  userName,
  type, // 'giftCard' or 'crypto'
  itemName,
  amount,
  status, // 'approved' or 'rejected'
  reason,
}) {
  const isApproved = status === "approved";
  const isGiftCard = type === "giftCard";

  const primaryColor = isApproved ? "#28a745" : "#dc3545"; // Green or Red
  const secondaryColor = "#007bff"; // Blue

  let subjectText, descriptionText, amountLabel;

  if (isGiftCard) {
    amountLabel = "NGN Amount";
    if (isApproved) {
      subjectText = "Your Gift Card Sell Request Has Been Approved!";
      descriptionText = `Great news! Your request to sell the ${itemName} gift card has been approved. Your account has been credited with ₦${amount.toLocaleString()}.`;
    } else {
      subjectText = "Your Gift Card Sell Request Was Not Approved";
      descriptionText = `We regret to inform you that your request to sell the ${itemName} gift card was not approved. Reason: ${reason}. Please contact support if you have questions.`;
    }
  } else {
    amountLabel = "Amount (NGN)";
    if (isApproved) {
      subjectText = "Your Crypto Sell Order Has Been Approved!";
      descriptionText = `Excellent news! Your crypto sell order for approximately ${itemName} (worth ₦${amount.toLocaleString()}) has been approved. Your account has been credited.`;
    } else {
      subjectText = "Your Crypto Sell Order Was Not Approved";
      descriptionText = `We regret to inform you that your crypto sell order for approximately ${itemName} (worth ₦${amount.toLocaleString()}) was not approved. Reason: ${reason}. Please contact support if you have questions.`;
    }
  }

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>${subjectText}</title>
    </head>
    <body style="font-family: Arial, sans-serif; margin:0; padding:20px; background-color:#f4f4f9; color:#333;">
      <div style="max-width:600px; margin:auto; background-color:#ffffff; padding:30px; border-radius:8px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">
        
        <img src="https://your-domain.com/logo.png" alt="Higher Logo" width="120" height="30" style="margin:0 auto 20px; display:block;" />

        <h1 style="font-size:24px; font-weight:bold; color:${primaryColor}; text-align:center; margin-bottom:20px;">
          ${subjectText}
        </h1>

        <p style="font-size:16px; line-height:1.6; margin-bottom:20px;">
          Hello ${userName},
        </p>

        <p style="font-size:16px; line-height:1.6; margin-bottom:20px;">
          ${descriptionText}
        </p>

        ${
          status === "approved" || status === "rejected"
            ? `
          <div style="border:1px solid ${secondaryColor}; border-radius:5px; padding:15px; margin-bottom:20px; background-color:#e7f3ff;">
            <h2 style="font-size:18px; font-weight:bold; color:${secondaryColor}; margin-bottom:15px;">Order Summary:</h2>
            <p style="font-size:16px; margin-bottom:10px;"><strong>Item:</strong> ${itemName}</p>
            <p style="font-size:16px; margin-bottom:10px;"><strong>${amountLabel}:</strong> ₦${amount.toLocaleString()}</p>
            ${
              status === "rejected"
                ? `<p style="font-size:16px; margin-bottom:10px;"><strong>Reason for Rejection:</strong> ${reason}</p>`
                : ""
            }
          </div>
        `
            : ""
        }

        <p style="font-size:14px; color:#666; text-align:center; margin-top:30px;">
          Thank you for using our service!
        </p>
        <p style="font-size:14px; color:#666; text-align:center;">
          The Higher Team
        </p>
      </div>
    </body>
  </html>
  `;
}
