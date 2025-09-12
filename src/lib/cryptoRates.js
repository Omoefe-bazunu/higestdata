// lib/cryptoRates.js
export async function fetchLiveCryptoRates() {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,usd-coin&vs_currencies=ngn"
    );

    if (!res.ok) {
      throw new Error("Failed to fetch rates from CoinGecko");
    }

    const data = await res.json();

    // Normalize into array with both id + symbol
    return [
      {
        id: "bitcoin",
        symbol: "BTC",
        name: "Bitcoin",
        price: data.bitcoin.ngn,
      },
      {
        id: "ethereum",
        symbol: "ETH",
        name: "Ethereum",
        price: data.ethereum.ngn,
      },
      { id: "tether", symbol: "USDT", name: "Tether", price: data.tether.ngn },
      {
        id: "usd-coin",
        symbol: "USDC",
        name: "USD Coin",
        price: data["usd-coin"].ngn,
      },
    ];
  } catch (err) {
    console.error("Error fetching live rates:", err);
    return [];
  }
}
