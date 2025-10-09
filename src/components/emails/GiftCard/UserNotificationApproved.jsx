import * as React from "react";

export function UserNotificationApproved({ userName, giftCardName, amount }) {
  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h2 style={{ color: "#22c55e" }}>
        Great News! Your Gift Card Order Has Been Approved
      </h2>
      <p>Dear {userName},</p>
      <p>
        Your gift card sell order has been successfully approved and processed.
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
          <strong>Amount Credited:</strong> ₦{Number(amount).toLocaleString()}
        </p>
        <p>
          <strong>Status:</strong> Approved & Credited
        </p>
      </div>

      <p>
        The amount has been credited to your wallet balance. You can log in to
        your account anytime to view your updated wallet balance.
      </p>

      <p>Thank you for choosing our service!</p>
      <p>
        Best regards,
        <br />
        The Team
      </p>
    </div>
  );
}
