import { Ionicons as VectorIonicons } from '@expo/vector-icons';
import React, { useId } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Defs, G, Mask, Path, Rect } from 'react-native-svg';

/* Drop-in replacement for Ionicons with flat, two-tone glyphs.

   Same `name` / `size` / `color` / `style` API, so call sites don't change and
   every screen keeps the colour it already picks for its own contrast. A glyph
   is one flat colour in two values: a full face and a shaded face (the same
   colour at half strength), with details knocked out so the background shows
   through. Names without a drawing here fall back to the original Ionicons.

   Import it as `import { Ionicons } from '@/components/FlatIcon'`. */

type IoniconName = React.ComponentProps<typeof VectorIonicons>['name'];

type Props = {
  name: IoniconName;
  size?: number;
  color?: string;
  /** Second colour: the shaded faces of a glyph use it instead of a faded `color`. */
  accent?: string;
  style?: StyleProp<ViewStyle>;
};

type Glyph = {
  /** The visible shapes, in the icon colour. */
  draw: (c: string) => React.ReactNode;
  /** Shapes knocked out of `draw` (drawn black into a mask). */
  cut?: React.ReactNode;
  /** Shapes drawn on top, after the knock-out. */
  over?: (c: string) => React.ReactNode;
};

const SHADE = 0.5;
const K = { fill: '#000' } as const; // knock-out fill

// Set for the duration of one glyph's `draw`/`over` call (both run synchronously
// inside FlatIcon's render): shaded parts then take this colour at full strength.
let ACCENT: string | undefined;

/** Props for a shaded shape drawn directly (not through `face`/`line`). */
const sh = (c: string) => ({ fill: ACCENT ?? c, opacity: ACCENT ? 1 : SHADE });

const line = (d: string, c: string, w = 2.6, o = 1) => (
  <Path
    d={d}
    fill="none"
    stroke={o < 1 && ACCENT ? ACCENT : c}
    strokeWidth={w}
    strokeLinecap="round"
    strokeLinejoin="round"
    opacity={o < 1 && ACCENT ? 1 : o}
  />
);
const cutLine = (d: string, w = 2.4) => (
  <Path d={d} fill="none" stroke="#000" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);
const face = (d: string, c: string, o = 1) => (
  <Path d={d} fill={o < 1 && ACCENT ? ACCENT : c} opacity={o < 1 && ACCENT ? 1 : o} />
);

/** A symmetric pair: full left half, shaded right half. */
const halves = (left: string, right: string, c: string) => (
  <>
    {face(left, c)}
    {face(right, c, SHADE)}
  </>
);

