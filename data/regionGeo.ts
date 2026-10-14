// Where the supported regions sit on the map, so the location picker can fly
// straight to a country or a city instead of showing the whole continent.

export interface MapView {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

/** A framing that fills the map with the whole country. */
export const COUNTRY_VIEW: Record<string, MapView> = {
  NG: { latitude: 9.1, longitude: 8.7, latitudeDelta: 10, longitudeDelta: 10 },
  GH: { latitude: 7.9, longitude: -1.0, latitudeDelta: 7, longitudeDelta: 7 },
  KE: { latitude: 0.2, longitude: 37.9, latitudeDelta: 9, longitudeDelta: 9 },
  ZA: { latitude: -29, longitude: 24.5, latitudeDelta: 14, longitudeDelta: 14 },
  US: { latitude: 39.5, longitude: -98.5, latitudeDelta: 38, longitudeDelta: 38 },
  CA: { latitude: 56, longitude: -96, latitudeDelta: 42, longitudeDelta: 42 },
  GB: { latitude: 54.2, longitude: -2.5, latitudeDelta: 11, longitudeDelta: 11 },
  DE: { latitude: 51.2, longitude: 10.4, latitudeDelta: 9, longitudeDelta: 9 },
  FR: { latitude: 46.6, longitude: 2.4, latitudeDelta: 10, longitudeDelta: 10 },
  AU: { latitude: -25.5, longitude: 134, latitudeDelta: 40, longitudeDelta: 40 },
};

/** Approximate city centres, keyed `CODE:City` as listed in data/regions.ts. */
export const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  'NG:Lagos': { latitude: 6.5244, longitude: 3.3792 },
  'NG:Abuja': { latitude: 9.0765, longitude: 7.3986 },
  'NG:Port Harcourt': { latitude: 4.8156, longitude: 7.0498 },
  'NG:Ibadan': { latitude: 7.3775, longitude: 3.947 },
  'NG:Kano': { latitude: 12.0022, longitude: 8.592 },
  'NG:Enugu': { latitude: 6.4584, longitude: 7.5464 },
  'NG:Benin City': { latitude: 6.335, longitude: 5.6037 },
  'NG:Kaduna': { latitude: 10.5105, longitude: 7.4165 },

  'GH:Accra': { latitude: 5.6037, longitude: -0.187 },
  'GH:Kumasi': { latitude: 6.6885, longitude: -1.6244 },
  'GH:Tamale': { latitude: 9.4075, longitude: -0.8534 },
  'GH:Takoradi': { latitude: 4.8845, longitude: -1.7554 },
  'GH:Cape Coast': { latitude: 5.1053, longitude: -1.2466 },
  'GH:Tema': { latitude: 5.6698, longitude: -0.0166 },
  'GH:Sunyani': { latitude: 7.3349, longitude: -2.3123 },
  'GH:Ho': { latitude: 6.6008, longitude: 0.4713 },

  'KE:Nairobi': { latitude: -1.2921, longitude: 36.8219 },
  'KE:Mombasa': { latitude: -4.0435, longitude: 39.6682 },
  'KE:Kisumu': { latitude: -0.0917, longitude: 34.768 },
  'KE:Nakuru': { latitude: -0.3031, longitude: 36.08 },
  'KE:Eldoret': { latitude: 0.5143, longitude: 35.2698 },
  'KE:Thika': { latitude: -1.0333, longitude: 37.0693 },
  'KE:Malindi': { latitude: -3.2138, longitude: 40.1169 },
  'KE:Kitale': { latitude: 1.0157, longitude: 35.0062 },

  'ZA:Johannesburg': { latitude: -26.2041, longitude: 28.0473 },
  'ZA:Cape Town': { latitude: -33.9249, longitude: 18.4241 },
  'ZA:Durban': { latitude: -29.8587, longitude: 31.0218 },
  'ZA:Pretoria': { latitude: -25.7479, longitude: 28.2293 },
  'ZA:Port Elizabeth': { latitude: -33.9608, longitude: 25.6022 },
  'ZA:Bloemfontein': { latitude: -29.0852, longitude: 26.1596 },
  'ZA:East London': { latitude: -33.0153, longitude: 27.9116 },
  'ZA:Polokwane': { latitude: -23.9045, longitude: 29.4689 },

  'US:New York': { latitude: 40.7128, longitude: -74.006 },
  'GB:London': { latitude: 51.5072, longitude: -0.1276 },
  'DE:Berlin': { latitude: 52.52, longitude: 13.405 },
  'FR:Paris': { latitude: 48.8566, longitude: 2.3522 },
  'CA:Toronto': { latitude: 43.6532, longitude: -79.3832 },
  'AU:Sydney': { latitude: -33.8688, longitude: 151.2093 },
};

/** A short factual line shown under a city's name on the map (state or role). */
export const CITY_NOTES: Record<string, string> = {
  'NG:Lagos': 'commercial capital',
  'NG:Abuja': 'federal capital',
  'NG:Port Harcourt': 'Rivers State',
  'NG:Ibadan': 'Oyo State',
  'NG:Kano': 'Kano State',
  'NG:Enugu': 'Enugu State',
  'NG:Benin City': 'Edo State',
  'NG:Kaduna': 'Kaduna State',
  'GH:Accra': 'capital city',
  'KE:Nairobi': 'capital city',
  'ZA:Johannesburg': 'Gauteng',
  'ZA:Cape Town': 'Western Cape',
  'ZA:Durban': 'KwaZulu-Natal',
  'ZA:Pretoria': 'Gauteng',
};
