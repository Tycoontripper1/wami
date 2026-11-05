import { apiClient } from './client';
import { API_ENDPOINTS } from './config';
import { extractList } from '@/utils/extractList';

export interface ApiCategory {
  id: number;
  name: string;
  slug?: string;
  icon?: string;
}

// What the server listed when this was written, for when it can't be reached.
export const FALLBACK_CATEGORIES: ApiCategory[] = [
  { id: 1, name: 'Photography', slug: 'photography' },
  { id: 2, name: 'Makeup', slug: 'makeup' },
  { id: 3, name: 'Event Planning', slug: 'event-planning' },
  { id: 4, name: 'Fashion', slug: 'fashion' },
  { id: 5, name: 'Food', slug: 'food' },
  { id: 6, name: 'Nails', slug: 'nails' },
  { id: 7, name: 'Videography', slug: 'videography' },
  { id: 8, name: 'Hair', slug: 'hair' },
  { id: 9, name: 'Shoes', slug: 'shoes' },
  { id: 10, name: 'Others', slug: 'others' },
];

let cached: ApiCategory[] | null = null;

// GET /account/categories — public. The list comes back as `{ success, categories: [...] }`.
export const getCategories = async (): Promise<ApiCategory[]> => {
  if (cached) return cached;
  try {
    const res = await apiClient.get<any>(API_ENDPOINTS.ACCOUNT.CATEGORIES, { raw: true });
    const body: any = res.data;
    const rows = extractList<ApiCategory>(body?.categories ?? body);
    if (rows.length > 0) cached = rows;
    return rows.length > 0 ? rows : FALLBACK_CATEGORIES;
  } catch {
    return FALLBACK_CATEGORIES;
  }
};
