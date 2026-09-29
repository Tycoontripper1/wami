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
//
// CONFIRMED BLOCKED live 2026-09-29, tested through the real checkout UI
// (bank transfer): the backend rejects these with 422 "The success url
// field must be a valid URL" / same for cancel_url. Laravel's default `url`
// validation rule does not accept a custom app scheme like "wami://" — only
// http(s) is considered "valid". There is no way to make this pass from the
// client alone: either the backend needs to accept app-scheme URLs for this
// field, or it needs to hand back a real https:// URL (e.g. a web page it
// hosts that immediately redirects into the app via the wami:// scheme).
// Every payment method (card/bank_transfer/wallet) goes through
// initializePayment with these fields, so ALL real payments are blocked on
// this until backend decides which shape it wants. Do not swap these for a
// throwaway https URL to silence the 422 — that would hide a real
// architecture gap, not fix it.
export const PAYMENT_SUCCESS_URL = 'wami://payment/success';
export const PAYMENT_CANCEL_URL = 'wami://payment/cancel';
