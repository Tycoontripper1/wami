import WamiLoader from '@/components/WamiLoader';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import Colors from '@/constants/Colors';
import { uploadImages } from '@/services/api/mediaService';
import { createOffering } from '@/services/api/offeringsService';
import { CREATIVE_ONLY_RESTRICTION_MESSAGE, isCreativeOnlyRestriction } from '@/utils/apiErrors';
import { Ionicons } from '@/components/FlatIcon';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Alert } from '@/components/AppAlert';
import { Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AddServiceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    subText: isDark ? '#999' : '#666',
    border: isDark ? '#333' : '#e0e0e0',
  };

  const pickPhoto = async () => {
    if (photos.length >= 5) {
      Alert.alert('Limit reached', 'You can add up to 5 photos.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add pictures of your work.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]?.uri) setPhotos((prev) => [...prev, result.assets[0].uri]);
  };

  const handleSave = async () => {
    if (!serviceName || !description || !startingPrice) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    setIsSaving(true);
    try {
      let mediaIds: string[] = [];
      try {
        mediaIds = await uploadImages(photos);
      } catch (error: any) {
        console.error('Photo upload failed:', error);
        Alert.alert("Couldn't upload your photos", error?.message ?? 'Check your connection and try again.');
        return;
      }
      await createOffering({
        title: serviceName,
        description,
        price: Number(startingPrice),
        currency: 'NGN',
        type: 'service',
        media_ids: mediaIds.length > 0 ? mediaIds : undefined,
      });
      Alert.alert('Service Added', 'Your service has been listed successfully.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Failed to list service:', error);
      if (isCreativeOnlyRestriction(error)) {
        Alert.alert("Almost There", CREATIVE_ONLY_RESTRICTION_MESSAGE);
      } else {
        Alert.alert("Couldn't List Service", 'Something went wrong while listing your service. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <WamiLoader visible={!!isSaving} message="Listing your service…" variant="light" />

      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Add a Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.photosLabel, { color: themeColors.text }]}>Photos of your work</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
          {photos.map((uri, i) => (
            <View key={uri + i} style={styles.photoWrap}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity
                style={styles.photoRemove}
                onPress={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                accessibilityLabel="Remove photo"
              >
                <Ionicons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 5 && (
            <TouchableOpacity style={[styles.photoAdd, { borderColor: themeColors.border }]} onPress={pickPhoto}>
              <Ionicons name="camera" size={26} color={Colors.light.primary} accent="#FFA000" />
              <Text style={{ color: themeColors.subText, fontSize: 12, fontWeight: '600', marginTop: 4 }}>Add photo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        <FloatingLabelInput
          label="Service name *"
          placeholder="e.g. Wedding Photography"
          value={serviceName}
          onChangeText={setServiceName}
        />
        <FloatingLabelInput
          label="Description *"
          placeholder="Describe what's included in this service"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          containerStyle={{ marginBottom: 20 }}
        />
        <FloatingLabelInput
          label="Starting price (₦) *"
          placeholder="e.g. 25000"
          value={startingPrice}
          onChangeText={setStartingPrice}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="#0F1419" /> : <Text style={styles.saveButtonText}>List Service</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1,
  },
  closeBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { padding: 24, paddingBottom: 60 },
  photosLabel: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  photosRow: { gap: 10, paddingBottom: 20 },
  photoWrap: { width: 96, height: 96 },
  photo: { width: 96, height: 96, borderRadius: 12 },
  photoRemove: {
    position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  photoAdd: {
    width: 96, height: 96, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  saveButton: {
    backgroundColor: Colors.light.primary, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 12,
  },
  saveButtonText: { color: '#0F1419', fontSize: 16, fontWeight: '700' },
});
