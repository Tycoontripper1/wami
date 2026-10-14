import AuthHeader from '@/components/AuthHeader';
import { consolidateOnboardingData } from '@/services/api/onboardingUtils';
import { setOnboardingComplete, setSetupPending } from '@/store/onboardingSlice';
import { store } from '@/store/store';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import Colors from '@/constants/Colors';
import { authService } from '@/services/authService';
import { signInFailure, signInStart, signInSuccess } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Ionicons } from '@/components/FlatIcon';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View, useColorScheme, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    subText: isDark ? '#ccc' : '#666',
    border: isDark ? '#333' : '#E0E0E0',
    icon: isDark ? '#fff' : '#0F1419',
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }


    try {
      dispatch(signInStart());
      const result = await authService.signIn(email, password);
      dispatch(signInSuccess(result));

      // Account setup was rejected earlier for lack of a session. Their
      // onboarding answers are still in memory, so complete it now.
      const pending = store.getState().onboarding;
      if (pending.setupPending) {
        try {
          const state = store.getState();
          await authService.setupAccount(consolidateOnboardingData(state.onboarding, state.creativeOnboarding));
          dispatch(setSetupPending(false));
          dispatch(setOnboardingComplete(true));
        } catch (setupError) {
          // Signing in still succeeded; setup stays pending for another try.
          console.error('Deferred account setup failed:', setupError);
        }
      }
      
      // Check if user wants to skip success screen
      const dontShowSuccess = await authService.getDontShowSuccess();
      if (dontShowSuccess) {
        router.replace('/(tabs)');
      } else {
        router.push('./login-success' as any);
      }
    } catch (err: any) {
      dispatch(signInFailure(err.message || 'Sign in failed'));
      Alert.alert('Sign In Failed', err.message || 'Please try again');
    }
  };

  const isFormValid = email.trim() && password.trim();

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, flex: undefined, paddingBottom: 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader
          scene={false}
          title="Welcome"
          highlight="back"
          onBack={() => router.back()}
          subtitle={'Sign in to pick up where you left off.'}
        />

        {/* Email Input */}
        <FloatingLabelInput
          compact
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
        />

        {/* Password Input */}
        <FloatingLabelInput
          compact
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          editable={!isLoading}
          rightAccessory={
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={themeColors.subText}
              />
            </TouchableOpacity>
          }
        />

        {/* Forgot Password */}
        <TouchableOpacity 
          style={styles.forgotPassword}
          onPress={() => router.push('/(auth)/forgot-password')}
        >
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Pinned to the bottom: always reachable, never scrolled away */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Text style={[styles.termsText, { color: themeColors.subText }]}>
          By continuing, you agree to Wami's Terms of Use and Privacy Policy.
        </Text>

        <TouchableOpacity
          style={[styles.signInButton, (!isFormValid || isLoading) && styles.signInButtonDisabled]}
          onPress={handleSignIn}
          disabled={!isFormValid || isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#0F1419" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={[styles.signUpText, { color: themeColors.subText }]}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-up-email')}>
            <Text style={styles.signUpLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0F1419',
    lineHeight: 28,
  },

  eyeButton: {
    paddingHorizontal: 14,
    height: 46,
    justifyContent: 'center',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  signInButton: {
    height: 48,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1419',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 10,
    gap: 12,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 2,
  },
  signUpText: {
    fontSize: 14,
    color: '#666',
  },
  signUpLink: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
  },
});
