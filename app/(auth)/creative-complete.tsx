import Colors from '@/constants/Colors';
import { consolidateOnboardingData } from '@/services/api/onboardingUtils';
import { authService } from '@/services/authService';
import { setComplete } from '@/store/creativeOnboardingSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';



export default function CreativeCompleteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
  };

  const { onboarding, creativeOnboarding: creative } = useSelector((state: RootState) => state);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  useEffect(() => {
    // We only call setup if not already complete in this screen
    if (!creative.isComplete) {
       // Do nothing, wait for user to click Get Started or auto-submit
    }
  }, [creative.isComplete]);

  const handleGetStarted = async () => {
    try {
      setIsSubmitting(true);
      
      // Consolidate and map data
      const setupData = consolidateOnboardingData(onboarding, creative);
      
      // Call API
      await authService.setupAccount(setupData);
      
      // Mark as complete in state
      dispatch(setComplete(true));
      
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Creative setup failed:', error);
      setIsSubmitting(false);
      Alert.alert(
        'Setup Failed',
        error.message || 'We could not complete your account setup. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };


  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>🎉</Text>
        </View>

        <Text style={[styles.title, { color: themeColors.text }]}>You are all set!</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          We will start showing you creatives based on your interests.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 30 }]}>
        <TouchableOpacity 
          style={[styles.button, isSubmitting && { opacity: 0.8 }]} 
          onPress={handleGetStarted}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
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
  iconContainer: {
    marginBottom: 30,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 18,
    borderRadius: 30,
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
