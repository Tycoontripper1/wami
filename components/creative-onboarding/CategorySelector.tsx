import Colors from '@/constants/Colors';
import { CREATIVE_CATEGORIES, CreativeCategory } from '@/types/creativeOnboarding';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface CategorySelectorProps {
  selected: CreativeCategory[];
  onToggle: (category: CreativeCategory) => void;
}

export default function CategorySelector({ selected, onToggle }: CategorySelectorProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    pillBg: isDark ? '#1A1A1A' : '#F5F5F5',
    pillBorder: isDark ? '#333' : '#E0E0E0',
    text: isDark ? '#fff' : '#000',
  };

  return (
    <View style={styles.container}>
      {CREATIVE_CATEGORIES.map((category) => {
        const isSelected = selected.includes(category);
        return (
          <TouchableOpacity
            key={category}
            style={[
              styles.pill,
              {
                backgroundColor: isSelected ? Colors.light.primary : themeColors.pillBg,
                borderColor: isSelected ? Colors.light.primary : themeColors.pillBorder,
              },
            ]}
            onPress={() => onToggle(category)}
          >
            <Text
              style={[
                styles.pillText,
                { color: isSelected ? '#fff' : themeColors.text },
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
