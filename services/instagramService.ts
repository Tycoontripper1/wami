import { InstagramPost, InstagramProfile } from '@/types/creativeOnboarding';

// Mock Instagram data for demo purposes
// Instagram Basic Display API was deprecated Dec 2024
// Real implementation would require Instagram Graph API (business accounts only)

const MOCK_POSTS: InstagramPost[] = [
  {
    id: '1',
    imageUrl: 'https://picsum.photos/400/400?random=1',
    caption: 'Latest photoshoot 📸',
    likesCount: 234,
    timestamp: '2024-01-15',
  },
  {
    id: '2',
    imageUrl: 'https://picsum.photos/400/400?random=2',
    caption: 'Behind the scenes',
    likesCount: 189,
    timestamp: '2024-01-12',
  },
  {
    id: '3',
    imageUrl: 'https://picsum.photos/400/400?random=3',
    caption: 'New work complete! ✨',
    likesCount: 312,
    timestamp: '2024-01-10',
  },
  {
    id: '4',
    imageUrl: 'https://picsum.photos/400/400?random=4',
    caption: 'Client session',
    likesCount: 156,
    timestamp: '2024-01-08',
  },
  {
    id: '5',
    imageUrl: 'https://picsum.photos/400/400?random=5',
    caption: 'Studio vibes',
    likesCount: 278,
    timestamp: '2024-01-05',
  },
  {
    id: '6',
    imageUrl: 'https://picsum.photos/400/400?random=6',
    caption: 'Weekend project',
    likesCount: 201,
    timestamp: '2024-01-03',
  },
];

// Simulated delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const instagramService = {
  /**
   * Fetch Instagram profile data
   * Note: This is a mock implementation. Real implementation would require:
   * - Instagram Graph API access
   * - Business/Creator account connection
   * - Facebook Developer App approval
   */
  async fetchProfile(username: string): Promise<InstagramProfile> {
    await delay(1500); // Simulate network delay

    // Clean up username (remove @ if present)
    const cleanUsername = username.replace('@', '').toLowerCase().trim();

    if (!cleanUsername) {
      throw new Error('Please enter a valid Instagram username');
    }

    // Return mock profile data
    return {
      username: cleanUsername,
      fullName: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1).replace('_', ' '),
      bio: `Creative professional | Available for bookings | DM for inquiries`,
      profilePicture: `https://i.pravatar.cc/150?u=${cleanUsername}`,
      postsCount: Math.floor(Math.random() * 500) + 50,
      followersCount: Math.floor(Math.random() * 10000) + 500,
      website: undefined,
      posts: MOCK_POSTS,
    };
  },

  /**
   * Verify Instagram connection
   * In production, this would exchange OAuth code for access token
   */
  async verifyConnection(username: string): Promise<boolean> {
    await delay(1000);
    // Always return true for mock
    return true;
  },

  /**
   * Fetch user's recent posts
   */
  async fetchPosts(username: string, limit: number = 6): Promise<InstagramPost[]> {
    await delay(1000);
    return MOCK_POSTS.slice(0, limit);
  },
};
