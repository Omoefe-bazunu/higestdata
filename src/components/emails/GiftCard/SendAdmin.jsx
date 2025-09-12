import * as React from "react";

export function SendAdminTemplate({ data }) {
  return (
    <div>
      <h2>New Gift Card Submission Received</h2>
      <p>Details:</p>
      <ul>
        <li>
          <strong>Gift Card:</strong> {data.giftCardName}
        </li>
        <li>
          <strong>Face Value:</strong> ${data.faceValue}
        </li>
        <li>
          <strong>Rate:</strong> {data.rate}%
        </li>
        <li>
          <strong>Payout:</strong> ₦{Number(data.payoutNaira).toLocaleString()}
        </li>
        <li>
          <strong>Card Code:</strong> [Hidden for security]
        </li>
        <li>
          <strong>User ID:</strong> {data.userId}
        </li>
        <li>
          <strong>Status:</strong> Pending
        </li>
        <li>
          <strong>Submission ID:</strong> {data.submissionId}
        </li>
      </ul>
    </div>
  );
}
