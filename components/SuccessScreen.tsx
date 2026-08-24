import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SuccessScreenProps {
  title?: string;
  subtitle: string;
  referenceLabel?: string;
  referenceValue?: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary: () => void;
}

export default function SuccessScreen({
  title = 'Done!',
  subtitle,
  referenceLabel,
  referenceValue,
  primaryLabel,
  onPrimary,
  secondaryLabel = 'Go Home',
  onSecondary,
}: SuccessScreenProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;

  const tc = {
    bg: isDark ? '#0A0A0A' : '#F8F9FA',
    card: isDark ? '#1C1C1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    border: isDark ? '#2C2C2E' : '#E5E7EB',
  };

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 100 }),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideUp, { toValue: 0, duration: 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: tc.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.content}>
        <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
          <Ionicons name="checkmark-circle" size={100} color={Colors.light.primary} />
        </Animated.View>

        <Animated.View style={{ opacity, transform: [{ translateY: slideUp }], alignItems: 'center' }}>
          <Text style={[styles.title, { color: tc.text }]}>{title}</Text>
          <Text style={[styles.subtitle, { color: tc.sub }]}>{subtitle}</Text>

          {referenceLabel && referenceValue && (
            <View style={[styles.referenceCard, { backgroundColor: tc.card, borderColor: tc.border }]}>
              <Text style={[styles.referenceLabel, { color: tc.sub }]}>{referenceLabel}</Text>
              <Text style={[styles.referenceValue, { color: tc.text }]}>{referenceValue}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Text style={styles.primaryBtn} onPress={onPrimary}>
              {primaryLabel}
            </Text>
            <Text style={[styles.secondaryBtn, { color: tc.sub }]} onPress={onSecondary}>
              {secondaryLabel}
            </Text>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  iconWrap: { marginBottom: 24 },
  title: { fontSize: 36, fontWeight: '800', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  referenceCard: {
    width: '100%', padding: 20, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', marginBottom: 32, gap: 6,
  },
  referenceLabel: { fontSize: 13 },
  referenceValue: { fontSize: 18, fontWeight: '700', letterSpacing: 1.5 },
  actions: { width: '100%', gap: 12 },
  primaryBtn: {
    backgroundColor: Colors.light.primary, color: '#fff', fontSize: 17, fontWeight: '700',
    textAlign: 'center', paddingVertical: 18, borderRadius: 30, overflow: 'hidden',
  },
  secondaryBtn: { fontSize: 16, fontWeight: '600', textAlign: 'center', paddingVertical: 12 },
});
