// Creatives Service - API calls for creative discovery and management

import { Creative } from '@/data/creatives';
import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

export interface CreativeFilters {
  region?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  verified?: boolean;
}

export interface CreativeSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  filters?: CreativeFilters;
}

// Get list of creatives with optional filters
export const getCreatives = async (
  params?: CreativeSearchParams
): Promise<ApiResponse<PaginatedResponse<Creative>>> => {
  return apiClient.get(API_ENDPOINTS.CREATIVES.LIST, { params });
};

// Search creatives
export const searchCreatives = async (
  query: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<Creative>>> => {
  return apiClient.get(API_ENDPOINTS.CREATIVES.SEARCH, {
    params: { query, ...params },
  });
};

// Get featured creatives
export const getFeaturedCreatives = async (
  region?: string
): Promise<ApiResponse<Creative[]>> => {
  return apiClient.get(API_ENDPOINTS.CREATIVES.FEATURED, {
    params: region ? { region } : undefined,
  });
};

// Get nearby creatives
export const getNearbyCreatives = async (
  city: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<Creative>>> => {
  return apiClient.get(API_ENDPOINTS.CREATIVES.NEARBY, {
    params: { city, ...params },
  });
};

// Get creative by ID
export const getCreativeById = async (
  id: string
): Promise<ApiResponse<Creative>> => {
  return apiClient.get(API_ENDPOINTS.CREATIVES.BY_ID(id));
};

// Get creatives by category
export const getCreativesByCategory = async (
  category: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<Creative>>> => {
  return apiClient.get(API_ENDPOINTS.CREATIVES.BY_CATEGORY(category), { params });
};

// Get creatives by region
export const getCreativesByRegion = async (
  region: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<Creative>>> => {
  return apiClient.get(API_ENDPOINTS.CREATIVES.BY_REGION(region), { params });
};
