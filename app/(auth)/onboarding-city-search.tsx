import OnboardingProgress from '@/components/OnboardingProgress';
import Colors from '@/constants/Colors';
import { setSelectedCity } from '@/store/onboardingSlice';
import { RootState } from '@/store/store';
import { POPULAR_CITIES } from '@/types/onboarding';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

export default function OnboardingCitySearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const savedCity = useSelector((state: RootState) => state.onboarding.selectedCity);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCityState] = useState<string | undefined>(savedCity);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    inputBg: isDark ? '#1A1A1A' : '#F5F5F5',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const filteredCities = searchQuery
    ? POPULAR_CITIES.filter((city) => city.toLowerCase().includes(searchQuery.toLowerCase()))
    : POPULAR_CITIES;

  const handleCitySelect = (city: string) => {
    setSelectedCityState(city);
    dispatch(setSelectedCity(city));
  };

  const handleSkip = () => {
    router.push('./onboarding-notifications' as any);
  };

  const handleNext = () => {
    router.push('./onboarding-notifications' as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <OnboardingProgress currentStep={5} totalSteps={7} />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <View style={styles.headerContainer}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Where do you want to{'\n'}discover creatives?
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.subText }]}>Choose your preferred location settings</Text>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { backgroundColor: themeColors.inputBg }]}>
            <Ionicons name="search" size={20} color={themeColors.subText} />
            <TextInput
              style={[styles.searchInput, { color: themeColors.text }]}
              placeholder="Search for a City"
              placeholderTextColor={themeColors.subText}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={[styles.dismissText, { color: themeColors.subText }]}>Dismiss</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* City List */}
          <ScrollView
            style={styles.cityList}
            contentContainerStyle={styles.cityListContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredCities.map((city) => (
              <TouchableOpacity
                key={city}
                style={[
                  styles.cityItem,
                  {
                    backgroundColor: selectedCity === city ? Colors.light.primary : themeColors.inputBg,
                  },
                ]}
                onPress={() => handleCitySelect(city)}
              >
                <Ionicons name="location" size={20} color={selectedCity === city ? '#fff' : themeColors.subText} />
                <Text
                  style={[
                    styles.cityText,
                    { color: selectedCity === city ? '#fff' : themeColors.text },
                  ]}
                >
                  {city}
                </Text>
                {selectedCity === city && <Ionicons name="checkmark-circle" size={20} color="#fff" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: themeColors.subText }]}>Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            style={[styles.nextButton, { opacity: selectedCity ? 1 : 0.5 }]}
            disabled={!selectedCity}
          >
            <Text style={styles.nextText}>Next</Text>
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
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '500',
  },
  cityList: {
    flex: 1,
  },
  cityListContent: {
    paddingBottom: 20,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  cityText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  nextButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 30,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
