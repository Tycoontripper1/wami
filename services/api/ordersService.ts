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
import { extractList } from '@/utils/extractList';
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

/* ── Order history (verified live 2026-10-14) ───────────────────────────────
   GET /orders       -> Laravel paginator of orders (no items)
   GET /orders/:id   -> one order including items[] with the product embedded
   Money fields arrive as strings ("50000.00"). The only status seen so far is
   "placed" with payment_status "pending". */

export interface ApiOrderItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  total_price: string;
  currency?: string;
  product?: {
    id: number;
    title?: string;
    media_url?: string | null;
    thumbnail_url?: string | null;
    category?: string | null;
  };
}

export interface ApiOrderRecord {
  id: number;
  user_id: number;
  seller_id: number;
  status: string;
  payment_status: string;
  payment_method?: string | null;
  payment_reference?: string | null;
  subtotal: string;
  tax: string;
  shipping: string;
  total: string;
  currency: string;
  shipping_address?: { line1?: string; city?: string; country?: string; [key: string]: any } | null;
  created_at: string;
  items?: ApiOrderItem[];
}

// GET /orders
export const getOrders = async (page = 1): Promise<ApiOrderRecord[]> => {
  const res = await apiClient.get<any>(API_ENDPOINTS.ORDERS.LIST, { params: { page } });
  return extractList<ApiOrderRecord>(res.data);
};

// GET /orders/:id
export const getOrderById = async (id: string | number): Promise<ApiOrderRecord> => {
  const res = await apiClient.get<any>(API_ENDPOINTS.ORDERS.BY_ID(id));
  return res.data as ApiOrderRecord;
};

/* ── presentation helpers ────────────────────────────────────────────────── */

const humanize = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

/** Colour keys: screens map these onto their own theme. */
export type OrderTone = 'warn' | 'good' | 'info' | 'bad' | 'muted';

export const describeOrderStatus = (status: string): { label: string; tone: OrderTone } => {
  switch ((status || '').toLowerCase()) {
    case 'placed':
    case 'pending':
      return { label: 'Order placed', tone: 'warn' };
    case 'confirmed':
    case 'processing':
    case 'packed':
      return { label: humanize(status), tone: 'info' };
    case 'shipped':
    case 'out_for_delivery':
      return { label: humanize(status), tone: 'info' };
    case 'delivered':
    case 'completed':
      return { label: 'Delivered', tone: 'good' };
    case 'cancelled':
    case 'canceled':
    case 'failed':
      return { label: humanize(status), tone: 'bad' };
    default:
      return { label: status ? humanize(status) : 'Unknown', tone: 'muted' };
  }
};

export const describePaymentStatus = (status: string): { label: string; tone: OrderTone } => {
  switch ((status || '').toLowerCase()) {
    case 'paid':
    case 'success':
    case 'successful':
      return { label: 'Paid', tone: 'good' };
    case 'pending':
      return { label: 'Awaiting payment', tone: 'warn' };
    case 'failed':
      return { label: 'Payment failed', tone: 'bad' };
    case 'refunded':
      return { label: 'Refunded', tone: 'muted' };
    default:
      return { label: status ? humanize(status) : 'Unknown', tone: 'muted' };
  }
};

export const toAmount = (value: string | number | null | undefined): number => Number(value) || 0;
