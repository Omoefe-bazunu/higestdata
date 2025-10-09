import * as React from "react";

export function SendAdminTemplate({ data }) {
  return (
    <div>
      <h1>New Gift Card Submission</h1>
      <p>Submission ID: {data.submissionId}</p>
      <p>Gift Card: {data.giftCardName}</p>
      <p>Face Value: ${data.faceValue}</p>
      <p>Rate: {data.rate}%</p>
      <p>Payout: ₦{data.payoutNaira.toLocaleString()}</p>
      <p>User ID: {data.userId}</p>
      <p>
        Image URL: <a href={data.imageUrl}>View Image</a>
      </p>
    </div>
  );
}
