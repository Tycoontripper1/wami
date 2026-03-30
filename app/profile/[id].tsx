import AvailabilityCalendar from '@/components/AvailabilityCalendar';
import BookingModal from '@/components/BookingModal';
import QuoteRequestModal from '@/components/QuoteRequestModal';
import Colors from '@/constants/Colors';
import { getCreativeById } from '@/data/creatives';
import { useLocation } from '@/hooks/useLocationData';
import { addFavorite, removeFavorite } from '@/store/favoritesSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Dimensions, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

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

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

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
              <Text style={[styles.ratingText, { color: themeColors.text }]}>{profile.rating}</Text>
              <Text style={[styles.reviewText, { color: themeColors.subText }]}>({profile.reviews})</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? '#333' : '#F0F0F0' }]} />

          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>About</Text>
          <Text style={[styles.bodyText, { color: themeColors.subText }]}>{profile.about}</Text>

          <View style={styles.tagsContainer}>
            {profile.tags.map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: isDark ? 'rgba(0,188,212,0.2)' : '#F0F9FA' }]}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Price Range */}
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

          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Gallery</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
            {profile.images.map((img, idx) => (
              <Image key={idx} source={{ uri: img }} style={styles.galleryImage} />
            ))}
          </ScrollView>

          {/* Availability Calendar */}
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Availability</Text>
          <AvailabilityCalendar
            onSelectSlot={(date, time) => {
              setShowBookingModal(true);
            }}
            onBookNextAvailable={() => setShowBookingModal(true)}
          />
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20, backgroundColor: themeColors.background, borderTopColor: isDark ? '#333' : '#F0F0F0' }]}>
        <TouchableOpacity style={[styles.messageButton, { borderColor: isDark ? '#333' : '#E0E0E0' }]} onPress={handleMessage}>
          <Ionicons name="chatbubble-outline" size={24} color={Colors.light.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bookButton} onPress={() => setShowBookingModal(true)}>
          <Text style={styles.bookButtonText}>Book Now</Text>
        </TouchableOpacity>
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
          console.log('Quote submitted:', quote);
          setShowQuoteModal(false);
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
    paddingBottom: 120,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  gallery: {
    marginBottom: 24,
  },
  galleryImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    flexDirection: 'row',
    padding: 24,
    gap: 16,
  },
  messageButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
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
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  quoteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
