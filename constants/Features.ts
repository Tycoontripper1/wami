// Feature switches for flows whose backend doesn't exist yet. Both are off
// because the app-side implementations are simulations (invented data), and
// shipping those to real users would present fabricated information as real.
// Flip to true only once a real endpoint backs the flow.

// Instagram import (creative onboarding). The backend has no Instagram
// endpoint; services/instagramService.ts fabricates a profile (random
// follower counts, stock photos) for any username.
export const INSTAGRAM_IMPORT_ENABLED = false;

// Arranging a delivery for an order (app/delivery/*). The backend has no
// delivery endpoint; services/deliveryService.ts invents the drivers, their
// bids, avatars and the hand-over code.
export const DELIVERY_ENABLED = false;
