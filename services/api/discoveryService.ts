// Discovery Service - feed, near-you, search, saved offerings, swipe actions

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

export type SwipeAction = 'like' | 'pass' | 'super_like' | 'share';

// Generic discovery item — backend returns either creatives or products under
// the same "offering" shape. Keep this loose and map defensively in the UI.
export interface DiscoveryOffering {
  id: string | number;
  offering_id?: string | number;
  type?: 'creative' | 'product' | 'service' | string;
  name?: string;
  title?: string;
  role?: string;
  description?: string;
  category?: string;
  price?: number;
  currency?: string;
  rating?: number;
  reviews?: number;
  reviews_count?: number;
  images?: string[];
  image?: string;
  video?: string;
  tags?: string[];
  location?: { city?: string; region?: string; lat?: number; lng?: number };
  distance_km?: number;
  is_saved?: boolean;
  [key: string]: any;
}

export interface DiscoveryListParams {
  page?: number;
  limit?: number;
}

// GET /discovery/feed
export const getDiscoveryFeed = async (
  params?: DiscoveryListParams
): Promise<ApiResponse<PaginatedResponse<DiscoveryOffering> | DiscoveryOffering[]>> => {
  return apiClient.get(API_ENDPOINTS.DISCOVERY.FEED, { params });
};

// GET /discovery/near-you
export const getNearYou = async (
  params?: DiscoveryListParams
): Promise<ApiResponse<PaginatedResponse<DiscoveryOffering> | DiscoveryOffering[]>> => {
  return apiClient.get(API_ENDPOINTS.DISCOVERY.NEAR_YOU, { params });
};

// GET /discovery/my-items
export const getMyItems = async (
  params?: DiscoveryListParams
): Promise<ApiResponse<PaginatedResponse<DiscoveryOffering> | DiscoveryOffering[]>> => {
  return apiClient.get(API_ENDPOINTS.DISCOVERY.MY_ITEMS, { params });
};

// GET /discovery/search?query=
export const searchDiscovery = async (
  query: string,
  params?: DiscoveryListParams
): Promise<ApiResponse<PaginatedResponse<DiscoveryOffering> | DiscoveryOffering[]>> => {
  return apiClient.get(API_ENDPOINTS.DISCOVERY.SEARCH, { params: { query, ...params } });
};

// GET /discovery/saved
export const getSavedOfferings = async (
  params?: DiscoveryListParams
): Promise<ApiResponse<PaginatedResponse<DiscoveryOffering> | DiscoveryOffering[]>> => {
  return apiClient.get(API_ENDPOINTS.DISCOVERY.SAVED, { params });
};

// POST /discovery/saved  { offering_id }
export const saveOffering = async (
  offeringId: string | number
): Promise<ApiResponse<DiscoveryOffering>> => {
  return apiClient.post(API_ENDPOINTS.DISCOVERY.SAVED, { offering_id: offeringId });
};

// DELETE /discovery/saved/:offeringId
export const unsaveOffering = async (
  offeringId: string | number
): Promise<ApiResponse<null>> => {
  return apiClient.delete(API_ENDPOINTS.DISCOVERY.UNSAVE(offeringId));
};

// POST /discovery/swipe  { offering_id, action }
export const swipeOffering = async (
  offeringId: string | number,
  action: SwipeAction
): Promise<ApiResponse<any>> => {
  return apiClient.post(API_ENDPOINTS.DISCOVERY.SWIPE, { offering_id: offeringId, action });
};
