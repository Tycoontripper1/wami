import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface SelectableCardProps {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  isSelected: boolean;
  onPress: () => void;
}

export default function SelectableCard({ title, subtitle, icon, isSelected, onPress }: SelectableCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    background: isDark ? '#1A1A1A' : '#F5F5F5',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    border: isSelected ? Colors.light.primary : (isDark ? '#333' : '#E0E0E0'),
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: themeColors.background,
          borderColor: themeColors.border,
          borderWidth: isSelected ? 2 : 1,
        },
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color={isSelected ? Colors.light.primary : themeColors.subText} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>{subtitle}</Text>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color={Colors.light.primary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 217, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
