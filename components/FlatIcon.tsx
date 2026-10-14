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

const line = (d: string, c: string, w = 2.6, o = 1) => (
  <Path d={d} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={o} />
);
const cutLine = (d: string, w = 2.4) => (
  <Path d={d} fill="none" stroke="#000" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);
const face = (d: string, c: string, o = 1) => <Path d={d} fill={c} opacity={o} />;

/** A symmetric pair: full left half, shaded right half. */
const halves = (left: string, right: string, c: string) => (
  <>
    {face(left, c)}
    {face(right, c, SHADE)}
  </>
);

const glyphs: Record<string, Glyph> = {
  /* strokes */
  'arrow-back': { draw: (c) => line('M19.5 12 H5.5 M11.2 5.8 L5 12 L11.2 18.2', c) },
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
        <Rect x={2.5} y={9.5} width={19} height={3.4} fill={c} opacity={SHADE} />
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
        <Rect x={13.6} y={10} width={8.2} height={6} rx={3} fill={c} opacity={SHADE} />
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
  },
  camera: {
    draw: (c) => <Rect x={2.5} y={7} width={19} height={13} rx={3.4} fill={c} />,
    cut: <Circle cx={12} cy={13.5} r={4.2} {...K} />,
    over: (c) => (
      <>
        <Rect x={8.2} y={3.8} width={7.6} height={4.6} rx={1.6} fill={c} opacity={SHADE} />
        <Circle cx={12} cy={13.5} r={2} fill={c} opacity={SHADE} />
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
        <Rect x={4} y={4.8} width={16} height={2.6} rx={1.3} fill={c} opacity={SHADE} />
        <Rect x={9.4} y={2.4} width={5.2} height={2.6} rx={1} fill={c} opacity={SHADE} />
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
const GHOST_WHEN_OUTLINE = new Set(['heart', 'star', 'bookmark', 'square', 'ellipse', 'checkbox']);

function resolve(name: string): { glyph?: Glyph; ghost: boolean } {
  const outline = name.endsWith('-outline');
  const base = outline ? name.slice(0, -'-outline'.length) : name.endsWith('-sharp') ? name.slice(0, -'-sharp'.length) : name;
  return { glyph: glyphs[base], ghost: outline && GHOST_WHEN_OUTLINE.has(base) };
}

export function FlatIcon({ name, size = 24, color = '#000000', style }: Props) {
  const maskId = `fi-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const { glyph, ghost } = resolve(String(name));

  if (!glyph) {
    return <VectorIonicons name={name} size={size} color={color} style={style as any} />;
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
      <G opacity={ghost ? 0.3 : 1}>
        <G mask={glyph.cut ? `url(#${maskId})` : undefined}>{glyph.draw(color)}</G>
        {glyph.over ? glyph.over(color) : null}
      </G>
    </Svg>
  );
}

/** Same shape as Ionicons: `Ionicons`, plus `Ionicons.glyphMap` for icon-name types. */
export const Ionicons = Object.assign(FlatIcon, { glyphMap: VectorIonicons.glyphMap });

export default FlatIcon;
