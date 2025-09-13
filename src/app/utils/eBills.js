export async function buyFromEBills(endpoint, body) {
  try {
    const res = await fetch(`https://api.ebills.ng/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${process.env.EBILLS_API_KEY}`, // put real key later
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.message || "eBills error");
    }
    return data;
  } catch (err) {
    console.error("EBills error:", err);
    throw err;
  }
}
