// Offerings Service - API calls for the generic service/product listing a
// creative publishes. See "Offerings" folder in the WAMI Postman collection.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

export interface ApiOffering {
  id: string | number;
  title: string;
  description: string;
  price: number;
  currency: string;
  type: 'service' | 'product' | string;
  [key: string]: any;
}

export interface CreateOfferingPayload {
  title: string;
  description: string;
  price: number;
  currency: string;
  type: 'service' | 'product';
}

// GET /offerings
export const getOfferings = async (params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<ApiOffering> | ApiOffering[]>> => {
  return apiClient.get(API_ENDPOINTS.OFFERINGS.LIST, { params });
};

// POST /offerings  { title, description, price, currency, type }
export const createOffering = async (
  payload: CreateOfferingPayload
): Promise<ApiResponse<ApiOffering>> => {
  return apiClient.post(API_ENDPOINTS.OFFERINGS.CREATE, payload);
};

// POST /offerings/bulk/publish  { ids }
export const bulkPublishOfferings = async (
  ids: (string | number)[]
): Promise<ApiResponse<null>> => {
  return apiClient.post(API_ENDPOINTS.OFFERINGS.BULK_PUBLISH, { ids });
};

// POST /offerings/bulk/delete  { ids }
export const bulkDeleteOfferings = async (
  ids: (string | number)[]
): Promise<ApiResponse<null>> => {
  return apiClient.post(API_ENDPOINTS.OFFERINGS.BULK_DELETE, { ids });
};
