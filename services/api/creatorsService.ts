// Creators — the public pages of creatives. Guests can read all of these;
// following needs an account.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse } from './types';

export interface ApiCreator {
  id: number;
  username: string;
  name: string;
  /** Can be a bare storage id rather than a link; use absoluteUrl() before showing it. */
  avatar_url?: string | null;
  bio?: string | null;
  account_type?: string;
  categories?: { id: number; name: string; slug: string }[];
  city?: string | null;
  area?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  verified?: boolean;
  joined_at?: string;
  stats?: { rating_avg: number; reviews_count: number; bookings_completed: number };
  links?: Record<string, string> | any[];
  followers_count?: number;
  viewer?: { is_following?: boolean } | null;
}

// GET /creators?q=&city=&category=&sort=new
export const getCreators = async (params?: {
  q?: string;
  city?: string;
  category?: string;
  sort?: string;
  page?: number;
}): Promise<ApiResponse<ApiCreator[]>> => apiClient.get(API_ENDPOINTS.CREATORS_PUBLIC.LIST, { params });

// GET /creators/:id  (an id or a username)
export const getCreator = async (id: string | number): Promise<ApiResponse<ApiCreator>> =>
  apiClient.get(API_ENDPOINTS.CREATORS_PUBLIC.BY_ID(id));

// GET /creators/:id/listings — the id on each row is what a booking wants as listing_id
export const getCreatorListings = async (id: string | number): Promise<ApiResponse<any[]>> =>
  apiClient.get(API_ENDPOINTS.CREATORS_PUBLIC.LISTINGS(id));

// GET /creators/:id/reviews — the rating breakdown is in `meta`
export const getCreatorReviews = async (id: string | number): Promise<ApiResponse<any>> =>
  apiClient.get(API_ENDPOINTS.CREATORS_PUBLIC.REVIEWS(id), { raw: true });

// POST / DELETE /creators/:id/follow
export const followCreator = async (id: string | number): Promise<ApiResponse<any>> =>
  apiClient.post(API_ENDPOINTS.CREATORS_PUBLIC.FOLLOW(id));
export const unfollowCreator = async (id: string | number): Promise<ApiResponse<any>> =>
  apiClient.delete(API_ENDPOINTS.CREATORS_PUBLIC.FOLLOW(id));

// GET /locations/cities — cities that have creatives, with counts
export const getCities = async (): Promise<
  ApiResponse<{ code: string; name: string; state?: string; country?: string; lat: number; lng: number; creators_count: number }[]>
> => apiClient.get(API_ENDPOINTS.LOCATIONS.CITIES);

// GET /map/places?bbox=minLng,minLat,maxLng,maxLat
export const getMapPlaces = async (params: {
  bbox: string;
  category?: string;
  q?: string;
  limit?: number;
}): Promise<ApiResponse<any[]>> => apiClient.get(API_ENDPOINTS.LOCATIONS.MAP_PLACES, { params });
