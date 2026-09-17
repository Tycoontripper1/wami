# WAMI API Wiring — Part 3: What Got Wired, What's Left

Follow-up to `docs/API-AUDIT-02-MARKETPLACE-AND-BEYOND.md`. That part was a read-only audit;
this part is the actual wiring pass — every endpoint in the WAMI Postman collection that has
a matching screen was connected for real, and the mock/fake-success code standing in for it
was removed. `npx tsc --noEmit` is clean after all of this.

Legend: ✅ wired for real · ⚠️ wired but resting on an unconfirmed assumption (flagged in code
with a comment pointing back here) · ❌ still not wired, with the reason why.

---

## 1. Foundation

- **`services/api/config.ts`** — `API_CONFIG.BASE_URL` no longer bakes in `/v1`. It's now
  `https://api.joinwami.com/api`, and every endpoint that needs the `v1` prefix (reviews,
  messages, notifications, seller, admin, webhooks) carries it in `API_ENDPOINTS` itself,
  matching the collection exactly. ⚠️ **This is the single highest-risk assumption in the
  whole pass** — if backend's real split differs, every new call below 404s. Ask backend to
  confirm per docs/API-AUDIT-01-AUTH.md §2.1 / docs/API-AUDIT-02… §2.1 before shipping.
- Added six new service files: `offeringsService.ts`, `ordersService.ts`, `paymentsService.ts`,
  `reviewsService.ts`, `notificationsService.ts`, `sellerService.ts` — one per previously-missing
  collection folder, all exported from `services/api/index.ts`.
- `chatService.ts` was rewritten from the un-versioned `/conversations` shape (nothing in the
  collection ever documented that) to the real `/v1/messages/conversations*` paths.
- `bookingsService.ts` gained `rescheduleBooking()` and `getBookingsCalendar()`.
- `productsService.ts` gained `bulkUpdateProducts()` / `bulkDeleteProducts()`.

## 2. Offerings — ✅ wired

`app/add-service.tsx` ("Add a Service" from the Post-tab modal) now calls
`offeringsService.createOffering()` — real `POST /offerings`. It used to fake a success alert
after a `setTimeout` with nothing sent anywhere; that's gone.

**⚠️ Unconfirmed:** the client sends `type: 'service'`, but has no UI concept of `type: 'product'`
offerings (products are created separately via `productsService.createProduct` → `POST
/products`, which is a different resource in the collection). If `/offerings` and `/products`
are meant to be the same underlying resource, ask backend to clarify — right now they're wired
as two separate things, matching how the collection documents them as two separate folders.

## 3. Cart & Orders / Payments — ✅ wired (the highest-priority gap from Part 2)

`app/checkout/index.tsx` was rewritten end to end:

- `POST /orders` is now called for real (`ordersService.placeOrder`) before any payment is
  attempted. The order id it returns drives everything after.
- `POST /payments/initialize` + `POST /payments/verify` are called for real for every payment
  method. The `Math.random() < 0.3` fake decline is gone.
- **Card** uses the `react-native-paystack-webview` package that was already a dependency but
  unused — `PaystackProvider` wraps the screen, `usePaystack().popup.checkout()` drives the
  actual charge, and the resulting reference is sent to `/payments/verify`.
- **Bank transfer** places the order + calls `/payments/initialize`, shows the (still static)
  bank details, and only calls `/payments/verify` when the user taps "I've Transferred" — it no
  longer assumes success.
- **Wallet** calls initialize/verify with `gateway: 'wallet'` best-effort (see §8 below — there's
  no confirmed wallet-debit contract).

**⚠️ Blocking, not something I can resolve myself:**
1. **No Paystack public key.** `constants/Payments.ts` has `PAYSTACK_PUBLIC_KEY = ''`. Card
   payments show a clear in-app error ("Card payments are not configured yet") instead of
   crashing, but **nobody can actually pay by card until this is set** from the Paystack
   dashboard.
2. **`/payments/initialize`'s response shape is undocumented** in the collection (no saved
   example response). The code reads `reference` / `transactionRef` defensively off whatever
   Paystack's own webview returns, not off the backend's initialize response — confirm with
   backend whether initialize should hand back its own reference that the client is supposed to
   use instead.
