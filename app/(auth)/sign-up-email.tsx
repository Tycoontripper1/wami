import WamiLoader from '@/components/WamiLoader';
import AuthHeader from '@/components/AuthHeader';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import Colors from '@/constants/Colors';
import { authService } from '@/services/authService';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignUpEmailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    subText: isDark ? '#ccc' : '#666',
    icon: isDark ? '#fff' : '#0F1419',
  };

  const handleNext = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setIsLoading(true);
    try {
      const { token, message } = await authService.sendSignUpCode(trimmedEmail);
      Alert.alert('Success', message || 'Verification code sent to your email address.');
      router.push({
        pathname: './verification-code',
        params: { email: trimmedEmail, token },
      } as any);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <WamiLoader visible={!!isLoading} message="Sending your code…" variant="brand" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, flex: undefined, flexGrow: 1 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AuthHeader
          scene={false}
          title="Let's get"
          highlight="started"
          onBack={() => router.back()}
          subtitle={'Enter your email and we will send you a code to verify it.'}
        />

        {/* Email Input */}
        <FloatingLabelInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.inputContainer}
        />

        {/* Footer Text */}
        <Text style={[styles.footerText, { color: themeColors.subText }]}>
          By continuing, you agree to Wami's{'\n'}
          <Text style={styles.link}>Privacy Policy</Text> and{' '}
          <Text style={styles.link}>Terms of Use</Text>
        </Text>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextButton, (!email.trim() || isLoading) && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!email.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#0F1419" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    marginBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0F1419',
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F1419',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: Colors.light.primary,
    textDecorationLine: 'underline',
  },
  nextButton: {
    height: 48,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F1419',
  },
});
