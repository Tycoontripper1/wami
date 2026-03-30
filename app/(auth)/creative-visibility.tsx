import OnboardingButtons from '@/components/creative-onboarding/OnboardingButtons';
import OptionCard from '@/components/creative-onboarding/OptionCard';
import OnboardingProgress from '@/components/OnboardingProgress';
import { setVisibility } from '@/store/creativeOnboardingSlice';
import { RootState } from '@/store/store';
import { ProfileVisibility } from '@/types/creativeOnboarding';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const VISIBILITY_OPTIONS: { id: ProfileVisibility; title: string; description: string; icon: 'globe-outline' | 'lock-closed-outline' }[] = [
  { id: 'public', title: 'Public', description: 'Anyone can discover your profile', icon: 'globe-outline' },
  { id: 'private', title: 'Private', description: 'Only people with your link can see', icon: 'lock-closed-outline' },
];

export default function CreativeVisibilityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const selectedVisibility = useSelector(
    (state: RootState) => state.creativeOnboarding.visibility
  );

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
  };

  const handleSelect = (visibility: ProfileVisibility) => {
    dispatch(setVisibility(visibility));
  };

  const handleSkip = () => {
    router.push('./creative-complete' as any);
  };

  const handleNext = () => {
    router.push('./creative-complete' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress currentStep={7} totalSteps={8} />

        <Text style={[styles.title, { color: themeColors.text }]}>Profile Visibility</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          Choose who can see your profile
        </Text>

        <View style={styles.optionsContainer}>
          {VISIBILITY_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              title={option.title}
              description={option.description}
              icon={option.icon}
              isSelected={selectedVisibility === option.id}
              onPress={() => handleSelect(option.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <OnboardingButtons
          onSkip={handleSkip}
          onNext={handleNext}
        />
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
    fontSize: 16,
    marginBottom: 30,
  },
  optionsContainer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
