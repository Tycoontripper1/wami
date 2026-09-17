# WAMI API Audit — Part 2: Marketplace, Bookings, Payments & Everything After Auth/Profile

Audit of the Expo/React Native client against the **WAMI Postman collection**
(`WAMI.postman_collection.json`, 8 phases). Part 1 (`docs/API-AUDIT-01-AUTH.md`) covered
Auth, Account Setup and Profile, which are confirmed working. This part covers every other
collection folder: `Offerings`, `Discovery`, `Marketplace - Products`, `Marketplace - Cart &
Orders`, `Payments`, `Bookings`, `Reviews & Ratings`, `Messaging`, `Notifications`, `Payouts &
Commission`, `Search & Bulk Operations`, `Booking Scheduling`, `Analytics & Reporting`,
`Webhooks & Moderation` — plus every adjacent feature already built in the app (quotes,
escrow, chat-to-payment, delivery).

- Client marketplace code: `services/api/productsService.ts`, `discoveryService.ts`
- Client booking/quote code: `services/api/bookingsService.ts`, `quotesService.ts`
- Client chat/wallet code: `services/api/chatService.ts`, `walletService.ts`
- Legacy local escrow model: `types/payment.ts`, `store/paymentSlice.ts`
- Endpoint constants: `services/api/config.ts`
- Screens: `app/(tabs)/*`, `app/checkout/*`, `app/chat/[id].tsx`, `app/booking-history.tsx`,
  `app/service-tracking/[bookingId].tsx`, `app/quote-received/[id].tsx`, `app/my-products.tsx`,
  `app/add-service.tsx`, `app/creative-dashboard.tsx`, `app/wallet/*`, `app/orders.tsx`,
  `app/delivery/*`

Legend: **OK** = matches collection · **MISMATCH** = needs a decision · **MISSING** = the app
calls or needs an endpoint that is not in the collection · **UNWIRED** = the client code exists
and is correctly typed, but no screen actually calls it (so today it does nothing).

---

## 1. What already matches the collection

| Collection request | Client implementation | Verdict |
|---|---|---|
| `GET /products` | `productsService.getProducts()` — `app/(tabs)/discover.tsx`, `app/products-listing.tsx` | **OK** |
| `POST /products` `{title, description, price, currency, category, stock, status}` | `productsService.createProduct()` — `app/(tabs)/sell.tsx` ("List a Product") | **OK** — body is field-for-field identical |
| `GET /discovery/feed` | `discoveryService.getDiscoveryFeed()` — `app/(tabs)/index.tsx` | **OK** |
| `GET /discovery/search` | `discoveryService.searchDiscovery()` implemented | **UNWIRED** — no screen calls it |
| — (not in collection) | `discoveryService.getNearYou()`, `saveOffering()`, `swipeOffering()` — `app/(tabs)/index.tsx` (near-you feed, save, like/pass) | client-only extensions, see §2 |

Everything else the app does in this scope is either not in the collection at all, or is
built but never actually called. See below.

---

## 2. Mismatches — need a decision from backend

### 2.1 `/api` vs `/api/v1` still applies here

Same issue as Part 1 §2.1: the collection mixes un-versioned (`offerings`, `discovery`,
`products`, `cart`, `orders`, `payments`, `bookings`) and `v1`-prefixed (`v1/reviews`,
`v1/messages/*`, `v1/notifications/*`, `v1/seller/*`, `v1/admin/*`, `v1/webhooks/*`, and
duplicate `v1/products/bulk/*`, `v1/bookings/*/reschedule`) paths, while the client's
`API_CONFIG.BASE_URL` is hardcoded to `.../api/v1` for everything (`services/api/config.ts:14`).
This part's findings assume that gets resolved per Part 1 — if the resolution differs by
route group, several of the "OK" rows above may need re-checking.

### 2.2 Single product update/delete — not in the collection at all

`app/my-products.tsx` edits and deletes individual listings via
`productsService.updateProduct()` (`PATCH /products/:id`) and `deleteProduct()`
(`DELETE /products/:id`) — both declared in `services/api/config.ts:137-139`. The collection's
`Marketplace - Products` folder only documents `list`, `create`, `bulk update`, `bulk delete`.