3. The `amount` sent to Paystack is `total * 100` (assuming kobo, NGN's smallest unit) — standard
   for Paystack but unconfirmed for this integration specifically.

## 4. Bookings — ✅ mostly already real, one real bug fixed

Good news from this pass: **`components/BookingModal.tsx` was already calling the real
`POST /bookings`** (`bookingsService.createBooking`) — Part 2's audit was right that the
*chat-based* booking flow was fake, but missed that this separate, already-wired modal (reached
from every "Book Now" button on a creative's profile) was doing it correctly.

**Bug fixed:** it saved the booking to the local Redux cache under a fake local id
(`` `booking_${Date.now()}` ``) instead of the real id the backend returned — so "View Booking"
would have pointed at a booking that doesn't exist server-side. Now uses the real returned id.

**Also fixed:** `onViewBooking` / `onMessage` callbacks on `BookingModal` were declared but never
passed from `app/profile/[id].tsx`, so the post-booking success screen's buttons did nothing.
Now wired to `router.push('/service-tracking/...')` and the real "start a conversation" flow.

**`app/service-tracking/[bookingId].tsx` and `app/booking-history.tsx` — rewritten:**
Previously both screens read from a local-only, fully invented "70% instant / 30% escrow"
`Booking`/`Payment` model (`types/payment.ts`, `store/paymentSlice.ts`) that nothing populated
except the fake chat payment flow. Since that flow is now deleted (§6), that data source would
have gone permanently empty. Both screens now read the real `ApiBooking` model instead:
`service-tracking` fetches `GET /bookings/:id` and renders real `status` + real `milestones`
with a working "Release" button (`POST /bookings/:id/milestones/:id/release`); `booking-history`
fetches `GET /bookings` with the local Redux cache from `BookingModal` as an offline fallback.
**The invented 70/30 escrow split is gone from the UI entirely** — it never had a backend
endpoint (see Part 2 §2.6), so showing it was actively misleading.

**❌ Still not built:** a reschedule/calendar UI. `bookingsService.rescheduleBooking()` /
`getBookingsCalendar()` exist now, but no screen calls them — Part 2 flagged this as net-new
work, and it still is.

**❌ Quote counter-offers still local-only.** `app/quote-received/[id].tsx`'s "Send Counter
Offer" button still doesn't call any endpoint. `quotesService.createQuote()` needs a `booking_id`
per its (unconfirmed — quotes aren't in the collection at all) shape, and there's no confirmed
"counter this quote with a new amount" contract — `respondToQuote` only supports
accept/decline. Wiring this without a confirmed contract would mean inventing a request shape
that's likely wrong, so it was left as-is rather than faking a fix.

## 5. Reviews & Ratings — ✅ wired for creative profiles

`app/profile/[id].tsx` had a fully self-contained fake review system (a hardcoded 3-review
array, a "verified"/"unverified" flag with no meaning, and star-breakdown math blended against
a fake baseline `profile.rating`/`profile.reviews`). Replaced with:

- `GET /v1/reviews` on mount (passing `reviewable_id`/`reviewable_type` defensively — the
  collection's sample doesn't show filtering params, so this may be ignored server-side).
- `POST /v1/reviews` for real when a user submits a review.
- Star average/breakdown now computed purely from the real fetched list, not blended with any
  invented baseline.

**⚠️ Unconfirmed:** `reviewable_type: 'App\\Models\\User'` is a guess — the collection's only
sample uses `App\Models\Product`. Ask backend for the real value before trusting this in
production; reviews submitted with the wrong type may silently attach to nothing or fail.

**❌ Still not built:** a "leave a review" prompt after a completed order or booking
(`order-tracking`, `service-tracking`). Reviews can only be left from a creative's profile page
right now.

## 6. Messaging — ✅ fully rewired, fake payment engine removed

This was the largest change. `app/(tabs)/messages.tsx` and `app/chat/[id].tsx` were 100% static
mock data before (`services/api/chatService.ts` was dead code, never imported by either screen).
Both are now real:

- `messages.tsx` — `GET /v1/messages/conversations`, refreshes on tab focus.
- `chat/[id].tsx` — loads and sends real messages, marks the conversation read on open, has an
  optimistic-send bubble that rolls back on failure.
- A **new "start conversation" flow**: `app/profile/[id].tsx`'s Message button no longer assumes
  a conversation already exists for a given creative id (there's no such lookup in the
  collection) — it opens chat in "new conversation" mode, and the first message sent calls
  `POST /v1/messages/conversations` (`{recipient_id, body}`) for real, matching the collection's
  "Start Conversation" request exactly.

**Removed entirely, not just rewired:** the in-chat price-proposal → simulated-creative-accepts
→ fake-payment-modal → `Math.random() > 0.1` success/fail → locally-dispatched
booking/payment/escrow apparatus. This was ~500 lines of fabricated business logic with **no
matching endpoint anywhere in the collection** (Part 2 §2.6/§3.3 flagged this explicitly). Real
booking creation happens through `BookingModal` (§4) instead; chat is now plain real messaging
with no payment logic layered on top of it, because there is no confirmed contract for
"pay for a service through a chat message" to wire it to.

**⚠️ Unconfirmed — flagged directly in `chatService.ts`:**
- **There is no documented endpoint to fetch a conversation's message history.** The collection
  has List Conversations, Start Conversation, Send Message, Mark Read, Unread Count — nothing
  for "get the messages in conversation X." `chatService.getMessages()` does a `GET` on the same
  URL the collection uses for `POST`-to-send, as the most plausible guess. **Ask backend for the
  real contract** — until then, messages sent in one session may not reliably reload in another.
- The conversation/message field names (`recipient_id`, `unread_count`, `body`, `sender_id`,
  etc.) are inferred from the collection's request bodies, not from any documented response
  shape, since none is saved. The UI maps defensively (`c.name || c.recipient?.name || ...`)
  the same way `discoveryService`'s `DiscoveryOffering` already did.

## 7. Notifications — ✅ built from scratch

Did not exist at all before. Added:

- `app/notifications.tsx` — list, mark-one-read, mark-all-read, pull-to-retry on failure.
- Real unread badge on the Home tab's bell icon (`getUnreadCount` on mount); the Wallet tab's
  bell now navigates to the same screen (its always-on fake red dot is gone).

## 8. Payouts & Commission (seller wallet) — ✅ wired, with two honest "not available" states

`app/(tabs)/wallet.tsx` had a completely separate, self-contained fake economy from the
dedicated `app/wallet/add-funds.tsx` and `app/wallet/withdraw.tsx` screens — four different local
modals (Add Funds, Withdraw, Transfer, History) that manufactured fake `Transaction` objects and
mutated a local `balance` number, none of it ever touching a server.

- **Balance + transaction list** on the wallet tab now load for real from
  `GET /v1/seller/wallet` and `GET /v1/seller/transactions`.
- **Withdraw** (`app/wallet/withdraw.tsx`) went from a literal "Coming soon" placeholder to a
  real form (amount, account number, account name, bank code) that calls
  `POST /v1/seller/payout-requests`. The wallet tab's "Withdraw" quick-action now opens this
  real screen instead of its own fake modal (which was deleted).
- **Add Funds** (both the dedicated screen and the wallet tab's inline modal) and **Transfer**
  (wallet tab only) now show an honest "Not Available Yet" message instead of crediting/debiting
  the local balance. **There is no deposit or peer-to-peer transfer endpoint anywhere in the
  collection** — only the seller wallet/transactions/payout-requests are documented. Faking
  these would mean the screen lies about money that never moved, so they're disabled rather than
  faked. If wallet top-up or transfers are real features, backend needs to supply the contract.

**⚠️ Unconfirmed:** `services/api/config.ts` still keeps the old `WALLET.*` block
(`/wallet/balance`, `/wallet/deposit`, etc.) for `walletService.ts`, which nothing calls. It's
commented as legacy/unclear — ask backend to confirm whether a *general* (buyer-side) wallet
exists separately from the seller payout wallet, or whether `walletService.ts` should just be
deleted.

## 9. Search & Bulk Operations — ✅ wired

`app/my-products.tsx` had single-item edit/delete only. Added a "Select" mode with checkboxes
and a bottom action bar: **Publish** (`POST /products/bulk/update` with `status: 'published'`,
best-effort also tries `POST /offerings/bulk/publish`) and **Delete**
(`POST /products/bulk/delete`). Same known caveat as the existing single-item actions (Part 2
§4.4): "my items" can be a product *or* a service, but bulk actions assume Product — a selected
service would hit the wrong endpoint until "my items" can tell the two apart server-side.

## 10. Analytics & Reporting — ❌ not built

`sellerService.getSalesAnalytics()` / `getTopProducts()` exist and are ready to call, but **no
screen uses them**. `app/creative-dashboard.tsx` — despite its name — is an availability/pricing
settings screen, unrelated to sales analytics, and was left alone. A real analytics screen
(charts, revenue, top products) is net-new UI work, not a wiring fix, and wasn't attempted here.

## 11. Webhooks & Moderation — intentionally untouched

Confirmed out of scope for this mobile client, as Part 2 recommended — these are
backend/admin-panel concerns (`/v1/webhooks*` developer settings, `/v1/admin/moderation/*`).
No service file or screen was added for them.

## 12. Known follow-up debt from this pass

- **Mock mode (`API_CONFIG.USE_MOCK = true`) is now stale for messaging.**
  `services/api/mock/mockHandlers.ts` still only patterns-matches the old
  `/conversations/:id/messages` paths, not the new `/v1/messages/conversations*` ones, and never
  had a pattern for listing conversations at all. Low priority since `USE_MOCK` is `false` in
  production, but local offline UI dev on the messaging screens won't be mocked correctly until
  this is updated.
- `services/api/EXAMPLES.ts`'s chat examples were updated to match the new `chatService.ts`
  signatures (they didn't compile otherwise) — worth a pass to make sure the rest of that file's
  examples still reflect reality, since it wasn't otherwise in scope here.

---

## Summary — what to send backend right now

1. **Confirm the `/api` vs `/api/v1` prefix split** (§1) — every single change in this document
   depends on it being right.
2. **Give us the Paystack public key** (§3) — card payments are wired but inert without it.
3. **Confirm `/payments/initialize`'s response shape** (§3) and whether wallet/bank-transfer
   payments are meant to go through the same endpoint pair as card.
4. **Confirm the message-history-fetch contract** (§6) — nothing in the collection documents how
   to load a conversation's past messages.
5. **Confirm `reviewable_type` for creatives/offerings** (§5), not just products.
6. **Confirm whether a general wallet (deposit/transfer) exists** (§8), or if seller
   payouts are the only real wallet feature.
7. **Confirm the booking-payment contract** — bookings can be created for real now, but there is
   still no way to actually pay for one; the fake escrow flow that used to paper over this was
   removed rather than kept faking it.
