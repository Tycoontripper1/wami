// Seller Service - API calls for the seller wallet, payouts, and analytics.
// See "Payouts & Commission" and the seller half of "Analytics & Reporting"
// in the WAMI Postman collection. Admin-only endpoints in those folders
// (pending/approve payouts, dashboard overview, revenue-by-category,
// top-sellers) are intentionally not wired here — this is a buyer/seller
// mobile client, not an admin panel.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

export interface SellerWallet {
  balance: number;
  currency?: string;
  [key: string]: any;
}

export interface SellerTransaction {
  id: string | number;
  amount: number;
  type?: string;
  status?: string;
  created_at?: string;
  [key: string]: any;
}

export interface BankDetails {
  account_number: string;
  account_name: string;
  bank_code: string;
}

export interface RequestPayoutPayload {
  amount: number;
  bank_details: BankDetails;
}

export interface SalesAnalytics {
  [key: string]: any;
}

export interface TopProduct {
  [key: string]: any;
}

// GET /v1/seller/wallet
export const getSellerWallet = async (): Promise<ApiResponse<SellerWallet>> => {
  return apiClient.get(API_ENDPOINTS.SELLER.WALLET);
};

// GET /v1/seller/transactions?page=
export const getSellerTransactions = async (params?: {
  page?: number;
}): Promise<ApiResponse<PaginatedResponse<SellerTransaction> | SellerTransaction[]>> => {
  return apiClient.get(API_ENDPOINTS.SELLER.TRANSACTIONS, { params });
};

// POST /v1/seller/payout-requests  { amount, bank_details }
export const requestPayout = async (
  payload: RequestPayoutPayload
): Promise<ApiResponse<any>> => {
  return apiClient.post(API_ENDPOINTS.SELLER.PAYOUT_REQUESTS, payload);
};

// GET /v1/seller/analytics/sales?from=&to=
export const getSalesAnalytics = async (params: {
  from: string;
  to: string;
}): Promise<ApiResponse<SalesAnalytics>> => {
  return apiClient.get(API_ENDPOINTS.SELLER.SALES_ANALYTICS, { params });
};

// GET /v1/seller/analytics/top-products?limit=
export const getTopProducts = async (params?: {
  limit?: number;
}): Promise<ApiResponse<TopProduct[]>> => {
  return apiClient.get(API_ENDPOINTS.SELLER.TOP_PRODUCTS, { params });
};
