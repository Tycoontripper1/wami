import OnboardingButtons from '@/components/creative-onboarding/OnboardingButtons';
import OptionCard from '@/components/creative-onboarding/OptionCard';
import OnboardingProgress from '@/components/OnboardingProgress';
import { setDiscoverLocation } from '@/store/creativeOnboardingSlice';
import { RootState } from '@/store/store';
import { DISCOVER_LOCATION_OPTIONS, DiscoverLocationType } from '@/types/creativeOnboarding';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function CreativeDiscoverLocationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const selectedLocation = useSelector(
    (state: RootState) => state.creativeOnboarding.discoverLocation
  );

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
  };

  const handleSelect = (type: DiscoverLocationType) => {
    dispatch(setDiscoverLocation(type));
  };

  const handleSkip = () => {
    router.push('./creative-brand' as any);
  };

  const handleNext = () => {
    router.push('./creative-brand' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress currentStep={3} totalSteps={8} />

        <Text style={[styles.title, { color: themeColors.text }]}>
          Where do you want to discover creatives?
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          Choose your preferred location settings
        </Text>

        <View style={styles.optionsContainer}>
          {DISCOVER_LOCATION_OPTIONS.map((option) => (
            <OptionCard
              key={option.id}
              title={option.title}
              description={option.description}
              isSelected={selectedLocation === option.id}
              onPress={() => handleSelect(option.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <OnboardingButtons
          onSkip={handleSkip}
          onNext={handleNext}
          nextDisabled={!selectedLocation}
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
