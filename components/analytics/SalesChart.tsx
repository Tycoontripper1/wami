import Colors from '@/constants/Colors';
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View, useColorScheme } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

export interface SalesChartPoint {
  label: string;
  value: number;
}

interface SalesChartProps {
  data: SalesChartPoint[];
  height?: number;
  formatValue?: (value: number) => string;
}

// Smooth cubic-bezier path through a set of points (Catmull-Rom style),
// avoids the jagged look of straight line segments.
function buildSmoothPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  let path = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return path;
}

export default function SalesChart({ data, height = 180, formatValue }: SalesChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const tc = {
    grid: isDark ? '#2C2C2E' : '#E5E7EB',
    sub: isDark ? '#8E8E93' : '#6B7280',
  };

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  if (data.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={{ color: tc.sub, fontSize: 13 }}>No sales data for this period</Text>
      </View>
    );
  }

  const padding = { top: 16, bottom: 24, left: 8, right: 8 };
  const chartHeight = height - padding.top - padding.bottom;
  const values = data.map((d) => d.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (width > 0 ? (i / Math.max(data.length - 1, 1)) * (width - padding.left - padding.right) : 0),
    y: padding.top + chartHeight - ((d.value - minValue) / range) * chartHeight,
  }));

  const linePath = buildSmoothPath(points);
  const areaPath = width > 0
    ? `${linePath} L${points[points.length - 1].x},${padding.top + chartHeight} L${points[0].x},${padding.top + chartHeight} Z`
    : '';

  const active = activeIndex !== null ? data[activeIndex] : null;
  const activePoint = activeIndex !== null ? points[activeIndex] : null;
  const fmt = formatValue ?? ((v: number) => `₦${v.toLocaleString()}`);

  return (
    <View>
      {active && (
        <View style={styles.tooltip}>
          <Text style={[styles.tooltipValue, { color: Colors.light.primary }]}>{fmt(active.value)}</Text>
          <Text style={[styles.tooltipLabel, { color: tc.sub }]}>{active.label}</Text>
        </View>
      )}
      <View onLayout={onLayout} style={{ height }}>
        {width > 0 && (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={Colors.light.primary} stopOpacity={0.25} />
                <Stop offset="1" stopColor={Colors.light.primary} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            {/* Gridlines */}
            {[0.25, 0.5, 0.75].map((f) => (
              <Line
                key={f}
                x1={padding.left}
                x2={width - padding.right}
                y1={padding.top + chartHeight * f}
                y2={padding.top + chartHeight * f}
                stroke={tc.grid}
                strokeWidth={1}
              />
            ))}

            <Path d={areaPath} fill="url(#salesFill)" />
            <Path d={linePath} fill="none" stroke={Colors.light.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

            {points.map((p, i) => (
              <Circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={activeIndex === i ? 5 : 3}
                fill={activeIndex === i ? Colors.light.primary : '#fff'}
                stroke={Colors.light.primary}
                strokeWidth={activeIndex === i ? 0 : 2}
                onPress={() => setActiveIndex(i)}
              />
            ))}
          </Svg>
        )}
      </View>
      <View style={styles.xAxis}>
        <Text style={[styles.xAxisLabel, { color: tc.sub }]}>{data[0]?.label}</Text>
        {data.length > 1 && (
          <Text style={[styles.xAxisLabel, { color: tc.sub }]}>{data[data.length - 1]?.label}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center' },
  tooltip: { marginBottom: 8 },
  tooltipValue: { fontSize: 20, fontWeight: '800' },
  tooltipLabel: { fontSize: 12, marginTop: 2 },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, marginTop: 4 },
  xAxisLabel: { fontSize: 11 },
});
