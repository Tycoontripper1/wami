# 🚀 Quick Reference: Using the Mock API

## Import Services

```typescript
import { 
  creativesService,
  bookingsService,
  walletService,
  chatService,
  productsService,
  profileService,
} from '@/services/api';
```

## Common Patterns

### Get Data
```typescript
const response = await creativesService.getCreatives({ page: 1, limit: 10 });
if (response.success) {
  const creatives = response.data.items;
  // Use the data
}
```

### Create/Update
```typescript
const response = await bookingsService.createBooking({
  creativeId: 'ng-1',
  service: 'Photography',
  agreedPrice: 150000,
  currency: 'NGN',
});
if (response.success) {
  const booking = response.data;
}
```

### Error Handling
```typescript
try {
  const response = await walletService.depositFunds({ amount: 50000 });
  if (response.success) {
    console.log('Success!');
  }
} catch (error: any) {
  console.error(error.message);
}
```

## Switch to Real API

Edit `services/api/config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: 'https://api.yourbackend.com',  // ← Your real API
  USE_MOCK: false,                           // ← Turn off mock
  // ... rest
};
```

## Available Services

| Service | Methods |
|---------|---------|
| **creativesService** | getCreatives, searchCreatives, getFeaturedCreatives, getNearbyCreatives, getCreativeById |
| **bookingsService** | getBookings, getBookingById, createBooking, updateBooking, completeBooking, cancelBooking |
| **walletService** | getWalletBalance, getTransactions, depositFunds, withdrawFunds, transferFunds |
| **chatService** | getConversations, getMessages, sendMessage, markMessageAsRead, startConversation |
| **productsService** | getProducts, getFeaturedProducts, getProductById, getProductsByCategory, searchProducts |
| **profileService** | getProfile, updateProfile, uploadAvatar, getUserProfile |

## Response Format

All responses follow this pattern:

```typescript
{
  success: boolean,
  data: T,
  message?: string,
  error?: {
    code: string,
    message: string,
    statusCode?: number
  }
}
```

## Current Mock Data

- **Creatives**: Existing data (photographers, makeup artists, etc.)
- **Bookings**: 5 bookings in various states
- **Wallet Balance**: ₦125,000
- **Transactions**: 10 transaction records
- **Conversations**: 4 chat threads
- **Products**: 6 products across categories

## Configuration

In `services/api/config.ts`:

```typescript
{
  BASE_URL: 'https://api.wami.com',
  USE_MOCK: true,              // Toggle mock/real
  MOCK_DELAY_MS: 1000,         // Network delay simulation
  TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
}
```

## Full Documentation

- 📖 **Complete Guide**: `services/api/README.md`
- 💡 **Code Examples**: `services/api/EXAMPLES.ts`
- 🎯 **Implementation Plan**: `implementation_plan.md` (artifact)
- 📝 **Walkthrough**: `walkthrough.md` (artifact)

---

**Happy Coding! 🎉**
