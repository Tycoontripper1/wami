export type VehicleType = 'bike' | 'car' | 'van';
export type DriverTier = 'standard' | 'premium';

export interface Driver {
  id: string;
  name: string;
  avatar: string;
  vehicleType: VehicleType;
  tier: DriverTier;
  rating: number;
  price: number;
  etaMinutes: number;
  isCheapest?: boolean;
  isFastest?: boolean;
}

export interface DeliveryCoords {
  latitude: number;
  longitude: number;
  label: string;
}

export interface DeliveryEstimate {
  low: number;
  high: number;
}

export const VEHICLE_ICONS: Record<VehicleType, string> = {
  bike: 'bicycle',
  car: 'car-sport',
  van: 'car',
};
