import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
// Card width matches design, slightly smaller than screen width
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = 600;

interface CreativeCardProps {
  id: string;
  name: string;
  role: string;
  location: string;
  distance?: string;
  rating: number;
  reviews: number;
  image: any;
  onSave?: () => void;
}

export default function CreativeCard({ 
  id, 
  name, 
  role, 
  location, 
  distance, 
  rating, 
  reviews, 
  image,
  onSave 
}: CreativeCardProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Image Section */}
      <View style={styles.imageContainer}>
        <Image source={image} style={styles.image} resizeMode="cover" />
        
        {/* Top Overlay Icons */}
        <View style={styles.overlayIcons}>
           <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="logo-instagram" size={20} color="#fff" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="link-outline" size={20} color="#fff" />
           </TouchableOpacity>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
           <Text style={styles.name}>{name}</Text>
           <TouchableOpacity onPress={onSave}>
              <Ionicons name="heart-outline" size={24} color="#000" />
           </TouchableOpacity>
        </View>

        <View style={styles.detailsRow}>
           <View style={styles.detailItem}>
              <Ionicons name="navigate-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{location}</Text>
           </View>
           <View style={styles.detailItem}>
              <Ionicons name="pricetag-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{role}</Text>
           </View>
        </View>

        {distance && (
            <View style={styles.detailItem}>
               <Ionicons name="location-outline" size={14} color="#666" />
               <Text style={styles.detailText}>{distance}</Text>
            </View>
        )}

        <View style={styles.ratingRow}>
           <Ionicons name="star" size={14} color="#FFD700" />
           <Text style={styles.ratingText}>{rating}</Text>
           <Text style={styles.reviewsText}> ({reviews} reviews)</Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
           <TouchableOpacity style={styles.saveButton} onPress={onSave}>
              <Text style={styles.saveButtonText}>Save</Text>
           </TouchableOpacity>
           
           <TouchableOpacity 
             style={styles.profileButton} 
             onPress={() => router.push(`/profile/${id}`)}
           >
              <Text style={styles.profileButtonText}>Profile</Text>
           </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginRight: 16, // Spacing between cards
  },
  imageContainer: {
    height: '65%',
    width: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlayIcons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  reviewsText: {
    fontSize: 14,
    color: '#999',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  saveButton: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.primary,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  profileButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    // Shadow specifically for this button to match design style
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  profileButtonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
  },
});
