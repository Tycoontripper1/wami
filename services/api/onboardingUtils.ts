import {
    AvailabilityOption,
    DiscoveryPreference,
    OfferingType,
    ProfileVisibility,
    SetupAccountRequest
} from '@/types/accountTypes';
import { CREATIVE_CATEGORIES } from '@/types/creativeOnboarding';
import { INTEREST_OPTIONS } from '@/types/onboarding';

/**
 * Maps interest strings to numeric IDs (1-based index)
 */
export const mapInterestsToIds = (interests: string[]): number[] => {
  return interests.map(interest => {
    const index = INTEREST_OPTIONS.indexOf(interest as any);
    return index !== -1 ? index + 1 : 10; // Default to 'Others' (10) if not found
  });
};

/**
 * Maps creative category strings to numeric IDs (1-based index)
 */
export const mapCategoriesToIds = (categories: string[]): number[] => {
  return categories.map(category => {
    const index = CREATIVE_CATEGORIES.indexOf(category as any);
    return index !== -1 ? index + 1 : 10; // Default to 'Others' (10) if not found
  });
};

/**
 * Consolidates Redux state into the SetupAccountRequest format
 */
export const consolidateOnboardingData = (
  onboarding: any,
  creative: any
): SetupAccountRequest => {
  const purpose = onboarding.purpose;

  if (purpose === 'discover') {
    return {
      account_type: 'discover',
      categories: mapInterestsToIds(onboarding.interests),
      discovery_preference: onboarding.locationType as DiscoveryPreference || 'near_me',
      location: {
        city: onboarding.location?.city || onboarding.selectedCity || 'Unknown',
        country: 'Nigeria', // Default or extract from location string
        latitude: onboarding.location?.latitude,
        longitude: onboarding.location?.longitude,
      },
      interests: mapInterestsToIds(onboarding.interests),
    };
  }

  if (purpose === 'promote') {
    const [city, country] = (creative.brand.location || '').split(',').map((s: string) => s.trim());
    
    return {
      account_type: 'promote',
      creative_categories: mapCategoriesToIds(creative.categories),
      offering_type: creative.offeringType as OfferingType || 'services',
      brand: {
        name: creative.brand.name,
        description: creative.brand.description || '', // If available
        city: city || 'Lagos',
        country: country || 'Nigeria',
      },
      instagram_handle: creative.instagram?.username,
      website: creative.website,
      availability: creative.availability as AvailabilityOption[],
      visibility: creative.visibility as ProfileVisibility,
      bio: creative.instagram?.bio || '', // Use Instagram bio as default bio
    };
  }

  if (purpose === 'both') {
    const [city, country] = (creative.brand.location || '').split(',').map((s: string) => s.trim());

    return {
      account_type: 'both',
      categories: mapInterestsToIds(onboarding.interests),
      discovery_preference: onboarding.locationType as DiscoveryPreference || 'anywhere',
      creative_categories: mapCategoriesToIds(creative.categories),
      offering_type: creative.offeringType as OfferingType || 'both',
      brand: {
        name: creative.brand.name,
        city: city || 'Lagos',
        country: country || 'Nigeria',
      },
      instagram_handle: creative.instagram?.username,
      availability: creative.availability as AvailabilityOption[],
      visibility: creative.visibility as ProfileVisibility,
      interests: mapInterestsToIds(onboarding.interests),
      bio: creative.instagram?.bio || '',
    };
  }

  // Fallback
  throw new Error('Invalid onboarding purpose');
};
