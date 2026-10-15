import { Ionicons } from '@/components/FlatIcon';
import { Text } from '@/components/AppText';
import Colors from '@/constants/Colors';
import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

// A fixed-size map marker: a white round bubble with an icon (or a photo) and a
// two-line label beside it. The size is fixed so `BUBBLE_ANCHOR` pins the
// circle's centre exactly on the coordinate.
export const BUBBLE_W = 168;
export const BUBBLE_H = 48;
export const BUBBLE_ANCHOR = { x: 24 / BUBBLE_W, y: 0.5 };

type Props = {
  title: string;
  subtitle?: string;
  /** A photo for the circle; the Wami pin shows when there is none. */
  image?: string;
  selected?: boolean;
  /** Icon colours (a country's flag colours); the brand blue and orange by default. */
  tone?: { main: string; accent: string };
};

export default function MapBubble({ title, subtitle, image, selected, tone }: Props) {
  const main = tone?.main ?? Colors.light.primary;
  const accent = tone?.accent ?? '#FFA000';
  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, selected && { backgroundColor: main }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.photo} />
        ) : (
          <Ionicons
            name="location"
            size={26}
            color={selected ? '#FFFFFF' : main}
            accent={accent}
          />
        )}
      </View>
      <View style={styles.label}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const SHADOW = { textShadowColor: '#FFFFFF', textShadowRadius: 3, textShadowOffset: { width: 0, height: 0 } } as const;

const styles = StyleSheet.create({
  wrap: {
    width: BUBBLE_W,
    height: BUBBLE_H,
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F1419',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 5,
  },
  photo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  label: {
    marginLeft: 8,
    width: BUBBLE_W - 56,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F1419',
    ...SHADOW,
  },
  subtitle: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#5E6670',
    ...SHADOW,
  },
});
