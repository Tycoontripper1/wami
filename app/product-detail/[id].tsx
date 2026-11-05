import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { formatAmountInput, parseAmount } from '@/utils/money';
import { loadLocalProductPhotos, localProductPhoto } from '@/utils/localProductPhotos';
import { startConversation } from '@/services/api/chatService';
import { addCartItem } from '@/services/api/ordersService';
import { useAuthGate } from '@/hooks/useAuthGate';
import { absoluteUrl } from '@/utils/mediaUrl';
import { getOfferingById } from '@/services/api/offeringsService';
import EmptyState from '@/components/EmptyState';
import Colors from '@/constants/Colors';
import { getProductById } from '@/services/api/productsService';
import { Ionicons } from '@/components/FlatIcon';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Alert } from '@/components/AppAlert';
import { Text, TextInput } from '@/components/AppText';
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
  description?: string;
  /** The id /cart/items wants; the old product id, which differs from the listing id. */
  cartProductId?: string;
  sellerName?: string;
  sellerId?: string;
  sellerAvatar?: string;
  officialStore?: boolean;
}

const mapApiProductToDetail = (p: any): ProductDetail => ({
  id: String(p.id),
  name: p.title || p.name || 'Untitled',
  // /products/:id returns price as a string ("50000.00"); coerce it.
  // Confirmed live 2026-09-29.
  price: Number(p.price) || 0,
  category: p.category || '',
  // The full-size photo, not the 320px thumbnail the lists use.
  image: p.media_url || p.thumbnail_url || p.image || p.images?.[0] || localProductPhoto(p.id),
  images: Array.isArray(p.images)
    ? p.images.map((i: any) => (typeof i === 'string' ? i : i?.url ?? i?.media_url)).filter(Boolean)
    : undefined,
  status: p.stock === 0 ? 'Sold' : (p.status === 'published' ? 'Active' : p.status || 'Active'),
  condition: p.condition || undefined,
  size: p.size,
  description: typeof p.description === 'string' ? p.description.trim() : undefined,
  sellerName:
    p.creator?.name ||
    p.sellerName ||
    p.seller?.name ||
    [p.user?.first_name, p.user?.last_name].filter(Boolean).join(' ') ||
    undefined,
  cartProductId: p.legacy?.product_id !== undefined ? String(p.legacy.product_id) : p.id !== undefined ? String(p.id) : undefined,
  sellerId:
    p.creator?.id !== undefined ? String(p.creator.id) : p.creator_id !== undefined ? String(p.creator_id) : undefined,
  sellerAvatar: absoluteUrl(p.creator?.profile_image),
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
  const [isSendingOffer, setIsSendingOffer] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { gate } = useAuthGate();
  const myId = useSelector((st: RootState) => (st.auth.user as any)?.id);

  const productId = params.id as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadProduct = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      let data: any;
      try {
        await loadLocalProductPhotos();
        data = (await getProductById(productId, { expectMissing: true })).data;
      } catch (error: any) {
        // The shop list can include listings whose id /products/:id does not
        // know (they are offerings); the offering endpoint serves those.
        if (error?.statusCode !== 404) throw error;
        data = (await getOfferingById(productId)).data;
      }
      setProduct(mapApiProductToDetail(data));
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

  const productImages = (product?.images?.length ? product.images : product ? [product.image] : []).filter(Boolean);

  const handleImageScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setSelectedImageIndex(index);
  };

  const isMine = !!product?.sellerId && myId !== undefined && String(myId) === product.sellerId;

  // An offer goes to the seller as a chat message, so they see it and can
  // answer it there. There is no separate offers endpoint.
  const handleSendOffer = () =>
    gate('Sign in to make an offer, so the seller can reply to you.', async () => {
      const amount = parseAmount(offerPrice);
      if (!product || !product.sellerId) {
        Alert.alert("Can't send an offer", 'We could not tell who is selling this. Please try again later.');
        return;
      }
      if (amount <= 0) {
        Alert.alert('Missing Offer', 'Please enter an offer amount');
        return;
      }
      setIsSendingOffer(true);
      try {
        const body = `Hi${product.sellerName ? ` ${product.sellerName.split(' ')[0]}` : ''}, I'd like to offer ₦${amount.toLocaleString()} for "${product.name}" (listed at ₦${product.price.toLocaleString()}). Would that work?`;
        const res = await startConversation(product.sellerId, body);
        setShowOfferInput(false);
        setOfferPrice('');
        const conversationId = (res.data as any)?.id ?? (res.data as any)?.conversation_id;
        Alert.alert('Offer sent', 'The seller has your offer in chat. You will see their reply there.', [
          {
            text: 'Open chat',
            onPress: () =>
              router.push({
                pathname: '/chat/[id]',
                params: {
                  id: conversationId !== undefined ? String(conversationId) : 'new',
                  recipientId: product.sellerId,
                  name: product.sellerName ?? 'Seller',
                  avatar: product.sellerAvatar ?? '',
                },
              } as any),
          },
          { text: 'Done', style: 'cancel' },
        ]);
      } catch (error: any) {
        console.error('Failed to send offer:', error);
        Alert.alert("Couldn't send your offer", error?.message ?? 'Please try again.');
      } finally {
        setIsSendingOffer(false);
      }
    });

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
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

  // The route's id is the listing id. It is passed on as it came, because the
  // product's own id can collide with another listing's id.
  const handleBuyNow = () =>
    gate('Sign in to buy this.', () => {
      if (isMine) {
        Alert.alert("That's your own listing", "You can't buy something you are selling.");
        return;
      }
      router.push(`/checkout?productId=${productId}` as any);
    });


  const handleAddToCart = () =>
    gate('Sign in to add things to your cart.', async () => {
      if (isMine) {
        Alert.alert("That's your own listing", "You can't buy something you are selling.");
        return;
      }
      setIsAddingToCart(true);
      try {
        await addCartItem({ product_id: product.cartProductId ?? product.id, quantity: 1 });
        Alert.alert('Added to your cart', product.name, [
          { text: 'View cart', onPress: () => router.push('/cart' as any) },
          { text: 'Keep browsing', style: 'cancel' },
        ]);
      } catch (error: any) {
        console.error('Failed to add to cart:', error);
        Alert.alert("Couldn't add it to your cart", error?.message ?? 'Please try again.');
      } finally {
        setIsAddingToCart(false);
      }
    });

  const handleContactSeller = () =>
    gate('Sign in to message the seller.', () => {
      if (!product.sellerId) {
        Alert.alert("Can't open chat", 'We could not tell who is selling this. Please try again later.');
        return;
      }
      router.push({
        pathname: '/chat/[id]',
        params: { id: 'new', recipientId: product.sellerId, name: product.sellerName ?? 'Seller', avatar: product.sellerAvatar ?? '' },
      } as any);
    });

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.headerButton, { alignItems: 'flex-start' }]}>
            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity style={[styles.headerButton, { alignItems: 'flex-end' }]} onPress={() => router.push('/cart' as any)} accessibilityLabel="Cart">
              <Ionicons name="cart" size={24} color={themeColors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.headerButton, { alignItems: 'flex-end' }]}>
              <Ionicons name="share-outline" size={24} color={themeColors.text} />
            </TouchableOpacity>
          </View>
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

          {productImages.length === 0 ? (
            <View
              style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: themeColors.cardBg }]}
            >
              <Ionicons name="image-outline" size={56} color={themeColors.subText} />
            </View>
          ) : null}

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
            {product.condition ? (
              <View style={styles.conditionTag}>
                <Ionicons name="star" size={12} color={Colors.light.primary} />
                <Text style={styles.conditionTagText}>{product.condition}</Text>
              </View>
            ) : null}
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
                    {product.sellerName || 'Seller'}
                  </Text>
                  {product.officialStore && (
                    <View style={styles.officialBadge}>
                      <Ionicons name="checkmark-circle" size={12} color="#0F1419" />
                      <Text style={styles.officialBadgeText}>Official Store</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.sellerLabel, { color: themeColors.subText }]}>Sold by</Text>
              </View>
            </View>
          </View>

          {!isMine && (
          <View style={styles.sellerActionsRow}>
            <TouchableOpacity
              style={[styles.offerButton, { borderColor: Colors.light.primary }]}
              onPress={() => setShowOfferInput((v) => !v)}
            >
              <Text style={[styles.offerButtonText, { color: Colors.light.primary }]}>Offer Price</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.messageButton} onPress={handleContactSeller}>
              <Ionicons name="chatbubble-ellipses-outline" size={18} color="#0F1419" />
              <Text style={styles.messageButtonText}>Message</Text>
            </TouchableOpacity>
          </View>
          )}

          {showOfferInput && !isMine && (
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
                  onChangeText={(t) => setOfferPrice(formatAmountInput(t))}
                />
              </View>
              <Text style={[styles.offerCounterNote, { color: themeColors.subText }]}>
                The seller may accept, counter, or decline your offer.
              </Text>
              <TouchableOpacity style={[styles.sendOfferButton, isSendingOffer && { opacity: 0.6 }]} onPress={handleSendOffer} disabled={isSendingOffer}>
                {isSendingOffer ? <ActivityIndicator color="#0F1419" /> : <Text style={styles.sendOfferButtonText}>Send Offer</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Description */}
          {product.description ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Description</Text>
              <Text style={[styles.description, { color: themeColors.subText }]}>{product.description}</Text>
            </View>
          ) : null}

          {/* Details */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Details</Text>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.subText }]}>Category</Text>
              <Text style={[styles.detailValue, { color: themeColors.text }]}>{product.category}</Text>
            </View>
            {product.condition ? (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: themeColors.subText }]}>Condition</Text>
                <Text style={[styles.detailValue, { color: themeColors.text }]}>{product.condition}</Text>
              </View>
            ) : null}
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
            style={[styles.addToCartButton, { borderColor: Colors.light.primary }, isAddingToCart && { opacity: 0.6 }]}
            onPress={handleAddToCart}
            disabled={isAddingToCart || product.status !== 'Active'}
            accessibilityLabel="Add to cart"
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
              <Ionicons name="cart-outline" size={20} color={Colors.light.primary} />
            )}
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
  // Pixel sizes: a percentage width collapses to nothing inside a horizontal
  // ScrollView, which is why the photo never showed.
  productImage: {
    width: width,
    height: width,
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
    ...StyleSheet.absoluteFill,
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
    color: '#0F1419',
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
    borderRadius: 10,
    paddingVertical: 9,
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
    borderRadius: 10,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageButtonText: {
    color: '#0F1419',
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
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
  },
  offerInput: {
    flex: 1,
    fontSize: 15,
  },
  offerCounterNote: {
    fontSize: 12,
    marginBottom: 14,
  },
  sendOfferButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  sendOfferButtonText: {
    color: '#0F1419',
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
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#0F1419',
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
    paddingVertical: 9,
    borderRadius: 10,
  },
  backToHomeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
