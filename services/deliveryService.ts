import { DeliveryCoords, DeliveryEstimate, Driver } from '@/types/delivery';
import { ProductOrder } from '@/types/payment';

// Mock delivery/driver-matching data for demo purposes.
// A real implementation would call a logistics/dispatch API.

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fixed Lagos-area reference point; seller/buyer coords are derived deterministically
// from the order id so the same order always renders the same mock pins.
const BASE_LAT = 6.5244;
const BASE_LNG = 3.3792;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const deliveryService = {
  getCoordinates(order: ProductOrder): { seller: DeliveryCoords; buyer: DeliveryCoords } {
    const seed = hashString(order.id);
    const sellerOffsetLat = ((seed % 100) / 1000) * (seed % 2 === 0 ? 1 : -1);
    const sellerOffsetLng = (((seed >> 3) % 100) / 1000) * (seed % 3 === 0 ? 1 : -1);

    return {
      seller: {
        latitude: BASE_LAT + sellerOffsetLat,
        longitude: BASE_LNG + sellerOffsetLng,
        label: order.sellerName,
      },
      buyer: {
        latitude: BASE_LAT - sellerOffsetLat * 0.6,
        longitude: BASE_LNG - sellerOffsetLng * 0.6,
        label: order.shippingAddress.address || order.shippingAddress.city,
      },
    };
  },

  async estimatePriceRange(order: ProductOrder): Promise<DeliveryEstimate> {
    await delay(600);
    const base = 1200 + (hashString(order.id) % 800);
    return { low: base, high: base + 1500 };
  },

  async findDrivers(order: ProductOrder): Promise<Driver[]> {
    await delay(1500);

    const seed = hashString(order.id);
    const drivers: Driver[] = [
      {
        id: 'drv-1',
        name: 'Tunde Bakare',
        avatar: `https://i.pravatar.cc/150?u=drv1-${order.id}`,
        vehicleType: 'bike',
        tier: 'standard',
        rating: 4.6,
        price: 1500 + (seed % 300),
        etaMinutes: 8 + (seed % 5),
      },
      {
        id: 'drv-2',
        name: 'Chidinma Okafor',
        avatar: `https://i.pravatar.cc/150?u=drv2-${order.id}`,
        vehicleType: 'car',
        tier: 'premium',
        rating: 4.9,
        price: 2400 + (seed % 400),
        etaMinutes: 12 + (seed % 6),
      },
      {
        id: 'drv-3',
        name: 'Emeka Nwosu',
        avatar: `https://i.pravatar.cc/150?u=drv3-${order.id}`,
        vehicleType: 'bike',
        tier: 'standard',
        rating: 4.3,
        price: 1350 + (seed % 250),
        etaMinutes: 6 + (seed % 4),
      },
      {
        id: 'drv-4',
        name: 'Fatima Bello',
        avatar: `https://i.pravatar.cc/150?u=drv4-${order.id}`,
        vehicleType: 'van',
        tier: 'premium',
        rating: 4.8,
        price: 3100 + (seed % 500),
        etaMinutes: 18 + (seed % 8),
      },
    ];

    const cheapest = drivers.reduce((a, b) => (a.price < b.price ? a : b));
    const fastest = drivers.reduce((a, b) => (a.etaMinutes < b.etaMinutes ? a : b));
    cheapest.isCheapest = true;
    fastest.isFastest = true;

    return drivers;
  },
};
