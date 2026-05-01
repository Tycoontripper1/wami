import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const CATEGORY_CARD_WIDTH = (width - 48) / 2;

// Category filter pills
const FILTER_CATEGORIES = ['Hair', 'Makeup', 'Photography', 'Sneakers', 'Fashion', 'Food'];

// Featured Categories with images
const FEATURED_CATEGORIES = [
  { id: '1', name: 'Photography', image: require('@/assets/images/photography.webp') },
  { id: '2', name: 'Hair Stylist', image: require('@/assets/images/onboarding_bg_service.webp') },
  { id: '3', name: 'Makeup', image: require('@/assets/images/makeup.webp') },
  { id: '4', name: 'Fashion', image: require('@/assets/images/onboarding_bg_creative.webp') },
  { id: '5', name: 'Food', image: require('@/assets/images/food.webp') },
  { id: '6', name: 'Sneakers', image: require('@/assets/images/sneakers.webp') },
];

// Trending creatives data
const TRENDING_CREATIVES = [
  {
    id: '1',
    name: 'Sam photography',
    category: 'Photography',
    rating: 5.0,
    reviews: 500,
    image: require('@/assets/images/onboarding_bg_creative.webp'),
  },
  {
    id: '2',
    name: 'Paul Cocktails',
    category: 'Food',
    rating: 5.0,
    reviews: 500,
    image: require('@/assets/images/onboarding_bg_seller.webp'),
  },
  {
    id: '3',
    name: 'Sarah Styles',
    category: 'Hair Stylist',
    rating: 4.9,
    reviews: 320,
    image: require('@/assets/images/onboarding_bg_service.webp'),
  },
  {
    id: '4',
    name: 'Mike Fashion',
    category: 'Fashion',
    rating: 4.8,
    reviews: 280,
    image: require('@/assets/images/onboarding_bg_creative.webp'),
  },
];

// Top rated this week
const TOP_RATED_CREATIVES = [
  {
    id: '5',
    name: 'Adam Gadgets',
    category: 'Technology',
    rating: 5.0,
    reviews: 500,
    image: require('@/assets/images/onboarding_bg_creative.webp'),
  },
  {
    id: '6',
    name: 'Zew Restaurant',
    category: 'Food',
    rating: 5.0,
    reviews: 500,
    image: require('@/assets/images/onboarding_bg_seller.webp'),
  },
  {
    id: '7',
    name: 'Saw Creatives',
    category: 'Fashion',
    rating: 4.9,
    reviews: 450,
    image: require('@/assets/images/onboarding_bg_service.webp'),
  },
  {
    id: '8',
    name: 'Luna Beauty',
    category: 'Makeup',
    rating: 4.9,
    reviews: 380,
    image: require('@/assets/images/onboarding_bg_creative.webp'),
  },
];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#fff',
    inputBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
    pillBg: isDark ? '#1A1A1A' : '#F5F5F5',
  };

  const handleCategoryPress = (category: string) => {
    router.push({
      pathname: '/(tabs)',
      params: { category },
    });
  };

  const handleCreativePress = (creativeId: string) => {
    router.push(`/profile/${creativeId}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Status bar spacer - minimal on Android */}
      <View style={{ height: insets.top > 20 ? insets.top : 8 }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.inputBg }]}>
          <Ionicons name="search" size={20} color={themeColors.subText} />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search creatives, categories..."
            placeholderTextColor={themeColors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterPill,
                { 
                  backgroundColor: selectedFilter === category 
                    ? Colors.light.primary 
                    : themeColors.pillBg,
                  borderColor: selectedFilter === category 
                    ? Colors.light.primary 
                    : themeColors.border,
                },
              ]}
              onPress={() => setSelectedFilter(selectedFilter === category ? null : category)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: selectedFilter === category ? '#fff' : themeColors.text },
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Featured Categories</Text>
          <View style={styles.categoryGrid}>
            {FEATURED_CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.name)}
                activeOpacity={0.8}
              >
                <ImageBackground
                  source={category.image}
                  style={styles.categoryImage}
                  imageStyle={styles.categoryImageStyle}
                >
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.7)'] as const}
                    style={styles.categoryGradient}
                  >
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </LinearGradient>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Trending Creatives */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Trending Creatives</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.trendingContainer}
          >
            {TRENDING_CREATIVES.map((creative) => (
              <TouchableOpacity
                key={creative.id}
                style={[styles.trendingCard, { backgroundColor: themeColors.cardBg }]}
                onPress={() => handleCreativePress(creative.id)}
              >
                <Image source={creative.image} style={styles.trendingImage} resizeMode="cover" />
                <View style={styles.trendingInfo}>
                  <Text style={[styles.trendingName, { color: themeColors.text }]} numberOfLines={1}>
                    {creative.name}
                  </Text>
                  <View style={styles.trendingCategoryRow}>
                    <Ionicons name="pricetag-outline" size={12} color={themeColors.subText} />
                    <Text style={[styles.trendingCategory, { color: themeColors.subText }]}>
                      {creative.category}
                    </Text>
                  </View>
                  <View style={styles.trendingRatingRow}>
                    <Ionicons name="star" size={12} color="#FFD700" />
                    <Text style={[styles.trendingRating, { color: themeColors.text }]}>
                      {creative.rating}
                    </Text>
                    <Text style={[styles.trendingReviews, { color: themeColors.subText }]}>
                      ({creative.reviews} reviews)
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Top Rated This Week */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Top Rated This Week</Text>
          {TOP_RATED_CREATIVES.map((creative) => (
            <TouchableOpacity
              key={creative.id}
              style={[styles.topRatedCard, { borderBottomColor: themeColors.border }]}
              onPress={() => handleCreativePress(creative.id)}
            >
              <Image source={creative.image} style={styles.topRatedImage} resizeMode="cover" />
              <View style={styles.topRatedInfo}>
                <Text style={[styles.topRatedName, { color: themeColors.text }]}>{creative.name}</Text>
                <View style={styles.topRatedCategoryRow}>
                  <Ionicons name="pricetag-outline" size={14} color={themeColors.subText} />
                  <Text style={[styles.topRatedCategory, { color: themeColors.subText }]}>
                    {creative.category}
                  </Text>
                </View>
                <View style={styles.topRatedRatingRow}>
                  <Ionicons name="star" size={14} color="#FFD700" />
                  <Text style={[styles.topRatedRating, { color: themeColors.text }]}>
                    {creative.rating}
                  </Text>
                  <Text style={[styles.topRatedReviews, { color: themeColors.subText }]}>
                    ({creative.reviews} reviews)
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom Spacer */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    // No paddingTop here - space is now handled by the status bar spacer above
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 16,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    width: CATEGORY_CARD_WIDTH,
    height: 120,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryImageStyle: {
    borderRadius: 16,
  },
  categoryGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 12,
  },
  categoryName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  trendingContainer: {
    gap: 12,
    paddingRight: 16,
  },
  trendingCard: {
    width: 160,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trendingImage: {
    width: '100%',
    height: 120,
  },
  trendingInfo: {
    padding: 12,
  },
  trendingName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  trendingCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  trendingCategory: {
    fontSize: 12,
  },
  trendingRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingRating: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendingReviews: {
    fontSize: 11,
  },
  topRatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  topRatedImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  topRatedInfo: {
    flex: 1,
    marginLeft: 12,
  },
  topRatedName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  topRatedCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  topRatedCategory: {
    fontSize: 13,
  },
  topRatedRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  topRatedRating: {
    fontSize: 13,
    fontWeight: '600',
  },
  topRatedReviews: {
    fontSize: 12,
  },
});