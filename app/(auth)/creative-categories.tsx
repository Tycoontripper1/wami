import CategorySelector from '@/components/creative-onboarding/CategorySelector';
import OnboardingButtons from '@/components/creative-onboarding/OnboardingButtons';
import OnboardingProgress from '@/components/OnboardingProgress';
import { toggleCategory } from '@/store/creativeOnboardingSlice';
import { RootState } from '@/store/store';
import { CreativeCategory } from '@/types/creativeOnboarding';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function CreativeCategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const selectedCategories = useSelector(
    (state: RootState) => state.creativeOnboarding.categories
  );

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
  };

  const handleToggle = (category: CreativeCategory) => {
    dispatch(toggleCategory(category));
  };

  const handleSkip = () => {
    router.push('./creative-offerings' as any);
  };

  const handleNext = () => {
    router.push('./creative-offerings' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress currentStep={1} totalSteps={8} />

        <Text style={[styles.title, { color: themeColors.text }]}>What do you offer?</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          Select all categories that apply
        </Text>

        <View style={styles.categoriesContainer}>
          <CategorySelector selected={selectedCategories} onToggle={handleToggle} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <OnboardingButtons
          onSkip={handleSkip}
          onNext={handleNext}
          nextDisabled={selectedCategories.length === 0}
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
  categoriesContainer: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
