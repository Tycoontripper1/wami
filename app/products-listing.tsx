import EmptyState from '@/components/EmptyState';
import { SkeletonCard } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { getProducts } from '@/services/api/productsService';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Dimensions,
    FlatList,
    Image,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  status: string;
  condition?: string;
  size?: string;
}

const mapApiProductToProduct = (p: any): Product => ({
  id: String(p.id),
  name: p.title || p.name || 'Untitled',
  price: p.price ?? 0,
  category: p.category || '',
  image: p.image || p.images?.[0] || '',
  status: p.stock === 0 ? 'Sold' : (p.status === 'published' ? 'Active' : p.status || 'Active'),
  condition: p.condition,
  size: p.size,
});

const CATEGORIES = [
  { name: 'Beauty', icon: 'sparkles-outline' as const },
  { name: 'Fashion', icon: 'shirt-outline' as const },
  { name: 'Kids', icon: 'happy-outline' as const },
  { name: 'Mens', icon: 'man-outline' as const },
  { name: 'Womens', icon: 'woman-outline' as const },
  { name: 'Electronics', icon: 'phone-portrait-outline' as const },
  { name: 'Art', icon: 'color-palette-outline' as const },
  { name: 'Food', icon: 'restaurant-outline' as const },
];

const FILTER_CHIPS = ['All', 'Shoes', 'Clothing', 'Bags', 'Accessories', 'Beauty'];

export default function ProductsListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ category?: string; search?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [searchQuery, setSearchQuery] = useState(params.search || '');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.category || null);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await getProducts();
      const data: any = res.data;
      const items = Array.isArray(data) ? data : data?.items ?? [];
      setProducts(items.map(mapApiProductToProduct));
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
    inputBg: isDark ? '#1A1A1A' : '#F5F5F5',
    pillBg: isDark ? '#1A1A1A' : '#F5F5F5',
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesFilter = selectedFilter === 'All' || p.category === selectedFilter;
      return matchesSearch && matchesCategory && matchesFilter;
    });
  }, [products, searchQuery, selectedCategory, selectedFilter]);

  const renderProductItem = ({ item }: { item: Product }) => {
    const soldOut = item.status !== 'Active';
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/product-detail/${item.id}` as any)}
        activeOpacity={0.85}
      >
        <Image source={{ uri: item.image }} style={styles.productImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.75)']}
          style={styles.productGradient}
        />

        {soldOut && (
          <View style={styles.soldOutOverlay}>
            <Text style={styles.soldOutOverlayText}>Sold Out</Text>
          </View>
        )}

        <TouchableOpacity style={styles.heartButton}>
          <Ionicons name="heart-outline" size={18} color="#fff" />
        </TouchableOpacity>

        {item.condition && (
          <View style={styles.conditionPill}>
            <Text style={styles.conditionPillText}>{item.condition}</Text>
          </View>
        )}

        {item.size && (
          <View style={styles.sizePill}>
            <Text style={styles.sizePillText}>{item.size}</Text>
          </View>
        )}

        <View style={styles.productOverlayInfo}>
          <Text style={styles.productNameOverlay} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.productPriceOverlay}>₦{item.price.toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>Shop</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Pill */}
      <View style={[styles.searchContainer, { backgroundColor: themeColors.inputBg }]}>
        <Ionicons name="search" size={20} color={themeColors.subText} />
        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          placeholder="Search products..."
          placeholderTextColor={themeColors.subText}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Circles */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.name}
        contentContainerStyle={styles.categoriesRow}
        renderItem={({ item }) => {
          const selected = selectedCategory === item.name;
          return (
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => setSelectedCategory(selected ? null : item.name)}
            >
              <View
                style={[
                  styles.categoryCircle,
                  { backgroundColor: selected ? Colors.light.primary : themeColors.pillBg },
                ]}
              >
                <Ionicons name={item.icon} size={22} color={selected ? '#fff' : themeColors.subText} />
              </View>
              <Text style={[styles.categoryLabel, { color: selected ? Colors.light.primary : themeColors.subText }]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Filter Chips */}
      <FlatList
        data={FILTER_CHIPS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(f) => f}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const selected = selectedFilter === item;
          return (
            <TouchableOpacity
              style={[
                styles.filterChip,
                {
                  backgroundColor: selected ? Colors.light.primary : themeColors.pillBg,
                  borderColor: selected ? Colors.light.primary : themeColors.border,
                },
              ]}
              onPress={() => setSelectedFilter(item)}
            >
              <Text style={[styles.filterChipText, { color: selected ? '#fff' : themeColors.text }]}>{item}</Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Products Grid */}
      {isLoading ? (
        <View style={[styles.listContent, styles.skeletonGrid]}>
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} style={styles.productCard} />
          ))}
        </View>
      ) : hasError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Oops, we can't find anything"
          message="Something went wrong while loading products. Please check your connection and try again."
          onRetry={loadProducts}
        />
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState icon="basket-outline" title="No products available yet" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  categoriesRow: {
    paddingHorizontal: 16,
    gap: 16,
    paddingBottom: 12,
  },
  categoryItem: {
    alignItems: 'center',
    width: 64,
  },
  categoryCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: (width - 48) / 2,
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  productImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  productGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutOverlayText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heartButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conditionPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  conditionPillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sizePill: {
    position: 'absolute',
    top: 36,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sizePillText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  productOverlayInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  productNameOverlay: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  productPriceOverlay: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});
