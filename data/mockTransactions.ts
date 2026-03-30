// Mock Wallet Transactions Data

import { formatDate, generateId } from '@/services/api/mock/mockHelpers';

export type TransactionType = 
  | 'deposit' 
  | 'withdrawal' 
  | 'transfer_in' 
  | 'transfer_out' 
  | 'payment' 
  | 'refund'
  | 'earning';

export type TransactionStatus = 'pending' | 'completed' | 'failed';

export interface WalletTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  status: TransactionStatus;
  description: string;
  reference?: string;
  recipientId?: string;
  recipientName?: string;
  senderId?: string;
  senderName?: string;
  createdAt: string;
  completedAt?: string;
}

export interface WalletBalance {
  userId: string;
  balance: number;
  currency: string;
  pendingBalance: number;
  lastUpdated: string;
}

// Mock wallet balance
export const MOCK_WALLET_BALANCE: WalletBalance = {
  userId: 'test_user_001',
  balance: 125000,
  currency: 'NGN',
  pendingBalance: 0,
  lastUpdated: formatDate(),
};

// Mock transactions
export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'txn_001',
    userId: 'test_user_001',
    type: 'deposit',
    amount: 50000,
    currency: 'NGN',
    status: 'completed',
    description: 'Card deposit',
    reference: 'DEP_001_2026',
    createdAt: formatDate(new Date('2026-01-15T10:30:00')),
    completedAt: formatDate(new Date('2026-01-15T10:30:15')),
  },
  {
    id: 'txn_002',
    userId: 'test_user_001',
    type: 'payment',
    amount: -150000,
    currency: 'NGN',
    status: 'completed',
    description: 'Payment to Paul Studio for Wedding Photography',
    reference: 'PAY_001_2026',
    recipientId: 'ng-1',
    recipientName: 'Paul Studio',
    createdAt: formatDate(new Date('2026-01-25T14:20:00')),
    completedAt: formatDate(new Date('2026-01-25T14:20:10')),
  },
  {
    id: 'txn_003',
    userId: 'test_user_001',
    type: 'deposit',
    amount: 100000,
    currency: 'NGN',
    status: 'completed',
    description: 'Bank transfer deposit',
    reference: 'DEP_002_2026',
    createdAt: formatDate(new Date('2026-01-20T09:15:00')),
    completedAt: formatDate(new Date('2026-01-20T09:16:00')),
  },
  {
    id: 'txn_004',
    userId: 'test_user_001',
    type: 'payment',
    amount: -450000,
    currency: 'NGN',
    status: 'completed',
    description: 'Payment to Chef Tunde Catering for Wedding Catering',
    reference: 'PAY_002_2026',
    recipientId: 'ng-3',
    recipientName: 'Chef Tunde Catering',
    createdAt: formatDate(new Date('2026-01-20T16:45:00')),
    completedAt: formatDate(new Date('2026-01-20T16:45:12')),
  },
  {
    id: 'txn_005',
    userId: 'test_user_001',
    type: 'deposit',
    amount: 500000,
    currency: 'NGN',
    status: 'completed',
    description: 'Card deposit',
    reference: 'DEP_003_2026',
    createdAt: formatDate(new Date('2026-01-18T11:00:00')),
    completedAt: formatDate(new Date('2026-01-18T11:00:20')),
  },
  {
    id: 'txn_006',
    userId: 'test_user_001',
    type: 'payment',
    amount: -75000,
    currency: 'NGN',
    status: 'completed',
    description: 'Payment to Amara MUA for Bridal Makeup',
    reference: 'PAY_003_2026',
    recipientId: 'ng-4',
    recipientName: 'Amara MUA',
    createdAt: formatDate(new Date('2026-01-15T13:30:00')),
    completedAt: formatDate(new Date('2026-01-15T13:30:08')),
  },
  {
    id: 'txn_007',
    userId: 'test_user_001',
    type: 'transfer_in',
    amount: 25000,
    currency: 'NGN',
    status: 'completed',
    description: 'Transfer from Adeola Johnson',
    reference: 'TRF_001_2026',
    senderId: 'user_002',
    senderName: 'Adeola Johnson',
    createdAt: formatDate(new Date('2026-01-28T15:20:00')),
    completedAt: formatDate(new Date('2026-01-28T15:20:05')),
  },
  {
    id: 'txn_008',
    userId: 'test_user_001',
    type: 'refund',
    amount: 50000,
    currency: 'NGN',
    status: 'completed',
    description: 'Refund from cancelled booking',
    reference: 'REF_001_2026',
    createdAt: formatDate(new Date('2026-01-22T10:00:00')),
    completedAt: formatDate(new Date('2026-01-22T10:00:15')),
  },
  {
    id: 'txn_009',
    userId: 'test_user_001',
    type: 'deposit',
    amount: 200000,
    currency: 'NGN',
    status: 'completed',
    description: 'Bank transfer deposit',
    reference: 'DEP_004_2026',
    createdAt: formatDate(new Date('2026-02-01T08:30:00')),
    completedAt: formatDate(new Date('2026-02-01T08:31:00')),
  },
  {
    id: 'txn_010',
    userId: 'test_user_001',
    type: 'transfer_out',
    amount: -15000,
    currency: 'NGN',
    status: 'completed',
    description: 'Transfer to Chioma Okafor',
    reference: 'TRF_002_2026',
    recipientId: 'user_003',
    recipientName: 'Chioma Okafor',
    createdAt: formatDate(new Date('2026-02-02T12:00:00')),
    completedAt: formatDate(new Date('2026-02-02T12:00:06')),
  },
];

// Helper functions
export const getTransactionsByUser = (userId: string): WalletTransaction[] => {
  return MOCK_TRANSACTIONS.filter(t => t.userId === userId);
};

export const getTransactionById = (id: string): WalletTransaction | undefined => {
  return MOCK_TRANSACTIONS.find(t => t.id === id);
};

export const createMockTransaction = (
  data: Partial<WalletTransaction>
): WalletTransaction => {
  return {
    id: generateId('txn'),
    userId: data.userId || 'test_user_001',
    type: data.type || 'deposit',
    amount: data.amount || 0,
    currency: data.currency || 'NGN',
    status: data.status || 'pending',
    description: data.description || '',
    reference: data.reference || generateId('REF'),
    recipientId: data.recipientId,
    recipientName: data.recipientName,
    senderId: data.senderId,
    senderName: data.senderName,
    createdAt: formatDate(),
    completedAt: data.status === 'completed' ? formatDate() : undefined,
  };
};

export const updateWalletBalance = (
  currentBalance: number,
  transaction: WalletTransaction
): number => {
  if (transaction.status !== 'completed') {
    return currentBalance;
  }
  return currentBalance + transaction.amount;
};
