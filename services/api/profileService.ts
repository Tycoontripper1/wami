import { User } from '@/store/authSlice';
import {
    AccountActionRequest,
    UpdatePasswordRequest,
    UpdateProfileRequest
} from '@/types/accountTypes';
import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse } from './types';

// Get current user profile
const getProfile = async (): Promise<ApiResponse<User>> => {
  return apiClient.get(API_ENDPOINTS.PROFILE.GET);
};

// Update current user profile
const updateProfile = async (
  data: UpdateProfileRequest
): Promise<ApiResponse<User>> => {
  return apiClient.post(API_ENDPOINTS.PROFILE.UPDATE, data);
};

// Update password
const updatePassword = async (
  data: UpdatePasswordRequest
): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.post(API_ENDPOINTS.PROFILE.PASSWORD, data);
};

// Deactivate account
const deactivateAccount = async (
  data: AccountActionRequest
): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.post(API_ENDPOINTS.PROFILE.DEACTIVATE, data);
};

// Delete account
const deleteAccount = async (
  data: AccountActionRequest
): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.delete(API_ENDPOINTS.PROFILE.DELETE, { body: data });
};

// Upload profile image
const uploadProfileImage = async (
  imageUri: string
): Promise<ApiResponse<{ profile_image: string }>> => {
  const formData = new FormData();
  
  // @ts-ignore
  formData.append('image', {
    uri: imageUri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  });

  return apiClient.post(API_ENDPOINTS.PROFILE.IMAGE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

// Delete profile image
const deleteProfileImage = async (): Promise<ApiResponse<{ message: string }>> => {
  return apiClient.delete(API_ENDPOINTS.PROFILE.IMAGE);
};

// Get another user's profile by ID
const getUserProfile = async (
  userId: string
): Promise<ApiResponse<User>> => {
  return apiClient.get(API_ENDPOINTS.PROFILE.GET_BY_ID(userId));
};

export const profileService = {
  getProfile,
  updateProfile,
  updatePassword,
  deactivateAccount,
  deleteAccount,
  uploadProfileImage,
  deleteProfileImage,
  getUserProfile,
};


