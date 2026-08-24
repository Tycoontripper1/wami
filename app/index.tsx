import { WAMILogo } from '@/components/logo';
import { Brand } from '@/constants/Brand';
import Colors from '@/constants/Colors';
import { authService } from '@/services/authService';
import { restoreSession } from '@/store/authSlice';
import { RootState } from '@/store/store';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    image: require('../assets/images/onboarding_bg_creative.webp'),
    text: 'Bringing the best for creatives, sellers and buyers at the comfort of your home.',
  },
  {
    id: '2',
    image: require('../assets/images/onboarding_bg_seller.webp'),
    text: 'Bringing the best for creatives, sellers and buyers at the comfort of your home.',
  },
  {
    id: '3',
    image: require('../assets/images/onboarding_bg_service.webp'),
    text: 'Bringing the best for creatives, sellers and buyers at the comfort of your home.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    const checkSession = async () => {
      const session = await authService.restoreSession();
      if (session) {
        dispatch(restoreSession(session));
        router.replace('/(tabs)');
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  // Auto-advance slides every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={currentSlide.image}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={[styles.overlay, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.contentContainer}>
             {/* Slide Indicators could go here */}
            <View style={styles.textWrapper}>
              <Text style={styles.titleText}>{currentSlide.text}</Text>
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
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    width: width,
    justifyContent: 'flex-end',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // Dark overlay for text readability
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
  },
  contentContainer: {
    gap: 32,
    marginBottom: 40,
  },
  textWrapper: {
    marginBottom: 20,
  },
  titleText: {
    color: '#fff',
    fontSize: 32, // Large and impactful like design
    fontWeight: '700',
    textAlign: 'left',
    lineHeight: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  signUpButton: {
    flex: 1,
    backgroundColor: Colors.light.primary, // #00BCD4
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signUpText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: '#fff', // White for dark mode readability
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
