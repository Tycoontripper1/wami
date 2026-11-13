// Reviews Service - API calls for reviews & ratings.
// See "Reviews & Ratings" folder in the WAMI Postman collection.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

// The backend now documents three names (confirmed live 2026-11-13: anything
// else is a 422 "must be listing, booking or product"): 'listing' for a
// service or product listing (the id is the listing id), 'booking', and
// 'product' (the old product id). The long class names still work but are the
// legacy spelling, so the app sends the short ones.
export type ReviewableType = 'listing' | 'booking' | 'product';

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
