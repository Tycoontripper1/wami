// Supported regions and their configurations
export interface RegionConfig {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  defaultCity: string;
  cities: string[];
  // Exchange rate relative to USD (1 USD = X local currency)
  exchangeRate: number;
}

export const REGIONS: Record<string, RegionConfig> = {
  NG: {
    code: 'NG',
    name: 'Nigeria',
    currency: 'NGN',
    currencySymbol: '₦',
    locale: 'en-NG',
    defaultCity: 'Lagos',
    cities: ['Lagos', 'Abuja', 'Port Harcourt', 'Ibadan', 'Kano', 'Enugu', 'Benin City', 'Kaduna'],
    exchangeRate: 1550, // 1 USD = 1550 NGN
  },
  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    locale: 'en-US',
    defaultCity: 'New York',
    cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'San Francisco', 'Atlanta', 'Seattle'],
    exchangeRate: 1,
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    locale: 'en-GB',
    defaultCity: 'London',
    cities: ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool', 'Bristol', 'Edinburgh', 'Glasgow'],
    exchangeRate: 0.79, // 1 USD = 0.79 GBP
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'de-DE',
    defaultCity: 'Berlin',
    cities: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf', 'Leipzig'],
    exchangeRate: 0.92, // 1 USD = 0.92 EUR
  },
  FR: {
    code: 'FR',
    name: 'France',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'fr-FR',
    defaultCity: 'Paris',
    cities: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Bordeaux', 'Lille', 'Strasbourg'],
    exchangeRate: 0.92,
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    currencySymbol: 'C$',
    locale: 'en-CA',
    defaultCity: 'Toronto',
    cities: ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City'],
    exchangeRate: 1.36, // 1 USD = 1.36 CAD
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    currency: 'AUD',
    currencySymbol: 'A$',
    locale: 'en-AU',
    defaultCity: 'Sydney',
    cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Canberra', 'Newcastle'],
    exchangeRate: 1.54, // 1 USD = 1.54 AUD
  },
  GH: {
    code: 'GH',
    name: 'Ghana',
    currency: 'GHS',
    currencySymbol: 'GH₵',
    locale: 'en-GH',
    defaultCity: 'Accra',
    cities: ['Accra', 'Kumasi', 'Tamale', 'Takoradi', 'Cape Coast', 'Tema', 'Sunyani', 'Ho'],
    exchangeRate: 14.5, // 1 USD = 14.5 GHS
  },
  KE: {
    code: 'KE',
    name: 'Kenya',
    currency: 'KES',
    currencySymbol: 'KSh',
    locale: 'en-KE',
    defaultCity: 'Nairobi',
    cities: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale'],
    exchangeRate: 153, // 1 USD = 153 KES
  },
  ZA: {
    code: 'ZA',
    name: 'South Africa',
    currency: 'ZAR',
    currencySymbol: 'R',
    locale: 'en-ZA',
    defaultCity: 'Johannesburg',
    cities: ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth', 'Bloemfontein', 'East London', 'Polokwane'],
    exchangeRate: 18.5, // 1 USD = 18.5 ZAR
  },
};

// Get all region codes
export const getRegionCodes = (): string[] => Object.keys(REGIONS);

// Get region by code
export const getRegion = (code: string): RegionConfig | undefined => REGIONS[code];

// Get default region (Nigeria)
export const getDefaultRegion = (): RegionConfig => REGIONS.NG;

// Format price for a specific region
export const formatPrice = (
  priceInUSD: number,
  regionCode: string,
  options?: { showCurrency?: boolean; decimals?: number }
): string => {
  const region = REGIONS[regionCode] || REGIONS.NG;
  const localPrice = priceInUSD * region.exchangeRate;
  
  const decimals = options?.decimals ?? (region.exchangeRate >= 10 ? 0 : 2);
  const formatted = localPrice.toLocaleString(region.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  if (options?.showCurrency === false) {
    return formatted;
  }

  return `${region.currencySymbol}${formatted}`;
};

// Convert price from one region to another
export const convertPrice = (
  price: number,
  fromRegion: string,
  toRegion: string
): number => {
  const from = REGIONS[fromRegion] || REGIONS.NG;
  const to = REGIONS[toRegion] || REGIONS.NG;
  
  // Convert to USD first, then to target currency
  const priceInUSD = price / from.exchangeRate;
  return priceInUSD * to.exchangeRate;
};

// Format price range
export const formatPriceRange = (
  minPriceUSD: number,
  maxPriceUSD: number,
  regionCode: string
): string => {
  const min = formatPrice(minPriceUSD, regionCode);
  const max = formatPrice(maxPriceUSD, regionCode, { showCurrency: false });
  return `${min} - ${max}`;
};
