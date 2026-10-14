import FlatIllustration, { IllustrationName } from '@/components/illustrations/FlatIllustration';
import Colors from '@/constants/Colors';
import { Ionicons } from '@/components/FlatIcon';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

// Existing call sites pass an Ionicons name; each maps to a flat illustration
// so they all pick up the friendlier look without being touched.
const ICON_TO_ILLUSTRATION: Partial<Record<string, IllustrationName>> = {
  'location-outline': 'town',
  'cloud-offline-outline': 'offline',
  'alert-circle-outline': 'search',
  'close-circle-outline': 'offline',
  'basket-outline': 'bag',
  'bag-outline': 'bag',
  'notifications-outline': 'bell',
  'time-outline': 'calendar',
  'calendar-outline': 'calendar',
  'chatbubbles-outline': 'chat',
  'chatbubble-outline': 'chat',
  'heart-outline': 'heart',
  'checkmark-circle-outline': 'check',
};

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  /** Overrides the illustration chosen from `icon`. */
  illustration?: IllustrationName;
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function EmptyState({
  icon = 'cloud-offline-outline',
  illustration,
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tc = {
    text: isDark ? '#fff' : '#0F1419',
    subText: isDark ? '#999' : '#666',
  };
  const scene: IllustrationName = illustration ?? ICON_TO_ILLUSTRATION[icon] ?? 'offline';

  return (
    <View style={styles.container}>
      <View style={styles.art}>
        <FlatIllustration name={scene} width={200} soft animated />
      </View>
      <Text style={[styles.title, { color: tc.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: tc.subText }]}>{message}</Text>}
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={16} color="#0F1419" />
          <Text style={styles.retryButtonText}>{retryLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  art: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 9,
    borderRadius: 10,
  },
  retryButtonText: {
    color: '#0F1419',
    fontSize: 14,
    fontWeight: '600',
  },
});
