// Bookings Service - API calls for booking management
//
// Note: this wraps the raw /bookings backend resource (ApiBooking). It is
// separate from the local `Booking`/escrow UI model in types/payment.ts,
// which models the payment/escrow flow that hasn't been wired up yet.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

// requested, accepted, declined, expired, paid, in_progress, completed.
// The old names (pending, confirmed, active) are still accepted on the way in
// and may still come back on older rows.
export type ApiBookingStatus =
  | 'requested'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'paid'
  | 'in_progress'
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
  // The id on a row from /products or /creators/:id/listings. The creative
  // and the price come from the listing, so neither is sent.
  listing_id: string | number;
  /** ISO 8601 date and time the buyer wants. */
  scheduled_at: string;
  project_title: string;
  notes?: string;
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

export type BookingAction = 'accept' | 'decline' | 'start' | 'complete' | 'cancel' | 'release' | 'dispute';

// POST /bookings/:id/<action>. The creative accepts, declines, starts and
// completes; the buyer releases the held money; either side cancels or disputes.
export const bookingAction = async (
  id: string | number,
  action: BookingAction,
  body?: { reason?: string }
): Promise<ApiResponse<ApiBooking>> => {
  return apiClient.post(API_ENDPOINTS.BOOKINGS.ACTION(id, action), body);
};

// POST /bookings/:id/cancel  { reason }. Either side; returns anything held.
export const cancelBooking = async (
  id: string | number,
  reason?: string
): Promise<ApiResponse<ApiBooking>> => {
  return bookingAction(id, 'cancel', reason ? { reason } : undefined);
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

export interface RescheduleBookingPayload {
  /** The new date and time. start_date and end_date are sent too until the backend names the field. */
  scheduled_at: string;
  start_date?: string;
  end_date?: string;
}

// POST /bookings/:id/reschedule  { start_date, end_date }
export const rescheduleBooking = async (
  id: string | number,
  payload: RescheduleBookingPayload
): Promise<ApiResponse<ApiBooking>> => {
  return apiClient.post(API_ENDPOINTS.BOOKINGS.RESCHEDULE(id), payload);
};

// GET /bookings/calendar?from=&to=
export const getBookingsCalendar = async (params: {
  from: string;
  to: string;
}): Promise<ApiResponse<ApiBooking[]>> => {
  return apiClient.get(API_ENDPOINTS.BOOKINGS.CALENDAR, { params });
};

// Rows from before the state machine was settled can still say pending,
// confirmed or active; read them as the current names.
const LEGACY_STATUS: Record<string, string> = { pending: 'requested', confirmed: 'accepted', active: 'in_progress' };

export const normaliseStatus = (status?: string): string => {
  const key = String(status ?? 'requested').toLowerCase();
  return LEGACY_STATUS[key] ?? key;
};

/** Which side of a booking the signed-in person is on. */
export const bookingRole = (booking: ApiBooking, myId?: string | number): 'creative' | 'buyer' => {
  const said = String(booking.viewer_role ?? booking.role ?? '').toLowerCase();
  if (said === 'creative' || said === 'seller') return 'creative';
  if (said === 'buyer' || said === 'client' || said === 'customer') return 'buyer';
  const creativeId = booking.creative_id ?? booking.creative?.id ?? booking.creator_id ?? booking.creator?.id;
  return myId !== undefined && creativeId !== undefined && String(creativeId) === String(myId) ? 'creative' : 'buyer';
};
