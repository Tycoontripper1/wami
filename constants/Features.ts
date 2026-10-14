// Feature switches for flows whose backend doesn't exist yet. Both are off
// because the app-side implementations are simulations (invented data), and
// shipping those to real users would present fabricated information as real.
// Flip to true only once a real endpoint backs the flow.

// Instagram connect + import (creative onboarding). The app side is wired to
// the backend's real OAuth flow (services/api/instagramApiService.ts).
//
// Left OFF because the flow cannot finish yet: GET /instagram/connect hands
// Instagram the redirect_uri https://joinwami.com/instagram/callback, but that
// host currently serves an unrelated service (404). The working callback page
// is https://api.joinwami.com/instagram/callback. Flip to true once the
// backend's redirect_uri points at a page that really handles the callback
// (and is registered in the Meta app), and one Instagram account has been
// connected and imported end to end.
export const INSTAGRAM_IMPORT_ENABLED = false;

// Arranging a delivery for an order (app/delivery/*). The backend has no
// delivery endpoint; services/deliveryService.ts invents the drivers, their
// bids, avatars and the hand-over code.
export const DELIVERY_ENABLED = false;
