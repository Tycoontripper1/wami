import FlatIllustration, { IllustrationName } from '@/components/illustrations/FlatIllustration';
import { DELIVERY_ENABLED, INSTAGRAM_IMPORT_ENABLED } from '@/constants/Features';
import { Illo } from '@/constants/Illustration';
import { PAYMENTS_ENABLED } from '@/constants/Payments';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Three bold flat-colour slides. Slides 2 and 3 carry promises that are not
// live yet (Instagram import, held payments, delivery). Each shows a "Coming
// soon" tag driven by the same switches that gate the features, so the tag
// disappears on its own the day the feature goes live.
const SLIDES: Array<{
  id: string;
  scene: IllustrationName;
  background: string;
  title: string;
  subtitle: string;
  soon?: string;
}> = [
  {
    id: '1',
    scene: 'town',
    background: Illo.amber,
    title: 'Find creatives\nnear you',
    subtitle:
      "Photographers, stylists, makers and sellers in your city. Browse their work and save the ones you like.",
  },
  {
    id: '2',
    scene: 'calendar',
    background: Illo.lilac,
    title: 'Built for how you\nalready work',
    subtitle:
      'Connect your Instagram and your feed becomes your portfolio. Set your rates, take bookings and get paid, all in one place.',
    soon: INSTAGRAM_IMPORT_ENABLED ? undefined : 'Instagram import is coming soon',
  },
  {
    id: '3',
    scene: 'bag',
    background: Illo.lime,
    title: 'From their hands\nto yours',
    subtitle:
      'Your payment is held safely until the work is delivered, and Wami delivery brings it to your door. You just show up ready.',
    soon: PAYMENTS_ENABLED && DELIVERY_ENABLED ? undefined : 'Safe payments and delivery are coming soon',
  },
];

export default function OnboardingDiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  const [index, setIndex] = useState(0);
  const sceneOpacity = useRef(new Animated.Value(1)).current;
  const sceneRise = useRef(new Animated.Value(0)).current;
  const sheetRise = useRef(new Animated.Value(0)).current;

  const theme = {
    sheet: isDark ? '#14181D' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0F1419',
    subText: isDark ? '#B8C0C8' : '#4A545E',
    border: isDark ? '#2F3A46' : '#D5DBE0',
    dot: isDark ? '#3A4550' : '#D5DBE0',
  };

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  // Each slide eases in: the illustration rises, the sheet content settles.
  useEffect(() => {
    sceneRise.setValue(0);
    sheetRise.setValue(0);
    Animated.parallel([
      Animated.timing(sceneOpacity, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(sceneRise, { toValue: 1, friction: 6, tension: 90, useNativeDriver: true }),
      Animated.timing(sheetRise, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [index]);

  const goTo = (next: number) => {
    Animated.timing(sceneOpacity, { toValue: 0, duration: 140, useNativeDriver: true }).start(() => setIndex(next));
  };

  const handleNext = () => {
    if (isLast) {
      router.push('./onboarding-purpose' as any);
    } else {
      goTo(index + 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: slide.background }]}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.visual, { paddingTop: insets.top + 56 }]}>
        <Animated.View
          style={{
            opacity: sceneOpacity,
            transform: [{ translateY: sceneRise.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          }}
        >
          <FlatIllustration name={slide.scene} width={Math.min(width - 40, 380)} animated />
        </Animated.View>

        <TouchableOpacity
          onPress={() => router.replace('./sign-in' as any)}
          style={[styles.skip, { top: insets.top + 12 }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: theme.sheet,
            paddingBottom: insets.bottom + 24,
            opacity: sheetRise,
            transform: [{ translateY: sheetRise.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
          },
        ]}
      >
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <TouchableOpacity key={s.id} onPress={() => i !== index && goTo(i)} hitSlop={8} accessibilityLabel={`Slide ${i + 1}`}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: i === index ? theme.text : theme.dot },
                  i === index && styles.dotActive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {slide.soon ? (
          <View style={styles.soonTag}>
            <Text style={styles.soonText}>{slide.soon}</Text>
          </View>
        ) : null}

        <Text style={[styles.title, { color: theme.text }]}>{slide.title}</Text>
        <Text style={[styles.subtitle, { color: theme.subText }]}>{slide.subtitle}</Text>

        <View style={styles.footer}>
          {index > 0 ? (
            <TouchableOpacity onPress={() => goTo(index - 1)} style={[styles.backButton, { borderColor: theme.border }]}>
              <Text style={[styles.backText, { color: theme.text }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flex: 1 }} />
          )}

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, { backgroundColor: isDark ? Illo.amber : Illo.ink }]}
          >
            <Text style={[styles.nextText, { color: isDark ? Illo.ink : '#FFFFFF' }]}>
              {isLast ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  visual: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skip: {
    position: 'absolute',
    right: 20,
  },
  skipText: {
    color: Illo.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  sheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 22,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
  },
  soonTag: {
    alignSelf: 'flex-start',
    backgroundColor: Illo.amber,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 10,
  },
  soonText: {
    color: Illo.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 26,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  backButton: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Illo.ink,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
