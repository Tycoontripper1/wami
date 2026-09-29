import EmptyState from '@/components/EmptyState';
import { SkeletonCard } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { getFeaturedProducts, getProducts } from '@/services/api/productsService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const GRID_CARD_WIDTH = (width - 48) / 2;
const FEATURED_CARD_WIDTH = 158;

interface ShopProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  rating?: number;
  reviews?: number;
  featured?: boolean;
  officialStore?: boolean;
  inStock: boolean;
}

// The real backend's list endpoints return a Laravel paginator
// ({current_page, data: [...], ...}), not the client's idealized
// {items: [...], pagination: {...}} shape — check both.
const extractList = (raw: any): any[] =>
  Array.isArray(raw) ? raw : raw?.items ?? raw?.data ?? [];

// The real /products endpoint has returned the same id twice within one page
// (confirmed live 2026-09-29, e.g. limit=8 -> [1,6,5,4,3,2,1]) — de-dupe
// defensively so a backend pagination glitch doesn't render a repeated card.
const dedupeById = <T extends { id: string }>(items: T[]): T[] => {
  const seen = new Set<string>();
  return items.filter(item => (seen.has(item.id) ? false : (seen.add(item.id), true)));
};

const mapProduct = (p: any): ShopProduct => ({
  id: String(p.id),
  name: p.name || p.title || 'Untitled',
  // /products/:id returns price as a string ("50000.00"); /products (list)
  // returns a number — coerce either way. Confirmed live 2026-09-29.
  price: Number(p.price) || 0,
  category: p.category || '',
  image: p.images?.[0] || p.image || p.thumbnail_url || p.media_url || '',
  rating: p.rating,
  reviews: p.reviews,
  featured: p.featured,
  officialStore: p.officialStore,
  inStock: p.stock === undefined || p.stock > 0,
});

const CATEGORIES: { name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'Fashion', icon: 'shirt-outline' },
  { name: 'Beauty', icon: 'sparkles-outline' },
  { name: 'Accessories', icon: 'watch-outline' },
  { name: 'Art', icon: 'color-palette-outline' },
  { name: 'Photography', icon: 'camera-outline' },
  { name: 'Digital', icon: 'phone-portrait-outline' },
];

