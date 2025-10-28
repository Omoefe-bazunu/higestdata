// const AUTH_URL = "https://ebills.africa/wp-json/jwt-auth/v1/token";
// const API_URL = "https://ebills.africa/wp-json/api/v2/";

// const USERNAME = process.env.EBILLS_USERNAME;
// const PASSWORD = process.env.EBILLS_PASSWORD;

// let token = null;

// export async function getAccessToken() {
//   const payload = { username: USERNAME, password: PASSWORD };
//   console.log("Fetching eBills token...");
//   const response = await fetch(AUTH_URL, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload),
//   });
//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error(`eBills auth error: ${response.status} - ${errorText}`);
//     if (response.status === 400) throw new Error("Invalid request");
//     if (response.status === 401) throw new Error("Invalid credentials");
//     if (response.status === 403) throw new Error("IP not whitelisted");
//     throw new Error(`HTTP error: ${response.status}`);
//   }
//   const data = await response.json();
//   if (data.token) {
//     token = data.token;
//     console.log("eBills token fetched successfully");
//     return token;
//   }
//   throw new Error(data.message || "Authentication failed");
// }

// function getHeaders() {
//   if (!token)
//     throw new Error("Token not initialized. Call getAccessToken first.");
//   return {
//     Authorization: `Bearer ${token}`,
//     "Content-Type": "application/json",
//   };
// }

// export async function getBalance() {
//   console.log("Fetching eBills wallet balance...");
//   const response = await fetch(`${API_URL}balance`, {
//     method: "GET",
//     headers: getHeaders(),
//   });
//   const responseText = await response.text();
//   console.log(`Balance response: ${response.status} - ${responseText}`);
//   if (!response.ok) {
//     const error = JSON.parse(responseText);
//     throw new Error(
//       `Error fetching balance: ${response.status} - ${
//         error.message || responseText
//       }`
//     );
//   }
//   const data = JSON.parse(responseText);
//   return data.data?.balance || 0;
// }

// export async function getDataVariations(serviceId = null) {
//   let url = `${API_URL}variations/data`;
//   if (serviceId) url += `?service_id=${serviceId}`;
//   console.log(`Fetching data variations: ${url}`);
//   const response = await fetch(url, {
//     method: "GET",
//     headers: getHeaders(),
//   });
//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error(`Data variations error: ${response.status} - ${errorText}`);
//     throw new Error(`Error getting data variations: ${response.status}`);
//   }
//   return response.json();
// }

// export async function getTvVariations(serviceId = null) {
//   let url = `${API_URL}variations/tv`;
//   if (serviceId) url += `?service_id=${serviceId}`;
//   console.log(`Fetching TV variations: ${url}`);
//   const response = await fetch(url, {
//     method: "GET",
//     headers: getHeaders(),
//   });
//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error(`TV variations error: ${response.status} - ${errorText}`);
//     throw new Error(`Error getting TV variations: ${response.status}`);
//   }
//   return response.json();
// }

// export async function buyAirtime({ phone, serviceId, amount, requestId }) {
//   const validServices = ["mtn", "glo", "airtel", "9mobile"];
//   if (!validServices.includes(serviceId.toLowerCase())) {
//     console.error(`Invalid service_id: ${serviceId}`);
//     throw new Error("Invalid network provider");
//   }
//   const payload = {
//     phone,
//     service_id: serviceId.toLowerCase(),
//     amount: Number(amount),
//     request_id: requestId,
//   };
//   console.log("Airtime request:", payload);
//   const response = await fetch(`${API_URL}airtime`, {
//     method: "POST",
//     headers: getHeaders(),
//     body: JSON.stringify(payload),
//   });
//   const responseText = await response.text();
//   console.log(`Airtime response: ${response.status} - ${responseText}`);
//   if (!response.ok) {
//     const error = JSON.parse(responseText);
//     if (response.status === 400 && error.code === "missing_fields")
//       throw new Error("Missing required fields");
//     if (response.status === 400 && error.code === "invalid_service")
//       throw new Error("Invalid service ID or phone number");
//     if (response.status === 400 && error.code === "below_minimum_amount")
//       throw new Error("Amount below minimum");
//     if (response.status === 400 && error.code === "above_maximum_amount")
//       throw new Error("Amount above maximum");
//     if (response.status === 402 && error.code === "insufficient_funds")
//       throw new Error("Insufficient eBills wallet balance");
//     if (response.status === 409 && error.code === "duplicate_request_id")
//       throw new Error("Duplicate request ID");
//     if (response.status === 409 && error.code === "duplicate_order")
//       throw new Error("Duplicate order within 3 minutes");
//     if (response.status === 403 && error.code === "rest_forbidden")
//       throw new Error("Unauthorized access");
//     throw new Error(
//       `Error vending airtime: ${response.status} - ${responseText}`
//     );
//   }
//   const data = JSON.parse(responseText);
//   return { success: data.code === "success", ...data };
// }

