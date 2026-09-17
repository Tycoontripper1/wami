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

  const calledReady = useRef(false);

  // onReady must fire exactly once, no matter what: if it never fires the
  // app is permanently stuck on this screen. tryFinish is the normal path
  // (both the min-duration timer and the logo's animation callback
  // resolved); the timeout below in the other effect is the fallback in
  // case the animation driver never reports "finished" (observed on web
  // after the Expo SDK 57 upgrade — the animated values reach their target
  // but Animated.start()'s completion callback doesn't fire).
  const finish = useCallback(() => {
    if (calledReady.current) return;
    calledReady.current = true;
    onReady();
  }, [onReady]);

  const tryFinish = useCallback(() => {
    if (finishedAnim.current && finishedMin.current) {
      finish();
    }
  }, [finish]);

  useEffect(() => {
    const remaining = Math.max(0, MIN_SPLASH_MS - (Date.now() - startedAt.current));
    const timer = setTimeout(() => {
      finishedMin.current = true;
      tryFinish();
    }, remaining);
    return () => clearTimeout(timer);
  }, [tryFinish]);

  useEffect(() => {
    const safety = setTimeout(finish, MIN_SPLASH_MS + 3000);
    return () => clearTimeout(safety);
  }, [finish]);

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
