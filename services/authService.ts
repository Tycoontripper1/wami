import { User } from '@/store/authSlice';
import {
  Category,
  SetupAccountRequest,
  SetupOption,
  SetupStatus
} from '@/types/accountTypes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from './api/client';
import { API_ENDPOINTS } from './api/config';
import { mockDelay } from './api/mock/mockHelpers';

const PROD_BASE = 'https://api.joinwami.com/api/v1';

const STORAGE_KEYS = {
  USER: '@wami_user',
  TOKEN: '@wami_token',
  DONT_SHOW_SUCCESS: '@wami_dont_show_success',
};

// Mock user database (in real app, this would be your backend)
// Pre-populated with test user for easy login
const mockUsers: { [email: string]: any } = {
  'oayodeji27@gmail.com': {
    id: 'test_user_001',
    email: 'oayodeji27@gmail.com',
    firstName: 'Ayodeji',
    lastName: 'Oluwaseun',
    username: 'ayodeji',
    password: 'Password@1',
  },
};

export const authService = {

  // Sign Up
  async signUp(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    username: string;
  }): Promise<{ user: User; token: string }> {
    await mockDelay(); // Simulate network delay

    // Check if user already exists
    if (mockUsers[data.email.toLowerCase()]) {
      throw new Error('An account with this email already exists.');
    }

    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newUser: User = {
      id: userId,
      email: data.email.toLowerCase(),
      first_name: data.firstName,
      last_name: data.lastName,
      username: data.username,
    };

    // Store user with password in mock database
    mockUsers[data.email.toLowerCase()] = {
      ...newUser,
      password: data.password,
    };

    // Generate mock token
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store in AsyncStorage
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser));
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token);

    // Set token in API client
    apiClient.setAuthToken(token);

    return { user: newUser, token };
  },

  // Verify Email Code (mock)
  async verifyEmailCode(email: string, code: string): Promise<boolean> {
    await mockDelay(1000);
    // In real app, verify with backend
    // For now, accept any 6-digit code
    return code.length === 6;
  },

  // Sign Out
  async signOut(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);
    // Clear token from API client
    apiClient.setAuthToken(null);
  },

  // Restore Session
  async restoreSession(): Promise<{ user: User; token: string } | null> {
    try {
      const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);

      if (userJson && token) {
        const user = JSON.parse(userJson);
        // Restore token in API client
        apiClient.setAuthToken(token);
        return { user, token };
      }

      return null;
    } catch (error) {
      console.error('Error restoring session:', error);
      return null;
    }
  },

  // Get Don't Show Success preference
  async getDontShowSuccess(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.DONT_SHOW_SUCCESS);
      return value === 'true';
    } catch {
      return false;
    }
  },

  // Set Don't Show Success preference
  async setDontShowSuccess(value: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DONT_SHOW_SUCCESS, value.toString());
  },

  // Update User Profile
  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    await mockDelay(1000);
    
    // In real app, this would use the profileService
    // For now, keep existing logic
    const userJson = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    if (userJson) {
      const user = JSON.parse(userJson);
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      return updatedUser;
    }
    
    throw new Error('User not found');
  },

  // Connect Instagram (mock)
  async connectInstagram(userId: string): Promise<void> {
    await mockDelay(1500);
    // In real app, handle Instagram OAuth
    console.log('Instagram connected for user:', userId);
  },

  // ─── Real Forgot-Password / Reset-Password Flow ──────────────────────────

  /**
   * Step 1 – Send forgot-password OTP to email.
   * POST /api/v1/auth/forgot-password  { email }
   * Returns: { token: string }
   */
  async forgotPassword(email: string): Promise<{ token: string; message: string }> {
    const res = await fetch(`${PROD_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Could not send reset code. Please check your email.');
    }
    const token: string = json.token ?? json.data?.token;
    if (!token) throw new Error('No token returned from server.');
    return { token, message: json.message };
  },

  /**
   * Step 2 – Reset password using OTP + token.
   * POST /api/v1/auth/reset-password  { token, otp, password, password_confirmation }
   */
  async resetPassword(
    token: string,
    otp: string,
    password: string,
    password_confirmation: string
  ): Promise<{ message: string }> {
    const res = await fetch(`${PROD_BASE}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, otp, password, password_confirmation }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to reset password.');
    }
    return { message: json.message };
  },

  // ─── Real Login ───────────────────────────────────────────────────────────

  /**
   * POST /api/v1/auth/login  { email, password }
   * Returns: { user, token }
   */
  async signIn(email: string, password: string): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${PROD_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Invalid email or password.');
    }

    // Real API response shape:
    // { message, user: { id, first_name, last_name, ... }, access_token }
    const authToken: string = json.access_token ?? json.token ?? json.data?.access_token;
    const rawUser = json.user ?? json.data?.user ?? json.data ?? json;

    const user: User = {
      ...rawUser,
      id: String(rawUser.id ?? rawUser._id ?? ''),
      email: rawUser.email ?? email,
      first_name: rawUser.first_name ?? rawUser.firstName ?? '',
      last_name: rawUser.last_name ?? rawUser.lastName ?? '',
      username: rawUser.username ?? '',
      profile_image: rawUser.profile_image ?? rawUser.avatar ?? null,
    };

    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
    apiClient.setAuthToken(authToken);

    return { user, token: authToken, message: json.message };
  },

  // ─────────────────────────────────────────────────────────────────────────

  // ─── Real Sign-Up Flow (3 steps) ──────────────────────────────────────────

  /**
   * Step 1 – Send OTP to email.
   * POST /api/v1/auth/send-code  { email }
   * Returns: { token: string }
   */
  async sendSignUpCode(email: string): Promise<{ token: string; message: string }> {
    const res = await fetch(`${PROD_BASE}/auth/send-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to send verification code.');
    }
    // Support both { token } and { data: { token } } shapes
    const token: string = json.token ?? json.data?.token;
    if (!token) throw new Error('No token returned from server.');
    return { token, message: json.message };
  },

  /**
   * Step 2 – Verify OTP.
   * POST /api/v1/auth/verify-code  { token, otp }
   * Returns: { token: string }  (server may issue a new token)
   */
  async verifySignUpCode(token: string, otp: string): Promise<{ token: string; message: string }> {
    const res = await fetch(`${PROD_BASE}/auth/verify-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, otp }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Invalid or expired code.');
    }
    const newToken: string = json.token ?? json.data?.token ?? token;
    return { token: newToken, message: json.message };
  },

  /**
   * Step 3 – Complete registration.
   * POST /api/v1/auth/complete  { token, first_name, last_name, username, password, password_confirmation }
   * Returns: { user, token }
   */
  async completeSignUp(data: {
    token: string;
    first_name: string;
    last_name: string;
    username: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ user: User; token: string; message: string }> {
    const res = await fetch(`${PROD_BASE}/auth/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Could not complete sign up.');
    }

    // Real API response shape:
    // { message, user: { id, first_name, last_name, ... }, access_token }
    const authToken: string = json.access_token ?? json.token ?? json.data?.access_token;
    const rawUser = json.user ?? json.data?.user ?? json.data ?? json;

    const user: User = {
      ...rawUser,
      id: String(rawUser.id ?? rawUser._id ?? ''),
      email: rawUser.email ?? '',
      first_name: rawUser.first_name ?? rawUser.firstName ?? data.first_name,
      last_name: rawUser.last_name ?? rawUser.lastName ?? data.last_name,
      username: rawUser.username ?? data.username,
      profile_image: rawUser.profile_image ?? rawUser.avatar ?? null,
    };

    // Persist session
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    await AsyncStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
    apiClient.setAuthToken(authToken);

    return { user, token: authToken, message: json.message };
  },

  /**
   * Resend verification code.
   * POST /api/v1/auth/resend-code  { email }
   * Returns: { message: string }
   */
  async resendCode(email: string): Promise<{ message: string }> {
    const res = await fetch(`${PROD_BASE}/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'Failed to resend verification code.');
    }
    return { message: json.message };
  },

  // ─── Account Setup & Onboarding ───────────────────────────────────────────

  /**
   * Get account categories.
   * GET /account/categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await apiClient.get<Category[]>(API_ENDPOINTS.ACCOUNT.CATEGORIES);
    return response.data;
  },

  /**
   * Get account setup options.
   * GET /account/setup-options
   */
  async getSetupOptions(): Promise<SetupOption[]> {
    const response = await apiClient.get<SetupOption[]>(API_ENDPOINTS.ACCOUNT.SETUP_OPTIONS);
    return response.data;
  },

  /**
   * Setup account.
   * POST /account/setup
   */
  async setupAccount(data: SetupAccountRequest): Promise<{ message: string; success: boolean }> {
    const response = await apiClient.post<any>(API_ENDPOINTS.ACCOUNT.SETUP, data);
    return {
      message: response.message || 'Account setup successful',
      success: response.success,
    };
  },

  /**
   * Get account setup status.
   * GET /account/setup-status
   */
  async getSetupStatus(): Promise<SetupStatus> {
    const response = await apiClient.get<SetupStatus>(API_ENDPOINTS.ACCOUNT.STATUS);
    return response.data;
  },

  /**
   * Update account setup.
   * PATCH /account/update
   */
  async updateAccount(data: Partial<SetupAccountRequest>): Promise<{ message: string; success: boolean }> {
    const response = await apiClient.patch<any>(API_ENDPOINTS.ACCOUNT.UPDATE, data);
    return {
      message: response.message || 'Account updated successfully',
      success: response.success,
    };
  },

};


 