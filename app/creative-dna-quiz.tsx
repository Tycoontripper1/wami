import Colors from '@/constants/Colors';
import { completeQuiz, setPreferences } from '@/store/creativeMatchSlice';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

const QUIZ_STEPS = [
  {
    id: 'aesthetics',
    title: 'What\'s your style vibe?',
    subtitle: 'Select all that appeal to you',
    multiSelect: true,
    options: [
      { id: 'minimal', label: 'Minimal & Clean', icon: '✨' },
      { id: 'bold', label: 'Bold & Dramatic', icon: '🔥' },
      { id: 'vintage', label: 'Vintage & Retro', icon: '📷' },
      { id: 'modern', label: 'Modern & Sleek', icon: '💫' },
      { id: 'artistic', label: 'Artistic & Creative', icon: '🎨' },
      { id: 'natural', label: 'Natural & Organic', icon: '🌿' },
    ],
  },
  {
    id: 'serviceTypes',
    title: 'What services interest you?',
    subtitle: 'Pick your favorites',
    multiSelect: true,
    options: [
      { id: 'photography', label: 'Photography', icon: '📸' },
      { id: 'hair', label: 'Hair Styling', icon: '💇' },
      { id: 'makeup', label: 'Makeup', icon: '💄' },
      { id: 'fashion', label: 'Fashion', icon: '👗' },
      { id: 'beauty', label: 'Beauty & Skincare', icon: '🧴' },
      { id: 'nails', label: 'Nail Art', icon: '💅' },
    ],
  },
  {
    id: 'priceRange',
    title: 'What\'s your budget?',
    subtitle: 'Help us find the perfect match',
    multiSelect: false,
    options: [
      { id: 'budget', label: 'Budget Friendly', icon: '💵', desc: 'Under ₦30,000' },
      { id: 'mid', label: 'Mid Range', icon: '💰', desc: '₦30,000 - ₦80,000' },
      { id: 'premium', label: 'Premium', icon: '💎', desc: '₦80,000 - ₦150,000' },
      { id: 'luxury', label: 'Luxury', icon: '👑', desc: '₦150,000+' },
    ],
  },
  {
    id: 'personality',
    title: 'What vibe are you looking for?',
    subtitle: 'The creative\'s personality',
    multiSelect: true,
    options: [
      { id: 'creative', label: 'Creative & Innovative', icon: '🎭' },
      { id: 'professional', label: 'Professional & Polished', icon: '👔' },
      { id: 'friendly', label: 'Friendly & Approachable', icon: '😊' },
      { id: 'edgy', label: 'Edgy & Bold', icon: '⚡' },
      { id: 'calm', label: 'Calm & Relaxed', icon: '🧘' },
    ],
  },
  {
    id: 'sessionStyle',
    title: 'Your ideal session?',
    subtitle: 'How do you like to work?',
    multiSelect: true,
    options: [
      { id: 'studio', label: 'Studio Setting', icon: '🏠' },
      { id: 'outdoor', label: 'Outdoor & Location', icon: '🌳' },
      { id: 'candid', label: 'Candid & Natural', icon: '📱' },
      { id: 'posed', label: 'Posed & Directed', icon: '🎬' },
    ],
  },
];

export default function CreativeDNAQuizScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({
    aesthetics: [],
    serviceTypes: [],
    priceRange: [],
    personality: [],
    sessionStyle: [],
  });

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#1a1a1a' : '#f5f5f5',
    border: isDark ? '#333' : '#e0e0e0',
  };

  const step = QUIZ_STEPS[currentStep];
  const progress = (currentStep + 1) / QUIZ_STEPS.length;

  const handleOptionSelect = (optionId: string) => {
    setSelections((prev) => {
      const current = prev[step.id] || [];
      if (step.multiSelect) {
        if (current.includes(optionId)) {
          return { ...prev, [step.id]: current.filter((id) => id !== optionId) };
        }
        return { ...prev, [step.id]: [...current, optionId] };
      }
      return { ...prev, [step.id]: [optionId] };
    });
  };

  const handleNext = () => {
    // Save current selections to Redux
    dispatch(setPreferences({
      [step.id]: step.id === 'priceRange' ? selections[step.id][0] : selections[step.id],
    }));

    if (currentStep < QUIZ_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete quiz and calculate matches
      dispatch(completeQuiz());
      router.replace('/(tabs)' as any);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      router.back();
    }
  };

  const canProceed = selections[step.id]?.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: themeColors.cardBg }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${progress * 100}%`, backgroundColor: Colors.light.primary },
              ]}
            />
          </View>
          <Text style={[styles.stepText, { color: themeColors.subText }]}>
            {currentStep + 1} of {QUIZ_STEPS.length}
          </Text>
        </View>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* DNA Icon */}
        <View style={styles.dnaIconContainer}>
          <Text style={styles.dnaIcon}>🧬</Text>
        </View>

        {/* Question */}
        <Text style={[styles.title, { color: themeColors.text }]}>{step.title}</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>{step.subtitle}</Text>

        {/* Options */}
        <View style={styles.optionsGrid}>
          {step.options.map((option) => {
            const isSelected = selections[step.id]?.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isSelected ? Colors.light.primary : themeColors.cardBg,
                    borderColor: isSelected ? Colors.light.primary : themeColors.border,
                  },
                ]}
                onPress={() => handleOptionSelect(option.id)}
              >
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: isSelected ? '#fff' : themeColors.text },
                  ]}
                >
                  {option.label}
                </Text>
                {'desc' in option && (
                  <Text
                    style={[
                      styles.optionDesc,
                      { color: isSelected ? 'rgba(255,255,255,0.8)' : themeColors.subText },
                    ]}
                  >
                    {option.desc}
                  </Text>
                )}
                {isSelected && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !canProceed && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={!canProceed}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === QUIZ_STEPS.length - 1 ? 'Find My Matches' : 'Continue'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  stepText: {
    fontSize: 12,
    marginTop: 6,
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  dnaIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  dnaIcon: {
    fontSize: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  optionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    minHeight: 100,
  },
  optionIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  footer: {
    padding: 20,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
