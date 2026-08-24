import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export default function EmptyState({
  icon = 'cloud-offline-outline',
  title,
  message,
  onRetry,
  retryLabel = 'Try Again',
}: EmptyStateProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const tc = {
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    iconBg: isDark ? '#1A1A1A' : '#F5F5F5',
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: tc.iconBg }]}>
        <Ionicons name={icon} size={48} color={tc.subText} />
      </View>
      <Text style={[styles.title, { color: tc.text }]}>{title}</Text>
      {message && <Text style={[styles.message, { color: tc.subText }]}>{message}</Text>}
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <Ionicons name="refresh" size={16} color="#fff" />
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
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
