import { ebillsService } from "@/lib/ebillsService";
import { walletService } from "@/lib/walletService";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return Response.json({ error: "User ID required" }, { status: 400 });
    }

    // Get user wallet balance
    const userBalance = await walletService.getUserBalance(userId);

    // Get eBills wallet balance (for admin use)
    let ebillsBalance = null;
    try {
      await ebillsService.getAccessToken();
      const ebillsBalanceResponse = await ebillsService.checkBalance();
      ebillsBalance = ebillsBalanceResponse.data?.balance || 0;
    } catch (error) {
      console.warn("Could not fetch eBills balance:", error.message);
    }

    return Response.json(
      {
        success: true,
        userBalance,
        ebillsBalance,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Balance check error:", error);
    return Response.json(
      {
        error: "Failed to check balance",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
