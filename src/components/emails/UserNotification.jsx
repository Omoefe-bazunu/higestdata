import { Html, Head, Body, Section, Text, Img } from "@react-email/components";

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

  const primaryColor = isApproved ? "#28a745" : "#dc3545"; // Green for approved, Red for rejected
  const secondaryColor = "#007bff"; // Blue for highlights

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
    // Crypto type
    amountLabel = "Amount (NGN)";
    if (isApproved) {
      subjectText = "Your Crypto Sell Order Has Been Approved!";
      descriptionText = `Excellent news! Your crypto sell order for approximately ${itemName} (worth ₦${amount.toLocaleString()}) has been approved. Your account has been credited.`;
    } else {
      subjectText = "Your Crypto Sell Order Was Not Approved";
      descriptionText = `We regret to inform you that your crypto sell order for approximately ${itemName} (worth ₦${amount.toLocaleString()}) was not approved. Reason: ${reason}. Please contact support if you have questions.`;
    }
  }

  return (
    <Html>
      <Head />
      <Body
        style={{
          fontFamily: '"Arial", sans-serif',
          margin: "0",
          padding: "20px",
          backgroundColor: "#f4f4f9",
          color: "#333",
        }}
      >
        <Section
          style={{
            maxWidth: "600px",
            margin: "auto",
            backgroundColor: "#ffffff",
            padding: "30px",
            borderRadius: "8px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <Img
            src="https://your-domain.com/logo.png" // Replace with your actual logo URL
            width="120"
            height="30"
            alt="Higher Logo"
            style={{ margin: "0 auto 20px", display: "block" }}
          />
          <Text
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: primaryColor,
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            {subjectText}
          </Text>

          <Text
            style={{
              fontSize: "16px",
              lineHeight: "1.6",
              marginBottom: "20px",
            }}
          >
            Hello {userName},
          </Text>

          <Text
            style={{
              fontSize: "16px",
              lineHeight: "1.6",
              marginBottom: "20px",
            }}
          >
            {descriptionText}
          </Text>

          {(status === "approved" || status === "rejected") && (
            <Section
              style={{
                border: `1px solid ${secondaryColor}`,
                borderRadius: "5px",
                padding: "15px",
                marginBottom: "20px",
                backgroundColor: "#e7f3ff",
              }}
            >
              <Text
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: secondaryColor,
                  marginBottom: "15px",
                }}
              >
                Order Summary:
              </Text>
              <Text style={{ fontSize: "16px", marginBottom: "10px" }}>
                <strong>Item:</strong> {itemName}
              </Text>
              <Text style={{ fontSize: "16px", marginBottom: "10px" }}>
                <strong>{amountLabel}:</strong> ₦{amount.toLocaleString()}
              </Text>
              {status === "rejected" && (
                <Text style={{ fontSize: "16px", marginBottom: "10px" }}>
                  <strong>Reason for Rejection:</strong> {reason}
                </Text>
              )}
            </Section>
          )}

          <Text
            style={{
              fontSize: "14px",
              color: "#666",
              textAlign: "center",
              marginTop: "30px",
            }}
          >
            Thank you for using our service!
          </Text>
          <Text
            style={{ fontSize: "14px", color: "#666", textAlign: "center" }}
          >
            The Higher Team
          </Text>
        </Section>
      </Body>
    </Html>
  );
}
