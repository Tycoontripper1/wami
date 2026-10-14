import Colors from '@/constants/Colors';
import { getRegionCodes, REGIONS } from '@/data/regions';
import { CITY_COORDS, CITY_NOTES, COUNTRY_VIEW } from '@/data/regionGeo';
import MapBubble, { BUBBLE_ANCHOR } from '@/components/maps/MapBubble';
import { getNearYou } from '@/services/api/discoveryService';
import { extractList } from '@/utils/extractList';
import { setLocation } from '@/store/locationSlice';
import { RootState } from '@/store/store';
import { Ionicons } from '@/components/FlatIcon';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Text, TextInput } from '@/components/AppText';
import MapView, { Marker, Region } from '@/components/maps/MapKit';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

// Opens on the home country so it fills the map (Nigeria), not the whole continent.
const DEFAULT_REGION = COUNTRY_VIEW.NG;

// A soft, pastel base map: pale land, white roads, light water and green parks,
// no business icons, so the bubbles are the only thing that stands out.
const LIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#F3F1EC' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8A9099' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#D9D6CF' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#DCEBD0' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#EBE8E1' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#FFFFFF' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#CDE5F1' }] },
];
const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1B2428' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8CA0A6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#10181B' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#2C3A40' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ visibility: 'on' }, { color: '#1F3A2E' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2B383E' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0E2A33' }] },
];

type NearbyCreative = { id: string; name: string; role?: string; image?: string; latitude: number; longitude: number };

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
  // Creatives that carry coordinates show up on the map as photo bubbles.
  const [nearby, setNearby] = useState<NearbyCreative[]>([]);
  
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
    text: isDark ? '#fff' : '#0F1419',
    subText: isDark ? '#999' : '#666',
    cardBg: isDark ? '#1a1a1a' : '#f5f5f5',
    border: isDark ? '#333' : '#e0e0e0',
    inputBg: isDark ? '#1a1a1a' : '#f5f5f5',
  };

  // Initial map setup: the saved spot if there is one, otherwise the country.
  useEffect(() => {
    if (currentLocation.coordinates) {
      setMapRegion({
        latitude: currentLocation.coordinates.lat,
        longitude: currentLocation.coordinates.lng,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    } else if (COUNTRY_VIEW[currentLocation.currentRegion]) {
      setMapRegion(COUNTRY_VIEW[currentLocation.currentRegion]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getNearYou()
      .then((res) => {
        if (cancelled) return;
        const list = extractList<any>(res.data)
          .map((o) => ({
            id: String(o.id ?? o.offering_id),
            name: o.name || o.title || '',
            role: o.role || o.category || undefined,
            image: o.image || o.images?.[0] || o.media_url || o.thumbnail_url || undefined,
            latitude: Number(o.location?.lat ?? o.lat),
            longitude: Number(o.location?.lng ?? o.lng),
          }))
          .filter((o) => o.name && Number.isFinite(o.latitude) && Number.isFinite(o.longitude));
        setNearby(list.slice(0, 25));
      })
      .catch(() => {
        // The map works without them; the cities are still there.
      });
    return () => {
      cancelled = true;
    };
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
    const coords = CITY_COORDS[`${selectedRegion}:${city}`];
    if (!coords) {
      // No coordinates for this city: save the name straight away.
      dispatch(setLocation({ region: selectedRegion, city }));
      router.back();
      return;
    }
    // Fly to the city and drop the pin; the card's Confirm button saves it.
    setSelectedLocation({
      ...coords,
      city,
      country: REGIONS[selectedRegion]?.name,
      isoCountryCode: selectedRegion,
    });
    mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.3, longitudeDelta: 0.3 }, 700);
  };

  const handleSelectCountry = (code: string) => {
    setSelectedRegion(code);
    setSearchQuery('');
    const view = COUNTRY_VIEW[code];
    if (view) mapRef.current?.animateToRegion(view, 700);
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
            showsCompass={false}
            toolbarEnabled={false}
            customMapStyle={isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
            userInterfaceStyle={isDark ? 'dark' : 'light'}
            mapType={Platform.OS === 'ios' ? 'mutedStandard' : 'standard'}
        >
            {/* The popular cities of the chosen country, as tappable bubbles */}
            {(selectedRegionData?.cities ?? []).map((city) => {
                const coords = CITY_COORDS[`${selectedRegion}:${city}`];
                if (!coords) return null;
                const isSelected = selectedLocation?.city === city && selectedLocation?.isoCountryCode === selectedRegion;
                return (
                    <Marker
                        key={`city-${city}`}
                        coordinate={coords}
                        anchor={BUBBLE_ANCHOR}
                        onPress={() => handleSelectCity(city)}
                        zIndex={isSelected ? 3 : 1}
                    >
                        <MapBubble
                            title={city}
                            subtitle={CITY_NOTES[`${selectedRegion}:${city}`]}
                            selected={isSelected}
                        />
                    </Marker>
                );
            })}

            {/* Creatives with a known position */}
            {nearby.map((c) => (
                <Marker
                    key={`creative-${c.id}`}
                    coordinate={{ latitude: c.latitude, longitude: c.longitude }}
                    anchor={BUBBLE_ANCHOR}
                    zIndex={2}
                >
                    <MapBubble title={c.name} subtitle={c.role} image={c.image} />
                </Marker>
            ))}

            {/* A spot picked by tapping the map or by GPS (not one of the cities) */}
            {selectedLocation &&
                !(selectedRegionData?.cities ?? []).some((c) => c === selectedLocation.city) && (
                <Marker
                    coordinate={{
                        latitude: selectedLocation.latitude,
                        longitude: selectedLocation.longitude
                    }}
                    anchor={{ x: 0.5, y: 1 }}
                >
                    <View style={styles.pin}>
                        <Ionicons name="location" size={46} color={Colors.light.primary} accent="#FFA000" />
                    </View>
                </Marker>
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
                <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.selectedLocationLabel}>Selected location</Text>
                    <Text style={styles.selectedLocationText} numberOfLines={1}>
                        {selectedLocation.city}
                    </Text>
                    <Text style={styles.selectedLocationCountry} numberOfLines={1}>
                        {selectedLocation.country}
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
                    onPress={() => handleSelectCountry(code)}
                >
                    <Text style={[
                    styles.regionChipText,
                    { color: isSelected ? '#0F1419' : themeColors.text }
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
    height: height * 0.5,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFill,
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
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pin: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  selectedLocationCountry: {
    fontSize: 13,
    color: '#666',
    marginTop: 1,
  },
  selectedLocationLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  selectedLocationText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F1419',
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
  },
  confirmButtonText: {
    color: '#0F1419',
    fontSize: 15,
    fontWeight: '700',
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
    paddingVertical: 11,
    borderRadius: 10,
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  regionChipText: {
    fontSize: 16,
    fontWeight: '700',
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
