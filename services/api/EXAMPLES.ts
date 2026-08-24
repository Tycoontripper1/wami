// Example Usage of API Services
// This file demonstrates how to use the API services in your React Native app

import {
    bookingsService,
    chatService,
    creativesService,
    productsService,
    walletService,
} from '@/services/api';
import { profileService } from '@/services/api/profileService';

// ============================================
// CREATIVE DISCOVERY EXAMPLES
// ============================================

export async function exampleGetCreatives() {
  try {
    // Get all creatives with pagination
    const response = await creativesService.getCreatives({
      page: 1,
      limit: 10,
    });

    if (response.success) {
      const { items, pagination } = response.data;
      console.log(`Found ${pagination.total} creatives`);
      console.log(`Page ${pagination.page} of ${pagination.totalPages}`);
      items.forEach(creative => {
        console.log(`${creative.name} - ${creative.role}`);
      });
    }
  } catch (error: any) {
    console.error('Error fetching creatives:', error.message);
  }
}

export async function exampleSearchCreatives() {
  try {
    // Search for photographers
    const response = await creativesService.searchCreatives('photographer', {
      page: 1,
      limit: 10,
    });

    if (response.success) {
      console.log(`Found ${response.data.items.length} photographers`);
    }
  } catch (error: any) {
    console.error('Search error:', error.message);
  }
}

