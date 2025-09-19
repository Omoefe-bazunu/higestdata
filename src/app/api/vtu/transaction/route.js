// app/api/vtu/transaction/route.js
import { NextResponse } from "next/server";
import { ebillsService } from "@/lib/ebillsService";
import { flutterwaveService } from "@/lib/flutterwaveService";
import { walletService } from "@/lib/walletService";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";

export async function POST(req) {
  const body = await req.json();

  const {
    userId,
    serviceType, // 'airtime', 'data', 'tv'
    phone,
    amount,
    network, // 'mtn', 'glo', 'airtel', '9mobile'
    variationId, // For data/tv plans
    customerId, // For TV subscriptions
  } = body;

  if (!userId || !serviceType) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  let vtuTransactionId = null;
  let walletDebited = false;

  try {
    // Step 1: Get user rates
    const userRates = await getUserRates(serviceType, network, variationId);
    const finalAmount = userRates.price;

    // Step 2: Check wallet balance
    const hasSufficientBalance = await walletService.hasSufficientBalance(
      userId,
      finalAmount
    );
    if (!hasSufficientBalance) {
      return NextResponse.json(
        {
          error: "Insufficient wallet balance",
          requiredAmount: finalAmount,
          message: "Please fund your wallet and try again",
        },
        { status: 400 }
      );
    }

    // Step 3: Init eBills auth
    await ebillsService.getAccessToken();

    // Step 4: Check eBills balance
    const ebillsBalance = await ebillsService.checkBalance();
    const ebillsAvailableBalance = ebillsBalance.data?.balance || 0;

    if (ebillsAvailableBalance < finalAmount) {
      console.log("eBills balance insufficient, funding wallet...");

      const fundingAmount = Math.max(finalAmount * 1.2, 10000);
      const flutterwaveResponse = await flutterwaveService.fundEBillsWallet(
        fundingAmount,
        `Fund eBills wallet for ${serviceType} transaction`
      );

      console.log(
        "Flutterwave funding initiated:",
        flutterwaveResponse.data?.id
      );

      // wait 3s before continuing
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Step 5: Debit wallet
    const walletResult = await walletService.debitWallet(
      userId,
      finalAmount,
      `${serviceType.toUpperCase()} purchase - ${network || "N/A"}`,
      serviceType
    );
    walletDebited = true;

    // Step 6: Create VTU transaction
    const vtuTransactionData = {
      serviceType,
      amount: finalAmount,
      phone,
      network,
      variationId,
      customerId,
      status: "processing",
      walletTransactionId: walletResult.transactionId,
    };

    const vtuResult = await walletService.createVTUTransaction(
      userId,
      vtuTransactionData
    );
    vtuTransactionId = vtuResult.transactionId;

    // Step 7: Generate request ID
    const requestId = `req_${Date.now()}_${serviceType}_${userId.substr(-6)}`;

    // Step 8: Call eBills API
    let ebillsResponse;
    switch (serviceType) {
      case "airtime":
        ebillsResponse = await ebillsService.purchaseAirtime(
          phone,
          network,
          finalAmount,
          requestId
        );
        break;
      case "data":
        ebillsResponse = await ebillsService.purchaseData(
          phone,
          network,
          variationId,
          requestId
        );
        break;
      case "tv":
        ebillsResponse = await ebillsService.purchaseTvSubscription(
          customerId,
          network,
          variationId,
          requestId
        );
        break;
      default:
        throw new Error("Invalid service type");
    }

    // Step 9: Update status
    const isSuccess =
      ebillsResponse.status === "success" ||
      ebillsResponse.data?.status === "success";

    await walletService.updateVTUTransactionStatus(
      userId,
      vtuTransactionId,
      isSuccess ? "completed" : "failed",
      ebillsResponse
    );

    // Step 10: Refund if failed
    if (!isSuccess) {
      await walletService.refundWallet(
        userId,
        finalAmount,
        `${serviceType.toUpperCase()} transaction failed`,
        walletResult.transactionId
      );
    }

    return NextResponse.json({
      success: isSuccess,
      message: isSuccess
        ? "Transaction completed successfully"
        : "Transaction failed",
      transactionId: vtuTransactionId,
      ebillsResponse,
      walletBalance: isSuccess
        ? walletResult.newBalance
        : walletResult.newBalance + finalAmount,
    });
  } catch (error) {
    console.error("VTU transaction error:", error);

    if (walletDebited && vtuTransactionId) {
      try {
        const finalAmount = await getUserRates(
          serviceType,
          network,
          variationId
        );
        await walletService.refundWallet(
          userId,
          finalAmount.price,
          `${serviceType.toUpperCase()} transaction failed - System error`,
          null
        );

        await walletService.updateVTUTransactionStatus(
          userId,
          vtuTransactionId,
          "failed",
          {
            error: error.message,
          }
        );
      } catch (refundError) {
        console.error("Refund error:", refundError);
      }
    }

    return NextResponse.json(
      {
        error: error.message,
        success: false,
        message: "Transaction failed due to system error",
      },
      { status: 500 }
    );
  }
}

// Helper
async function getUserRates(serviceType, network, variationId) {
  try {
    let ratesDoc;

    if (serviceType === "airtime") {
      ratesDoc = await getDoc(doc(firestore, "settings", "airtimeRates"));
      const rates = ratesDoc.data()?.rates || {};
      const networkRate = rates[network];

      return {
        price: networkRate?.price || 100,
        profit: networkRate?.profit || 0,
      };
    } else if (serviceType === "data") {
      ratesDoc = await getDoc(doc(firestore, "settings", "dataRates"));
      const rates = ratesDoc.data()?.rates || {};
      const planRate = rates[network]?.[variationId];

      return { price: planRate?.price || 1000, profit: planRate?.profit || 0 };
    } else if (serviceType === "tv") {
      ratesDoc = await getDoc(doc(firestore, "settings", "tvRates"));
      const rates = ratesDoc.data()?.rates || {};
      const tvRate = rates[network]?.[variationId];

      return { price: tvRate?.price || 5000, profit: tvRate?.profit || 0 };
    }

    throw new Error("Invalid service type for rate lookup");
  } catch (error) {
    console.error("Error getting user rates:", error);
    return {
      price:
        serviceType === "airtime" ? 100 : serviceType === "data" ? 1000 : 5000,
      profit: 0,
    };
  }
}
