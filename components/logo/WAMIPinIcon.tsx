import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export const PIN_VIEWBOX = { width: 48, height: 60 };

/** Location pin with stylized W cutout (even-odd). */
export const PIN_WITH_W_PATH = `
  M24,2
  C13.5,2 5.5,11 5.5,21.5
  C5.5,32 24,57.5 24,57.5
  C24,57.5 42.5,32 42.5,21.5
  C42.5,11 34.5,2 24,2
  Z
  M14.2,34.5 L18.4,18.5 L21.6,18.5 L17.4,34.5 Z
  M20.8,34.5 L24.8,24.5 L27.2,24.5 L23.2,34.5 Z
  M26.4,34.5 L30.6,18.5 L33.8,18.5 L29.6,34.5 Z
`;

type WAMIPinIconProps = {
  size: number;
  color?: string;
  /** Color visible through the W cutout (match the surface behind the logo). */
  cutoutColor?: string;
};

export function WAMIPinIcon({
  size,
  color = '#FFFFFF',
  cutoutColor,
}: WAMIPinIconProps) {
  const height = size * (PIN_VIEWBOX.height / PIN_VIEWBOX.width);

  return (
    <View style={[styles.wrap, { width: size, height }]}>
      {cutoutColor ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: cutoutColor, borderRadius: size }]} />
      ) : null}
      <Svg width={size} height={height} viewBox={`0 0 ${PIN_VIEWBOX.width} ${PIN_VIEWBOX.height}`}>
        <Path d={PIN_WITH_W_PATH} fill={color} fillRule="evenodd" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
    overflow: 'hidden',
  },
});
