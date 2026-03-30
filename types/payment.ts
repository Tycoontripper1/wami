// Payment and Booking Types

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type BookingStatus = 
  | 'negotiating'      // Still discussing price
  | 'awaiting_payment' // Price agreed, waiting for payment
  | 'paid'             // Payment received, escrow holding 30%
  | 'in_progress'      // Service being delivered
  | 'completed'        // Service completed, all funds released
  | 'disputed'         // There's a dispute
  | 'cancelled';       // Booking cancelled

export interface EscrowDetails {
  totalAmount: number;
  creativeInitialPayment: number;  // 70% released immediately
  heldAmount: number;              // 30% held in escrow
  platformFee: number;             // Platform fee (optional)
  releasedToCreative: number;      // Amount released so far
  currency: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  creativeId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  escrow: EscrowDetails;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  customerId: string;
  creativeId: string;
  creativeName: string;
  creativeImage: any;
  service: string;
  description: string;
  agreedPrice: number;
  currency: string;
  status: BookingStatus;
  payment?: Payment;
  scheduledDate?: string;
  scheduledTime?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  type: 'text' | 'price_proposal' | 'payment_request' | 'payment_confirmation' | 'system';
  priceProposal?: {
    amount: number;
    currency: string;
    service: string;
    accepted?: boolean;
  };
  paymentInfo?: {
    bookingId: string;
    amount: number;
    status: PaymentStatus;
  };
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  creativeId: string;
  creativeName: string;
  creativeImage: any;
  creativeRole: string;
  lastMessage?: Message;
  unreadCount: number;
  booking?: Booking;
  updatedAt: string;
}

// Escrow calculation helper
export const calculateEscrow = (totalAmount: number, currency: string = 'NGN'): EscrowDetails => {
  const creativeInitialPayment = totalAmount * 0.7;  // 70%
  const heldAmount = totalAmount * 0.3;              // 30%
  const platformFee = 0;                             // Can be added later

  return {
    totalAmount,
    creativeInitialPayment,
    heldAmount,
    platformFee,
    releasedToCreative: 0,
    currency,
  };
};

// Format currency
export const formatCurrency = (amount: number, currency: string = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};