const ProductCard = React.memo(function ProductCard({
  product,
  cardWidth,
  isDark,
  saved,
  onToggleSave,
  onPress,
}: {
  product: ShopProduct;
  cardWidth: number;
  isDark: boolean;
  saved: boolean;
  onToggleSave: () => void;
  onPress: () => void;
}) {
  const tc = {
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#EFEFEF',
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth, backgroundColor: tc.card, borderColor: tc.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.cardImageWrap, { width: cardWidth, height: cardWidth }]}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder, { backgroundColor: tc.border }]}>
            <Ionicons name="image-outline" size={28} color={tc.sub} />
          </View>
        )}

        {product.featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredBadgeText}>Featured</Text>
          </View>
        )}
        {!product.inStock && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutText}>Sold Out</Text>
          </View>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={onToggleSave} hitSlop={8}>
          <Ionicons name={saved ? 'heart' : 'heart-outline'} size={16} color={saved ? '#FF3B30' : '#fff'} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        {!!product.category && (
          <Text style={[styles.cardCategory, { color: tc.sub }]} numberOfLines={1}>
            {product.category.toUpperCase()}
          </Text>
        )}
        <Text style={[styles.cardName, { color: tc.text }]} numberOfLines={1}>{product.name}</Text>

        <View style={styles.cardBottomRow}>
          <Text style={[styles.cardPrice, { color: tc.text }]}>₦{product.price.toLocaleString()}</Text>
          {product.rating !== undefined && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#FFD700" />
              <Text style={[styles.ratingText, { color: tc.sub }]}>{product.rating}</Text>
            </View>
          )}
        </View>
        {product.officialStore && (
          <View style={styles.verifiedRow}>
            <Ionicons name="checkmark-circle" size={12} color={Colors.light.primary} />
            <Text style={[styles.verifiedText, { color: Colors.light.primary }]}>Verified Seller</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [featured, setFeatured] = useState<ShopProduct[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const themeColors = {
    background: isDark ? '#0A0A0A' : '#F8F9FA',
    text: isDark ? '#fff' : '#0A0A0A',
    subText: isDark ? '#8E8E93' : '#6B7280',
    cardBg: isDark ? '#1C1C1E' : '#fff',
    inputBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#2C2C2E' : '#EFEFEF',
  };

  const loadShop = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      // Fetched independently: /products/featured 404s on the real backend
      // (not implemented server-side, confirmed live 2026-09-29) and must not
      // take down the main product grid, which loads fine on its own.
      const [featuredRes, productsRes] = await Promise.allSettled([
        getFeaturedProducts(),
        getProducts({ limit: 8 }),
      ]);

      if (productsRes.status === 'rejected') {
        throw productsRes.reason;
      }

      const productsData: any = productsRes.value.data;
      setProducts(dedupeById(extractList(productsData).map(mapProduct)));

      if (featuredRes.status === 'fulfilled') {
        const featuredData: any = featuredRes.value.data;
        setFeatured(dedupeById(extractList(featuredData).map(mapProduct)));
      } else {
        console.warn('Failed to load featured products:', featuredRes.reason);
        setFeatured([]);
      }
    } catch (error) {
      console.error('Failed to load shop:', error);
      setFeatured([]);
      setProducts([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const toggleSave = (id: string) => {
    setSavedIds(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));
  };

  const goToProduct = (id: string) => router.push(`/product-detail/${id}` as any);
  const goToListing = (params?: Record<string, string>) =>
    router.push({ pathname: '/products-listing', params } as any);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={{ height: insets.top > 20 ? insets.top : 8 }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.pageTitle, { color: themeColors.text }]}>Shop</Text>
            <Text style={[styles.pageSubtitle, { color: themeColors.subText }]}>
              Discover products from creatives near you
            </Text>
          </View>
        </View>

        {/* Search entry point */}
        <TouchableOpacity
          style={[styles.searchContainer, { backgroundColor: themeColors.inputBg }]}
          onPress={() => goToListing()}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={20} color={themeColors.subText} />
          <Text style={[styles.searchPlaceholder, { color: themeColors.subText }]}>Search products...</Text>
        </TouchableOpacity>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.name}
              style={styles.categoryItem}
              onPress={() => goToListing({ category: cat.name })}
            >
              <View style={[styles.categoryCircle, { backgroundColor: themeColors.inputBg }]}>
                <Ionicons name={cat.icon} size={22} color={Colors.light.primary} />
              </View>
              <Text style={[styles.categoryLabel, { color: themeColors.text }]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {isLoading ? (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Featured Products</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[...Array(3)].map((_, i) => <SkeletonCard key={i} style={{ width: FEATURED_CARD_WIDTH }} />)}
              </View>
            </View>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>All Products</Text>
              <View style={styles.grid}>
                {[...Array(4)].map((_, i) => <SkeletonCard key={i} style={{ width: GRID_CARD_WIDTH }} />)}
              </View>
            </View>
          </>
        ) : hasError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Oops, we can't find anything"
            message="Something went wrong while loading the shop. Please check your connection and try again."
            onRetry={loadShop}
          />
        ) : (
          <>
            {/* Featured Products */}
            {featured.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Featured Products</Text>
                  <TouchableOpacity onPress={() => goToListing()}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={featured}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ gap: 12 }}
                  renderItem={({ item }) => (
                    <ProductCard
                      product={item}
                      cardWidth={FEATURED_CARD_WIDTH}
                      isDark={isDark}
                      saved={savedIds.includes(item.id)}
                      onToggleSave={() => toggleSave(item.id)}
                      onPress={() => goToProduct(item.id)}
                    />
                  )}
                />
              </View>
            )}

            {/* All Products */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: themeColors.text }]}>All Products</Text>
                <TouchableOpacity onPress={() => goToListing()}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              {products.length === 0 ? (
                <EmptyState icon="basket-outline" title="No products available yet" />
              ) : (
                <View style={styles.grid}>
                  {products.map((item) => (
                    <ProductCard
                      key={item.id}
                      product={item}
                      cardWidth={GRID_CARD_WIDTH}
                      isDark={isDark}
                      saved={savedIds.includes(item.id)}
                      onToggleSave={() => toggleSave(item.id)}
                      onPress={() => goToProduct(item.id)}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  headerRow: { marginBottom: 16 },
  pageTitle: { fontSize: 26, fontWeight: '800' },
  pageSubtitle: { fontSize: 13, marginTop: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  searchPlaceholder: { fontSize: 15 },
  categoriesRow: { gap: 18, paddingBottom: 24 },
  categoryItem: { alignItems: 'center', width: 68 },
  categoryCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  categoryLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAllText: { fontSize: 13, fontWeight: '600', color: Colors.light.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  cardImageWrap: { position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  featuredBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: '#FFA000', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  featuredBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  soldOutOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  soldOutText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  saveBtn: {
    position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
  },
  cardContent: { padding: 10, gap: 3 },
  cardCategory: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4 },
  cardName: { fontSize: 14, fontWeight: '600' },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  cardPrice: { fontSize: 15, fontWeight: '800' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 11, fontWeight: '600' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  verifiedText: { fontSize: 10, fontWeight: '600' },
});
