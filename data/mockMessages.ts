// Mock Chat Messages and Conversations

import { formatDate, generateId } from '@/services/api/mock/mockHelpers';
import { Conversation, Message } from '@/types/payment';

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_001',
    participants: ['test_user_001', 'ng-1'],
    creativeId: 'ng-1',
    creativeName: 'Paul Studio',
    creativeImage: require('@/assets/images/icon.png'),
    creativeRole: 'Photographer',
    lastMessage: {
      id: 'msg_003',
      conversationId: 'conv_001',
      senderId: 'ng-1',
      text: 'Perfect! Looking forward to working with you.',
      type: 'text',
      timestamp: formatDate(new Date('2026-01-25T15:30:00')),
      isRead: true,
    },
    unreadCount: 0,
    booking: {
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
    },
    updatedAt: formatDate(new Date('2026-01-25T15:30:00')),
  },
  {
    id: 'conv_002',
    participants: ['test_user_001', 'ng-2'],
    creativeId: 'ng-2',
    creativeName: 'Sandra Hair Studio',
    creativeImage: require('@/assets/images/icon.png'),
    creativeRole: 'Hair Stylist',
    lastMessage: {
      id: 'msg_006',
      conversationId: 'conv_002',
      senderId: 'ng-2',
      text: 'Great! I can do that for ₦45,000. Would you like to proceed?',
      type: 'price_proposal',
      priceProposal: {
        amount: 45000,
        currency: 'NGN',
        service: 'Bridal Hair Styling',
        accepted: true,
      },
      timestamp: formatDate(new Date('2026-01-30T11:20:00')),
      isRead: true,
    },
    unreadCount: 1,
    booking: {
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
    updatedAt: formatDate(new Date('2026-01-30T11:20:00')),
  },
  {
    id: 'conv_003',
    participants: ['test_user_001', 'gb-1'],
    creativeId: 'gb-1',
    creativeName: 'London Glamour Studio',
    creativeImage: require('@/assets/images/icon.png'),
    creativeRole: 'Hair Stylist',
    lastMessage: {
      id: 'msg_008',
      conversationId: 'conv_003',
      senderId: 'test_user_001',
      text: 'Hi! I need bridal hair styling for April 20th. Are you available?',
      type: 'text',
      timestamp: formatDate(new Date('2026-02-02T09:15:00')),
      isRead: true,
    },
    unreadCount: 0,
    updatedAt: formatDate(new Date('2026-02-02T09:15:00')),
  },
  {
    id: 'conv_004',
    participants: ['test_user_001', 'ng-4'],
    creativeId: 'ng-4',
    creativeName: 'Amara MUA',
    creativeImage: require('@/assets/images/icon.png'),
    creativeRole: 'Makeup Artist',
    lastMessage: {
      id: 'msg_012',
      conversationId: 'conv_004',
      senderId: 'ng-4',
      text: 'Thank you for choosing me! The makeup looked stunning on your big day! 💄✨',
      type: 'text',
      timestamp: formatDate(new Date('2026-02-01T18:00:00')),
      isRead: true,
    },
    unreadCount: 0,
    booking: {
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
    },
    updatedAt: formatDate(new Date('2026-02-01T18:00:00')),
  },
];

