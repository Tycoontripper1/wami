// Quotes Service - API calls for quote creation and response

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

export interface ApiQuote {
  id: string | number;
  booking_id: string | number;
  price: number;
  currency: string;
  message: string;
  accepted?: boolean | null;
  status?: 'pending' | 'accepted' | 'declined' | string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CreateQuotePayload {
  booking_id: string | number;
  price: number;
  currency: string;
  message: string;
}

export interface RespondToQuotePayload {
  accepted: boolean;
}

// GET /quotes
export const getQuotes = async (params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<ApiQuote> | ApiQuote[]>> => {
  return apiClient.get(API_ENDPOINTS.QUOTES.LIST, { params });
};

// POST /quotes  { booking_id, price, currency, message }
export const createQuote = async (
  payload: CreateQuotePayload
): Promise<ApiResponse<ApiQuote>> => {
  return apiClient.post(API_ENDPOINTS.QUOTES.CREATE, payload);
};

// POST /quotes/:id/respond  { accepted }
export const respondToQuote = async (
  id: string | number,
  payload: RespondToQuotePayload
): Promise<ApiResponse<ApiQuote>> => {
  return apiClient.post(API_ENDPOINTS.QUOTES.RESPOND(id), payload);
};
