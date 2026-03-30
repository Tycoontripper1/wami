import BrandInput from '@/components/creative-onboarding/BrandInput';
import OnboardingButtons from '@/components/creative-onboarding/OnboardingButtons';
import OnboardingProgress from '@/components/OnboardingProgress';
import Colors from '@/constants/Colors';
import { setBrandDetails } from '@/store/creativeOnboardingSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function CreativeBrandScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const brand = useSelector((state: RootState) => state.creativeOnboarding.brand);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    inputBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const handleNameChange = (name: string) => {
    dispatch(setBrandDetails({ name }));
  };

  const handleLocationChange = (location: string) => {
    dispatch(setBrandDetails({ location }));
  };

  const handleGetLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please enable location access in settings');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const locationString = `${address.city || address.region}, ${address.country}`;
        dispatch(setBrandDetails({
          location: locationString,
          coordinates: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to get location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleSkip = () => {
    router.push('./creative-instagram' as any);
  };

  const handleNext = () => {
    router.push('./creative-instagram' as any);
  };

  const isValid = brand.name.trim().length > 0;

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingProgress currentStep={4} totalSteps={8} />

        <Text style={[styles.title, { color: themeColors.text }]}>Your brand details</Text>
        <Text style={[styles.subtitle, { color: themeColors.subText }]}>
          Tell us about your business
        </Text>

        <View style={styles.formContainer}>
          <BrandInput
            icon="storefront-outline"
            placeholder="Brand Name e.g hair shop etc"
            value={brand.name}
            onChangeText={handleNameChange}
          />

          <View style={styles.locationRow}>
            <View style={styles.locationInputWrapper}>
              <BrandInput
                icon="location-outline"
                placeholder="Location"
                value={brand.location}
                onChangeText={handleLocationChange}
              />
            </View>
            <TouchableOpacity
              style={[styles.locationButton, { backgroundColor: themeColors.inputBg, borderColor: themeColors.border }]}
              onPress={handleGetLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
              ) : (
                <Ionicons name="navigate" size={20} color={Colors.light.primary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <OnboardingButtons
          onSkip={handleSkip}
          onNext={handleNext}
          nextDisabled={!isValid}
        />
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
    flexGrow: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 30,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
  },
  formContainer: {
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  locationInputWrapper: {
    flex: 1,
  },
  locationButton: {
    width: 52,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});
