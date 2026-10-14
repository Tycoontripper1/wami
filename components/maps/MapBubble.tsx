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
};

export default function MapBubble({ title, subtitle, image, selected }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={[styles.circle, selected && styles.circleSelected]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.photo} />
        ) : (
          <Ionicons
            name="location"
            size={26}
            color={selected ? '#FFFFFF' : Colors.light.primary}
            accent="#FFA000"
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
  circleSelected: {
    backgroundColor: Colors.light.primary,
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
