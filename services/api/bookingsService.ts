// Bookings Service - API calls for booking management
//
// Note: this wraps the raw /bookings backend resource (ApiBooking). It is
// separate from the local `Booking`/escrow UI model in types/payment.ts,
// which models the payment/escrow flow that hasn't been wired up yet.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

export type ApiBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'dispatched'
  | 'completed'
  | 'cancelled'
  | string;

export interface ApiMilestone {
  id: string | number;
  booking_id?: string | number;
  title: string;
  amount: number;
  due_date: string;
  status?: 'pending' | 'released' | string;
  released_at?: string;
  [key: string]: any;
}

export interface ApiBooking {
  id: string | number;
  offering_id: string | number;
  project_title: string;
  project_details: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  currency: string;
  status: ApiBookingStatus;
  milestones?: ApiMilestone[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface CreateBookingPayload {
  offering_id: string | number;
  project_title: string;
  project_details: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  currency: string;
}

export interface AddMilestonePayload {
  title: string;
  amount: number;
  due_date: string;
}

// GET /bookings
export const getBookings = async (params?: {
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<ApiBooking> | ApiBooking[]>> => {
  return apiClient.get(API_ENDPOINTS.BOOKINGS.LIST, { params });
};

// GET /bookings/:id
export const getBookingById = async (
  id: string | number
): Promise<ApiResponse<ApiBooking>> => {
  return apiClient.get(API_ENDPOINTS.BOOKINGS.BY_ID(id));
};

// POST /bookings
export const createBooking = async (
  payload: CreateBookingPayload
): Promise<ApiResponse<ApiBooking>> => {
  return apiClient.post(API_ENDPOINTS.BOOKINGS.CREATE, payload);
};

// PATCH /bookings/:id/status  { status }
export const updateBookingStatus = async (
  id: string | number,
  status: ApiBookingStatus
): Promise<ApiResponse<ApiBooking>> => {
  return apiClient.patch(API_ENDPOINTS.BOOKINGS.STATUS(id), { status });
};

// POST /bookings/:id/milestones  { title, amount, due_date }
export const addMilestone = async (
  bookingId: string | number,
  payload: AddMilestonePayload
): Promise<ApiResponse<ApiMilestone>> => {
  return apiClient.post(API_ENDPOINTS.BOOKINGS.MILESTONES(bookingId), payload);
};

// POST /bookings/:id/milestones/:milestoneId/release
export const releaseMilestone = async (
  bookingId: string | number,
  milestoneId: string | number
): Promise<ApiResponse<ApiMilestone>> => {
  return apiClient.post(API_ENDPOINTS.BOOKINGS.RELEASE_MILESTONE(bookingId, milestoneId));
};
