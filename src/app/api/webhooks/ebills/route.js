import crypto from "crypto";
import { walletService } from "@/lib/walletService";

export async function POST(request) {
  try {
    const body = await request.json();
    const rawBody = JSON.stringify(body);

    // Get signature from headers
    const signature = request.headers.get("x-signature");

    // Verify eBills webhook signature
    const userPin = process.env.EBILLS_USER_PIN;
    const computedSignature = crypto
      .createHmac("sha256", userPin)
      .update(rawBody)
      .digest("hex");

    const isValid =
      signature &&
      crypto.timingSafeEqual(
        Buffer.from(computedSignature),
        Buffer.from(signature)
      );

    if (!isValid) {
      console.error("Invalid eBills webhook signature");
      return Response.json({ error: "Invalid signature" }, { status: 403 });
    }

    console.log("eBills webhook received:", body);

    // Extract transaction details
    const {
      request_id,
      status, // 'completed-api', 'failed', 'refunded'
      amount,
      phone,
      customer_id,
      service_id,
      variation_id,
    } = body;

    // Update VTU transaction based on status
    if (request_id) {
      // Extract userId from request_id format: req_timestamp_servicetype_userid
      const requestParts = request_id.split("_");
      if (requestParts.length >= 4) {
        const userId = requestParts[requestParts.length - 1];

        // You can implement transaction lookup and update here
        console.log(
          `Updating VTU transaction for user ${userId}, status: ${status}, amount: ${amount}`
        );

        // Example placeholder:
        // await walletService.updateTransaction(userId, { request_id, status, amount });
      }
    }

    return Response.json(
      { message: "eBills webhook processed successfully", status: "success" },
      { status: 200 }
    );
  } catch (error) {
    console.error("eBills webhook error:", error);
    return Response.json(
      { error: "Webhook processing failed", message: error.message },
      { status: 500 }
    );
  }
}
