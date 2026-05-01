import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AccountSuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
  };

  const handleDiscover = () => {
    // Navigate to the promotional onboarding carousel
    router.push('./onboarding-discover' as any);
  };

  const handleCreative = () => {
    // Navigate to connect instagram or create profile
    router.push('./connect-instagram' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      <View style={[styles.content, { paddingTop: insets.top + 20 }]}>
        {/* Success Icon */}
        <View style={styles.successIconContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color="#fff" />
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: themeColors.text }]}>Welcome to Wami!</Text>
          <Text style={[styles.subtitle, { color: themeColors.subText }]}>Your account has been created successfully.</Text>
        </View>

        <Text style={[styles.questionText, { color: themeColors.text }]}>What brings you to Wami today?</Text>

        {/* Options */}
        <TouchableOpacity 
          style={[styles.optionCard, { backgroundColor: themeColors.cardBg }]}
          onPress={handleDiscover}
        >
          <View style={styles.iconContainer}>
             <Ionicons name="search" size={32} color={Colors.light.primary} />
          </View>
          <View style={styles.textContainer}>
             <Text style={[styles.optionTitle, { color: themeColors.text }]}>Discover Creatives</Text>
             <Text style={[styles.optionSubtitle, { color: themeColors.subText }]}>
                Find hair stylists, makeup artists, and photographers near you.
             </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={themeColors.subText} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.optionCard, { backgroundColor: themeColors.cardBg }]}
          onPress={handleCreative}
        >
          <View style={styles.iconContainer}>
             <Ionicons name="camera" size={32} color={Colors.light.primary} />
          </View>
          <View style={styles.textContainer}>
             <Text style={[styles.optionTitle, { color: themeColors.text }]}>I'm a Creative</Text>
             <Text style={[styles.optionSubtitle, { color: themeColors.subText }]}>
                Showcase your work and get booked by clients.
             </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={themeColors.subText} />
        </TouchableOpacity>

      </View>
    </View>
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
    justifyContent: 'center',
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    color: '#000',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
