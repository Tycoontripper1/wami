import { Text } from '@/components/AppText';
import { Ionicons } from '@/components/FlatIcon';
import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { ScrollView, StatusBar, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** The shared frame for plain content screens (Help, About, Privacy): a back arrow, a title, a scrolling body. */
export function useInfoTheme() {
  const isDark = useColorScheme() === 'dark';
  return {
    isDark,
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    sub: isDark ? '#9AA5AD' : '#5E6670',
    card: isDark ? '#1A1A1A' : '#F5F7F8',
    border: isDark ? '#2C2C2E' : '#E3E7EA',
  };
}

export default function InfoPage({ title, children }: { title: string; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useInfoTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.background }]}>
      <StatusBar barStyle={t.isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={t.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: t.text }]}>{title}</Text>
        <View style={styles.back} />
      </View>
      <ScrollView contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8 },
  back: { width: 44, height: 44, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  body: { paddingHorizontal: 16, paddingTop: 8, gap: 16 },
});