const glyphs: Record<string, Glyph> = {
  /* strokes */
  // Bold, rounded, with a 45° head: reads cleanly without a button behind it.
  'arrow-back': { draw: (c) => line('M21.5 12 H2.6 M9.1 5.5 L2.6 12 L9.1 18.5', c, 2.9) },
  'arrow-forward': { draw: (c) => line('M4.5 12 H18.5 M12.8 5.8 L19 12 L12.8 18.2', c) },
  'arrow-up': { draw: (c) => line('M12 19.5 V5.5 M5.8 11.2 L12 5 L18.2 11.2', c) },
  'arrow-down': { draw: (c) => line('M12 4.5 V18.5 M5.8 12.8 L12 19 L18.2 12.8', c) },
  'chevron-forward': { draw: (c) => line('M9 5.5 L15.5 12 L9 18.5', c, 2.8) },
  'chevron-back': { draw: (c) => line('M15 5.5 L8.5 12 L15 18.5', c, 2.8) },
  'chevron-down': { draw: (c) => line('M5.5 9 L12 15.5 L18.5 9', c, 2.8) },
  'chevron-up': { draw: (c) => line('M5.5 15 L12 8.5 L18.5 15', c, 2.8) },
  close: { draw: (c) => line('M6 6 L18 18 M18 6 L6 18', c, 2.8) },
  checkmark: { draw: (c) => line('M5 12.6 L10 17.6 L19 7', c, 3) },
  add: { draw: (c) => line('M12 5 V19 M5 12 H19', c, 2.8) },

  /* search, eyes */
  search: {
    draw: (c) => (
      <>
        <Circle cx={10.5} cy={10.5} r={6.3} fill={c} opacity={0.4} />
        <Circle cx={10.5} cy={10.5} r={6.3} fill="none" stroke={c} strokeWidth={2.6} />
        {line('M15.4 15.4 L20.5 20.5', c, 3.2)}
      </>
    ),
  },
  eye: {
    draw: (c) => (
      <>
        {face('M1.8 12 C4.8 6.8 8.2 5 12 5 C15.8 5 19.2 6.8 22.2 12 C19.2 17.2 15.8 19 12 19 C8.2 19 4.8 17.2 1.8 12 Z', c, 0.4)}
        <Circle cx={12} cy={12} r={4} fill={c} />
      </>
    ),
  },
  'eye-off': {
    draw: (c) => (
      <>
        {face('M1.8 12 C4.8 6.8 8.2 5 12 5 C15.8 5 19.2 6.8 22.2 12 C19.2 17.2 15.8 19 12 19 C8.2 19 4.8 17.2 1.8 12 Z', c, 0.4)}
        <Circle cx={12} cy={12} r={4} fill={c} />
        {line('M4.5 4.5 L19.5 19.5', c, 2.8)}
      </>
    ),
  },

  /* people */
  person: {
    draw: (c) => (
      <>
        <Circle cx={12} cy={8} r={4.3} fill={c} />
        {halves('M4 21.5 C4 17 7.6 14.4 12 14.4 V21.5 Z', 'M12 14.4 C16.4 14.4 20 17 20 21.5 H12 Z', c)}
      </>
    ),
  },
  'person-circle': {
    draw: (c) => <Circle cx={12} cy={12} r={10.5} fill={c} />,
    cut: (
      <>
        <Circle cx={12} cy={9.6} r={3.2} {...K} />
        <Path d="M5.8 19 C6.8 15.8 9.2 14.4 12 14.4 C14.8 14.4 17.2 15.8 18.2 19 C16.6 20.6 14.4 21.3 12 21.3 C9.6 21.3 7.4 20.6 5.8 19 Z" {...K} />
      </>
    ),
  },

  /* symbols */
  star: {
    draw: (c) =>
      halves(
        'M12 2.6 L9.1 9 L2.2 9.8 L7.3 14.5 L5.9 21.4 L12 17.9 Z',
        'M12 2.6 L14.9 9 L21.8 9.8 L16.7 14.5 L18.1 21.4 L12 17.9 Z',
        c,
      ),
  },
  heart: {
    draw: (c) =>
      halves(
        'M12 21 C5.5 16.2 2.5 12.4 2.5 8.6 C2.5 5.6 4.7 3.6 7.3 3.6 C9.2 3.6 11 4.6 12 6.4 Z',
        'M12 21 C18.5 16.2 21.5 12.4 21.5 8.6 C21.5 5.6 19.3 3.6 16.7 3.6 C14.8 3.6 13 4.6 12 6.4 Z',
        c,
      ),
  },
  bookmark: {
    draw: (c) => halves('M12 17.5 L5.5 21.5 V4.5 A2 2 0 0 1 7.5 2.5 H12 Z', 'M12 17.5 L18.5 21.5 V4.5 A2 2 0 0 0 16.5 2.5 H12 Z', c),
  },
  location: {
    draw: (c) =>
      halves(
        'M12 22 C12 22 4.6 14.6 4.6 9.6 A7.4 7.4 0 0 1 12 2.2 Z',
        'M12 2.2 A7.4 7.4 0 0 1 19.4 9.6 C19.4 14.6 12 22 12 22 Z',
        c,
      ),
    cut: <Circle cx={12} cy={9.6} r={2.8} {...K} />,
  },
  locate: {
    draw: (c) => (
      <>
        <Circle cx={12} cy={12} r={7} fill="none" stroke={c} strokeWidth={2.4} />
        <Circle cx={12} cy={12} r={3} fill={c} />
        {line('M12 2.2 V5 M12 19 V21.8 M2.2 12 H5 M19 12 H21.8', c, 2.4)}
      </>
    ),
  },
  navigate: {
    draw: (c) => (
      <>
        {face('M2.8 11.2 L21.2 2.8 L11.4 13 Z', c)}
        {face('M21.2 2.8 L12.8 21.2 L11.4 13 Z', c, SHADE)}
      </>
    ),
  },

  /* money */
  card: {
    draw: (c) => (
      <>
        {face('M2.5 8.5 A3.5 3.5 0 0 1 6 5 H18 A3.5 3.5 0 0 1 21.5 8.5 V9.5 H2.5 Z', c)}
        <Rect x={2.5} y={9.5} width={19} height={3.4} {...sh(c)} />
        {face('M2.5 12.9 H21.5 V15.5 A3.5 3.5 0 0 1 18 19 H6 A3.5 3.5 0 0 1 2.5 15.5 Z', c)}
      </>
    ),
  },
  cash: {
    draw: (c) => <Rect x={2} y={6} width={20} height={12} rx={3.2} fill={c} />,
    cut: (
      <>
        <Circle cx={12} cy={12} r={3} {...K} />
        <Circle cx={5.8} cy={12} r={1} {...K} />
        <Circle cx={18.2} cy={12} r={1} {...K} />
      </>
    ),
  },
  wallet: {
    draw: (c) => <Rect x={2.5} y={5.5} width={19} height={14} rx={3.4} fill={c} />,
    cut: <Rect x={13.6} y={10} width={9} height={6} rx={3} {...K} />,
    over: (c) => (
      <>
        <Rect x={13.6} y={10} width={8.2} height={6} rx={3} {...sh(c)} />
        <Circle cx={17.4} cy={13} r={1.2} fill={c} />
      </>
    ),
  },

  /* time, media */
  calendar: {
    draw: (c) => (
      <>
        {face('M3 8.5 A3.5 3.5 0 0 1 6.5 5 H17.5 A3.5 3.5 0 0 1 21 8.5 V10 H3 Z', c)}
        {face('M3 10 H21 V17.5 A3.5 3.5 0 0 1 17.5 21 H6.5 A3.5 3.5 0 0 1 3 17.5 Z', c, SHADE)}
        <Rect x={7} y={2.4} width={2.2} height={5} rx={1.1} fill={c} />
        <Rect x={14.8} y={2.4} width={2.2} height={5} rx={1.1} fill={c} />
      </>
    ),
  },
  time: {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: cutLine('M12 6.8 V12 L15.6 14.2', 2.4),
    // Two-tone: the hands take the accent (a faded hand on the same disc would vanish).
    over: (c) => (ACCENT ? line('M12 6.8 V12 L15.6 14.2', c, 2.4, SHADE) : null),
  },
  camera: {
    draw: (c) => <Rect x={2.5} y={7} width={19} height={13} rx={3.4} fill={c} />,
    cut: <Circle cx={12} cy={13.5} r={4.2} {...K} />,
    over: (c) => (
      <>
        <Rect x={8.2} y={3.8} width={7.6} height={4.6} rx={1.6} {...sh(c)} />
        <Circle cx={12} cy={13.5} r={2} {...sh(c)} />
      </>
    ),
  },
  image: {
    draw: (c) =>
      face('M3 7 A3 3 0 0 1 6 4 H18 A3 3 0 0 1 21 7 V14 L17 10.5 L13.4 14.4 L9 9.2 L3 15.6 Z', c),
    cut: <Circle cx={7.6} cy={7.8} r={1.9} {...K} />,
    over: (c) =>
      face('M3 15.6 L9 9.2 L13.4 14.4 L17 10.5 L21 14 V17 A3 3 0 0 1 18 20 H6 A3 3 0 0 1 3 17 Z', c, SHADE),
  },
  'logo-instagram': {
    draw: (c) => <Rect x={3} y={3} width={18} height={18} rx={5.6} fill={c} />,
    cut: (
      <>
        <Circle cx={12} cy={12} r={4.2} {...K} />
        <Circle cx={17.4} cy={6.6} r={1.3} {...K} />
      </>
    ),
    over: () =>
      ACCENT ? (
        <>
          <Circle cx={12} cy={12} r={2.2} fill={ACCENT} />
          <Circle cx={17.4} cy={6.6} r={1} fill={ACCENT} />
        </>
      ) : null,
  },
  send: {
    draw: (c) => (
      <>
        {face('M2.8 11.2 L21.2 2.8 L11.4 13 Z', c)}
        {face('M21.2 2.8 L12.8 21.2 L11.4 13 Z', c, SHADE)}
      </>
    ),
  },

  /* things */
  trash: {
    draw: (c) => (
      <>
        {face('M6 8.4 H18 L17 19.8 A2 2 0 0 1 15 21.6 H9 A2 2 0 0 1 7 19.8 Z', c)}
        <Rect x={4} y={4.8} width={16} height={2.6} rx={1.3} {...sh(c)} />
        <Rect x={9.4} y={2.4} width={5.2} height={2.6} rx={1} {...sh(c)} />
      </>
    ),
  },
  business: {
    draw: (c) => <Rect x={4.5} y={3} width={15} height={18} rx={2} fill={c} />,
    cut: (
      <>
        {[6, 10, 14].map((y) => (
          <React.Fragment key={y}>
            <Rect x={7.4} y={y} width={3.4} height={2.6} rx={0.6} {...K} />
            <Rect x={13.2} y={y} width={3.4} height={2.6} rx={0.6} {...K} />
          </React.Fragment>
        ))}
        <Rect x={10.3} y={17} width={3.4} height={4} {...K} />
      </>
    ),
  },
  pricetag: {
    draw: (c) => face('M3 11.6 V4.5 A1.5 1.5 0 0 1 4.5 3 H11.6 L21 12.4 L12.4 21 Z', c),
    cut: <Circle cx={7.7} cy={7.7} r={1.7} {...K} />,
  },
  bag: {
    draw: (c) => (
      <>
        {line('M8.5 9 V7.4 a3.5 3.5 0 0 1 7 0 V9', c, 2, SHADE)}
        {halves(
          'M4.6 9 H12 V21.7 H5.2 a1.6 1.6 0 0 1 -1.6 -1.7 Z',
          'M12 9 H19.4 L20.4 20 a1.6 1.6 0 0 1 -1.6 1.7 H12 Z',
          c,
        )}
      </>
    ),
  },
  chatbubble: {
    draw: (c) => (
      <>
        <Rect x={2.5} y={3.5} width={19} height={14} rx={5.5} fill={c} />
        {face('M7.5 17 L6.2 21.5 L12.8 17 Z', c)}
      </>
    ),
  },
  'chatbubble-ellipses': {
    draw: (c) => (
      <>
        <Rect x={2.5} y={3.5} width={19} height={14} rx={5.5} fill={c} />
        {face('M7.5 17 L6.2 21.5 L12.8 17 Z', c)}
      </>
    ),
    cut: (
      <>
        <Circle cx={8} cy={10.5} r={1.4} {...K} />
        <Circle cx={12} cy={10.5} r={1.4} {...K} />
        <Circle cx={16} cy={10.5} r={1.4} {...K} />
      </>
    ),
  },
  'information-circle': {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: (
      <>
        <Circle cx={12} cy={7.6} r={1.4} {...K} />
        <Rect x={10.9} y={10.4} width={2.2} height={6.8} rx={1.1} {...K} />
      </>
    ),
  },
  'lock-closed': {
    draw: (c) => (
      <>
        {line('M8 10.5 V8 a4 4 0 0 1 8 0 V10.5', c, 2.6, SHADE)}
        <Rect x={4.8} y={10.5} width={14.4} height={10.5} rx={3} fill={c} />
      </>
    ),
    cut: <Circle cx={12} cy={15.2} r={1.6} {...K} />,
  },
  shield: {
    draw: (c) =>
      halves(
        'M12 2.4 L4.2 5.6 V11 C4.2 16 7.6 19.6 12 21.6 Z',
        'M12 2.4 L19.8 5.6 V11 C19.8 16 16.4 19.6 12 21.6 Z',
        c,
      ),
  },
  notifications: {
    draw: (c) => (
      <>
        {halves(
          'M12 2.6 C8.4 2.6 6 5.4 6 9 V13.4 L3.8 16.6 H12 Z',
          'M12 2.6 C15.6 2.6 18 5.4 18 9 V13.4 L20.2 16.6 H12 Z',
          c,
        )}
        {face('M9.2 18.8 A2.8 2.8 0 0 0 14.8 18.8 Z', c)}
      </>
    ),
  },
  settings: {
    draw: (c) => (
      <>
        <Circle cx={12} cy={12} r={6.4} fill={c} />
        {[0, 45, 90, 135].map((a) => (
          <Rect key={a} x={10.4} y={1.8} width={3.2} height={20.4} rx={1.2} fill={c} transform={`rotate(${a} 12 12)`} />
        ))}
      </>
    ),
    cut: <Circle cx={12} cy={12} r={2.6} {...K} />,
  },
  home: {
    draw: (c) =>
      halves(
        'M12 2.8 L2.8 11.2 H5 V19.5 A1.5 1.5 0 0 0 6.5 21 H12 Z',
        'M12 2.8 L21.2 11.2 H19 V19.5 A1.5 1.5 0 0 1 17.5 21 H12 Z',
        c,
      ),
    cut: <Rect x={10} y={14.4} width={4} height={6.6} rx={2} {...K} />,
  },
  'color-palette': {
    draw: (c) =>
      face(
        'M12 2.5 C6.5 2.5 2.5 6.5 2.5 12 C2.5 17.5 6.5 21.5 12 21.5 C13.6 21.5 14.5 20.5 14.5 19.3 C14.5 17.9 13.5 17.5 13.5 16.3 C13.5 15.3 14.3 14.5 15.3 14.5 H18.5 C20.4 14.5 21.5 13 21.5 12 C21.5 6.5 17.5 2.5 12 2.5 Z',
        c,
      ),
    cut: (
      <>
        <Circle cx={7.4} cy={11.4} r={1.6} {...K} />
        <Circle cx={10} cy={7} r={1.6} {...K} />
        <Circle cx={15} cy={7} r={1.6} {...K} />
      </>
    ),
  },

  /* ── the rest ───────────────────────────────────────────────────────────── */
  'cloud-offline': {
    draw: (c) => face('M7 18.5 A4.5 4.5 0 0 1 6.5 9.6 A6 6 0 0 1 18 8.6 A4.9 4.9 0 0 1 17.5 18.5 Z', c),
    cut: cutLine('M3.8 3.8 L20.2 20.2', 3.6),
    over: (c) => line('M4.6 4.6 L19.4 19.4', c, 2.2),
  },
  analytics: {
    draw: (c) => (
      <>
        <Rect x={3} y={13} width={4.6} height={8} rx={1.4} fill={c} />
        <Rect x={9.7} y={8} width={4.6} height={13} rx={1.4} {...sh(c)} />
        <Rect x={16.4} y={3} width={4.6} height={18} rx={1.4} fill={c} />
      </>
    ),
  },
  bicycle: {
    draw: (c) => (
      <>
        <Circle cx={6} cy={16.5} r={4.2} fill={c} opacity={0.35} />
        <Circle cx={18} cy={16.5} r={4.2} fill={c} opacity={0.35} />
        <Circle cx={6} cy={16.5} r={4.2} fill="none" stroke={c} strokeWidth={2} />
        <Circle cx={18} cy={16.5} r={4.2} fill="none" stroke={c} strokeWidth={2} />
        {line('M6 16.5 L10 9 H15.5 L18 16.5 M10 9 L12.5 16.5 H6 M15.5 9 L14.6 6.2 H17.2 M8.4 7 H11.6', c, 2.2)}
      </>
    ),
  },
  basket: {
    draw: (c) => (
      <>
        {line('M7.6 9.5 L12 3.5 L16.4 9.5', c, 2.2, SHADE)}
        {face('M2.5 9.5 H21.5 L19.6 19.2 A2 2 0 0 1 17.6 20.8 H6.4 A2 2 0 0 1 4.4 19.2 Z', c)}
      </>
    ),
    cut: (
      <>
        <Rect x={8.4} y={12.5} width={1.8} height={5.5} rx={0.9} {...K} />
        <Rect x={11.1} y={12.5} width={1.8} height={5.5} rx={0.9} {...K} />
        <Rect x={13.8} y={12.5} width={1.8} height={5.5} rx={0.9} {...K} />
      </>
    ),
  },
  cart: {
    draw: (c) => (
      <>
        {line('M2.5 3.5 H5.2 L8 15.5', c, 2.4)}
        {face('M6 7.5 H21 L19 15.5 H8 Z', c)}
        <Circle cx={9.6} cy={19.3} r={1.8} {...sh(c)} />
        <Circle cx={17.4} cy={19.3} r={1.8} {...sh(c)} />
      </>
    ),
  },
  'alert-circle': {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: (
      <>
        <Rect x={10.9} y={6.2} width={2.2} height={7.2} rx={1.1} {...K} />
        <Circle cx={12} cy={16.8} r={1.3} {...K} />
      </>
    ),
  },
  warning: {
    draw: (c) => <Path d="M12 3.6 L21.2 19.8 H2.8 Z" fill={c} stroke={c} strokeWidth={2} strokeLinejoin="round" />,
    cut: (
      <>
        <Rect x={10.9} y={9} width={2.2} height={5.4} rx={1.1} {...K} />
        <Circle cx={12} cy={17} r={1.2} {...K} />
      </>
    ),
  },
  'help-circle': {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: (
      <>
        {cutLine('M9.4 9.6 A2.7 2.7 0 0 1 14.6 10.2 C14.6 12 12 12.2 12 14.2', 2.2)}
        <Circle cx={12} cy={17.2} r={1.2} {...K} />
      </>
    ),
  },
  'swap-horizontal': {
    draw: (c) => (
      <>
        {line('M4 8 H19 M15.5 4.5 L19 8 L15.5 11.5', c)}
        {line('M20 16 H5 M8.5 12.5 L5 16 L8.5 19.5', c, 2.6, SHADE)}
      </>
    ),
  },
  construct: {
    draw: (c) => (
      <>
        {line('M5.2 18.8 L12 12', c, 4.2)}
        <Circle cx={15.4} cy={8.6} r={5} fill={c} />
      </>
    ),
    cut: <Circle cx={18.6} cy={5.4} r={2.6} {...K} />,
  },
  cube: {
    draw: (c) => (
      <>
        {face('M12 2.5 L21 7.2 L12 12 L3 7.2 Z', c)}
        {face('M3 7.2 L12 12 V21.5 L3 16.7 Z', c, 0.55)}
        {face('M21 7.2 L12 12 V21.5 L21 16.7 Z', c, 0.78)}
      </>
    ),
  },
  shirt: {
    draw: (c) => (
      <Path
        d="M8.6 3 L2.5 6.2 L4.6 10.4 L7 9.4 V21 H17 V9.4 L19.4 10.4 L21.5 6.2 L15.4 3 A3.4 3.4 0 0 1 8.6 3 Z"
        fill={c}
        stroke={c}
        strokeWidth={0.8}
        strokeLinejoin="round"
      />
    ),
  },
  'phone-portrait': {
    draw: (c) => <Rect x={6.5} y={2} width={11} height={20} rx={3} fill={c} />,
    cut: (
      <>
        <Rect x={8.5} y={4.6} width={7} height={12.6} rx={1} {...K} />
        <Circle cx={12} cy={19.7} r={0.9} {...K} />
      </>
    ),
    over: (c) => <Rect x={8.5} y={4.6} width={7} height={12.6} rx={1} fill={c} opacity={0.35} />,
  },
  link: {
    draw: (c) => (
      <>
        {line('M10 14 L14 10', c, 2.6)}
        {line('M9.6 7.2 L11.2 5.6 A3.6 3.6 0 0 1 16.3 10.7 L14.7 12.3', c, 2.6)}
        {line('M14.4 16.8 L12.8 18.4 A3.6 3.6 0 0 1 7.7 13.3 L9.3 11.7', c, 2.6, SHADE)}
      </>
    ),
  },
  globe: {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: (
      <>
        {cutLine('M12 2 C8.4 6.2 8.4 17.8 12 22 C15.6 17.8 15.6 6.2 12 2', 1.8)}
        {cutLine('M2.4 12 H21.6', 1.8)}
        {cutLine('M4 7.4 H20 M4 16.6 H20', 1.6)}
      </>
    ),
  },
  'shield-checkmark': {
    draw: (c) =>
      halves(
        'M12 2.4 L4.2 5.6 V11 C4.2 16 7.6 19.6 12 21.6 Z',
        'M12 2.4 L19.8 5.6 V11 C19.8 16 16.4 19.6 12 21.6 Z',
        c,
      ),
    cut: cutLine('M8.3 12.2 L11 14.9 L16 9.2', 2.4),
  },
  'pause-circle': {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: (
      <>
        <Rect x={8.6} y={8} width={2.4} height={8} rx={1} {...K} />
        <Rect x={13} y={8} width={2.4} height={8} rx={1} {...K} />
      </>
    ),
  },
  pause: {
    draw: (c) => (
      <>
        <Rect x={5.5} y={4} width={4.6} height={16} rx={1.6} fill={c} />
        <Rect x={13.9} y={4} width={4.6} height={16} rx={1.6} {...sh(c)} />
      </>
    ),
  },
  play: {
    draw: (c) => <Path d="M7.5 4.8 L19 12 L7.5 19.2 Z" fill={c} stroke={c} strokeWidth={2} strokeLinejoin="round" />,
  },
  create: {
    draw: (c) => (
      <>
        {face('M16.2 3.2 L20.8 7.8 L9.2 19.4 L3.4 20.6 L4.6 14.8 Z', c)}
        {face('M16.2 3.2 L20.8 7.8 L18.5 10.1 L13.9 5.5 Z', c, SHADE)}
      </>
    ),
  },
  receipt: {
    draw: (c) => face('M5 2.5 H19 V21.5 L16.3 19.6 L13.7 21.5 L11.1 19.6 L8.5 21.5 L5 19.6 Z', c),
    cut: (
      <>
        <Rect x={8} y={7} width={8} height={1.8} rx={0.9} {...K} />
        <Rect x={8} y={11} width={8} height={1.8} rx={0.9} {...K} />
        <Rect x={8} y={15} width={5} height={1.8} rx={0.9} {...K} />
      </>
    ),
  },
  happy: {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: (
      <>
        <Circle cx={8.8} cy={9.8} r={1.3} {...K} />
        <Circle cx={15.2} cy={9.8} r={1.3} {...K} />
        {cutLine('M7.6 14 C9 17.2 15 17.2 16.4 14', 2.2)}
      </>
    ),
  },
  restaurant: {
    draw: (c) => (
      <>
        {line('M6 3 V8.5 A2.5 2.5 0 0 0 11 8.5 V3 M8.5 3 V21', c, 2.4)}
        {line('M17.5 21 V3 C15 5 14.4 9 14.8 13 H17.5', c, 2.4, SHADE)}
      </>
    ),
  },
  storefront: {
    draw: (c) => (
      <>
        {face('M2.5 10 L4.6 3.8 H19.4 L21.5 10 Z', c, SHADE)}
        {halves('M4 10 H12 V21 H5.5 A1.5 1.5 0 0 1 4 19.5 Z', 'M12 10 H20 V19.5 A1.5 1.5 0 0 1 18.5 21 H12 Z', c)}
      </>
    ),
    cut: <Rect x={9.5} y={14} width={5} height={7} rx={2.5} {...K} />,
  },
  megaphone: {
    draw: (c) => (
      <>
        {face('M3 10 V14 H6.4 L14.5 18.6 V5.4 L6.4 10 Z', c)}
        {face('M6.4 14 L7.6 19.4 H10 L9 15.7 Z', c, SHADE)}
        {line('M17.6 9 A4 4 0 0 1 17.6 15', c, 2.4)}
      </>
    ),
  },
  apps: {
    draw: (c) => (
      <>
        <Rect x={3} y={3} width={8} height={8} rx={2.4} fill={c} />
        <Rect x={13} y={3} width={8} height={8} rx={2.4} {...sh(c)} />
        <Rect x={3} y={13} width={8} height={8} rx={2.4} {...sh(c)} />
        <Rect x={13} y={13} width={8} height={8} rx={2.4} fill={c} />
      </>
    ),
  },
  backspace: {
    draw: (c) => face('M8.5 5 H20 A1.5 1.5 0 0 1 21.5 6.5 V17.5 A1.5 1.5 0 0 1 20 19 H8.5 L2.5 12 Z', c),
    cut: cutLine('M11.7 9.3 L16.5 14.7 M16.5 9.3 L11.7 14.7', 2.2),
  },
  watch: {
    draw: (c) => (
      <>
        <Rect x={8} y={1.8} width={8} height={5} rx={1.4} {...sh(c)} />
        <Rect x={8} y={17.2} width={8} height={5} rx={1.4} {...sh(c)} />
        <Circle cx={12} cy={12} r={6.8} fill={c} />
      </>
    ),
    cut: cutLine('M12 8.6 V12 L14.2 13.4', 2),
  },
  'log-out': {
    draw: (c) => (
      <>
        {line('M9 3.5 H5.5 A2 2 0 0 0 3.5 5.5 V18.5 A2 2 0 0 0 5.5 20.5 H9', c, 2.6, SHADE)}
        {line('M10 12 H20.5 M16 7.5 L20.5 12 L16 16.5', c)}
      </>
    ),
  },
  'document-text': {
    draw: (c) => (
      <>
        {face('M6.5 2.5 H14 V6 A2 2 0 0 0 16 8 H19.5 V19.5 A2 2 0 0 1 17.5 21.5 H6.5 A2 2 0 0 1 4.5 19.5 V4.5 A2 2 0 0 1 6.5 2.5 Z', c)}
        {face('M14 2.5 L19.5 8 H16 A2 2 0 0 1 14 6 Z', c, SHADE)}
      </>
    ),
    cut: (
      <>
        <Rect x={7.5} y={11.5} width={9} height={1.8} rx={0.9} {...K} />
        <Rect x={7.5} y={15.2} width={6} height={1.8} rx={0.9} {...K} />
      </>
    ),
  },
  briefcase: {
    draw: (c) => (
      <>
        {line('M9 7 V5 A1.5 1.5 0 0 1 10.5 3.5 H13.5 A1.5 1.5 0 0 1 15 5 V7', c, 2.2, SHADE)}
        <Rect x={2.5} y={7} width={19} height={7} rx={2.5} fill={c} />
        <Rect x={2.5} y={14.2} width={19} height={6.8} rx={2.5} {...sh(c)} />
      </>
    ),
    cut: <Rect x={10.4} y={12.4} width={3.2} height={3.2} rx={0.8} {...K} />,
  },
  call: {
    draw: (c) =>
      face(
        'M6.6 3 L9.3 3.4 L10.6 7.4 L8.7 9 A12 12 0 0 0 15 15.3 L16.6 13.4 L20.6 14.7 L21 17.4 A3 3 0 0 1 18 20.4 C10.7 20 4 13.3 3.6 6 A3 3 0 0 1 6.6 3 Z',
        c,
      ),
  },
  car: {
    draw: (c) => (
      <>
        {face('M3 14.5 L4.6 9.6 A2 2 0 0 1 6.5 8.2 H17.5 A2 2 0 0 1 19.4 9.6 L21 14.5 V18 H3 Z', c)}
        <Circle cx={7.2} cy={18} r={2.3} {...sh(c)} />
        <Circle cx={16.8} cy={18} r={2.3} {...sh(c)} />
      </>
    ),
    cut: <Path d="M6.5 10.2 H17.5 L18.5 13 H5.5 Z" {...K} />,
  },
  airplane: {
    draw: (c) =>
      face(
        'M21.5 12 C21.5 13 20 13.8 19 13.8 H14 L9.5 20.5 H7 L9.8 13.8 H5.5 L4 15.8 H2.5 L3.4 12 L2.5 8.2 H4 L5.5 10.2 H9.8 L7 3.5 H9.5 L14 10.2 H19 C20 10.2 21.5 11 21.5 12 Z',
        c,
      ),
  },
  copy: {
    draw: (c) => (
      <>
        <Rect x={8.5} y={2.5} width={12} height={14} rx={3} {...sh(c)} />
        <Rect x={3.5} y={7.5} width={12} height={14} rx={3} fill={c} />
      </>
    ),
  },
  refresh: {
    draw: (c) => (
      <>
        {line('M19.5 12 A7.5 7.5 0 1 1 16.8 6.3', c, 2.6)}
        {line('M17 2.8 V7 H12.8', c, 2.6)}
      </>
    ),
  },
  'refresh-circle': {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: (
      <>
        {cutLine('M16.4 12 A4.4 4.4 0 1 1 14.8 8.6', 2)}
        {cutLine('M15 6.4 V9 H12.4', 2)}
      </>
    ),
  },
  share: {
    draw: (c) => (
      <>
        {line('M12 15 V3.5 M7.6 7.8 L12 3.5 L16.4 7.8', c)}
        {line('M7.5 11 H5.5 A2 2 0 0 0 3.5 13 V19.5 A2 2 0 0 0 5.5 21.5 H18.5 A2 2 0 0 0 20.5 19.5 V13 A2 2 0 0 0 18.5 11 H16.5', c, 2.4, SHADE)}
      </>
    ),
  },
  'caret-up': {
    draw: (c) => <Path d="M12 7.5 L18.5 16 H5.5 Z" fill={c} stroke={c} strokeWidth={2} strokeLinejoin="round" />,
  },
  'caret-down': {
    draw: (c) => <Path d="M12 16.5 L5.5 8 H18.5 Z" fill={c} stroke={c} strokeWidth={2} strokeLinejoin="round" />,
  },
  chatbubbles: {
    draw: (c) => (
      <>
        <Rect x={9.5} y={9} width={12} height={9} rx={3.6} {...sh(c)} />
        {face('M18 17.5 L19.2 21 L14 17.5 Z', c, SHADE)}
        <Rect x={2.5} y={3} width={13.5} height={10} rx={4} fill={c} />
        {face('M6 12.5 L5 16.5 L10 12.5 Z', c)}
      </>
    ),
  },
  map: {
    draw: (c) => (
      <>
        {face('M2.5 5.5 L8.5 3.5 V18.5 L2.5 20.5 Z', c)}
        {face('M8.5 3.5 L15.5 5.5 V20.5 L8.5 18.5 Z', c, SHADE)}
        {face('M15.5 5.5 L21.5 3.5 V18.5 L15.5 20.5 Z', c)}
      </>
    ),
  },
  sunny: {
    draw: (c) => (
      <>
        <Circle cx={12} cy={12} r={4.6} fill={c} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <Rect key={a} x={11.2} y={1.8} width={1.6} height={3.8} rx={0.8} {...sh(c)} transform={`rotate(${a} 12 12)`} />
        ))}
      </>
    ),
  },
  scan: {
    draw: (c) => (
      <>
        {line('M3 8 V5.5 A2.5 2.5 0 0 1 5.5 3 H8 M16 3 H18.5 A2.5 2.5 0 0 1 21 5.5 V8 M21 16 V18.5 A2.5 2.5 0 0 1 18.5 21 H16 M8 21 H5.5 A2.5 2.5 0 0 1 3 18.5 V16', c, 2.4)}
        {line('M7 12 H17', c, 2.2, SHADE)}
      </>
    ),
  },
  text: { draw: (c) => line('M5.5 6 H18.5 M12 6 V19.5', c, 3) },

  /* filled circles with a knocked-out mark */
  'close-circle': {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: cutLine('M8.6 8.6 L15.4 15.4 M15.4 8.6 L8.6 15.4'),
  },
  'checkmark-circle': {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: cutLine('M7.4 12.4 L10.6 15.6 L16.6 9', 2.6),
  },
  'add-circle': {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: cutLine('M12 7.4 V16.6 M7.4 12 H16.6'),
  },
  'arrow-forward-circle': {
    draw: (c) => <Circle cx={12} cy={12} r={10} fill={c} />,
    cut: cutLine('M7.5 12 H16 M12.6 8.4 L16.2 12 L12.6 15.6'),
  },
  checkbox: {
    draw: (c) => <Rect x={3.5} y={3.5} width={17} height={17} rx={4.5} fill={c} />,
    cut: cutLine('M7.6 12.2 L10.6 15.2 L16.6 9', 2.4),
  },
  square: { draw: (c) => <Rect x={3.5} y={3.5} width={17} height={17} rx={4.5} fill={c} /> },
  ellipse: { draw: (c) => <Circle cx={12} cy={12} r={9} fill={c} /> },
};

