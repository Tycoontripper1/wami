// Paystack public key for react-native-paystack-webview (card checkout).
//
// NOT SET — nobody has supplied the real key yet. Get it from the Paystack
// dashboard (Settings > API Keys & Webhooks > Public Key, "pk_live_..." or
// "pk_test_..." for testing) and put it here, ideally via an env var rather
// than committing it directly. Card payments are disabled with a clear
// message to the user until this is set — see app/checkout/index.tsx and
// app/chat/[id].tsx.
export const PAYSTACK_PUBLIC_KEY = '';
