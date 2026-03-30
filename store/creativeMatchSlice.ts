import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StylePreferences {
  aesthetics: string[]; // minimal, bold, vintage, modern, artistic, natural
  serviceTypes: string[]; // photography, hair, makeup, fashion, etc.
  priceRange: 'budget' | 'mid' | 'premium' | 'luxury';
  personality: string[]; // creative, professional, friendly, edgy
  sessionStyle: string[]; // studio, outdoor, candid, posed
}

interface CreativeMatchState {
  quizCompleted: boolean;
  preferences: StylePreferences;
  matchScores: Record<string, number>; // creativeId -> match score
  recommendations: string[]; // recommended creative IDs
}

const initialState: CreativeMatchState = {
  quizCompleted: false,
  preferences: {
    aesthetics: [],
    serviceTypes: [],
    priceRange: 'mid',
    personality: [],
    sessionStyle: [],
  },
  matchScores: {},
  recommendations: [],
};

// Simple matching algorithm weights
const WEIGHTS = {
  aesthetics: 0.3,
  serviceTypes: 0.25,
  priceRange: 0.15,
  personality: 0.15,
  sessionStyle: 0.15,
};

// Mock creatives with style data for matching
export const CREATIVES_DB = [
  {
    id: '1',
    name: 'Sandra Hair Studio',
    aesthetics: ['modern', 'bold'],
    serviceTypes: ['hair', 'styling'],
    priceRange: 'mid',
    personality: ['creative', 'friendly'],
    sessionStyle: ['studio'],
  },
  {
    id: '2',
    name: 'Paul Studio',
    aesthetics: ['artistic', 'natural'],
    serviceTypes: ['photography'],
    priceRange: 'premium',
    personality: ['professional', 'creative'],
    sessionStyle: ['outdoor', 'candid'],
  },
  {
    id: '3',
    name: 'Maya Beauty',
    aesthetics: ['minimal', 'modern'],
    serviceTypes: ['makeup', 'beauty'],
    priceRange: 'mid',
    personality: ['friendly', 'professional'],
    sessionStyle: ['studio'],
  },
  {
    id: '4',
    name: 'Urban Lens',
    aesthetics: ['bold', 'edgy'],
    serviceTypes: ['photography', 'fashion'],
    priceRange: 'luxury',
    personality: ['edgy', 'creative'],
    sessionStyle: ['outdoor', 'posed'],
  },
  {
    id: '5',
    name: 'Natural Glow',
    aesthetics: ['natural', 'minimal'],
    serviceTypes: ['makeup', 'skincare'],
    priceRange: 'budget',
    personality: ['friendly', 'calm'],
    sessionStyle: ['candid'],
  },
];

// Calculate match score between user preferences and creative
const calculateMatchScore = (
  userPrefs: StylePreferences,
  creative: typeof CREATIVES_DB[0]
): number => {
  let score = 0;

  // Aesthetics match
  const aestheticsMatch = userPrefs.aesthetics.filter((a) =>
    creative.aesthetics.includes(a)
  ).length;
  score += (aestheticsMatch / Math.max(userPrefs.aesthetics.length, 1)) * WEIGHTS.aesthetics;

  // Service types match
  const serviceMatch = userPrefs.serviceTypes.filter((s) =>
    creative.serviceTypes.includes(s)
  ).length;
  score += (serviceMatch / Math.max(userPrefs.serviceTypes.length, 1)) * WEIGHTS.serviceTypes;

  // Price range match
  const priceMatch = userPrefs.priceRange === creative.priceRange ? 1 : 0.5;
  score += priceMatch * WEIGHTS.priceRange;

  // Personality match
  const personalityMatch = userPrefs.personality.filter((p) =>
    creative.personality.includes(p)
  ).length;
  score += (personalityMatch / Math.max(userPrefs.personality.length, 1)) * WEIGHTS.personality;

  // Session style match
  const sessionMatch = userPrefs.sessionStyle.filter((s) =>
    creative.sessionStyle.includes(s)
  ).length;
  score += (sessionMatch / Math.max(userPrefs.sessionStyle.length, 1)) * WEIGHTS.sessionStyle;

  return Math.round(score * 100);
};

const creativeMatchSlice = createSlice({
  name: 'creativeMatch',
  initialState,
  reducers: {
    setPreferences: (state, action: PayloadAction<Partial<StylePreferences>>) => {
      state.preferences = { ...state.preferences, ...action.payload };
    },
    completeQuiz: (state) => {
      state.quizCompleted = true;
      
      // Calculate match scores for all creatives
      const scores: Record<string, number> = {};
      CREATIVES_DB.forEach((creative) => {
        scores[creative.id] = calculateMatchScore(state.preferences, creative);
      });
      state.matchScores = scores;

      // Get top recommendations (sorted by score)
      state.recommendations = Object.entries(scores)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([id]) => id);
    },
    updateRecommendationsFromSaves: (state, action: PayloadAction<string[]>) => {
      // Analyze saved creatives and update preferences
      const savedCreativeIds = action.payload;
      const savedCreatives = CREATIVES_DB.filter((c) => savedCreativeIds.includes(c.id));
      
      if (savedCreatives.length > 0) {
        // Extract common preferences from saved creatives
        const allAesthetics = savedCreatives.flatMap((c) => c.aesthetics);
        const allServices = savedCreatives.flatMap((c) => c.serviceTypes);
        
        // Count occurrences and get top preferences
        const aestheticCounts: Record<string, number> = {};
        allAesthetics.forEach((a) => {
          aestheticCounts[a] = (aestheticCounts[a] || 0) + 1;
        });
        
        const serviceCounts: Record<string, number> = {};
        allServices.forEach((s) => {
          serviceCounts[s] = (serviceCounts[s] || 0) + 1;
        });

        // Update preferences based on saves
        state.preferences.aesthetics = Object.entries(aestheticCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([key]) => key);

        state.preferences.serviceTypes = Object.entries(serviceCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 2)
          .map(([key]) => key);

        // Recalculate match scores
        const scores: Record<string, number> = {};
        CREATIVES_DB.forEach((creative) => {
          scores[creative.id] = calculateMatchScore(state.preferences, creative);
        });
        state.matchScores = scores;

        // Update recommendations (exclude already saved)
        state.recommendations = Object.entries(scores)
          .filter(([id]) => !savedCreativeIds.includes(id))
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([id]) => id);
      }
    },
    resetQuiz: () => initialState,
  },
});

export const {
  setPreferences,
  completeQuiz,
  updateRecommendationsFromSaves,
  resetQuiz,
} = creativeMatchSlice.actions;
export default creativeMatchSlice.reducer;
