import { AnimatedWAMILogo } from '@/components/logo';
import { useColorScheme } from '@/components/useColorScheme';
import { Brand } from '@/constants/Brand';
import React, { useCallback, useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';

const MIN_SPLASH_MS = 1600;

type AppSplashScreenProps = {
  onReady: () => void;
};

export function AppSplashScreen({ onReady }: AppSplashScreenProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? Brand.splash.dark : Brand.splash.light;
  const startedAt = useRef(Date.now());
  const finishedAnim = useRef(false);
  const finishedMin = useRef(false);

  const tryFinish = useCallback(() => {
    if (finishedAnim.current && finishedMin.current) {
      onReady();
    }
  }, [onReady]);

  useEffect(() => {
    const remaining = Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAt.current));
    const timer = setTimeout(() => {
      finishedMin.current = true;
      tryFinish();
    }, remaining);
    return () => clearTimeout(timer);
  }, [tryFinish]);

  const handleAnimationComplete = useCallback(() => {
    finishedAnim.current = true;
    tryFinish();
  }, [tryFinish]);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundColor} />
      <AnimatedWAMILogo
        size="large"
        variant="full"
        animated
        color={Brand.white}
        cutoutColor={backgroundColor}
        onAnimationComplete={handleAnimationComplete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
