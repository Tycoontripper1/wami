import { Redirect } from 'expo-router';
import React from 'react';

// The old intro screen is replaced by the 3-slide promo carousel.
// Any remaining deep-links to this route are forwarded automatically.
export default function OnboardingIntroScreen() {
  return <Redirect href={'/(auth)/onboarding-discover' as any} />;
}
