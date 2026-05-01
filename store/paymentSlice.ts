import { Booking, BookingStatus, Conversation, Message, OrderStatus, Payment, PaymentStatus, ProductOrder } from '@/types/payment';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PaymentState {
  bookings: Booking[];
  payments: Payment[];
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: { [conversationId: string]: Message[] };
  productOrders: ProductOrder[];
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  bookings: [],
  payments: [],
  conversations: [],
  activeConversation: null,
  messages: {},
  productOrders: [],
  isLoading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    // Conversations
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    setActiveConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.activeConversation = action.payload;
    },
    updateConversation: (state, action: PayloadAction<Partial<Conversation> & { id: string }>) => {
      const index = state.conversations.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.conversations[index] = { ...state.conversations[index], ...action.payload };
      }
    },

    // Messages
    setMessages: (state, action: PayloadAction<{ conversationId: string; messages: Message[] }>) => {
      state.messages[action.payload.conversationId] = action.payload.messages;
    },
    addMessage: (state, action: PayloadAction<{ conversationId: string; message: Message }>) => {
      const { conversationId, message } = action.payload;
      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }
      state.messages[conversationId].push(message);
    },

    // Bookings
    setBookings: (state, action: PayloadAction<Booking[]>) => {
      state.bookings = action.payload;
    },
    addBooking: (state, action: PayloadAction<Booking>) => {
      state.bookings.push(action.payload);
    },
    updateBookingStatus: (state, action: PayloadAction<{ bookingId: string; status: BookingStatus }>) => {
      const booking = state.bookings.find(b => b.id === action.payload.bookingId);
      if (booking) {
        booking.status = action.payload.status;
        booking.updatedAt = new Date().toISOString();
      }
    },

    // Payments
    setPayments: (state, action: PayloadAction<Payment[]>) => {
      state.payments = action.payload;
    },
    addPayment: (state, action: PayloadAction<Payment>) => {
      state.payments.push(action.payload);
      const booking = state.bookings.find(b => b.id === action.payload.bookingId);
      if (booking) {
        booking.payment = action.payload;
        booking.status = 'paid';
      }
    },
    updatePaymentStatus: (state, action: PayloadAction<{ paymentId: string; status: PaymentStatus }>) => {
      const payment = state.payments.find(p => p.id === action.payload.paymentId);
      if (payment) {
        payment.status = action.payload.status;
        payment.updatedAt = new Date().toISOString();
      }
    },
    releaseEscrow: (state, action: PayloadAction<{ paymentId: string }>) => {
      const payment = state.payments.find(p => p.id === action.payload.paymentId);
      if (payment) {
        payment.escrow.releasedToCreative = payment.escrow.totalAmount - payment.escrow.platformFee;
        payment.status = 'completed';
        payment.updatedAt = new Date().toISOString();
        const booking = state.bookings.find(b => b.id === payment.bookingId);
        if (booking) {
          booking.status = 'completed';
          booking.updatedAt = new Date().toISOString();
        }
      }
    },

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
  setConversations,
  setActiveConversation,
  updateConversation,
  setMessages,
  addMessage,
  setBookings,
  addBooking,
  updateBookingStatus,
  setPayments,
  addPayment,
  updatePaymentStatus,
  releaseEscrow,
  addProductOrder,
  updateProductOrderStatus,
  setLoading,
  setError,
  clearError,
} = paymentSlice.actions;

export default paymentSlice.reducer;
