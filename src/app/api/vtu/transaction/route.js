import { NextResponse } from "next/server";
import {
  buyAirtime,
  buyData,
  buyTv,
  getAccessToken,
  getBalance,
} from "@/lib/ebills";

export async function POST(request) {
  const data = await request.json();
  const {
    userId,
    serviceType,
    amount,
    phone,
    network,
    variationId,
    customerId,
    finalPrice,
  } = data;

  console.log("Transaction request received:", {
    userId,
    serviceType,
    amount,
    network,
    finalPrice,
  });

  // Validate input
  if (
    !userId ||
    !serviceType ||
    !amount ||
    !finalPrice ||
    (!phone && serviceType !== "cable") ||
    (!network && serviceType !== "cable") ||
    (!customerId && serviceType === "cable")
  ) {
    console.error("Invalid input:", {
      userId,
      serviceType,
      amount,
      finalPrice,
      phone,
      network,
      customerId,
    });
    const transactionId = `txn_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const transactionData = {
      userId,
      description: `${serviceType || "Unknown"} purchase failed`,
      amount: amount || 0,
      type: "debit",
      status: "failed",
      date: new Date().toISOString(),
      phone: phone || null,
      network: network || null,
      variationId: variationId || null,
      customerId: customerId || null,
      serviceType: serviceType || null,
      requestId: null,
      error: "Missing required fields",
    };
    return NextResponse.json(
      { error: "Missing required fields", transactionId, transactionData },
      { status: 400 }
    );
  }

  // Validate Firebase ID token
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.error("No authorization token provided");
    const transactionId = `txn_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const transactionData = {
      userId,
      description: `${serviceType} purchase failed`,
      amount: amount || 0,
      type: "debit",
      status: "failed",
      date: new Date().toISOString(),
      phone: phone || null,
      network: network || null,
      variationId: variationId || null,
      customerId: customerId || null,
      serviceType,
      requestId: null,
      error: "Unauthorized: No authentication token",
    };
    return NextResponse.json(
      {
        error: "Unauthorized: No authentication token",
        transactionId,
        transactionData,
      },
      { status: 401 }
    );
  }

  const token = authHeader.split("Bearer ")[1];
  try {
    const verifyResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!verifyResponse.ok) {
      console.error("Token verification failed:", await verifyResponse.text());
      const transactionId = `txn_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;
      const transactionData = {
        userId,
        description: `${serviceType} purchase failed`,
        amount: amount || 0,
        type: "debit",
        status: "failed",
        date: new Date().toISOString(),
        phone: phone || null,
        network: network || null,
        variationId: variationId || null,
        customerId: customerId || null,
        serviceType,
        requestId: null,
        error: "Unauthorized: Invalid token",
      };
      return NextResponse.json(
        {
          error: "Unauthorized: Invalid token",
          transactionId,
          transactionData,
        },
        { status: 401 }
      );
    }
    const verifyData = await verifyResponse.json();
    const authenticatedUserId = verifyData.users[0].localId;
    if (authenticatedUserId !== userId) {
      console.error("User ID mismatch:", {
        requestUserId: userId,
        authUserId: authenticatedUserId,
      });
      const transactionId = `txn_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2)}`;
      const transactionData = {
        userId,
        description: `${serviceType} purchase failed`,
        amount: amount || 0,
        type: "debit",
        status: "failed",
        date: new Date().toISOString(),
        phone: phone || null,
        network: network || null,
        variationId: variationId || null,
        customerId: customerId || null,
        serviceType,
        requestId: null,
        error: "Unauthorized: User ID mismatch",
      };
      return NextResponse.json(
        {
          error: "Unauthorized: User ID mismatch",
          transactionId,
          transactionData,
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Token verification error:", error);
    const transactionId = `txn_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const transactionData = {
      userId,
      description: `${serviceType} purchase failed`,
      amount: amount || 0,
      type: "debit",
      status: "failed",
      date: new Date().toISOString(),
      phone: phone || null,
      network: network || null,
      variationId: variationId || null,
      customerId: customerId || null,
      serviceType,
      requestId: null,
      error: "Unauthorized: Token verification failed",
    };
    return NextResponse.json(
      {
        error: "Unauthorized: Token verification failed",
        transactionId,
        transactionData,
      },
      { status: 401 }
    );
  }

  const transactionId = `txn_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
  const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  try {
    // Validate service_id for airtime and data
    if (["airtime", "data"].includes(serviceType)) {
      const validServices = ["mtn", "glo", "airtel", "9mobile"];
      if (!validServices.includes(network.toLowerCase())) {
        console.error("Invalid service_id:", network);
        const transactionData = {
          userId,
          description: `${serviceType} purchase failed`,
          amount,
          type: "debit",
          status: "failed",
          date: new Date().toISOString(),
          phone: phone || null,
          network: network || null,
          variationId: variationId || null,
          customerId: customerId || null,
          serviceType,
          requestId,
          error: "Invalid network provider",
        };
        return NextResponse.json(
          { error: "Invalid network provider", transactionId, transactionData },
          { status: 400 }
        );
      }
    }

    if (serviceType === "cable") {
      const validProviders = ["dstv", "gotv", "startimes"];
      if (!validProviders.includes(network.toLowerCase())) {
        console.error("Invalid provider:", network);
        const transactionData = {
          userId,
          description: `${serviceType} purchase failed`,
          amount,
          type: "debit",
          status: "failed",
          date: new Date().toISOString(),
          phone: phone || null,
          network: network || null,
          variationId: variationId || null,
          customerId: customerId || null,
          serviceType,
          requestId,
          error: "Invalid cable provider",
        };
        return NextResponse.json(
          { error: "Invalid cable provider", transactionId, transactionData },
          { status: 400 }
        );
      }
    }

    // Check eBills wallet balance
    await getAccessToken();
    const eBillsBalance = await getBalance();

    // For airtime: calculate actual amount to send to eBills
    // For data/cable: amount is what goes to eBills
    const ebillsAmount =
      serviceType === "airtime"
        ? Math.round((amount * 100) / finalPrice)
        : amount;

    if (eBillsBalance < ebillsAmount) {
      console.error("Insufficient eBills balance:", {
        balance: eBillsBalance,
        required: ebillsAmount,
      });
      const transactionData = {
        userId,
        description: `${serviceType} purchase failed`,
        amount: finalPrice,
        type: "debit",
        status: "failed",
        date: new Date().toISOString(),
        phone: phone || null,
        network: network || null,
        variationId: variationId || null,
        customerId: customerId || null,
        serviceType,
        requestId,
        error: "Insufficient eBills wallet balance",
      };
      return NextResponse.json(
        {
          error: "Insufficient eBills wallet balance",
          transactionId,
          transactionData,
        },
        { status: 402 }
      );
    }

    let apiResponse;

    if (serviceType === "airtime") {
      console.log("Airtime purchase:", {
        phone,
        serviceId: network,
        amount: ebillsAmount,
        requestId,
      });
      apiResponse = await buyAirtime({
        phone,
        serviceId: network,
        amount: ebillsAmount,
        requestId,
      });
    } else if (serviceType === "data") {
      console.log("Data purchase:", {
        phone,
        serviceId: network,
        variationId,
        requestId,
      });
      apiResponse = await buyData({
        phone,
        serviceId: network,
        variationId,
        requestId,
      });
    } else if (serviceType === "cable") {
      console.log("TV purchase:", {
        customerId,
        provider: network,
        variationId,
        requestId,
      });
      apiResponse = await buyTv({
        customerId,
        provider: network,
        variationId,
        requestId,
      });
    } else {
      console.error("Invalid service type:", serviceType);
      const transactionData = {
        userId,
        description: `${serviceType} purchase failed`,
        amount: finalPrice,
        type: "debit",
        status: "failed",
        date: new Date().toISOString(),
        phone: phone || null,
        network: network || null,
        variationId: variationId || null,
        customerId: customerId || null,
        serviceType,
        requestId,
        error: "Invalid service type",
      };
      return NextResponse.json(
        { error: "Invalid service type", transactionId, transactionData },
        { status: 400 }
      );
    }

    if (!apiResponse.success) {
      console.error("eBills API error:", apiResponse);
      const transactionData = {
        userId,
        description: `${serviceType} purchase failed`,
        amount: finalPrice,
        type: "debit",
        status: "failed",
        date: new Date().toISOString(),
        phone: phone || null,
        network: network || null,
        variationId: variationId || null,
        customerId: customerId || null,
        serviceType,
        requestId,
        error: apiResponse.message || "eBills transaction failed",
      };
      return NextResponse.json(
        {
          error: apiResponse.message || "eBills transaction failed",
          transactionId,
          transactionData,
        },
        { status: 400 }
      );
    }

    // finalPrice is what gets deducted from user wallet
    // amount/ebillsAmount is what was sent to eBills
    const transactionData = {
      userId,
      description: `${serviceType} purchase - ${network || customerId}`,
      amount: finalPrice, // What was deducted from wallet
      type: "debit",
      status:
        apiResponse.data.status === "completed-api" ? "success" : "pending",
      date: new Date().toISOString(),
      phone: phone || null,
      network: network || null,
      variationId: variationId || null,
      customerId: customerId || null,
      serviceType,
      requestId,
      ebillsAmount, // Full amount sent to eBills
      eBillsResponse: apiResponse,
    };

    console.log("Transaction successful:", {
      transactionId,
      serviceType,
      walletDeduction: finalPrice,
      ebillsAmount,
    });

    return NextResponse.json(
      {
        success: true,
        transactionId,
        message: `${serviceType} purchase ${
          apiResponse.data.status === "completed-api"
            ? "completed"
            : "processing"
        }`,
        transactionData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Transaction error:", error);
    const transactionData = {
      userId,
      description: `${serviceType} purchase failed`,
      amount: finalPrice || 0,
      type: "debit",
      status: "failed",
      date: new Date().toISOString(),
      phone: phone || null,
      network: network || null,
      variationId: variationId || null,
      customerId: customerId || null,
      serviceType: serviceType || null,
      requestId: requestId || null,
      error: error.message || "Transaction failed",
    };

    return NextResponse.json(
      {
        error: error.message || "Transaction failed",
        transactionId,
        transactionData,
      },
      { status: error.message.includes("insufficient_funds") ? 402 : 500 }
    );
  }
}
