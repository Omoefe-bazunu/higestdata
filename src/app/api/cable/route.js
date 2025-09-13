import { NextResponse } from "next/server";
import { buyFromEBills } from "@/app/utils/eBills";
import { ensureWallet } from "@/app/utils/wallet";

export async function POST(req) {
  try {
    const { smartcard, provider, plan, amount } = await req.json();

    const check = await ensureWallet(amount);
    if (check.status !== "ok") {
      return NextResponse.json(
        { status: "failed", message: check.message },
        { status: 400 }
      );
    }

    const result = await buyFromEBills("cabletv/purchase", {
      smartcard,
      provider,
      plan,
      amount,
    });

    return NextResponse.json({ status: "success", data: result });
  } catch (err) {
    return NextResponse.json(
      { status: "error", message: err.message },
      { status: 500 }
    );
  }
}
