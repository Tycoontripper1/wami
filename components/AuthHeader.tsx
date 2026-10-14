import { Ionicons } from '@/components/FlatIcon';
import CreativeTool, { ToolName } from '@/components/illustrations/CreativeTools';
import { Illo } from '@/constants/Illustration';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  /** First line of the headline. */
  title: string;
  /** The word that sits on the tilted highlight, on the second line. */
  highlight?: string;
  subtitle?: React.ReactNode;
  onBack?: () => void;
  onClose?: () => void;
  /** Fewer, smaller tools, for screens with a lot of fields. */
  compact?: boolean;
  /** For screens that are always white, whatever the device theme. */
  forceLight?: boolean;
};

// The auth screens pad their content by 24px at the sides and by the safe-area
// inset + 20px at the top; the header cancels that so the tools run edge to edge.
const SIDE = 24;
const TOP_GAP = 20;
const BUTTON_ZONE = 56; // room for the back button below the status bar

// Positions are for a 390-wide, 330-tall field; x is a fraction of the width,
// y and size are scaled with the field's height.
type Placement = { name: ToolName; x: number; y: number; size: number; rotate: number };
const FIELD_HEIGHT = 330;
const PLACEMENTS: Placement[] = [
  { name: 'flower', x: 0.2, y: 6, size: 32, rotate: 0 },
  { name: 'scissors', x: 0.34, y: 20, size: 62, rotate: 12 },
  { name: 'palette', x: 0.66, y: 40, size: 76, rotate: 8 },
  { name: 'heart', x: 0.88, y: 10, size: 34, rotate: -12 },
  { name: 'camera', x: 0.05, y: 76, size: 78, rotate: -10 },
  { name: 'brush', x: 0.43, y: 100, size: 68, rotate: 0 },
  { name: 'coin', x: 0.9, y: 108, size: 30, rotate: 0 },
  { name: 'clapper', x: 0.27, y: 148, size: 52, rotate: -6 },
  { name: 'bulb', x: 0.79, y: 148, size: 60, rotate: 10 },
  { name: 'spool', x: 0.03, y: 178, size: 62, rotate: -8 },
  { name: 'pencil', x: 0.6, y: 232, size: 58, rotate: 0 },
  { name: 'comb', x: 0.19, y: 252, size: 58, rotate: -6 },
  { name: 'lipstick', x: 0.45, y: 262, size: 46, rotate: 8 },
  { name: 'headphones', x: 0.76, y: 246, size: 56, rotate: 8 },
];
const COMPACT_LIMIT = 215; // keep only what ends above this y

/** One tool: placed, tilted, and drifting a little so the screen feels alive. */
function FloatingTool({
  placement,
  scale,
  sizeScale,
  width,
  index,
  still,
}: {
  placement: Placement;
  scale: number;
  sizeScale: number;
  width: number;
  index: number;
  still: boolean;
}) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (still) {
      drift.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 2400 + (index % 5) * 350,
          delay: (index % 4) * 220,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 2400 + (index % 5) * 350,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [still, index]);

  const size = placement.size * sizeScale;
  const sway = index % 2 === 0 ? 4 : -4;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: placement.x * width,
        top: placement.y * scale,
        transform: [
          { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -5 * scale] }) },
          {
            rotate: drift.interpolate({
              inputRange: [0, 1],
              outputRange: [`${placement.rotate}deg`, `${placement.rotate + sway}deg`],
            }),
          },
        ],
      }}
    >
      <CreativeTool name={placement.name} size={size} />
    </Animated.View>
  );
}

/**
 * Top of the sign-in / sign-up / password screens: a scatter of the tools
 * creatives work with, then a big headline with one highlighted word and a
 * plain subtitle. The tools fold away while the keyboard is open.
 */
export default function AuthHeader({ title, highlight, subtitle, onBack, onClose, compact, forceLight }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isDark = useColorScheme() === 'dark' && !forceLight;
  const [still, setStill] = useState(false);
  const fold = useRef(new Animated.Value(1)).current; // 1 = tools open, 0 = folded

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setStill(v));
    const animate = (to: number) =>
      Animated.timing(fold, { toValue: to, duration: 170, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    const show = Keyboard.addListener('keyboardDidShow', () => animate(0));
    const hide = Keyboard.addListener('keyboardDidHide', () => animate(1));
    return () => {
      mounted = false;
      show.remove();
      hide.remove();
    };
  }, [fold]);

  // The field takes a share of the screen so the form always fits beneath it.
  const fieldHeight = Math.round(Math.min(compact ? 200 : FIELD_HEIGHT, height * (compact ? 0.2 : 0.27)));
  const scale = fieldHeight / FIELD_HEIGHT;
  // Objects are drawn a little larger than their slot's share, like a sticker sheet.
  const sizeScale = scale * 1.22;
  const placements = useMemo(
    () => (compact ? PLACEMENTS.filter((p) => p.y + p.size <= COMPACT_LIMIT) : PLACEMENTS),
    [compact],
  );

  const text = isDark ? '#FFFFFF' : '#0F1419';
  const sub = isDark ? '#B8C0C8' : '#5A646E';
  const buttonBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,20,25,0.06)';
  const topZone = insets.top + BUTTON_ZONE;

  return (
    <View style={{ marginHorizontal: -SIDE, marginTop: -(insets.top + TOP_GAP), marginBottom: 12 }}>
      <Animated.View
        style={{
          height: fold.interpolate({ inputRange: [0, 1], outputRange: [topZone, topZone + fieldHeight] }),
          overflow: 'hidden',
        }}
      >
        <Animated.View style={{ position: 'absolute', top: topZone, left: 0, right: 0, opacity: fold }}>
          {placements.map((p, i) => (
            <FloatingTool key={p.name} placement={p} scale={scale} sizeScale={sizeScale} width={width} index={i} still={still} />
          ))}
        </Animated.View>
      </Animated.View>

      {onBack || onClose ? (
        <View style={[styles.buttons, { top: insets.top + 8 }]} pointerEvents="box-none">
          {onBack ? (
            <TouchableOpacity
              onPress={onBack}
              style={[styles.iconButton, { backgroundColor: buttonBg }]}
              accessibilityLabel="Back"
            >
              <Ionicons name="arrow-back" size={22} color={text} />
            </TouchableOpacity>
          ) : (
            <View />
          )}
          {onClose ? (
            <TouchableOpacity
              onPress={onClose}
              style={[styles.iconButton, { backgroundColor: buttonBg }]}
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={22} color={text} />
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <View style={{ paddingHorizontal: SIDE }}>
        <Text style={[styles.title, { color: text }]}>{title}</Text>
        {highlight ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>{highlight}</Text>
          </View>
        ) : null}
        {subtitle ? <Text style={[styles.subtitle, { color: sub }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttons: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 44,
    letterSpacing: -0.6,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: Illo.amber,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginTop: 4,
    transform: [{ rotate: '-3deg' }],
  },
  pillText: {
    color: Illo.ink,
    fontSize: 38,
    fontWeight: '800',
    lineHeight: 46,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 23,
    marginTop: 14,
  },
});
