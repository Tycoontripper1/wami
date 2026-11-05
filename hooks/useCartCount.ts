import { getCartLines } from '@/services/api/ordersService';
import type { RootState } from '@/store/store';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

/** How many things are in the signed-in person's cart, refreshed whenever the screen is shown. Zero for guests. */
export function useCartCount(): number {
  const signedIn = useSelector((s: RootState) => s.auth.isAuthenticated);
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!signedIn) {
        setCount(0);
        return;
      }
      let live = true;
      getCartLines()
        .then((lines) => {
          if (live) setCount(lines.reduce((n, l) => n + l.quantity, 0));
        })
        .catch(() => {});
      return () => {
        live = false;
      };
    }, [signedIn])
  );

  return count;
}
