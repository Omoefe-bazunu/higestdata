// LIB: NaijaResultPins Client - lib/naijaresultpins.js
// ============================================================================

const API_URL = "https://www.naijaresultpins.com/api/v1";
const API_TOKEN = process.env.NAIJARESULTPINS_TOKEN;

function getHeaders() {
  return {
    Authorization: `Bearer ${API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function getAllProducts() {
  try {
    const response = await fetch(API_URL, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
}

export async function getAccountInfo() {
  try {
    const response = await fetch(`${API_URL}/account`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching account info:", error);
    throw error;
  }
}

export async function purchaseExamCard(cardTypeId, quantity, requestId) {
  try {
    const payload = {
      card_type_id: cardTypeId,
      quantity: quantity.toString(),
    };

    const response = await fetch(`${API_URL}/exam-card/buy`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      throw new Error(data.message || `HTTP error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error("Error purchasing exam card:", error);
    throw error;
  }
}
