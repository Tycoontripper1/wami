import FlatIllustration, { IllustrationName } from '@/components/illustrations/FlatIllustration';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

type Props = {
  scene: IllustrationName;
  /** A bold flat colour from IlloBackgrounds; dark text sits at 7:1+ on all of them. */
  background: string;
  height?: number;
};

/** The coloured, illustrated header at the top of each onboarding step. */
export default function OnboardingHero({ scene, background, height = 168 }: Props) {
  const rise = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(rise, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={[styles.panel, { backgroundColor: background, height }]}>
      <Animated.View
        style={{
          opacity: rise,
          transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
        }}
      >
        <FlatIllustration name={scene} width={Math.round(height * 1.3)} animated />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 22,
  },
});
