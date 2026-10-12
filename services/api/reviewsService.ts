// Reviews Service - API calls for reviews & ratings.
// See "Reviews & Ratings" folder in the WAMI Postman collection.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

// Confirmed live 2026-10-03 by probing POST /v1/reviews directly: valid
// values are 'App\Models\Product' (gated server-side by "you must have
// purchased it"), 'App\Models\Offering' (gated by "you must have booked
// it"), and 'App\Models\Booking'. 'App\Models\User' is rejected outright.
export type ReviewableType = 'App\\Models\\Product' | 'App\\Models\\Offering' | 'App\\Models\\Booking';

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

// GET /v1/reviews/user/:userId/rating response confirmed live 2026-10-03:
// {"user_id": 2, "average_rating": 0} — not {average, count} as previously
// guessed.
export interface UserRating {
  user_id: string | number;
  average_rating: number;
  [key: string]: any;
}

// GET /v1/reviews?reviewable_type=&reviewable_id=&page= — the type/id
// filter is required server-side (422 "The reviewable type field is
// required" without it, confirmed live 2026-10-03); the collection's sample
// omits it.
export const getReviews = async (params: {
  reviewable_type: ReviewableType;
  reviewable_id: string | number;
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
