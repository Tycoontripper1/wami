import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

export default function PhotoUploadRequirements() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    cardBg: isDark ? '#1a1a1a' : '#f9f9f9',
    text: isDark ? '#fff' : '#333',
    subText: isDark ? '#999' : '#666',
    border: isDark ? '#333' : '#eee',
  };

  const requirements = [
    { icon: 'sunny-outline', text: 'Use natural lighting' },
    { icon: 'scan-outline', text: 'Keep the product in focus' },
    { icon: 'color-palette-outline', text: 'Use a clean, neutral background' },
    { icon: 'images-outline', text: 'Show multiple angles' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: themeColors.cardBg, borderColor: themeColors.border }]}>
      <View style={styles.header}>
        <Ionicons name="information-circle-outline" size={20} color={Colors.light.primary} />
        <Text style={[styles.title, { color: themeColors.text }]}>Photo Requirements</Text>
      </View>
      <Text style={[styles.subtitle, { color: themeColors.subText }]}>
        Follow these tips to make your product stand out and attract more buyers.
      </Text>
      
      <View style={styles.grid}>
        {requirements.map((req, index) => (
          <View key={index} style={styles.requirementItem}>
            <Ionicons name={req.icon as any} size={18} color={Colors.light.primary} />
            <Text style={[styles.requirementText, { color: themeColors.text }]}>{req.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '48%',
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '500',
  },
});
