import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/Colors';
import { getProductById } from '@/services/api/productsService';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface ProductDetail {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  images?: string[];
  status: string;
  condition?: string;
  size?: string;
  sellerName?: string;
  officialStore?: boolean;
}

const mapApiProductToDetail = (p: any): ProductDetail => ({
  id: String(p.id),
  name: p.title || p.name || 'Untitled',
  price: p.price ?? 0,
  category: p.category || '',
  image: p.image || p.images?.[0] || '',
  images: p.images,
  status: p.stock === 0 ? 'Sold' : (p.status === 'published' ? 'Active' : p.status || 'Active'),
  condition: p.condition,
  size: p.size,
  sellerName: p.sellerName || p.seller?.name,
  officialStore: p.officialStore,
});

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showOfferInput, setShowOfferInput] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');

  const productId = params.id as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await getProductById(productId);
      setProduct(mapApiProductToDetail(res.data));
    } catch (error) {
      console.error('Failed to load product:', error);
      setProduct(null);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const productImages = product?.images?.length ? product.images : product ? [product.image] : [];

  const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setSelectedImageIndex(index);
  };

  const handleSendOffer = () => {
    if (!offerPrice.trim()) {
      Alert.alert('Missing Offer', 'Please enter an offer amount');
      return;
    }
    Alert.alert(
      'Offer Sent! 🎉',
      `Your offer of ₦${Number(offerPrice).toLocaleString()} has been sent to the seller. They typically respond within 24 hours, or may counter with a different price.`,
      [{ text: 'OK', onPress: () => { setShowOfferInput(false); setOfferPrice(''); } }]
    );
  };

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={Colors.light.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (hasError || !product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <EmptyState
          icon={hasError ? 'cloud-offline-outline' : 'alert-circle-outline'}
          title={hasError ? "Oops, we can't find anything" : 'Product not found'}
          message={hasError ? 'Something went wrong while loading this product. Please check your connection and try again.' : undefined}
          onRetry={hasError ? loadProduct : () => router.back()}
          retryLabel={hasError ? 'Try Again' : 'Go Back'}
        />
      </SafeAreaView>
    );
  }

  const handleBuyNow = () => {
    router.push(`/checkout?productId=${product.id}` as any);
  };


  const handleAddToCart = () => {
    Alert.alert('Added to Cart', `${product.name} has been added to your cart`);
  };

  const handleContactSeller = () => {
    Alert.alert('Contact Seller', 'Opening chat with seller... (Demo)');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Product Image Carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleImageScroll}
          >
            {productImages.map((img, index) => (
              <Image key={index} source={{ uri: img }} style={styles.productImage} />
            ))}
          </ScrollView>

          {product.status !== 'Active' && (
            <View style={styles.soldOutOverlay}>
              <Text style={styles.soldOutText}>Sold Out</Text>
            </View>
          )}

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: product.status === 'Active' ? '#4CD964' : '#999' },
            ]}
          >
            <Text style={styles.statusText}>{product.status}</Text>
          </View>

          {productImages.length > 1 && (
            <View style={styles.dotsContainer}>
              {productImages.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: index === selectedImageIndex ? '#fff' : 'rgba(255,255,255,0.5)' },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <View style={styles.categoryRow}>
            <Ionicons name="pricetag" size={16} color={Colors.light.primary} />
            <Text style={[styles.category, { color: themeColors.subText }]}>{product.category}</Text>
          </View>

          <Text style={[styles.productName, { color: themeColors.text }]}>{product.name}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>₦{product.price.toLocaleString()}</Text>
            <View style={styles.conditionTag}>
              <Ionicons name="star" size={12} color={Colors.light.primary} />
              <Text style={styles.conditionTagText}>{product.condition || 'New'}</Text>
            </View>
          </View>
          <Text style={[styles.serviceChargeNote, { color: themeColors.subText }]}>
            Price includes Wami buyer protection · service charge calculated at checkout
          </Text>

          {/* Seller Info */}
          <View style={[styles.sellerCard, { backgroundColor: themeColors.cardBg }]}>
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <Ionicons name="person" size={24} color={themeColors.subText} />
              </View>
              <View style={styles.sellerTextContainer}>
                <View style={styles.sellerNameRow}>
                  <Text style={[styles.sellerName, { color: themeColors.text }]}>
                    {product.sellerName || 'Creative Seller'}
                  </Text>
                  {product.officialStore && (
                    <View style={styles.officialBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#fff" />
                      <Text style={styles.officialBadgeText}>Official Store</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.sellerLabel, { color: themeColors.subText }]}>Sold by</Text>
              </View>
            </View>
          </View>

          <View style={styles.sellerActionsRow}>
            <TouchableOpacity
              style={[styles.offerButton, { borderColor: Colors.light.primary }]}
              onPress={() => setShowOfferInput((v) => !v)}
            >
              <Text style={[styles.offerButtonText, { color: Colors.light.primary }]}>Offer Price</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton} onPress={handleContactSeller}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>

          {showOfferInput && (
            <View style={[styles.offerInlineCard, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
              <Text style={[styles.offerInlineLabel, { color: themeColors.text }]}>Make an Offer</Text>
              <View style={[styles.offerInputRow, { borderColor: themeColors.border }]}>
                <Text style={{ color: themeColors.text, fontSize: 16, fontWeight: '600' }}>₦</Text>
                <TextInput
                  style={[styles.offerInput, { color: themeColors.text }]}
                  placeholder="Enter your offer"
                  placeholderTextColor={themeColors.subText}
                  keyboardType="numeric"
                  value={offerPrice}
                  onChangeText={setOfferPrice}
                />
              </View>
              <Text style={[styles.offerCounterNote, { color: themeColors.subText }]}>
                The seller may accept, counter, or decline your offer.
              </Text>
              <TouchableOpacity style={styles.sendOfferButton} onPress={handleSendOffer}>
                <Text style={styles.sendOfferButtonText}>Send Offer</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Description */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Description</Text>
            <Text style={[styles.description, { color: themeColors.subText }]}>
              This is a high-quality {product.name.toLowerCase()} in the {product.category.toLowerCase()} category. 
              Perfect for those looking for unique and creative items. Each piece is carefully crafted 
              to ensure the best quality and design.
            </Text>
          </View>

          {/* Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.subText }]}>Category</Text>
              <Text style={[styles.detailValue, { color: themeColors.text }]}>{product.category}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.subText }]}>Condition</Text>
              <Text style={[styles.detailValue, { color: themeColors.text }]}>{product.condition || 'New'}</Text>
            </View>
            {product.size && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: themeColors.subText }]}>Size</Text>
                <Text style={[styles.detailValue, { color: themeColors.text }]}>{product.size}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <SafeAreaView edges={['bottom']}>
        <View style={[styles.bottomActions, { backgroundColor: themeColors.background, borderTopColor: themeColors.border }]}>
          <TouchableOpacity
            style={[styles.addToCartButton, { borderColor: Colors.light.primary }]}
            onPress={handleAddToCart}
          >
            <Ionicons name="cart-outline" size={20} color={Colors.light.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.buyButton}
            onPress={handleBuyNow}
            disabled={product.status !== 'Active'}
          >
            <Text style={styles.buyButtonText}>
              {product.status === 'Active' ? 'Buy Now' : 'Sold Out'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: width,
    height: width,
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  soldOutOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  soldOutText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  conditionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  serviceChargeNote: {
    fontSize: 12,
    marginBottom: 16,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  officialBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sellerActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  offerButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
  },
  offerButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.light.primary,
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  offerInlineCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  offerInlineLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  offerInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 8,
  },
  offerInput: {
    flex: 1,
    fontSize: 16,
  },
  offerCounterNote: {
    fontSize: 12,
    marginBottom: 14,
  },
  sendOfferButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sendOfferButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  infoContainer: {
    padding: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  category: {
    fontSize: 14,
    fontWeight: '500',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 20,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerTextContainer: {
    gap: 2,
  },
  sellerLabel: {
    fontSize: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 15,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderTopWidth: 1,
  },
  addToCartButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButton: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.light.primary,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  backToHomeButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backToHomeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
