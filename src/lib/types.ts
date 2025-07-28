export type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'Completed' | 'Pending' | 'Failed';
};

export type CryptoCoin = {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
};

export type User = {
    name: string;
    email: string;
    avatarUrl: string;
};

export type Notification = {
    id: string;
    title: string;
    description: string;
    date: string;
    read: boolean;
};

export type FlaggedTransaction = {
  id: string;
  date: string;
  user: {
    name: string;
    email: string;
  };
  details: string;
  reason: string;
  status: 'Pending Review' | 'Resolved' | 'Dismissed';
};
