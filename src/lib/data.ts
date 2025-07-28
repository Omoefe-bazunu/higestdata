import type { Transaction, CryptoCoin, User, Notification, FlaggedTransaction } from './types';

// Mock User Data
export const MOCK_USER: User = {
  name: 'Alex Doe',
  email: 'alex.doe@example.com',
  avatarUrl: 'https://placehold.co/100x100.png',
};

// Mock Wallet Data
export async function getWalletBalance(): Promise<number> {
  return 12345.67;
}

// Mock Transactions Data
const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', date: '2024-07-21', description: 'MTN Airtime Purchase', amount: -50.00, type: 'debit', status: 'Completed' },
  { id: '2', date: '2024-07-20', description: 'Wallet Funded via Flutterwave', amount: 1000.00, type: 'credit', status: 'Completed' },
  { id: '3', date: '2024-07-19', description: 'Amazon Gift Card Payout', amount: 250.00, type: 'credit', status: 'Completed' },
  { id: '4', date: '2024-07-18', description: 'GLO Data Subscription', amount: -25.50, type: 'debit', status: 'Completed' },
  { id: '5', date: '2024-07-17', description: 'Bitcoin Sale', amount: 500.00, type: 'credit', status: 'Pending' },
  { id: '6', date: '2024-07-16', description: 'Netflix Subscription', amount: -15.00, type: 'debit', status: 'Failed' },
];

export async function getTransactions(): Promise<Transaction[]> {
  return MOCK_TRANSACTIONS;
}

// Mock Crypto Data (simulating CoinGecko)
const MOCK_CRYPTO_RATES: CryptoCoin[] = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', price: 65432.10, change24h: 2.5 },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', price: 3456.78, change24h: -1.2 },
  { id: 'solana', name: 'Solana', symbol: 'SOL', price: 150.45, change24h: 5.8 },
  { id: 'tether', name: 'Tether', symbol: 'USDT', price: 1.00, change24h: 0.1 },
];

export async function getCryptoRates(): Promise<CryptoCoin[]> {
  return MOCK_CRYPTO_RATES;
}

// Mock Notifications
const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Transaction Successful', description: 'Your wallet has been credited with $1000.00.', date: '2 days ago', read: false },
  { id: '2', title: 'Gift Card Under Review', description: 'Your recent gift card upload is being reviewed.', date: '3 days ago', read: false },
  { id: '3', title: 'Password Changed', description: 'Your password was successfully changed.', date: '1 week ago', read: true },
];

export async function getNotifications(): Promise<Notification[]> {
  return MOCK_NOTIFICATIONS;
}

// Mock Flagged Transactions for Admin
const MOCK_FLAGGED_TRANSACTIONS: FlaggedTransaction[] = [
    {
      id: 'fraud-1',
      date: '2024-07-21T10:30:00Z',
      user: { name: 'suspicious_user', email: 'suspicious@mail.com' },
      details: 'Amazon Gift Card ($500) - Code: XXXX-YYYY-ZZZZ',
      reason: 'High value card from a new user with no transaction history. Upload IP differs from account region.',
      status: 'Pending Review',
    },
    {
      id: 'fraud-2',
      date: '2024-07-20T15:00:00Z',
      user: { name: 'regular_trader', email: 'trader@mail.com' },
      details: 'Steam Gift Card ($50) - Code: AAAA-BBBB-CCCC',
      reason: 'Multiple rapid uploads from different IP addresses within a short time frame.',
      status: 'Pending Review',
    },
     {
      id: 'fraud-3',
      date: '2024-07-19T08:00:00Z',
      user: { name: 'jane_doe', email: 'jane@mail.com' },
      details: 'iTunes Gift Card ($100) - Code: DDDD-EEEE-FFFF',
      reason: 'User history shows only small airtime purchases. This is an unusually large and different type of transaction.',
      status: 'Resolved',
    },
]

export async function getFlaggedTransactions(): Promise<FlaggedTransaction[]> {
    return MOCK_FLAGGED_TRANSACTIONS;
}
