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
  //
  // NOTE: the WAMI Postman collection's own text documents a mixed scheme
  // (un-versioned auth/account/profile/discovery/products/etc., `v1`-prefixed
  // reviews/messages/notifications/seller/admin/webhooks). That was tried
  // literally — BASE_URL without `/v1`, `/v1` added per-endpoint where the
  // collection showed it — and disproved by live testing on-device: with
  // that split, `/v1/seller/analytics/*` and `/v1/notifications/*` resolved
  // (500 — found, backend error) while `/discovery/feed` 404'd (not found).
  // /discovery/feed is a pre-existing endpoint that worked before this
  // endpoint-map rewrite, when BASE_URL included `/v1` for literally
  // everything. So the real backend puts everything under `/api/v1/` and the
  // collection's "some routes have no v1" documentation is stale — reverted
  // to a single consistent `/api/v1` base. See
  // docs/API-AUDIT-03-WIRING-COMPLETE-AND-REMAINING.md for the full history;
  // ask backend to confirm this is now uniformly correct.
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

  // Offerings — the generic listing a creative publishes (service or product).
  // See "Offerings" folder in the collection.
  OFFERINGS: {
    LIST: '/offerings',
    CREATE: '/offerings',
    BULK_PUBLISH: '/offerings/bulk/publish',
    BULK_DELETE: '/offerings/bulk/delete',
  },

  // Cart & Orders — "Marketplace - Cart & Orders" folder
  CART: {
    GET: '/cart',
  },
  ORDERS: {
    CREATE: '/orders',
  },

  // Payments — "Payments" folder. order_id + gateway ("paystack") in, a
  // reference to confirm with VERIFY out. See docs/API-AUDIT-02… §3.3 — the
  // exact initialize response shape (authorization_url vs reference only) is
  // unconfirmed; ask backend before relying on a specific field name.
  PAYMENTS: {
    INITIALIZE: '/payments/initialize',
    VERIFY: '/payments/verify',
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
    RESCHEDULE: (id: string | number) => `/bookings/${id}/reschedule`,
    CALENDAR: '/bookings/calendar',
  },

  // Quotes — NOT present in the WAMI Postman collection at all. Kept because
  // `quotesService.respondToQuote` is already wired into
  // app/quote-received/[id].tsx; ask backend to confirm these exist before
  // trusting them further. See docs/API-AUDIT-02… §2.4.
  QUOTES: {
    LIST: '/quotes',
    CREATE: '/quotes',
    RESPOND: (id: string | number) => `/quotes/${id}/respond`,
  },

  // Wallet — NOT in the collection under this name (no un-versioned /wallet/*
  // folder exists). Kept only because services/api/walletService.ts already
  // targets it; the collection's real wallet endpoints are under SELLER
  // below ("Payouts & Commission"). Ask backend which one is canonical — see
  // docs/API-AUDIT-02… §2.3. In particular there is no documented deposit
  // endpoint anywhere in the collection.
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/wallet/transactions',
    DEPOSIT: '/wallet/deposit',
    WITHDRAW: '/wallet/withdraw',
    TRANSFER: '/wallet/transfer',
  },

  // Seller wallet / payouts — "Payouts & Commission" + "Analytics & Reporting"
  // (seller-scoped part) folders. BASE_URL already supplies /v1 — see its
  // comment above; do not re-add a literal /v1/ here.
  SELLER: {
    WALLET: '/seller/wallet',
    TRANSACTIONS: '/seller/transactions',
    PAYOUT_REQUESTS: '/seller/payout-requests',
    SALES_ANALYTICS: '/seller/analytics/sales',
    TOP_PRODUCTS: '/seller/analytics/top-products',
  },

  // Reviews & Ratings
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    USER_RATING: (userId: string | number) => `/reviews/user/${userId}/rating`,
  },

  // Messaging — "Messaging" folder, distinct from the legacy un-versioned
  // CHAT block below which nothing in the collection documents.
  MESSAGES: {
    CONVERSATIONS: '/messages/conversations',
    BY_ID: (id: string | number) => `/messages/conversations/${id}`,
    MARK_READ: (id: string | number) => `/messages/conversations/${id}/read`,
    UNREAD_COUNT: '/messages/unread-count',
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    UNREAD_COUNT: '/notifications/unread-count',
    MARK_READ: (id: string | number) => `/notifications/${id}/read`,
    MARK_ALL_READ: '/notifications/read-all',
  },

  // Chat & Messaging — legacy un-versioned shape. Nothing in the collection
  // documents these paths; MESSAGES above is the collection-accurate one.
  // Kept only because chatService.ts historically targeted it — do not wire
  // new screens to this block. See docs/API-AUDIT-02… §3.7.
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
    BULK_UPDATE: '/products/bulk/update',
    BULK_DELETE: '/products/bulk/delete',
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
