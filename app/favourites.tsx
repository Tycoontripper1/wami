import Colors from '@/constants/Colors';
import SharedEmptyState from '@/components/EmptyState';
import { SkeletonRow } from '@/components/Skeleton';
import { getSavedOfferings, unsaveOffering } from '@/services/api/discoveryService';
import { removeFavorite } from '@/store/favoritesSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

interface FavoriteItem {
  id: string;
  name: string;
  role: string;
  location: string;
  rating: number;
  reviews: number;
  image?: { uri: string };
}

export default function FavouritesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadSaved = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await getSavedOfferings();
      const data: any = res.data;
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setFavorites(
        items.map((item: any) => ({
          id: String(item.id ?? item.offering_id),
          name: item.name || item.title || 'Untitled',
          role: item.role || item.category || '',
          location: item.location?.city || '',
          rating: item.rating ?? 0,
          reviews: item.reviews ?? item.reviews_count ?? 0,
          image: item.image ? { uri: item.image } : item.images?.[0] ? { uri: item.images[0] } : undefined,
        }))
      );
    } catch (error) {
      console.error('Failed to load saved offerings:', error);
      setFavorites([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#fff',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const handleRemove = (id: string) => {
    dispatch(removeFavorite(id));
    setFavorites((prev) => prev.filter((f) => f.id !== id));
    unsaveOffering(id).catch((error) => console.error('Failed to unsave offering:', error));
  };

  const renderSavedItem = ({ item }: { item: typeof favorites[0] }) => (
    <TouchableOpacity
      style={[styles.savedCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}
      onPress={() => router.push(`/profile/${item.id}`)}
    >
      {item.image ? (
        <Image source={item.image} style={styles.savedImage} resizeMode="cover" />
      ) : (
        <View style={[styles.savedImage, styles.imagePlaceholder]}>
          <Ionicons name="person" size={30} color={themeColors.subText} />
        </View>
      )}
      <View style={styles.savedInfo}>
        <Text style={[styles.savedName, { color: themeColors.text }]}>{item.name}</Text>
        <Text style={[styles.savedRole, { color: themeColors.subText }]}>{item.role}</Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color={themeColors.subText} />
          <Text style={[styles.locationText, { color: themeColors.subText }]}>{item.location}</Text>
        </View>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={[styles.ratingText, { color: themeColors.text }]}>{item.rating}</Text>
          <Text style={[styles.reviewsText, { color: themeColors.subText }]}>({item.reviews} reviews)</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemove(item.id)}
      >
        <Ionicons name="heart" size={24} color={Colors.light.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="bookmark-outline" size={80} color={themeColors.subText} />
      <Text style={[styles.emptyTitle, { color: themeColors.text }]}>No saved creatives</Text>
      <Text style={[styles.emptySubtitle, { color: themeColors.subText }]}>
        Tap the heart icon on creatives you love to save them here!
      </Text>
      <TouchableOpacity
        style={styles.exploreButton}
        onPress={() => router.push('/(tabs)/discover')}
      >
        <Text style={styles.exploreButtonText}>Explore</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.title, { color: themeColors.text }]}>Favourites</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          {favorites.length} saved creatives
        </Text>
      </View>

      {/* Saved List */}
      {isLoading ? (
        <View style={styles.listContainer}>
          {[...Array(5)].map((_, i) => (
            <SkeletonRow key={i} style={styles.skeletonRow} />
          ))}
        </View>
      ) : hasError ? (
        <SharedEmptyState
          icon="cloud-offline-outline"
          title="Oops, we can't find anything"
          message="Something went wrong while loading your favourites. Please check your connection and try again."
          onRetry={loadSaved}
        />
      ) : favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderSavedItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  skeletonRow: {
    marginBottom: 12,
  },
  savedCard: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  savedImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  imagePlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  savedName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  savedRole: {
    fontSize: 13,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reviewsText: {
    fontSize: 11,
  },
  removeButton: {
    padding: 8,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
