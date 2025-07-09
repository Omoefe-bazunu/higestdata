export type Transaction = {
  id: string;
  type: 'Buy' | 'Sell' | 'Payment' | 'Deposit';
  asset: string;
  amount: number;
  amountInUSD: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
};
