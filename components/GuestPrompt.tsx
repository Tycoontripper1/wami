import { Text } from '@/components/AppText';
import FlatIllustration, { IllustrationName } from '@/components/illustrations/FlatIllustration';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';

/** What a logged-out visitor sees on a screen that only makes sense with an account. */
export default function GuestPrompt({
  illustration = 'chat',
  title,
  message,
}: {
  illustration?: IllustrationName;
  title: string;
  message: string;
}) {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const text = isDark ? '#FFFFFF' : '#0F1419';
  const sub = isDark ? '#9AA5AD' : '#5E6670';

  return (
    <View style={styles.wrap}>
      <FlatIllustration name={illustration} width={200} soft />
      <Text style={[styles.title, { color: text }]}>{title}</Text>
      <Text style={[styles.message, { color: sub }]}>{message}</Text>
      <TouchableOpacity style={styles.primary} onPress={() => router.push('/(auth)/sign-in' as any)}>
        <Text style={styles.primaryText}>Sign in</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={() => router.push('/(auth)/sign-up-email' as any)}>
        <Text style={[styles.secondaryText, { color: Colors.light.primary }]}>Create an account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 22, fontWeight: '800', marginTop: 8, textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, marginBottom: 24 },
  primary: {
    alignSelf: 'stretch',
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#0F1419' },
  secondary: { paddingVertical: 14 },
  secondaryText: { fontSize: 15, fontWeight: '700' },
});
