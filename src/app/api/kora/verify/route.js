import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { reference } = await request.json();

    const response = await fetch(
      `https://api.korapay.com/merchant/api/v1/charges/${reference}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${process.env.KORA_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (data.status === true && data.data.status === "success") {
      return NextResponse.json({
        status: "success",
        amount: parseFloat(data.data.amount),
      });
    }

    return NextResponse.json(
      { status: "failed", message: "Payment not successful" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
