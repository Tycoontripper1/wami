import FlatIllustration, { IllustrationName } from '@/components/illustrations/FlatIllustration';
import { WAMILogo } from '@/components/logo';
import { Brand } from '@/constants/Brand';
import { Illo } from '@/constants/Illustration';
import { authService } from '@/services/authService';
import { restoreSession } from '@/store/authSlice';
import { RootState } from '@/store/store';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

// Bold flat-colour slides. Every background carries dark ink text at 7:1 or
// better, and the copy matches what the app does today.
const slides: Array<{ id: string; illustration: IllustrationName; background: string; title: string; body: string }> = [
  {
    id: '1',
    illustration: 'town',
    background: Illo.amber,
    title: 'Find creatives and sellers near you',
    body: "Browse their work and see who's working in your city.",
  },
  {
    id: '2',
    illustration: 'calendar',
    background: Illo.lilac,
    title: 'Book a date that suits you',
    body: 'Pick a slot, add the details, and reschedule when plans change.',
  },
  {
    id: '3',
    illustration: 'chat',
    background: Illo.lime,
    title: 'Talk before you commit',
    body: 'Message a creative to agree the scope and the price first.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentIndex, setCurrentIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    const checkSession = async () => {
      const session = await authService.restoreSession();
      if (session) {
        dispatch(restoreSession(session));
        // Only leave this screen when it is the one being shown. A deep link
        // (or notification) opens its target above this screen in the stack,
        // and redirecting from underneath would throw the user off the link.
        if (navigation.isFocused()) {
          router.replace('/(tabs)');
        }
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  const showSlide = (index: number) => {
    Animated.timing(fade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setCurrentIndex(index);
      Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  };

  // Auto-advance slides every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => showSlide((currentIndex + 1) % slides.length), 5000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const handleSignUp = () => {
    // Navigate to sign up flow
    router.push('/(auth)/sign-up-email');
  };

  const handleSignIn = () => {
    // Navigate to sign in
    router.push('/(auth)/sign-in'); 
  };

  const currentSlide = slides[currentIndex];

  // Show loading while checking auth
  if (isCheckingAuth) {
    const loadingBg = isDark ? Brand.splash.dark : Brand.splash.light;
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: loadingBg }]}>
        <StatusBar barStyle="light-content" />
        <WAMILogo
          size="large"
          variant="pin"
          color={Brand.white}
          cutoutColor={loadingBg}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: currentSlide.background }]}>
      <StatusBar barStyle="dark-content" />
      <View style={[styles.page, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
        <WAMILogo size="small" variant="pin" color={Illo.ink} cutoutColor={currentSlide.background} />

        <Animated.View style={[styles.hero, { opacity: fade }]}>
          <FlatIllustration name={currentSlide.illustration} width={Math.min(width - 48, 380)} animated />
          <Text style={styles.titleText}>{currentSlide.title}</Text>
          <Text style={styles.bodyText}>{currentSlide.body}</Text>
        </Animated.View>

        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <TouchableOpacity
              key={slide.id}
              onPress={() => showSlide(index)}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              accessibilityLabel={`Show slide ${index + 1}`}
            >
              <View style={[styles.dot, index === currentIndex && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.signUpButton} onPress={handleSignUp}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  page: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  titleText: {
    color: Illo.ink,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 36,
    marginTop: 8,
  },
  bodyText: {
    color: Illo.ink,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 20, 25, 0.28)',
  },
  dotActive: {
    width: 26,
    backgroundColor: Illo.ink,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  signUpButton: {
    flex: 1,
    backgroundColor: Illo.ink,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  signInButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Illo.ink,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: Illo.ink,
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
