export async function POST(request) {
  const { type, provider } = await request.json();

  if (!type || !["data", "tv"].includes(type) || !provider) {
    return NextResponse.json(
      { error: "Invalid type or provider" },
      { status: 400 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await getAccessToken();
    let apiResponse;

    if (type === "data") {
      apiResponse = await getDataVariations(provider);
    } else if (type === "tv") {
      apiResponse = await getTvVariations(provider);
    }

    console.log("eBills Response:", JSON.stringify(apiResponse, null, 2));

    // Transform eBills array response to consistent format
    const rates = {
      [provider]: {},
    };

    // Handle eBills response as an array
    const providerPlans = Array.isArray(apiResponse.data)
      ? apiResponse.data.filter((item) => item.service_id === provider)
      : [];

    providerPlans.forEach((plan) => {
      rates[provider][plan.variation_id] = {
        price: parseFloat(plan.price) || 0,
        name: plan.data_plan || plan.name || `Plan ${plan.variation_id}`,
      };
    });

    console.log("Transformed rates:", rates);
    return NextResponse.json({ success: true, rates }, { status: 200 });
  } catch (error) {
    console.error("Fetch rates error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch rates" },
      { status: 500 }
    );
  }
}
