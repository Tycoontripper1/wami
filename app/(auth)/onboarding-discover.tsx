import CreativeCard from '@/components/CreativeCard';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Mock data for onboarding
const ONBOARDING_CREATIVES = [
  {
    id: '1',
    name: 'Sandra Hair Studio',
    role: 'HairStylist',
    location: 'Manchester',
    distance: '2.5 km away',
    rating: 4.9,
    reviews: 120,
    image: require('@/assets/images/onboarding_bg_creative.png'), 
  },
  {
    id: '2',
    name: 'Mike Photography',
    role: 'Photographer',
    location: 'London',
    distance: '5.0 km away',
    rating: 4.8,
    reviews: 85,
    image: require('@/assets/images/onboarding_bg_service.png'),
  },
  {
    id: '3',
    name: 'Sarah Makeup Art',
    role: 'Makeup Artist',
    location: 'Birmingham',
    distance: '3.2 km away',
    rating: 5.0,
    reviews: 200,
    image: require('@/assets/images/onboarding_bg_seller.png'),
  },
];

export default function OnboardingDiscoverScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#ccc' : '#666',
    border: isDark ? '#333' : '#E0E0E0',
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.tabContainer}>
           <View style={styles.activeTabItem}>
              <Text style={styles.activeTabText}>Discover</Text>
              <View style={styles.activeIndicator} />
           </View>
           <Text style={styles.inactiveTabText}>Trending</Text>
           <Text style={styles.inactiveTabText}>Near You</Text>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
         <ScrollView 
           horizontal 
           pagingEnabled 
           showsHorizontalScrollIndicator={false}
           contentContainerStyle={styles.scrollContent}
           decelerationRate="fast"
           snapToInterval={width * 0.9 + 16}
           snapToAlignment="center"
         >
            {ONBOARDING_CREATIVES.map((item) => (
               <CreativeCard 
                  key={item.id}
                  id={item.id}
                  name={item.name}
                  role={item.role}
                  location={item.location}
                  distance={item.distance}
                  rating={item.rating}
                  reviews={item.reviews}
                  image={item.image}
                  onSave={() => {}}
               />
            ))}
            <View style={{ width: 16 }} /> 
         </ScrollView>
      </View>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
              <Text style={[styles.skipText, { color: themeColors.subText }]}>Skip</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleNext} style={styles.continueButton}>
              <Text style={styles.continueText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: 'transparent', 
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  activeTabItem: {
    alignItems: 'center',
  },
  activeTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  activeIndicator: {
    width: 20,
    height: 3,
    backgroundColor: Colors.light.primary,
    borderRadius: 1.5,
  },
  inactiveTabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
      paddingHorizontal: (width - (width * 0.9)) / 2, 
      alignItems: 'center',
  },
  footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 20,
  },
  skipButton: {
      padding: 12,
  },
  skipText: {
      fontSize: 16,
      fontWeight: '500',
      color: '#666',
  },
  continueButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.light.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 30,
      gap: 8,
  },
  continueText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#fff',
  },
});
