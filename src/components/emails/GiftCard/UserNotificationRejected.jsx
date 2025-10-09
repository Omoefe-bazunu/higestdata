import * as React from "react";

export function UserNotificationRejected({
  userName,
  giftCardName,
  amount,
  reason,
}) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h2 style={{ color: "#ef4444" }}>Gift Card Order Update</h2>
      <p>Dear {userName},</p>
      <p>
        We've reviewed your gift card sell order and unfortunately, it could not
        be approved at this time.
      </p>

      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "20px",
          borderRadius: "8px",
          margin: "20px 0",
        }}
      >
        <h3>Order Details:</h3>
        <p>
          <strong>Gift Card:</strong> {giftCardName}
        </p>
        <p>
          <strong>Amount:</strong> ₦{Number(amount).toLocaleString()}
        </p>
        <p>
          <strong>Status:</strong> Not Approved
        </p>
      </div>

      <p>
        <strong>Reason:</strong> {reason || "No specific reason provided."}
      </p>

      <p>
        If you have any questions, please don't hesitate to contact our support
        team.
      </p>
      <p>
        Best regards,
        <br />
        The Team
      </p>
    </div>
  );
}
