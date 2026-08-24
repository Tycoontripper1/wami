import Colors from '@/constants/Colors';
import { getRegionCodes, REGIONS } from '@/data/regions';
import { setLocation } from '@/store/locationSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import MapView, { Marker, Region } from '@/components/maps/MapKit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

// Default initial region (Africa/Europe view)
const DEFAULT_REGION = {
  latitude: 20.0,
  longitude: 10.0,
  latitudeDelta: 60.0,
  longitudeDelta: 60.0,
};

export default function LocationPickerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const dispatch = useDispatch();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const mapRef = useRef<MapView>(null);
  
  const currentLocation = useSelector((state: RootState) => state.location);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState(currentLocation.currentRegion);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  
  // Map state
  const [mapRegion, setMapRegion] = useState<Region>(DEFAULT_REGION);
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    city?: string;
    country?: string;
    isoCountryCode?: string;
  } | null>(currentLocation.coordinates ? {
    latitude: currentLocation.coordinates.lat,
    longitude: currentLocation.coordinates.lng,
    city: currentLocation.currentCity,
    country: REGIONS[currentLocation.currentRegion]?.name,
    isoCountryCode: currentLocation.currentRegion,
  } : null);

  const themeColors = {
    background: isDark ? '#000' : '#fff',
    text: isDark ? '#fff' : '#000',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#1a1a1a' : '#f5f5f5',
    border: isDark ? '#333' : '#e0e0e0',
    inputBg: isDark ? '#1a1a1a' : '#f5f5f5',
  };

  // Initial map setup
  useEffect(() => {
    if (currentLocation.coordinates) {
      const region = {
        latitude: currentLocation.coordinates.lat,
        longitude: currentLocation.coordinates.lng,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };
      setMapRegion(region);
    }
  }, []);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Reverse geocode
      const address = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (address && address.length > 0) {
        const result = address[0];
        const city = result.city || result.subregion || result.region || 'Unknown City';
        const isoCountryCode = result.isoCountryCode || 'NG';
        
        const newLocation = {
            latitude,
            longitude,
            city,
            country: result.country || 'Unknown Country',
            isoCountryCode,
        };

        setSelectedLocation(newLocation);
        
        // Find matching region config if possible
        if (REGIONS[isoCountryCode]) {
            setSelectedRegion(isoCountryCode);
        }

        // Animate map
        mapRef.current?.animateToRegion({
            latitude,
            longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not fetch current location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleMapPress = async (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setIsLoadingLocation(true);
    
    try {
        const address = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (address && address.length > 0) {
            const result = address[0];
            const city = result.city || result.subregion || result.region || 'Unknown City';
            const isoCountryCode = result.isoCountryCode || 'NG';
            
            setSelectedLocation({
                latitude,
                longitude,
                city,
                country: result.country || 'Unknown Country',
                isoCountryCode,
            });
            
             if (REGIONS[isoCountryCode]) {
                setSelectedRegion(isoCountryCode);
            }
        }
    } catch (error) {
        console.log(error);
    } finally {
        setIsLoadingLocation(false);
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
        // Check if we support this region, otherwise default to NG or keep current if valid
        // Ideally we should add the new region if it's not in our list, but for now fallback logic
        const regionCode = selectedLocation.isoCountryCode || 'NG';
        
        // If region not supported, maybe warn? or just use what we have
        // For this demo, let's just save it. The currency logic defaults to NG if not found.
        
        dispatch(setLocation({
            region: regionCode,
            city: selectedLocation.city || 'Unknown',
            coordinates: {
                lat: selectedLocation.latitude,
                lng: selectedLocation.longitude
            }
        }));
        router.back();
    }
  };

  const regionCodes = getRegionCodes();
  const selectedRegionData = REGIONS[selectedRegion];
  
  // Filter cities based on search
  const filteredCities = selectedRegionData?.cities.filter((city) =>
    city.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Filter regions based on search
  const filteredRegions = regionCodes.filter((code) => {
    const region = REGIONS[code];
    return (
      region.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      region.cities.some((city) => city.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleSelectCity = (city: string) => {
    // We don't have coords for these hardcoded cities easily without geocoding them all
    // For now, just set the text. In real app, we'd geocode this selection too.
    dispatch(setLocation({
      region: selectedRegion,
      city: city,
      // coordinates: undefined // Keep undefined or geocode if needed
    }));
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={mapRegion}
            onPress={handleMapPress}
            showsUserLocation={true}
            showsMyLocationButton={false} // Custom button below
        >
            {selectedLocation && (
                <Marker
                    coordinate={{
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude
                    }}
                    title={selectedLocation.city}
                    description={selectedLocation.country}
                />
            )}
        </MapView>
        
        {/* Back Button Overlay */}
        <TouchableOpacity 
            style={[styles.backButtonOverlay, { top: insets.top + 10 }]} 
            onPress={() => router.back()}
        >
            <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        {/* My Location Button Overlay */}
        <TouchableOpacity 
            style={[styles.myLocationButton, { top: insets.top + 10 }]} 
            onPress={getCurrentLocation}
        >
            {isLoadingLocation ? (
                <ActivityIndicator size="small" color={Colors.light.primary} />
            ) : (
                <Ionicons name="locate" size={24} color={Colors.light.primary} />
            )}
        </TouchableOpacity>
        
        {/* Selected Location Overlay Card */}
        {selectedLocation && (
            <View style={styles.selectedLocationCard}>
                <View>
                    <Text style={styles.selectedLocationLabel}>Selected Location</Text>
                    <Text style={styles.selectedLocationText}>
                        {selectedLocation.city}, {selectedLocation.country}
                    </Text>
                </View>
                <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={handleConfirmLocation}
                >
                    <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
            </View>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
            {/* Search Bar */}
            <View style={[styles.searchInputContainer, { backgroundColor: themeColors.inputBg }]}>
            <Ionicons name="search" size={20} color={themeColors.subText} />
            <TextInput
                style={[styles.searchInput, { color: themeColors.text }]}
                placeholder="Search city manually..."
                placeholderTextColor={themeColors.subText}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={themeColors.subText} />
                </TouchableOpacity>
            )}
            </View>

            {/* Countries/Regions */}
            <Text style={[styles.sectionTitle, { color: themeColors.subText }]}>SELECT COUNTRY</Text>
            <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.regionsScroll}
            contentContainerStyle={styles.regionsContent}
            >
            {filteredRegions.map((code) => {
                const region = REGIONS[code];
                const isSelected = code === selectedRegion;
                return (
                <TouchableOpacity
                    key={code}
                    style={[
                    styles.regionChip,
                    { 
                        backgroundColor: isSelected ? Colors.light.primary : themeColors.cardBg,
                        borderColor: isSelected ? Colors.light.primary : themeColors.border,
                    },
                    ]}
                    onPress={() => {
                        setSelectedRegion(code);
                        setSearchQuery('');
                    }}
                >
                    <Text style={[
                    styles.regionChipText,
                    { color: isSelected ? '#fff' : themeColors.text }
                    ]}>
                    {region.name}
                    </Text>
                </TouchableOpacity>
                );
            })}
            </ScrollView>

            {/* Cities from Config */}
            <Text style={[styles.sectionTitle, { color: themeColors.subText }]}>
            POPULAR CITIES IN {selectedRegionData?.name.toUpperCase()}
            </Text>
            {filteredCities.map((city) => {
                const isCurrent = city === currentLocation.currentCity && selectedRegion === currentLocation.currentRegion;
                return (
                <TouchableOpacity
                    key={city}
                    style={[
                    styles.cityCard,
                    { 
                        backgroundColor: themeColors.cardBg,
                        borderLeftColor: isCurrent ? Colors.light.primary : 'transparent',
                    },
                    ]}
                    onPress={() => handleSelectCity(city)}
                >
                    <Ionicons 
                    name="location-outline" 
                    size={20} 
                    color={isCurrent ? Colors.light.primary : themeColors.subText} 
                    />
                    <Text style={[
                    styles.cityName,
                    { color: themeColors.text }
                    ]}>
                    {city}
                    </Text>
                    {isCurrent && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.light.primary} />
                    )}
                </TouchableOpacity>
                );
            })}
            
            <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: height * 0.45, // 45% of screen height
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  backButtonOverlay: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  myLocationButton: {
    position: 'absolute',
    right: 16,
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  selectedLocationCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedLocationLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  selectedLocationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  regionsScroll: {
    marginBottom: 24,
  },
  regionsContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  regionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
  },
  regionChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderLeftWidth: 4,
    gap: 12,
  },
  cityName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
});
