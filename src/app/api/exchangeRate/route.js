// app/api/exchangeRate/route.js
export async function GET() {
  try {
    const apiKey = "f12aa4d6e9c63ebb44216a82"; // Your provided API key
    const response = await fetch(
      `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
    );

    // Check if the HTTP response is successful
    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      throw new Error("Failed to fetch exchange rate from ExchangeRate-API");
    }

    const data = await response.json();

    // Check if the API call itself was successful according to ExchangeRate-API
    if (data.result !== "success") {
      console.error("ExchangeRate-API response error:", data["error-type"]);
      throw new Error("API call was not successful");
    }

    // Extract the NGN rate
    const rate = data.conversion_rates.NGN;

    if (!rate) {
      // This case should ideally not happen if data.result is "success"
      // but as a safeguard:
      console.error("NGN rate not found in successful API response.");
      throw new Error("NGN rate not found");
    }

    return new Response(JSON.stringify({ rate }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ExchangeRate-API fetch error:", error);
    // Fallback to a rate of 1 if any error occurs, and log the error
    return new Response(JSON.stringify({ rate: 1 }), {
      status: 500, // Indicate an internal server error occurred during the fetch
      headers: { "Content-Type": "application/json" },
    });
  }
}
