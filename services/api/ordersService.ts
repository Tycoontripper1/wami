// Orders Service - API calls for the cart and order-placement flow.
// See "Marketplace - Cart & Orders" folder in the WAMI Postman collection.
//
// NOTE: the collection only documents GET /cart and POST /orders — there is
// no add/remove/update-cart-item endpoint anywhere in it. Until backend
// confirms otherwise, treat cart as read-only/server-derived and orders as
// created directly from whatever is already in it.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse } from './types';

export interface ApiCart {
  items: any[];
  [key: string]: any;
}

export interface ShippingAddress {
  line1: string;
  city: string;
  [key: string]: any;
}

export interface PlaceOrderPayload {
  shipping_address: ShippingAddress;
}

export interface ApiOrder {
  id: string | number;
  status?: string;
  [key: string]: any;
}

// GET /cart
export const getCart = async (): Promise<ApiResponse<ApiCart>> => {
  return apiClient.get(API_ENDPOINTS.CART.GET);
};

// POST /orders  { shipping_address }
export const placeOrder = async (
  payload: PlaceOrderPayload
): Promise<ApiResponse<ApiOrder>> => {
  return apiClient.post(API_ENDPOINTS.ORDERS.CREATE, payload);
};
