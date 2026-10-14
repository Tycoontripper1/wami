import BrandInput from '@/components/creative-onboarding/BrandInput';
import OnboardingButtons from '@/components/creative-onboarding/OnboardingButtons';
import InstagramConnectCard from '@/components/InstagramConnectCard';
import OnboardingProgress from '@/components/OnboardingProgress';
import { setInstagramProfile, setWebsite } from '@/store/creativeOnboardingSlice';
import { RootState } from '@/store/store';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, View, useColorScheme } from 'react-native';
import { Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

/**
 * Creative onboarding: connect Instagram (the backend's real OAuth flow) and
 * optionally add a website. Reached only when INSTAGRAM_IMPORT_ENABLED.
 */
export default function CreativeInstagramScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const isDark = useColorScheme() === 'dark';

  const website = useSelector((state: RootState) => state.creativeOnboarding.website);
  const [websiteUrl, setWebsiteUrl] = useState(website || '');

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    subText: isDark ? '#ccc' : '#666',
  };

  const handleWebsiteChange = (url: string) => {
    setWebsiteUrl(url);
    dispatch(setWebsite(url));
  };

  // Keep the connected handle so account setup sends the real @username.
  const handleConnected = (username?: string) => {
    if (username) dispatch(setInstagramProfile({ username }));
  };

  const goNext = () => router.push('./creative-availability' as any);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress currentStep={5} totalSteps={8} />

        <Text style={[styles.title, { color: themeColors.text }]}>Connect your Instagram</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          Show your work without retyping it. You can skip this and add listings by hand.
        </Text>

        <View style={styles.form}>
          <InstagramConnectCard onConnected={handleConnected} />

          <BrandInput
            icon="link-outline"
            placeholder="Website"
            value={websiteUrl}
            onChangeText={handleWebsiteChange}
            optional
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <OnboardingButtons onSkip={goNext} onNext={goNext} />
      </View>
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
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  footer: {
    paddingHorizontal: 24,
  },
});
