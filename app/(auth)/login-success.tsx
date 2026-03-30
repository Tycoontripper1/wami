import Colors from '@/constants/Colors';
import { authService } from '@/services/authService';
import { setDontShowSuccessAgain } from '@/store/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Animations
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
  };

  useEffect(() => {
    // Entrance animations
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(checkmarkAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Auto-navigate after 4 seconds
    const timer = setTimeout(() => {
      handleContinue();
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = async () => {
    dispatch(setDontShowSuccessAgain(true));
    await authService.setDontShowSuccess(true);
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
        {/* Confetti/Sparkle effects */}
        <Animated.View style={[styles.sparkleContainer, { opacity: confettiAnim }]}>
          <View style={[styles.sparkle, styles.sparkle1]}>
            <Text style={styles.sparkleText}>✨</Text>
          </View>
          <View style={[styles.sparkle, styles.sparkle2]}>
            <Text style={styles.sparkleText}>🎉</Text>
          </View>
          <View style={[styles.sparkle, styles.sparkle3]}>
            <Text style={styles.sparkleText}>✨</Text>
          </View>
          <View style={[styles.sparkle, styles.sparkle4]}>
            <Text style={styles.sparkleText}>🎉</Text>
          </View>
        </Animated.View>

        {/* Success Icon with Animated Ring */}
        <Animated.View
          style={[
            styles.successIconContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Animated.View
            style={[
              styles.pulseRing,
              { transform: [{ scale: pulseAnim }], opacity: pulseAnim.interpolate({
                inputRange: [1, 1.1],
                outputRange: [0.5, 0],
              }) },
            ]}
          />
          <View style={styles.successCircle}>
            <Animated.View
              style={{
                transform: [
                  {
                    scale: checkmarkAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              }}
            >
              <Ionicons name="checkmark" size={70} color="#fff" />
            </Animated.View>
          </View>
        </Animated.View>

        {/* Title & Subtitle */}
        <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
          <Text style={[styles.title, { color: themeColors.text }]}>Welcome Back!</Text>
          <Text style={[styles.subtitle, { color: themeColors.subText }]}>
            You have been signed in successfully
          </Text>
        </Animated.View>

        {/* User greeting */}
        <Animated.View
          style={[
            styles.greetingCard,
            {
              opacity: fadeAnim,
              backgroundColor: isDark ? '#1a1a1a' : '#f5f5f5',
            },
          ]}
        >
          <Ionicons name="person-circle" size={40} color={Colors.light.primary} />
          <Text style={[styles.greetingText, { color: themeColors.text }]}>
            Ready to explore creatives near you
          </Text>
        </Animated.View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Continue Button */}
        <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
            <View style={styles.buttonGradient}>
              <Text style={styles.continueButtonText}>Let's Go</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  sparkleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: { top: 80, left: 40 },
  sparkle2: { top: 120, right: 50 },
  sparkle3: { top: 180, left: 60 },
  sparkle4: { top: 200, right: 40 },
  sparkleText: {
    fontSize: 24,
  },
  successIconContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: Colors.light.primary,
  },
  successCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  greetingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 12,
    width: '100%',
  },
  greetingText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
  },
  continueButton: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  buttonGradient: {
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
