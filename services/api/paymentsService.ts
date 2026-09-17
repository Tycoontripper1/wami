// Payments Service - API calls for initializing and verifying a payment.
// See "Payments" folder in the WAMI Postman collection.
//
// NOTE: the collection does not document the response shape for /initialize
// (no example response saved), so this deliberately returns `any` — callers
// must defensively read whatever fields come back (e.g. `authorization_url`,
// `reference`) until backend confirms the contract. See
// docs/API-AUDIT-02-MARKETPLACE-AND-BEYOND.md §3.3.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse } from './types';

export type PaymentGateway = 'paystack' | string;

export interface InitializePaymentPayload {
  order_id: string | number;
  gateway: PaymentGateway;
}

export interface VerifyPaymentPayload {
  order_id: string | number;
  gateway: PaymentGateway;
  reference: string;
}

// POST /payments/initialize  { order_id, gateway }
export const initializePayment = async (
  payload: InitializePaymentPayload
): Promise<ApiResponse<any>> => {
  return apiClient.post(API_ENDPOINTS.PAYMENTS.INITIALIZE, payload);
};

// POST /payments/verify  { order_id, gateway, reference }
export const verifyPayment = async (
  payload: VerifyPaymentPayload
): Promise<ApiResponse<any>> => {
  return apiClient.post(API_ENDPOINTS.PAYMENTS.VERIFY, payload);
};