// Mock messages by conversation
export const MOCK_MESSAGES: Record<string, Message[]> = {
  conv_001: [
    {
      id: 'msg_001',
      conversationId: 'conv_001',
      senderId: 'test_user_001',
      text: 'Hi! I love your work. Are you available for a wedding on March 15th?',
      type: 'text',
      timestamp: formatDate(new Date('2026-01-20T10:00:00')),
      isRead: true,
    },
    {
      id: 'msg_002',
      conversationId: 'conv_001',
      senderId: 'ng-1',
      text: 'Thank you! Yes, I am available. For a full day wedding package with engagement shoot, my rate is ₦150,000.',
      type: 'price_proposal',
      priceProposal: {
        amount: 150000,
        currency: 'NGN',
        service: 'Wedding Photography Package',
        accepted: true,
      },
      timestamp: formatDate(new Date('2026-01-20T10:30:00')),
      isRead: true,
    },
    {
      id: 'msg_003',
      conversationId: 'conv_001',
      senderId: 'ng-1',
      text: 'Perfect! Looking forward to working with you.',
      type: 'text',
      timestamp: formatDate(new Date('2026-01-25T15:30:00')),
      isRead: true,
    },
  ],
  conv_002: [
    {
      id: 'msg_004',
      conversationId: 'conv_002',
      senderId: 'test_user_001',
      text: 'Hello! I need bridal hair styling for March 10th. What are your rates?',
      type: 'text',
      timestamp: formatDate(new Date('2026-01-28T10:00:00')),
      isRead: true,
    },
    {
      id: 'msg_005',
      conversationId: 'conv_002',
      senderId: 'ng-2',
      text: 'Hi! Would you like a trial session included?',
      type: 'text',
      timestamp: formatDate(new Date('2026-01-28T10:15:00')),
      isRead: true,
    },
    {
      id: 'msg_006',
      conversationId: 'conv_002',
      senderId: 'ng-2',
      text: 'Great! I can do that for ₦45,000. Would you like to proceed?',
      type: 'price_proposal',
      priceProposal: {
        amount: 45000,
        currency: 'NGN',
        service: 'Bridal Hair Styling',
        accepted: true,
      },
      timestamp: formatDate(new Date('2026-01-30T11:20:00')),
      isRead: true,
    },
  ],
  conv_003: [
    {
      id: 'msg_007',
      conversationId: 'conv_003',
      senderId: 'test_user_001',
      text: 'Hi! I need bridal hair styling for April 20th. Are you available?',
      type: 'text',
      timestamp: formatDate(new Date('2026-02-02T09:15:00')),
      isRead: true,
    },
  ],
  conv_004: [
    {
      id: 'msg_009',
      conversationId: 'conv_004',
      senderId: 'test_user_001',
      text: 'Hi Amara! I need bridal makeup for February 1st. Are you free?',
      type: 'text',
      timestamp: formatDate(new Date('2026-01-10T14:00:00')),
      isRead: true,
    },
    {
      id: 'msg_010',
      conversationId: 'conv_004',
      senderId: 'ng-4',
      text: 'Yes! I can do full glam bridal makeup with trial for ₦75,000.',
      type: 'price_proposal',
      priceProposal: {
        amount: 75000,
        currency: 'NGN',
        service: 'Bridal Makeup',
        accepted: true,
      },
      timestamp: formatDate(new Date('2026-01-10T14:20:00')),
      isRead: true,
    },
    {
      id: 'msg_011',
      conversationId: 'conv_004',
      senderId: 'test_user_001',
      text: 'Perfect! Booked!',
      type: 'text',
      timestamp: formatDate(new Date('2026-01-10T14:25:00')),
      isRead: true,
    },
    {
      id: 'msg_012',
      conversationId: 'conv_004',
      senderId: 'ng-4',
      text: 'Thank you for choosing me! The makeup looked stunning on your big day! 💄✨',
      type: 'text',
      timestamp: formatDate(new Date('2026-02-01T18:00:00')),
      isRead: true,
    },
  ],
};

// Helper functions
export const getConversationById = (id: string): Conversation | undefined => {
  return MOCK_CONVERSATIONS.find(c => c.id === id);
};

export const getConversationsByUser = (userId: string): Conversation[] => {
  return MOCK_CONVERSATIONS.filter(c => c.participants.includes(userId));
};

export const getMessagesByConversation = (conversationId: string): Message[] => {
  return MOCK_MESSAGES[conversationId] || [];
};

export const createMockMessage = (
  conversationId: string,
  senderId: string,
  text: string
): Message => {
  return {
    id: generateId('msg'),
    conversationId,
    senderId,
    text,
    type: 'text',
    timestamp: formatDate(),
    isRead: false,
  };
};
