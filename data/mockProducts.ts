// Mock Products Data

import { formatDate } from '@/services/api/mock/mockHelpers';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  price: number;
  currency: string;
  description: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerImage: any;
  rating: number;
  reviews: number;
  stock: number;
  featured: boolean;
  tags: string[];
  createdAt: string;
  condition: 'New' | 'Pre-owned' | 'Refurbished';
  size?: string;
  officialStore: boolean;
}

export type ProductCategory = 
  | 'fashion'
  | 'accessories'
  | 'beauty'
  | 'art'
  | 'photography'
  | 'digital'
  | 'other';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_001',
    name: 'Handmade Ankara Dress',
    category: 'fashion',
    price: 35000,
    currency: 'NGN',
    description: 'Beautiful handmade Ankara dress with modern silhouette. Perfect for weddings and special occasions.',
    images: [
      'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800',
      'https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=800',
    ],
    sellerId: 'gh-2',
    sellerName: 'Kumasi Kente Fashion',
    sellerImage: require('@/assets/images/icon.png'),
    rating: 4.9,
    reviews: 45,
    stock: 3,
    featured: true,
    tags: ['Ankara', 'Fashion', 'Dress', 'Handmade'],
    createdAt: formatDate(new Date('2026-01-10')),
    condition: 'New',
    size: 'M',
    officialStore: false,
  },
  {
    id: 'prod_002',
    name: 'Professional Makeup Brush Set',
    category: 'beauty',
    price: 25000,
    currency: 'NGN',
    description: '12-piece professional makeup brush set with premium synthetic bristles.',
    images: [
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800',
    ],
    sellerId: 'ng-4',
    sellerName: 'Amara MUA',
    sellerImage: require('@/assets/images/icon.png'),
    rating: 4.8,
    reviews: 32,
    stock: 15,
    featured: true,
    tags: ['Makeup', 'Brushes', 'Beauty'],
    createdAt: formatDate(new Date('2026-01-15')),
    condition: 'New',
    officialStore: false,
  },
  {
    id: 'prod_003',
    name: 'Wedding Photography Preset Pack',
    category: 'digital',
    price: 15000,
    currency: 'NGN',
    description: '50 professional Lightroom presets for wedding photography. Instant download.',
    images: [
      'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800',
    ],
    sellerId: 'ng-1',
    sellerName: 'Paul Studio',
    sellerImage: require('@/assets/images/icon.png'),
    rating: 5.0,
    reviews: 68,
    stock: 999, // Digital product
    featured: true,
    tags: ['Photography', 'Presets', 'Lightroom', 'Digital'],
    createdAt: formatDate(new Date('2026-01-05')),
    condition: 'New',
    officialStore: false,
  },
  {
    id: 'prod_004',
    name: 'Statement Beaded Necklace',
    category: 'accessories',
    price: 18000,
    currency: 'NGN',
    description: 'Handcrafted beaded necklace with traditional African patterns.',
    images: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
    ],
    sellerId: 'seller_001',
    sellerName: 'African Beads Co',
    sellerImage: require('@/assets/images/icon.png'),
    rating: 4.7,
    reviews: 28,
    stock: 8,
    featured: false,
    tags: ['Jewelry', 'Beads', 'Accessories', 'Handmade'],
    createdAt: formatDate(new Date('2026-01-12')),
    condition: 'New',
    officialStore: false,
  },
  {
    id: 'prod_005',
    name: 'Custom Portrait Commission',
    category: 'art',
    price: 50000,
    currency: 'NGN',
    description: 'Custom digital portrait illustration. Delivered within 7 days.',
    images: [
      'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=800',
    ],
    sellerId: 'seller_002',
    sellerName: 'Arte Studio',
    sellerImage: require('@/assets/images/icon.png'),
    rating: 4.9,
    reviews: 52,
    stock: 10,
    featured: true,
    tags: ['Art', 'Portrait', 'Custom', 'Digital'],
    createdAt: formatDate(new Date('2026-01-08')),
    condition: 'New',
    officialStore: false,
  },
  {
    id: 'prod_006',
    name: 'Hair Extension Bundle',
    category: 'beauty',
    price: 65000,
    currency: 'NGN',
    description: '3 bundles of premium virgin hair extensions. 18-20 inches.',
    images: [
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800',
    ],
    sellerId: 'ng-2',
    sellerName: 'Sandra Hair Studio',
    sellerImage: require('@/assets/images/icon.png'),
    rating: 4.8,
    reviews: 41,
    stock: 6,
    featured: true,
    tags: ['Hair', 'Extensions', 'Beauty'],
    createdAt: formatDate(new Date('2026-01-18')),
    condition: 'Pre-owned',
    officialStore: true,
  },
];

// Helper functions
export const getProductById = (id: string): Product | undefined => {
  return MOCK_PRODUCTS.find(p => p.id === id);
};

export const getProductsByCategory = (category: ProductCategory): Product[] => {
  return MOCK_PRODUCTS.filter(p => p.category === category);
};

export const getFeaturedProducts = (): Product[] => {
  return MOCK_PRODUCTS.filter(p => p.featured);
};

export const searchProducts = (query: string): Product[] => {
  const lowerQuery = query.toLowerCase();
  return MOCK_PRODUCTS.filter(
    p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};
