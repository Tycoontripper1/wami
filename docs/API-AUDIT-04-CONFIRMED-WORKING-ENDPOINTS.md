# WAMI API Audit — Part 4: Confirmed-Working Endpoints and Their Use Cases

Follow-up to Parts 1–3. Those documented bugs and gaps; this part is the other half — every
endpoint that has been **live-tested against the real production backend** (`api.joinwami.com`)
and confirmed working, with the actual screen/feature in this app that depends on it.

Legend: ✅ confirmed working, endpoint and app wiring both good · ⚙️ endpoint itself confirmed
working, but the app's current use of it is broken for a separate, already-documented reason
(see Part 3 / Part 4 §Known Issues) · 🔁 confirmed working in an earlier session per Part 2/3,
not re-verified in this pass.

---

## Auth — ✅ all confirmed (earlier session)

| Endpoint | Use case |
|---|---|
| `POST /auth/send-code` | Sign-up flow — sends the email OTP (`app/(auth)/sign-up-email.tsx`) |
| `POST /auth/verify-code` | Sign-up flow — OTP confirmation step |
| `POST /auth/complete` | Sign-up flow — final step, creates the account |
| `POST /auth/login` | Sign-in screen (`app/(auth)/sign-in.tsx`) |

## Account Setup — ✅ confirmed

| Endpoint | Use case |
|---|---|
| `POST /account/setup` | Creative onboarding — sets `account_type` (discover/promote/both) + categories. This is the gate behind every creative-only feature (Offerings, Bookings Calendar, etc.) — was 500ing, backend fixed it, confirmed 200 with a full payload. |
| `GET /account/categories` 🔁 | Category picker shown during that same onboarding step |

## Profile — ✅ confirmed

