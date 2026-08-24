import {
    AvailabilityOption,
    BrandDetails,
    CreativeCategory,
    CreativeProfile,
    DiscoverLocationType,
    InstagramProfile,
    OfferingType,
    ProfileVisibility,
} from '@/types/creativeOnboarding';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState: CreativeProfile = {
  categories: [],
  offeringType: null,
  discoverLocation: null,
  brand: {
    name: '',
    location: '',
  },
  instagram: undefined,
  selectedInstagramPostIds: [],
  instagramAutoSync: true,
  website: undefined,
  availability: [],
  visibility: 'public',
  isComplete: false,
};

const creativeOnboardingSlice = createSlice({
  name: 'creativeOnboarding',
  initialState,
  reducers: {
    // Categories
    setCategories: (state, action: PayloadAction<CreativeCategory[]>) => {
      state.categories = action.payload;
    },
    toggleCategory: (state, action: PayloadAction<CreativeCategory>) => {
      const index = state.categories.indexOf(action.payload);
      if (index === -1) {
        state.categories.push(action.payload);
      } else {
        state.categories.splice(index, 1);
      }
    },

    // Offering Type
    setOfferingType: (state, action: PayloadAction<OfferingType>) => {
      state.offeringType = action.payload;
    },

    // Discover Location
    setDiscoverLocation: (state, action: PayloadAction<DiscoverLocationType>) => {
      state.discoverLocation = action.payload;
    },

    // Brand Details
    setBrandDetails: (state, action: PayloadAction<Partial<BrandDetails>>) => {
      state.brand = { ...state.brand, ...action.payload };
    },

    // Instagram
    setInstagramProfile: (state, action: PayloadAction<InstagramProfile>) => {
      state.instagram = action.payload;
    },
    clearInstagram: (state) => {
      state.instagram = undefined;
    },
    setSelectedInstagramPosts: (state, action: PayloadAction<string[]>) => {
      state.selectedInstagramPostIds = action.payload;
    },
    setInstagramAutoSync: (state, action: PayloadAction<boolean>) => {
      state.instagramAutoSync = action.payload;
    },

    // Website
    setWebsite: (state, action: PayloadAction<string>) => {
      state.website = action.payload;
    },

    // Availability
    setAvailability: (state, action: PayloadAction<AvailabilityOption[]>) => {
      state.availability = action.payload;
    },
    toggleAvailability: (state, action: PayloadAction<AvailabilityOption>) => {
      const index = state.availability.indexOf(action.payload);
      if (index === -1) {
        state.availability.push(action.payload);
      } else {
        state.availability.splice(index, 1);
      }
    },

    // Visibility
    setVisibility: (state, action: PayloadAction<ProfileVisibility>) => {
      state.visibility = action.payload;
    },

    // Complete
    setComplete: (state, action: PayloadAction<boolean>) => {
      state.isComplete = action.payload;
    },

    // Reset
    resetCreativeOnboarding: () => initialState,
  },
});

export const {
  setCategories,
  toggleCategory,
  setOfferingType,
  setDiscoverLocation,
  setBrandDetails,
  setInstagramProfile,
  clearInstagram,
  setSelectedInstagramPosts,
  setInstagramAutoSync,
  setWebsite,
  setAvailability,
  toggleAvailability,
  setVisibility,
  setComplete,
  resetCreativeOnboarding,
} = creativeOnboardingSlice.actions;

export default creativeOnboardingSlice.reducer;
