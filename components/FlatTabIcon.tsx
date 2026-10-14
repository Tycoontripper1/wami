import { Illo } from '@/constants/Illustration';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

/* Flat, outline-free tab icons on a 24×24 grid. Each has a main face, a shaded
   face and a small accent. Idle tabs are muted; the selected tab takes its full
   brand colours and bounces in. */

export type TabIconName = 'home' | 'shop' | 'post' | 'chats' | 'profile';

type Tones = { main: string; shade: string; accent: string; mark: string };

const IDLE: Tones = { main: '#FFFFFF', shade: '#8FB3B8', accent: '#8FB3B8', mark: '#0A3A44' };

const ACTIVE: Record<TabIconName, Tones> = {
  home: { main: Illo.teal, shade: Illo.tealDeep, accent: Illo.amber, mark: Illo.cloud },
  shop: { main: Illo.amber, shade: Illo.ember, accent: Illo.tealLight, mark: Illo.paper },
  // the Post button is an action, not a place, so it is always in full colour
  post: { main: Illo.amber, shade: Illo.ember, accent: Illo.ink, mark: Illo.ink },
  chats: { main: Illo.teal, shade: Illo.amber, accent: Illo.paper, mark: Illo.paper },
  profile: { main: Illo.teal, shade: Illo.tealDeep, accent: Illo.amber, mark: Illo.paper },
};

function Glyph({ name, t }: { name: TabIconName; t: Tones }) {
  switch (name) {
    case 'home':
      return (
        <G>
          <Rect x={4} y={10} width={16} height={11} rx={1.5} fill={t.main} />
          <Rect x={14} y={10} width={6} height={11} rx={1.5} fill={t.shade} />
          <Path d="M2.5 10 L4.6 3.8 H19.4 L21.5 10 Z" fill={t.accent} />
          <Path d="M8.2 3.8 H11.4 L10.6 10 H6.4 Z M15.4 3.8 H19.4 L21.5 10 H16.8 Z" fill={t.mark} opacity={0.55} />
          <Rect x={9.5} y={14} width={5} height={7} rx={2.5} fill={t.mark} />
        </G>
      );
    case 'shop':
      return (
        <G>
          <Path d="M8.5 9 V7.4 a3.5 3.5 0 0 1 7 0 V9" stroke={t.accent} strokeWidth={2} strokeLinecap="round" fill="none" />
          <Path d="M4.6 9 H19.4 L20.4 20 a1.6 1.6 0 0 1 -1.6 1.7 H5.2 a1.6 1.6 0 0 1 -1.6 -1.7 Z" fill={t.main} />
          <Path d="M13 9 H19.4 L20.4 20 a1.6 1.6 0 0 1 -1.6 1.7 H13 Z" fill={t.shade} />
          <Circle cx={12} cy={14.6} r={2} fill={t.mark} />
        </G>
      );
    case 'post':
      return (
        <G>
          <Circle cx={12} cy={13} r={10} fill={t.shade} />
          <Circle cx={12} cy={11.6} r={10} fill={t.main} />
          <Rect x={10.9} y={6} width={2.2} height={11.2} rx={1.1} fill={t.mark} />
          <Rect x={6.4} y={10.5} width={11.2} height={2.2} rx={1.1} fill={t.mark} />
        </G>
      );
    case 'chats':
      return (
        <G>
          <Rect x={11} y={10.5} width={11} height={8} rx={3.4} fill={t.shade} />
          <Path d="M19 18 L20.2 21.4 L16 18 Z" fill={t.shade} />
          <Rect x={2} y={3.5} width={16.5} height={12.5} rx={5} fill={t.main} />
          <Path d="M6.4 15.5 L5.2 20.2 L11 15.5 Z" fill={t.main} />
          <Circle cx={6.8} cy={9.8} r={1.4} fill={t.accent} />
          <Circle cx={10.2} cy={9.8} r={1.4} fill={t.accent} />
          <Circle cx={13.6} cy={9.8} r={1.4} fill={t.accent} />
        </G>
      );
    case 'profile':
      return (
        <G>
          <Path d="M3.8 21.5 C3.8 16.6 7.5 14.2 12 14.2 C16.5 14.2 20.2 16.6 20.2 21.5 Z" fill={t.main} />
          <Path d="M12 14.2 C16.5 14.2 20.2 16.6 20.2 21.5 H12 Z" fill={t.shade} />
          <Circle cx={12} cy={7.6} r={4.6} fill={t.accent} />
        </G>
      );
  }
}

type Props = {
  name: TabIconName;
  focused: boolean;
  size?: number;
};

export default function FlatTabIcon({ name, focused, size = 30 }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const scale = useRef(new Animated.Value(focused ? 1 : 0.94)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const tilt = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  const alwaysOn = name === 'post';
  const lit = focused || alwaysOn;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setReduceMotion(v));
    return () => {
      mounted = false;
    };
  }, []);

  // Springy pop when a tab becomes selected.
  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(focused ? 1 : 0.94);
      return;
    }
    if (focused) {
      scale.setValue(0.65);
      lift.setValue(7);
      tilt.setValue(-14);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1.08, friction: 3.2, tension: 150, useNativeDriver: true }),
        Animated.spring(lift, { toValue: -2, friction: 4, tension: 140, useNativeDriver: true }),
        Animated.spring(tilt, { toValue: 0, friction: 3.5, tension: 120, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scale, { toValue: 0.94, duration: 160, useNativeDriver: true }),
        Animated.timing(lift, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(tilt, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [focused, reduceMotion]);

  // A slow float keeps the selected icon (and the Post button) alive.
  useEffect(() => {
    if (reduceMotion || !lit) {
      float.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: -1.6, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [lit, reduceMotion]);

  const tones = lit ? ACTIVE[name] : IDLE;

  return (
    <Animated.View
      style={{
        transform: [
          { translateY: Animated.add(lift, float) },
          { scale },
          { rotate: tilt.interpolate({ inputRange: [-30, 30], outputRange: ['-30deg', '30deg'] }) },
        ],
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Glyph name={name} t={tones} />
      </Svg>
    </Animated.View>
  );
}
