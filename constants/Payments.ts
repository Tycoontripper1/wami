// Paystack public key for react-native-paystack-webview (card checkout).
//
// NOT SET — nobody has supplied the real key yet. Get it from the Paystack
// dashboard (Settings > API Keys & Webhooks > Public Key, "pk_live_..." or
// "pk_test_..." for testing) and put it here, ideally via an env var rather
// than committing it directly. Card payments are disabled with a clear
// message to the user until this is set — see app/checkout/index.tsx.
export const PAYSTACK_PUBLIC_KEY = '';

// POST /payments/initialize requires success_url/cancel_url — undocumented
// in the collection, discovered live 2026-09-29 via the backend's own 422
// validation. This reads as a hosted-checkout-page redirect pattern (the
// backend hands back a URL to a Paystack-hosted page, which redirects here
// afterward), which doesn't map cleanly onto react-native-paystack-webview's
// native/inline checkout — ask backend which flow /initialize actually
// expects the client to drive before trusting these deep links are correct.
// Uses the app's own registered scheme ("wami", see app.json) as the most
// defensible guess for what a mobile app would hand a web redirect.
export const PAYMENT_SUCCESS_URL = 'wami://payment/success';
export const PAYMENT_CANCEL_URL = 'wami://payment/cancel';
