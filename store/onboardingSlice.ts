import { OnboardingData } from '@/types/onboarding';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: OnboardingData = {
  purpose: null,
  interests: [],
  locationType: null,
  selectedCity: undefined,
  location: undefined,
  notificationsEnabled: false,
  isComplete: false,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {
    setPurpose: (state, action: PayloadAction<'discover' | 'promote' | 'both'>) => {
      state.purpose = action.payload;
    },
    setInterests: (state, action: PayloadAction<string[]>) => {
      state.interests = action.payload;
    },
    toggleInterest: (state, action: PayloadAction<string>) => {
      const interest = action.payload;
      const index = state.interests.indexOf(interest);
      if (index > -1) {
        state.interests.splice(index, 1);
      } else {
        state.interests.push(interest);
      }
    },
    setLocationType: (state, action: PayloadAction<'near_me' | 'specific_city' | 'anywhere'>) => {
      state.locationType = action.payload;
    },
    setSelectedCity: (state, action: PayloadAction<string | undefined>) => {
      state.selectedCity = action.payload;
    },
    setLocation: (state, action: PayloadAction<{ latitude: number; longitude: number; city?: string }>) => {
      state.location = action.payload;
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },
    setOnboardingComplete: (state, action: PayloadAction<boolean>) => {
      state.isComplete = action.payload;
    },
    resetOnboarding: () => initialState,
  },
});

export const {
  setPurpose,
  setInterests,
  toggleInterest,
  setLocationType,
  setSelectedCity,
  setLocation,
  setNotificationsEnabled,
  setOnboardingComplete,
  resetOnboarding,
} = onboardingSlice.actions;

export default onboardingSlice.reducer;
