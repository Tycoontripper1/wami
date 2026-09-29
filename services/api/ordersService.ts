// Orders Service - API calls for the cart and order-placement flow.
// See "Marketplace - Cart & Orders" folder in the WAMI Postman collection.
//
// The collection only documents GET /cart and POST /orders — no
// add/remove/update-cart-item endpoint appears anywhere in it. POST /orders
// on an empty cart 400s with "Cart is empty.", so an item has to be added
// first. POST /cart/items {product_id, quantity} isn't documented but is
// real and works — confirmed live 2026-09-29. There's still no documented
// way to remove/update a cart item or cancel a placed order.

import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponse } from './types';

export interface ApiCart {
  items: any[];
  [key: string]: any;
}

export interface AddCartItemPayload {
  product_id: string | number;
  quantity: number;
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

// POST /cart/items  { product_id, quantity }
export const addCartItem = async (
  payload: AddCartItemPayload
): Promise<ApiResponse<any>> => {
  return apiClient.post(API_ENDPOINTS.CART.ADD_ITEM, payload);
};

// POST /orders  { shipping_address }
export const placeOrder = async (
  payload: PlaceOrderPayload
): Promise<ApiResponse<ApiOrder>> => {
  return apiClient.post(API_ENDPOINTS.ORDERS.CREATE, payload);
};
