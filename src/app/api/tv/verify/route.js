import { NextResponse } from "next/server";
import { verifyCustomer } from "@/lib/ebills";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");
    const customerId = searchParams.get("customerId");

    if (!provider || !customerId) {
      return NextResponse.json(
        { success: false, message: "Missing provider or customerId" },
        { status: 400 }
      );
    }

    const data = await verifyCustomer(provider, customerId);

    if (data) {
      return NextResponse.json({
        success: true,
        data: data,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: "Customer verification failed",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("TV customer verification error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify customer. Please try again.",
      },
      { status: 500 }
    );
  }
}
