export type AccountType = 'discover' | 'promote' | 'both';
export type DiscoveryPreference = 'near_me' | 'anywhere' | 'specific_city';
export type OfferingType = 'services' | 'products' | 'both';
export type ProfileVisibility = 'public' | 'private';
export type AvailabilityOption = 'appointment' | 'walk_in' | 'online' | 'delivery';

export interface LocationData {
  city: string;
  country: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
}

export interface BrandData {
  name: string;
  description?: string;
  city: string;
  country: string;
  state?: string;
  address?: string;
}

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  website?: string;
}

export interface DiscoverSetup {
  account_type: 'discover';
  categories: number[]; // Using numeric IDs as per example [1, 2, 3]
  discovery_preference: DiscoveryPreference;
  location: LocationData;
  interests?: number[]; // Added dynamic interests support if needed
}

export interface PromoteSetup {
  account_type: 'promote';
  creative_categories: number[];
  offering_type: OfferingType;
  brand: BrandData;
  instagram_handle?: string;
  website?: string;
  availability: AvailabilityOption[];
  visibility: ProfileVisibility;
  bio?: string;
  discovery_preference?: DiscoveryPreference;
  interests?: number[];
  social_links?: SocialLinks;
}

export interface BothSetup {
  account_type: 'both';
  categories: number[];
  discovery_preference: DiscoveryPreference;
  creative_categories: number[];
  offering_type: OfferingType;
  brand: BrandData;
  instagram_handle?: string;
  availability: AvailabilityOption[];
  visibility: ProfileVisibility;
  interests?: number[];
  bio?: string;
}

export type SetupAccountRequest = DiscoverSetup | PromoteSetup | BothSetup;

export interface Category {
  id: number;
  name: string;
  icon?: string;
}

export interface SetupOption {
  id: string;
  title: string;
  description: string;
}

export interface SetupStatus {
  is_setup: boolean;
  account_type?: AccountType;
  step?: string;
}

export interface UpdateProfileRequest {
  first_name: string;
  last_name: string;
  bio?: string;
  categories?: number[];
  instagram_handle?: string;
  website?: string;
  location?: {
    city: string;
    country: string;
  };
  brand?: {
    name: string;
    city: string;
    country: string;
  };
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

export interface AccountActionRequest {
  password: string;
}

