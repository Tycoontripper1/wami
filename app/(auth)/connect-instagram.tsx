import InstagramConnectCard from '@/components/InstagramConnectCard';
import { Illo } from '@/constants/Illustration';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * After sign-up, for people who say they are creatives: connect Instagram with
 * the backend's real OAuth flow, or skip and go straight in.
 */
export default function ConnectInstagramScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const fromProfile = from === 'profile';
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';

  const theme = {
    background: isDark ? '#000' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#0F1419',
    sub: isDark ? '#B8C0C8' : '#4A545E',
  };

  // From the profile menu: just go back. From sign-up: carry on into the app.
  const goHome = () => (fromProfile ? router.back() : router.replace('/(tabs)'));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.text }]}>Show your work</Text>
        <Text style={[styles.subtitle, { color: theme.sub }]}>
          Connect Instagram and your posts become listings you can edit and share. You can do this later from
          your profile.
        </Text>

        <InstagramConnectCard />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity style={styles.continue} onPress={goHome} activeOpacity={0.85}>
          <Text style={styles.continueText}>{fromProfile ? 'Done' : 'Continue'}</Text>
        </TouchableOpacity>
        {fromProfile ? null : (
          <TouchableOpacity onPress={goHome} style={styles.skip}>
            <Text style={[styles.skipText, { color: theme.sub }]}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    gap: 16,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  footer: {
    paddingHorizontal: 24,
    gap: 6,
  },
  continue: {
    backgroundColor: Illo.ink,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  skip: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
