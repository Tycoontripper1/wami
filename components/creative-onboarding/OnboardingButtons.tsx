import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface OnboardingButtonsProps {
  onSkip?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  showSkip?: boolean;
}

export default function OnboardingButtons({
  onSkip,
  onNext,
  nextDisabled = false,
  nextLabel = 'Next',
  showSkip = true,
}: OnboardingButtonsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    skipBorder: isDark ? '#333' : '#E0E0E0',
    skipText: isDark ? '#fff' : '#000',
  };

  return (
    <View style={styles.container}>
      {showSkip && onSkip && (
        <TouchableOpacity
          style={[styles.skipButton, { borderColor: themeColors.skipBorder }]}
          onPress={onSkip}
        >
          <Text style={[styles.skipText, { color: themeColors.skipText }]}>Skip</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[
          styles.nextButton,
          nextDisabled && styles.nextButtonDisabled,
          !showSkip && styles.nextButtonFull,
        ]}
        onPress={onNext}
        disabled={nextDisabled}
      >
        <Text style={styles.nextText}>{nextLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
  nextButtonFull: {
    flex: 2,
  },
  nextButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
