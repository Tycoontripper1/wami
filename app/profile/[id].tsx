import React from 'react';
import { StyleSheet, View, Text, Image, ScrollView, TouchableOpacity, Dimensions, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';

const { width } = Dimensions.get('window');

// Mock data (normally fetched by ID)
const MOCK_PROFILE = {
  id: '1',
  name: 'Sandra Hair Studio',
  role: 'HairStylist',
  location: 'Manchester',
  distance: '2.5 km away',
  rating: 4.9,
  reviews: 120,
  about: 'Specializing in contemporary cuts and color. We bring out your best look with our premium services and experienced stylists.',
  tags: ['Hair', 'Color', 'Styling'],
  images: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1521590832169-d7fcbe313d1f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
  ],
};

export default function ProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  // In a real app, useQuery(id) to fetch data
  const profile = MOCK_PROFILE; 

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: profile.images[0] }} style={styles.headerImage} />
          
          {/* Header Actions */}
          <View style={[styles.headerActions, { paddingTop: insets.top + 10 }]}>
             <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
             </TouchableOpacity>
             <View style={styles.rightIcons}>
                <TouchableOpacity style={styles.iconButton}>
                   <Ionicons name="heart-outline" size={24} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconButton}>
                   <Ionicons name="share-social-outline" size={24} color="#fff" />
                </TouchableOpacity>
             </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.headerInfo}>
             <View>
                <Text style={styles.name}>{profile.name}</Text>
                <View style={styles.subInfo}>
                    <Ionicons name="location-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{profile.location}</Text>
                    <View style={styles.dot} />
                    <Ionicons name="pricetag-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>{profile.role}</Text>
                </View>
             </View>
             <View style={styles.ratingBox}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.ratingText}>{profile.rating}</Text>
                <Text style={styles.reviewText}>({profile.reviews})</Text>
             </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bodyText}>{profile.about}</Text>

          <View style={styles.tagsContainer}>
            {profile.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Gallery</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>
             {profile.images.map((img, idx) => (
                 <Image key={idx} source={{ uri: img }} style={styles.galleryImage} />
             ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
         <TouchableOpacity style={styles.messageButton}>
             <Ionicons name="chatbubble-outline" size={24} color={Colors.light.primary} />
         </TouchableOpacity>
         <TouchableOpacity style={styles.bookButton}>
             <Text style={styles.bookButtonText}>Book Now</Text>
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
  imageContainer: {
    height: 350,
    width: '100%',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  rightIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    marginTop: -30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 100, // Space for footer
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    marginRight: 8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    marginRight: 8,
  },
  ratingBox: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginTop: 4,
  },
  reviewText: {
    fontSize: 12,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  bodyText: {
    fontSize: 15,
    color: '#444',
    lineHeight: 24,
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: '#F0F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  gallery: {
    marginBottom: 24,
  },
  galleryImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginRight: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    padding: 24,
    gap: 16,
  },
  messageButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButton: {
    flex: 1,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
