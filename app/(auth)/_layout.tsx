import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="sign-up-email" />
      <Stack.Screen name="verification-code" />
      <Stack.Screen name="create-account" />
      <Stack.Screen name="account-success" />
      <Stack.Screen name="login-success" />
      <Stack.Screen name="connect-instagram" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="reset-verification-code" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
