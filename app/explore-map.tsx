import { Text, TextInput } from '@/components/AppText';
import { Ionicons } from '@/components/FlatIcon';
import { Basemap, BasemapCredit, basemapMapType } from '@/components/maps/Basemap';
import MapBubble, { BUBBLE_ANCHOR } from '@/components/maps/MapBubble';
import MapView, { Marker, Region } from '@/components/maps/MapKit';
import { DARK_MAP_STYLE, LIGHT_MAP_STYLE } from '@/components/maps/mapStyles';
import Colors from '@/constants/Colors';
import { CITY_COORDS, CITY_NOTES, COUNTRY_TONE, COUNTRY_VIEW } from '@/data/regionGeo';
import { useLocation } from '@/hooks/useLocationData';
import { DiscoveryOffering, getDiscoveryFeed, getNearYou } from '@/services/api/discoveryService';
import { extractList } from '@/utils/extractList';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INK = '#0F1419';

type Place = {
  id: string;
  name: string;
  role: string;
  category: string;
  image?: string;
  city?: string;
  distance?: string;
  latitude: number;
  longitude: number;
  /** Placed at its city's centre because the item has no coordinates of its own. */
  approximate: boolean;
  creatorId?: string;
  creatorName?: string;
  creatorUsername?: string;
  tags: string[];
};

// A stable pseudo-random spread so items sharing a city don't sit on one point.
function spread(id: string, radius = 0.035) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  const angle = ((h >>> 0) % 360) * (Math.PI / 180);
  const dist = radius * (0.35 + (((h >>> 9) & 0xff) / 255) * 0.65);
  return { dLat: Math.sin(angle) * dist, dLng: Math.cos(angle) * dist };
}

// City centre by name, from any supported country.
const CITY_BY_NAME: Record<string, { latitude: number; longitude: number }> = {};
Object.entries(CITY_COORDS).forEach(([key, coords]) => {
  CITY_BY_NAME[key.split(':')[1].toLowerCase()] = coords;
});

function toPlace(o: DiscoveryOffering): Place | null {
  const id = String(o.id ?? o.offering_id ?? '');
  const name = String(o.name || o.title || '').trim();
  if (!id || !name) return null;

  const lat = Number(o.location?.lat ?? o.lat);
  const lng = Number(o.location?.lng ?? o.lng);
  const city = o.location?.city ? String(o.location.city) : undefined;

  let latitude: number;
  let longitude: number;
  let approximate = false;
  if (Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)) {
    latitude = lat;
    longitude = lng;
  } else {
    const centre = city ? CITY_BY_NAME[city.toLowerCase()] : undefined;
    if (!centre) return null;
    const { dLat, dLng } = spread(id);
    latitude = centre.latitude + dLat;
    longitude = centre.longitude + dLng;
    approximate = true;
  }

  const category = String(o.category || o.role || '').trim();
  return {
    id,
    name,
    role: String(o.role || o.category || '').trim(),
    category,
    image: o.media_url || o.thumbnail_url || o.image || o.images?.[0] || undefined,
    city,
    distance: typeof o.distance_km === 'number' ? `${o.distance_km.toFixed(1)} km away` : undefined,
    latitude,
    longitude,
    approximate,
    creatorId: o.creator?.id !== undefined ? String(o.creator.id) : undefined,
    creatorName: o.creator?.name,
    creatorUsername: o.creator?.username,
    tags: Array.isArray(o.tags) ? o.tags.map(String) : [],
  };
}

