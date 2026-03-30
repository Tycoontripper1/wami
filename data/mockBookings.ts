// Mock Bookings Data

import { formatDate, generateId } from '@/services/api/mock/mockHelpers';
import { Booking, BookingStatus } from '@/types/payment';

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'booking_001',
    customerId: 'test_user_001',
    creativeId: 'ng-1',
    creativeName: 'Paul Studio',
    creativeImage: require('@/assets/images/icon.png'),
    service: 'Wedding Photography Package',
    description: 'Full day wedding coverage with engagement shoot',
    agreedPrice: 150000,
    currency: 'NGN',
    status: 'paid',
    scheduledDate: '2026-03-15',
    scheduledTime: '10:00 AM',
    location: 'Lagos, Nigeria',
    createdAt: formatDate(new Date('2026-01-20')),
    updatedAt: formatDate(new Date('2026-01-25')),
    payment: {
      id: 'pay_001',
      bookingId: 'booking_001',
      customerId: 'test_user_001',
      creativeId: 'ng-1',
      amount: 150000,
      currency: 'NGN',
      status: 'completed',
      escrow: {
        totalAmount: 150000,
        creativeInitialPayment: 105000, // 70%
        heldAmount: 45000, // 30%
        platformFee: 0,
        releasedToCreative: 105000,
        currency: 'NGN',
      },
      paymentMethod: 'card',
      transactionId: 'txn_001',
      createdAt: formatDate(new Date('2026-01-25')),
      updatedAt: formatDate(new Date('2026-01-25')),
    },
  },
  {
    id: 'booking_002',
    customerId: 'test_user_001',
    creativeId: 'ng-2',
    creativeName: 'Sandra Hair Studio',
    creativeImage: require('@/assets/images/icon.png'),
    service: 'Bridal Hair Styling',
    description: 'Bridal hair styling with trial session',
    agreedPrice: 45000,
    currency: 'NGN',
    status: 'awaiting_payment',
    scheduledDate: '2026-03-10',
    scheduledTime: '9:00 AM',
    location: 'Lagos, Nigeria',
    createdAt: formatDate(new Date('2026-01-28')),
    updatedAt: formatDate(new Date('2026-01-30')),
  },
  {
    id: 'booking_003',
    customerId: 'test_user_001',
    creativeId: 'ng-3',
    creativeName: 'Chef Tunde Catering',
    creativeImage: require('@/assets/images/icon.png'),
    service: 'Wedding Catering',
    description: 'Catering for 200 guests - Nigerian and Continental menu',
    agreedPrice: 450000,
    currency: 'NGN',
    status: 'in_progress',
    scheduledDate: '2026-03-15',
    scheduledTime: '12:00 PM',
    location: 'Lagos, Nigeria',
    createdAt: formatDate(new Date('2026-01-15')),
    updatedAt: formatDate(new Date('2026-02-01')),
    payment: {
      id: 'pay_002',
      bookingId: 'booking_003',
      customerId: 'test_user_001',
      creativeId: 'ng-3',
      amount: 450000,
      currency: 'NGN',
      status: 'completed',
      escrow: {
        totalAmount: 450000,
        creativeInitialPayment: 315000, // 70%
        heldAmount: 135000, // 30%
        platformFee: 0,
        releasedToCreative: 315000,
        currency: 'NGN',
      },
      paymentMethod: 'card',
      transactionId: 'txn_002',
      createdAt: formatDate(new Date('2026-01-20')),
      updatedAt: formatDate(new Date('2026-01-20')),
    },
  },
  {
    id: 'booking_004',
    customerId: 'test_user_001',
    creativeId: 'ng-4',
    creativeName: 'Amara MUA',
    creativeImage: require('@/assets/images/icon.png'),
    service: 'Bridal Makeup',
    description: 'Full glam bridal makeup with trial',
    agreedPrice: 75000,
    currency: 'NGN',
    status: 'completed',
    scheduledDate: '2026-02-01',
    scheduledTime: '7:00 AM',
    location: 'Abuja, Nigeria',
    createdAt: formatDate(new Date('2026-01-10')),
    updatedAt: formatDate(new Date('2026-02-01')),
    payment: {
      id: 'pay_003',
      bookingId: 'booking_004',
      customerId: 'test_user_001',
      creativeId: 'ng-4',
      amount: 75000,
      currency: 'NGN',
      status: 'completed',
      escrow: {
        totalAmount: 75000,
        creativeInitialPayment: 52500, // 70%
        heldAmount: 22500, // 30%
        platformFee: 0,
        releasedToCreative: 75000, // All released after completion
        currency: 'NGN',
      },
      paymentMethod: 'card',
      transactionId: 'txn_003',
      createdAt: formatDate(new Date('2026-01-15')),
      updatedAt: formatDate(new Date('2026-02-01')),
    },
  },
  {
    id: 'booking_005',
    customerId: 'test_user_001',
    creativeId: 'gb-1',
    creativeName: 'London Glamour Studio',
    creativeImage: require('@/assets/images/icon.png'),
    service: 'Bridal Hair Package',
    description: 'Bridal hair styling with extensions',
    agreedPrice: 450,
    currency: 'GBP',
    status: 'negotiating',
    scheduledDate: '2026-04-20',
    location: 'London, UK',
    createdAt: formatDate(new Date('2026-02-01')),
    updatedAt: formatDate(new Date('2026-02-02')),
  },
];

// Helper functions for mock data
export const getBookingById = (id: string): Booking | undefined => {
  return MOCK_BOOKINGS.find(b => b.id === id);
};

export const getBookingsByUser = (userId: string): Booking[] => {
  return MOCK_BOOKINGS.filter(b => b.customerId === userId);
};

export const getBookingsByStatus = (
  userId: string,
  status: BookingStatus
): Booking[] => {
  return MOCK_BOOKINGS.filter(
    b => b.customerId === userId && b.status === status
  );
};

export const createMockBooking = (data: Partial<Booking>): Booking => {
  return {
    id: generateId('booking'),
    customerId: data.customerId || 'test_user_001',
    creativeId: data.creativeId || '',
    creativeName: data.creativeName || '',
    creativeImage: data.creativeImage || require('@/assets/images/icon.png'),
    service: data.service || '',
    description: data.description || '',
    agreedPrice: data.agreedPrice || 0,
    currency: data.currency || 'NGN',
    status: data.status || 'negotiating',
    scheduledDate: data.scheduledDate,
    scheduledTime: data.scheduledTime,
    location: data.location,
    createdAt: formatDate(),
    updatedAt: formatDate(),
  };
};