// Shapes whose "-outline" variant means "not selected / not saved": drawn as a
// faint version of the same glyph so the two states stay clearly different.
// Names that share a drawing.
const ALIASES: Record<string, string> = {
  pin: 'location',
  sparkles: 'color-palette',
  man: 'person',
  woman: 'person',
  images: 'image',
  'stats-chart': 'analytics',
};

const GHOST_WHEN_OUTLINE = new Set(['heart', 'star', 'bookmark', 'square', 'ellipse', 'checkbox']);

function resolve(name: string): { glyph?: Glyph; ghost: boolean } {
  const outline = name.endsWith('-outline');
  const base = outline ? name.slice(0, -'-outline'.length) : name.endsWith('-sharp') ? name.slice(0, -'-sharp'.length) : name;
  const key = ALIASES[base] ?? base;
  return { glyph: glyphs[key], ghost: outline && GHOST_WHEN_OUTLINE.has(key) };
}

export function FlatIcon({ name, size = 24, color = '#000000', accent, style }: Props) {
  const maskId = `fi-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { glyph, ghost } = resolve(String(name));

  if (!glyph) {
    return <VectorIonicons name={name} size={size} color={color} style={style as any} />;
  }

  let drawn: React.ReactNode;
  let over: React.ReactNode;
  ACCENT = accent;
  try {
    drawn = glyph.draw(color);
    over = glyph.over ? glyph.over(color) : null;
  } finally {
    ACCENT = undefined;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style as any}>
      {glyph.cut ? (
        <Defs>
          <Mask id={maskId} maskUnits="userSpaceOnUse" x={0} y={0} width={24} height={24}>
            <Rect x={0} y={0} width={24} height={24} fill="#fff" />
            {glyph.cut}
          </Mask>
        </Defs>
      ) : null}
      <G opacity={ghost ? 0.5 : 1}>
        <G mask={glyph.cut ? `url(#${maskId})` : undefined}>{drawn}</G>
        {over}
      </G>
    </Svg>
  );
}

/** Same shape as Ionicons: `Ionicons`, plus `Ionicons.glyphMap` for icon-name types. */
export const Ionicons = Object.assign(FlatIcon, { glyphMap: VectorIonicons.glyphMap });

export default FlatIcon;
