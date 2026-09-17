import { OrderStatus, ProductOrder } from '@/types/payment';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// This slice used to also hold a local-only "escrow" Booking/Payment model
// and a mock conversations/messages cache. Both were dead simulations with
// no backing endpoint (bookings now go through services/api/bookingsService,
// messaging through services/api/chatService) and were removed — see
// docs/API-AUDIT-02-MARKETPLACE-AND-BEYOND.md §4. Only the local product
// order cache remains, mirroring what services/api/ordersService.placeOrder
// persists server-side (see app/checkout/index.tsx).
interface PaymentState {
  productOrders: ProductOrder[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  productOrders: [],
  isLoading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    // Product Orders
    addProductOrder: (state, action: PayloadAction<ProductOrder>) => {
      state.productOrders.unshift(action.payload);
    },
    updateProductOrderStatus: (state, action: PayloadAction<{ orderId: string; orderStatus: OrderStatus; timeline?: ProductOrder['timeline'] }>) => {
      const order = state.productOrders.find(o => o.id === action.payload.orderId);
      if (order) {
        order.orderStatus = action.payload.orderStatus;
        if (action.payload.timeline) order.timeline = action.payload.timeline;
        order.updatedAt = new Date().toISOString();
      }
    },

    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  addProductOrder,
  updateProductOrderStatus,
  setLoading,
  setError,
  clearError,
} = paymentSlice.actions;

export default paymentSlice.reducer;
