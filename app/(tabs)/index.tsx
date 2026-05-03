import SwipeableCardStack, { CreativeData } from '@/components/SwipeableCardStack';
import AppGuidance from '@/components/AppGuidance';
import Colors from '@/constants/Colors';
import { getCreativeLocationDisplay, useLocation, useLocationCreatives } from '@/hooks/useLocationData';
import { addFavorite } from '@/store/favoritesSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const TABS = ['Discover', 'Trending', 'Near You'];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Discover');
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const dispatch = useDispatch();
  const favorites = useSelector((state: RootState) => state.favorites.items);
  
  // Get location data
  const { region, city, regionCode } = useLocation();
  const { discoverCreatives, nearbyCreatives, regionCreatives } = useLocationCreatives();

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    headerBg: isDark ? '#000' : '#fff',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#F0F0F0',
  };

  // Convert creatives from mock data format to SwipeableCardStack format
  const creativesForSwipe: CreativeData[] = useMemo(() => {
    // Choose creatives based on active tab
    let creatives = discoverCreatives;
    if (activeTab === 'Near You') {
      creatives = nearbyCreatives;
    } else if (activeTab === 'Trending') {
      // For trending, sort by rating and reviews
      creatives = [...discoverCreatives].sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews));
    }

    return creatives.map((creative) => ({
      id: creative.id,
      name: creative.name,
      role: creative.role,
      location: getCreativeLocationDisplay(creative, regionCode),
      distance: creative.location.region === regionCode ? '2.5 km away' : undefined,
      rating: creative.rating,
      reviews: creative.reviews,
      image: creative.images[0] ? { uri: creative.images[0] } : require('../../assets/images/onboarding_bg_creative.webp'),
      video: creative.video,
      tags: creative.tags.slice(0, 3),
    }));
  }, [discoverCreatives, nearbyCreatives, activeTab, regionCode]);

  const handleSwipeLeft = (item: CreativeData) => {
    console.log('Swiped left on:', item.name);
  };

  const handleSwipeRight = (item: CreativeData) => {
    console.log('Swiped right on:', item.name);
    // Navigate to profile
    router.push(`/profile/${item.id}`);
  };

  const handleSave = (item: CreativeData) => {
    const isAlreadySaved = favorites.some((fav) => fav.id === item.id);
    if (isAlreadySaved) {
      Alert.alert('Already Saved', `${item.name} is already in your favourites!`);
    } else {
      dispatch(addFavorite(item));
      Alert.alert('Saved!', `${item.name} added to your favourites`);
    }
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
          {creativesForSwipe.length > 0 ? (
            <SwipeableCardStack
              data={creativesForSwipe}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onSave={handleSave}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="location-outline" size={64} color={themeColors.subText} />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                No creatives nearby
              </Text>
              <Text style={[styles.emptySubtitle, { color: themeColors.subText }]}>
                Try changing your location to discover more creatives
              </Text>
              <TouchableOpacity style={styles.changeLocationButton} onPress={handleLocationPress}>
                <Text style={styles.changeLocationText}>Change Location</Text>
              </TouchableOpacity>
            </View>
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
