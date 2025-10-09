// app/api/webhooks/funding/route.js

import { handleFundingWebhook } from "@/lib/flutterwaveWalletService";

export async function POST(request) {
  try {
    const webhookData = await request.json();

    // Verify webhook is from Flutterwave (optional but recommended)
    const secretHash = process.env.FLUTTERWAVE_SECRET_HASH;
    const signature = request.headers.get("verif-hash");

    if (secretHash && signature !== secretHash) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only handle charge.completed events for wallet funding
    if (webhookData.type === "charge.completed") {
      await handleFundingWebhook(webhookData);
    }

    return Response.json({ message: "Webhook processed successfully" });
  } catch (error) {
    console.error("Funding webhook error:", error);
    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