**Ask:** do `PATCH /products/:id` and `DELETE /products/:id` exist? If not, `my-products.tsx`'s
edit/delete actions (already shipped) will 404.

### 2.3 Wallet: two different endpoint families for what looks like one feature

- Client (`services/api/config.ts:113-119`, `walletService.ts`): `/wallet/balance`,
  `/wallet/transactions`, `/wallet/deposit`, `/wallet/withdraw`, `/wallet/transfer`.
- Collection (`Payouts & Commission` folder): `/v1/seller/wallet`, `/v1/seller/transactions`,
  `/v1/seller/payout-requests`, plus admin approval endpoints.

These read as two unrelated designs — a general buyer/seller wallet vs. a seller-only payout
ledger — and neither is currently wired to any screen (see §3). **Ask:** is `/wallet/*` stale
client-side scaffolding we should delete, or does a general wallet exist alongside the seller
payout endpoints? If both exist, please confirm how `wallet.tsx`'s single balance figure should
be composed from them.

### 2.4 Quotes are not in the collection, but are half-wired into the app

`services/api/quotesService.ts` (`GET /quotes`, `POST /quotes`, `POST /quotes/:id/respond`) has
no matching folder anywhere in `WAMI.postman_collection.json`, yet `respondToQuote()` is
actually called from `app/quote-received/[id].tsx:55` (Accept/Decline a quote). The 18% "Wami
fee" shown on that screen (`WAMI_FEE_PERCENT = 0.18`) is also a client-side constant with no
backend confirmation.

**Ask:** do `/quotes` endpoints exist in the real API? If quotes are actually meant to be
`Offerings` with a negotiation step, we need the real contract. Also confirm the platform fee
percentage (18%) and whether it's computed server-side or something the client should keep
hardcoding.

### 2.5 `create booking` body — client requires a field the collection sample omits

Collection sample body for `POST /bookings`:
```json
{ "offering_id": 1, "project_title": "New project", "start_date": "...", "end_date": "...", "total_amount": 50000, "currency": "NGN" }
```
`bookingsService.CreateBookingPayload` (`services/api/bookingsService.ts:47-55`) additionally
requires `project_details` (no `?`). **Ask:** is `project_details` actually required server-side,
or should the client's type drop the requirement to match the collection sample?

### 2.6 The 70/30 escrow split has no matching endpoint anywhere

`service-tracking/[bookingId].tsx`, `chat/[id].tsx`, and `booking-history.tsx` are all built
around a "70% paid instantly to creative, 30% held in escrow, released on buyer confirmation"
model (`types/payment.ts` `EscrowDetails`, `calculateEscrow()`). Nothing in the collection
documents a split-payment or escrow-release endpoint — the closest is bookingsService's
(unwired) `releaseMilestone()` against `/bookings/:id/milestones/:milestoneId/release`, which is
a different concept (named milestones with their own amounts, not a fixed 70/30 split).

**Ask:** is the 70/30 escrow split a real, planned backend feature? If so we need its endpoint
contract (initiate, release, dispute). If the real model is milestone-based instead, the escrow
UI (service-tracking, the chat payment flow) needs to be rebuilt around milestones and this
should be scoped as new work, not a wiring fix.

---

## 3. MISSING / UNWIRED — features already built in the app with no working backend call

### 3.1 Offerings — the whole folder is unbuilt client-side

- `POST /offerings` — no `offeringsService` exists anywhere in `services/api/`.
  `app/add-service.tsx` (reached from the center **Post** tab's "Add a Service" option, per
  `app/(tabs)/_layout.tsx`) collects service name/description/price and, on save, just runs a
  `setTimeout` + success `Alert` — **no network call at all.** Every service a creative "lists"
  today is thrown away as soon as the screen closes.
- `GET /offerings`, `POST /offerings/bulk/publish`, `POST /offerings/bulk/delete` — also
  unimplemented client-side.

**Ask:** confirm the `{title, description, price, currency, type}` shape from the collection is
correct for services too (the client currently has no `type` field to distinguish
service-vs-product), then this is a straightforward wire-up once we build `offeringsService.ts`.

### 3.2 Marketplace - Cart & Orders — checkout never talks to the backend

- `GET /cart` — no cart concept exists client-side at all. `app/checkout/index.tsx` operates on
  a single hardcoded `MOCK_PRODUCTS` item (`const product = MOCK_PRODUCTS.find(...)`), not a
  real cart.
