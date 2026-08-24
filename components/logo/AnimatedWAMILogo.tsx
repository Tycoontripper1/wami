import { Brand } from '@/constants/Brand';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Text as SvgText } from 'react-native-svg';

import { PIN_VIEWBOX, WAMIPinIcon } from './WAMIPinIcon';

export type WAMILogoSize = 'small' | 'medium' | 'large';
export type WAMILogoVariant = 'full' | 'pin';

const SIZE_MAP = {
  small: { pin: 32, fontSize: 22, gap: 8 },
  medium: { pin: 44, fontSize: 30, gap: 10 },
  large: { pin: 56, fontSize: 38, gap: 12 },
} as const;

export type AnimatedWAMILogoProps = {
  size?: WAMILogoSize;
  variant?: WAMILogoVariant;
  animated?: boolean;
  color?: string;
  cutoutColor?: string;
  onAnimationComplete?: () => void;
};

export function AnimatedWAMILogo({
  size = 'medium',
  variant = 'full',
  animated = true,
  color = Brand.white,
  cutoutColor,
  onAnimationComplete,
}: AnimatedWAMILogoProps) {
  const { pin, fontSize, gap } = SIZE_MAP[size];
  const pinHeight = pin * (PIN_VIEWBOX.height / PIN_VIEWBOX.width);
  const textWidth = variant === 'full' ? fontSize * 3.1 : 0;
  const totalWidth = variant === 'full' ? pin + gap + textWidth : pin;

  const containerOpacity = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const containerScale = useRef(new Animated.Value(animated ? 0.88 : 1)).current;
  const pinTranslateY = useRef(new Animated.Value(animated ? -18 : 0)).current;
  const pinScale = useRef(new Animated.Value(animated ? 0.6 : 1)).current;
  const textOpacity = useRef(new Animated.Value(animated && variant === 'full' ? 0 : 1)).current;
  const textTranslateX = useRef(new Animated.Value(animated && variant === 'full' ? -12 : 0)).current;
  const pinBounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) {
      return;
    }

    const intro = Animated.parallel([
      Animated.timing(containerOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(containerScale, {
        toValue: 1,
        speed: 14,
        bounciness: 6,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(variant === 'pin' ? 0 : 80),
        Animated.parallel([
          Animated.spring(pinScale, {
            toValue: 1,
            speed: 12,
            bounciness: 10,
            useNativeDriver: true,
          }),
          Animated.spring(pinTranslateY, {
            toValue: 0,
            speed: 12,
            bounciness: 10,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]);

    intro.start(({ finished }) => {
      if (!finished) return;

      if (variant === 'full') {
        Animated.parallel([
          Animated.timing(textOpacity, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.spring(textTranslateX, {
            toValue: 0,
            speed: 14,
            bounciness: 5,
            useNativeDriver: true,
          }),
        ]).start(({ finished: textDone }) => {
          if (textDone) onAnimationComplete?.();
        });
      } else {
        onAnimationComplete?.();
      }
    });

    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pinBounce, {
          toValue: 1.04,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pinBounce, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.delay(2200),
      ]),
    );

    const bounceTimer = setTimeout(() => bounceLoop.start(), variant === 'full' ? 1100 : 700);

    return () => {
      clearTimeout(bounceTimer);
      bounceLoop.stop();
    };
  }, [
    animated,
    variant,
    containerOpacity,
    containerScale,
    pinScale,
    pinTranslateY,
    textOpacity,
    textTranslateX,
    pinBounce,
    onAnimationComplete,
  ]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: totalWidth,
          height: Math.max(pinHeight, fontSize * 1.15),
          opacity: containerOpacity,
          transform: [{ scale: containerScale }],
        },
      ]}
    >
      <View style={styles.row}>
        <Animated.View
          style={{
            transform: [
              { translateY: pinTranslateY },
              { scale: Animated.multiply(pinScale, pinBounce) },
            ],
          }}
        >
          <WAMIPinIcon size={pin} color={color} cutoutColor={cutoutColor} />
        </Animated.View>

        {variant === 'full' ? (
          <Animated.View
            style={[
              styles.textWrap,
              {
                marginLeft: gap,
                opacity: textOpacity,
                transform: [{ translateX: textTranslateX }],
              },
            ]}
          >
            <Svg width={textWidth} height={fontSize * 1.2}>
              <SvgText
                x={0}
                y={fontSize}
                fill={color}
                fontSize={fontSize}
                fontWeight="700"
                letterSpacing={-0.5}
              >
                wami
              </SvgText>
            </Svg>
          </Animated.View>
        ) : null}
      </View>
    </Animated.View>
  );
}

/** Static convenience export — pin-only or full wordmark. */
export function WAMILogo(
  props: Omit<AnimatedWAMILogoProps, 'animated' | 'onAnimationComplete'> & { animated?: boolean },
) {
  return <AnimatedWAMILogo {...props} animated={props.animated ?? false} />;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textWrap: {
    justifyContent: 'center',
  },
});
