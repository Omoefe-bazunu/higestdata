import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://vtpass.com/api/service-variations?serviceID=airtime",
      {
        headers: {
          "api-key": process.env.VTPASS_API_KEY,
          "secret-key": process.env.VTPASS_SECRET_KEY,
          "Content-Type": "application/json",
        },
        cache: "no-store", // always fresh
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch Airtime rates from VTPass");
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
