// lib/flutterwaveService.js
// Flutterwave payout service for funding eBills wallet

class FlutterwaveService {
  constructor() {
    this.baseUrl = "https://api.flutterwave.cloud/developersandbox";
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY;

    // eBills wallet details (from the document)
    this.ebillsWalletDetails = {
      bank_code: "50515", // Moniepoint Microfinance Bank code
      account_number: "6321078998",
      account_name: "FraNKAPPWeb-BAZ",
    };
  }

  // Generate headers for Flutterwave API
  getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
      "X-Trace-Id": this.generateTraceId(),
      "X-Idempotency-Key": this.generateIdempotencyKey(),
    };
  }

  // Generate unique trace ID
  generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique idempotency key
  generateIdempotencyKey() {
    return `idem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate unique reference
  generateReference() {
    return `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Fund eBills wallet via bank transfer
  async fundEBillsWallet(
    amount,
    narration = "Fund eBills wallet for VTU services"
  ) {
    try {
      const payload = {
        action: "instant", // Process immediately
        type: "bank",
        callback_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/flutterwave`,
        narration: narration,
        reference: this.generateReference(),
        payment_instruction: {
          amount: {
            value: amount,
            applies_to: "destination_currency",
          },
          source_currency: "NGN",
          destination_currency: "NGN",
          recipient: {
            bank: {
              account_number: this.ebillsWalletDetails.account_number,
              code: this.ebillsWalletDetails.bank_code,
              name: "Moniepoint Microfinance Bank",
            },
            name: {
              first: "FraNKAPPWeb",
              last: "BAZ",
            },
            email:
              process.env.EBILLS_NOTIFICATION_EMAIL || "admin@yoursite.com",
            phone: {
              country_code: "234",
              number: process.env.EBILLS_NOTIFICATION_PHONE || "8012345678",
            },
          },
        },
      };

      const response = await fetch(`${this.baseUrl}/direct-transfers`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Transfer failed: ${errorData.message || response.status}`
        );
      }

      const result = await response.json();
      console.log("Flutterwave transfer initiated:", result);
      return result;
    } catch (error) {
      console.error("Flutterwave funding error:", error);
      throw error;
    }
  }

  // Check transfer status
  async checkTransferStatus(transferId) {
    try {
      const response = await fetch(`${this.baseUrl}/transfers/${transferId}`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Transfer status check error:", error);
      throw error;
    }
  }

  // Verify webhook signature (for webhook endpoint)
  verifyWebhookSignature(payload, signature) {
    const crypto = require("crypto");
    const hash = crypto
      .createHmac("sha256", this.secretKey)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  }
}

// Export singleton instance
export const flutterwaveService = new FlutterwaveService();
