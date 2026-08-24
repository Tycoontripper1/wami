import SwipeableCardStack, { CreativeData } from '@/components/SwipeableCardStack';
import AppGuidance from '@/components/AppGuidance';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/Colors';
import { useLocation } from '@/hooks/useLocationData';
import { addFavorite } from '@/store/favoritesSlice';
import { RootState } from '@/store/store';
import { DiscoveryOffering, getDiscoveryFeed, getNearYou, saveOffering, swipeOffering } from '@/services/api/discoveryService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const TABS = ['Discover', 'Trending', 'Near You'];

// Map a backend discovery offering onto the shape SwipeableCardStack expects
const mapOfferingToCreativeData = (offering: DiscoveryOffering): CreativeData => ({
  id: String(offering.id ?? offering.offering_id),
  name: offering.name || offering.title || 'Untitled',
  role: offering.role || offering.category || '',
  location: offering.location?.city
    ? `${offering.location.city}${offering.location.region ? ', ' + offering.location.region : ''}`
    : '',
  distance: offering.distance_km !== undefined ? `${offering.distance_km.toFixed(1)} km away` : undefined,
  rating: offering.rating ?? 0,
  reviews: offering.reviews ?? offering.reviews_count ?? 0,
  image: offering.image
    ? { uri: offering.image }
    : offering.images?.[0]
    ? { uri: offering.images[0] }
    : require('../../assets/images/onboarding_bg_creative.webp'),
  video: offering.video,
  tags: offering.tags?.slice(0, 3),
});

const extractItems = (data: any): DiscoveryOffering[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Discover');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dispatch = useDispatch();
  const favorites = useSelector((state: RootState) => state.favorites.items);

  const { region, city } = useLocation();

  const [feedOfferings, setFeedOfferings] = useState<DiscoveryOffering[] | null>(null);
  const [nearYouOfferings, setNearYouOfferings] = useState<DiscoveryOffering[] | null>(null);
  const [feedError, setFeedError] = useState(false);
  const [nearYouError, setNearYouError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    headerBg: isDark ? '#000' : '#fff',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#F0F0F0',
  };

  const loadFeed = useCallback(async () => {
    setIsLoading(true);
    setFeedError(false);
    try {
      const res = await getDiscoveryFeed();
      setFeedOfferings(extractItems(res.data));
    } catch (error) {
      console.error('Failed to load discovery feed:', error);
      setFeedOfferings(null);
      setFeedError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadNearYou = useCallback(async () => {
    setIsLoading(true);
    setNearYouError(false);
    try {
      const res = await getNearYou();
      setNearYouOfferings(extractItems(res.data));
    } catch (error) {
      console.error('Failed to load near-you offerings:', error);
      setNearYouOfferings(null);
      setNearYouError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    if (activeTab === 'Near You' && nearYouOfferings === null) {
      loadNearYou();
    }
  }, [activeTab, nearYouOfferings, loadNearYou]);

  // Convert offerings to SwipeableCardStack format
  const creativesForSwipe: CreativeData[] = useMemo(() => {
    if (activeTab === 'Near You') {
      return (nearYouOfferings ?? []).map(mapOfferingToCreativeData);
    }

    const items = (feedOfferings ?? []).map(mapOfferingToCreativeData);
    if (activeTab === 'Trending') {
      return [...items].sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
    }
    return items;
  }, [feedOfferings, nearYouOfferings, activeTab]);

  const currentError = activeTab === 'Near You' ? nearYouError : feedError;
  const handleRetry = activeTab === 'Near You' ? loadNearYou : loadFeed;

  const handleSwipeLeft = (item: CreativeData) => {
    swipeOffering(item.id, 'pass').catch((error) => console.error('Swipe (pass) failed:', error));
  };

  const handleSwipeRight = (item: CreativeData) => {
    swipeOffering(item.id, 'like').catch((error) => console.error('Swipe (like) failed:', error));
    // Navigate to profile
    router.push(`/profile/${item.id}`);
  };

  const handleSave = (item: CreativeData) => {
    const isAlreadySaved = favorites.some((fav) => fav.id === item.id);
    if (isAlreadySaved) {
      Alert.alert('Already Saved', `${item.name} is already in your favourites!`);
      return;
    }
    dispatch(addFavorite(item));
    saveOffering(item.id).catch((error) => console.error('Save offering failed:', error));
    Alert.alert('Saved!', `${item.name} added to your favourites`);
  };

  const handleLocationPress = () => {
    // Navigate to location picker
    router.push('/location-picker' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header Area */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: themeColors.headerBg }]}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.locationContainer} onPress={handleLocationPress}>
            <Ionicons name="location" size={18} color={Colors.light.primary} />
            <Text style={[styles.locationText, { color: themeColors.text }]}>
              {city}, {region.name}
            </Text>
            <Ionicons name="chevron-down" size={16} color={themeColors.subText} />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.shopButton} 
              onPress={() => router.push('/products-listing' as any)}
            >
              <Ionicons name="basket" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationButton}>
              <Ionicons name="notifications" size={24} color={themeColors.text} />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Custom Tab Bar */}
        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabItem,
                activeTab === tab && styles.tabItemActive,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              {activeTab === tab && <Ionicons name="checkmark-circle" size={16} color="#fff" style={styles.tabIcon} />}
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Content Area - Swipeable Cards Only */}
      <View style={styles.mainContent}>
        <View style={styles.cardStackContainer}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator color={Colors.light.primary} size="large" />
            </View>
          ) : currentError ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Oops, we can't find anything"
              message="Something went wrong while loading creatives. Please check your connection and try again."
              onRetry={handleRetry}
            />
          ) : creativesForSwipe.length > 0 ? (
            <SwipeableCardStack
              data={creativesForSwipe}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onSave={handleSave}
            />
          ) : (
            <EmptyState
              icon="location-outline"
              title="No creatives nearby"
              message="Try changing your location to discover more creatives"
              onRetry={handleLocationPress}
              retryLabel="Change Location"
            />
          )}
        </View>
      </View>

      {/* Bottom Home Indicator Spacer */}
      <View style={{ height: insets.bottom }} />

      {/* Onboarding Guidance */}
      <AppGuidance />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
header: {
  paddingBottom: 8,   // was 0
  paddingHorizontal: 16,
},
topBar: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,   // was 16
  marginTop: 4,      // was 10
},
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: '600',
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  walletButton: {
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  shopButton: {
    padding: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,

  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabItemActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
mainContent: {
  flex: 1,
  paddingHorizontal: 16,
  paddingTop: 16,

},
  cardStackContainer: {
    flex: 1,
    marginBottom: 8,

  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  changeLocationButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  changeLocationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
