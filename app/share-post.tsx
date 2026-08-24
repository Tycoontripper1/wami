import Colors from '@/constants/Colors';
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
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SharePostScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    border: isDark ? '#333' : '#e0e0e0',
    inputBg: isDark ? '#1a1a1a' : '#f9f9f9',
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'We need camera roll permissions to pick a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = () => {
    if (!imageUri) {
      Alert.alert('Add a Photo', 'Please select a photo to share.');
      return;
    }
    setIsPosting(true);
    setTimeout(() => {
      setIsPosting(false);
      Alert.alert('Posted!', 'Your post has been shared.', [{ text: 'OK', onPress: () => router.back() }]);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Share a Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.imagePicker, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}
          onPress={handlePickImage}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={40} color={themeColors.subText} />
              <Text style={[styles.imagePlaceholderText, { color: themeColors.subText }]}>Tap to add a photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <TextInput
          style={[styles.captionInput, { color: themeColors.text, backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}
          placeholder="Write a caption..."
          placeholderTextColor={themeColors.subText}
          value={caption}
          onChangeText={setCaption}
          multiline
        />

        <TouchableOpacity
          style={[styles.postButton, isPosting && { opacity: 0.7 }]}
          onPress={handlePost}
          disabled={isPosting}
        >
          {isPosting ? <ActivityIndicator color="#fff" /> : <Text style={styles.postButtonText}>Post</Text>}
        </TouchableOpacity>
      </View>
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
  content: { padding: 24, gap: 16 },
  imagePicker: {
    width: '100%', aspectRatio: 1, borderRadius: 16, borderWidth: 1,
    overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { alignItems: 'center', gap: 8 },
  imagePlaceholderText: { fontSize: 14 },
  captionInput: {
    minHeight: 90, borderRadius: 12, borderWidth: 1, padding: 14,
    fontSize: 15, textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: Colors.light.primary, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  postButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
