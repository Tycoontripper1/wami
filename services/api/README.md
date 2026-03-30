# Mock API Infrastructure

This directory contains the complete mock API infrastructure that simulates a real backend. When your real backend is ready, you can switch seamlessly by changing just a few configuration values.

## 📁 Directory Structure

```
services/api/
├── config.ts              # API configuration (CHANGE HERE TO SWITCH TO REAL API)
├── types.ts               # Common API types and interfaces
├── client.ts              # HTTP client with mock/real switching
├── index.ts               # Central export for all services
├── mock/
│   ├── mockHelpers.ts     # Utility functions for mock data
│   └── mockHandlers.ts    # Mock API route handlers
└── [service]Service.ts    # Individual service modules
```

## 🚀 Quick Start

### Using the API in your code

```typescript
import { creativesService, bookingsService, walletService } from '@/services/api';

// Get creatives
const response = await creativesService.getCreatives({ page: 1, limit: 10 });
if (response.success) {
  const creatives = response.data.items;
  // Use the data
}

// Create booking
const booking = await bookingsService.createBooking({
  creativeId: 'ng-1',
  creativeName: 'Paul Studio',
  service: 'Wedding Photography',
  agreedPrice: 150000,
  currency: 'NGN',
});
```

### Switching from Mock to Real API

**When your backend is ready**, open `services/api/config.ts` and change:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://api.wami.com',  // ← Change to your real API URL
  USE_MOCK: false,                    // ← Set to false
  // ... rest of config
};
```

That's it! Your entire app will now use the real backend.

## 📋 Available Services

### Creative Service (`creativesService`)
- `getCreatives(params)` - Get list of creatives with filters
- `searchCreatives(query, params)` - Search creatives
- `getFeaturedCreatives(region?)` - Get featured creatives
- `getNearbyCreatives(city, params)` - Get nearby creatives
- `getCreativeById(id)` - Get creative details
- `getCreativesByCategory(category, params)` - Filter by category
- `getCreativesByRegion(region, params)` - Filter by region

### Bookings Service (`bookingsService`)
- `getBookings(params)` - Get user's bookings
- `getBookingById(id)` - Get booking details
- `createBooking(data)` - Create new booking
- `updateBooking(id, data)` - Update booking
- `completeBooking(id)` - Mark booking as complete
- `cancelBooking(id, reason?)` - Cancel booking

### Wallet Service (`walletService`)
- `getWalletBalance()` - Get wallet balance
- `getTransactions(params)` - Get transaction history
- `depositFunds(data)` - Add funds to wallet
- `withdrawFunds(data)` - Withdraw funds
- `transferFunds(data)` - Transfer to another user

### Chat Service (`chatService`)
- `getConversations()` - Get all conversations
- `getConversationById(id)` - Get conversation details
- `getMessages(conversationId)` - Get messages
- `sendMessage(conversationId, data)` - Send message
- `markMessageAsRead(messageId)` - Mark as read
- `startConversation(creativeId)` - Start new conversation

### Products Service (`productsService`)
- `getProducts(params)` - Get products with filters
- `getFeaturedProducts()` - Get featured products
- `getProductById(id)` - Get product details
- `getProductsByCategory(category, params)` - Filter by category
- `searchProducts(query, params)` - Search products

### Profile Service (`profileService`)
- `getProfile()` - Get current user profile
- `updateProfile(data)` - Update profile
- `uploadAvatar(imageUri)` - Upload avatar
- `getUserProfile(userId)` - Get another user's profile

## 🎭 Mock Data

Mock data is stored in the `data/` directory:

- `data/creatives.ts` - Creative professionals data
- `data/mockBookings.ts` - Booking records
- `data/mockTransactions.ts` - Wallet transactions
- `data/mockMessages.ts` - Chat conversations and messages
- `data/mockProducts.ts` - Products for sale
- `data/regions.ts` - Location data

## ⚙️ Configuration Options

In `services/api/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://api.wami.com',  // Real API URL
  USE_MOCK: true,                     // Enable/disable mock mode
  MOCK_DELAY_MS: 1000,                // Network delay simulation (ms)
  TIMEOUT_MS: 30000,                  // Request timeout
  MAX_RETRIES: 3,                     // Retry attempts
  RETRY_DELAY_MS: 1000,               // Delay between retries
  API_VERSION: 'v1',                  // API version
};
```

## 🔧 Adding New Endpoints

### 1. Update config.ts

```typescript
export const API_ENDPOINTS = {
  // ... existing endpoints
  NEW_FEATURE: {
    LIST: '/new-feature',
    BY_ID: (id: string) => `/new-feature/${id}`,
  },
};
```

### 2. Create service file

Create `services/api/newFeatureService.ts`:

```typescript
import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse } from './types';

export const getNewFeatures = async (): Promise<ApiResponse<any>> => {
  return apiClient.get(API_ENDPOINTS.NEW_FEATURE.LIST);
};
```

### 3. Add mock handler (if using mock mode)

In `services/api/mock/mockHandlers.ts`:

```typescript
// Add to findHandler function
if (method === 'GET' && endpoint === API_ENDPOINTS.NEW_FEATURE.LIST) {
  return handleGetNewFeatures;
}

// Add handler function
async function handleGetNewFeatures(config?: MockRequestConfig): Promise<any> {
  // Return mock data
  return [];
}
```

### 4. Export from index.ts

```typescript
export * as newFeatureService from './newFeatureService';
```

## 📊 Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    statusCode?: number;
  };
}
```

Paginated responses:

```typescript
interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## 🔐 Authentication

The API client automatically handles authentication:

```typescript
import { apiClient } from '@/services/api/client';

// Set token after login
apiClient.setAuthToken(token);

// All subsequent requests will include the token
// Authorization: Bearer <token>

// Clear token on logout
apiClient.setAuthToken(null);
```

## 🐛 Error Handling

```typescript
try {
  const response = await creativesService.getCreativeById('ng-1');
  if (response.success) {
    console.log(response.data);
  }
} catch (error: any) {
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
  console.error('Status code:', error.statusCode);
}
```

## 🎯 Best Practices

1. **Always check `response.success`** before using data
2. **Handle errors gracefully** with try-catch
3. **Use TypeScript types** provided by the services
4. **Don't access mock data directly** - always go through the API
5. **Test with mock mode** before switching to real API

## 🧪 Testing

To simulate different scenarios in mock mode:

1. **Network delays**: Adjust `MOCK_DELAY_MS` in config
2. **Errors**: Modify mock handlers to throw errors
3. **Empty states**: Return empty arrays from handlers
4. **Pagination**: Use page/limit parameters

## 📝 Migration Checklist

When moving from mock to real API:

- [ ] Backend API is deployed and accessible
- [ ] Update `BASE_URL` in `services/api/config.ts`
- [ ] Set `USE_MOCK: false` in config
- [ ] Verify response formats match (adjust types if needed)
- [ ] Test all user flows end-to-end
- [ ] Handle any backend-specific authentication
- [ ] Update error handling for real error codes
- [ ] Remove or keep mock data for development/testing

## 💡 Tips

- Keep `USE_MOCK: true` during development
- Use mock mode for demos and presentations
- Mock mode works offline - perfect for testing
- Real API can be tested by temporarily setting `USE_MOCK: false`
- Keep mock data updated to reflect real use cases

## 🤝 Support

For issues or questions about the API infrastructure, check:
- Service type definitions for available parameters
- Mock handlers for example responses
- Mock data files for data structure examples

---

**Remember**: The beauty of this setup is that your entire codebase stays the same whether you're using mock or real data. Just flip the switch in the config! 🎉
