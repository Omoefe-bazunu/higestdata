import { NextResponse } from "next/server";
import {
  getAccessToken,
  getDataVariations,
  getTvVariations,
} from "@/lib/ebills";

export async function POST(request) {
  try {
    const { type, provider } = await request.json();

    if (!type || !["data", "tv"].includes(type)) {
      console.error(`Invalid type: ${type}`);
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`Processing ${type} request`);

    // Fetch token
    await getAccessToken();

    let apiResponse;
    if (type === "data") {
      // Fetch all data variations (no provider filter)
      apiResponse = await getDataVariations();
    } else if (type === "tv") {
      // Fetch TV variations for specific provider
      if (!provider) {
        console.error("Provider required for TV rates");
        return NextResponse.json(
          { error: "Provider required for TV rates" },
          { status: 400 }
        );
      }
      apiResponse = await getTvVariations(provider.toLowerCase());
    }

    // Validate API response
    if (
      !apiResponse ||
      apiResponse.code !== "success" ||
      !Array.isArray(apiResponse.data)
    ) {
      console.error(
        "Invalid eBills response:",
        JSON.stringify(apiResponse, null, 2)
      );
      return NextResponse.json(
        { error: "Invalid or empty response from provider" },
        { status: 500 }
      );
    }

    // Transform eBills response
    const rates = {};
    const validProviders = ["mtn", "airtel", "glo", "9mobile", "smile"];

    if (type === "data") {
      // Group data plans by provider, excluding SME plans
      validProviders.forEach((prov) => {
        rates[prov] = {};
      });
      apiResponse.data.forEach((plan) => {
        if (
          validProviders.includes(plan.service_id.toLowerCase()) &&
          plan.availability === "Available" &&
          !plan.data_plan.toLowerCase().includes("(sme)")
        ) {
          rates[plan.service_id.toLowerCase()][plan.variation_id] = {
            price: parseFloat(plan.price) || 0,
            name: plan.data_plan || plan.name || `Plan ${plan.variation_id}`,
          };
        }
      });
    } else if (type === "tv") {
      // Process TV plans for the specific provider
      rates[provider.toLowerCase()] = {};
      apiResponse.data.forEach((plan) => {
        if (
          plan.service_id.toLowerCase() === provider.toLowerCase() &&
          plan.availability === "Available"
        ) {
          rates[provider.toLowerCase()][plan.variation_id] = {
            price: parseFloat(plan.price) || 0,
            name: plan.data_plan || plan.name || `Plan ${plan.variation_id}`,
          };
        }
      });
    }

    if (
      Object.keys(rates).length === 0 ||
      Object.values(rates).every((plans) => Object.keys(plans).length === 0)
    ) {
      console.warn(`No available plans found for ${type}`);
      return NextResponse.json({ success: true, rates }, { status: 200 });
    }

    console.log("Transformed rates:", JSON.stringify(rates, null, 2));
    return NextResponse.json({ success: true, rates }, { status: 200 });
  } catch (error) {
    console.error("Fetch rates error:", error.message, error.stack);
    return NextResponse.json(
      { error: error.message || "Failed to fetch rates" },
      { status: 500 }
    );
  }
}
