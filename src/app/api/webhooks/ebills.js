// pages/api/webhooks/ebills.js
// eBills webhook handler for VTU transaction updates

import crypto from "crypto";
import { walletService } from "@/lib/walletService";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get signature from headers
    const signature = req.headers["x-signature"];
    const payload = JSON.stringify(req.body);

    // Verify eBills webhook signature
    const userPin = process.env.EBILLS_USER_PIN;
    const computedSignature = crypto
      .createHmac("sha256", userPin)
      .update(payload)
      .digest("hex");

    if (
      !crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(signature || "")
      )
    ) {
      console.error("Invalid eBills webhook signature");
      return res.status(403).json({ error: "Invalid signature" });
    }

    // Process eBills webhook data
    const webhookData = req.body;
    console.log("eBills webhook received:", webhookData);

    // Extract transaction details
    const {
      request_id,
      status, // 'completed-api', 'failed', 'refunded'
      amount,
      phone,
      customer_id,
      service_id,
      variation_id,
    } = webhookData;

    // Update VTU transaction based on status
    if (request_id) {
      // Extract userId from request_id format: req_timestamp_servicetype_userid
      const requestParts = request_id.split("_");
      if (requestParts.length >= 4) {
        const userId = requestParts[requestParts.length - 1];

        // Find and update the VTU transaction
        // This is a simplified approach - in production, store request_id mapping
        console.log(
          `Updating transaction for user ${userId}, status: ${status}`
        );

        // You can implement transaction lookup and update here
        // based on your specific database structure
      }
    }

    return res.status(200).json({
      message: "eBills webhook processed successfully",
      status: "success",
    });
  } catch (error) {
    console.error("eBills webhook error:", error);
    return res.status(500).json({
      error: "Webhook processing failed",
      message: error.message,
    });
  }
}
