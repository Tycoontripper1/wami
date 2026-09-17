// Chat Service - API calls for messaging and conversations.
// See "Messaging" folder in the WAMI Postman collection (`/v1/messages/...`).
//
// This previously targeted an un-versioned `/conversations` shape that
// appears nowhere in the collection — rewritten to match the real paths.
// See docs/API-AUDIT-02-MARKETPLACE-AND-BEYOND.md §3.7.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse, PaginatedResponse } from './types';

export interface ApiConversation {
  id: string | number;
  recipient_id?: string | number;
  last_message?: string;
  unread_count?: number;
  [key: string]: any;
}

export interface ApiMessage {
  id: string | number;
  conversation_id?: string | number;
  sender_id?: string | number;
  body: string;
  created_at?: string;
  [key: string]: any;
}

// GET /v1/messages/conversations?page=
export const getConversations = async (params?: {
  page?: number;
}): Promise<ApiResponse<PaginatedResponse<ApiConversation> | ApiConversation[]>> => {
  return apiClient.get(API_ENDPOINTS.MESSAGES.CONVERSATIONS, { params });
};

// POST /v1/messages/conversations  { recipient_id, body } — starts a
// conversation with a first message (the collection has no "create empty
// conversation" endpoint, so a conversation and its first message are one
// call).
export const startConversation = async (
  recipientId: string | number,
  body: string
): Promise<ApiResponse<ApiConversation>> => {
  return apiClient.post(API_ENDPOINTS.MESSAGES.CONVERSATIONS, {
    recipient_id: recipientId,
    body,
  });
};

// GET /v1/messages/conversations/:id — NOT in the collection at all; there is
// no documented way to fetch a conversation's message history (only list
// conversations, send-into, mark-read, unread-count). This GETs the same URL
// the collection uses for POST-to-send as the most likely candidate. Ask
// backend to confirm the real "load messages" contract before relying on
// this — see docs/API-AUDIT-02-MARKETPLACE-AND-BEYOND.md §3.7.
export const getMessages = async (
  conversationId: string | number
): Promise<ApiResponse<ApiMessage[]>> => {
  return apiClient.get(API_ENDPOINTS.MESSAGES.BY_ID(conversationId));
};

// POST /v1/messages/conversations/:id  { body } — send a message into an
// existing conversation (the collection reuses the conversation's own URL
// for sending, there is no separate .../messages sub-resource).
export const sendMessage = async (
  conversationId: string | number,
  body: string
): Promise<ApiResponse<ApiMessage>> => {
  return apiClient.post(API_ENDPOINTS.MESSAGES.BY_ID(conversationId), { body });
};

// POST /v1/messages/conversations/:id/read
export const markConversationRead = async (
  conversationId: string | number
): Promise<ApiResponse<null>> => {
  return apiClient.post(API_ENDPOINTS.MESSAGES.MARK_READ(conversationId));
};

// GET /v1/messages/unread-count
export const getUnreadCount = async (): Promise<ApiResponse<{ count: number }>> => {
  return apiClient.get(API_ENDPOINTS.MESSAGES.UNREAD_COUNT);
};
