import BrandInput from '@/components/creative-onboarding/BrandInput';
import OnboardingButtons from '@/components/creative-onboarding/OnboardingButtons';
import OnboardingProgress from '@/components/OnboardingProgress';
import Colors from '@/constants/Colors';
import { instagramService } from '@/services/instagramService';
import { setInstagramProfile, setWebsite } from '@/store/creativeOnboardingSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
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

export default function CreativeInstagramScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const instagram = useSelector((state: RootState) => state.creativeOnboarding.instagram);
  const website = useSelector((state: RootState) => state.creativeOnboarding.website);

  const [instagramUsername, setInstagramUsername] = useState(instagram?.username || '');
  const [websiteUrl, setWebsiteUrl] = useState(website || '');
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    modalBg: isDark ? '#1A1A1A' : '#fff',
  };

  const handleConnect = async () => {
    if (!instagramUsername.trim()) {
      Alert.alert('Error', 'Please enter your Instagram username');
      return;
    }

    setShowConnectModal(true);
  };

  const confirmConnect = async () => {
    setIsConnecting(true);
    try {
      const profile = await instagramService.fetchProfile(instagramUsername);
      dispatch(setInstagramProfile(profile));
      setShowConnectModal(false);
      router.push('./creative-instagram-posts' as any);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to connect Instagram');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleWebsiteChange = (url: string) => {
    setWebsiteUrl(url);
    dispatch(setWebsite(url));
  };

  const handleSkip = () => {
    router.push('./creative-availability' as any);
  };

  const handleNext = () => {
    router.push('./creative-availability' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress currentStep={5} totalSteps={8} />

        <Text style={[styles.title, { color: themeColors.text }]}>Connect your instagram</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          Required to showcase your work
        </Text>

        <View style={styles.formContainer}>
          <BrandInput
            icon="logo-instagram"
            placeholder="Instagram name"
            value={instagramUsername}
            onChangeText={setInstagramUsername}
          />

          <BrandInput
            icon="link-outline"
            placeholder="Website"
            value={websiteUrl}
            onChangeText={handleWebsiteChange}
            optional
          />

          {instagram && (
            <View style={styles.connectedProfile}>
              <Image
                source={{ uri: instagram.profilePicture }}
                style={styles.profileImage}
              />
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: themeColors.text }]}>
                  @{instagram.username}
                </Text>
                <Text style={[styles.profileStats, { color: themeColors.subText }]}>
                  {instagram.postsCount} posts • {instagram.followersCount} followers
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color="#4CD964" />
            </View>
          )}

          {!instagram && instagramUsername.trim() && (
            <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
              <Ionicons name="logo-instagram" size={20} color="#fff" />
              <Text style={styles.connectButtonText}>Connect Instagram</Text>
            </TouchableOpacity>
          )}


        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <OnboardingButtons
          onSkip={handleSkip}
          onNext={handleNext}
        />
      </View>

      {/* Connect Modal */}
      <Modal visible={showConnectModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeColors.modalBg }]}>
            <Ionicons name="logo-instagram" size={40} color="#E4405F" />
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              "Wami" Wants to connect to Instagram
            </Text>
            <Text style={[styles.modalText, { color: themeColors.subText }]}>
              Link your Instagram so people can see your work and trust your profile
            </Text>

            {isConnecting ? (
              <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 20 }} />
            ) : (
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalSkipButton}
                  onPress={() => setShowConnectModal(false)}
                >
                  <Text style={[styles.modalSkipText, { color: Colors.light.primary }]}>Skip</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConnectButton} onPress={confirmConnect}>
                  <Text style={styles.modalConnectText}>Connect</Text>
                </TouchableOpacity>
              </View>
            )}
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
  content: {
    paddingHorizontal: 24,
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 30,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  formContainer: {
    flex: 1,
  },
  connectedProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(0,217,255,0.1)',
    borderRadius: 16,
    marginTop: 16,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileStats: {
    fontSize: 13,
    marginTop: 2,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4405F',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 16,
  },
  modalSkipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  modalSkipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalConnectButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  modalConnectText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

});
