import type { Transaction } from './types';

export const mockTransactions: Transaction[] = [
  {
    id: 'txn_1',
    type: 'Buy',
    asset: 'Bitcoin',
    amount: 0.005,
    amountInUSD: 350.00,
    date: '2024-07-22',
    status: 'Completed',
  },
  {
    id: 'txn_2',
    type: 'Sell',
    asset: 'Amazon Gift Card',
    amount: 100,
    amountInUSD: 95.00,
    date: '2024-07-21',
    status: 'Completed',
  },
  {
    id: 'txn_3',
    type: 'Payment',
    asset: 'DSTV Subscription',
    amount: 50,
    amountInUSD: 50.00,
    date: '2024-07-20',
    status: 'Completed',
  },
  {
    id: 'txn_4',
    type: 'Deposit',
    asset: 'USD',
    amount: 500,
    amountInUSD: 500.00,
    date: '2024-07-19',
    status: 'Pending',
  },
    {
    id: 'txn_5',
    type: 'Buy',
    asset: 'Ethereum',
    amount: 0.1,
    amountInUSD: 340.00,
    date: '2024-07-18',
    status: 'Completed',
  },
  {
    id: 'txn_6',
    type: 'Sell',
    asset: 'USDT',
    amount: 200,
    amountInUSD: 200.00,
    date: '2024-07-17',
    status: 'Failed',
  },
];

export const mockUserProfile = `Age: 32
Country: Nigeria
Account Age: 2 years
Average Transaction Amount: 150
Last Login: 2 hours ago
KYC Status: Verified`;

export const mockTransactionHistory = `- $50.00 to "Netflix" (2 days ago)
- $200.00 from "Salary" (5 days ago)
- $25.00 to "Jumia Food" (6 days ago)
- $1200.00 to "Binance" (10 days ago)
- $75.00 from "John Doe" (12 days ago)`;

export const giftCardBrands = [
  { value: 'amazon', label: 'Amazon', image: 'https://placehold.co/100x60', 'data-ai-hint': 'amazon logo' },
  { value: 'steam', label: 'Steam', image: 'https://placehold.co/100x60', 'data-ai-hint': 'steam logo' },
  { value: 'google-play', label: 'Google Play', image: 'https://placehold.co/100x60', 'data-ai-hint': 'google play' },
  { value: 'apple', label: 'Apple/iTunes', image: 'https://placehold.co/100x60', 'data-ai-hint': 'apple logo' },
  { value: 'vanilla', label: 'Vanilla Visa', image: 'https://placehold.co/100x60', 'data-ai-hint': 'vanilla visa' },
  { value: 'razer-gold', label: 'Razer Gold', image: 'https://placehold.co/100x60', 'data-ai-hint': 'razer gold' },
];

export const cryptoCurrencies = [
    { value: 'btc', label: 'Bitcoin (BTC)' },
    { value: 'eth', label: 'Ethereum (ETH)' },
    { value: 'usdt', label: 'Tether (USDT)' },
    { value: 'sol', label: 'Solana (SOL)' },
];
