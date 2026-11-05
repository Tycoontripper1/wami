// Payments Service: start a payment for an order, and ask whether it landed.
//
// POST /payments/initialize { order_id } returns { authorization_url, reference }.
// Open authorization_url; the gateway's page does the paying. The return urls
// default to https pages that deep-link back into the app, so none are sent
// (a custom scheme such as wami:// is rejected by the gateway).
// POST /payments/verify { order_id, reference } is the fallback for when the
// gateway's webhook has not arrived yet; the webhook is the source of truth.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse } from './types';

export interface InitializePaymentPayload {
  order_id: string | number;
}

export interface VerifyPaymentPayload {
  order_id: string | number;
  reference: string;
}

export const initializePayment = async (
  payload: InitializePaymentPayload
): Promise<ApiResponse<any>> => {
  return apiClient.post(API_ENDPOINTS.PAYMENTS.INITIALIZE, payload);
};

export const verifyPayment = async (
  payload: VerifyPaymentPayload
): Promise<ApiResponse<any>> => {
  return apiClient.post(API_ENDPOINTS.PAYMENTS.VERIFY, payload);
};
