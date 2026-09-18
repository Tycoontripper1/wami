import { AppSplashScreen } from '@/components/AppSplashScreen';
import { useColorScheme } from '@/components/useColorScheme';
import { apiClient } from '@/services/api/client';
import { profileService } from '@/services/api/profileService';
import { authService } from '@/services/authService';
import { signOut } from '@/store/authSlice';
import { store } from '@/store/store';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import 'react-native-reanimated';
import { Provider, useDispatch } from 'react-redux';

// How often to proactively check whether the stored token is still valid.
// There's no GET /auth/me or POST /auth/refresh yet (see
// docs/API-AUDIT-01-AUTH.md §3.1), so there's no way to know the real token
// TTL or ask "is this still good?" cheaply — this just piggybacks on
// whatever authenticated GET is lightest (profile) and lets the existing
// 401 handler below do the actual sign-out. 5 minutes is a guess, not a
// confirmed value; tighten or loosen once backend confirms token lifetime.
const SESSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: 'index',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });
  const [splashReady, setSplashReady] = useState(false);

  const handleSplashReady = useCallback(() => {
    setSplashReady(true);
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore error */
      });
    }
  }, [loaded]);

  if (!loaded || !splashReady) {
    return <AppSplashScreen onReady={handleSplashReady} />;
  }

  return <RootLayoutNav />;
}

/**
 * Registers the app-wide "our token was rejected" handler, and a periodic
 * check that catches an expired/revoked token even if the user hasn't
 * triggered any other API call in a while. Renders nothing; it only needs
 * to live inside the Redux Provider.
 */
function ExpiredSessionHandler() {
  const dispatch = useDispatch();
  const isSigningOut = useRef(false);

  useEffect(() => {
    const expireSession = () => {
      if (isSigningOut.current) return; // avoid double sign-out races
      isSigningOut.current = true;
      void authService.signOut(); // clears the cached user/token from AsyncStorage
      dispatch(signOut());
      router.replace('/(auth)/sign-in');
    };

    // Reactive: the backend rejected a request we sent a token with.
    apiClient.setUnauthorizedHandler(expireSession);

    // Proactive: periodically (and whenever the app returns to the
    // foreground) ping a lightweight authenticated endpoint purely to
    // validate the token. A 401 here is caught by the handler above; any
    // other failure (network blip, unrelated 500) is ignored so we don't
    // sign the user out for a reason that has nothing to do with their
    // session.
    const checkSession = () => {
      if (!apiClient.getAuthToken() || isSigningOut.current) return;
      profileService.getProfile().catch(() => {});
    };

    const interval = setInterval(checkSession, SESSION_CHECK_INTERVAL_MS);
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkSession();
    });

    return () => {
      apiClient.setUnauthorizedHandler(null);
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [dispatch]);

  return null;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <Provider store={store}>
      <ExpiredSessionHandler />
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="booking-history" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="creative-dashboard" options={{ headerShown: false }} />
          <Stack.Screen name="creative-dna-quiz" options={{ headerShown: false }} />
          <Stack.Screen name="location-picker" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="checkout/index" options={{ headerShown: false }} />
          <Stack.Screen name="checkout/success" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="order-tracking/[orderId]" options={{ headerShown: false }} />
          <Stack.Screen name="service-tracking/[bookingId]" options={{ headerShown: false }} />
          <Stack.Screen name="orders" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="seller-analytics" options={{ headerShown: false }} />
          <Stack.Screen name="booking-calendar" options={{ headerShown: false }} />
          <Stack.Screen name="booking-reschedule/[bookingId]" options={{ headerShown: false }} />
          <Stack.Screen name="my-products" options={{ headerShown: false }} />
          <Stack.Screen name="products-listing" options={{ headerShown: false }} />
          <Stack.Screen name="product-detail/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="favourites" options={{ headerShown: false }} />
          <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
          <Stack.Screen name="account-actions" options={{ headerShown: false }} />
          <Stack.Screen name="wallet/add-funds" options={{ headerShown: false }} />
          <Stack.Screen name="wallet/payment-methods" options={{ headerShown: false }} />
          <Stack.Screen name="wallet/withdraw" options={{ headerShown: false }} />
          <Stack.Screen name="add-service" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="share-post" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen name="delivery/arrange/[orderId]" options={{ headerShown: false }} />
          <Stack.Screen name="delivery/waiting/[orderId]" options={{ headerShown: false }} />
          <Stack.Screen name="delivery/compare/[orderId]" options={{ headerShown: false }} />
          <Stack.Screen name="delivery/tracking/[orderId]" options={{ headerShown: false, gestureEnabled: false }} />
          <Stack.Screen name="delivery/rate/[orderId]" options={{ headerShown: false, gestureEnabled: false }} />
        </Stack>
      </ThemeProvider>
    </Provider>
  );
}
