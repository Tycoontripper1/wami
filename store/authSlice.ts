import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface User {
  id: number | string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  username: string;
  phone?: string | null;
  account_type?: string;
  discovery_preference?: string;
  offering_type?: string | null;
  profile_completed?: boolean;
  bio?: string | null;
  profile_image?: string | null;
  instagram_handle?: string | null;
  website?: string | null;
  availability?: any;
  visibility?: string;
  email_verified_at?: string;
  is_active?: boolean;
  last_login_at?: string;
  profile_completed_at?: string;
  created_at?: string;
  updated_at?: string;
  location?: {
    city: string;
    country: string;
    state?: string;
    latitude?: string;
    longitude?: string;
  };
  categories?: Array<{
    id: number;
    name: string;
    slug: string;
    icon: string;
  }>;
  // Aliases for legacy compatibility
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  dontShowSuccessAgain: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  dontShowSuccessAgain: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Sign In
    signInStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    signInSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    signInFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Sign Up
    signUpStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    signUpSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.error = null;
    },
    signUpFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    // Sign Out
    signOut: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
    },

    // Update User
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Clear Error
    clearError: (state) => {
      state.error = null;
    },

    // Set Don't Show Success Again
    setDontShowSuccessAgain: (state, action: PayloadAction<boolean>) => {
      state.dontShowSuccessAgain = action.payload;
    },

    // Restore Session (from AsyncStorage)
    restoreSession: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },

    // Password Reset
    resetPasswordStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    resetPasswordSuccess: (state) => {
      state.isLoading = false;
      state.error = null;
    },
    resetPasswordFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {
  signInStart,
  signInSuccess,
  signInFailure,
  signUpStart,
  signUpSuccess,
  signUpFailure,
  signOut,
  updateUser,
  clearError,
  setDontShowSuccessAgain,
  restoreSession,
  resetPasswordStart,
  resetPasswordSuccess,
  resetPasswordFailure,
} = authSlice.actions;

export default authSlice.reducer;
