import { Illo } from '@/constants/Illustration';
import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

/* The things creatives work with, drawn flat on a 64×64 grid in the brand
   colours plus the friendly accents. No outlines; depth is two flat tones.
   A few have faces, in the spirit of a sticker sheet. Decorative only. */

export type ToolName =
  | 'camera'
  | 'scissors'
  | 'palette'
  | 'brush'
  | 'pencil'
  | 'spool'
  | 'comb'
  | 'lipstick'
  | 'bulb'
  | 'clapper'
  | 'headphones'
  | 'heart'
  | 'flower'
  | 'coin'
  | 'pin';

const c = Illo;
const STEEL = '#C9D3DA';
const STEEL_DEEP = '#9AA7B1';
const LILAC_DEEP = '#A98BF0';

const Face = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <G transform={`translate(${x} ${y}) scale(${s})`}>
    <Circle cx={-5} cy={0} r={2} fill={c.ink} />
    <Circle cx={5} cy={0} r={2} fill={c.ink} />
    <Path d="M-4 5 Q0 9 4 5" stroke={c.ink} strokeWidth={2} strokeLinecap="round" fill="none" />
  </G>
);

const drawings: Record<ToolName, () => React.JSX.Element> = {
  camera: () => (
    <G>
      <Rect x={20} y={10} width={24} height={12} rx={4} fill={c.tealDeep} />
      <Rect x={5} y={18} width={54} height={38} rx={10} fill={c.teal} />
      <Rect x={5} y={42} width={54} height={14} rx={7} fill={c.tealDeep} opacity={0.35} />
      <Circle cx={32} cy={37} r={14} fill={c.paper} />
      <Circle cx={32} cy={37} r={9.5} fill={c.ink} />
      <Circle cx={28.5} cy={33.5} r={3} fill={c.tealLight} />
      <Circle cx={51} cy={27} r={3.5} fill={c.amber} />
    </G>
  ),
  scissors: () => (
    <G>
      <Path d="M22 6 L40 40" stroke={STEEL} strokeWidth={7} strokeLinecap="round" />
      <Path d="M42 6 L24 40" stroke={STEEL_DEEP} strokeWidth={7} strokeLinecap="round" />
      <Circle cx={32} cy={23} r={4} fill={c.ink} />
      <Circle cx={21} cy={50} r={9} fill="none" stroke={c.coral} strokeWidth={6} />
      <Circle cx={43} cy={50} r={9} fill="none" stroke={c.coralDeep} strokeWidth={6} />
    </G>
  ),
  palette: () => (
    <G>
      <Path
        d="M32 5 C16 5 5 17 5 31 C5 46 17 59 33 59 C40 59 43 54 41 49 C39 44 43 40 48 41 C56 42 59 36 59 30 C59 16 47 5 32 5 Z"
        fill={c.amber}
      />
      <Path d="M41 49 C43 54 40 59 33 59 C25 59 18 56 13 50 C22 54 36 53 41 49 Z" fill={c.ember} opacity={0.5} />
      <Circle cx={19} cy={26} r={5.5} fill={c.coral} />
      <Circle cx={32} cy={16} r={5.5} fill={c.teal} />
      <Circle cx={46} cy={22} r={5.5} fill={c.lilac} />
      <Circle cx={17} cy={42} r={5.5} fill={c.lime} />
      <Face x={33} y={36} s={0.85} />
    </G>
  ),
  brush: () => (
    <G transform="rotate(32 32 32)">
      <Rect x={27} y={2} width={10} height={36} rx={5} fill={c.lilac} />
      <Rect x={27} y={2} width={4} height={36} rx={2} fill={LILAC_DEEP} opacity={0.5} />
      <Rect x={26} y={36} width={12} height={9} rx={2.5} fill={STEEL} />
      <Path d="M26 45 H38 C38 54 34 61 32.5 61 C31 61 26 54 26 45 Z" fill={c.teal} />
    </G>
  ),
  pencil: () => (
    <G transform="rotate(-28 32 32)">
      <Rect x={26} y={4} width={12} height={8} rx={2} fill={c.coral} />
      <Rect x={26} y={12} width={12} height={34} fill={c.amber} />
      <Rect x={32} y={12} width={6} height={34} fill={c.ember} opacity={0.55} />
      <Path d="M26 46 H38 L32 60 Z" fill={c.cloud} />
      <Path d="M30 55 H34 L32 60 Z" fill={c.ink} />
    </G>
  ),
  spool: () => (
    <G>
      <Rect x={12} y={6} width={40} height={10} rx={4} fill={c.lilac} />
      <Rect x={12} y={48} width={40} height={10} rx={4} fill={LILAC_DEEP} />
      <Rect x={17} y={16} width={30} height={32} fill={c.coral} />
      <Rect x={17} y={22} width={30} height={4} fill={c.coralDeep} opacity={0.5} />
      <Rect x={17} y={32} width={30} height={4} fill={c.coralDeep} opacity={0.5} />
      <Rect x={17} y={42} width={30} height={4} fill={c.coralDeep} opacity={0.5} />
      <Path d="M47 30 C56 30 58 40 52 46" stroke={c.coral} strokeWidth={3} strokeLinecap="round" fill="none" />
    </G>
  ),
  comb: () => (
    <G>
      <Rect x={5} y={12} width={54} height={16} rx={6} fill={c.teal} />
      {[10, 17, 24, 31, 38, 45, 52].map((x) => (
        <Rect key={x} x={x - 2} y={26} width={4} height={20} rx={2} fill={c.tealDeep} />
      ))}
    </G>
  ),
  lipstick: () => (
    <G>
      <Path d="M22 28 V14 C22 6 42 4 42 14 V28 Z" fill={c.coral} />
      <Path d="M32 8 C38 8 42 10 42 14 V28 H32 Z" fill={c.coralDeep} opacity={0.6} />
      <Rect x={19} y={28} width={26} height={11} rx={3} fill={c.amber} />
      <Rect x={17} y={38} width={30} height={20} rx={5} fill={STEEL} />
      <Rect x={17} y={38} width={13} height={20} rx={5} fill={STEEL_DEEP} opacity={0.45} />
    </G>
  ),
  bulb: () => (
    <G>
      <Circle cx={32} cy={26} r={19} fill={c.amber} />
      <Path d="M32 7 A19 19 0 0 1 32 45 Z" fill={c.ember} opacity={0.3} />
      <Rect x={23} y={42} width={18} height={8} rx={3} fill={STEEL} />
      <Rect x={25} y={49} width={14} height={8} rx={4} fill={STEEL_DEEP} />
      <Face x={32} y={27} s={0.9} />
    </G>
  ),
  clapper: () => (
    <G>
      <Rect x={6} y={24} width={52} height={32} rx={6} fill={LILAC_DEEP} />
      <G transform="rotate(-10 6 24)">
        <Rect x={6} y={10} width={52} height={14} rx={4} fill={c.lilac} />
        {[14, 26, 38, 50].map((x) => (
          <Path key={x} d={`M${x} 10 H${x + 6} L${x} 24 H${x - 6} Z`} fill={c.ink} />
        ))}
      </G>
      <Circle cx={20} cy={40} r={4} fill={c.amber} />
      <Rect x={30} y={36} width={20} height={4} rx={2} fill={c.paper} opacity={0.9} />
      <Rect x={30} y={44} width={13} height={4} rx={2} fill={c.paper} opacity={0.6} />
    </G>
  ),
  headphones: () => (
    <G>
      <Path d="M13 40 V32 C13 12 51 12 51 32 V40" fill="none" stroke={c.lilac} strokeWidth={7} strokeLinecap="round" />
      <Rect x={6} y={34} width={15} height={22} rx={7} fill={c.coral} />
      <Rect x={43} y={34} width={15} height={22} rx={7} fill={c.coralDeep} />
    </G>
  ),
  heart: () => (
    <G>
      <Path d="M32 56 C12 42 6 30 6 21 C6 12 13 7 20 7 C26 7 30 10 32 15 C34 10 38 7 44 7 C51 7 58 12 58 21 C58 30 52 42 32 56 Z" fill={c.coral} />
      <Path d="M32 15 C34 10 38 7 44 7 C51 7 58 12 58 21 C58 30 52 42 32 56 Z" fill={c.coralDeep} />
    </G>
  ),
  flower: () => (
    <G>
      {[0, 72, 144, 216, 288].map((a) => (
        <Circle key={a} cx={32 + 15 * Math.cos((a * Math.PI) / 180)} cy={32 + 15 * Math.sin((a * Math.PI) / 180)} r={11} fill={c.tealLight} />
      ))}
      <Circle cx={32} cy={32} r={9} fill={c.amber} />
    </G>
  ),
  pin: () => (
    <G>
      <Path d="M32 61 C32 61 9 37 9 24 A23 23 0 0 1 55 24 C55 37 32 61 32 61 Z" fill={c.teal} />
      <Path d="M32 1 A23 23 0 0 1 55 24 C55 37 32 61 32 61 Z" fill={c.tealDeep} />
      <Circle cx={32} cy={24} r={14} fill={c.paper} />
      <Circle cx={27} cy={22} r={2.4} fill={c.ink} />
      <Circle cx={37} cy={22} r={2.4} fill={c.ink} />
      <Path d="M26.5 28 Q32 33.5 37.5 28" stroke={c.ink} strokeWidth={2.4} strokeLinecap="round" fill="none" />
      <Circle cx={22.5} cy={27} r={2.2} fill={c.coral} opacity={0.55} />
      <Circle cx={41.5} cy={27} r={2.2} fill={c.coral} opacity={0.55} />
    </G>
  ),
  coin: () => (
    <G>
      <Circle cx={32} cy={32} r={26} fill={c.ember} />
      <Circle cx={32} cy={29} r={26} fill={c.amber} />
      <Circle cx={32} cy={29} r={17} fill={c.cloud} />
    </G>
  ),
};

type Props = {
  name: ToolName;
  size?: number;
};

export default function CreativeTool({ name, size = 64 }: Props) {
  const Drawing = drawings[name];
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Drawing />
    </Svg>
  );
}
