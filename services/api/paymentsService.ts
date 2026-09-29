// Payments Service - API calls for initializing and verifying a payment.
// See "Payments" folder in the WAMI Postman collection.
//
// NOTE: the collection's sample body for /initialize is {order_id, gateway}
// only — the real backend also requires payment_method, success_url, and
// cancel_url (confirmed live 2026-09-29 via its own 422 validation). The
// response shape still isn't confirmed (no request has succeeded — the
// backend's Paystack secret key is currently invalid, so every valid
// request 500s server-side), so this deliberately returns `any` — callers
// must defensively read whatever fields come back (e.g. `authorization_url`,
// `reference`) once that's fixed. See
// docs/API-AUDIT-02-MARKETPLACE-AND-BEYOND.md §3.3.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse } from './types';

export type PaymentGateway = 'paystack' | string;

export interface InitializePaymentPayload {
  order_id: string | number;
  gateway: PaymentGateway;
  // What the collection didn't document — required by the real backend.
  payment_method: string;
  success_url: string;
  cancel_url: string;
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
