import { NextResponse } from "next/server";
import { getAccessToken } from "@/lib/ebills";

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

    const token = await getAccessToken();
    const response = await fetch(
      `https://ebills.africa/wp-json/api/v2/verify-customer?service_id=${provider}&customer_id=${customerId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const responseText = await response.text();
    console.log(
      `Verify customer response: ${response.status} - ${responseText}`
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
    console.error("Customer verification error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to verify customer. Please try again.",
      },
      { status: 500 }
    );
  }
}
