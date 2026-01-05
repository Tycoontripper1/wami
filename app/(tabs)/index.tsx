import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions, StatusBar, TextInput, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import CreativeCard from '@/components/CreativeCard';

const { width } = Dimensions.get('window');

// Mock data
const CREATIVES = [
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

const TABS = ['Discover', 'Trending', 'Near You'];

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('Trending'); 

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header Area */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
           <View style={styles.logoContainer}>
              <Text style={styles.logoText}>W</Text>
           </View>
           <TouchableOpacity>
              <Ionicons name="search" size={24} color="#000" />
           </TouchableOpacity>
        </View>

        {/* Custom Tab Bar */}
        <View style={styles.tabContainer}>
           {TABS.map((tab) => (
             <TouchableOpacity 
               key={tab} 
               style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
               onPress={() => setActiveTab(tab)}
             >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                   {tab}
                </Text>
                {activeTab === tab && <View style={styles.activeIndicator} />}
             </TouchableOpacity>
           ))}
           <TouchableOpacity style={styles.filterButton}>
               <Ionicons name="options-outline" size={20} color={Colors.light.primary} />
           </TouchableOpacity>
        </View>
      </View>

      {/* Swipeable Content */}
      <View style={styles.contentContainer}>
         <ScrollView 
           horizontal 
           pagingEnabled 
           showsHorizontalScrollIndicator={false}
           contentContainerStyle={styles.scrollContent}
           decelerationRate="fast"
           snapToInterval={width * 0.9 + 16} // Card width + margin
           snapToAlignment="center"
         >
            {CREATIVES.map((item) => (
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
                  onSave={() => console.log('Saved', item.id)}
               />
            ))}
            {/* Spacer for last item padding */}
            <View style={{ width: 16 }} /> 
         </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA', 
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
    marginTop: 10,
  },
  logoContainer: {
     // If you want the W logo here
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  tabItemActive: {
    // Active styling if needed
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#000', 
  },
  activeIndicator: {
     position: 'absolute',
     bottom: -2,
     width: 20,
     height: 3,
     backgroundColor: Colors.light.primary,
     borderRadius: 1.5,
  },
  filterButton: {
      marginLeft: 'auto', 
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  scrollContent: {
      paddingHorizontal: (width - (width * 0.9)) / 2, // Center the first card
      alignItems: 'center',
  },
});
