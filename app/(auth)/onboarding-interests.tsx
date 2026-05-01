import OnboardingProgress from '@/components/OnboardingProgress';
import PillButton from '@/components/PillButton';
import Colors from '@/constants/Colors';
import { toggleInterest } from '@/store/onboardingSlice';
import { RootState } from '@/store/store';
import { INTEREST_OPTIONS } from '@/types/onboarding';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function OnboardingInterestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const selectedInterests = useSelector((state: RootState) => state.onboarding.interests);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
  };

  const handleToggleInterest = (interest: string) => {
    dispatch(toggleInterest(interest));
  };

  const handleSkip = () => {
    router.replace('./sign-in' as any);
  };

  const handleNext = () => {
    router.push('./onboarding-location' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <OnboardingProgress currentStep={3} totalSteps={7} />
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: themeColors.text }]}>What interests you?</Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>
              Select the categories you'd like to explore
            </Text>
          </View>

          <View style={styles.interestsContainer}>
            {INTEREST_OPTIONS.map((interest) => (
              <PillButton
                key={interest}
                label={interest}
                isSelected={selectedInterests.includes(interest)}
                onPress={() => handleToggleInterest(interest)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: themeColors.subText }]}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, { opacity: selectedInterests.length > 0 ? 1 : 0.5 }]}
            disabled={selectedInterests.length === 0}
          >
            <Text style={styles.nextText}>Next</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
