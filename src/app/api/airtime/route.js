import { NextResponse } from "next/server";
import { buyFromEBills } from "@/app/utils/eBills";
import { ensureWallet } from "@/app/utils/wallet";

export async function POST(req) {
  try {
    const { phone, network, amount } = await req.json();

    // Ensure wallet can handle request
    const check = await ensureWallet(amount);
    if (check.status !== "ok") {
      return NextResponse.json(
        { status: "failed", message: check.message },
        { status: 400 }
      );
    }

    const result = await buyFromEBills("airtime/purchase", {
      phone,
      network,
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
