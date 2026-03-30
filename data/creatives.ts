
export interface Creative {
  id: string;
  name: string;
  role: string;
  category: CreativeCategory;
  location: {
    city: string;
    region: string; // Region code (e.g., 'NG', 'US', 'GB')
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  rating: number;
  reviews: number;
  // Prices stored in USD for easy conversion
  priceRange: {
    minUSD: number;
    maxUSD: number;
  };
  about: string;
  tags: string[];
  images: string[];
  video?: string;
  verified: boolean;
  featured: boolean;
  responseTime: string; // e.g., "Usually responds within 1 hour"
  completedJobs: number;
  joinedDate: string;
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    website?: string;
  };
}

export type CreativeCategory = 
  | 'photographer'
  | 'videographer'
  | 'hairstylist'
  | 'makeup_artist'
  | 'fashion_designer'
  | 'caterer'
  | 'event_planner'
  | 'dj'
  | 'musician'
  | 'decorator'
  | 'cake_maker'
  | 'florist'
  | 'mc'
  | 'dancer'
  | 'artist';

export const CATEGORY_LABELS: Record<CreativeCategory, string> = {
  photographer: 'Photographer',
  videographer: 'Videographer',
  hairstylist: 'Hair Stylist',
  makeup_artist: 'Makeup Artist',
  fashion_designer: 'Fashion Designer',
  caterer: 'Food & Catering',
  event_planner: 'Event Planner',
  dj: 'DJ',
  musician: 'Musician',
  decorator: 'Decorator',
  cake_maker: 'Cake Maker',
  florist: 'Florist',
  mc: 'MC / Host',
  dancer: 'Dancer',
  artist: 'Visual Artist',
};

