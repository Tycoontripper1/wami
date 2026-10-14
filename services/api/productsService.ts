// Products Service - API calls for product browsing and management

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

// Shape the app's product screens work with (mapped from the backend's
// product fields — title, price, media_url/thumbnail_url, creator …).
export type ProductCategory =
  | 'fashion'
  | 'accessories'
  | 'beauty'
  | 'art'
  | 'photography'
  | 'digital'
  | 'other';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  currency: string;
  description: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerImage: any;
  rating: number;
  reviews: number;
  stock: number;
  featured: boolean;
  tags: string[];
  createdAt: string;
  condition: 'New' | 'Pre-owned' | 'Refurbished';
  size?: string;
  officialStore: boolean;
}

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

export interface CreateProductPayload {
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  stock: number;
  status: 'draft' | 'published';
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

// Create a new product listing
export const createProduct = async (
  payload: CreateProductPayload
): Promise<ApiResponse<Product>> => {
  return apiClient.post(API_ENDPOINTS.PRODUCTS.CREATE, payload);
};

// Update a product listing (e.g. price, stock)
export const updateProduct = async (
  id: string,
  payload: UpdateProductPayload
): Promise<ApiResponse<Product>> => {
  return apiClient.patch(API_ENDPOINTS.PRODUCTS.UPDATE(id), payload);
};

// Delete a product listing
export const deleteProduct = async (id: string): Promise<ApiResponse<null>> => {
  return apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(id));
};

// POST /products/bulk/update  { ids, ...fields }
export const bulkUpdateProducts = async (
  ids: (string | number)[],
  fields: Partial<CreateProductPayload>
): Promise<ApiResponse<null>> => {
  return apiClient.post(API_ENDPOINTS.PRODUCTS.BULK_UPDATE, { ids, ...fields });
};

// POST /products/bulk/delete  { ids }
export const bulkDeleteProducts = async (
  ids: (string | number)[]
): Promise<ApiResponse<null>> => {
  return apiClient.post(API_ENDPOINTS.PRODUCTS.BULK_DELETE, { ids });
};
