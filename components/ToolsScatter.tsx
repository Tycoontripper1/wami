import CreativeTool, { ToolName } from '@/components/illustrations/CreativeTools';
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';

/* One composition used on the welcome screen and at the top of every auth
   screen: the Wami pin as a character in the middle, and the tools creatives
   work with packed tightly around it, overlapping, like a sticker sheet. */

type Piece = {
  name: ToolName;
  /** Centre, as a fraction of the width / in design px of a 340-tall field. */
  cx: number;
  cy: number;
  size: number;
  rotate: number;
  z: number;
  /** Kept in the smaller "compact" version. */
  core?: boolean;
};

const DESIGN_W = 390;
const DESIGN_H = 340;

const PIECES: Piece[] = [
  { name: 'pencil', cx: 0.27, cy: 40, size: 58, rotate: -20, z: 1 },
  { name: 'scissors', cx: 0.5, cy: 44, size: 80, rotate: 10, z: 1, core: true },
  { name: 'clapper', cx: 0.86, cy: 34, size: 62, rotate: 10, z: 1 },
  { name: 'camera', cx: 0.2, cy: 112, size: 110, rotate: -12, z: 3, core: true },
  { name: 'palette', cx: 0.8, cy: 106, size: 106, rotate: 9, z: 3, core: true },
  { name: 'pin', cx: 0.5, cy: 170, size: 142, rotate: 0, z: 6, core: true },
  { name: 'spool', cx: 0.1, cy: 222, size: 88, rotate: -10, z: 2 },
  { name: 'brush', cx: 0.89, cy: 214, size: 92, rotate: 20, z: 2, core: true },
  { name: 'comb', cx: 0.29, cy: 274, size: 84, rotate: -8, z: 4 },
  { name: 'bulb', cx: 0.74, cy: 272, size: 78, rotate: 8, z: 4, core: true },
  { name: 'headphones', cx: 0.52, cy: 304, size: 74, rotate: 6, z: 5 },
  { name: 'lipstick', cx: 0.11, cy: 78, size: 50, rotate: -14, z: 1 },
  { name: 'heart', cx: 0.67, cy: 228, size: 40, rotate: -10, z: 7 },
  { name: 'coin', cx: 0.36, cy: 226, size: 34, rotate: 0, z: 7 },
];

function Floating({ piece, k, width, index, still }: { piece: Piece; k: number; width: number; index: number; still: boolean }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (still) {
      drift.setValue(0);
      return;
    }
    const half = 2300 + (index % 5) * 330;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: half, delay: (index % 4) * 200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: half, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [still, index]);

  const size = piece.size * k;
  const sway = index % 2 === 0 ? 4 : -4;
  // the pin is the character: it bobs a little more than the rest
  const lift = piece.name === 'pin' ? 8 : 5;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: piece.cx * width - size / 2,
        top: piece.cy * k - size / 2,
        zIndex: piece.z,
        transform: [
          { translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -lift * k] }) },
          {
            rotate: drift.interpolate({
              inputRange: [0, 1],
              outputRange: [`${piece.rotate}deg`, `${piece.rotate + (piece.name === 'pin' ? 0 : sway)}deg`],
            }),
          },
        ],
      }}
    >
      <CreativeTool name={piece.name} size={size} />
    </Animated.View>
  );
}

type Props = {
  width: number;
  height: number;
  /** Fewer pieces, for screens with a lot of fields. */
  compact?: boolean;
};

export default function ToolsScatter({ width, height, compact }: Props) {
  const [still, setStill] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v) => mounted && setStill(v));
    return () => {
      mounted = false;
    };
  }, []);

  // One uniform scale, so shapes never stretch; the composition is centred.
  const k = Math.min(width / DESIGN_W, height / DESIGN_H);
  const pieces = compact ? PIECES.filter((p) => p.core) : PIECES;

  return (
    <View style={{ width, height, overflow: 'visible' }} pointerEvents="none">
      {pieces.map((piece, i) => (
        <Floating key={piece.name} piece={piece} k={k} width={width} index={i} still={still} />
      ))}
    </View>
  );
}