| Endpoint | Use case |
|---|---|
| `GET /profile` | Used constantly: Home tab header (location/greeting), Profile tab, and the proactive session-expiry checker (`app/_layout.tsx`'s `ExpiredSessionHandler`) pings this every 5 minutes to detect a dead token. |

## Offerings — ✅ confirmed

| Endpoint | Use case |
|---|---|
| `POST /offerings` | "Add a Service" modal from the center Post tab (`app/add-service.tsx`) — confirmed 201 once `account_type` was fixed. |
| `POST /offerings/bulk/delete` | My Products screen's bulk-delete action for services (`app/my-products.tsx`) |
| `GET /offerings` | **Caveat:** confirmed 200, but only ever returns the *logged-in user's own* offerings — `user_id`/`creative_id`/`seller_id` query filters were tried live and all ignored. Not usable for "show me creative X's services." |

## Discovery — ✅ confirmed

| Endpoint | Use case |
|---|---|
| `GET /discovery/feed` | Home tab's swipeable creative/offering card stack (`app/(tabs)/index.tsx`) |
| `GET /discovery/search` | Shop search bar / `products-listing`. **Caveat:** confirmed 200, but searching `"music"` returned an unrelated shoe product — query doesn't appear to actually filter server-side. Worth a backend question. |

## Products — ✅ confirmed

| Endpoint | Use case |
|---|---|
| `GET /products` | Shop tab's main product grid and "Featured" shelf (`app/(tabs)/discover.tsx`) |
| `GET /products/:id` | Product Detail screen, and Checkout's item display |
| `POST /products` | "List a Product" modal from the Post tab — confirms creating a product also auto-creates a matching Offering record (response includes both `data` and `offering`) |
| `POST /products/bulk/update` | My Products bulk-publish action |
| `POST /products/bulk/delete` | My Products bulk-delete action |

## Cart & Orders — ✅ confirmed

| Endpoint | Use case |
|---|---|
| `GET /cart` | Confirmed working, correct shape — not currently read by any screen directly |
| `POST /cart/items` (undocumented, real) | Checkout's implicit "add to cart" step before placing an order — required, `POST /orders` 400s on an empty cart otherwise |
| `POST /orders` | Checkout's "Pay" button, for every payment method — this is the step that actually succeeds; everything after it (payment) is what's currently blocked |

## Bookings — ⚙️ endpoints confirmed, app wiring partly broken

| Endpoint | Use case |
|---|---|
| `GET /bookings` | Booking History screen |
| `GET /bookings/calendar` 🔁 | Booking Calendar screen — confirmed after the `/api/v1` base-URL fix in Part 3, not re-verified this pass |
| `POST /bookings` ⚙️ | "Book Now" flow (`BookingModal`) and Quote Request flow. The endpoint itself now works correctly with `{offering_id, creative_id, ...}` (fixed `creative_id` this session) — but the app still sends the *creative's user id* as `offering_id` instead of a real offering id, so real bookings through the UI still fail. See Part 4 §Known Issues. |
| `POST /bookings/:id/reschedule` | Booking Reschedule screen — fixed this session to send the required `Y-m-d H:i:s` datetime instead of a bare date |

## Reviews & Ratings — ⚙️ endpoint confirmed, creative-profile use broken

| Endpoint | Use case |
|---|---|
| `GET /reviews` (with `reviewable_type`+`reviewable_id`) | Intended for both product reviews and creative-profile reviews |
| `POST /reviews` ⚙️ | Confirmed contract: valid `reviewable_type` values are `App\Models\Product` (gated by "you must have purchased it"), `App\Models\Offering` (gated by "you must have booked it"), and `App\Models\Booking`. **`App\Models\User` is explicitly rejected** — this is what `app/profile/[id].tsx` currently sends, so creative-profile reviews are broken. See Part 4 §Known Issues. |
| `GET /reviews/user/:id/rating` | Creative profile's star-rating display |

## Messaging — ✅ confirmed

| Endpoint | Use case |
|---|---|
| `GET /messages/conversations` | Chats tab list (`app/(tabs)/messages.tsx`) |
| `GET /messages/unread-count` | Chats tab unread badge |
| `POST /messages/conversations` | "Message" button on a creative's profile, starting a new chat. Contract confirmed (`{recipient_id, body}`); not tested against a second real user to avoid messaging a stranger as a test. **Found:** messaging yourself throws a raw, unhandled SQL error ("Duplicate entry... conversation_participants") instead of a clean validation message — a real backend bug, low priority since the UI shouldn't let you message yourself anyway. |

## Notifications — ✅ confirmed

| Endpoint | Use case |
|---|---|
| `GET /notifications/unread-count` | Home tab bell badge — this is one of the two calls that exposed the auth-token race condition fixed this session |
| `POST /notifications/read-all` | Notifications screen's "mark all read" |
| `GET /notifications` 🔁 | Notifications screen's list — not directly re-tested this pass, but its sibling endpoints above both confirmed healthy |

## Payouts & Commission (seller wallet) — ✅ confirmed (reads only)

| Endpoint | Use case |
|---|---|
| `GET /seller/wallet` | Wallet tab balance display |
| `GET /seller/transactions` | Wallet tab transaction history |
| `POST /seller/payout-requests` | Withdraw screen — **deliberately not tested**, since a real payout request moves real money. Contract is documented in the collection; worth a one-off manual test by a human when ready. |

---

## Known Issues (cross-reference — see Parts 3–4's inline findings for full detail)

These are the gaps behind the ⚙️ markers above, repeated here so this is a complete picture in
one place:

1. **Payments are fully blocked.** `POST /payments/initialize`'s `success_url`/`cancel_url` use
   the app's `wami://` scheme, which the backend's `url` validation rule rejects outright (only
   `http(s)` passes). Blocks card, bank transfer, and wallet payment — see Part 3 §3 and the
   `constants/Payments.ts` / `services/api/config.ts` comments.
2. **Creative-profile reviews and real bookings share one root gap:** there is no confirmed way
   to fetch a *specific creative's* offering id from a public-facing screen — `GET /offerings`
   only returns the logged-in user's own. Both reviews (`reviewable_type`/`id`) and bookings
   (`offering_id`) need a real offering id tied to the creative being viewed, and
   `app/profile/[id].tsx`'s own content is still local mock data on top of that
   (`MOCK_PROFILE`/`getCreativeById`), not fetched from the backend at all.
3. **`/products/featured` and `/bookings/:id/cancel` don't exist** — both removed from the
   codebase this session rather than left as permanently-failing dead calls.
4. **Admin (`/v1/admin/*`) and Webhooks (`/v1/webhooks*`) are untested** — no admin account
   available, and Webhooks was already out of scope for this mobile client per Part 3 §11.
