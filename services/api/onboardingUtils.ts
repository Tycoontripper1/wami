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
 * The server's own category ids (GET /account/categories). The app's lists
 * word a few of these differently and order them differently, so ids are
 * looked up by name, never by position in the local list.
 */
const CATEGORY_ID: Record<string, number> = {
  photography: 1,
  makeup: 2,
  'event planning': 3,
  events: 3,
  venues: 3,
  fashion: 4,
  food: 5,
  nails: 6,
  videography: 7,
  hair: 8,
  shoes: 9,
  others: 10,
};
const OTHERS_ID = 10;

const toIds = (names: string[]): number[] => {
  const ids = names.map((n) => CATEGORY_ID[String(n).trim().toLowerCase()] ?? OTHERS_ID);
  return Array.from(new Set(ids));
};

/** Maps interest names to the server's category ids. */
export const mapInterestsToIds = (interests: string[]): number[] => toIds(interests);

/** Maps creative category names to the server's category ids. */
export const mapCategoriesToIds = (categories: string[]): number[] => toIds(categories);

/**
 * Consolidates Redux state into the SetupAccountRequest format
 */
export const consolidateOnboardingData = (
  onboarding: any,
  creative: any
): SetupAccountRequest => {
  // The creative screens can be reached without the "what brings you here"
  // question (for instance from Profile > Become a Creative), which leaves the
  // purpose empty. Someone who has filled in creative details is a creative,
  // whatever the purpose says.
  const creativeIds = mapCategoriesToIds(creative?.categories || []);
  const interestIds = mapInterestsToIds(onboarding.interests || []);
  const filledCreative = creativeIds.length > 0 || !!creative?.brand?.name;
  let purpose = onboarding.purpose || 'discover';
  if (filledCreative && purpose === 'discover') purpose = interestIds.length > 0 ? 'both' : 'promote';

  // The server needs at least one `categories` entry on every account. When
  // someone has not picked any interests, what a creative makes stands in,
  // and "Others" is the last resort, so setup never dead-ends on this.
  const categoryIds = interestIds.length > 0 ? interestIds : creativeIds.length > 0 ? creativeIds : [OTHERS_ID];

  if (purpose === 'discover') {
    return {
      account_type: 'discover',
      categories: categoryIds,
      discovery_preference: onboarding.locationType as DiscoveryPreference || 'near_me',
      location: {
        city: onboarding.location?.city || onboarding.selectedCity || 'Unknown',
        country: 'Nigeria',
        latitude: onboarding.location?.latitude,
        longitude: onboarding.location?.longitude,
      },
      interests: interestIds,
    };
  }

  if (purpose === 'promote') {
    const [city, country] = (creative.brand.location || '').split(',').map((s: string) => s.trim());
    
    return {
      account_type: 'promote',
      categories: categoryIds,
      creative_categories: creativeIds.length > 0 ? creativeIds : [OTHERS_ID],
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
      categories: categoryIds,
      discovery_preference: onboarding.locationType as DiscoveryPreference || 'anywhere',
      creative_categories: creativeIds.length > 0 ? creativeIds : [OTHERS_ID],
      offering_type: creative.offeringType as OfferingType || 'both',
      brand: {
        name: creative.brand.name,
        city: city || 'Lagos',
        country: country || 'Nigeria',
      },
      instagram_handle: creative.instagram?.username,
      availability: creative.availability as AvailabilityOption[],
      visibility: creative.visibility as ProfileVisibility,
      interests: interestIds,
      bio: creative.instagram?.bio || '',
    };
  }

  // Fallback
  throw new Error('Invalid onboarding purpose');
};

/**
 * True when a request failed because there is no valid session (HTTP 401 /
 * "Unauthenticated."), as opposed to a validation or server problem. Retrying
 * such a request can never succeed; the user has to sign in first.
 */
export const isUnauthenticatedError = (error: any): boolean =>
  error?.statusCode === 401 ||
  error?.code === 'HTTP_401' ||
  /unauthenticated/i.test(String(error?.message ?? ''));
