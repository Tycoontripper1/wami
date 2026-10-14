import { Illo } from '@/constants/Illustration';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

/* Flat, outline-free scenes. Depth comes from a lit face and a shaded face of
   the same colour; every scene is drawn on a 240×180 grid and scales to any
   width. They are decorative, so they are hidden from screen readers. */

export type IllustrationName =
  | 'town'
  | 'calendar'
  | 'chat'
  | 'bag'
  | 'bell'
  | 'heart'
  | 'offline'
  | 'search'
  | 'check';

const c = Illo;

/* ── small parts ─────────────────────────────────────────────────────────── */

function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${s})`}>
      <Ellipse cx={-8} cy={-26} rx={6} ry={14} fill={c.leaf} transform="rotate(-22 -8 -26)" />
      <Ellipse cx={8} cy={-27} rx={6} ry={15} fill={c.leafLight} transform="rotate(20 8 -27)" />
      <Ellipse cx={0} cy={-31} rx={6} ry={17} fill={c.leaf} />
      <Path d="M-12 -14 H12 L8 0 H-8 Z" fill={c.ember} />
      <Rect x={-14} y={-18} width={28} height={6} rx={2} fill={c.brown} />
    </G>
  );
}

function Windows({ x, y, cols, rows, step = 22 }: { x: number; y: number; cols: number; rows: number; step?: number }) {
  const cells: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let col = 0; col < cols; col++) {
      const warm = (r * 3 + col * 2) % 5 === 0;
      cells.push(
        <Rect key={`${r}-${col}`} x={x + col * step} y={y + r * step} width={12} height={14} rx={3} fill={warm ? c.cloud : c.glass} />,
      );
    }
  }
  return <G>{cells}</G>;
}

function Shop({ x, top, w, side, lit, shade, roof }: { x: number; top: number; w: number; side: number; lit: string; shade: string; roof: string }) {
  const h = 150 - top;
  return (
    <G>
      <Rect x={x} y={top} width={w} height={h} fill={lit} />
      <Rect x={x + w} y={top} width={side} height={h} fill={shade} />
      <Rect x={x - 4} y={top - 7} width={w + side + 8} height={7} rx={2} fill={roof} />
    </G>
  );
}

function Awning({ x, y, w }: { x: number; y: number; w: number }) {
  const n = Math.max(2, Math.round(w / 11));
  const sw = w / n;
  return (
    <G>
      {Array.from({ length: n }, (_, i) => (
        <Rect key={i} x={x + i * sw} y={y} width={sw} height={9} fill={i % 2 ? c.cloud : c.ember} />
      ))}
    </G>
  );
}

/* ── scenes ──────────────────────────────────────────────────────────────── */

function Town() {
  return (
    <G>
      <Shop x={22} top={104} w={34} side={12} lit={c.tealDeep} shade={c.tealNight} roof={c.tealLight} />
      <Shop x={188} top={100} w={30} side={10} lit={c.tealDeep} shade={c.tealNight} roof={c.tealLight} />

      {/* the tall tower is Wami: a pin on top */}
      <Shop x={92} top={50} w={56} side={18} lit={c.teal} shade={c.tealDeep} roof={c.tealLight} />
      <Rect x={104} y={30} width={32} height={20} fill={c.tealLight} />
      <Rect x={136} y={30} width={10} height={20} fill={c.teal} />
      <Windows x={104} y={64} cols={2} rows={3} step={24} />
      <Rect x={112} y={126} width={16} height={24} rx={8} fill={c.tealNight} />
      <G transform="translate(120 30)">
        <Path d="M0 0 L-9 -14 A11 11 0 1 1 9 -14 Z" fill={c.ink} />
        <Circle cx={0} cy={-19} r={4} fill={c.amber} />
      </G>

      {/* the amber shop */}
      <Shop x={42} top={82} w={42} side={12} lit={c.amber} shade={c.ember} roof={c.cloud} />
      <Rect x={52} y={92} width={22} height={18} rx={3} fill={c.cloud} />
      <Awning x={42} y={118} w={42} />
      <Rect x={55} y={128} width={16} height={22} rx={8} fill={c.tealNight} />
      <G transform="translate(63 82)">
        <Path d="M0 0 L-6 -10 A8 8 0 1 1 6 -10 Z" fill={c.paper} />
        <Circle cx={0} cy={-14} r={3} fill={c.ember} />
      </G>

      {/* the right shop */}
      <Shop x={162} top={92} w={42} side={0} lit={c.coral} shade={c.coralDeep} roof={c.cloud} />
      <Rect x={170} y={102} width={26} height={16} rx={3} fill={c.glass} />
      <Rect x={174} y={128} width={18} height={22} rx={9} fill={c.tealNight} />

      <Plant x={86} y={150} s={0.9} />
      <Plant x={158} y={150} s={0.8} />
      <Ellipse cx={120} cy={152} rx={108} ry={7} fill={c.ink} opacity={0.1} />
    </G>
  );
}

function Calendar() {
  return (
    <G>
      <Rect x={68} y={52} width={124} height={104} rx={14} fill={c.tealDeep} />
      <Rect x={60} y={44} width={124} height={104} rx={14} fill={c.paper} />
      <Rect x={60} y={44} width={124} height={30} rx={14} fill={c.teal} />
      <Rect x={60} y={58} width={124} height={16} fill={c.teal} />
      <Rect x={88} y={32} width={9} height={24} rx={4.5} fill={c.ink} />
      <Rect x={147} y={32} width={9} height={24} rx={4.5} fill={c.ink} />
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <Rect key={`${row}-${col}`} x={76 + col * 26} y={86 + row * 20} width={16} height={12} rx={4} fill={c.glass} />
        )),
      )}
      <Circle cx={160} cy={98} r={13} fill={c.amber} />
      <Path d="M153 98 L158 103 L167 92" stroke={c.ink} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Plant x={206} y={154} s={0.9} />
      <Ellipse cx={120} cy={156} rx={100} ry={6} fill={c.ink} opacity={0.1} />
    </G>
  );
}

function Chat() {
  return (
    <G>
      <Rect x={46} y={44} width={132} height={78} rx={24} fill={c.tealDeep} />
      <Path d="M70 118 L62 146 L100 118 Z" fill={c.tealDeep} />
      <Rect x={40} y={38} width={132} height={78} rx={24} fill={c.teal} />
      <Path d="M64 112 L56 140 L94 112 Z" fill={c.teal} />
      {[78, 106, 134].map((x) => (
        <Circle key={x} cx={x} cy={77} r={8} fill={c.paper} />
      ))}
      <Rect x={128} y={104} width={80} height={48} rx={18} fill={c.ember} />
      <Path d="M186 150 L196 168 L170 150 Z" fill={c.ember} />
      <Rect x={124} y={100} width={80} height={48} rx={18} fill={c.amber} />
      <Path d="M182 146 L192 164 L166 146 Z" fill={c.amber} />
      <Rect x={140} y={114} width={50} height={7} rx={3.5} fill={c.paper} />
      <Rect x={140} y={128} width={32} height={7} rx={3.5} fill={c.cloud} />
    </G>
  );
}

function Bag() {
  return (
    <G>
      <Path d="M92 72 V58 A28 28 0 0 1 148 58 V72" stroke={c.tealDeep} strokeWidth={9} strokeLinecap="round" fill="none" />
      <Path d="M66 72 H174 L184 146 Q185 156 175 156 H65 Q55 156 56 146 Z" fill={c.amber} />
      <Path d="M132 72 H174 L184 146 Q185 156 175 156 H146 Z" fill={c.ember} />
      <Circle cx={112} cy={108} r={22} fill={c.paper} />
      <G transform="translate(112 118)">
        <Path d="M0 0 L-8 -13 A10 10 0 1 1 8 -13 Z" fill={c.teal} />
        <Circle cx={0} cy={-17} r={3.5} fill={c.paper} />
      </G>
      <Circle cx={200} cy={138} r={11} fill={c.cloud} />
      <Circle cx={40} cy={126} r={8} fill={c.teal} />
      <Ellipse cx={120} cy={160} rx={86} ry={6} fill={c.ink} opacity={0.1} />
    </G>
  );
}

function Bell() {
  return (
    <G>
      <Circle cx={120} cy={34} r={8} fill={c.ember} />
      <Path d="M120 40 C92 40 80 62 80 88 V108 L68 124 H172 L160 108 V88 C160 62 148 40 120 40 Z" fill={c.amber} />
      <Path d="M120 40 C148 40 160 62 160 88 V108 L172 124 H120 Z" fill={c.ember} />
      <Ellipse cx={120} cy={136} rx={15} ry={10} fill={c.tealDeep} />
      <Circle cx={158} cy={52} r={15} fill={c.coral} />
      <Circle cx={158} cy={52} r={5} fill={c.paper} />
      <Circle cx={52} cy={70} r={6} fill={c.teal} />
      <Circle cx={196} cy={112} r={5} fill={c.cloud} />
      <Ellipse cx={120} cy={158} rx={70} ry={6} fill={c.ink} opacity={0.1} />
    </G>
  );
}

function Heart() {
  return (
    <G>
      <Path d="M120 146 C58 104 50 68 78 52 C98 40 114 50 120 64 C126 50 142 40 162 52 C190 68 182 104 120 146 Z" fill={c.coral} />
      <Path d="M120 64 C126 50 142 40 162 52 C190 68 182 104 120 146 Z" fill={c.coralDeep} />
      <Ellipse cx={86} cy={66} rx={9} ry={5} fill={c.paper} opacity={0.55} transform="rotate(-35 86 66)" />
      <Circle cx={190} cy={44} r={7} fill={c.teal} />
      <Circle cx={50} cy={122} r={6} fill={c.amber} />
      <Circle cx={204} cy={106} r={4} fill={c.tealLight} />
      <Ellipse cx={120} cy={160} rx={60} ry={5} fill={c.ink} opacity={0.1} />
    </G>
  );
}

function Offline() {
  return (
    <G>
      <Circle cx={92} cy={96} r={24} fill={c.tealDeep} />
      <Circle cx={126} cy={80} r={34} fill={c.tealDeep} />
      <Circle cx={162} cy={98} r={22} fill={c.tealDeep} />
      <Rect x={92} y={96} width={72} height={26} rx={13} fill={c.tealDeep} />
      <Circle cx={92} cy={90} r={24} fill={c.teal} />
      <Circle cx={126} cy={74} r={34} fill={c.teal} />
      <Circle cx={162} cy={92} r={22} fill={c.teal} />
      <Rect x={92} y={90} width={72} height={26} rx={13} fill={c.teal} />
      <Circle cx={168} cy={120} r={24} fill={c.amber} />
      <Rect x={164.5} y={105} width={7} height={17} rx={3.5} fill={c.ink} />
      <Circle cx={168} cy={131} r={4} fill={c.ink} />
      <Circle cx={52} cy={60} r={6} fill={c.cloud} />
      <Circle cx={198} cy={52} r={5} fill={c.tealLight} />
      <Ellipse cx={120} cy={158} rx={72} ry={6} fill={c.ink} opacity={0.1} />
    </G>
  );
}

function Search() {
  return (
    <G>
      <Rect x={58} y={46} width={104} height={100} rx={14} fill={c.tealDeep} />
      <Rect x={52} y={40} width={104} height={100} rx={14} fill={c.paper} />
      <Circle cx={80} cy={66} r={11} fill={c.amber} />
      <Rect x={100} y={58} width={44} height={7} rx={3.5} fill={c.glass} />
      <Rect x={100} y={72} width={30} height={7} rx={3.5} fill={c.glass} />
      <Rect x={68} y={96} width={72} height={7} rx={3.5} fill={c.glass} />
      <Rect x={68} y={112} width={50} height={7} rx={3.5} fill={c.glass} />
      <Path d="M168 122 L196 150" stroke={c.ember} strokeWidth={13} strokeLinecap="round" />
      <Circle cx={152} cy={104} r={30} fill={c.glass} opacity={0.92} />
      <Circle cx={152} cy={104} r={30} stroke={c.teal} strokeWidth={10} fill="none" />
      <Ellipse cx={140} cy={92} rx={8} ry={4} fill={c.paper} opacity={0.7} transform="rotate(-35 140 92)" />
    </G>
  );
}

function Check() {
  return (
    <G>
      <Circle cx={120} cy={90} r={54} fill={c.tealDeep} />
      <Circle cx={120} cy={84} r={54} fill={c.teal} />
      <Path d="M94 86 L113 105 L148 66" stroke={c.paper} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={52} cy={52} r={8} fill={c.amber} />
      <Rect x={184} y={42} width={16} height={16} rx={4} fill={c.coral} transform="rotate(20 192 50)" />
      <Circle cx={196} cy={120} r={7} fill={c.lilac} />
      <Rect x={40} y={118} width={14} height={14} rx={4} fill={c.lime} transform="rotate(-18 47 125)" />
      <Circle cx={170} cy={150} r={5} fill={c.cloud} />
      <Circle cx={72} cy={150} r={4} fill={c.tealLight} />
    </G>
  );
}

const scenes: Record<IllustrationName, () => React.JSX.Element> = {
  town: Town,
  calendar: Calendar,
  chat: Chat,
  bag: Bag,
  bell: Bell,
  heart: Heart,
  offline: Offline,
  search: Search,
  check: Check,
};

// Decorative: keep it out of the accessibility tree. The prop names differ by
// platform, and passing the native ones to the DOM logs unknown-prop warnings.
const hiddenFromAssistiveTech: Record<string, unknown> =
  Platform.OS === 'web'
    ? { 'aria-hidden': true }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' };

type Props = {
  name: IllustrationName;
  /** Width in px; height follows the 4:3 grid. */
  width?: number;
  /** A soft round backdrop behind the scene. Omit when it sits on a bold colour. */
  tint?: string;
  /** Use the standard soft backdrop for the current light/dark scheme. */
  soft?: boolean;
};

export default function FlatIllustration({ name, width = 200, tint, soft }: Props) {
  const Scene = scenes[name];
  const isDark = useColorScheme() === 'dark';
  const backdrop = tint ?? (soft ? (isDark ? '#12333B' : '#E3F7FA') : undefined);
  return (
    <Svg width={width} height={(width * 180) / 240} viewBox="0 0 240 180" {...hiddenFromAssistiveTech}>
      {backdrop ? <Circle cx={120} cy={92} r={80} fill={backdrop} /> : null}
      <Scene />
    </Svg>
  );
}
