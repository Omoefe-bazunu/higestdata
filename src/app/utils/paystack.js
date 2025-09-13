export async function fundWallet(amount) {
  // Mock auto-funding
  console.log(`Mock Paystack: Funding wallet with ₦${amount}`);

  // Simulate success/failure randomly
  const success = Math.random() > 0.2; // 80% success
  if (success) {
    return {
      status: "success",
      reference: `MOCK_REF_${Date.now()}`,
      amount,
    };
  } else {
    return {
      status: "failed",
      message: "Mock Paystack funding failed",
    };
  }
}
