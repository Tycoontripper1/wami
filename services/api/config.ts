// API Configuration
// Switch between mock and real API by changing these values

// ============================================
// IMPORTANT: When real backend is ready
// ============================================
// 1. Change API_BASE_URL to your backend URL
// 2. Set USE_MOCK_API to false
// 3. Verify response formats match (adjust services if needed)

export const API_CONFIG = {
  // Base URL for API calls
  // Mock: local/simulated, Real: https://api.yourbackend.com
  BASE_URL: 'https://api.joinwami.com', // Production API
  
  // Enable/Disable mock API mode
  USE_MOCK: true, // Set to false when using real backend
  
  // Mock API settings
  MOCK_DELAY_MS: 1000, // Simulated network delay (500-2000ms recommended)
  
  // Request timeout
  TIMEOUT_MS: 30000, // 30 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
  
  // API versioning
  API_VERSION: 'v1',
} as const;

// API Endpoints structure (will work with both mock and real)
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGN_IN: '/auth/signin',
    SIGN_UP: '/auth/signup',
    SIGN_OUT: '/auth/signout',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh',
    // Sign-up flow
    SEND_CODE: '/auth/send-code',
    VERIFY_CODE: '/auth/verify-code',
    COMPLETE_SIGNUP: '/auth/complete',
  },
  
  // User Profile
  PROFILE: {
    GET: '/profile',
    UPDATE: '/profile/update',
    PASSWORD: '/profile/password',
    DEACTIVATE: '/profile/deactivate',
    DELETE: '/profile/delete',
    IMAGE: '/profile/image',
    GET_BY_ID: (userId: string) => `/profile/${userId}`,
  },

  
  // Creatives
  CREATIVES: {
    LIST: '/creatives',
    SEARCH: '/creatives/search',
    FEATURED: '/creatives/featured',
    NEARBY: '/creatives/nearby',
    BY_ID: (id: string) => `/creatives/${id}`,
    BY_CATEGORY: (category: string) => `/creatives/category/${category}`,
    BY_REGION: (region: string) => `/creatives/region/${region}`,
  },
  
  // Bookings
  BOOKINGS: {
    LIST: '/bookings',
    CREATE: '/bookings',
    BY_ID: (id: string) => `/bookings/${id}`,
    UPDATE: (id: string) => `/bookings/${id}`,
    COMPLETE: (id: string) => `/bookings/${id}/complete`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
  },
  
  // Wallet & Payments
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/wallet/transactions',
    DEPOSIT: '/wallet/deposit',
    WITHDRAW: '/wallet/withdraw',
    TRANSFER: '/wallet/transfer',
  },
  
  // Chat & Messaging
  CHAT: {
    CONVERSATIONS: '/conversations',
    BY_ID: (id: string) => `/conversations/${id}`,
    MESSAGES: (id: string) => `/conversations/${id}/messages`,
    SEND_MESSAGE: (id: string) => `/conversations/${id}/messages`,
    MARK_READ: (messageId: string) => `/messages/${messageId}/read`,
  },
  
  // Products
  PRODUCTS: {
    LIST: '/products',
    FEATURED: '/products/featured',
    BY_ID: (id: string) => `/products/${id}`,
    BY_CATEGORY: (category: string) => `/products/category/${category}`,
  },
  
  // Instagram Integration
  INSTAGRAM: {
    CONNECT: '/instagram/connect',
    DISCONNECT: '/instagram/disconnect',
    GET_PROFILE: '/instagram/profile',
    GET_POSTS: '/instagram/posts',
  },
  
  // Account Setup & Onboarding
  ACCOUNT: {
    CATEGORIES: '/account/categories',
    SETUP_OPTIONS: '/account/setup-options',
    SETUP: '/account/setup',
    STATUS: '/account/setup-status',
    UPDATE: '/account/update',
  },
} as const;


// Helper to build full URL
export const buildUrl = (endpoint: string): string => {
  if (API_CONFIG.USE_MOCK) {
    return endpoint; // Mock handlers use endpoint patterns
  }
  return `${API_CONFIG.BASE_URL}/api/${API_CONFIG.API_VERSION}${endpoint}`;
};
