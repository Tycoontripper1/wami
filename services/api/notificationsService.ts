// Notifications Service - API calls for the in-app notification feed.
// See "Notifications" folder in the WAMI Postman collection.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

export interface ApiNotification {
  id: string | number;
  title?: string;
  body?: string;
  message?: string;
  type?: string;
  read_at?: string | null;
  is_read?: boolean;
  created_at?: string;
  [key: string]: any;
}

// GET /v1/notifications?page=
export const getNotifications = async (params?: {
  page?: number;
}): Promise<ApiResponse<PaginatedResponse<ApiNotification> | ApiNotification[]>> => {
  return apiClient.get(API_ENDPOINTS.NOTIFICATIONS.LIST, { params });
};

// GET /v1/notifications/unread-count
export const getUnreadCount = async (): Promise<ApiResponse<{ count: number }>> => {
  return apiClient.get(API_ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);
};

// POST /v1/notifications/:id/read
export const markNotificationRead = async (
  id: string | number
): Promise<ApiResponse<null>> => {
  return apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
};

// POST /v1/notifications/read-all
export const markAllNotificationsRead = async (): Promise<ApiResponse<null>> => {
  return apiClient.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ);
};

/** Push and email switches per category, such as { new_message: { push: true, email: false } }. */
export type NotificationSettings = Record<string, { push?: boolean; email?: boolean }>;

// GET /settings/notifications. Read loosely: the switches may sit under `settings` or be the body itself.
export const getNotificationSettings = async (): Promise<NotificationSettings> => {
  const res = await apiClient.get<any>(API_ENDPOINTS.NOTIFICATIONS.SETTINGS);
  const raw: any = res.data?.settings ?? res.data ?? {};
  const out: NotificationSettings = {};
  Object.keys(raw).forEach((key) => {
    const v = raw[key];
    if (v && typeof v === 'object' && ('push' in v || 'email' in v)) out[key] = { push: !!v.push, email: !!v.email };
  });
  return out;
};

// PATCH /settings/notifications  { settings: { category: { push, email } } }
export const updateNotificationSettings = async (settings: NotificationSettings): Promise<ApiResponse<any>> => {
  return apiClient.patch(API_ENDPOINTS.NOTIFICATIONS.SETTINGS, { settings });
};