- `POST /orders` `{shipping_address}` — **never called.** `processOrder()` in
  `checkout/index.tsx:105-152` fabricates an order id (`` `ORD${Date.now()}` ``) and a fake
  tracking number client-side, then just `dispatch(addProductOrder(newOrder))` into Redux. The
  order only ever exists in that device's Redux store — it is never persisted to the backend, so
  it vanishes on reinstall and is invisible to the seller, to any admin dashboard, and to a
  second device signed into the same account.

**Ask:** is cart server-side and multi-item, or does checkout stay single-product with an
implicit 1-item cart? Either way we need `POST /orders` wired for real, plus cart
add/remove/update endpoints if multi-item cart is intended (none are in the collection today).

### 3.3 Payments — entirely simulated, no gateway integration exists

- `POST /payments/initialize` `{order_id, gateway}`, `POST /payments/verify`
  `{order_id, gateway, reference}` — **never called anywhere.** Both purchase flows in the app
  fake payment success/failure with `Math.random()`:
  - `checkout/index.tsx:110` — 30% chance of a fake card decline.
  - `chat/[id].tsx:228` — 90% chance of fake success on the price-proposal-to-payment flow.
- No Paystack/Flutterwave/Stripe SDK or webview checkout exists in the app despite the UI
  presenting "Card", "Bank Transfer", and "Wami Wallet" as real options and showing fake bank
  account details (`0123456789`, "Wami Technologies Ltd — GT Bank") for users to "transfer" to.

**Ask:** what's the intended client flow for `/payments/initialize` — redirect to a hosted
checkout page, in-app webview, or native SDK? What triggers `/payments/verify` (a webhook the
backend already has, or does the client have to poll/confirm)? This is the highest-risk gap in
the whole app: real users could believe they've paid when nothing has been charged or recorded.

### 3.4 Bookings — real endpoints exist client-side but nothing calls them

- `POST /bookings`, `GET /bookings`, `PATCH /bookings/:id/status`,
  `POST /bookings/:id/milestones`, `POST /bookings/:id/milestones/:id/release` — all correctly
  implemented in `bookingsService.ts` against the collection's `ApiBooking` shape, and all
  **UNWIRED**. No screen imports `bookingsService`.
- Instead, booking creation happens entirely inside `chat/[id].tsx:263`
  (`dispatch(addBooking(...))`), against the unrelated local-only `Booking` model in
  `types/payment.ts`. `booking-history.tsx` and `service-tracking/[bookingId].tsx` read only
  from Redux — never from `GET /bookings`.
- See §4 for why these are two incompatible models, not just "the same thing called from two
  places."

### 3.5 Booking Scheduling — 100% unbuilt

- `POST /bookings/:id/reschedule`, `GET /bookings/calendar` — not in `API_ENDPOINTS.BOOKINGS`
  (`services/api/config.ts:91-102` has no `RESCHEDULE` or `CALENDAR` key), no service function,
  no screen offers rescheduling or a calendar view anywhere in the app.

**Ask:** is a reschedule/calendar UI planned for this app? If yes it's a net-new screen, not a
wiring fix — flagging now so it can be scoped rather than discovered late.

### 3.6 Reviews & Ratings — no review-creation UI exists

- `GET /v1/reviews`, `POST /v1/reviews` `{reviewable_type, reviewable_id, rating, comment}`,
  `GET /v1/reviews/user/:id/rating` — no `reviewsService`, no screen. There is no "leave a
  review" prompt on `order-tracking`, `service-tracking`, or a creative's `profile/[id].tsx`
  after a completed order/booking.
