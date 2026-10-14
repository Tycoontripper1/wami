import { formatPrice, formatPriceRange, REGIONS } from '@/data/regions';
import { RootState } from '@/store/store';
import { useSelector } from 'react-redux';

/**
 * Hook to get location-aware data and utilities
 */
export function useLocation() {
  const locationState = useSelector((state: RootState) => state.location);
  const region = REGIONS[locationState.currentRegion] || REGIONS.NG;

  return {
    region,
    city: locationState.currentCity,
    regionCode: locationState.currentRegion,
    isLocationDetected: locationState.isLocationDetected,
    isLoading: locationState.isLoading,
    coordinates: locationState.coordinates,
    
    currencySymbol: region.currencySymbol,
    
    // Utility functions
    formatPrice: (priceInUSD: number) => formatPrice(priceInUSD, locationState.currentRegion),
    formatPriceRange: (minUSD: number, maxUSD: number) => formatPriceRange(minUSD, maxUSD, locationState.currentRegion),
  };
}
