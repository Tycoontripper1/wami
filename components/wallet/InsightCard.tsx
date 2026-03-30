import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

interface InsightCardProps {
  title: string;
  amount: number;
  formatPrice: (amount: number) => string;
  percentage?: number;
  type: 'income' | 'expense' | 'savings';
}

export default function InsightCard({
  title,
  amount,
  formatPrice,
  percentage,
  type,
}: InsightCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getGradient = () => {
    switch (type) {
      case 'income':
        return ['#4CAF50', '#66BB6A'];
      case 'expense':
        return ['#FF5252', '#FF7961'];
      case 'savings':
        return ['#2196F3', '#42A5F5'];
      default:
        return ['#00BCD4', '#00E5FF'];
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'income':
        return 'trending-up';
      case 'expense':
        return 'trending-down';
      case 'savings':
        return 'wallet';
      default:
        return 'stats-chart';
    }
  };

  const themeColors = {
    cardBg: isDark ? '#1A1A1A' : '#F8F9FA',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
  };

  const isPositive = percentage && percentage > 0;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.cardBg }]}>
      <View style={styles.header}>
        <LinearGradient
          colors={getGradient()}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name={getIcon() as any} size={20} color="#fff" />
        </LinearGradient>
        <Text style={[styles.title, { color: themeColors.subText }]}>{title}</Text>
      </View>

      <Text style={[styles.amount, { color: themeColors.text }]}>
        {formatPrice(amount)}
      </Text>

      {percentage !== undefined && (
        <View style={styles.percentageContainer}>
          <Ionicons
            name={isPositive ? 'arrow-up' : 'arrow-down'}
            size={14}
            color={isPositive ? '#4CAF50' : '#FF5252'}
          />
          <Text
            style={[
              styles.percentageText,
              { color: isPositive ? '#4CAF50' : '#FF5252' },
            ]}
          >
            {Math.abs(percentage)}% vs last month
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  amount: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
