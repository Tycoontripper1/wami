import OnboardingProgress from '@/components/OnboardingProgress';
import SelectableCard from '@/components/SelectableCard';
import Colors from '@/constants/Colors';
import { setPurpose } from '@/store/onboardingSlice';
import { RootState } from '@/store/store';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function OnboardingPurposeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const savedPurpose = useSelector((state: RootState) => state.onboarding.purpose);
  const [selectedPurpose, setSelectedPurpose] = useState<'discover' | 'promote' | 'both' | null>(savedPurpose);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
  };

  const handleSkip = () => {
    router.push('./onboarding-interests' as any);
  };

  const handleNext = () => {
    if (selectedPurpose) {
      dispatch(setPurpose(selectedPurpose));
    }
    // Route to creative onboarding if user wants to promote
    if (selectedPurpose === 'promote' || selectedPurpose === 'both') {
      router.push('./creative-categories' as any);
    } else {
      router.push('./onboarding-interests' as any);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <OnboardingProgress currentStep={2} totalSteps={7} />
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: themeColors.text }]}>What are you using{'\n'}Wami for?</Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>
              This helps us personalise your experience
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            <SelectableCard
              title="Discover creatives"
              subtitle="Find and connect with creatives nearby"
              icon="search"
              isSelected={selectedPurpose === 'discover'}
              onPress={() => setSelectedPurpose('discover')}
            />
            <SelectableCard
              title="Promote my work"
              subtitle="Showcase my services/products"
              icon="megaphone"
              isSelected={selectedPurpose === 'promote'}
              onPress={() => setSelectedPurpose('promote')}
            />
            <SelectableCard
              title="Both"
              subtitle="I need to do both"
              icon="apps"
              isSelected={selectedPurpose === 'both'}
              onPress={() => setSelectedPurpose('both')}
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: themeColors.subText }]}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, { opacity: selectedPurpose ? 1 : 0.5 }]}
            disabled={!selectedPurpose}
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
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 0,
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
