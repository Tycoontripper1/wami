import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import Colors from '@/constants/Colors';
import { profileService } from '@/services/api/profileService';
import { RootState } from '@/store/store';
import { UpdateProfileRequest } from '@/types/accountTypes';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '@/store/authSlice';

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const user = useSelector((state: RootState) => state.auth.user);

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [website, setWebsite] = useState(user?.website || '');
  const [instagramHandle, setInstagramHandle] = useState(user?.instagram_handle || user?.username || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      const updateData: UpdateProfileRequest = {
        first_name: firstName,
        last_name: lastName,
        bio,
        website,
        instagram_handle: instagramHandle,
        // Categories and location are complex to manage in a simple form, 
        // usually would have specific pickers. Leaving them as optional for now.
      };

      await profileService.updateProfile(updateData);
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0].uri) {
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      setIsUploadingImage(true);
      const response = await profileService.uploadProfileImage(uri);
      if (response.success && response.data) {
        // Fetch full profile to ensure all data is synced
        const profileRes = await profileService.getProfile();
        if (profileRes.success && profileRes.data) {
          dispatch(updateUser(profileRes.data));
        } else {
          // Fallback: just update the image URL
          dispatch(updateUser({ 
            profile_image: response.data.profile_image 
          }));
        }
        Alert.alert('Success', 'Profile image updated successfully');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteImage = async () => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove your profile photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsUploadingImage(true);
              await profileService.deleteProfileImage();
              Alert.alert('Success', 'Profile image removed');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove image');
            } finally {
              setIsUploadingImage(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, borderBottomColor: themeColors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>Edit Profile</Text>
        <TouchableOpacity 
          onPress={handleUpdateProfile} 
          disabled={isUpdating}
          style={styles.saveButton}
        >
          {isUpdating ? (
            <ActivityIndicator size="small" color={Colors.light.primary} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {(user?.profile_image || user?.avatar) ? (
              <Image source={{ uri: user?.profile_image || user?.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={50} color={themeColors.subText} />
              </View>
            )}
            {isUploadingImage && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </View>
          <View style={styles.avatarButtons}>
            <TouchableOpacity style={styles.changePhotoButton} onPress={handlePickImage}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
            {user?.avatar && (
              <TouchableOpacity style={styles.removePhotoButton} onPress={handleDeleteImage}>
                <Text style={styles.removePhotoText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <FloatingLabelInput
            label="First Name"
            value={firstName}
            onChangeText={setFirstName}
            placeholder="John"
          />
          <FloatingLabelInput
            label="Last Name"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Doe"
          />
          <FloatingLabelInput
            label="Instagram Username"
            value={instagramHandle}
            onChangeText={setInstagramHandle}
            placeholder="@username"
          />
          <FloatingLabelInput
            label="Website"
            value={website}
            onChangeText={setWebsite}
            placeholder="https://yourwebsite.com"
            keyboardType="url"
          />
          <FloatingLabelInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
            style={styles.bioInput}
          />
        </View>

        {/* Account Settings Links */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Security & Account</Text>
          
          <TouchableOpacity 
            style={[styles.settingsItem, { backgroundColor: themeColors.cardBg }]}
            onPress={() => router.push('/change-password')}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="lock-closed-outline" size={22} color={themeColors.subText} />
              <Text style={[styles.settingsLabel, { color: themeColors.text }]}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.subText} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingsItem, { backgroundColor: themeColors.cardBg }]}
            onPress={() => router.push('/account-actions')}
          >
            <View style={styles.settingsItemLeft}>
              <Ionicons name="shield-outline" size={22} color="#FF3B30" />
              <Text style={[styles.settingsLabel, { color: "#FF3B30" }]}>Account Actions</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeColors.subText} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveText: {
    color: Colors.light.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  changePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
  },
  changePhotoText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  removePhotoButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  removePhotoText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 14,
  },
  form: {
    marginBottom: 30,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  settingsSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
});
