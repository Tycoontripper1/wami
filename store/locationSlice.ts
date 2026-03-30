import { getDefaultRegion, RegionConfig, REGIONS } from '@/data/regions';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LocationState {
  currentRegion: string; // Region code (e.g., 'NG', 'US', 'GB')
  currentCity: string;
  isLocationDetected: boolean;
  isLoading: boolean;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

const defaultRegion = getDefaultRegion();

const initialState: LocationState = {
  currentRegion: defaultRegion.code,
  currentCity: defaultRegion.defaultCity,
  isLocationDetected: false,
  isLoading: false,
  coordinates: undefined,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setLocation: (
      state,
      action: PayloadAction<{ region: string; city: string; coordinates?: { lat: number; lng: number } }>
    ) => {
      state.currentRegion = action.payload.region;
      state.currentCity = action.payload.city;
      state.coordinates = action.payload.coordinates;
      state.isLocationDetected = true;
      state.isLoading = false;
    },
    setRegion: (state, action: PayloadAction<string>) => {
      const region = REGIONS[action.payload];
      if (region) {
        state.currentRegion = action.payload;
        state.currentCity = region.defaultCity;
      }
    },
    setCity: (state, action: PayloadAction<string>) => {
      state.currentCity = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    resetLocation: (state) => {
      state.currentRegion = defaultRegion.code;
      state.currentCity = defaultRegion.defaultCity;
      state.isLocationDetected = false;
      state.coordinates = undefined;
    },
  },
});

export const { setLocation, setRegion, setCity, setLoading, resetLocation } = locationSlice.actions;

// Selectors
export const selectCurrentRegion = (state: { location: LocationState }): RegionConfig => {
  return REGIONS[state.location.currentRegion] || defaultRegion;
};

export const selectCurrentCity = (state: { location: LocationState }): string => {
  return state.location.currentCity;
};

export const selectIsLocationDetected = (state: { location: LocationState }): boolean => {
  return state.location.isLocationDetected;
};

export default locationSlice.reducer;
