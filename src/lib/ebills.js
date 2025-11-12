// lib/ebills.js
const BACKEND_URL = "https://higestdata-proxy.onrender.com";

export async function getDataRates() {
  const res = await fetch(`${BACKEND_URL}/api/vtu/fetch-rates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "data" }),
  });
  const data = await res.json();
  return data.rates || {};
}

export async function getTvRates(provider) {
  const res = await fetch(`${BACKEND_URL}/api/vtu/fetch-rates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "tv", provider }),
  });
  const data = await res.json();
  return data.rates?.[provider.toLowerCase()] || {};
}

export async function verifyTv(provider, customerId) {
  const res = await fetch(
    `${BACKEND_URL}/api/tv/verify?provider=${provider}&customerId=${customerId}`
  );
  return res.json();
}

export async function verifyElectricity(service_id, customer_id, variation_id) {
  const res = await fetch(
    `${BACKEND_URL}/api/electricity/verify?service_id=${service_id}&customer_id=${customer_id}&variation_id=${variation_id}`
  );
  return res.json();
}

export async function verifyBetting(provider, customerId) {
  const res = await fetch(
    `${BACKEND_URL}/api/betting/verify?provider=${provider}&customerId=${customerId}`
  );
  return res.json();
}

// No more direct eBills calls
