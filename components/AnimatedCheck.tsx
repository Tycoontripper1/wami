import { Illo } from '@/constants/Illustration';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleProp, View, ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

type Props = {
  /** Diameter of the round badge in px; the confetti flies out past it. */
  size?: number;
  style?: StyleProp<ViewStyle>;
};

// Length of the tick path (M40 62 L54 76 L82 44), a little over, so the dash
// fully hides it before the draw and fully shows it after.
const TICK = 'M40 62 L54 76 L82 44';
const TICK_LENGTH = 64;

const CONFETTI = [
  { colour: Illo.amber, round: true, size: 9 },
  { colour: Illo.coral, round: false, size: 9 },
  { colour: Illo.lilac, round: true, size: 8 },
  { colour: Illo.lime, round: false, size: 8 },
  { colour: Illo.tealLight, round: true, size: 7 },
  { colour: Illo.cloud, round: false, size: 7 },
  { colour: Illo.coral, round: true, size: 6 },
  { colour: Illo.amber, round: false, size: 6 },
];

/**
 * A success badge: the disc springs in, the tick draws itself stroke by
 * stroke, a ring pulses outward, and confetti flies out and fades. Flat,
 * brand colours. Shows the finished badge straight away under reduce-motion.
 */
export default function AnimatedCheck({ size = 140, style }: Props) {
  const pop = useRef(new Animated.Value(0)).current;
  const draw = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;
  const [dashOffset, setDashOffset] = useState(TICK_LENGTH);

  useEffect(() => {
    // The tick is an SVG dash offset, which can't use the native driver, so it
    // is mirrored into state; it is short and runs once.
    const id = draw.addListener(({ value }) => setDashOffset(TICK_LENGTH * (1 - value)));
    let cancelled = false;

    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (cancelled) return;
      if (reduce) {
        pop.setValue(1);
        draw.setValue(1);
        return;
      }
      Animated.sequence([
        Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(draw, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
          Animated.timing(ring, { toValue: 1, duration: 700, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(burst, { toValue: 1, duration: 760, delay: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]).start();
    });

    return () => {
      cancelled = true;
      draw.removeListener(id);
    };
  }, []);

  const box = size * 1.6;
  const reach = size * 0.78;

  return (
    <View style={[{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }, style]}>
      {/* expanding ring */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 3,
          borderColor: Illo.teal,
          opacity: ring.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 0.5, 0] }),
          transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] }) }],
        }}
      />

      {/* confetti */}
      {CONFETTI.map((piece, i) => {
        const angle = (i / CONFETTI.length) * Math.PI * 2 - Math.PI / 2 + 0.2;
        const dist = reach * (i % 2 ? 0.92 : 1.1);
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{
              position: 'absolute',
              width: piece.size,
              height: piece.size,
              borderRadius: piece.round ? piece.size / 2 : 2,
              backgroundColor: piece.colour,
              opacity: burst.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] }) },
                { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * dist] }) },
                { rotate: burst.interpolate({ inputRange: [0, 1], outputRange: ['0deg', i % 2 ? '120deg' : '-120deg'] }) },
                { scale: burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.3, 1, 0.7] }) },
              ],
            }}
          />
        );
      })}

      {/* badge: a lit disc over a shaded one, with the drawing tick */}
      <Animated.View style={{ transform: [{ scale: pop }] }}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          <Circle cx={60} cy={66} r={46} fill={Illo.tealDeep} />
          <Circle cx={60} cy={60} r={46} fill={Illo.teal} />
          <Path
            d={TICK}
            fill="none"
            stroke={Illo.paper}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={`${TICK_LENGTH} ${TICK_LENGTH}`}
            strokeDashoffset={dashOffset}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}