// Mock creatives data for different regions
export const MOCK_CREATIVES: Creative[] = [
  // NIGERIA - Lagos
  {
    id: 'ng-1',
    name: 'Paul Studio',
    role: 'Photographer',
    category: 'photographer',
    location: { city: 'Lagos', region: 'NG', coordinates: { lat: 6.5244, lng: 3.3792 } },
    rating: 4.9,
    reviews: 120,
    priceRange: { minUSD: 50, maxUSD: 300 },
    about: 'Award-winning photographer with 10+ years of experience capturing unforgettable moments. Specializing in weddings, portraits, and commercial photography.',
    tags: ['Photography', 'Weddings', 'Portraits', 'Commercial'],
    images: [
      'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=800',
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 1 hour',
    completedJobs: 245,
    joinedDate: '2020-03-15',
    socialLinks: { instagram: '@paulstudio' },
  },
  {
    id: 'ng-2',
    name: 'Sandra Hair Studio',
    role: 'Hair Stylist',
    category: 'hairstylist',
    location: { city: 'Lagos', region: 'NG', coordinates: { lat: 6.4541, lng: 3.3947 } },
    rating: 4.8,
    reviews: 85,
    priceRange: { minUSD: 20, maxUSD: 150 },
    about: 'Expert braider and natural hair specialist. Creating beautiful styles for all occasions.',
    tags: ['Hair', 'Braids', 'Natural Hair', 'Wigs'],
    images: [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',
    ],
    verified: true,
    featured: false,
    responseTime: 'Usually responds within 2 hours',
    completedJobs: 180,
    joinedDate: '2021-06-20',
  },
  {
    id: 'ng-3',
    name: 'Chef Tunde Catering',
    role: 'Food & Catering',
    category: 'caterer',
    location: { city: 'Lagos', region: 'NG', coordinates: { lat: 6.5954, lng: 3.3488 } },
    rating: 4.7,
    reviews: 95,
    priceRange: { minUSD: 100, maxUSD: 500 },
    about: 'Premium catering services for weddings, corporate events, and private parties. Nigerian and continental cuisine.',
    tags: ['Catering', 'Nigerian Food', 'Continental', 'Events'],
    images: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=800',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 3 hours',
    completedJobs: 320,
    joinedDate: '2019-01-10',
  },
  {
    id: 'ng-4',
    name: 'Amara MUA',
    role: 'Makeup Artist',
    category: 'makeup_artist',
    location: { city: 'Abuja', region: 'NG', coordinates: { lat: 9.0765, lng: 7.3986 } },
    rating: 5.0,
    reviews: 200,
    priceRange: { minUSD: 30, maxUSD: 200 },
    about: 'Celebrity makeup artist with signature glam looks. Bridal, editorial, and special occasion makeup.',
    tags: ['Makeup', 'Bridal', 'Glam', 'Editorial'],
    images: [
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 1 hour',
    completedJobs: 450,
    joinedDate: '2018-11-05',
  },
  
  // USA - New York
  {
    id: 'us-1',
    name: 'Brooklyn Lens Photography',
    role: 'Photographer',
    category: 'photographer',
    location: { city: 'New York', region: 'US', coordinates: { lat: 40.6782, lng: -73.9442 } },
    rating: 4.9,
    reviews: 350,
    priceRange: { minUSD: 200, maxUSD: 1500 },
    about: 'NYC-based photographer specializing in lifestyle, fashion, and event photography. Featured in Vogue and GQ.',
    tags: ['Photography', 'Fashion', 'Lifestyle', 'Events'],
    images: [
      'https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 2 hours',
    completedJobs: 520,
    joinedDate: '2017-05-20',
  },
  {
    id: 'us-2',
    name: 'Glam by Maria',
    role: 'Makeup Artist',
    category: 'makeup_artist',
    location: { city: 'Los Angeles', region: 'US', coordinates: { lat: 34.0522, lng: -118.2437 } },
    rating: 4.8,
    reviews: 280,
    priceRange: { minUSD: 150, maxUSD: 800 },
    about: 'Hollywood makeup artist with 15 years experience. Red carpet, bridal, and editorial specialist.',
    tags: ['Makeup', 'Hollywood', 'Bridal', 'Red Carpet'],
    images: [
      'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 4 hours',
    completedJobs: 680,
    joinedDate: '2015-08-12',
  },
  {
    id: 'us-3',
    name: 'Soul Food Queens',
    role: 'Food & Catering',
    category: 'caterer',
    location: { city: 'Atlanta', region: 'US', coordinates: { lat: 33.7490, lng: -84.3880 } },
    rating: 4.9,
    reviews: 175,
    priceRange: { minUSD: 300, maxUSD: 2000 },
    about: 'Award-winning southern catering. Soul food with a modern twist for all your special occasions.',
    tags: ['Catering', 'Soul Food', 'Southern', 'Events'],
    images: [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
    ],
    verified: true,
    featured: false,
    responseTime: 'Usually responds within 6 hours',
    completedJobs: 280,
    joinedDate: '2019-03-22',
  },
  
  // UK - London
  {
    id: 'gb-1',
    name: 'London Glamour Studio',
    role: 'Hair Stylist',
    category: 'hairstylist',
    location: { city: 'London', region: 'GB', coordinates: { lat: 51.5074, lng: -0.1278 } },
    rating: 4.7,
    reviews: 220,
    priceRange: { minUSD: 100, maxUSD: 600 },
    about: 'Premier hair styling in central London. Specializing in Afro-Caribbean hair, extensions, and bridal styles.',
    tags: ['Hair', 'Extensions', 'Bridal', 'Afro'],
    images: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 3 hours',
    completedJobs: 390,
    joinedDate: '2018-02-14',
  },
  {
    id: 'gb-2',
    name: 'Manchester Highlights',
    role: 'Videographer',
    category: 'videographer',
    location: { city: 'Manchester', region: 'GB', coordinates: { lat: 53.4808, lng: -2.2426 } },
    rating: 4.8,
    reviews: 145,
    priceRange: { minUSD: 250, maxUSD: 1200 },
    about: 'Cinematic wedding and event videography. Telling your story through beautiful visuals.',
    tags: ['Video', 'Weddings', 'Cinematic', 'Events'],
    images: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800',
    ],
    verified: true,
    featured: false,
    responseTime: 'Usually responds within 5 hours',
    completedJobs: 185,
    joinedDate: '2020-07-08',
  },
  
  // Germany - Berlin
  {
    id: 'de-1',
    name: 'Berlin Creative Studio',
    role: 'Photographer',
    category: 'photographer',
    location: { city: 'Berlin', region: 'DE', coordinates: { lat: 52.5200, lng: 13.4050 } },
    rating: 4.9,
    reviews: 180,
    priceRange: { minUSD: 150, maxUSD: 900 },
    about: 'Contemporary photography with an artistic edge. Fashion, portraits, and commercial work.',
    tags: ['Photography', 'Fashion', 'Art', 'Commercial'],
    images: [
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 4 hours',
    completedJobs: 290,
    joinedDate: '2019-09-18',
  },
  
  // Ghana - Accra
  {
    id: 'gh-1',
    name: 'Accra Beauty Lounge',
    role: 'Makeup Artist',
    category: 'makeup_artist',
    location: { city: 'Accra', region: 'GH', coordinates: { lat: 5.6037, lng: -0.1870 } },
    rating: 4.8,
    reviews: 95,
    priceRange: { minUSD: 25, maxUSD: 120 },
    about: 'Premium makeup services for all occasions. Specializing in African beauty and bridal glam.',
    tags: ['Makeup', 'Bridal', 'African Beauty', 'Glam'],
    images: [
      'https://images.unsplash.com/photo-1457972729786-0411a3b2b626?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 2 hours',
    completedJobs: 165,
    joinedDate: '2021-01-25',
  },
  {
    id: 'gh-2',
    name: 'Kumasi Kente Fashion',
    role: 'Fashion Designer',
    category: 'fashion_designer',
    location: { city: 'Kumasi', region: 'GH', coordinates: { lat: 6.6885, lng: -1.6244 } },
    rating: 4.9,
    reviews: 75,
    priceRange: { minUSD: 50, maxUSD: 400 },
    about: 'Traditional Kente wear with modern designs. Custom outfits for weddings and special events.',
    tags: ['Fashion', 'Kente', 'Traditional', 'Wedding'],
    images: [
      'https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800',
    ],
    verified: true,
    featured: false,
    responseTime: 'Usually responds within 4 hours',
    completedJobs: 120,
    joinedDate: '2020-05-30',
  },
  
  // Kenya - Nairobi
  {
    id: 'ke-1',
    name: 'Nairobi Events Pro',
    role: 'Event Planner',
    category: 'event_planner',
    location: { city: 'Nairobi', region: 'KE', coordinates: { lat: -1.2921, lng: 36.8219 } },
    rating: 4.7,
    reviews: 110,
    priceRange: { minUSD: 200, maxUSD: 1500 },
    about: 'Full-service event planning for corporate functions, weddings, and private celebrations.',
    tags: ['Events', 'Weddings', 'Corporate', 'Planning'],
    images: [
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 3 hours',
    completedJobs: 85,
    joinedDate: '2021-08-15',
  },
  
  // South Africa - Cape Town
  {
    id: 'za-1',
    name: 'Cape Town DJ Collective',
    role: 'DJ',
    category: 'dj',
    location: { city: 'Cape Town', region: 'ZA', coordinates: { lat: -33.9249, lng: 18.4241 } },
    rating: 4.9,
    reviews: 200,
    priceRange: { minUSD: 150, maxUSD: 800 },
    about: 'Top DJs for weddings, clubs, and corporate events. All genres from Afrobeats to House.',
    tags: ['DJ', 'Music', 'Events', 'Weddings'],
    images: [
      'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 2 hours',
    completedJobs: 350,
    joinedDate: '2018-04-10',
  },
  
  // Canada - Toronto
  {
    id: 'ca-1',
    name: 'Toronto Cakes & More',
    role: 'Cake Maker',
    category: 'cake_maker',
    location: { city: 'Toronto', region: 'CA', coordinates: { lat: 43.6532, lng: -79.3832 } },
    rating: 4.8,
    reviews: 165,
    priceRange: { minUSD: 100, maxUSD: 700 },
    about: 'Custom cakes for weddings, birthdays, and all celebrations. Fondant art and delicious flavors.',
    tags: ['Cakes', 'Wedding', 'Custom', 'Bakery'],
    images: [
      'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800',
    ],
    verified: true,
    featured: false,
    responseTime: 'Usually responds within 4 hours',
    completedJobs: 220,
    joinedDate: '2019-11-20',
  },
  
  // Australia - Sydney
  {
    id: 'au-1',
    name: 'Sydney Florals',
    role: 'Florist',
    category: 'florist',
    location: { city: 'Sydney', region: 'AU', coordinates: { lat: -33.8688, lng: 151.2093 } },
    rating: 4.9,
    reviews: 140,
    priceRange: { minUSD: 80, maxUSD: 500 },
    about: 'Exquisite floral arrangements for weddings, events, and everyday celebrations.',
    tags: ['Flowers', 'Wedding', 'Events', 'Arrangements'],
    images: [
      'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 3 hours',
    completedJobs: 195,
    joinedDate: '2020-02-28',
  },
  
  // France - Paris
  {
    id: 'fr-1',
    name: 'Paris Elegance Decor',
    role: 'Decorator',
    category: 'decorator',
    location: { city: 'Paris', region: 'FR', coordinates: { lat: 48.8566, lng: 2.3522 } },
    rating: 4.8,
    reviews: 125,
    priceRange: { minUSD: 300, maxUSD: 2000 },
    about: 'Luxury event decoration with French elegance. Weddings, galas, and corporate events.',
    tags: ['Decoration', 'Luxury', 'Events', 'Wedding'],
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
    ],
    verified: true,
    featured: true,
    responseTime: 'Usually responds within 6 hours',
    completedJobs: 145,
    joinedDate: '2019-06-15',
  },
];

// Get creatives by region
export const getCreativesByRegion = (regionCode: string): Creative[] => {
  return MOCK_CREATIVES.filter((c) => c.location.region === regionCode);
};

// Get creatives by city
export const getCreativesByCity = (city: string): Creative[] => {
  return MOCK_CREATIVES.filter((c) => c.location.city.toLowerCase() === city.toLowerCase());
};

// Get creatives by category
export const getCreativesByCategory = (category: CreativeCategory): Creative[] => {
  return MOCK_CREATIVES.filter((c) => c.category === category);
};

// Get featured creatives
export const getFeaturedCreatives = (regionCode?: string): Creative[] => {
  let creatives = MOCK_CREATIVES.filter((c) => c.featured);
  if (regionCode) {
    creatives = creatives.filter((c) => c.location.region === regionCode);
  }
  return creatives;
};

// Search creatives
export const searchCreatives = (query: string): Creative[] => {
  const lowerQuery = query.toLowerCase();
  return MOCK_CREATIVES.filter(
    (c) =>
      c.name.toLowerCase().includes(lowerQuery) ||
      c.role.toLowerCase().includes(lowerQuery) ||
      c.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
      c.location.city.toLowerCase().includes(lowerQuery)
  );
};

// Get creative by ID
export const getCreativeById = (id: string): Creative | undefined => {
  return MOCK_CREATIVES.find((c) => c.id === id);
};

// Get nearby creatives (mock - in real app would use actual distance calculation)
export const getNearbyCreatives = (city: string, maxDistance?: number): Creative[] => {
  // For now, return creatives from the same city + some from nearby cities
  const sameCity = getCreativesByCity(city);
  
  // Add some variety - get 2-3 from other cities in the same region
  if (sameCity.length > 0) {
    const region = sameCity[0].location.region;
    const otherInRegion = MOCK_CREATIVES.filter(
      (c) => c.location.region === region && c.location.city !== city
    ).slice(0, 3);
    return [...sameCity, ...otherInRegion];
  }
  
  return sameCity;
};
