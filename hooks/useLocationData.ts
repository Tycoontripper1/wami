import { Creative, getCreativesByCity, getCreativesByRegion, getNearbyCreatives, MOCK_CREATIVES } from '@/data/creatives';
import { formatPrice, formatPriceRange, REGIONS } from '@/data/regions';
import { RootState } from '@/store/store';
import { useMemo } from 'react';
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

/**
 * Hook to get creatives based on user's current location
 */
export function useLocationCreatives() {
  const locationState = useSelector((state: RootState) => state.location);
  const { currentRegion, currentCity } = locationState;
  
  // Get creatives based on location
  const nearbyCreatives = useMemo(() => {
    return getNearbyCreatives(currentCity);
  }, [currentCity]);
  
  const regionCreatives = useMemo(() => {
    return getCreativesByRegion(currentRegion);
  }, [currentRegion]);
  
  const cityCreatives = useMemo(() => {
    return getCreativesByCity(currentCity);
  }, [currentCity]);
  
  // For the discover/swipe feature, combine nearby with some variety
  const discoverCreatives = useMemo(() => {
    // Start with nearby creatives
    const nearby = [...nearbyCreatives];
    
    // Add some from other regions for variety (featured ones)
    const otherRegionFeatured = MOCK_CREATIVES.filter(
      (c) => c.location.region !== currentRegion && c.featured
    ).slice(0, 3);
    
    return [...nearby, ...otherRegionFeatured];
  }, [nearbyCreatives, currentRegion]);
  
  return {
    nearbyCreatives,
    regionCreatives,
    cityCreatives,
    discoverCreatives,
    totalNearby: nearbyCreatives.length,
  };
}

/**
 * Hook to format a creative's price for the current location
 */
export function useCreativePrice(creative: Creative) {
  const { formatPrice, formatPriceRange } = useLocation();
  
  return {
    minPrice: formatPrice(creative.priceRange.minUSD),
    maxPrice: formatPrice(creative.priceRange.maxUSD),
    priceRange: formatPriceRange(creative.priceRange.minUSD, creative.priceRange.maxUSD),
  };
}

/**
 * Get the display location string for a creative
 */
export function getCreativeLocationDisplay(creative: Creative, userRegion: string): string {
  const isLocal = creative.location.region === userRegion;
  if (isLocal) {
    return creative.location.city;
  }
  // Show city and country for non-local creatives
  const region = REGIONS[creative.location.region];
  return `${creative.location.city}, ${region?.name || creative.location.region}`;
}
