// Mock API Request Handlers
// This file routes mock API requests to appropriate handlers

import { API_ENDPOINTS } from '../config';
import { ApiError, ApiResponse, HttpStatusCode } from '../types';

// Import mock data
import { MOCK_CREATIVES, getCreativeById, getFeaturedCreatives, getNearbyCreatives, searchCreatives } from '@/data/creatives';
import { MOCK_BOOKINGS, createMockBooking, getBookingById, getBookingsByUser } from '@/data/mockBookings';
import { MOCK_MESSAGES, createMockMessage, getConversationsByUser, getMessagesByConversation } from '@/data/mockMessages';
import { MOCK_PRODUCTS, getFeaturedProducts, getProductById, searchProducts } from '@/data/mockProducts';
import { MOCK_TRANSACTIONS, MOCK_WALLET_BALANCE, createMockTransaction, getTransactionsByUser } from '@/data/mockTransactions';
import { paginate, sortArray } from './mockHelpers';

interface MockRequestConfig {
  body?: any;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

// Main mock API handler
export async function mockApiHandler<T = any>(
  method: string,
  endpoint: string,
  config?: MockRequestConfig
): Promise<ApiResponse<T>> {
  try {
    // Route to appropriate handler
    const handler = findHandler(method, endpoint);
    
    if (!handler) {
      throw createError('NOT_FOUND', `Endpoint ${method} ${endpoint} not found`, HttpStatusCode.NOT_FOUND);
    }

    const result = await handler(config);
    return createSuccessResponse<T>(result);
  } catch (error: any) {
    if (error.code) {
      throw error; // Already an ApiError
    }
    throw createError('INTERNAL_ERROR', error.message || 'Internal server error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
}

// Route matcher
function findHandler(method: string, endpoint: string): ((config?: MockRequestConfig) => Promise<any>) | null {
  // Creatives
  if (method === 'GET' && endpoint === API_ENDPOINTS.CREATIVES.LIST) return handleGetCreatives;
  if (method === 'GET' && endpoint === API_ENDPOINTS.CREATIVES.SEARCH) return handleSearchCreatives;
  if (method === 'GET' && endpoint === API_ENDPOINTS.CREATIVES.FEATURED) return handleGetFeaturedCreatives;
  if (method === 'GET' && endpoint === API_ENDPOINTS.CREATIVES.NEARBY) return handleGetNearbyCreatives;
  if (method === 'GET' && endpoint.startsWith('/creatives/') && !endpoint.includes('/category') && !endpoint.includes('/region')) {
    return (config) => handleGetCreativeById(endpoint.split('/').pop()!);
  }

  // Bookings
  if (method === 'GET' && endpoint === API_ENDPOINTS.BOOKINGS.LIST) return handleGetBookings;
  if (method === 'POST' && endpoint === API_ENDPOINTS.BOOKINGS.CREATE) return handleCreateBooking;
  if (method === 'GET' && endpoint.match(/^\/bookings\/[^/]+$/)) {
    return (config) => handleGetBookingById(endpoint.split('/').pop()!);
  }
  if (method === 'PATCH' && endpoint.match(/^\/bookings\/[^/]+$/)) {
    return (config) => handleUpdateBooking(endpoint.split('/').pop()!, config);
  }

  // Wallet
  if (method === 'GET' && endpoint === API_ENDPOINTS.WALLET.BALANCE) return handleGetWalletBalance;
  if (method === 'GET' && endpoint === API_ENDPOINTS.WALLET.TRANSACTIONS) return handleGetTransactions;
  if (method === 'POST' && endpoint === API_ENDPOINTS.WALLET.DEPOSIT) return handleDeposit;
  if (method === 'POST' && endpoint === API_ENDPOINTS.WALLET.WITHDRAW) return handleWithdraw;
  if (method === 'POST' && endpoint === API_ENDPOINTS.WALLET.TRANSFER) return handleTransfer;

  // Chat
  if (method === 'GET' && endpoint === API_ENDPOINTS.CHAT.CONVERSATIONS) return handleGetConversations;
  if (method === 'GET' && endpoint.match(/^\/conversations\/[^/]+\/messages$/)) {
    return (config) => handleGetMessages(endpoint.split('/')[2]);
  }
  if (method === 'POST' && endpoint.match(/^\/conversations\/[^/]+\/messages$/)) {
    return (config) => handleSendMessage(endpoint.split('/')[2], config);
  }

  // Discovery
  if (method === 'GET' && endpoint === API_ENDPOINTS.DISCOVERY.FEED) return handleGetDiscoveryFeed;
  if (method === 'GET' && endpoint === API_ENDPOINTS.DISCOVERY.NEAR_YOU) return handleGetNearYouOfferings;
  if (method === 'GET' && endpoint === API_ENDPOINTS.DISCOVERY.SAVED) return handleGetSavedOfferings;
  if (method === 'POST' && endpoint === API_ENDPOINTS.DISCOVERY.SAVED) return handleSaveOffering;
  if (method === 'DELETE' && endpoint.startsWith('/discovery/saved/')) {
    return (config) => handleUnsaveOffering(endpoint.split('/').pop()!);
  }
  if (method === 'POST' && endpoint === API_ENDPOINTS.DISCOVERY.SWIPE) return handleSwipeOffering;

  // Products
  if (method === 'GET' && endpoint === API_ENDPOINTS.PRODUCTS.LIST) return handleGetProducts;
  if (method === 'GET' && endpoint === API_ENDPOINTS.PRODUCTS.FEATURED) return handleGetFeaturedProducts;
  if (method === 'GET' && endpoint.startsWith('/products/') && !endpoint.includes('/category')) {
    return (config) => handleGetProductById(endpoint.split('/').pop()!);
  }

  // Account & Onboarding
  if (method === 'GET' && endpoint === API_ENDPOINTS.ACCOUNT.CATEGORIES) return handleGetCategories;
  if (method === 'GET' && endpoint === API_ENDPOINTS.ACCOUNT.SETUP_OPTIONS) return handleGetSetupOptions;
  if (method === 'POST' && endpoint === API_ENDPOINTS.ACCOUNT.SETUP) return handleAccountSetup;
  if (method === 'GET' && endpoint === API_ENDPOINTS.ACCOUNT.STATUS) return handleGetSetupStatus;
  if (method === 'PATCH' && endpoint === API_ENDPOINTS.ACCOUNT.UPDATE) return handleUpdateAccount;
  
  // Profile
  if (method === 'GET' && endpoint === API_ENDPOINTS.PROFILE.GET) return handleGetProfile;
  if (method === 'POST' && endpoint === API_ENDPOINTS.PROFILE.UPDATE) return handleUpdateProfile;
  if (method === 'POST' && endpoint === API_ENDPOINTS.PROFILE.IMAGE) return handleUploadImage;

  return null;
}

// ============================================
// CREATIVE HANDLERS
// ============================================

async function handleGetCreatives(config?: MockRequestConfig): Promise<any> {
  const { page = 1, limit = 10, region, category } = config?.params || {};
  let creatives = [...MOCK_CREATIVES];

  if (region) {
    creatives = creatives.filter(c => c.location.region === region);
  }
  if (category) {
    creatives = creatives.filter(c => c.category === category);
  }

  return paginate(creatives, page, limit);
}

async function handleSearchCreatives(config?: MockRequestConfig): Promise<any> {
  const { query, page = 1, limit = 10 } = config?.params || {};
  const results = query ? searchCreatives(query) : MOCK_CREATIVES;
  return paginate(results, page, limit);
}

async function handleGetFeaturedCreatives(config?: MockRequestConfig): Promise<any> {
  const { region } = config?.params || {};
  const featured = getFeaturedCreatives(region);
  return featured;
}

async function handleGetNearbyCreatives(config?: MockRequestConfig): Promise<any> {
  const { city, page = 1, limit = 10 } = config?.params || {};
  if (!city) {
    throw createError('BAD_REQUEST', 'City parameter is required', HttpStatusCode.BAD_REQUEST);
  }
  const nearby = getNearbyCreatives(city);
  return paginate(nearby, page, limit);
}

async function handleGetCreativeById(id: string): Promise<any> {
  const creative = getCreativeById(id);
  if (!creative) {
    throw createError('NOT_FOUND', 'Creative not found', HttpStatusCode.NOT_FOUND);
  }
  return creative;
}

// ============================================
// DISCOVERY HANDLERS
// ============================================

function creativeToOffering(creative: (typeof MOCK_CREATIVES)[number]): any {
  return {
    id: creative.id,
    offering_id: creative.id,
    type: 'creative',
    name: creative.name,
    role: creative.role,
    category: creative.category,
    rating: creative.rating,
    reviews: creative.reviews,
    images: creative.images,
    image: creative.images?.[0],
    location: { city: creative.location.city, region: creative.location.region },
  };
}

function productToOffering(product: (typeof MOCK_PRODUCTS)[number]): any {
  return {
    id: product.id,
    offering_id: product.id,
    type: 'product',
    name: product.name,
    title: product.name,
    category: product.category,
    price: product.price,
    currency: product.currency,
    rating: product.rating,
    reviews: product.reviews,
    images: product.images,
    image: product.images?.[0],
    tags: product.tags,
  };
}

async function handleGetDiscoveryFeed(config?: MockRequestConfig): Promise<any> {
  const { page = 1, limit = 10 } = config?.params || {};
  const offerings = [
    ...MOCK_CREATIVES.map(creativeToOffering),
    ...MOCK_PRODUCTS.map(productToOffering),
  ];
  return paginate(offerings, page, limit);
}

async function handleGetNearYouOfferings(config?: MockRequestConfig): Promise<any> {
  const { page = 1, limit = 10 } = config?.params || {};
  const nearby = getNearbyCreatives('Lagos').map(creativeToOffering);
  return paginate(nearby, page, limit);
}

const savedOfferingIds = new Set<string>();

async function handleGetSavedOfferings(config?: MockRequestConfig): Promise<any> {
  const { page = 1, limit = 10 } = config?.params || {};
  const allOfferings = [
    ...MOCK_CREATIVES.map(creativeToOffering),
    ...MOCK_PRODUCTS.map(productToOffering),
  ];
  const saved = allOfferings.filter(o => savedOfferingIds.has(String(o.id)));
  return paginate(saved, page, limit);
}

async function handleSaveOffering(config?: MockRequestConfig): Promise<any> {
  const { offering_id } = config?.body || {};
  if (!offering_id) {
    throw createError('BAD_REQUEST', 'offering_id is required', HttpStatusCode.BAD_REQUEST);
  }
  savedOfferingIds.add(String(offering_id));
  return { offering_id, is_saved: true };
}

async function handleUnsaveOffering(offeringId: string): Promise<any> {
  savedOfferingIds.delete(offeringId);
  return null;
}

async function handleSwipeOffering(config?: MockRequestConfig): Promise<any> {
  const { offering_id, action } = config?.body || {};
  if (!offering_id || !action) {
    throw createError('BAD_REQUEST', 'offering_id and action are required', HttpStatusCode.BAD_REQUEST);
  }
  if (action === 'like' || action === 'super_like') {
    savedOfferingIds.add(String(offering_id));
  }
  return { offering_id, action, recorded: true };
}

// ============================================
// BOOKING HANDLERS
// ============================================

async function handleGetBookings(config?: MockRequestConfig): Promise<any> {
  const userId = 'test_user_001'; // From auth context
  const { status, page = 1, limit = 10 } = config?.params || {};
  
  let bookings = getBookingsByUser(userId);
  if (status) {
    bookings = bookings.filter(b => b.status === status);
  }
  
  return paginate(bookings, page, limit);
}

async function handleGetBookingById(id: string): Promise<any> {
  const booking = getBookingById(id);
  if (!booking) {
    throw createError('NOT_FOUND', 'Booking not found', HttpStatusCode.NOT_FOUND);
  }
  return booking;
}

async function handleCreateBooking(config?: MockRequestConfig): Promise<any> {
  const bookingData = config?.body;
  if (!bookingData) {
    throw createError('BAD_REQUEST', 'Booking data is required', HttpStatusCode.BAD_REQUEST);
  }
  
  const newBooking = createMockBooking(bookingData);
  MOCK_BOOKINGS.push(newBooking);
  return newBooking;
}

async function handleUpdateBooking(id: string, config?: MockRequestConfig): Promise<any> {
  const booking = getBookingById(id);
  if (!booking) {
    throw createError('NOT_FOUND', 'Booking not found', HttpStatusCode.NOT_FOUND);
  }
  
  const updates = config?.body || {};
  Object.assign(booking, updates, { updatedAt: new Date().toISOString() });
  return booking;
}

// ============================================
// WALLET HANDLERS
// ============================================

async function handleGetWalletBalance(config?: MockRequestConfig): Promise<any> {
  return MOCK_WALLET_BALANCE;
}

async function handleGetTransactions(config?: MockRequestConfig): Promise<any> {
  const userId = 'test_user_001';
  const { page = 1, limit = 20, type } = config?.params || {};
  
  let transactions = getTransactionsByUser(userId);
  if (type) {
    transactions = transactions.filter(t => t.type === type);
  }
  
  // Sort by date descending
  transactions = sortArray(transactions, 'createdAt', 'desc');
  
  return paginate(transactions, page, limit);
}

async function handleDeposit(config?: MockRequestConfig): Promise<any> {
  const { amount, currency = 'NGN' } = config?.body || {};
  
  if (!amount || amount <= 0) {
    throw createError('BAD_REQUEST', 'Invalid amount', HttpStatusCode.BAD_REQUEST);
  }
  
  const transaction = createMockTransaction({
    userId: 'test_user_001',
    type: 'deposit',
    amount,
    currency,
    status: 'completed',
    description: 'Card deposit',
  });
  
  MOCK_TRANSACTIONS.push(transaction);
  MOCK_WALLET_BALANCE.balance += amount;
  MOCK_WALLET_BALANCE.lastUpdated = new Date().toISOString();
  
  return { transaction, balance: MOCK_WALLET_BALANCE };
}

async function handleWithdraw(config?: MockRequestConfig): Promise<any> {
  const { amount, currency = 'NGN', bankDetails } = config?.body || {};
  
  if (!amount || amount <= 0) {
    throw createError('BAD_REQUEST', 'Invalid amount', HttpStatusCode.BAD_REQUEST);
  }
  
  if (amount > MOCK_WALLET_BALANCE.balance) {
    throw createError('BAD_REQUEST', 'Insufficient balance', HttpStatusCode.BAD_REQUEST);
  }
  
  const transaction = createMockTransaction({
    userId: 'test_user_001',
    type: 'withdrawal',
    amount: -amount,
    currency,
    status: 'completed',
    description: 'Withdrawal to bank account',
  });
  
  MOCK_TRANSACTIONS.push(transaction);
  MOCK_WALLET_BALANCE.balance -= amount;
  MOCK_WALLET_BALANCE.lastUpdated = new Date().toISOString();
  
  return { transaction, balance: MOCK_WALLET_BALANCE };
}

async function handleTransfer(config?: MockRequestConfig): Promise<any> {
  const { amount, currency = 'NGN', recipientId, recipientName } = config?.body || {};
  
  if (!amount || amount <= 0) {
    throw createError('BAD_REQUEST', 'Invalid amount', HttpStatusCode.BAD_REQUEST);
  }
  
  if (amount > MOCK_WALLET_BALANCE.balance) {
    throw createError('BAD_REQUEST', 'Insufficient balance', HttpStatusCode.BAD_REQUEST);
  }
  
  const transaction = createMockTransaction({
    userId: 'test_user_001',
    type: 'transfer_out',
    amount: -amount,
    currency,
    status: 'completed',
    description: `Transfer to ${recipientName || 'user'}`,
    recipientId,
    recipientName,
  });
  
  MOCK_TRANSACTIONS.push(transaction);
  MOCK_WALLET_BALANCE.balance -= amount;
  MOCK_WALLET_BALANCE.lastUpdated = new Date().toISOString();
  
  return { transaction, balance: MOCK_WALLET_BALANCE };
}

// ============================================
// CHAT HANDLERS
// ============================================

async function handleGetConversations(config?: MockRequestConfig): Promise<any> {
  const userId = 'test_user_001';
  return getConversationsByUser(userId);
}

async function handleGetMessages(conversationId: string): Promise<any> {
  return getMessagesByConversation(conversationId);
}

async function handleSendMessage(conversationId: string, config?: MockRequestConfig): Promise<any> {
  const { text, type = 'text', priceProposal } = config?.body || {};
  
  if (!text && type === 'text') {
    throw createError('BAD_REQUEST', 'Message text is required', HttpStatusCode.BAD_REQUEST);
  }
  
  const message = createMockMessage(conversationId, 'test_user_001', text);
  if (type !== 'text') {
    message.type = type;
    message.priceProposal = priceProposal;
  }
  
  if (!MOCK_MESSAGES[conversationId]) {
    MOCK_MESSAGES[conversationId] = [];
  }
  MOCK_MESSAGES[conversationId].push(message);
  
  return message;
}

// ============================================
// PRODUCT HANDLERS
// ============================================

async function handleGetProducts(config?: MockRequestConfig): Promise<any> {
  const { page = 1, limit = 10, category, search } = config?.params || {};
  
  let products = [...MOCK_PRODUCTS];
  if (category) {
    products = products.filter(p => p.category === category);
  }
  if (search) {
    products = searchProducts(search);
  }
  
  return paginate(products, page, limit);
}

async function handleGetFeaturedProducts(config?: MockRequestConfig): Promise<any> {
  return getFeaturedProducts();
}

async function handleGetProductById(id: string): Promise<any> {
  const product = getProductById(id);
  if (!product) {
    throw createError('NOT_FOUND', 'Product not found', HttpStatusCode.NOT_FOUND);
  }
  return product;
}

// ============================================
// ACCOUNT HANDLERS
// ============================================

async function handleGetCategories(): Promise<any> {
  return [
    { id: 'photography', name: 'Photography', icon: 'camera' },
    { id: 'hair', name: 'Hair Stylist', icon: 'cut' },
    { id: 'makeup', name: 'Makeup Artist', icon: 'brush' },
  ];
}

async function handleGetSetupOptions(): Promise<any> {
  return [
    { id: 'discover', title: 'Discover creatives', icon: 'search' },
    { id: 'promote', title: 'Promote my work', icon: 'megaphone' },
  ];
}

async function handleAccountSetup(config?: MockRequestConfig): Promise<any> {
  console.log('Mock account setup received:', config?.body);
  return { success: true, message: 'Account setup completed successfully' };
}

async function handleGetSetupStatus(): Promise<any> {
  return { isSetupComplete: true, step: 'completed' };
}

async function handleUpdateAccount(config?: MockRequestConfig): Promise<any> {
  return { success: true, message: 'Account updated successfully' };
}

// ============================================
// PROFILE HANDLERS
// ============================================

async function handleGetProfile(): Promise<any> {
  const userId = 'test_user_001';
  return {
    id: userId,
    email: 'obedugwuv@gmail.com',
    first_name: 'Obed',
    last_name: 'Ugwu',
    full_name: 'Obed Ugwu',
    username: 'vjazzy',
    profile_image: "https://res.cloudinary.com/dtfn6grwf/image/upload/v1777105295/wami/profile-images/o8ohot61zhjicqeavsnq.jpg",
    account_type: 'discover',
    bio: "Mock bio for testing",
    location: {
      city: "Lagos",
      country: "Nigeria"
    }
  };
}

async function handleUpdateProfile(config?: MockRequestConfig): Promise<any> {
  console.log('Mock profile update received:', config?.body);
  return { success: true, message: 'Profile updated successfully' };
}

async function handleUploadImage(config?: MockRequestConfig): Promise<any> {
  console.log('Mock image upload received (base64 length):', config?.body?.image?.length);
  return {
    success: true,
    message: "Profile image updated successfully!",
    profile_image: "https://res.cloudinary.com/dtfn6grwf/image/upload/v1777105295/wami/profile-images/o8ohot61zhjicqeavsnq.jpg"
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function createSuccessResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

function createError(code: string, message: string, statusCode: HttpStatusCode): ApiError {
  return {
    code,
    message,
    statusCode,
  };
}
