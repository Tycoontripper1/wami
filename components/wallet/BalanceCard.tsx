import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface BalanceCardProps {
  balance: number;
  currency: string;
  formatPrice: (amount: number) => string;
  showBalance: boolean;
  onToggleBalance: () => void;
  onAddFunds: () => void;
  onWithdraw: () => void;
  onCards: () => void;
}

export default function BalanceCard({
  balance,
  currency,
  formatPrice,
  showBalance,
  onToggleBalance,
  onAddFunds,
  onWithdraw,
  onCards,
}: BalanceCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={['#00BCD4', '#00ACC1', '#0097A7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Glass overlay for depth */}
        <View style={styles.glassOverlay}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.chipIcon}>
                <Ionicons name="wallet" size={20} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.balanceLabel}>Total Balance</Text>
            </View>
            <TouchableOpacity
              onPress={onToggleBalance}
              style={styles.eyeButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="rgba(255,255,255,0.8)"
              />
            </TouchableOpacity>
          </View>

          {/* Balance Amount */}
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceAmount}>
              {showBalance ? formatPrice(balance) : '••••••'}
            </Text>
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>{currency}</Text>
            </View>
          </View>

          {/* Sparkle decoration */}
          <View style={styles.sparkleContainer}>
            <Ionicons name="sparkles" size={16} color="rgba(255,255,255,0.6)" />
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onAddFunds}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <View style={styles.actionIcon}>
                  <Ionicons name="add" size={24} color="#00BCD4" />
                </View>
              </View>
              <Text style={styles.actionText}>Add Funds</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onWithdraw}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <View style={styles.actionIcon}>
                  <Ionicons name="arrow-up" size={24} color="#00BCD4" />
                </View>
              </View>
              <Text style={styles.actionText}>Withdraw</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onCards}
              activeOpacity={0.8}
            >
              <View style={styles.actionIconContainer}>
                <View style={styles.actionIcon}>
                  <Ionicons name="card-outline" size={24} color="#00BCD4" />
                </View>
              </View>
              <Text style={styles.actionText}>Cards</Text>
            </TouchableOpacity>
          </View>

          {/* Decorative pattern */}
          <View style={styles.patternContainer}>
            {[...Array(3)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.patternCircle,
                  { right: 20 + i * 30, bottom: 20 + i * 20 },
                ]}
              />
            ))}
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#00BCD4',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  gradient: {
    borderRadius: 28,
  },
  glassOverlay: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 24,
    paddingTop: 20,
    paddingBottom: 28,
    borderRadius: 28,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chipIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  eyeButton: {
    padding: 4,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
  },
  currencyBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currencyText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 24,
    right: 60,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
  },
  actionIconContainer: {
    borderRadius: 26,
    overflow: 'hidden',
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: 'hidden',
  },
  patternCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
});
