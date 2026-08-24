import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import BookingModal from '@/components/BookingModal';
import QuoteRequestModal from '@/components/QuoteRequestModal';
import RateCard from '@/components/RateCard';
import Colors from '@/constants/Colors';
import { getCreativeById } from '@/data/creatives';
import { useLocation } from '@/hooks/useLocationData';
import { addFavorite, removeFavorite } from '@/store/favoritesSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { MOCK_PRODUCTS } from '@/data/mockProducts';

const { width } = Dimensions.get('window');

// Mock data (normally fetched by ID)
const MOCK_PROFILE = {
  id: '1',
  name: 'Sandra Hair Studio',
  role: 'HairStylist',
  location: 'Manchester',
  distance: '2.5 km away',
  rating: 4.9,
  reviews: 120,
  about: 'Specializing in contemporary cuts and color. We bring out your best look with our premium services and experienced stylists.',
  tags: ['Hair', 'Color', 'Styling'],
  images: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521590832169-d7fcbe313d1f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  ],
};

const MOCK_SERVICES_BY_CATEGORY: Record<string, { id: string; name: string; duration: string; priceUSD: number }[]> = {
  photographer: [
    { id: 's1', name: 'Standard Portrait Session', duration: '1 Hour', priceUSD: 30 },
    { id: 's2', name: 'Event Coverage (Half Day)', duration: '4 Hours', priceUSD: 100 },
    { id: 's3', name: 'Wedding Photography (Basic)', duration: '6 Hours', priceUSD: 250 },
    { id: 's4', name: 'Commercial Brand Shoot', duration: '3 Hours', priceUSD: 150 },
  ],
  hairstylist: [
    { id: 's1', name: 'Knotless Box Braids', duration: '3 Hours', priceUSD: 25 },
    { id: 's2', name: 'Silk Press & Treatment', duration: '1.5 Hours', priceUSD: 15 },
    { id: 's3', name: 'Wig Installation & Style', duration: '2 Hours', priceUSD: 30 },
    { id: 's4', name: 'Custom Hair Coloring', duration: '2.5 Hours', priceUSD: 40 },
  ],
  makeup_artist: [
    { id: 's1', name: 'Bridal Glam Makeup', duration: '2 Hours', priceUSD: 50 },
    { id: 's2', name: 'Soft Glam Session', duration: '1 Hour', priceUSD: 20 },
    { id: 's3', name: 'Editorial/Photoshoot Glam', duration: '1.5 Hours', priceUSD: 35 },
    { id: 's4', name: 'One-on-One Masterclass', duration: '3 Hours', priceUSD: 60 },
  ],
  caterer: [
    { id: 's1', name: 'Private Dinner (2-4 guests)', duration: '3 Hours', priceUSD: 80 },
    { id: 's2', name: 'Buffet Catering (per head)', duration: '4 Hours', priceUSD: 5 },
    { id: 's3', name: 'Cocktail Party Platter (20 pax)', duration: '2 Hours', priceUSD: 60 },
  ],
  default: [
    { id: 's1', name: 'Consultation Session', duration: '1 Hour', priceUSD: 15 },
    { id: 's2', name: 'Standard Service Package', duration: '2 Hours', priceUSD: 35 },
    { id: 's3', name: 'Premium Service Package', duration: '4 Hours', priceUSD: 70 },
  ]
};

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  
  // Custom states for refined creative profile tabs and features
  const [activeTab, setActiveTab] = useState<'home' | 'shop'>('home');
  const [likedProducts, setLikedProducts] = useState<Record<string, boolean>>({});
  
  // Interactive reviews state
  const INITIAL_REVIEWS = [
    {
      id: 'rev_1',
      userName: 'Jessica M.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      rating: 5,
      isVerified: true,
      text: 'Absolutely incredible work! The attention to detail and professional attitude were top-notch. Will definitely book again.',
      date: '2 days ago',
    },
    {
      id: 'rev_2',
      userName: 'Tunde A.',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      rating: 4,
      isVerified: true,
      text: 'Great experience overall. Took a bit of time to respond initially but the final delivery was exceptional.',
      date: '1 week ago',
    },
    {
      id: 'rev_3',
      userName: 'Sarah K.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      rating: 5,
      isVerified: false,
      text: 'Very talented! Understood exactly what I wanted and executed it perfectly.',
      date: '2 weeks ago',
    }
  ];
  
  const [reviewsList, setReviewsList] = useState(INITIAL_REVIEWS);
  const [newReviewText, setNewReviewText] = useState('');
  const [newRating, setNewRating] = useState(5);

  // Get location for price formatting
  const { formatPrice, formatPriceRange } = useLocation();

  // Check if this creative is in favorites
  const favorites = useSelector((state: RootState) => state.favorites.items);
  const isFavorite = favorites.some((fav) => fav.id === id);

  // Fetch creative from mock data
  const creative = useMemo(() => getCreativeById(id as string), [id]);
  
  // Fallback to mock profile if not found
  const profile = creative ? {
    id: creative.id,
    name: creative.name,
    role: creative.role,
    location: creative.location.city,
    distance: '2.5 km away',
    rating: creative.rating,
    reviews: creative.reviews,
    about: creative.about,
    tags: creative.tags,
    images: creative.images,
    priceRange: creative.priceRange,
  } : MOCK_PROFILE;

  // Format prices based on user location
  const priceDisplay = useMemo(() => {
    if (creative) {
      return {
        min: formatPrice(creative.priceRange.minUSD),
        max: formatPrice(creative.priceRange.maxUSD),
        range: formatPriceRange(creative.priceRange.minUSD, creative.priceRange.maxUSD),
      };
    }
    return {
      min: formatPrice(25),
      max: formatPrice(100),
      range: formatPriceRange(25, 100),
    };
  }, [creative, formatPrice, formatPriceRange]);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#1a1a1a' : '#fff',
  };

  const handleFavoriteToggle = () => {
    const creativeData = {
      id: profile.id,
      name: profile.name,
      role: profile.role,
      location: profile.location,
      rating: profile.rating,
      reviews: profile.reviews,
    };

    if (isFavorite) {
      dispatch(removeFavorite(profile.id));
    } else {
      dispatch(addFavorite(creativeData as any));
    }
  };

  const handleMessage = () => {
    router.push(`/chat/${id}`);
  };

  // Toggle favorite status on a product
  const toggleLikeProduct = (productId: string) => {
    setLikedProducts(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  // Submits a user review and updates live states
  const handleAddReview = () => {
    if (!newReviewText.trim()) return;
    const newReviewObj = {
      id: `rev_${Date.now()}`,
      userName: 'You (Guest User)',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      rating: newRating,
      isVerified: false,
      text: newReviewText,
      date: 'Just now',
    };
    setReviewsList([newReviewObj, ...reviewsList]);
    setNewReviewText('');
    setNewRating(5);
  };

  // Calculates reviews average rating, counts, and breakdown bars dynamically
  const reviewStats = useMemo(() => {
    const origCount = profile.reviews;
    const origRating = profile.rating;
    
    // User added reviews count
    const userAddedReviews = reviewsList.slice(0, reviewsList.length - 3);
    const userReviewsCount = userAddedReviews.length;
    
    const totalCount = origCount + userReviewsCount;
    const totalSum = (origRating * origCount) + userAddedReviews.reduce((sum, r) => sum + r.rating, 0);
    const average = totalCount > 0 ? (totalSum / totalCount).toFixed(1) : '5.0';
    
    // Star breakdown counts
    let fiveStar = Math.round(totalCount * 0.85);
    let fourStar = Math.round(totalCount * 0.10);
    let threeStar = Math.round(totalCount * 0.04);
    let twoStar = Math.round(totalCount * 0.01);
    let oneStar = totalCount - (fiveStar + fourStar + threeStar + twoStar);
    if (oneStar < 0) oneStar = 0;
    
    userAddedReviews.forEach(r => {
      if (r.rating === 5) fiveStar++;
      else if (r.rating === 4) fourStar++;
      else if (r.rating === 3) threeStar++;
      else if (r.rating === 2) twoStar++;
      else if (r.rating === 1) oneStar++;
    });
    
    const recalculatedTotal = fiveStar + fourStar + threeStar + twoStar + oneStar;
    const breakdown = [
      recalculatedTotal > 0 ? (fiveStar / recalculatedTotal) * 100 : 85,
      recalculatedTotal > 0 ? (fourStar / recalculatedTotal) * 100 : 10,
      recalculatedTotal > 0 ? (threeStar / recalculatedTotal) * 100 : 4,
      recalculatedTotal > 0 ? (twoStar / recalculatedTotal) * 100 : 1,
      recalculatedTotal > 0 ? (oneStar / recalculatedTotal) * 100 : 0,
    ];
    
    return {
      average,
      total: totalCount,
      breakdown
    };
  }, [reviewsList, profile.rating, profile.reviews]);

  // Dynamic services list per category
  const services = useMemo(() => {
    const category = (creative?.category || 'default') as string;
    return MOCK_SERVICES_BY_CATEGORY[category] || MOCK_SERVICES_BY_CATEGORY.default;
  }, [creative]);

  // Dynamic 2x2 portfolio images
  const portfolioImages = useMemo(() => {
    const imgs = [...profile.images];
    const fallbackImgs = [
      'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800',
      'https://images.unsplash.com/photo-1521590832169-d7fcbe313d1f?w=800',
      'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800',
    ];
    while (imgs.length < 4) {
      imgs.push(fallbackImgs[imgs.length % fallbackImgs.length]);
    }
    return imgs.slice(0, 4);
  }, [profile.images]);

  // Dynamic products list for the seller
  const sellerProducts = useMemo(() => {
    const directProducts = MOCK_PRODUCTS.filter(p => p.sellerId === profile.id);
    if (directProducts.length < 4) {
      const fallbackProducts = [
        {
          id: `${profile.id}_p1`,
          name: `${profile.role} Premium Pack`,
          category: 'digital',
          price: 12000,
          currency: 'NGN',
          description: 'Premium items from our workspace, curated for your creative needs.',
          images: ['https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800'],
          sellerId: profile.id,
          sellerName: profile.name,
          sellerImage: '',
          rating: 4.8,
          reviews: 20,
          stock: 10,
          featured: true,
          tags: ['Premium', 'Best Seller'],
          createdAt: '2026-02-01',
          condition: 'New'
        },
        {
          id: `${profile.id}_p2`,
          name: `Signature ${profile.role} Kit`,
          category: 'beauty',
          price: 25000,
          currency: 'NGN',
          description: 'Essential kit for styled outputs, highly requested by clients.',
          images: ['https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800'],
          sellerId: profile.id,
          sellerName: profile.name,
          sellerImage: '',
          rating: 4.9,
          reviews: 15,
          stock: 5,
          featured: true,
          tags: ['Kit', 'Signature'],
          createdAt: '2026-02-05',
          condition: 'New'
        },
        {
          id: `${profile.id}_p3`,
          name: `${profile.role} Workshop Guide`,
          category: 'digital',
          price: 8000,
          currency: 'NGN',
          description: 'A complete masterclass booklet with professional tips and workflows.',
          images: ['https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800'],
          sellerId: profile.id,
          sellerName: profile.name,
          sellerImage: '',
          rating: 4.7,
          reviews: 8,
          stock: 100,
          featured: false,
          tags: ['Guide', 'Digital'],
          createdAt: '2026-02-10',
          condition: 'Digital File'
        },
        {
          id: `${profile.id}_p4`,
          name: `Exclusive Custom Design`,
          category: 'fashion',
          price: 45000,
          currency: 'NGN',
          description: 'Customized order made to your exact measurements and requirements.',
          images: ['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800'],
          sellerId: profile.id,
          sellerName: profile.name,
          sellerImage: '',
          rating: 5.0,
          reviews: 12,
          stock: 2,
          featured: true,
          tags: ['Custom', 'Luxury'],
          createdAt: '2026-02-12',
          condition: 'Like New'
        }
      ];
      
      const combined = [...directProducts];
      for (const fallback of fallbackProducts) {
        if (combined.length >= 4) break;
        if (!combined.some(p => p.name === fallback.name)) {
          combined.push(fallback as any);
        }
      }
      return combined;
    }
    return directProducts;
  }, [profile.id, creative]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: profile.images[0] }} style={styles.headerImage} />

          {/* Header Actions */}
          <View style={[styles.headerActions, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.rightIcons}>
              <TouchableOpacity style={styles.iconButton} onPress={handleFavoriteToggle}>
                <Ionicons name={isFavorite ? 'heart' : 'heart-outline'} size={24} color={isFavorite ? '#FF3B30' : '#fff'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="share-social-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={[styles.contentContainer, { backgroundColor: themeColors.background }]}>
          <View style={styles.headerInfo}>
            <View>
              <Text style={[styles.name, { color: themeColors.text }]}>{profile.name}</Text>
              <View style={styles.subInfo}>
                <Ionicons name="location-outline" size={16} color={themeColors.subText} />
                <Text style={[styles.infoText, { color: themeColors.subText }]}>{profile.location}</Text>
                <View style={styles.dot} />
                <Ionicons name="pricetag-outline" size={16} color={themeColors.subText} />
                <Text style={[styles.infoText, { color: themeColors.subText }]}>{profile.role}</Text>
              </View>
            </View>
            <View style={[styles.ratingBox, { backgroundColor: isDark ? '#2a2a2a' : '#F5F5F5' }]}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.ratingText, { color: themeColors.text }]}>{reviewStats.average}</Text>
              <Text style={[styles.reviewText, { color: themeColors.subText }]}>({reviewStats.total})</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />

          {/* Tab Selector (FE-26) */}
          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'home' && styles.activeTabButton]}
              onPress={() => setActiveTab('home')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'home' ? '#00BCD4' : themeColors.subText }]}>Home</Text>
              {activeTab === 'home' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'shop' && styles.activeTabButton]}
              onPress={() => setActiveTab('shop')}
            >
              <Text style={[styles.tabText, { color: activeTab === 'shop' ? '#00BCD4' : themeColors.subText }]}>Shop</Text>
              {activeTab === 'shop' && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </View>

          {activeTab === 'home' ? (
            <View>
              {/* Bio block & Social Icons Row (FE-27) */}
              <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 20 }]}>About</Text>
              <Text style={[styles.bodyText, { color: themeColors.subText }]}>{profile.about}</Text>

              {/* Social Icons Row */}
              <View style={styles.socialIconsRow}>
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                  <Ionicons name="logo-instagram" size={20} color="#00BCD4" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                  <Ionicons name="globe-outline" size={20} color="#00BCD4" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]} onPress={handleFavoriteToggle}>
                  <Ionicons name={isFavorite ? "bookmark" : "bookmark-outline"} size={20} color="#00BCD4" />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.socialButton, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                  <Ionicons name="share-social-outline" size={20} color="#00BCD4" />
                </TouchableOpacity>
              </View>

              {/* Tags Container */}
              <View style={styles.tagsContainer}>
                {profile.tags.map((tag, index) => (
                  <View key={index} style={[styles.tag, { backgroundColor: isDark ? 'rgba(0,188,212,0.2)' : '#F0F9FA' }]}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              {/* Price Card */}
              <View style={[styles.priceCard, { backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5' }]}>
                <View style={styles.priceHeader}>
                  <View style={styles.priceInfo}>
                    <Ionicons name="cash-outline" size={20} color={Colors.light.primary} />
                    <Text style={[styles.priceLabel, { color: themeColors.subText }]}>Starting from</Text>
                  </View>
                  <View style={styles.priceValues}>
                    <Text style={[styles.priceAmount, { color: themeColors.text }]}>{priceDisplay.min}</Text>
                    <Text style={[styles.priceRange, { color: themeColors.subText }]}> - {priceDisplay.max}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.quoteButton} onPress={() => setShowQuoteModal(true)}>
                  <Text style={styles.quoteButtonText}>Get Quote</Text>
                </TouchableOpacity>
              </View>

              {/* Rate Card — 3 service tiers (FE-35) */}
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Rate Card</Text>
              <RateCard
                basePrice={creative ? Math.round(creative.priceRange.minUSD * 1550) : 50000}
                onSelectTier={() => setShowBookingModal(true)}
              />

              {/* Services Horizontal Scroll (FE-29) */}
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Services & Packages</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
                {services.map((service) => (
                  <View key={service.id} style={[styles.serviceCard, { backgroundColor: themeColors.cardBg, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
                    <Text style={[styles.serviceName, { color: themeColors.text }]} numberOfLines={1}>{service.name}</Text>
                    <View style={styles.serviceMeta}>
                      <Ionicons name="time-outline" size={14} color={themeColors.subText} />
                      <Text style={[styles.serviceDuration, { color: themeColors.subText }]}>{service.duration}</Text>
                    </View>
                    <View style={styles.serviceFooter}>
                      <Text style={[styles.servicePrice, { color: themeColors.text }]}>{formatPrice(service.priceUSD)}</Text>
                      <TouchableOpacity style={styles.serviceBookButton} onPress={() => setShowBookingModal(true)}>
                        <Text style={styles.serviceBookButtonText}>Book</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>

              {/* 2x2 Portfolio Grid (FE-28) */}
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Portfolio</Text>
              <View style={styles.portfolioGrid}>
                {portfolioImages.map((img, index) => (
                  <View key={index} style={styles.portfolioItem}>
                    <Image source={{ uri: img }} style={styles.portfolioImage} />
                    <View style={styles.instagramBadge}>
                      <Ionicons name="logo-instagram" size={12} color="#fff" />
                      <Text style={styles.instagramBadgeText}>Imported</Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Availability Calendar */}
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Availability</Text>
              <AvailabilityCalendar
                onSelectSlot={(date, time) => {
                  setShowBookingModal(true);
                }}
                onBookNextAvailable={() => setShowBookingModal(true)}
              />

              {/* Reviews section (FE-32) */}
              <Text style={[styles.sectionTitle, { color: themeColors.text, marginTop: 28 }]}>Reviews</Text>
              
              {/* Rating Summary & Star Breakdown */}
              <View style={[styles.reviewsSummaryContainer, { backgroundColor: themeColors.cardBg, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
                <View style={styles.ratingSummaryLeft}>
                  <Text style={[styles.ratingBigNumber, { color: themeColors.text }]}>{reviewStats.average}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Ionicons
                        key={star}
                        name={star <= Math.round(Number(reviewStats.average)) ? 'star' : 'star-outline'}
                        size={14}
                        color="#FFD700"
                      />
                    ))}
                  </View>
                  <Text style={[styles.ratingTotalText, { color: themeColors.subText }]}>{reviewStats.total} reviews</Text>
                </View>
                <View style={[styles.dividerVertical, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]} />
                <View style={styles.ratingBreakdownRight}>
                  {reviewStats.breakdown.map((pct, idx) => {
                    const starsCount = 5 - idx;
                    return (
                      <View key={idx} style={styles.breakdownRow}>
                        <Text style={[styles.breakdownStarText, { color: themeColors.subText }]}>{starsCount}★</Text>
                        <View style={[styles.breakdownProgressTrack, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
                          <View style={[styles.breakdownProgressFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={[styles.breakdownPctText, { color: themeColors.subText }]}>{Math.round(pct)}%</Text>
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* Add a review input */}
              <View style={[styles.addReviewContainer, { backgroundColor: themeColors.cardBg, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
                <Text style={[styles.addReviewTitle, { color: themeColors.text }]}>Add a review</Text>
                <View style={styles.starPickerRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setNewRating(star)}>
                      <Ionicons
                        name={star <= newRating ? 'star' : 'star-outline'}
                        size={28}
                        color="#FFD700"
                        style={styles.pickerStar}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={[styles.reviewInput, { color: themeColors.text, borderColor: isDark ? '#444' : '#E0E0E0', backgroundColor: isDark ? '#222' : '#FAFAFA' }]}
                  placeholder="Write your review here..."
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={newReviewText}
                  onChangeText={setNewReviewText}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity style={styles.submitReviewButton} onPress={handleAddReview}>
                  <Text style={styles.submitReviewButtonText}>Submit Review</Text>
                </TouchableOpacity>
              </View>

              {/* Individual review cards (FE-33) */}
              <View style={styles.reviewsListContainer}>
                {reviewsList.map((review) => (
                  <View key={review.id} style={[styles.reviewCard, { backgroundColor: themeColors.cardBg, borderColor: isDark ? '#333' : '#F0F0F0' }]}>
                    <View style={styles.reviewHeader}>
                      <Image source={{ uri: review.avatar }} style={styles.reviewAvatar} />
                      <View style={styles.reviewUserMeta}>
                        <View style={styles.reviewUserTopRow}>
                          <Text style={[styles.reviewUserName, { color: themeColors.text }]}>{review.userName}</Text>
                          {review.isVerified && (
                            <View style={styles.verifiedBadge}>
                              <Ionicons name="checkmark-circle" size={10} color="#00BCD4" />
                              <Text style={styles.verifiedBadgeText}>Verified Booking</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.reviewStarsRow}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Ionicons
                              key={star}
                              name={star <= review.rating ? 'star' : 'star-outline'}
                              size={12}
                              color="#FFD700"
                            />
                          ))}
                          <Text style={[styles.reviewDate, { color: themeColors.subText }]}>{review.date}</Text>
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.reviewBodyText, { color: themeColors.text }]}>{review.text}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 16 }}>
              {/* Shop Tab Content (FE-30) */}
              <View style={styles.shopHeader}>
                <Text style={[styles.itemCountText, { color: themeColors.subText }]}>{sellerProducts.length} items available</Text>
              </View>

              {/* 2-Column Product Grid */}
              <View style={styles.productsGrid}>
                {sellerProducts.map((product) => {
                  const isLiked = likedProducts[product.id] || false;
                  return (
                    <View key={product.id} style={[styles.productCard, { backgroundColor: themeColors.cardBg, borderColor: isDark ? '#333' : '#E0E0E0' }]}>
                      <View style={styles.productImageContainer}>
                        <Image source={{ uri: product.images[0] }} style={styles.productImage} />
                        
                        {/* Condition badge (FE-31) */}
                        <View style={styles.conditionBadge}>
                          <Text style={styles.conditionBadgeText}>{(product as any).condition || 'New'}</Text>
                        </View>
                        
                        {/* Heart icon */}
                        <TouchableOpacity 
                          style={styles.heartButton} 
                          onPress={() => toggleLikeProduct(product.id)}
                        >
                          <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={16} color={isLiked ? '#FF3B30' : '#333'} />
                        </TouchableOpacity>
                        
                        {/* Name and price overlaid on a LinearGradient (FE-31) */}
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.8)']}
                          style={styles.productGradientOverlay}
                        >
                          <Text style={styles.productOverlayName} numberOfLines={1}>{product.name}</Text>
                          <Text style={styles.productOverlayPrice}>{formatPrice(product.price / 1550)}</Text>
                        </LinearGradient>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Book Now Footer (FE-34) */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12, backgroundColor: themeColors.background, borderTopColor: isDark ? '#333' : '#F0F0F0' }]}>
        <View style={styles.stickyFooterContent}>
          <TouchableOpacity style={styles.fullBookButton} onPress={() => setShowBookingModal(true)}>
            <Text style={styles.fullBookButtonText}>Book Now</Text>
          </TouchableOpacity>
          <View style={styles.paymentNoteContainer}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#00BCD4" />
            <Text style={[styles.paymentNoteText, { color: themeColors.subText }]}>Payment held safely by Wami</Text>
          </View>
        </View>
      </View>

      {/* Booking Modal */}
      <BookingModal
        visible={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        creative={{
          id: profile.id,
          name: profile.name,
          role: profile.role,
        }}
      />

      {/* Quote Request Modal */}
      <QuoteRequestModal
        visible={showQuoteModal}
        onClose={() => setShowQuoteModal(false)}
        creative={{
          id: profile.id,
          name: profile.name,
          role: profile.role,
          priceRange: creative 
            ? { min: creative.priceRange.minUSD * 1550, max: creative.priceRange.maxUSD * 1550 } 
            : { min: 25000, max: 100000 },
        }}
        onSubmit={(quote) => {
          setShowQuoteModal(false);
          router.push({
            pathname: '/quote-received/[id]',
            params: {
              id: quote.id,
              creativeName: profile.name,
              service: quote.service,
              offerAmount: String(Math.round(Number(quote.budget.replace(/[^\d]/g, '')) || 80000)),
            },
          } as any);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    height: 350,
    width: '100%',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 140,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    marginLeft: 4,
    marginRight: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginRight: 8,
  },
  ratingBox: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  reviewText: {
    fontSize: 12,
  },
  divider: {
    height: 1,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    marginTop: 16,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    color: '#00BCD4',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    zIndex: 10,
  },
  priceCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceLabel: {
    fontSize: 13,
  },
  priceValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: '700',
  },
  priceRange: {
    fontSize: 14,
  },
  quoteButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  quoteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  // Custom Styles
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  activeTabButton: {},
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: -1,
    left: '20%',
    right: '20%',
    height: 3,
    backgroundColor: '#00BCD4',
    borderRadius: 2,
  },
  socialIconsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00BCD440',
  },
  portfolioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 24,
  },
  portfolioItem: {
    width: (width - 48 - 12) / 2,
    height: 130,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  portfolioImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  instagramBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  instagramBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  servicesScroll: {
    marginBottom: 24,
  },
  serviceCard: {
    width: 210,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 12,
    justifyContent: 'space-between',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  serviceMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  serviceDuration: {
    fontSize: 12,
  },
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  serviceBookButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  serviceBookButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stickyFooterContent: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  fullBookButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00BCD4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  fullBookButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  paymentNoteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  paymentNoteText: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Reviews section styles
  reviewsSummaryContainer: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingSummaryLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingBigNumber: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 4,
  },
  ratingTotalText: {
    fontSize: 12,
  },
  dividerVertical: {
    width: 1,
    height: 80,
    marginHorizontal: 16,
  },
  ratingBreakdownRight: {
    flex: 1.5,
    gap: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownStarText: {
    fontSize: 11,
    width: 20,
    textAlign: 'right',
  },
  breakdownProgressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownProgressFill: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 3,
  },
  breakdownPctText: {
    fontSize: 11,
    width: 30,
  },
  addReviewContainer: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  addReviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  starPickerRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  pickerStar: {
    marginRight: 2,
  },
  reviewInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    height: 80,
    marginBottom: 12,
  },
  submitReviewButton: {
    backgroundColor: '#00BCD4',
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  submitReviewButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  reviewsListContainer: {
    gap: 12,
    marginBottom: 16,
  },
  reviewCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewUserMeta: {
    flex: 1,
    gap: 2,
  },
  reviewUserTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '700',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewDate: {
    fontSize: 11,
    marginLeft: 8,
  },
  reviewBodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,188,212,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    color: '#00BCD4',
    fontSize: 10,
    fontWeight: '600',
  },
  
  // Shop tab styles
  shopHeader: {
    marginBottom: 12,
  },
  itemCountText: {
    fontSize: 14,
    fontWeight: '600',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  productCard: {
    width: (width - 48 - 12) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: 12,
  },
  productImageContainer: {
    width: '100%',
    height: 160,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#00BCD4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 2,
  },
  conditionBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  productGradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 10,
    zIndex: 1,
  },
  productOverlayName: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  productOverlayPrice: {
    color: '#00BCD4',
    fontSize: 13,
    fontWeight: '700',
  },
});
