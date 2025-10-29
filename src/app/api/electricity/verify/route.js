import { NextResponse } from "next/server";
import { verifyCustomer } from "@/lib/ebills";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const service_id = searchParams.get("service_id");
    const customer_id = searchParams.get("customer_id");
    const variation_id = searchParams.get("variation_id");

    if (!service_id || !customer_id || !variation_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing service_id, customer_id, or variation_id",
        },
        { status: 400 }
      );
    }

    const data = await verifyCustomer(service_id, customer_id, variation_id);

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
    console.error("Electricity customer verification error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify customer. Please try again.",
      },
      { status: 500 }
    );
  }
}
