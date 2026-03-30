// Bookings Service - API calls for booking management

import { Booking, BookingStatus } from '@/types/payment';
import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

export interface CreateBookingParams {
  creativeId: string;
  creativeName: string;
  service: string;
  description: string;
  agreedPrice: number;
  currency: string;
  scheduledDate?: string;
  scheduledTime?: string;
  location?: string;
}

export interface UpdateBookingParams {
  status?: BookingStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  location?: string;
  description?: string;
}

// Get all bookings for current user
export const getBookings = async (params?: {
  status?: BookingStatus;
  page?: number;
  limit?: number;
}): Promise<ApiResponse<PaginatedResponse<Booking>>> => {
  return apiClient.get(API_ENDPOINTS.BOOKINGS.LIST, { params });
};

// Get booking by ID
export const getBookingById = async (
  id: string
): Promise<ApiResponse<Booking>> => {
  return apiClient.get(API_ENDPOINTS.BOOKINGS.BY_ID(id));
};

// Create new booking
export const createBooking = async (
  data: CreateBookingParams
): Promise<ApiResponse<Booking>> => {
  return apiClient.post(API_ENDPOINTS.BOOKINGS.CREATE, data);
};

// Update booking
export const updateBooking = async (
  id: string,
  data: UpdateBookingParams
): Promise<ApiResponse<Booking>> => {
  return apiClient.patch(API_ENDPOINTS.BOOKINGS.UPDATE(id), data);
};

// Mark booking as complete
export const completeBooking = async (
  id: string
): Promise<ApiResponse<Booking>> => {
  return apiClient.post(API_ENDPOINTS.BOOKINGS.COMPLETE(id));
};

// Cancel booking
export const cancelBooking = async (
  id: string,
  reason?: string
): Promise<ApiResponse<Booking>> => {
  return apiClient.post(API_ENDPOINTS.BOOKINGS.CANCEL(id), { reason });
};
