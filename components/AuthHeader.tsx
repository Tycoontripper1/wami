import { Ionicons } from '@/components/FlatIcon';
import ToolsScatter from '@/components/ToolsScatter';
import { Illo } from '@/constants/Illustration';
import React, { useEffect, useRef } from 'react';
import {
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
// inset + 20px at the top; the header cancels that so the scene runs edge to edge.
const SIDE = 24;
const TOP_GAP = 20;
const BUTTON_ZONE = 52; // room for the back button below the status bar

/**
 * Top of the sign-in / sign-up / password screens: the same Wami-pin-and-tools
 * scene as the welcome screen, then a big headline with one highlighted word
 * and a plain subtitle. The scene folds away while the keyboard is open.
 */
export default function AuthHeader({ title, highlight, subtitle, onBack, onClose, compact, forceLight }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isDark = useColorScheme() === 'dark' && !forceLight;
  const fold = useRef(new Animated.Value(1)).current; // 1 = scene open, 0 = folded

  useEffect(() => {
    const animate = (to: number) =>
      Animated.timing(fold, { toValue: to, duration: 170, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    const show = Keyboard.addListener('keyboardDidShow', () => animate(0));
    const hide = Keyboard.addListener('keyboardDidHide', () => animate(1));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [fold]);

  // The scene takes a share of the screen so the form always fits beneath it.
  const sceneHeight = Math.round(Math.min(compact ? 230 : 330, height * (compact ? 0.24 : 0.33)));

  const text = isDark ? '#FFFFFF' : '#0F1419';
  const sub = isDark ? '#B8C0C8' : '#5A646E';
  const buttonBg = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,20,25,0.06)';
  const topZone = insets.top + BUTTON_ZONE;

  return (
    <View style={{ marginHorizontal: -SIDE, marginTop: -(insets.top + TOP_GAP), marginBottom: 12 }}>
      <Animated.View
        style={{
          height: fold.interpolate({ inputRange: [0, 1], outputRange: [topZone, topZone + sceneHeight] }),
          overflow: 'hidden',
        }}
      >
        <Animated.View style={{ position: 'absolute', top: topZone, left: 0, right: 0, opacity: fold }}>
          <ToolsScatter width={width} height={sceneHeight} compact={compact} />
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
    zIndex: 10,
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
