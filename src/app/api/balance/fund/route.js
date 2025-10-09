import { flutterwaveService } from "@/lib/flutterwaveService";
import { ebillsService } from "@/lib/ebillsService";

export async function POST(request) {
  try {
    const { amount, adminKey } = await request.json();

    // Verify admin access (implement your own admin authentication)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!amount || amount <= 0) {
      return Response.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Fund eBills wallet via Flutterwave
    const fundingResult = await flutterwaveService.fundEBillsWallet(
      amount,
      `Manual eBills wallet funding - Admin initiated`
    );

    // Wait and check updated balance asynchronously (fire & forget)
    setTimeout(async () => {
      try {
        await ebillsService.getAccessToken();
        const updatedBalance = await ebillsService.checkBalance();
        console.log("Updated eBills balance:", updatedBalance.data?.balance);
      } catch (error) {
        console.warn("Could not check updated balance:", error);
      }
    }, 5000);

    return Response.json(
      {
        success: true,
        message: "eBills wallet funding initiated",
        transferId: fundingResult.data?.id,
        amount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Funding error:", error);
    return Response.json(
      {
        error: "Failed to fund eBills wallet",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
