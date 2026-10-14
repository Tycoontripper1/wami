import { Ionicons } from '@/components/FlatIcon';
import { Illo } from '@/constants/Illustration';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

type Props = {
  saved: boolean;
  size?: number;
  /** Colour of the heart once saved. */
  savedColor?: string;
  /** Colour of the faint heart before it is saved. */
  idleColor?: string;
  style?: StyleProp<ViewStyle>;
};

const BURST = [Illo.coral, Illo.amber, Illo.tealLight, Illo.coral, Illo.lilac, Illo.amber];

/**
 * The heart glyph with its save animation: it pops with a spring when saved
 * and a ring of small dots flies outward and fades. Unsaving just dips and
 * settles. Purely visual — the parent button owns the tap and the state.
 * Does nothing on first render, and respects reduce-motion.
 */
export default function AnimatedHeart({
  saved,
  size = 22,
  savedColor = Illo.coral,
  idleColor = '#FFFFFF',
  style,
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const previous = useRef(saved);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduceMotion(v));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (previous.current === saved) return;
    previous.current = saved;
    if (reduceMotion) return;

    if (saved) {
      scale.setValue(0.55);
      burst.setValue(0);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 3, tension: 170, useNativeDriver: true }),
        Animated.timing(burst, { toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    } else {
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.78, duration: 90, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [saved, reduceMotion]);

  const radius = size * 1.05;

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]} pointerEvents="none">
      {BURST.map((colour, i) => {
        const angle = (i / BURST.length) * Math.PI * 2 - Math.PI / 2;
        const dx = Math.cos(angle) * radius;
        const dy = Math.sin(angle) * radius;
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: colour,
                opacity: burst.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
                transform: [
                  { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) },
                  { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) },
                  { scale: burst.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0.4, 1, 0.5] }) },
                ],
              },
            ]}
          />
        );
      })}
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={saved ? 'heart' : 'heart-outline'}
          size={size}
          color={saved ? savedColor : idleColor}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
