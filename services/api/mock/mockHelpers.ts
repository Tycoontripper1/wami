// Mock API Helper Functions

import { API_CONFIG } from '../config';
import { PaginatedResponse } from '../types';

// Simulate network delay
export const mockDelay = async (ms?: number): Promise<void> => {
  const delay = ms ?? API_CONFIG.MOCK_DELAY_MS;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Generate mock ID
export const generateId = (prefix: string = 'mock'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Paginate array
export function paginate<T>(
  items: T[],
  page: number = 1,
  pageSize: number = 10
): PaginatedResponse<T> {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedItems = items.slice(startIndex, endIndex);
  const totalPages = Math.ceil(items.length / pageSize);

  return {
    items: paginatedItems,
    pagination: {
      page,
      pageSize,
      total: items.length,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

// Filter array by query
export function filterByQuery<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query) return items;
  
  const lowerQuery = query.toLowerCase();
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(lowerQuery);
      }
      if (Array.isArray(value)) {
        return value.some((v: unknown) =>
          typeof v === 'string' && v.toLowerCase().includes(lowerQuery)
        );
      }
      return false;
    })
  );
}

// Sort array
export function sortArray<T>(
  items: T[],
  sortBy: keyof T,
  order: 'asc' | 'desc' = 'asc'
): T[] {
  return [...items].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

// Random item from array
export function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

// Random number between min and max
export function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Format date to ISO string
export function formatDate(date: Date = new Date()): string {
  return date.toISOString();
}

// Get random boolean
export function randomBoolean(trueChance: number = 0.5): boolean {
  return Math.random() < trueChance;
}

// Simulate random error (for testing)
export function shouldSimulateError(errorRate: number = 0): boolean {
  return Math.random() < errorRate;
}
