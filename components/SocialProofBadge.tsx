import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SocialProofBadgeProps {
  type: 'views' | 'booked' | 'trending' | 'popular';
  count?: number;
}

export default function SocialProofBadge({ type, count }: SocialProofBadgeProps) {
  const getContent = () => {
    switch (type) {
      case 'views':
        return {
          icon: 'eye-outline',
          text: `${count || Math.floor(Math.random() * 50) + 10} people viewed today`,
          color: '#FF9500',
          bgColor: 'rgba(255, 149, 0, 0.15)',
        };
      case 'booked':
        return {
          icon: 'checkmark-circle',
          text: 'Just booked!',
          color: '#4CD964',
          bgColor: 'rgba(76, 217, 100, 0.15)',
        };
      case 'trending':
        return {
          icon: 'trending-up',
          text: 'Trending',
          color: Colors.light.primary,
          bgColor: 'rgba(0, 188, 212, 0.15)',
        };
      case 'popular':
        return {
          icon: 'flame',
          text: 'Popular this week',
          color: '#FF3B30',
          bgColor: 'rgba(255, 59, 48, 0.15)',
        };
      default:
        return null;
    }
  };

  const content = getContent();
  if (!content) return null;

  return (
    <View style={[styles.badge, { backgroundColor: content.bgColor }]}>
      <Ionicons name={content.icon as any} size={12} color={content.color} />
      <Text style={[styles.text, { color: content.color }]}>{content.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
