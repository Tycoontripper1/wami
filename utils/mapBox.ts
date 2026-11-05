/** The box a map screen asks /map/places about: the country's view, padded a little. Format: minLng,minLat,maxLng,maxLat. */
export function bboxFor(region: { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }): string {
  const padLat = region.latitudeDelta * 0.6;
  const padLng = region.longitudeDelta * 0.6;
  return [region.longitude - padLng, region.latitude - padLat, region.longitude + padLng, region.latitude + padLat]
    .map((n) => n.toFixed(4))
    .join(',');
}
