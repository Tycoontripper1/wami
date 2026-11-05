import { Text } from '@/components/AppText';
import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';

export interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

/** Views, then clicks, then saves: each bar is sized against the first, with the share that carried on. */
export default function TrafficFunnel({ steps }: { steps: FunnelStep[] }) {
  const isDark = useColorScheme() === 'dark';
  const text = isDark ? '#FFFFFF' : '#0F1419';
  const sub = isDark ? '#8E8E93' : '#6B7280';
  const track = isDark ? '#2C2C2E' : '#EEF1F3';
  const top = Math.max(steps[0]?.value ?? 0, 1);

  return (
    <View style={{ gap: 14 }}>
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : 0;
        const carried = i > 0 && prev > 0 ? Math.round((s.value / prev) * 100) : null;
        return (
          <View key={s.label}>
            <View style={styles.row}>
              <Text style={[styles.label, { color: text }]}>{s.label}</Text>
              <View style={styles.right}>
                {carried !== null ? <Text style={[styles.carried, { color: sub }]}>{carried}% of {steps[i - 1].label.toLowerCase()}</Text> : null}
                <Text style={[styles.value, { color: text }]}>{s.value.toLocaleString()}</Text>
              </View>
            </View>
            <View style={[styles.track, { backgroundColor: track }]}>
              <View style={[styles.fill, { width: `${Math.max((s.value / top) * 100, s.value > 0 ? 3 : 0)}%`, backgroundColor: s.color }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '700' },
  right: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  carried: { fontSize: 12 },
  value: { fontSize: 15, fontWeight: '800' },
  track: { height: 12, borderRadius: 6, overflow: 'hidden' },
  fill: { height: 12, borderRadius: 6 },
});
