// Mock User Data
export const MOCK_USER = {
  name: "Clever Gbogborogbo",
  email: "alex.doe@example.com",
  avatarUrl: "https://placehold.co/100x100.png",
};

// Mock Wallet Data
export async function getWalletBalance() {
  return 1234567.89;
}

// Mock Transactions Data
const MOCK_TRANSACTIONS = [
  {
    id: "1",
    date: "2024-07-21",
    description: "MTN Airtime Purchase",
    amount: -5000.0,
    type: "debit",
    status: "Completed",
  },
  {
    id: "2",
    date: "2024-07-20",
    description: "Wallet Funded via Flutterwave",
    amount: 150000.0,
    type: "credit",
    status: "Completed",
  },
  {
    id: "3",
    date: "2024-07-19",
    description: "Amazon Gift Card Payout",
    amount: 35000.0,
    type: "credit",
    status: "Completed",
  },
  {
    id: "4",
    date: "2024-07-18",
    description: "GLO Data Subscription",
    amount: -2500.0,
    type: "debit",
    status: "Completed",
  },
  {
    id: "5",
    date: "2024-07-17",
    description: "Bitcoin Sale",
    amount: 75000.0,
    type: "credit",
    status: "Pending",
  },
  {
    id: "6",
    date: "2024-07-16",
    description: "Netflix Subscription",
    amount: -7500.0,
    type: "debit",
    status: "Failed",
  },
];

export async function getTransactions() {
  return MOCK_TRANSACTIONS;
}

// Mock Crypto Data (simulating CoinGecko)
const MOCK_CRYPTO_RATES = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC",
    price: 95432100.0,
    change24h: 2.5,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH",
    price: 5123456.78,
    change24h: -1.2,
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL",
    price: 215450.45,
    change24h: 5.8,
  },
  {
    id: "tether",
    name: "Tether",
    symbol: "USDT",
    price: 1500.0,
    change24h: 0.1,
  },
];

export async function getCryptoRates() {
  return MOCK_CRYPTO_RATES;
}

// Mock Notifications
const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    title: "Transaction Successful",
    description: "Your wallet has been credited with ₦150,000.00.",
    date: "2 days ago",
    read: false,
  },
  {
    id: "2",
    title: "Gift Card Under Review",
    description: "Your recent gift card upload is being reviewed.",
    date: "3 days ago",
    read: false,
  },
  {
    id: "3",
    title: "Password Changed",
    description: "Your password was successfully changed.",
    date: "1 week ago",
    read: true,
  },
];

export async function getNotifications() {
  return MOCK_NOTIFICATIONS;
}

// Mock Flagged Transactions for Admin
const MOCK_FLAGGED_TRANSACTIONS = [
  {
    id: "fraud-1",
    date: "2024-07-21T10:30:00Z",
    user: { name: "suspicious_user", email: "suspicious@mail.com" },
    details: "Amazon Gift Card (₦500,000) - Code: XXXX-YYYY-ZZZZ",
    reason:
      "High value card from a new user with no transaction history. Upload IP differs from account region.",
    status: "Pending Review",
  },
  {
    id: "fraud-2",
    date: "2024-07-20T15:00:00Z",
    user: { name: "regular_trader", email: "trader@mail.com" },
    details: "Steam Gift Card (₦50,000) - Code: AAAA-BBBB-CCCC",
    reason:
      "Multiple rapid uploads from different IP addresses within a short time frame.",
    status: "Pending Review",
  },
  {
    id: "fraud-3",
    date: "2024-07-19T08:00:00Z",
    user: { name: "jane_doe", email: "jane@mail.com" },
    details: "iTunes Gift Card (₦100,000) - Code: DDDD-EEEE-FFFF",
    reason:
      "User history shows only small airtime purchases. This is an unusually large and different type of transaction.",
    status: "Resolved",
  },
];

export async function getFlaggedTransactions() {
  return MOCK_FLAGGED_TRANSACTIONS;
}
