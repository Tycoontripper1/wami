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
  BASE_URL: 'https://api.joinwami.com/api/v1', // Production API
  
  // Enable/Disable mock API mode
  USE_MOCK: false, // Set to false when using real backend
  
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
    LOGIN: '/auth/login',
    // Sign-up flow: SEND_CODE -> VERIFY_CODE -> COMPLETE_SIGNUP
    SEND_CODE: '/auth/send-code',
    VERIFY_CODE: '/auth/verify-code',
    RESEND_CODE: '/auth/resend-code',
    COMPLETE_SIGNUP: '/auth/complete',
    // Password reset flow: FORGOT_PASSWORD -> (OTP) -> RESET_PASSWORD
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    // Not yet implemented by the backend — see docs/API-AUDIT-01-AUTH.md §3.1.
    // Do not call these until they exist; they will 404.
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH_TOKEN: '/auth/refresh',
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


  // Discovery (feed, near-you, search, saved, swipe)
  DISCOVERY: {
    FEED: '/discovery/feed',
    NEAR_YOU: '/discovery/near-you',
    MY_ITEMS: '/discovery/my-items',
    SEARCH: '/discovery/search',
    SAVED: '/discovery/saved',
    UNSAVE: (offeringId: string | number) => `/discovery/saved/${offeringId}`,
    SWIPE: '/discovery/swipe',
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
    BY_ID: (id: string | number) => `/bookings/${id}`,
    UPDATE: (id: string) => `/bookings/${id}`,
    COMPLETE: (id: string) => `/bookings/${id}/complete`,
    CANCEL: (id: string) => `/bookings/${id}/cancel`,
    STATUS: (id: string | number) => `/bookings/${id}/status`,
    MILESTONES: (id: string | number) => `/bookings/${id}/milestones`,
    RELEASE_MILESTONE: (bookingId: string | number, milestoneId: string | number) =>
      `/bookings/${bookingId}/milestones/${milestoneId}/release`,
  },

  // Quotes
  QUOTES: {
    LIST: '/quotes',
    CREATE: '/quotes',
    RESPOND: (id: string | number) => `/quotes/${id}/respond`,
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
    CREATE: '/products',
    FEATURED: '/products/featured',
    BY_ID: (id: string) => `/products/${id}`,
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
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
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};