- The only rating UI in the app is `app/delivery/rate/[orderId].tsx`, which rates a **mock
  delivery driver** (`services/deliveryService.ts` — fully fake names/avatars/ETAs, "for demo
  purposes" per its own header comment). Pressing Submit only sets local `submitted` state —
  no API call, and this isn't the collection's `reviewable_type` concept at all (there's no
  `App\Models\Driver` in the sample).

**Ask:** confirm `reviewable_type` values (`App\Models\Product` is in the sample — what covers
creatives/offerings?) so we can build real review creation on order/booking completion, and wire
`GET /v1/reviews/user/:id/rating` into `profile/[id].tsx`, which currently shows a rating from
local/mock data (needs its own audit pass to confirm the source).

### 3.7 Messaging — the entire feature is a static mock, and targets the wrong URLs anyway

- `app/(tabs)/messages.tsx` renders a hardcoded `CONVERSATIONS` array. `app/chat/[id].tsx`
  renders a hardcoded `MOCK_MESSAGES` array against a hardcoded `MOCK_CREATIVE`. **Neither
  screen imports `services/api/chatService.ts` at all** — it is dead code, unreachable from any
  screen in the app.
- Even if wired up, `chatService.ts` targets the wrong paths: `/conversations`,
  `/conversations/:id/messages` (`services/api/config.ts:123-129`) vs. the collection's
  `/v1/messages/conversations`, `/v1/messages/conversations/:id`,
  `/v1/messages/conversations/:id/read`, `/v1/messages/unread-count`.
- `GET /v1/messages/unread-count` — no concept of it client-side; the `unread: 2` badges in
  `messages.tsx` are hardcoded per mock conversation.

**Ask:** confirm `/v1/messages/conversations` is canonical so we rewrite `chatService.ts` to
match, then wire `messages.tsx` + `chat/[id].tsx` for real (list, open, send, mark-read, unread
badge). This is a full feature build — real-time delivery (websocket vs. polling) needs scoping
too, since the collection only documents REST endpoints.

### 3.8 Notifications — 100% unbuilt, no plumbing exists at all

- `GET /v1/notifications`, `GET /v1/notifications/unread-count`,
  `POST /v1/notifications/:id/read`, `POST /v1/notifications/read-all` — no service, no store
  slice, no screen anywhere in the app.
- The bell icons on Home (`app/(tabs)/index.tsx:174`) and Wallet (`app/(tabs)/wallet.tsx:176`)
  are decorative — no `onPress`, no navigation, no badge count sourced from anything.
- `app/(tabs)/profile.tsx:81` has a local "Notifications" **toggle** — that's a push-notification
  opt-in preference, unrelated to an in-app notification feed, and it doesn't call any endpoint
  either (state is local only).

**Ask:** confirm a notifications screen is wanted; this is from-scratch work, not a fix.

### 3.9 Payouts & Commission (seller wallet)

- `GET /v1/seller/wallet`, `GET /v1/seller/transactions`, `POST /v1/seller/payout-requests` —
  none called. `app/(tabs)/wallet.tsx`'s balance (`₦125,000`) and its 5 transactions are
  hardcoded `useState` fixtures (`wallet.tsx:41,64-70`) that never refresh from any source.
- `app/wallet/add-funds.tsx` presents Stripe/Paystack/bank options but "Add Funds" only
  `dispatch(addTransaction(...))`s into `walletSlice` locally — no `walletService.depositFunds()`
  call, no gateway.
- `app/wallet/withdraw.tsx` is a literal "Coming soon" placeholder screen — not built at all.
- Admin payout approval (`GET/POST /v1/admin/payouts...`) is out of scope for this mobile
  client — flagging only so it's clear the mobile app isn't expected to call these.

### 3.10 Search & Bulk Operations

- `POST /v1/products/bulk/update`, `/v1/products/bulk/delete`, `/v1/offerings/bulk/publish` —
  no multi-select UI exists anywhere (`my-products.tsx` only edits/deletes one item at a time).
  Not urgent, just noting the collection documents a capability ("select multiple → publish/
  delete all") the UI doesn't offer yet.

### 3.11 Analytics & Reporting

- `GET /v1/seller/analytics/sales`, `GET /v1/seller/analytics/top-products` — 100% unbuilt.
  `app/creative-dashboard.tsx`, despite its name, is only an availability/pricing-rules settings
  screen (bookable days/times, min/max price, instant-booking toggle) — no charts, no revenue
  numbers, no top-products list, and its "Save" button is a local `Alert.alert` with no API call
  at all (`creative-dashboard.tsx:70-74`).
- Admin dashboard endpoints (`/v1/admin/dashboard/*`) are out of scope for this client.

**Ask:** if sellers are meant to see sales analytics in-app, that's a net-new screen — please
confirm before we scope it as part of this audit's follow-up work.

### 3.12 Webhooks & Moderation — out of scope for this client

`/v1/webhooks*` (developer-facing webhook subscriptions) and `/v1/admin/moderation/*` read as
backend/admin-panel concerns rather than something a buyer/seller mobile app calls. Flagging
only so backend knows this is intentional, not an oversight — unless a seller-facing "developer
settings" screen is planned, in which case say so and we'll scope it.

---

## 4. Client-side bugs / architecture issues found during this audit (our side, no backend action)

1. **Two incompatible booking models coexist.** `ApiBooking` (`services/api/bookingsService.ts`,
   matches the collection: `offering_id`, `project_title`, `milestones`) and the local-only
   escrow `Booking` (`types/payment.ts`, driven by `store/paymentSlice.ts`: `creativeId`,
   `agreedPrice`, 70/30 split) are both live in the codebase. Every real booking screen
   (`chat/[id].tsx`, `booking-history.tsx`, `service-tracking/[bookingId].tsx`) uses the second,
   local-only one. Nothing ever creates an `ApiBooking`.
2. **`chatService.ts`, `walletService.ts`, and most of `bookingsService.ts`/`quotesService.ts`
   are dead code** — fully implemented, correctly typed against `apiClient`, and never imported
   by any screen. Worth confirming intent: are these scaffolded ahead of upcoming screens, or
   safe to treat as "not actually part of the app" for planning purposes?
3. **Checkout and the chat payment flow each simulate payment locally**
   (`Math.random() < 0.3` in `checkout/index.tsx:110`, `Math.random() > 0.1` in
   `chat/[id].tsx:228`) instead of calling any backend. Both need to be ripped out once real
   `/payments/*` endpoints are wired up (§3.3).
4. **`my-products.tsx` mixes two data sources for one screen.** It *lists* items via
   `getMyItems()` (`/discovery/my-items`, the generic "offering" shape that can be a creative,
   product, or service) but *edits/deletes* via `productsService` (`/products/:id`), assuming
   every "my item" is a `Product`. If a creative's "my items" ever includes a service
   (`Offering`), edit/delete will call the wrong endpoint.
5. **Cosmetic "it worked!" screens with no backend call:** `add-service.tsx`, `share-post.tsx`,
   and `creative-dashboard.tsx` all show a success `Alert` after a `setTimeout`, with nothing
   persisted anywhere.
6. **Delivery/driver matching is fully mocked** (`services/deliveryService.ts` — fake names,
   avatars, prices, ETAs, explicitly commented "for demo purposes"). This has no equivalent in
   the collection at all; if real logistics/driver-dispatch is planned, that's a separate
   integration (not this backend) and should be scoped on its own.

---

## 5. Summary of the ask

**Confirm (decisions needed, §2):** `/api` vs `/api/v1` per route group (carries over from
Part 1) · whether single-item `PATCH/DELETE /products/:id` exist · which wallet endpoint family
is canonical (`/wallet/*` vs `/v1/seller/wallet*`) · whether `/quotes` endpoints exist and the
18% fee is correct · whether `project_details` is required on booking creation · whether the
70/30 escrow split is a real, planned backend feature or should be replaced with the
milestone model that already has an endpoint.

**Build — highest priority, real money/trust on the line:** `/payments/initialize` +
`/payments/verify` (§3.3, currently 100% simulated) and `POST /orders` (§3.2, currently orders
are never persisted to the backend at all).

**Build — features already scaffolded client-side, ready to wire up once contracts are
confirmed:** `POST /offerings` (§3.1), `GET/POST /bookings` + status/milestones (§3.4, service
exists, just needs a screen to call it), `/v1/messages/conversations*` (§3.7, needs a full
rewrite of `chatService.ts`'s paths first).

**Build — from-scratch features, no client-side scaffolding exists yet:** Reviews & Ratings
(§3.6), Notifications (§3.8), seller wallet / Payouts & Commission (§3.9), Booking Scheduling —
reschedule + calendar (§3.5), Analytics & Reporting (§3.11), bulk select UI for products/
offerings (§3.10).

**Out of scope for this mobile client (flagging only):** Webhooks, Admin Moderation, Admin
Payouts, Admin Dashboard (§3.9, §3.11, §3.12) — presumably consumed by a separate admin panel.
