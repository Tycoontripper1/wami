import EmptyState from '@/components/EmptyState';
import { SkeletonRow } from '@/components/Skeleton';
import Colors from '@/constants/Colors';
import { DiscoveryOffering, getMyItems } from '@/services/api/discoveryService';
import { deleteProduct, updateProduct } from '@/services/api/productsService';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MyItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  status: string;
}

const mapOfferingToMyItem = (offering: DiscoveryOffering): MyItem => ({
  id: String(offering.id ?? offering.offering_id),
  name: offering.name || offering.title || 'Untitled',
  category: offering.category || '',
  price: offering.price ?? 0,
  image: offering.image || offering.images?.[0] || '',
  status: offering.is_saved === false ? 'Sold' : 'Active',
});

export default function MyProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [items, setItems] = useState<MyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [editingItem, setEditingItem] = useState<MyItem | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const loadMyItems = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await getMyItems();
      const data: any = res.data;
      const offerings: DiscoveryOffering[] = Array.isArray(data) ? data : data?.items ?? [];
      setItems(offerings.map(mapOfferingToMyItem));
    } catch (error) {
      console.error('Failed to load my items:', error);
      setItems([]);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyItems();
  }, [loadMyItems]);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const handleDelete = (item: MyItem) => {
    Alert.alert('Delete Product', `Are you sure you want to delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const previous = items;
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          try {
            await deleteProduct(item.id);
          } catch (error) {
            console.error('Failed to delete product:', error);
            setItems(previous);
            Alert.alert('Couldn\'t Delete', 'Something went wrong while deleting this product. Please try again.');
          }
        },
      },
    ]);
  };

  const openEdit = (item: MyItem) => {
    setEditingItem(item);
    setEditPrice(String(item.price));
    setEditStock('');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    try {
      const payload: { price?: number; stock?: number } = {};
      if (editPrice.trim()) payload.price = Number(editPrice);
      if (editStock.trim()) payload.stock = Number(editStock);
      await updateProduct(editingItem.id, payload);
      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? { ...i, price: payload.price ?? i.price } : i))
      );
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to update product:', error);
      Alert.alert('Couldn\'t Update', 'Something went wrong while updating this product. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const renderProductItem = ({ item }: { item: MyItem }) => (
    <View style={[styles.productCard, { backgroundColor: themeColors.cardBg }]}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={[styles.productName, { color: themeColors.text }]}>{item.name}</Text>
        <Text style={[styles.productCategory, { color: themeColors.subText }]}>{item.category}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>₦{item.price.toLocaleString()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Active' ? '#4CD964' : '#FF3B30' }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => openEdit(item)}>
          <Ionicons name="create-outline" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: themeColors.text }]}>My Products</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={[styles.listContent, { gap: 14 }]}>
          {[...Array(5)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </View>
      ) : hasError ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Oops, we can't find anything"
          message="Something went wrong while loading your products. Please check your connection and try again."
          onRetry={loadMyItems}
        />
      ) : (
        <FlatList
          data={items}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <EmptyState icon="basket-outline" title="No products listed yet" />
          }
        />
      )}

      {/* Edit Price/Stock Modal */}
      <Modal visible={!!editingItem} transparent animationType="slide">
        <View style={styles.sheetOverlay}>
          <View style={[styles.sheet, { backgroundColor: isDark ? '#1C1C1E' : '#fff' }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Edit {editingItem?.name}</Text>

            <Text style={[styles.inputLabel, { color: themeColors.subText }]}>Price (₦)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.cardBg, color: themeColors.text }]}
              value={editPrice}
              onChangeText={setEditPrice}
              keyboardType="numeric"
              placeholder="Price"
              placeholderTextColor={themeColors.subText}
            />

            <Text style={[styles.inputLabel, { color: themeColors.subText }]}>Stock Quantity</Text>
            <TextInput
              style={[styles.input, { backgroundColor: themeColors.cardBg, color: themeColors.text }]}
              value={editStock}
              onChangeText={setEditStock}
              keyboardType="numeric"
              placeholder="Leave blank to keep unchanged"
              placeholderTextColor={themeColors.subText}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingItem(null)} style={styles.cancelButton}>
              <Text style={{ color: themeColors.subText, fontSize: 15 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
    paddingBottom: 16,
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
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  productCard: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  productInfo: {
    flex: 1,
    marginLeft: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    marginBottom: 8,
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  productActions: {
    gap: 12,
    marginLeft: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 26,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
});
