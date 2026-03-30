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

  // Products
  if (method === 'GET' && endpoint === API_ENDPOINTS.PRODUCTS.LIST) return handleGetProducts;
  if (method === 'GET' && endpoint === API_ENDPOINTS.PRODUCTS.FEATURED) return handleGetFeaturedProducts;
  if (method === 'GET' && endpoint.startsWith('/products/') && !endpoint.includes('/category')) {
    return (config) => handleGetProductById(endpoint.split('/').pop()!);
  }

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
