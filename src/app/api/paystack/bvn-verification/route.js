// API Route: /app/api/paystack/bvn-verification/route.js
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { account_number, bvn, bank_code, first_name, last_name } =
      await req.json();

    // Step 1: Create customer
    const createRes = await fetch("https://api.paystack.co/customer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: `${bvn}@temp.com`, // temporary email
        first_name,
        last_name,
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message: createData.message || "Failed to create customer",
        },
        { status: createRes.status }
      );
    }

    const customer_code = createData.data.customer_code;

    // Step 2: Validate customer
    const validateRes = await fetch(
      `https://api.paystack.co/customer/${customer_code}/identification`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          country: "NG",
          type: "bank_account",
          account_number,
          bvn,
          bank_code,
          first_name,
          last_name,
        }),
      }
    );

    const validateData = await validateRes.json();

    if (!validateRes.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            validateData.data?.reason ||
            validateData.message ||
            "Validation failed",
        },
        { status: validateRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification started. Awaiting webhook result.",
      customer_code,
    });
  } catch (error) {
    console.error("KYC Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
