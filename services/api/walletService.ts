// Wallet Service - API calls for wallet and payment management

import { TransactionType, WalletBalance, WalletTransaction } from '@/data/mockTransactions';
import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

export interface DepositParams {
  amount: number;
  currency?: string;
  paymentMethod: 'card' | 'bank_transfer';
  paymentDetails?: any;
}

export interface WithdrawParams {
  amount: number;
  currency?: string;
  bankDetails: {
    accountNumber: string;
    accountName: string;
    bankName: string;
    bankCode?: string;
  };
}

export interface TransferParams {
  amount: number;
  currency?: string;
  recipientId: string;
  recipientName?: string;
  description?: string;
}

// Get wallet balance
export const getWalletBalance = async (): Promise<ApiResponse<WalletBalance>> => {
  return apiClient.get(API_ENDPOINTS.WALLET.BALANCE);
};

// Get transaction history
export const getTransactions = async (params?: {
  page?: number;
  limit?: number;
  type?: TransactionType;
}): Promise<ApiResponse<PaginatedResponse<WalletTransaction>>> => {
  return apiClient.get(API_ENDPOINTS.WALLET.TRANSACTIONS, { params });
};

// Deposit funds
export const depositFunds = async (
  data: DepositParams
): Promise<ApiResponse<{ transaction: WalletTransaction; balance: WalletBalance }>> => {
  return apiClient.post(API_ENDPOINTS.WALLET.DEPOSIT, data);
};

// Withdraw funds
export const withdrawFunds = async (
  data: WithdrawParams
): Promise<ApiResponse<{ transaction: WalletTransaction; balance: WalletBalance }>> => {
  return apiClient.post(API_ENDPOINTS.WALLET.WITHDRAW, data);
};

// Transfer funds to another user
export const transferFunds = async (
  data: TransferParams
): Promise<ApiResponse<{ transaction: WalletTransaction; balance: WalletBalance }>> => {
  return apiClient.post(API_ENDPOINTS.WALLET.TRANSFER, data);
};
