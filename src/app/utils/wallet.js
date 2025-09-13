import { fundWallet } from "./paystack.js";

// mock wallet balance for testing
let walletBalance = 200;

export async function ensureWallet(amount) {
  if (walletBalance >= amount) {
    walletBalance -= amount;
    return { status: "ok", balance: walletBalance };
  }

  // Need more money → fund wallet
  const topUpAmount = amount - walletBalance + 100; // add buffer ₦100
  const funding = await fundWallet(topUpAmount);

  if (funding.status !== "success") {
    return { status: "failed", message: "Auto-funding failed" };
  }

  // After funding, reset wallet balance
  walletBalance += topUpAmount - amount;
  return { status: "ok", balance: walletBalance };
}
