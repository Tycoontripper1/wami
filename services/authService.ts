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

const STORAGE_KEYS = {
  USER: '@wami_user',
  TOKEN: '@wami_token',
  DONT_SHOW_SUCCESS: '@wami_dont_show_success',
};

/**
 * Keeps the backend's own error message when it sent one, and falls back to a
 * screen-appropriate message otherwise — without mislabelling a dropped
 * connection as (say) a wrong password.
 */
const toAuthError = (error: any, fallbackMessage: string): Error => {
  if (error?.code === 'NETWORK_ERROR') {
    return new Error('Could not reach the server. Check your connection and try again.');
  }
  const message = typeof error?.message === 'string' ? error.message.trim() : '';
  return new Error(message && message !== 'An error occurred' ? message : fallbackMessage);
};

/**
 * Auth endpoints return their payload at the top level (`{ message, user, access_token }`),
 * so they need `raw: true` — the client's default unwrap prefers `data.user` and would
 * throw the token away.
 */
const authPost = async (endpoint: string, body: any, fallbackMessage: string): Promise<any> => {
  try {
    const response = await apiClient.post<any>(endpoint, body, { raw: true });
    return response.data ?? {};
  } catch (error: any) {
    throw toAuthError(error, fallbackMessage);
  }
};

/** Normalises the various shapes a user object arrives in into our `User` model. */
const normalizeUser = (raw: any, fallbacks: Partial<User> = {}): User => ({
  ...raw,
  id: String(raw?.id ?? raw?._id ?? ''),
  email: raw?.email ?? fallbacks.email ?? '',
  first_name: raw?.first_name ?? raw?.firstName ?? fallbacks.first_name ?? '',
  last_name: raw?.last_name ?? raw?.lastName ?? fallbacks.last_name ?? '',
  username: raw?.username ?? fallbacks.username ?? '',
  profile_image: raw?.profile_image ?? raw?.avatar ?? null,
});

/** Persists a freshly issued session and arms the API client with the token. */
const persistSession = async (user: User, token: string): Promise<void> => {
  await AsyncStorage.multiSet([
    [STORAGE_KEYS.USER, JSON.stringify(user)],
    [STORAGE_KEYS.TOKEN, token],
  ]);
  apiClient.setAuthToken(token);
};

export const authService = {

  /**
   * Clears the local session. Must be called alongside the Redux `signOut()`
   * action — dispatching that alone leaves the token in AsyncStorage, and the
   * next cold start would silently restore the session.
   *
   * TODO: also revoke the token server-side once `POST /auth/logout` exists
   * (see docs/API-AUDIT-01-AUTH.md §3.1).
   */
  async signOut(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);
    // Clear token from API client
    apiClient.setAuthToken(null);
  },

  /**
   * Restore Session
   *
   * NOTE: this trusts the cached token without asking the backend whether it is
   * still valid, so a revoked/expired token lands the user in the app and then
   * fails on the first request. The global 401 handler registered in
   * `app/_layout.tsx` catches that and signs them back out. Once `GET /auth/me`
   * exists we should validate here instead (see docs/API-AUDIT-01-AUTH.md §3.1).
   */
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

  // ─── Forgot-Password / Reset-Password Flow ────────────────────────────────

  /**
   * Step 1 – Send forgot-password OTP to email.
   * POST /auth/forgot-password  { email }
   * Returns: { token: string }
   */
  async forgotPassword(email: string): Promise<{ token: string; message: string }> {
    const json = await authPost(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email },
      'Could not send reset code. Please check your email.'
    );
    const token: string = json.token ?? json.data?.token;
    if (!token) throw new Error('No token returned from server.');
    return { token, message: json.message };
  },

  /**
   * Step 2 – Reset password using OTP + token.
   * POST /auth/reset-password  { token, otp, password, password_confirmation }
   */
  async resetPassword(
    token: string,
    otp: string,
    password: string,
    password_confirmation: string
  ): Promise<{ message: string }> {
    const json = await authPost(
      API_ENDPOINTS.AUTH.RESET_PASSWORD,
      { token, otp, password, password_confirmation },
      'Failed to reset password.'
    );
    return { message: json.message };
  },

  // ─── Login ────────────────────────────────────────────────────────────────

  /**
   * POST /auth/login  { email, password }
   * Response shape: { message, user: { id, first_name, ... }, access_token }
   */
  async signIn(email: string, password: string): Promise<{ user: User; token: string; message: string }> {
    const json = await authPost(
      API_ENDPOINTS.AUTH.LOGIN,
      { email, password },
      'Invalid email or password.'
    );

    const authToken: string = json.access_token ?? json.token ?? json.data?.access_token;
    if (!authToken) throw new Error('No token returned from server.');

    const user = normalizeUser(json.user ?? json.data?.user ?? json.data ?? json, { email });
    await persistSession(user, authToken);

    return { user, token: authToken, message: json.message };
  },

  // ─── Sign-Up Flow (3 steps) ───────────────────────────────────────────────

  /**
   * Step 1 – Send OTP to email.
   * POST /auth/send-code  { email }
   * Returns: { token: string }
   */
  async sendSignUpCode(email: string): Promise<{ token: string; message: string }> {
    const json = await authPost(
      API_ENDPOINTS.AUTH.SEND_CODE,
      { email },
      'Failed to send verification code.'
    );
    // Support both { token } and { data: { token } } shapes
    const token: string = json.token ?? json.data?.token;
    if (!token) throw new Error('No token returned from server.');
    return { token, message: json.message };
  },

  /**
   * Step 2 – Verify OTP.
   * POST /auth/verify-code  { token, otp }
   * Returns: { token: string }  (server may issue a new token)
   */
  async verifySignUpCode(token: string, otp: string): Promise<{ token: string; message: string }> {
    const json = await authPost(
      API_ENDPOINTS.AUTH.VERIFY_CODE,
      { token, otp },
      'Invalid or expired code.'
    );
    const newToken: string = json.token ?? json.data?.token ?? token;
    return { token: newToken, message: json.message };
  },

  /**
   * Step 3 – Complete registration.
   * POST /auth/complete  { token, first_name, last_name, username, password, password_confirmation }
   * Response shape: { message, user: { id, first_name, ... }, access_token }
   */
  async completeSignUp(data: {
    token: string;
    first_name: string;
    last_name: string;
    username: string;
    password: string;
    password_confirmation: string;
  }): Promise<{ user: User; token: string; message: string }> {
    const json = await authPost(
      API_ENDPOINTS.AUTH.COMPLETE_SIGNUP,
      data,
      'Could not complete sign up.'
    );

    const authToken: string = json.access_token ?? json.token ?? json.data?.access_token;
    if (!authToken) throw new Error('No token returned from server.');

    const user = normalizeUser(json.user ?? json.data?.user ?? json.data ?? json, {
      first_name: data.first_name,
      last_name: data.last_name,
      username: data.username,
    });
    await persistSession(user, authToken);

    return { user, token: authToken, message: json.message };
  },

  /**
   * Resend verification code.
   * POST /auth/resend-code  { email }
   */
  async resendCode(email: string): Promise<{ message: string }> {
    const json = await authPost(
      API_ENDPOINTS.AUTH.RESEND_CODE,
      { email },
      'Failed to resend verification code.'
    );
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
