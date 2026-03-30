// Creative Onboarding Types

export const CREATIVE_CATEGORIES = [
  'Photography',
  'Makeup',
  'Fashion',
  'Events',
  'Videography',
  'Food',
  'Hair',
  'Nails',
  'Shoes',
  'Others',
] as const;

export type CreativeCategory = typeof CREATIVE_CATEGORIES[number];

export type OfferingType = 'services' | 'products' | 'both';

export type DiscoverLocationType = 'services' | 'products' | 'both';

export type AvailabilityOption = 'appointment' | 'walk_in' | 'online' | 'delivery';

export type ProfileVisibility = 'public' | 'private';

export interface BrandDetails {
  name: string;
  location: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface InstagramProfile {
  username: string;
  fullName?: string;
  bio?: string;
  profilePicture?: string;
  postsCount?: number;
  followersCount?: number;
  website?: string;
  posts?: InstagramPost[];
}

export interface InstagramPost {
  id: string;
  imageUrl: string;
  caption?: string;
  likesCount?: number;
  timestamp?: string;
}

export interface CreativeProfile {
  categories: CreativeCategory[];
  offeringType: OfferingType | null;
  discoverLocation: DiscoverLocationType | null;
  brand: BrandDetails;
  instagram?: InstagramProfile;
  website?: string;
  availability: AvailabilityOption[];
  visibility: ProfileVisibility;
  isComplete: boolean;
}

export const AVAILABILITY_OPTIONS: { id: AvailabilityOption; title: string; description: string }[] = [
  { id: 'appointment', title: 'By Appointment', description: 'Clients can book sessions' },
  { id: 'walk_in', title: 'Walk-in', description: 'Clients can visit anytime' },
  { id: 'online', title: 'Online', description: 'Services available remotely' },
  { id: 'delivery', title: 'Delivery', description: 'Products can be delivered' },
];

export const OFFERING_TYPE_OPTIONS: { id: OfferingType; title: string; description: string }[] = [
  { id: 'services', title: 'Services', description: 'I offer services like photography, design, etc.' },
  { id: 'products', title: 'Products', description: 'I sell physical or digital products' },
  { id: 'both', title: 'Both', description: 'I offer both services and products' },
];

export const DISCOVER_LOCATION_OPTIONS: { id: DiscoverLocationType; title: string; description: string }[] = [
  { id: 'services', title: 'Services', description: 'I offer services like photography, design, etc.' },
  { id: 'products', title: 'Products', description: 'I sell physical or digital products' },
  { id: 'both', title: 'Both', description: 'I offer both services and products' },
];
