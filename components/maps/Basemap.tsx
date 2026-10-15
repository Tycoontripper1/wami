import { Text } from '@/components/AppText';
import { UrlTile } from '@/components/maps/MapKit';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

/* The soft, pastel base map. `customMapStyle` only works on Google Maps (Android
   and dev builds); Apple Maps ignores it, which left iPhones on the plain app
   map. A raster tile layer looks the same on both, so it replaces the stock
   map content. Pass `Basemap.mapType` to MapView and render <Basemap /> as its
   first child. */

// Esri's light and dark grey canvases need no key (note the {z}/{y}/{x} order).
// CARTO's free tiles now answer "API key required", so they are not used. For
// production use a provider you have a key for (MapTiler, Stadia, Mapbox...) by
// setting EXPO_PUBLIC_MAP_TILE_URL and EXPO_PUBLIC_MAP_TILE_URL_DARK.
const LIGHT =
  process.env.EXPO_PUBLIC_MAP_TILE_URL ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const DARK =
  process.env.EXPO_PUBLIC_MAP_TILE_URL_DARK ||
  'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
const CREDIT = process.env.EXPO_PUBLIC_MAP_TILE_CREDIT || 'Tiles © Esri, HERE, Garmin, OpenStreetMap contributors';

/** `none` on Android removes Google's own tiles; iOS shows the muted style under ours. */
export const basemapMapType = Platform.OS === 'android' ? 'none' : 'mutedStandard';

export function Basemap({ dark }: { dark?: boolean }) {
  return (
    <UrlTile
      urlTemplate={dark ? DARK : LIGHT}
      maximumZ={19}
      maximumNativeZ={16}
      tileSize={256}
      zIndex={-1}
      shouldReplaceMapContent
    />
  );
}

/** The tile provider's required credit; place it over a corner of the map. */
export function BasemapCredit({ style, dark }: { style?: object; dark?: boolean }) {
  return (
    <View style={[styles.credit, style]} pointerEvents="none">
      <Text style={[styles.text, { color: dark ? '#9AA5AD' : '#6B7280' }]}>{CREDIT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  credit: { position: 'absolute' },
  text: { fontSize: 9, opacity: 0.85 },
});
