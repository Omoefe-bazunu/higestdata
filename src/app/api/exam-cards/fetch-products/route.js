// API ROUTE: /api/exam-cards/fetch-products/route.js
// ============================================================================

import { NextResponse } from "next/server";
import { getAllProducts } from "@/lib/naijaresultpins";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await getAllProducts();

    return NextResponse.json({ success: true, products }, { status: 200 });
  } catch (error) {
    console.error("Error fetching exam products:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
