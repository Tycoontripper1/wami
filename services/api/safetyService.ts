// Report and block: the safety tools the stores require for anything people post.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse } from './types';

export type ReportTarget = 'user' | 'listing' | 'post' | 'message' | 'review';
export type ReportReason = 'spam' | 'scam' | 'inappropriate' | 'fake' | 'other';

// POST /reports  (reporting the same thing twice counts once)
export const reportContent = async (payload: {
  target_type: ReportTarget;
  target_id: string | number;
  reason: ReportReason;
  note?: string;
}): Promise<ApiResponse<any>> => apiClient.post(API_ENDPOINTS.SAFETY.REPORTS, payload);

// GET /blocks
export const getBlocks = async (): Promise<ApiResponse<any>> => apiClient.get(API_ENDPOINTS.SAFETY.BLOCKS);

// POST /blocks  — stops messages both ways and hides the person from the feed
export const blockUser = async (userId: string | number, reason?: string): Promise<ApiResponse<any>> =>
  apiClient.post(API_ENDPOINTS.SAFETY.BLOCKS, { user_id: Number(userId), reason });

// DELETE /blocks/:id  (the block id or the blocked person's id)
export const unblockUser = async (id: string | number): Promise<ApiResponse<any>> =>
  apiClient.delete(API_ENDPOINTS.SAFETY.BLOCK_BY_ID(id));
