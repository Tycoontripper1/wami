// A soft, pastel base map: pale land, white roads, light water and green parks,
// no business icons, so the bubbles are the only thing that stands out.
export const LIGHT_MAP_STYLE = [
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

export const DARK_MAP_STYLE = [
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
