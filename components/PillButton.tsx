import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';

interface PillButtonProps {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export default function PillButton({ label, isSelected, onPress }: PillButtonProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    background: isSelected ? Colors.light.primary : (isDark ? '#1A1A1A' : '#F5F5F5'),
    text: isSelected ? '#fff' : (isDark ? '#fff' : '#000'),
    border: isSelected ? Colors.light.primary : (isDark ? '#333' : '#E0E0E0'),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.pill,
        {
          backgroundColor: themeColors.background,
          borderColor: themeColors.border,
        },
      ]}
    >
      <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
});
