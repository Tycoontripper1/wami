import { Ionicons } from '@expo/vector-icons';
import React, { forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';

type Coordinate = { latitude: number; longitude: number };
type Region = Coordinate & { latitudeDelta: number; longitudeDelta: number };

interface MapViewProps extends ViewProps {
  initialRegion?: Region;
  region?: Region;
  onPress?: (e: { nativeEvent: { coordinate: Coordinate } }) => void;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  pointerEvents?: ViewProps['pointerEvents'];
  children?: React.ReactNode;
}

export interface MapViewHandle {
  animateToRegion: (region: Region, duration?: number) => void;
}

const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  { style, children },
  ref
) {
  useImperativeHandle(ref, () => ({
    animateToRegion: () => {},
  }));

  return (
    <View style={[styles.container, style]}>
      <Ionicons name="map-outline" size={32} color="#999" />
      <Text style={styles.text}>Map preview isn't available on web</Text>
      {children}
    </View>
  );
});

export function Marker(_props: {
  coordinate: Coordinate;
  pinColor?: string;
  title?: string;
  description?: string;
  anchor?: { x: number; y: number };
  children?: React.ReactNode;
}) {
  return null;
}

export function Polyline(_props: {
  coordinates: Coordinate[];
  strokeColor?: string;
  strokeWidth?: number;
}) {
  return null;
}

export type { Region };
export default MapView;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    gap: 8,
  },
  text: {
    color: '#999',
    fontSize: 13,
  },
});
