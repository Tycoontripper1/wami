import { Text } from '@/components/AppText';
import { Ionicons } from '@/components/FlatIcon';
import { AccountRole } from '@/utils/accountRole';
import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

const TEAL = '#00BCD4';
const ORANGE = '#FFA000';

const LOOK: Record<AccountRole, { label: string; icon: string; light: { bg: string; fg: string }; dark: { bg: string; fg: string } }> = {
  creative: {
    label: 'Creative',
    icon: 'color-palette',
    light: { bg: '#E0F7FA', fg: '#006978' },
    dark: { bg: '#12333B', fg: '#6FDCEC' },
  },
  both: {
    label: 'Creative & buyer',
    icon: 'color-palette',
    light: { bg: '#E0F7FA', fg: '#006978' },
    dark: { bg: '#12333B', fg: '#6FDCEC' },
  },
  buyer: {
    label: 'Buyer',
    icon: 'bag',
    light: { bg: '#FFF1CC', fg: '#8A5300' },
    dark: { bg: '#3A2A0A', fg: '#FFC94D' },
  },
};

/** A small pill that says whether an account is a creative, a buyer, or both. */
export default function RoleBadge({ role, small }: { role: AccountRole | null | undefined; small?: boolean }) {
  const isDark = useColorScheme() === 'dark';
  if (!role) return null;
  const look = LOOK[role];
  const tone = isDark ? look.dark : look.light;
  const accent = role === 'buyer' ? ORANGE : TEAL;

  return (
    <View style={[styles.pill, small && styles.pillSmall, { backgroundColor: tone.bg }]} accessibilityLabel={look.label}>
      <Ionicons name={look.icon as any} size={small ? 12 : 14} color={accent} accent={role === 'buyer' ? undefined : ORANGE} />
      <Text style={[styles.text, small && styles.textSmall, { color: tone.fg }]}>{look.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 10, height: 26, borderRadius: 13 },
  pillSmall: { height: 20, paddingHorizontal: 8, borderRadius: 10, gap: 4 },
  text: { fontSize: 12, fontWeight: '700' },
  textSmall: { fontSize: 11 },
});