export default function ExploreMapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const mapRef = useRef<any>(null);
  const { city, regionCode, coordinates } = useLocation();

  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const tone = COUNTRY_TONE[regionCode];

  const startRegion: Region = useMemo(() => {
    if (coordinates) {
      return { latitude: coordinates.lat, longitude: coordinates.lng, latitudeDelta: 0.4, longitudeDelta: 0.4 };
    }
    const own = CITY_COORDS[`${regionCode}:${city}`];
    if (own) return { ...own, latitudeDelta: 0.4, longitudeDelta: 0.4 };
    return COUNTRY_VIEW[regionCode] ?? COUNTRY_VIEW.NG;
  }, [coordinates, regionCode, city]);

  const load = async () => {
    setLoading(true);
    setFailed(false);
    try {
      const [near, feed] = await Promise.allSettled([getNearYou(), getDiscoveryFeed()]);
      if (near.status === 'rejected' && feed.status === 'rejected') {
        setFailed(true);
        return;
      }
      const raw: DiscoveryOffering[] = [
        ...(near.status === 'fulfilled' ? extractList<DiscoveryOffering>(near.value.data) : []),
        ...(feed.status === 'fulfilled' ? extractList<DiscoveryOffering>(feed.value.data) : []),
      ];
      const seen = new Set<string>();
      const next: Place[] = [];
      raw.forEach((o) => {
        const p = toPlace(o);
        if (p && !seen.has(p.id)) {
          seen.add(p.id);
          next.push(p);
        }
      });
      setPlaces(next);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    places.forEach((p) => {
      if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name]) => name);
  }, [places]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter((p) => {
      if (category && p.category !== category) return false;
      if (!q) return true;
      return [p.name, p.role, p.category, p.city ?? '', ...p.tags].some((s) => s.toLowerCase().includes(q));
    });
  }, [places, category, query]);

  const selected = visible.find((p) => p.id === selectedId) ?? null;

  // Keep the search pill above the keyboard (Android resizes the window itself).
  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardWillHide', () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // The country's cities are always on the map as bubbles; tapping one flies there.
  const cityBubbles = useMemo(
    () =>
      Object.entries(CITY_COORDS)
        .filter(([key]) => key.startsWith(`${regionCode}:`))
        .map(([key, coords]) => ({ name: key.split(':')[1], key, ...coords })),
    [regionCode]
  );

  const cityCount = (name: string) => places.filter((p) => p.city?.toLowerCase() === name.toLowerCase()).length;

  const selectCity = (name: string, coords: { latitude: number; longitude: number }) => {
    setSelectedId(null);
    setSelectedCity(name);
    mapRef.current?.animateToRegion?.({ ...coords, latitudeDelta: 0.3, longitudeDelta: 0.3 }, 600);
  };

  const select = (p: Place) => {
    setSelectedCity(null);
    setSelectedId(p.id);
    mapRef.current?.animateToRegion?.(
      { latitude: p.latitude, longitude: p.longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 },
      600
    );
  };

  const openProfile = (p: Place) => {
    router.push({
      pathname: '/profile/[id]',
      params: {
        id: p.id,
        creatorId: p.creatorId ?? '',
        creatorName: p.creatorName ?? '',
        creatorUsername: p.creatorUsername ?? '',
      },
    } as any);
  };

  // Frame everything that is showing whenever the filter changes.
  useEffect(() => {
    if (visible.length < 1 || Platform.OS === 'web') return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates?.(
        visible.map((p) => ({ latitude: p.latitude, longitude: p.longitude })),
        { edgePadding: { top: 120, right: 70, bottom: 300, left: 70 }, animated: true }
      );
    }, 250);
    return () => clearTimeout(timer);
  }, [visible.length, category, places.length]);

  const sheetBg = isDark ? '#1A1F23' : '#FFFFFF';
  const sheetText = isDark ? '#FFFFFF' : INK;
  const sheetSub = isDark ? '#9AA5AD' : '#5E6670';

  return (
    <View style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={startRegion}
        onPress={() => {
          setSelectedId(null);
          setSelectedCity(null);
          Keyboard.dismiss();
        }}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        customMapStyle={isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
        mapType={basemapMapType}
      >
        <Basemap dark={isDark} />
        {cityBubbles.map((c) => (
          <Marker
            key={c.key}
            coordinate={{ latitude: c.latitude, longitude: c.longitude }}
            anchor={BUBBLE_ANCHOR}
            zIndex={c.name === selectedCity ? 4 : 0}
            onPress={() => selectCity(c.name, c)}
          >
            <MapBubble
              title={c.name}
              subtitle={CITY_NOTES[c.key]}
              selected={c.name === selectedCity}
              tone={tone}
            />
          </Marker>
        ))}

        {visible.map((p) => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.latitude, longitude: p.longitude }}
            anchor={BUBBLE_ANCHOR}
            zIndex={p.id === selectedId ? 5 : 1}
            onPress={() => select(p)}
          >
            <MapBubble title={p.name} subtitle={p.role} image={p.image} selected={p.id === selectedId} tone={tone} />
          </Marker>
        ))}
      </MapView>

      <BasemapCredit dark={isDark} style={{ left: 16, top: insets.top + 60 }} />

      {/* Top controls */}
      <View style={[styles.topRow, { top: insets.top + 10 }]} pointerEvents="box-none">
        <TouchableOpacity style={styles.roundButton} onPress={() => router.back()} accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={24} color={INK} />
        </TouchableOpacity>
        <View style={styles.cityPill}>
          <Ionicons
            name="location"
            size={16}
            color={tone?.main ?? Colors.light.primary}
            accent={tone?.accent ?? '#FFA000'}
          />
          <Text style={styles.cityPillText} numberOfLines={1}>
            {city}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.roundButton}
          onPress={() => router.push('/location-picker' as any)}
          accessibilityLabel="Change location"
        >
          <Ionicons name="locate" size={22} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Status over the map */}
      {loading ? (
        <View style={[styles.notice, { top: insets.top + 66 }]}>
          <ActivityIndicator size="small" color={Colors.light.primary} />
          <Text style={styles.noticeText}>Finding creatives…</Text>
        </View>
      ) : failed ? (
        <TouchableOpacity style={[styles.notice, { top: insets.top + 66 }]} onPress={load}>
          <Ionicons name="refresh" size={16} color={Colors.light.primary} />
          <Text style={styles.noticeText}>Couldn't load creatives. Tap to retry</Text>
        </TouchableOpacity>
      ) : visible.length === 0 ? (
        <View style={[styles.notice, { top: insets.top + 66 }]}>
          <Text style={styles.noticeText}>
            {places.length === 0 ? 'No creatives here yet — pick a city' : 'Nothing matches that search'}
          </Text>
        </View>
      ) : null}

      {/* Bottom: categories, the selected creative, and search */}
      <View
        style={[
          styles.bottom,
          { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 10 : insets.bottom + 14 },
        ]}
        pointerEvents="box-none"
      >
        {selectedCity && !selected ? (
          <View style={[styles.card, { backgroundColor: sheetBg }]}>
            <View style={[styles.cardImage, styles.cardImageEmpty, { backgroundColor: (tone?.main ?? Colors.light.primary) + '22' }]}>
              <Ionicons
                name="location"
                size={28}
                color={tone?.main ?? Colors.light.primary}
                accent={tone?.accent ?? '#FFA000'}
              />
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: sheetText }]} numberOfLines={1}>
                {selectedCity}
              </Text>
              <Text style={[styles.cardSub, { color: sheetSub }]} numberOfLines={1}>
                {cityCount(selectedCity) > 0
                  ? `${cityCount(selectedCity)} creative${cityCount(selectedCity) === 1 ? '' : 's'} here`
                  : 'No creatives listed here yet'}
              </Text>
            </View>
            {cityCount(selectedCity) > 0 ? (
              <TouchableOpacity
                style={[styles.viewButton, { backgroundColor: tone?.main ?? Colors.light.primary }]}
                onPress={() => {
                  setQuery(selectedCity);
                  setSelectedCity(null);
                }}
              >
                <Text style={[styles.viewButtonText, { color: '#FFFFFF' }]}>Show</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {selected ? (
          <View style={[styles.card, { backgroundColor: sheetBg }]}>
            {selected.image ? (
              <Image source={{ uri: selected.image }} style={styles.cardImage} />
            ) : (
              <View style={[styles.cardImage, styles.cardImageEmpty]}>
                <Ionicons name="person" size={26} color={tone?.main ?? Colors.light.primary} accent={tone?.accent ?? '#FFA000'} />
              </View>
            )}
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: sheetText }]} numberOfLines={1}>
                {selected.name}
              </Text>
              {selected.role ? (
                <Text style={[styles.cardSub, { color: sheetSub }]} numberOfLines={1}>
                  {selected.role}
                </Text>
              ) : null}
              <Text style={[styles.cardMeta, { color: sheetSub }]} numberOfLines={1}>
                {[selected.city, selected.distance].filter(Boolean).join(' · ') || ' '}
                {selected.approximate ? '  ·  area' : ''}
              </Text>
            </View>
            <TouchableOpacity style={styles.viewButton} onPress={() => openProfile(selected)}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {categories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}
            keyboardShouldPersistTaps="handled"
          >
            {[null, ...categories].map((c) => {
              const active = c === category;
              return (
                <TouchableOpacity
                  key={c ?? 'all'}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c ?? 'All'}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.searchPill}>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Find a creative or service"
            placeholderTextColor="rgba(255,255,255,0.6)"
            returnKeyType="search"
          />
          <View style={styles.searchButton}>
            <Ionicons name="search" size={20} color="#FFFFFF" />
          </View>
        </View>
      </View>
    </View>
  );
}

const SHADOW = {
  shadowColor: '#0F1419',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.18,
  shadowRadius: 8,
  elevation: 5,
} as const;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F1EC' },
  topRow: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  roundButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },
  cityPill: {
    flex: 1,
    maxWidth: 220,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    ...SHADOW,
  },
  cityPillText: { fontSize: 15, fontWeight: '700', color: INK, flexShrink: 1 },
  notice: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...SHADOW,
  },
  noticeText: { fontSize: 14, fontWeight: '600', color: INK },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    padding: 12,
    gap: 12,
    ...SHADOW,
  },
  cardImage: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#E6F7FA' },
  cardImageEmpty: { alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardSub: { fontSize: 13, marginTop: 1 },
  cardMeta: { fontSize: 12, marginTop: 3 },
  viewButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  viewButtonText: { fontSize: 15, fontWeight: '700', color: INK },
  chipScroll: { flexGrow: 0, marginHorizontal: -16 },
  chipRow: { paddingHorizontal: 16, gap: 8 },
  chip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW,
  },
  chipActive: { backgroundColor: INK },
  chipText: { fontSize: 14, fontWeight: '600', color: INK },
  chipTextActive: { color: '#FFFFFF' },
  searchPill: {
    height: 56,
    borderRadius: 28,
    backgroundColor: INK,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 22,
    paddingRight: 8,
    ...SHADOW,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#FFFFFF', height: '100%' },
  searchButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
