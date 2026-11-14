// Offers Service - price offers on a listing: a buyer offers less than the
// listed price, the seller accepts, declines or counters, and an accepted offer
// sets the price in the buyer's cart.
//
// The backend does not have these endpoints yet (POST /offers, PUT /offers/:id
// answer 404 as of 2026-11-15); the contract below is what the backend brief
// asks for. The screens only use it when OFFERS_ENABLED is on
// (constants/Features.ts); until then an offer is sent as a plain chat message.
//
//   POST /offers      { listing_id, amount }            -> the offer
//   PUT  /offers/:id  { status, amount? }               -> the offer
//     status: accepted | declined | countered (with amount) | withdrawn
// A chat message that is an offer carries `type: 'offer'` and an `offer` block.

import { apiClient } from './client';

export type OfferStatus = 'pending' | 'accepted' | 'declined' | 'countered' | 'withdrawn' | 'expired';

export interface ApiOffer {
  id: string;
  listing_id: string;
  conversation_id?: string;
  buyer_id?: string;
  seller_id?: string;
  /** Naira being offered. */
  amount: number;
  /** What the listing costs without the offer. */
  listed_price?: number;
  status: OfferStatus;
  expires_at?: string;
  created_at?: string;
}

const num = (value: unknown): number => {
  const n = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const STATUSES: OfferStatus[] = ['pending', 'accepted', 'declined', 'countered', 'withdrawn', 'expired'];

/** An offer as the screens read it, or null when the block is not an offer. */
export const normaliseOffer = (raw: any): ApiOffer | null => {
  if (!raw || raw.id === undefined) return null;
  const status = String(raw.status ?? 'pending').toLowerCase() as OfferStatus;
  return {
    id: String(raw.id),
    listing_id: String(raw.listing_id ?? raw.listing?.id ?? ''),
    conversation_id: raw.conversation_id !== undefined ? String(raw.conversation_id) : undefined,
    buyer_id: raw.buyer_id !== undefined ? String(raw.buyer_id) : undefined,
    seller_id: raw.seller_id !== undefined ? String(raw.seller_id) : undefined,
    amount: num(raw.amount),
    listed_price: raw.listed_price !== undefined ? num(raw.listed_price) : undefined,
    status: STATUSES.includes(status) ? status : 'pending',
    expires_at: raw.expires_at ?? undefined,
    created_at: raw.created_at ?? undefined,
  };
};

// quiet: a server without offers (404/405) is expected until it exists.
const quiet = { expectUnsupported: true } as const;

export const createOffer = async (input: { listing_id: string | number; amount: number }): Promise<ApiOffer> => {
  const res = await apiClient.post<any>('/offers', input, quiet);
  const offer = normaliseOffer(res.data?.offer ?? res.data);
  if (!offer) throw new Error('The offer was sent but we did not get it back.');
  return offer;
};

/** The person who received the offer answers it; the maker may withdraw it while it is pending. */
export const answerOffer = async (
  id: string | number,
  status: 'accepted' | 'declined' | 'countered' | 'withdrawn',
  amount?: number
): Promise<ApiOffer> => {
  const res = await apiClient.put<any>(`/offers/${id}`, amount !== undefined ? { status, amount } : { status }, quiet);
  const offer = normaliseOffer(res.data?.offer ?? res.data);
  if (!offer) throw new Error('We could not read the answer. Please try again.');
  return offer;
};
