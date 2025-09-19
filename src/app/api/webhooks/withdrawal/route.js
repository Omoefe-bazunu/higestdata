import { flutterwaveService } from "@/lib/flutterwaveService";
import { handleWithdrawalWebhook } from "@/lib/flutterwaveWalletService";

export async function POST(request) {
  try {
    const body = await request.json();
    const rawBody = JSON.stringify(body);

    // Get signature from headers
    const signature =
      request.headers.get("x-signature") || request.headers.get("verif-hash");

    if (!signature) {
      console.error("Missing signature in Flutterwave withdrawal webhook");
      return Response.json({ error: "Missing signature" }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = flutterwaveService.verifyWebhookSignature(
      rawBody,
      signature
    );

    if (!isValid) {
      console.error("Invalid Flutterwave withdrawal webhook signature");
      return Response.json({ error: "Invalid signature" }, { status: 403 });
    }

    console.log("Flutterwave withdrawal webhook received:", body);

    // Handle different webhook events
    if (body.event === "transfer.completed") {
      console.log("Withdrawal transfer completed:", {
        reference: body.data?.reference,
        status: body.data?.status,
        amount: body.data?.amount,
      });

      // TODO: Update records, notify user, etc.
    }

    if (body.event === "transfer.failed") {
      console.error("Withdrawal transfer failed:", {
        reference: body.data?.reference,
        status: body.data?.status,
        amount: body.data?.amount,
      });

      // TODO: Alert admin, retry, update records, etc.
    }

    if (body.type === "transfer.disburse") {
      console.log("Withdrawal disbursement webhook:", body);
      await handleWithdrawalWebhook(body);
    }

    return Response.json(
      {
        message: "Withdrawal webhook processed successfully",
        status: "success",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Flutterwave withdrawal webhook error:", error);
    return Response.json(
      { error: "Webhook processing failed", message: error.message },
      { status: 500 }
    );
  }
}
