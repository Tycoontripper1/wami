import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiClient } from './api/client';
import { API_ENDPOINTS } from './api/config';

/* Push notifications: tell the server which phone to notify. Sending needs the
   Apple and Google credentials on the server; until they are there this
   registers quietly and nothing arrives. Every step is allowed to fail without
   the person noticing, because push is a bonus. */

const TOKEN_KEY = '@wami_push_token';

// Show an alert while the app is open, instead of swallowing it.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

/** Register this phone for the signed-in account. Never asks for permission; the onboarding and settings screens do that. */
export async function registerDevice(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    // The phone's own push address (APNs on iPhone, Firebase on Android).
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    if (!token || typeof token !== 'string') return;

    await apiClient.post(API_ENDPOINTS.DEVICES.REGISTER, {
      token,
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version ?? '1.0.0',
      locale: Intl.DateTimeFormat().resolvedOptions().locale ?? 'en',
    });
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    // No push credentials yet, no permission, or the server said no: carry on.
    console.log('Push registration skipped:', (error as any)?.message ?? error);
  }
}

/** Stop notifications for this phone. Called while the person is still signed in. */
export async function unregisterDevice(): Promise<void> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return;
    await apiClient.delete(API_ENDPOINTS.DEVICES.BY_TOKEN(token), { expectUnsupported: true });
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // The server may keep it until it fails to deliver; local sign-out is what counts.
  }
}
