// Payment and Booking Types

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type OrderStatus =
  | 'packed'               // Order packed by seller
  | 'on_way_to_logistics'  // Headed to logistics facility
  | 'at_logistics'         // Arrived at logistics facility
  | 'shipped'              // Shipped out
  | 'out_for_delivery'     // Out for delivery
  | 'delivered'            // Delivered
  | 'delivery_failed'      // Delivery attempt failed
  | 'cancelled';           // Order cancelled

export type ShippingOption = 'pickup' | 'express';
export type PaymentMethodType = 'card' | 'bank_transfer' | 'wallet';


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

// Product order timeline event
export interface OrderTimelineEvent {
  status: OrderStatus;
  label: string;
  description: string;
  timestamp?: string;
  completed: boolean;
}

// Product order (separate from service bookings)
export interface ProductOrder {
  id: string;
  customerId: string;
  productId: string;
  productName: string;
  productImage?: string;
  sellerName: string;
  price: number;           // base price
  serviceFee: number;      // 3%
  deliveryFee: number;     // 0 for pickup, 2000 for express
  total: number;
  currency: string;
  shippingOption: ShippingOption;
  shippingAddress: {
    country: string;
    address: string;
    city: string;
  };
  contactInfo: {
    phoneNumber: string;
    email: string;
  };
  paymentMethod: PaymentMethodType;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  trackingNumber: string;
  estimatedDelivery?: string;
  timeline: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

// Build order timeline with all steps
export const buildOrderTimeline = (currentStatus: OrderStatus): OrderTimelineEvent[] => {
  const steps: Array<{ status: OrderStatus; label: string; description: string }> = [
    { status: 'packed', label: 'Packed', description: 'Your parcel is packed and will be handed over to our delivery partner.' },
    { status: 'on_way_to_logistics', label: 'On the Way to Logistics', description: 'Your parcel is on its way to the logistics facility.' },
    { status: 'at_logistics', label: 'Arrived at Logistics Facility', description: 'Your parcel has arrived and is being processed.' },
    { status: 'shipped', label: 'Shipped', description: 'Your parcel has been dispatched from the facility.' },
    { status: 'out_for_delivery', label: 'Out for Delivery', description: 'Your parcel is out for delivery today.' },
    { status: 'delivered', label: 'Delivered', description: 'Your parcel has been delivered successfully.' },
  ];

  const statusOrder = ['packed', 'on_way_to_logistics', 'at_logistics', 'shipped', 'out_for_delivery', 'delivered'];
  const currentIndex = statusOrder.indexOf(currentStatus === 'delivery_failed' ? 'out_for_delivery' : currentStatus);

  return steps.map((step, index) => ({
    ...step,
    completed: index <= currentIndex,
    timestamp: index <= currentIndex ? new Date(Date.now() - (currentIndex - index) * 3600000 * 8).toISOString() : undefined,
  }));
};

