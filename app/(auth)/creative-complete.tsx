import Colors from '@/constants/Colors';
import { Ionicons } from '@/components/FlatIcon';
import { useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Text } from '@/components/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';



export default function CreativeCompleteScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#0F1419',
    subText: isDark ? '#ccc' : '#666',
  };

  // The account was saved on the previous screen; this is only the welcome.
  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.content, { paddingTop: insets.top + 60 }]}>
        <View style={styles.iconContainer}>
          <Text style={styles.emoji}>🎉</Text>
        </View>

        <Text style={[styles.title, { color: themeColors.text }]}>You are all set!</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          We will start showing you creatives based on your interests.
        </Text>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 30 }]}>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#0F1419" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 10,
  },
  buttonText: {
    color: '#0F1419',
    fontSize: 18,
    fontWeight: '600',
  },
});
