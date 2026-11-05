import { Text } from '@/components/AppText';
import React from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

/** Parts of a whole as a ring, with the total in the middle. */
export default function Donut({
  slices,
  size = 150,
  thickness = 20,
  centerTop,
  centerBottom,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerBottom?: string;
}) {
  const isDark = useColorScheme() === 'dark';
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const gap = slices.length > 1 ? 3 : 0;

  let offset = 0;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={isDark ? '#2C2C2E' : '#EEF1F3'} strokeWidth={thickness} fill="none" />
        {total > 0
          ? slices.map((s, i) => {
              const len = Math.max((s.value / total) * circ - gap, 0);
              const el = (
                <Circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={s.color}
                  strokeWidth={thickness}
                  fill="none"
                  strokeDasharray={`${len} ${circ - len}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="butt"
                  rotation={-90}
                  origin={`${size / 2}, ${size / 2}`}
                />
              );
              offset += (s.value / total) * circ;
              return el;
            })
          : null}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        {centerTop ? <Text style={[styles.top, { color: isDark ? '#FFFFFF' : '#0F1419' }]}>{centerTop}</Text> : null}
        {centerBottom ? <Text style={[styles.bottom, { color: isDark ? '#8E8E93' : '#6B7280' }]}>{centerBottom}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', alignItems: 'center' },
  top: { fontSize: 20, fontWeight: '800' },
  bottom: { fontSize: 12, marginTop: 1 },
});
