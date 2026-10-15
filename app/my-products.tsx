import EmptyState from '@/components/EmptyState';
import { Ionicons } from '@/components/FlatIcon';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import { SkeletonRow } from '@/components/Skeleton';
import { Text } from '@/components/AppText';
import Colors from '@/constants/Colors';
import { DiscoveryOffering, getMyItems } from '@/services/api/discoveryService';
import { bulkPublishOfferings } from '@/services/api/offeringsService';
import {
  bulkDeleteProducts,
  bulkUpdateProducts,
  deleteProduct,
  getProducts,
  updateProduct,
} from '@/services/api/productsService';
import { extractList } from '@/utils/extractList';
import { loadLocalProductPhotos, localProductPhoto, rememberProductPhoto } from '@/utils/localProductPhotos';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ORANGE = '#FFA000';
const CORAL = '#E5533F';
const GREEN = '#2BA84A';

type Status = 'live' | 'draft' | 'soldout';

interface MyItem {
  /** The listing (offering) id, as the "my items" endpoint returns it. */
  id: string;
  /** The id /products/:id knows this listing by, when it can be matched. */
  productId: string;
  name: string;
  category: string;
  price: number;
  image: string;
  status: Status;
  stock?: number;
}

// The "my items" list returns listings (offerings); edit and delete live on
// /products/:id, which uses a different id. The same listing shows up in
// /products with its own id, so match it by title, price and creation minute.
function matchProduct(offering: any, products: any[]): any | undefined {
  const created = String(offering.created_at ?? '').slice(0, 16);
  return products.find(
    (p) =>
      p.source !== 'manual' &&
      p.title === offering.title &&
      Number(p.price) === Number(offering.price) &&
      String(p.created_at ?? '').slice(0, 16) === created
  );
}

function toItem(offering: DiscoveryOffering, products: any[]): MyItem {
  const match = matchProduct(offering, products);
  const stock = match?.stock;
  const soldOut = match?.sold_out === true || stock === 0;
  const isDraft = offering.status === 'draft';
  const id = String(offering.id ?? offering.offering_id);
  return {
    id,
    productId: match ? String(match.id) : id,
    name: offering.name || offering.title || 'Untitled',
    category: offering.category || '',
    price: Number(offering.price) || 0,
    image:
      offering.thumbnail_url ||
      offering.media_url ||
      offering.image ||
      offering.images?.[0] ||
      localProductPhoto(id) ||
      '',
    status: soldOut ? 'soldout' : isDraft ? 'draft' : 'live',
    stock: typeof stock === 'number' ? stock : undefined,
  };
}

const STATUS_LABEL: Record<Status, string> = { live: 'Live', draft: 'Draft', soldout: 'Sold out' };
const STATUS_COLOR: Record<Status, string> = { live: GREEN, draft: ORANGE, soldout: CORAL };

