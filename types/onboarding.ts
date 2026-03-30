export interface OnboardingData {
  purpose: 'discover' | 'promote' | 'both' | null;
  interests: string[];
  locationType: 'near_me' | 'specific_city' | 'anywhere' | null;
  selectedCity?: string;
  location?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
  notificationsEnabled: boolean;
  isComplete: boolean;
}

export const INTEREST_OPTIONS = [
  'Photography',
  'Venues',
  'Fashion',
  'Events',
  'Videography',
  'Food',
  'Hair',
  'Nails',
  'Shoes',
  'Others',
] as const;

export const POPULAR_CITIES = [
  'Worldwide Experience',
  'Barcelona',
  'Beijing',
  'Berlin',
  'Chengdu',
  'Chicago',
  'London',
  'Los Angeles',
  'Manchester',
  'New York',
  'Paris',
  'Tokyo',
] as const;
