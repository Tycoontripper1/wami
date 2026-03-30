import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import Colors from '@/constants/Colors';
import { authService } from '@/services/authService';
import { resetPasswordFailure, resetPasswordStart, resetPasswordSuccess } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email: string; token: string; otp: string }>();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  
  const [newPassword, setNewPassword] = useState('');
  const [reEnterPassword, setReEnterPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showReEnterPassword, setShowReEnterPassword] = useState(false);

  const handleNext = async () => {
    if (!newPassword || !reEnterPassword) {
      Alert.alert('Error', 'Please fill in both fields.');
      return;
    }
    if (newPassword !== reEnterPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters.');
      return;
    }

    try {
      dispatch(resetPasswordStart());
      const { message } = await authService.resetPassword(
        params.token as string,
        params.otp as string,
        newPassword,
        reEnterPassword
      );
      dispatch(resetPasswordSuccess());

      Alert.alert('Success', message || 'Your password has been reset.', [
        { text: 'OK', onPress: () => router.push('/(auth)/sign-in') },
      ]);
    } catch (err: any) {
      dispatch(resetPasswordFailure(err.message || 'Reset failed'));
      Alert.alert('Error', err.message || 'Failed to reset password.');
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
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
        </View>

         {/* Logo */}
         <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>W</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Reset Password</Text>
        </View>

        {/* New Password Input */}
        <FloatingLabelInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showNewPassword}
          editable={!isLoading}
          containerStyle={styles.inputContainer}
          rightAccessory={
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowNewPassword(!showNewPassword)}
            >
              <Ionicons 
                name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          }
        />

        {/* Re-enter Password Input */}
        <FloatingLabelInput
          label="Re-enter Password"
          value={reEnterPassword}
          onChangeText={setReEnterPassword}
          secureTextEntry={!showReEnterPassword}
          editable={!isLoading}
          containerStyle={styles.inputContainer}
          rightAccessory={
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowReEnterPassword(!showReEnterPassword)}
            >
              <Ionicons 
                name={showReEnterPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#666" 
              />
            </TouchableOpacity>
          }
        />

        <Text style={styles.footerText}>
            By continuing, I agree to Wami{'\n'}
            <Text style={styles.link}>Privacy Policy</Text> and <Text style={styles.link}>Terms of Use.</Text>
        </Text>

        <View style={{flex: 1}} />

        {/* Next Button */}
        <TouchableOpacity 
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={isLoading}
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
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
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
    color: '#fff',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  inputContainer: {
    marginBottom: 20,
  },
  eyeButton: {
      padding: 16,
  },
  footerText: {
      fontSize: 12,
      color: '#999',
      textAlign: 'center',
      marginTop: 20,
      lineHeight: 18,
  },
  link: {
      textDecorationLine: 'underline',
      color: '#999', // Design shows grey links here
  },
  nextButton: {
    height: 56,
    backgroundColor: Colors.light.primary,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40, // Space it out a bit
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
