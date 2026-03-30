// Chat Service - API calls for messaging and conversations

import { Conversation, Message } from '@/types/payment';
import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse } from './types';

export interface SendMessageParams {
  text?: string;
  type?: 'text' | 'price_proposal' | 'payment_request' | 'system';
  priceProposal?: {
    amount: number;
    currency: string;
    service: string;
  };
}

// Get all conversations for current user
export const getConversations = async (): Promise<ApiResponse<Conversation[]>> => {
  return apiClient.get(API_ENDPOINTS.CHAT.CONVERSATIONS);
};

// Get conversation by ID
export const getConversationById = async (
  id: string
): Promise<ApiResponse<Conversation>> => {
  return apiClient.get(API_ENDPOINTS.CHAT.BY_ID(id));
};

// Get messages for a conversation
export const getMessages = async (
  conversationId: string
): Promise<ApiResponse<Message[]>> => {
  return apiClient.get(API_ENDPOINTS.CHAT.MESSAGES(conversationId));
};

// Send message
export const sendMessage = async (
  conversationId: string,
  data: SendMessageParams
): Promise<ApiResponse<Message>> => {
  return apiClient.post(API_ENDPOINTS.CHAT.SEND_MESSAGE(conversationId), data);
};

// Mark message as read
export const markMessageAsRead = async (
  messageId: string
): Promise<ApiResponse<void>> => {
  return apiClient.patch(API_ENDPOINTS.CHAT.MARK_READ(messageId));
};

// Create or get conversation with a creative
export const startConversation = async (
  creativeId: string
): Promise<ApiResponse<Conversation>> => {
  // In real API, this would create a new conversation or return existing one
  return apiClient.post(API_ENDPOINTS.CHAT.CONVERSATIONS, { creativeId });
};
