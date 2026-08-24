import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import PhotoUploadRequirements from '@/components/sell/PhotoUploadRequirements';
import Colors from '@/constants/Colors';
import { createProduct } from '@/services/api/productsService';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SellScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [stock, setStock] = useState('1');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isListing, setIsListing] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#1a1a1a' : '#f5f5f5',
    border: isDark ? '#333' : '#e0e0e0',
    inputBg: isDark ? '#1a1a1a' : '#f9f9f9',
  };

  const handleUploadPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    if (photos.length >= 5) {
      Alert.alert('Limit Reached', 'You can only upload up to 5 photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const handleListProduct = async () => {
    if (!productName || !price || !description) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    // Note: image upload isn't wired up to the backend yet — photos are
    // collected locally but not sent with the create-product request.
    setIsListing(true);
    try {
      await createProduct({
        title: productName,
        description,
        price: Number(price),
        currency: 'NGN',
        category: category || 'Other',
        stock: Number(stock) || 1,
        status: 'published',
      });
      Alert.alert('Success', 'Your product has been listed!', [
        { text: 'View My Products', onPress: () => router.push('/my-products') },
        { text: 'OK', style: 'cancel' },
      ]);
      setProductName('');
      setDescription('');
      setPrice('');
      setCategory('');
      setDeliveryFee('');
      setStock('1');
      setPhotos([]);
    } catch (error) {
      console.error('Failed to list product:', error);
      Alert.alert('Couldn\'t List Product', 'Something went wrong while listing your product. Please try again.');
    } finally {
      setIsListing(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={[styles.title, { color: themeColors.text }]}>Sell Product</Text>
        <TouchableOpacity onPress={handleListProduct} style={[styles.listButton, isListing && { opacity: 0.7 }]} disabled={isListing}>
          {isListing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.listButtonText}>List Now</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Photo Upload Section */}
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Product Photos</Text>
        <Text style={[styles.sectionSubtitle, { color: themeColors.subText }]}>
          Upload up to 5 high-quality photos of your product.
        </Text>

        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={index} style={[styles.photoPlaceholder, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
              <Image source={{ uri: photo }} style={styles.photoImage} />
              <TouchableOpacity 
                style={styles.removePhoto} 
                onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
              >
                <Ionicons name="close-circle" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 5 && (
            <TouchableOpacity 
              style={[styles.uploadButton, { backgroundColor: themeColors.cardBg, borderColor: Colors.light.primary }]} 
              onPress={handleUploadPhoto}
            >
              <Ionicons name="camera-outline" size={32} color={Colors.light.primary} />
              <Text style={[styles.uploadText, { color: Colors.light.primary }]}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Photo Requirements Component */}
        <PhotoUploadRequirements />

        {/* Product Details Form */}
        <View style={styles.form}>
          <FloatingLabelInput
            label="Product Name *"
            value={productName}
            onChangeText={setProductName}
            placeholder="e.g. Handmade Ceramic Vase"
          />

          <FloatingLabelInput
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="e.g. Home Decor"
          />

          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <FloatingLabelInput
                label="Price (₦) *"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0.00"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <FloatingLabelInput
                label="Delivery Fee (₦)"
                value={deliveryFee}
                onChangeText={setDeliveryFee}
                keyboardType="numeric"
                placeholder="0.00"
              />
            </View>
          </View>

          <FloatingLabelInput
            label="Stock Quantity"
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
            placeholder="1"
          />

          <FloatingLabelInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="Tell buyers more about your product..."
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  listButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  listButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 10,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  uploadButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  form: {
    marginTop: 10,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
  },
});
