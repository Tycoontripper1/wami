import { WAMILogo, type WAMILogoSize, type WAMILogoVariant } from '@/components/logo';
import { useColorScheme } from '@/components/useColorScheme';
import { Brand } from '@/constants/Brand';
import Colors from '@/constants/Colors';
import React from 'react';
import { StyleSheet, View } from 'react-native';

type AuthBrandLogoProps = {
  size?: WAMILogoSize;
  variant?: WAMILogoVariant;
  backgroundColor?: string;
};

/** Logo for auth screens — cyan pin on light, white pin on dark. */
export function AuthBrandLogo({
  size = 'small',
  variant = 'pin',
  backgroundColor,
}: AuthBrandLogoProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const surface = backgroundColor ?? (isDark ? '#000' : '#fff');

  return (
    <View style={styles.wrap}>
      <WAMILogo
        size={size}
        variant={variant}
        color={isDark ? Brand.white : Colors.light.primary}
        cutoutColor={surface}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
