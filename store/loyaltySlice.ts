import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface LoyaltyState {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalBookings: number;
  rewards: Reward[];
}

interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
  redeemed: boolean;
  redeemedAt?: string;
}

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 5000,
};

const calculateTier = (points: number): LoyaltyState['tier'] => {
  if (points >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (points >= TIER_THRESHOLDS.gold) return 'gold';
  if (points >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
};

const initialState: LoyaltyState = {
  points: 0,
  tier: 'bronze',
  totalBookings: 0,
  rewards: [
    {
      id: '1',
      name: '10% Off Next Booking',
      pointsCost: 200,
      description: 'Get 10% off your next booking with any creative',
      redeemed: false,
    },
    {
      id: '2',
      name: 'Free Priority Booking',
      pointsCost: 500,
      description: 'Skip the queue and get priority booking',
      redeemed: false,
    },
    {
      id: '3',
      name: '₦5,000 Credit',
      pointsCost: 1000,
      description: 'Add ₦5,000 to your Wami wallet',
      redeemed: false,
    },
  ],
};

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    addPoints: (state, action: PayloadAction<number>) => {
      state.points += action.payload;
      state.tier = calculateTier(state.points);
    },
    completeBooking: (state) => {
      // Award 50 points per booking
      state.points += 50;
      state.totalBookings += 1;
      state.tier = calculateTier(state.points);
    },
    redeemReward: (state, action: PayloadAction<string>) => {
      const reward = state.rewards.find((r) => r.id === action.payload);
      if (reward && !reward.redeemed && state.points >= reward.pointsCost) {
        state.points -= reward.pointsCost;
        reward.redeemed = true;
        reward.redeemedAt = new Date().toISOString();
        state.tier = calculateTier(state.points);
      }
    },
    resetLoyalty: () => initialState,
  },
});

export const { addPoints, completeBooking, redeemReward, resetLoyalty } = loyaltySlice.actions;
export const TIER_THRESHOLDS_EXPORT = TIER_THRESHOLDS;
export default loyaltySlice.reducer;
