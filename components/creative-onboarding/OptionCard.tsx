import Colors from '@/constants/Colors';
import { Ionicons } from '@/components/FlatIcon';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Text } from '@/components/AppText';

interface OptionCardProps {
  title: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function OptionCard({ title, description, isSelected, onPress, icon }: OptionCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    cardBg: isDark ? '#1A1A1A' : '#fff',
    border: isDark ? '#333' : '#E0E0E0',
    text: isDark ? '#fff' : '#0F1419',
    subText: isDark ? '#999' : '#666',
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isSelected ? Colors.light.primary : themeColors.cardBg,
          borderColor: isSelected ? Colors.light.primary : themeColors.border,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.content}>
        {icon && (
          <Ionicons
            name={icon}
            size={24}
            color={isSelected ? '#0F1419' : Colors.light.primary}
            style={styles.icon}
          />
        )}
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: isSelected ? '#0F1419' : themeColors.text }]}>
            {title}
          </Text>
          <Text style={[styles.description, { color: isSelected ? 'rgba(15,20,25,0.75)' : themeColors.subText }]}>
            {description}
          </Text>
        </View>
      </View>
      {isSelected && (
        <Ionicons name="checkmark-circle" size={24} color="#fff" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
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
  description: {
    fontSize: 13,
  },
});
