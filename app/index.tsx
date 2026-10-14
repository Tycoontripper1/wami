import ToolsScatter from '@/components/ToolsScatter';
import { WAMILogo } from '@/components/logo';
import { Brand } from '@/constants/Brand';
import { Illo } from '@/constants/Illustration';
import { authService } from '@/services/authService';
import { restoreSession } from '@/store/authSlice';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View, useColorScheme, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

/**
 * The first screen: the Wami pin and the tools creatives work with, a plain
 * headline with one highlighted word, and two clear choices. It is one screen
 * on purpose; the tour of what the app does follows after sign-up.
 */
export default function WelcomeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const { width, height } = useWindowDimensions();
  const isDark = useColorScheme() === 'dark';
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const session = await authService.restoreSession();
      if (session) {
        dispatch(restoreSession(session));
        // Only leave this screen when it is the one being shown. A deep link
        // (or notification) opens its target above this screen in the stack,
        // and redirecting from underneath would throw the user off the link.
        if (navigation.isFocused()) {
          router.replace('/(tabs)');
        }
      } else {
        setIsCheckingAuth(false);
      }
    };
    checkSession();
  }, []);

  // Show the brand splash while the saved session is being checked
  if (isCheckingAuth) {
    const loadingBg = isDark ? Brand.splash.dark : Brand.splash.light;
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: loadingBg }]}>
        <StatusBar barStyle="light-content" />
        <WAMILogo size="large" variant="pin" color={Brand.white} cutoutColor={loadingBg} />
      </View>
    );
  }

  const theme = {
    background: isDark ? '#0F1419' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0F1419',
    sub: isDark ? '#B8C0C8' : '#5A646E',
    primaryBg: isDark ? '#FFFFFF' : '#0F1419',
    primaryText: isDark ? '#0F1419' : '#FFFFFF',
    border: isDark ? '#3A4550' : '#C9D1D8',
  };

  const sceneHeight = Math.round(Math.min(400, height * 0.46));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={{ paddingTop: insets.top + 8 }}>
        <ToolsScatter width={width} height={sceneHeight} />
      </View>

      <View style={[styles.body, { paddingBottom: insets.bottom + 20 }]}>
        <View>
          <Text style={[styles.title, { color: theme.text }]}>Find creatives</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>near you</Text>
          </View>
          <Text style={[styles.subtitle, { color: theme.sub }]}>
            Photographers, stylists, makers and sellers in your city. Browse their work, talk to them and book a date.
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.primary, { backgroundColor: theme.primaryBg }]}
            onPress={() => router.push('/(auth)/sign-up-email')}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryText, { color: theme.primaryText }]}>Create an account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondary, { borderColor: theme.border }]}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.85}
          >
            <Text style={[styles.secondaryText, { color: theme.text }]}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 46,
    letterSpacing: -0.7,
  },
  pill: {
    alignSelf: 'flex-start',
    backgroundColor: Illo.amber,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginTop: 4,
    transform: [{ rotate: '-3deg' }],
  },
  pillText: {
    color: Illo.ink,
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 48,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
  },
  buttons: {
    gap: 12,
  },
  primary: {
    borderRadius: 30,
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '800',
  },
  secondary: {
    borderRadius: 30,
    borderWidth: 2,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
