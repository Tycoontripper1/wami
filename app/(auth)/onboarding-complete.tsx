import AnimatedCheck from '@/components/AnimatedCheck';
import OnboardingProgress from '@/components/OnboardingProgress';
import Colors from '@/constants/Colors';
import { consolidateOnboardingData, isUnauthenticatedError } from '@/services/api/onboardingUtils';
import { authService } from '@/services/authService';
import { setOnboardingComplete, setSetupPending } from '@/store/onboardingSlice';
import { RootState } from '@/store/store';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';



export default function OnboardingCompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    subText: isDark ? '#ccc' : '#666',
  };

  const onboarding = useSelector((state: RootState) => state.onboarding);
  const creative = useSelector((state: RootState) => state.creativeOnboarding);
  const [isSubmitting, setIsSubmitting] = React.useState(true);

  // The effect below depends on `router`, whose identity can change between
  // renders; without this guard account setup could be submitted repeatedly.
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const completeOnboarding = async () => {
      try {
        setIsSubmitting(true);
        
        // Consolidate and map data
        const setupData = consolidateOnboardingData(onboarding, creative);
        
        // Call API
        await authService.setupAccount(setupData);
        
        // Mark onboarding as complete in state
        dispatch(setOnboardingComplete(true));

        // Auto-redirect after delay
        setTimeout(() => {
          router.replace('/(tabs)');
        }, 2000);
      } catch (error: any) {
        console.error('Onboarding setup failed:', error);
        setIsSubmitting(false);

        if (isUnauthenticatedError(error)) {
          // No valid session, so setup cannot succeed and retrying is pointless.
          // Keep the answers, ask for a sign-in, and finish setup right after it.
          dispatch(setSetupPending(true));
          // Go first (Alert is a no-op on web), then explain over the sign-in screen.
          router.replace('/(auth)/sign-in' as any);
          Alert.alert(
            'Sign in to finish',
            'Your session has ended. Sign in and we will finish setting up your account with your answers.',
          );
          return;
        }

        Alert.alert(
          'Setup Failed',
          error.message || 'We could not complete your account setup. Please try again.',
          [{ text: 'Retry', onPress: () => completeOnboarding() }]
        );
      }
    };

    completeOnboarding();
  }, [dispatch, router]);


  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <OnboardingProgress currentStep={7} totalSteps={7} />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <AnimatedCheck size={120} />

          <Text style={[styles.title, { color: themeColors.text }]}>You are all set</Text>
          <Text style={[styles.subtitle, { color: themeColors.subText }]}>
            We will start showing you creatives based on your interests
          </Text>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.light.primary} />
          </View>
        </View>
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
  },
  progressContainer: {
    marginBottom: 24,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 40,
  },
});
