import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';

export interface TopProductItem {
  id: string;
  name: string;
  value: number;
  subtitle?: string;
}

interface TopProductsListProps {
  items: TopProductItem[];
  formatValue?: (value: number) => string;
}

export default function TopProductsList({ items, formatValue }: TopProductsListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tc = {
    text: isDark ? '#FFFFFF' : '#0A0A0A',
    sub: isDark ? '#8E8E93' : '#6B7280',
    track: isDark ? '#2C2C2E' : '#F3F4F6',
  };

  const fmt = formatValue ?? ((v: number) => `₦${v.toLocaleString()}`);
  const sorted = [...items].sort((a, b) => b.value - a.value);
  const maxValue = Math.max(...sorted.map((i) => i.value), 1);

  if (sorted.length === 0) {
    return (
      <View style={{ paddingVertical: 20, alignItems: 'center' }}>
        <Text style={{ color: tc.sub, fontSize: 13 }}>No product sales yet</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {sorted.map((item, index) => {
        const widthPct = (item.value / maxValue) * 100;
        return (
          <View key={item.id}>
            <View style={styles.row}>
              <Text style={[styles.rank, { color: tc.sub }]}>{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, { color: tc.text }]} numberOfLines={1}>{item.name}</Text>
                {item.subtitle && <Text style={[styles.subtitle, { color: tc.sub }]}>{item.subtitle}</Text>}
              </View>
              <Text style={[styles.value, { color: tc.text }]}>{fmt(item.value)}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: tc.track }]}>
              <View style={[styles.fill, { width: `${widthPct}%`, backgroundColor: Colors.light.primary }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  rank: { fontSize: 13, fontWeight: '700', width: 16 },
  name: { fontSize: 14, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 1 },
  value: { fontSize: 14, fontWeight: '700' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
