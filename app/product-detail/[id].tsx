import Colors from '@/constants/Colors';
import { MOCK_PRODUCTS } from '@/constants/MockProducts';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const productId = params.id as string;
  const product = MOCK_PRODUCTS.find((p) => p.id === productId);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={themeColors.subText} />
          <Text style={[styles.errorText, { color: themeColors.text }]}>Product not found</Text>
          <TouchableOpacity style={styles.backToHomeButton} onPress={() => router.back()}>
            <Text style={styles.backToHomeText}>Go Back</Text>
          </TouchableOpacity>
        </View>
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
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.productImage} />
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: product.status === 'Active' ? '#4CD964' : '#999' },
            ]}
          >
            <Text style={styles.statusText}>{product.status}</Text>
          </View>
        </View>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <View style={styles.categoryRow}>
            <Ionicons name="pricetag" size={16} color={Colors.light.primary} />
            <Text style={[styles.category, { color: themeColors.subText }]}>{product.category}</Text>
          </View>

          <Text style={[styles.productName, { color: themeColors.text }]}>{product.name}</Text>

          <Text style={styles.productPrice}>₦{product.price.toLocaleString()}</Text>

          {/* Seller Info */}
          <TouchableOpacity
            style={[styles.sellerCard, { backgroundColor: themeColors.cardBg }]}
            onPress={handleContactSeller}
          >
            <View style={styles.sellerInfo}>
              <View style={styles.sellerAvatar}>
                <Ionicons name="person" size={24} color={themeColors.subText} />
              </View>
              <View style={styles.sellerTextContainer}>
                <Text style={[styles.sellerLabel, { color: themeColors.subText }]}>Sold by</Text>
                <Text style={[styles.sellerName, { color: themeColors.text }]}>Creative Seller</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.subText} />
          </TouchableOpacity>

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
              <Text style={[styles.detailLabel, { color: themeColors.subText }]}>Listed Date</Text>
              <Text style={[styles.detailValue, { color: themeColors.text }]}>{product.date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: themeColors.subText }]}>Condition</Text>
              <Text style={[styles.detailValue, { color: themeColors.text }]}>New</Text>
            </View>
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
