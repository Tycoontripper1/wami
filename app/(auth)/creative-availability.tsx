import MultiSelectCard from '@/components/creative-onboarding/MultiSelectCard';
import OnboardingButtons from '@/components/creative-onboarding/OnboardingButtons';
import OnboardingProgress from '@/components/OnboardingProgress';
import { toggleAvailability } from '@/store/creativeOnboardingSlice';
import { RootState } from '@/store/store';
import { AVAILABILITY_OPTIONS, AvailabilityOption } from '@/types/creativeOnboarding';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function CreativeAvailabilityScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const selectedAvailability = useSelector(
    (state: RootState) => state.creativeOnboarding.availability
  );

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
  };

  const handleToggle = (option: AvailabilityOption) => {
    dispatch(toggleAvailability(option));
  };

  const handleSkip = () => {
    router.push('./creative-visibility' as any);
  };

  const handleNext = () => {
    router.push('./creative-visibility' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress currentStep={6} totalSteps={8} />

        <Text style={[styles.title, { color: themeColors.text }]}>How are you available</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          Select all that apply
        </Text>

        <View style={styles.optionsContainer}>
          {AVAILABILITY_OPTIONS.map((option) => (
            <MultiSelectCard
              key={option.id}
              title={option.title}
              description={option.description}
              isSelected={selectedAvailability.includes(option.id)}
              onPress={() => handleToggle(option.id)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <OnboardingButtons
          onSkip={handleSkip}
          onNext={handleNext}
          nextDisabled={selectedAvailability.length === 0}
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
