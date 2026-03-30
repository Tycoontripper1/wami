import OnboardingProgress from '@/components/OnboardingProgress';
import Colors from '@/constants/Colors';
import { setLocation, setNotificationsEnabled } from '@/store/onboardingSlice';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';

export default function OnboardingNotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isLoading, setIsLoading] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    cardBg: isDark ? '#1A1A1A' : '#F5F5F5',
  };

  const requestPermissions = async () => {
    setIsLoading(true);
    try {
      // Request notification permissions
      const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
      dispatch(setNotificationsEnabled(notificationStatus === 'granted'));

      // Request location permissions
      const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (locationStatus === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({});
          dispatch(setLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }));
        } catch (error) {
          console.log('Error getting location:', error);
        }
      }

      // Navigate to completion screen
      router.push('./onboarding-complete' as any);
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request permissions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDontAllow = () => {
    dispatch(setNotificationsEnabled(false));
    router.push('./onboarding-complete' as any);
  };

  const handleAllow = () => {
    requestPermissions();
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <OnboardingProgress currentStep={6} totalSteps={7} />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: themeColors.text }]}>Stay in the loop</Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>
              Get notified about new creatives, messages, and updates that match your interests
            </Text>
          </View>

          {/* Permission Card */}
          <View style={[styles.permissionCard, { backgroundColor: themeColors.cardBg }]}>
            <Text style={[styles.cardTitle, { color: themeColors.text }]}>
              "Wami" Would Like to Send You Notifications
            </Text>
            <Text style={[styles.cardSubtitle, { color: themeColors.subText }]}>
              Notifications may include alerts, sounds, and icon badges. This can be configured in Settings.
            </Text>

            {Platform.OS === 'ios' && (
              <Text style={[styles.locationNote, { color: themeColors.subText }]}>
                📍 We'll also request access to your location to show nearby creatives.
              </Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleDontAllow} style={styles.dontAllowButton} disabled={isLoading}>
            <Text style={[styles.dontAllowText, { color: themeColors.subText }]}>Don't Allow</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleAllow} style={styles.allowButton} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.allowText}>Allow</Text>
            )}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  progressContainer: {
    marginBottom: 24,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  headerContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  permissionCard: {
    padding: 20,
    borderRadius: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  locationNote: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    gap: 12,
  },
  dontAllowButton: {
    flex: 1,
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  dontAllowText: {
    fontSize: 16,
    fontWeight: '600',
  },
  allowButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  allowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
