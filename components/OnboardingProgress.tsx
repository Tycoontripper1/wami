import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function OnboardingProgress({ currentStep, totalSteps }: OnboardingProgressProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const progress = currentStep / totalSteps;

  return (
    <View style={styles.container}>
      <View style={[styles.progressBarBackground, { backgroundColor: isDark ? '#333' : '#E0E0E0' }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${progress * 100}%`,
              backgroundColor: Colors.light.primary,
            },
          ]}
        />
      </View>
      <Text style={[styles.stepText, { color: isDark ? '#ccc' : '#666' }]}>
        {currentStep} of {totalSteps}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 50,
  },
});
