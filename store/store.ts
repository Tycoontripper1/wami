import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import bookingsReducer from './bookingsSlice';
import creativeMatchReducer from './creativeMatchSlice';
import creativeOnboardingReducer from './creativeOnboardingSlice';
import favoritesReducer from './favoritesSlice';
import locationReducer from './locationSlice';
import loyaltyReducer from './loyaltySlice';
import onboardingReducer from './onboardingSlice';
import paymentReducer from './paymentSlice';
import walletReducer from './walletSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    onboarding: onboardingReducer,
    payment: paymentReducer,
    wallet: walletReducer,
    creativeOnboarding: creativeOnboardingReducer,
    favorites: favoritesReducer,
    bookings: bookingsReducer,
    loyalty: loyaltyReducer,
    creativeMatch: creativeMatchReducer,
    location: locationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;


