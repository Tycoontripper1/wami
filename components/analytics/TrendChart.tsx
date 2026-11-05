import { Text } from '@/components/AppText';
import Colors from '@/constants/Colors';
import { formatCompact } from '@/utils/money';
import React, { useState } from 'react';
import { GestureResponderEvent, LayoutChangeEvent, StyleSheet, View, useColorScheme } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

export interface TrendPoint {
  label: string;
  value: number;
}

// A smooth curve through the points, so the line reads as a trend, not a zig-zag.
function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    d += ` C${p1.x + (p2.x - p0.x) / 6},${p1.y + (p2.y - p0.y) / 6} ${p2.x - (p3.x - p1.x) / 6},${p2.y - (p3.y - p1.y) / 6} ${p2.x},${p2.y}`;
  }
  return d;
}

// Round the top of the scale up to a tidy number (1, 2, 2.5, 5 times a power of ten).
function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
}

/** One series over time, as a smooth area or as columns. Touch and drag to read any point. */
export default function TrendChart({
  data,
  mode = 'line',
  height = 200,
  format = (v: number) => `₦${v.toLocaleString()}`,
  axisFormat = formatCompact,
  color = Colors.light.primary,
  accent = '#FFA000',
}: {
  data: TrendPoint[];
  mode?: 'line' | 'bars';
  height?: number;
  format?: (v: number) => string;
  axisFormat?: (v: number) => string;
  color?: string;
  accent?: string;
}) {
  const isDark = useColorScheme() === 'dark';
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  const t = {
    grid: isDark ? '#2C2C2E' : '#E8ECEF',
    sub: isDark ? '#8E8E93' : '#6B7280',
    text: isDark ? '#FFFFFF' : '#0F1419',
    dot: isDark ? '#1C1C1E' : '#FFFFFF',
  };

  const pad = { top: 14, bottom: 6, left: 40, right: 6 };
  const innerW = Math.max(width - pad.left - pad.right, 1);
  const innerH = height - pad.top - pad.bottom;
  const n = data.length;
  const max = niceCeil(Math.max(...data.map((d) => d.value), 0));
  const y = (v: number) => pad.top + innerH - (Math.max(v, 0) / max) * innerH;

  const slot = innerW / Math.max(n, 1);
  const xAt = (i: number) => (mode === 'bars' ? pad.left + slot * i + slot / 2 : pad.left + (n > 1 ? (i / (n - 1)) * innerW : innerW / 2));
  const points = data.map((d, i) => ({ x: xAt(i), y: y(d.value) }));

  const line = smoothPath(points);
  const baseY = pad.top + innerH;
  const area = points.length > 0 ? `${line} L${points[points.length - 1].x},${baseY} L${points[0].x},${baseY} Z` : '';

  const pick = (e: GestureResponderEvent) => {
    if (n === 0) return;
    const x = e.nativeEvent.locationX - pad.left;
    const i = mode === 'bars' ? Math.floor(x / slot) : Math.round((x / innerW) * (n - 1));
    setActive(Math.min(Math.max(i, 0), n - 1));
  };

  const grid = [0, 1, 2, 3].map((k) => ({ v: (max * (3 - k)) / 3, yy: pad.top + (innerH * k) / 3 }));
  const labelIdx = n <= 1 ? [0] : n <= 3 ? Array.from({ length: n }, (_, i) => i) : [0, Math.round((n - 1) / 2), n - 1];
  const shown = active !== null ? data[active] : null;

  return (
    <View>
      <View style={styles.readout}>
        {shown ? (
          <>
            <Text style={[styles.readValue, { color: t.text }]}>{format(shown.value)}</Text>
            <Text style={[styles.readLabel, { color: t.sub }]}>{shown.label}</Text>
          </>
        ) : (
          <Text style={[styles.readLabel, { color: t.sub }]}>Touch and drag to see each day</Text>
        )}
      </View>

      <View
        style={{ height }}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        onTouchStart={pick}
        onTouchMove={pick}
        onTouchEnd={() => setActive(null)}
        onTouchCancel={() => setActive(null)}
      >
        {width > 0 ? (
          <>
            <Svg width={width} height={height}>
              <Defs>
                <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={color} stopOpacity={0.32} />
                  <Stop offset="1" stopColor={color} stopOpacity={0} />
                </LinearGradient>
              </Defs>

              {grid.map((g, k) => (
                <Line key={k} x1={pad.left} x2={width - pad.right} y1={g.yy} y2={g.yy} stroke={t.grid} strokeWidth={1} strokeDasharray={k === 3 ? undefined : '3 4'} />
              ))}

              {mode === 'line' ? (
                <>
                  <Path d={area} fill="url(#trendFill)" />
                  <Path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                </>
              ) : (
                data.map((d, i) => {
                  const bw = Math.min(20, slot * 0.62);
                  const top = y(d.value);
                  return (
                    <Rect
                      key={i}
                      x={xAt(i) - bw / 2}
                      y={top}
                      width={bw}
                      height={Math.max(baseY - top, d.value > 0 ? 2 : 0)}
                      rx={Math.min(5, bw / 2)}
                      fill={active === i ? accent : color}
                      opacity={active === null || active === i ? 1 : 0.45}
                    />
                  );
                })
              )}

              {active !== null && points[active] ? (
                <>
                  {mode === 'line' ? <Line x1={points[active].x} x2={points[active].x} y1={pad.top} y2={baseY} stroke={accent} strokeWidth={1.5} strokeDasharray="4 4" /> : null}
                  {mode === 'line' ? <Circle cx={points[active].x} cy={points[active].y} r={6} fill={t.dot} stroke={accent} strokeWidth={3} /> : null}
                </>
              ) : null}
            </Svg>

            {grid.slice(0, 3).map((g, k) => (
              <Text key={k} style={[styles.yLabel, { top: g.yy - 7, color: t.sub }]}>{axisFormat(g.v)}</Text>
            ))}
          </>
        ) : null}
      </View>

      <View style={[styles.xRow, { paddingLeft: pad.left }]}>
        {labelIdx.map((i, k) => (
          <Text key={i} style={[styles.xLabel, { color: t.sub, textAlign: k === 0 ? 'left' : k === labelIdx.length - 1 ? 'right' : 'center' }]}>
            {data[i]?.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  readout: { minHeight: 44, justifyContent: 'center', marginBottom: 4 },
  readValue: { fontSize: 22, fontWeight: '800' },
  readLabel: { fontSize: 12, marginTop: 1 },
  yLabel: { position: 'absolute', left: 0, fontSize: 11, width: 36 },
  xRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  xLabel: { fontSize: 11, flex: 1 },
});
