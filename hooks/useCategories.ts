import { ApiCategory, FALLBACK_CATEGORIES, getCategories } from '@/services/api/categoriesService';
import { useEffect, useState } from 'react';

/** The categories Wami keeps, ready straight away (the built-in list) and swapped for the server's when it answers. */
export function useCategories(): ApiCategory[] {
  const [categories, setCategories] = useState<ApiCategory[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    let live = true;
    getCategories().then((list) => {
      if (live) setCategories(list);
    });
    return () => {
      live = false;
    };
  }, []);

  return categories;
}
