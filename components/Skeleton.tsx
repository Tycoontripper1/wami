import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleSheet, View, useColorScheme } from 'react-native';

interface SkeletonBlockProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: any;
}

export function SkeletonBlock({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonBlockProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const shimmer = useRef(new Animated.Value(0)).current;

  const baseColor = isDark ? '#1F1F1F' : '#EDEDED';
  const highlightColor = isDark ? '#2E2E2E' : '#F8F8F8';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1100,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 150],
  });

  return (
    <View style={[{ width, height, borderRadius, backgroundColor: baseColor, overflow: 'hidden' }, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={[baseColor, highlightColor, baseColor]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

export function SkeletonCard({ style }: { style?: any }) {
  return (
    <View style={[styles.card, style]}>
      <SkeletonBlock height={140} borderRadius={14} />
      <SkeletonBlock height={14} width="80%" style={{ marginTop: 10 }} />
      <SkeletonBlock height={12} width="50%" style={{ marginTop: 6 }} />
    </View>
  );
}

export function SkeletonRow({ style }: { style?: any }) {
  return (
    <View style={[styles.row, style]}>
      <SkeletonBlock width={64} height={64} borderRadius={12} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBlock height={14} width="70%" />
        <SkeletonBlock height={12} width="45%" />
      </View>
    </View>
  );
}

export function SkeletonProfileHeader({ style }: { style?: any }) {
  return (
    <View style={[styles.profileHeader, style]}>
      <SkeletonBlock width={88} height={88} borderRadius={44} />
      <SkeletonBlock height={16} width="55%" style={{ marginTop: 14 }} />
      <SkeletonBlock height={12} width="35%" style={{ marginTop: 8 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileHeader: { alignItems: 'center', paddingVertical: 20 },
});
