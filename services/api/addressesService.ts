// Addresses Service - the saved delivery address book, kept on the account.
//   GET /addresses, POST /addresses, PATCH /addresses/:id, DELETE /addresses/:id
// All signed-in only. Fields: label (Home, Work, Other), line1, city, state,
// country, phone and is_default. Only one address per user is the default and
// setting a new default clears the old one (the server does that).

import { apiClient } from './client';
import { extractList } from '@/utils/extractList';

export interface ApiAddress {
  id: string | number;
  label?: string | null;
  line1: string;
  city: string;
  state?: string | null;
  country?: string | null;
  phone?: string | null;
  is_default?: boolean | number | null;
}

export interface AddressInput {
  label: string;
  line1: string;
  city: string;
  state?: string;
  country?: string;
  phone?: string;
  is_default?: boolean;
}

// expectUnsupported keeps a missing route (an older server) from raising the
// loud development error; the caller falls back to the copy on the phone.
const quiet = { expectUnsupported: true } as const;

export const listAddresses = async (): Promise<ApiAddress[]> => {
  const res = await apiClient.get<any>('/addresses', quiet);
  return extractList<ApiAddress>(res.data);
};

export const createAddress = async (input: AddressInput): Promise<ApiAddress> => {
  const res = await apiClient.post<any>('/addresses', input, quiet);
  return (res.data?.address ?? res.data) as ApiAddress;
};

export const updateAddress = async (id: string | number, input: Partial<AddressInput>): Promise<ApiAddress> => {
  const res = await apiClient.patch<any>(`/addresses/${id}`, input, quiet);
  return (res.data?.address ?? res.data) as ApiAddress;
};

export const removeAddress = async (id: string | number): Promise<void> => {
  await apiClient.delete(`/addresses/${id}`, quiet);
};
