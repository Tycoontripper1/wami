import OnboardingProgress from '@/components/OnboardingProgress';
import SelectableCard from '@/components/SelectableCard';
import Colors from '@/constants/Colors';
import { setLocationType } from '@/store/onboardingSlice';
import { RootState } from '@/store/store';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function OnboardingLocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const savedLocationType = useSelector((state: RootState) => state.onboarding.locationType);
  const [selectedLocation, setSelectedLocation] = useState<'near_me' | 'specific_city' | 'anywhere' | null>(
    savedLocationType
  );

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
  };

  const handleSkip = () => {
    router.push('./onboarding-notifications' as any);
  };

  const handleNext = () => {
    if (selectedLocation) {
      dispatch(setLocationType(selectedLocation));
    }

    // If specific city selected, go to city search
    if (selectedLocation === 'specific_city') {
      router.push('./onboarding-city-search' as any);
    } else {
      // Otherwise go to notifications
      router.push('./onboarding-notifications' as any);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <OnboardingProgress currentStep={4} totalSteps={7} />
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Where do you want to{'\n'}discover creatives?
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>Choose your preferred location settings</Text>
          </View>

          <View style={styles.optionsContainer}>
            <SelectableCard
              title="Near me"
              subtitle="Show creatives in my area"
              icon="location"
              isSelected={selectedLocation === 'near_me'}
              onPress={() => setSelectedLocation('near_me')}
            />
            <SelectableCard
              title="Specific city"
              subtitle="Choose a specific location"
              icon="navigate"
              isSelected={selectedLocation === 'specific_city'}
              onPress={() => setSelectedLocation('specific_city')}
            />
            <SelectableCard
              title="Anywhere"
              subtitle="Show creatives from all locations"
              icon="globe"
              isSelected={selectedLocation === 'anywhere'}
              onPress={() => setSelectedLocation('anywhere')}
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
            style={[styles.nextButton, { opacity: selectedLocation ? 1 : 0.5 }]}
            disabled={!selectedLocation}
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
