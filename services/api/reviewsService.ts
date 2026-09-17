// Reviews Service - API calls for reviews & ratings.
// See "Reviews & Ratings" folder in the WAMI Postman collection.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

// The collection's sample body only shows "App\Models\Product" — the value
// for reviewing a creative/offering is unconfirmed. Ask backend to confirm
// before assuming this string.
export type ReviewableType = 'App\\Models\\Product' | string;

export interface ApiReview {
  id: string | number;
  reviewable_type: ReviewableType;
  reviewable_id: string | number;
  rating: number;
  comment: string;
  created_at?: string;
  [key: string]: any;
}

export interface CreateReviewPayload {
  reviewable_type: ReviewableType;
  reviewable_id: string | number;
  rating: number;
  comment: string;
}

export interface UserRating {
  average: number;
  count: number;
  [key: string]: any;
}

// GET /v1/reviews?page=
export const getReviews = async (params?: {
  page?: number;
}): Promise<ApiResponse<PaginatedResponse<ApiReview> | ApiReview[]>> => {
  return apiClient.get(API_ENDPOINTS.REVIEWS.LIST, { params });
};

// POST /v1/reviews  { reviewable_type, reviewable_id, rating, comment }
export const createReview = async (
  payload: CreateReviewPayload
): Promise<ApiResponse<ApiReview>> => {
  return apiClient.post(API_ENDPOINTS.REVIEWS.CREATE, payload);
};

// GET /v1/reviews/user/:userId/rating
export const getUserRating = async (
  userId: string | number
): Promise<ApiResponse<UserRating>> => {
  return apiClient.get(API_ENDPOINTS.REVIEWS.USER_RATING(userId));
};