export async function exampleGetFeatured() {
  try {
    // Get featured creatives in Nigeria
    const response = await creativesService.getFeaturedCreatives('NG');

    if (response.success) {
      console.log(`${response.data.length} featured creatives in Nigeria`);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================
// BOOKING EXAMPLES
// ============================================

export async function exampleCreateBooking() {
  try {
    const response = await bookingsService.createBooking({
      offering_id: 'ng-1',
      project_title: 'Wedding Photography Package',
      project_details: 'Full day coverage with engagement shoot',
      start_date: '2026-03-15',
      end_date: '2026-03-15',
      total_amount: 150000,
      currency: 'NGN',
    });

    if (response.success) {
      console.log('Booking created:', response.data.id);
      console.log('Status:', response.data.status);
    }
  } catch (error: any) {
    console.error('Booking error:', error.message);
  }
}

export async function exampleGetUserBookings() {
  try {
    // Get all bookings
    const allBookings = await bookingsService.getBookings();

    // Get bookings with pagination
    const pagedBookings = await bookingsService.getBookings({
      page: 1,
      limit: 5,
    });

    if (allBookings.success && Array.isArray(allBookings.data)) {
      console.log(`Total bookings: ${allBookings.data.length}`);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

export async function exampleUpdateBooking() {
  try {
    const response = await bookingsService.updateBookingStatus('booking_001', 'completed');

    if (response.success) {
      console.log('Booking updated:', response.data.status);
    }
  } catch (error: any) {
    console.error('Update error:', error.message);
  }
}

// ============================================
// WALLET EXAMPLES
// ============================================

export async function exampleGetBalance() {
  try {
    const response = await walletService.getWalletBalance();

    if (response.success) {
      const { balance, currency, pendingBalance } = response.data;
      console.log(`Balance: ${currency} ${balance.toLocaleString()}`);
      console.log(`Pending: ${currency} ${pendingBalance.toLocaleString()}`);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

export async function exampleDepositFunds() {
  try {
    const response = await walletService.depositFunds({
      amount: 50000,
      currency: 'NGN',
      paymentMethod: 'card',
      paymentDetails: {
        cardNumber: '****1234',
      },
    });

    if (response.success) {
      console.log('Deposit successful!');
      console.log('New balance:', response.data.balance.balance);
      console.log('Transaction ID:', response.data.transaction.id);
    }
  } catch (error: any) {
    console.error('Deposit error:', error.message);
  }
}

export async function exampleGetTransactions() {
  try {
    // Get all transactions
    const response = await walletService.getTransactions({
      page: 1,
      limit: 20,
    });

    // Get only deposits
    const deposits = await walletService.getTransactions({
      type: 'deposit',
      page: 1,
      limit: 10,
    });

    if (response.success) {
      console.log(`Total transactions: ${response.data.pagination.total}`);
      response.data.items.forEach(txn => {
        console.log(`${txn.type}: ${txn.currency} ${txn.amount}`);
      });
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

export async function exampleTransferFunds() {
  try {
    const response = await walletService.transferFunds({
      amount: 10000,
      currency: 'NGN',
      recipientId: 'user_002',
      recipientName: 'Jane Doe',
      description: 'Payment for services',
    });

    if (response.success) {
      console.log('Transfer successful!');
      console.log('New balance:', response.data.balance.balance);
    }
  } catch (error: any) {
    console.error('Transfer error:', error.message);
  }
}

// ============================================
// CHAT EXAMPLES
// ============================================

export async function exampleGetConversations() {
  try {
    const response = await chatService.getConversations();

    if (response.success) {
      console.log(`${response.data.length} conversations`);
      response.data.forEach(conv => {
        console.log(`${conv.creativeName} - ${conv.unreadCount} unread`);
      });
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

export async function exampleGetMessages() {
  try {
    const response = await chatService.getMessages('conv_001');

    if (response.success) {
      console.log(`${response.data.length} messages`);
      response.data.forEach(msg => {
        console.log(`[${msg.senderId}]: ${msg.text}`);
      });
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

export async function exampleSendMessage() {
  try {
    // Send text message
    const textResponse = await chatService.sendMessage('conv_001', {
      text: 'Hi! Are you available for a wedding on March 15th?',
      type: 'text',
    });

    // Send price proposal
    const priceResponse = await chatService.sendMessage('conv_001', {
      text: 'I can do it for ₦150,000',
      type: 'price_proposal',
      priceProposal: {
        amount: 150000,
        currency: 'NGN',
        service: 'Wedding Photography Package',
      },
    });

    if (textResponse.success) {
      console.log('Message sent:', textResponse.data.id);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================
// PRODUCTS EXAMPLES
// ============================================

export async function exampleGetProducts() {
  try {
    // Get all products
    const response = await productsService.getProducts({
      page: 1,
      limit: 10,
    });

    // Get products by category
    const fashionProducts = await productsService.getProductsByCategory('fashion');

    // Search products
    const searchResults = await productsService.searchProducts('dress', {
      page: 1,
      limit: 10,
    });

    if (response.success) {
      console.log(`${response.data.pagination.total} products available`);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

export async function exampleGetFeaturedProducts() {
  try {
    const response = await productsService.getFeaturedProducts();

    if (response.success) {
      console.log(`${response.data.length} featured products`);
      response.data.forEach(product => {
        console.log(`${product.name} - ${product.currency} ${product.price}`);
      });
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

// ============================================
// PROFILE EXAMPLES
// ============================================

export async function exampleGetProfile() {
  try {
    const response = await profileService.getProfile();

    if (response.success) {
      const user = response.data;
      console.log(`${user.firstName} ${user.lastName}`);
      console.log(`Email: ${user.email}`);
      console.log(`Username: @${user.username}`);
    }
  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

export async function exampleUpdateProfile() {
  try {
    const response = await profileService.updateProfile({
      first_name: 'John',
      last_name: 'Doe',
      bio: 'Professional event planner',
      location: { city: 'Lagos', country: 'Nigeria' },
    });

    if (response.success) {
      console.log('Profile updated successfully!');
    }
  } catch (error: any) {
    console.error('Update error:', error.message);
  }
}

// ============================================
// USAGE IN REACT COMPONENTS
// ============================================

// Example in a React Native component:
/*
import React, { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { creativesService } from '@/services/api';
import { Creative } from '@/data/creatives';

export function CreativesListScreen() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCreatives();
  }, []);

  const loadCreatives = async () => {
    try {
      setLoading(true);
      const response = await creativesService.getCreatives({
        page: 1,
        limit: 10,
      });

      if (response.success) {
        setCreatives(response.data.items);
      }
    } catch (error) {
      console.error('Error loading creatives:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <FlatList
        data={creatives}
        renderItem={({ item }) => <CreativeCard creative={item} />}
        refreshing={loading}
        onRefresh={loadCreatives}
      />
    </View>
  );
}
*/
