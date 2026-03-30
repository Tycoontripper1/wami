import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import Colors from '@/constants/Colors';
import { authService } from '@/services/authService';
import { signUpFailure, signUpStart, signUpSuccess } from '@/store/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CreateAccountScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email: string; token: string }>();
  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    border: isDark ? '#333' : '#E0E0E0',
    icon: isDark ? '#fff' : '#000',
  };

  const handleCreateAccount = async () => {
    if (!firstName || !lastName || !username || !password || !passwordConfirmation || !agreeToPrivacy || !agreeToTerms) {
      Alert.alert('Error', 'Please fill all fields and agree to the terms');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    if (password !== passwordConfirmation) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      dispatch(signUpStart());
      const result = await authService.completeSignUp({
        token: params.token as string,
        first_name: firstName,
        last_name: lastName,
        username,
        password,
        password_confirmation: passwordConfirmation,
      });
      dispatch(signUpSuccess(result));

      Alert.alert('Success', result.message || 'Registration completed successfully', [
        { text: 'OK', onPress: () => router.push('./account-success' as any) }
      ]);
    } catch (err: any) {
      dispatch(signUpFailure(err.message || 'Sign up failed'));
      Alert.alert('Sign Up Failed', err.message || 'Please try again');
    }
  };

  const isFormValid = firstName && lastName && username && password && passwordConfirmation && agreeToPrivacy && agreeToTerms;

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={themeColors.icon} />
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
          <Text style={[styles.title, { color: themeColors.text }]}>Sign Up to become part of the family</Text>
          <Text style={[styles.subtitle, { color: themeColors.subText }]}>Sign up with your details and know more</Text>
        </View>

        {/* Form Inputs */}
        <View style={styles.formContainer}>
          {/* First Name */}
          <FloatingLabelInput
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            containerStyle={styles.inputWrapper}
          />

          {/* Last Name */}
          <FloatingLabelInput
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            containerStyle={styles.inputWrapper}
          />

          {/* Username */}
          <FloatingLabelInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            containerStyle={styles.inputWrapper}
          />

          {/* Password */}
          <View style={styles.inputWrapper}>
            <FloatingLabelInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              rightAccessory={
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={themeColors.subText}
                  />
                </TouchableOpacity>
              }
            />
            <Text style={[styles.passwordHint, { color: themeColors.subText }]}>
              Password must be at least 8 characters
            </Text>
          </View>

          {/* Password Confirmation */}
          <View style={styles.inputWrapper}>
            <FloatingLabelInput
              label="Confirm Password"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              secureTextEntry={!showPasswordConfirmation}
              autoCapitalize="none"
              rightAccessory={
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                >
                  <Ionicons
                    name={showPasswordConfirmation ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={themeColors.subText}
                  />
                </TouchableOpacity>
              }
            />
          </View>

          {/* Checkboxes */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setAgreeToPrivacy(!agreeToPrivacy)}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: themeColors.border },
                agreeToPrivacy && styles.checkboxChecked
              ]}>
                {agreeToPrivacy && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={[styles.checkboxText, { color: themeColors.subText }]}>
                I agree to Wami's <Text style={styles.link}>Privacy Policy</Text> and{'\n'}
                <Text style={styles.link}>Service Privacy</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: themeColors.border },
                agreeToTerms && styles.checkboxChecked
              ]}>
                {agreeToTerms && <Ionicons name="checkmark" size={16} color="#fff" />}
              </View>
              <Text style={[styles.checkboxText, { color: themeColors.subText }]}>
                I agree to Wami's <Text style={styles.link}>Privacy Policy</Text> and{'\n'}
                <Text style={styles.link}>Terms of Use</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Create Account Button */}
        <TouchableOpacity 
          style={[styles.createButton, (!isFormValid || isLoading) && styles.createButtonDisabled]}
          onPress={handleCreateAccount}
          disabled={!isFormValid || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Account</Text>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
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
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  eyeButton: {
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  passwordHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 6,
  },
  checkboxContainer: {
    marginTop: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  link: {
    color: Colors.light.primary,
    textDecorationLine: 'underline',
  },
  createButton: {
    height: 56,
    backgroundColor: Colors.light.primary,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
