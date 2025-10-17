import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/ebills";

export async function POST(request) {
  try {
    const body = await request.json();
    const { service_id, customer_id, variation_id } = body;

    if (!service_id || !customer_id || !variation_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing service_id, customer_id, or variation_id",
        },
        { status: 400 }
      );
    }

    const token = await getAccessToken();
    const response = await fetch(
      "https://ebills.africa/wp-json/api/v2/verify-customer",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id,
          customer_id,
          variation_id,
        }),
      }
    );

    const responseText = await response.text();
    console.log(
      `Verify electricity customer response: ${response.status} - ${responseText}`
    );

    if (!response.ok) {
      const error = JSON.parse(responseText);
      return NextResponse.json(
        {
          success: false,
          message: error.message || "Customer verification failed",
        },
        { status: response.status }
      );
    }

    const data = JSON.parse(responseText);
    if (data.code === "success") {
      return NextResponse.json({
        success: true,
        data: data.data,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: data.message || "Customer verification failed",
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
