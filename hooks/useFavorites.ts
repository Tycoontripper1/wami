import { CreativeData } from '@/components/SwipeableCardStack';
import { saveOffering, unsaveOffering } from '@/services/api/discoveryService';
import { addFavorite, removeFavorite } from '@/store/favoritesSlice';
import { RootState } from '@/store/store';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Saving an offering: the Redux list (so the UI updates instantly and the
 * Saved screen can show it) plus the backend call. One implementation for
 * every heart in the app so they all behave — and stay in sync — the same.
 */
export function useFavorites() {
  const dispatch = useDispatch();
  const items = useSelector((state: RootState) => state.favorites.items);

  const isFavorite = useCallback(
    (id: string | number) => items.some((fav) => String(fav.id) === String(id)),
    [items],
  );

  const toggle = useCallback(
    (item: CreativeData) => {
      const id = String(item.id);
      if (items.some((fav) => String(fav.id) === id)) {
        dispatch(removeFavorite(id));
        unsaveOffering(id).catch((error) => console.error('Failed to unsave offering:', error));
      } else {
        dispatch(addFavorite({ ...item, id }));
        saveOffering(id).catch((error) => console.error('Failed to save offering:', error));
      }
    },
    [items, dispatch],
  );

  return { isFavorite, toggle };
}
