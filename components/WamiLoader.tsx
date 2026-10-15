import { Text } from '@/components/AppText';
import { WAMIPinIcon } from '@/components/logo/WAMIPinIcon';
import { Illo } from '@/constants/Illustration';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, StyleSheet, View, useColorScheme } from 'react-native';

/* A full-screen loader: the whole screen is covered, and only the centre moves.
   The Wami pin drops onto its own shadow, squashes as it lands, springs up a
   little, and sends a ping out across the map each time it touches down.
   Under reduce-motion it holds still on a calm pulse. */

type Props = {
  visible: boolean;
  /** A short line under the pin, e.g. "Signing you in…". */
  message?: string;
  /** `brand` fills the screen with Wami teal; `light` uses a soft wash of the theme. */
  variant?: 'brand' | 'light';
};

const CYCLE_MS = 1500;
const PIN = 76;

export default function WamiLoader({ visible, message, variant = 'brand' }: Props) {
  const isDark = useColorScheme() === 'dark';
  const p = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    if (!visible || reduceMotion) {
      p.stopAnimation();
      p.setValue(0);
      return;
    }
    p.setValue(0);
    const loop = Animated.loop(
      Animated.timing(p, { toValue: 1, duration: CYCLE_MS, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [visible, reduceMotion, p]);

  const brand = variant === 'brand';
  const backdrop = brand ? Illo.teal : isDark ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.94)';
  const pinColor = brand ? '#FFFFFF' : Illo.teal;
  const cutout = brand ? Illo.teal : isDark ? '#000000' : '#FFFFFF';
  const ringColor = brand ? '#FFFFFF' : Illo.teal;
  const accent = Illo.amber;
  const textColor = brand ? '#FFFFFF' : isDark ? '#FFFFFF' : Illo.ink;

  // One loop, 0..1: fall (0–0.42), land + squash (0.42–0.52), spring (0.52–0.78), settle (0.78–1).
  const drop = p.interpolate({
    inputRange: [0, 0.42, 0.52, 0.65, 0.78, 1],
    outputRange: [-70, 0, 0, -22, 0, 0],
    easing: Easing.out(Easing.quad),
  });
  const squashY = p.interpolate({
    inputRange: [0, 0.42, 0.47, 0.54, 0.78, 0.84, 1],
    outputRange: [1.06, 1.06, 0.8, 1.04, 1.04, 0.9, 1],
  });
  const squashX = p.interpolate({
    inputRange: [0, 0.42, 0.47, 0.54, 0.78, 0.84, 1],
    outputRange: [0.96, 0.96, 1.18, 0.98, 0.98, 1.08, 1],
  });
  const shadowScale = p.interpolate({
    inputRange: [0, 0.42, 0.65, 0.78, 1],
    outputRange: [0.35, 1, 0.7, 1, 1],
  });
  const shadowOpacity = p.interpolate({
    inputRange: [0, 0.42, 0.65, 0.78, 1],
    outputRange: [0.08, 0.28, 0.16, 0.28, 0.28],
  });

  // Two pings leave the landing point, the second a beat behind.
  const ping = (start: number, end: number, to: number, peak: number) => ({
    transform: [
      {
        scale: p.interpolate({ inputRange: [0, start, end, 1], outputRange: [0.2, 0.2, to, to] }),
      },
    ],
    opacity: p.interpolate({ inputRange: [0, start, start + 0.01, end, 1], outputRange: [0, 0, peak, 0, 0] }),
  });

  // Little satellites that ride the ping outward.
  const dot = (angle: number, delay: number) => {
    const rad = (angle * Math.PI) / 180;
    const start = 0.44 + delay;
    return {
      transform: [
        { translateX: p.interpolate({ inputRange: [0, start, 1], outputRange: [0, 0, Math.cos(rad) * 110] }) },
        { translateY: p.interpolate({ inputRange: [0, start, 1], outputRange: [0, 0, Math.sin(rad) * 110] }) },
        { scale: p.interpolate({ inputRange: [0, start, start + 0.08, 1], outputRange: [0, 0, 1, 0.3] }) },
      ],
      opacity: p.interpolate({ inputRange: [0, start, start + 0.02, 0.98, 1], outputRange: [0, 0, 1, 0, 0] }),
    };
  };

  const still = reduceMotion;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View
        style={[styles.backdrop, { backgroundColor: backdrop }]}
        accessibilityViewIsModal
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={message || 'Loading'}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.stage}>
          {!still ? (
            <>
              <Animated.View style={[styles.ring, { borderColor: ringColor }, ping(0.44, 1, 3.6, 0.55)]} />
              <Animated.View style={[styles.ring, { borderColor: accent }, ping(0.52, 1, 2.6, 0.7)]} />
              <Animated.View style={[styles.dot, { backgroundColor: accent }, dot(-150, 0)]} />
              <Animated.View style={[styles.dot, { backgroundColor: ringColor, width: 8, height: 8 }, dot(-40, 0.03)]} />
              <Animated.View style={[styles.dot, { backgroundColor: accent, width: 8, height: 8 }, dot(60, 0.02)]} />
              <Animated.View style={[styles.dot, { backgroundColor: ringColor }, dot(150, 0.05)]} />
            </>
          ) : null}

          <Animated.View
            style={[
              styles.shadow,
              { backgroundColor: brand ? '#0A3A44' : '#0F1419' },
              still ? { opacity: 0.2 } : { opacity: shadowOpacity, transform: [{ scaleX: shadowScale }] },
            ]}
          />

          <Animated.View
            style={[
              styles.pin,
              still ? null : { transform: [{ translateY: drop }, { scaleX: squashX }, { scaleY: squashY }] },
            ]}
          >
            <WAMIPinIcon size={PIN} color={pinColor} cutoutColor={cutout} />
          </Animated.View>
        </View>

        {message ? <Text style={[styles.message, { color: textColor }]}>{message}</Text> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    width: 260,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    // the ping spreads from the foot of the pin
    top: 200 / 2 + 8,
  },
  dot: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    top: 200 / 2 + 50,
  },
  shadow: {
    position: 'absolute',
    top: 200 / 2 + 52,
    width: 56,
    height: 12,
    borderRadius: 6,
  },
  pin: {
    // anchored so the pin's tip meets the shadow
    marginTop: 0,
  },
  message: {
    marginTop: 22,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
