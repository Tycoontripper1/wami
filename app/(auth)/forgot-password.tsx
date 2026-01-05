import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import Colors from '@/constants/Colors';
import { authService } from '@/services/authService';
import { resetPasswordFailure, resetPasswordStart, resetPasswordSuccess } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');

  const handleNext = async () => {
    if (!email.trim()) return;

    try {
      dispatch(resetPasswordStart());
      await authService.forgotPassword(email);
      dispatch(resetPasswordSuccess());
      
      // Navigate to verification code screen
      router.push({
        pathname: './reset-verification-code',
        params: { email: email.trim() }
      } as any);
    } catch (err: any) {
      dispatch(resetPasswordFailure(err.message || 'Failed to send reset code'));
      Alert.alert('Error', err.message || 'Could not find an account with this email.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" />
      
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Forgot your password?</Text>
          <Text style={styles.subtitle}>
             If you need help resetting your password we can help by sending you a link to reset it.
          </Text>
        </View>

        {/* Email Input */}
        <FloatingLabelInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!isLoading}
          containerStyle={styles.inputContainer}
        />

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Next Button */}
        <TouchableOpacity 
          style={[styles.nextButton, (!email.trim() || isLoading) && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={!email.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
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
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    flex:1, 
    flexDirection: 'row',
  },
  closeButton: {
    // Style for the small 'x' if desired, or rely on flex layout
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 24,
  },
  nextButton: {
    height: 56,
    backgroundColor: Colors.light.primary,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