export default function MyProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';

  const [items, setItems] = useState<MyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [filter, setFilter] = useState<'all' | Status>('all');
  const [editingItem, setEditingItem] = useState<MyItem | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkWorking, setIsBulkWorking] = useState(false);

  const tc = {
    background: isDark ? '#000' : '#fff',
    card: isDark ? '#1A1A1A' : '#F5F7F8',
    text: isDark ? '#fff' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    border: isDark ? '#2C2C2E' : '#E3E7EA',
    tile: isDark ? '#12333B' : '#E3F7FA',
  };

  const loadMyItems = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [mine, all] = await Promise.all([
        getMyItems(),
        getProducts().catch(() => null),
        loadLocalProductPhotos(),
      ]);
      const offerings: DiscoveryOffering[] = extractList(mine.data);
      const products: any[] = all ? extractList((all as any).data) : [];
      setItems(offerings.map((o) => toItem(o, products)));
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

  const shown = useMemo(() => (filter === 'all' ? items : items.filter((i) => i.status === filter)), [items, filter]);
  const counts = useMemo(
    () => ({
      all: items.length,
      live: items.filter((i) => i.status === 'live').length,
      draft: items.filter((i) => i.status === 'draft').length,
      soldout: items.filter((i) => i.status === 'soldout').length,
    }),
    [items]
  );

  const handleDelete = (item: MyItem) => {
    Alert.alert('Delete product', `Delete "${item.name}"? This can't be undone.`, [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const previous = items;
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          try {
            await deleteProduct(item.productId);
          } catch (error) {
            console.error('Failed to delete product:', error);
            setItems(previous);
            Alert.alert("Couldn't delete", 'Something went wrong while deleting this product. Please try again.');
          }
        },
      },
    ]);
  };

  const openEdit = (item: MyItem) => {
    setEditingItem(item);
    setEditPrice(String(item.price));
    setEditStock(item.stock !== undefined ? String(item.stock) : '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setIsSavingEdit(true);
    try {
      const payload: { price?: number; stock?: number } = {};
      if (editPrice.trim()) payload.price = Number(editPrice);
      if (editStock.trim()) payload.stock = Number(editStock);
      await updateProduct(editingItem.productId, payload);
      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                price: payload.price ?? i.price,
                stock: payload.stock ?? i.stock,
                status: payload.stock === 0 ? 'soldout' : i.status === 'soldout' ? 'live' : i.status,
              }
            : i
        )
      );
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to update product:', error);
      Alert.alert("Couldn't update", 'Something went wrong while updating this product. Please try again.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleChangePhoto = async () => {
    if (!editingItem) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to pick a picture for this product.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]?.uri) return;
    const uri = result.assets[0].uri;
    await rememberProductPhoto(editingItem.id, uri);
    setItems((prev) => prev.map((i) => (i.id === editingItem.id ? { ...i, image: uri } : i)));
    setEditingItem((prev) => (prev ? { ...prev, image: uri } : prev));
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const selectedProductIds = () => items.filter((i) => selectedIds.includes(i.id)).map((i) => i.productId);

  const handleBulkPublish = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkWorking(true);
    try {
      await bulkUpdateProducts(selectedProductIds(), { status: 'published' });
      await bulkPublishOfferings(selectedIds).catch(() => {});
      Alert.alert('Published', `${selectedIds.length} item(s) published.`);
      setSelectedIds([]);
      setSelectMode(false);
      loadMyItems();
    } catch (error) {
      console.error('Bulk publish failed:', error);
      Alert.alert("Couldn't publish", 'Something went wrong while publishing the selected items.');
    } finally {
      setIsBulkWorking(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    Alert.alert('Delete selected', `Delete ${selectedIds.length} item(s)? This can't be undone.`, [
      { text: 'Keep them', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsBulkWorking(true);
          try {
            await bulkDeleteProducts(selectedProductIds());
            setItems((prev) => prev.filter((i) => !selectedIds.includes(i.id)));
            setSelectedIds([]);
            setSelectMode(false);
          } catch (error) {
            console.error('Bulk delete failed:', error);
            Alert.alert("Couldn't delete", 'Something went wrong while deleting the selected items.');
          } finally {
            setIsBulkWorking(false);
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: MyItem }) => {
    const picked = selectedIds.includes(item.id);
    return (
      <TouchableOpacity
        activeOpacity={selectMode ? 0.7 : 1}
        style={[
          styles.card,
          { backgroundColor: tc.card, borderColor: picked ? Colors.light.primary : 'transparent' },
        ]}
        onPress={() => (selectMode ? toggleSelected(item.id) : openEdit(item))}
      >
        {selectMode ? (
          <Ionicons
            name={picked ? 'checkbox' : 'square-outline'}
            size={24}
            color={picked ? Colors.light.primary : tc.sub}
            style={{ marginRight: 10 }}
          />
        ) : null}

        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty, { backgroundColor: tc.tile }]}>
            <Ionicons name="image" size={30} color={Colors.light.primary} accent={ORANGE} />
          </View>
        )}

        <View style={styles.info}>
          <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.meta, { color: tc.sub }]} numberOfLines={1}>
            {[item.category, item.stock !== undefined ? `${item.stock} in stock` : ''].filter(Boolean).join(' · ') || ' '}
          </Text>
          <View style={styles.footer}>
            <Text style={[styles.price, { color: tc.text }]}>₦{item.price.toLocaleString()}</Text>
            <View style={[styles.chip, { backgroundColor: STATUS_COLOR[item.status] + '22' }]}>
              <View style={[styles.chipDot, { backgroundColor: STATUS_COLOR[item.status] }]} />
              <Text style={[styles.chipText, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
            </View>
          </View>
        </View>

        {!selectMode ? (
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={() => openEdit(item)} accessibilityLabel="Edit">
              <Ionicons name="create" size={22} color={Colors.light.primary} accent={ORANGE} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)} accessibilityLabel="Delete">
              <Ionicons name="trash" size={22} color={CORAL} />
            </TouchableOpacity>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  const FILTERS: { key: 'all' | Status; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'live', label: 'Live' },
    { key: 'draft', label: 'Drafts' },
    { key: 'soldout', label: 'Sold out' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: tc.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={tc.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.title, { color: tc.text }]}>My Products</Text>
          {!isLoading && !hasError ? (
            <Text style={[styles.subtitle, { color: tc.sub }]}>
              {counts.all} listing{counts.all === 1 ? '' : 's'}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity
          onPress={() => {
            setSelectMode((prev) => !prev);
            setSelectedIds([]);
          }}
          style={styles.selectButton}
        >
          <Text style={styles.selectText}>{selectMode ? 'Cancel' : 'Select'}</Text>
        </TouchableOpacity>
      </View>

      {!isLoading && !hasError && items.length > 0 ? (
        <View style={styles.filterRow}>
          {FILTERS.filter((f) => f.key === 'all' || counts[f.key] > 0).map((f) => {
            const active = filter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, { backgroundColor: active ? Colors.light.primary : tc.card }]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.filterText, { color: active ? '#0F1419' : tc.text }]}>
                  {f.label} {counts[f.key]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

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
          data={shown}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="basket-outline"
              title={items.length === 0 ? 'No products listed yet' : 'Nothing here'}
              message={items.length === 0 ? 'List something you make or sell and it will show up here.' : undefined}
            />
          }
        />
      )}

      {/* A standing way to add one */}
      {!selectMode && !isLoading && !hasError ? (
        <View style={[styles.addBar, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.addButton} onPress={() => router.push('/(tabs)/sell' as any)}>
            <Ionicons name="add" size={22} color="#0F1419" />
            <Text style={styles.addText}>List a product</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {selectMode && selectedIds.length > 0 ? (
        <View style={[styles.bulkBar, { backgroundColor: isDark ? '#1C1C1E' : '#fff', borderTopColor: tc.border, paddingBottom: insets.bottom + 12 }]}>
          <Text style={{ color: tc.text, fontWeight: '700', fontSize: 15 }}>{selectedIds.length} selected</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={styles.bulkPublish} onPress={handleBulkPublish} disabled={isBulkWorking}>
              {isBulkWorking ? (
                <ActivityIndicator color="#0F1419" />
              ) : (
                <Text style={styles.bulkPublishText}>Publish</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.bulkDelete} onPress={handleBulkDelete} disabled={isBulkWorking}>
              <Text style={styles.bulkDeleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      {/* Edit price / stock */}
      <Modal visible={!!editingItem} transparent animationType="slide" onRequestClose={() => setEditingItem(null)}>
        <KeyboardAvoidingView
          style={styles.sheetOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setEditingItem(null)} />
          <View style={[styles.sheet, { backgroundColor: isDark ? '#1C1C1E' : '#fff', paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              {editingItem?.image ? (
                <Image source={{ uri: editingItem.image }} style={styles.sheetThumb} />
              ) : (
                <View style={[styles.sheetThumb, styles.thumbEmpty, { backgroundColor: tc.tile }]}>
                  <Ionicons name="image" size={24} color={Colors.light.primary} accent={ORANGE} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.sheetTitle, { color: tc.text }]} numberOfLines={1}>
                  {editingItem?.name}
                </Text>
                <TouchableOpacity onPress={handleChangePhoto} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.changePhoto}>{editingItem?.image ? 'Change photo' : 'Add a photo'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <FloatingLabelInput
              label="Price (₦)"
              value={editPrice}
              onChangeText={setEditPrice}
              keyboardType="numeric"
            />
            <FloatingLabelInput
              label="Stock quantity"
              value={editStock}
              onChangeText={setEditStock}
              keyboardType="numeric"
              placeholder="Leave blank to keep unchanged"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? <ActivityIndicator color="#0F1419" /> : <Text style={styles.saveText}>Save changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditingItem(null)} style={styles.cancelButton}>
              <Text style={{ color: tc.sub, fontSize: 15, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 1 },
  selectButton: { minWidth: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
  selectText: { color: Colors.light.primary, fontWeight: '700', fontSize: 15 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 12 },
  filterChip: { height: 36, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filterText: { fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 12,
    marginBottom: 12,
    borderWidth: 2,
  },
  thumb: { width: 84, height: 84, borderRadius: 14 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: 14 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 2 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  price: { fontSize: 17, fontWeight: '800' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 26, borderRadius: 13 },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, fontWeight: '700' },
  actions: { marginLeft: 6, gap: 4 },
  actionButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  addBar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 10 },
  addButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0F1419',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  addText: { fontSize: 16, fontWeight: '700', color: '#0F1419' },
  bulkBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  bulkPublish: {
    height: 44,
    minWidth: 96,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bulkPublishText: { fontSize: 15, fontWeight: '700', color: '#0F1419' },
  bulkDelete: {
    height: 44,
    borderRadius: 12,
    backgroundColor: CORAL + '22',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  bulkDeleteText: { fontSize: 15, fontWeight: '700', color: CORAL },
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB', alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 20, fontWeight: '700' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 22 },
  sheetThumb: { width: 60, height: 60, borderRadius: 12 },
  changePhoto: { fontSize: 14, fontWeight: '700', color: Colors.light.primary, marginTop: 4 },
  saveButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveText: { fontSize: 16, fontWeight: '700', color: '#0F1419' },
  cancelButton: { alignItems: 'center', marginTop: 8, paddingVertical: 10 },
});