// export async function buyData({ phone, serviceId, variationId, requestId }) {
//   const payload = {
//     phone,
//     service_id: serviceId.toLowerCase(),
//     variation_id: variationId,
//     request_id: requestId,
//   };
//   console.log("Data request:", payload);
//   const response = await fetch(`${API_URL}data`, {
//     method: "POST",
//     headers: getHeaders(),
//     body: JSON.stringify(payload),
//   });
//   const responseText = await response.text();
//   console.log(`Data response: ${response.status} - ${responseText}`);
//   if (!response.ok) {
//     const error = JSON.parse(responseText);
//     throw new Error(
//       `Error vending data: ${response.status} - ${
//         error.message || responseText
//       }`
//     );
//   }
//   const data = JSON.parse(responseText);
//   return { success: data.code === "success", ...data };
// }

// export async function buyTv({ customerId, provider, variationId, requestId }) {
//   const payload = {
//     customer_id: customerId,
//     service_id: provider.toLowerCase(),
//     variation_id: variationId,
//     request_id: requestId,
//   };
//   console.log("TV request:", payload);
//   const response = await fetch(`${API_URL}tv`, {
//     method: "POST",
//     headers: getHeaders(),
//     body: JSON.stringify(payload),
//   });
//   const responseText = await response.text();
//   console.log(`TV response: ${response.status} - ${responseText}`);
//   if (!response.ok) {
//     const error = JSON.parse(responseText);
//     throw new Error(
//       `Error vending TV: ${response.status} - ${error.message || responseText}`
//     );
//   }
//   const data = JSON.parse(responseText);
//   return { success: data.code === "success", ...data };
// }

const PROXY_URL = process.env.PROXY_URL;

export async function getAccessToken() {
  const response = await fetch(`${PROXY_URL}/auth`, {
    method: "POST",
  });
  if (!response.ok) throw new Error("Auth failed");
  const data = await response.json();
  return data.token;
}

export async function getBalance() {
  const response = await fetch(`${PROXY_URL}/balance`);
  const data = await response.json();
  return data.data?.balance || 0;
}

export async function getDataVariations(serviceId = null) {
  let url = `${PROXY_URL}/variations/data`;
  if (serviceId) url += `?service_id=${serviceId}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error getting data variations: ${response.status}`);
  }
  return response.json();
}

export async function getTvVariations(serviceId = null) {
  let url = `${PROXY_URL}/variations/tv`;
  if (serviceId) url += `?service_id=${serviceId}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error getting TV variations: ${response.status}`);
  }
  return response.json();
}

export async function buyAirtime({ phone, serviceId, amount, requestId }) {
  const validServices = ["mtn", "glo", "airtel", "9mobile"];
  if (!validServices.includes(serviceId.toLowerCase())) {
    throw new Error("Invalid network provider");
  }

  const response = await fetch(`${PROXY_URL}/airtime`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone,
      service_id: serviceId.toLowerCase(),
      amount: Number(amount),
      request_id: requestId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || `Error vending airtime: ${response.status}`
    );
  }

  const data = await response.json();
  return { success: data.code === "success", ...data };
}

export async function buyData({ phone, serviceId, variationId, requestId }) {
  const response = await fetch(`${PROXY_URL}/data`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      phone,
      service_id: serviceId.toLowerCase(),
      variation_id: variationId,
      request_id: requestId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error vending data: ${response.status}`);
  }

  const data = await response.json();
  return { success: data.code === "success", ...data };
}

export async function buyTv({ customerId, provider, variationId, requestId }) {
  const response = await fetch(`${PROXY_URL}/tv`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      customer_id: customerId,
      service_id: provider.toLowerCase(),
      variation_id: variationId,
      request_id: requestId,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || `Error vending TV: ${response.status}`);
  }

  const data = await response.json();
  return { success: data.code === "success", ...data };
}
//
