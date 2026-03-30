// Products Service - API calls for product browsing and management

import { Product, ProductCategory } from '@/data/mockProducts';
import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

export interface ProductSearchParams {
  page?: number;
  limit?: number;
  category?: ProductCategory;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
}

// Get products with filters
export const getProducts = async (
  params?: ProductSearchParams
): Promise<ApiResponse<PaginatedResponse<Product>>> => {
  return apiClient.get(API_ENDPOINTS.PRODUCTS.LIST, { params });
};

// Get featured products
export const getFeaturedProducts = async (): Promise<ApiResponse<Product[]>> => {
  return apiClient.get(API_ENDPOINTS.PRODUCTS.FEATURED);
};

// Get product by ID
export const getProductById = async (
  id: string
): Promise<ApiResponse<Product>> => {
  return apiClient.get(API_ENDPOINTS.PRODUCTS.BY_ID(id));
};

// Get products by category
export const getProductsByCategory = async (
  category: ProductCategory,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<Product>>> => {
  return apiClient.get(API_ENDPOINTS.PRODUCTS.BY_CATEGORY(category), { params });
};

// Search products
export const searchProducts = async (
  query: string,
  params?: { page?: number; limit?: number }
): Promise<ApiResponse<PaginatedResponse<Product>>> => {
  return apiClient.get(API_ENDPOINTS.PRODUCTS.LIST, {
    params: { search: query, ...params },
  });
};
