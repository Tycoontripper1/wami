# Wami backend: the complete scope

One pass, nothing held back. Every item below comes from a full audit of every API call the app makes, probed against https://api.joinwami.com/api/v1 (155 routes checked, 129 exist, 26 do not), plus live end-to-end tests of orders and bookings in Paystack test mode with two test accounts. If it is not on this list, the app does not need it.

Legend: **MISSING** route does not exist. **WRONG** exists but behaves differently from what the app needs. **ASK** a decision we need from you.

## A. Blocks launch

| # | What | Needed |
|---|------|--------|
| A1 | **Pickup / paid delivery** (WRONG) | `GET /cart/quote` and order create must accept `fulfilment: delivery\|pickup`, `address_id`, and return per-seller `delivery_fee`, `platform_fee`, `total`. Pickup fee is 0. Reject delivery with no address (422). |
| A2 | **Buyers cannot open a service** (WRONG) | `GET /offerings/{id}` is owner-only (404 for anyone else). Must be readable by any signed-in user for published listings. Drafts stay owner-only. |
| A3 | **Late payment confirmation** (WRONG) | Paystack webhook can take minutes. Until it lands the order stays `initialized`. Make `POST /payments/verify` reliable and idempotent (needs `gateway:"paystack"`; accept it as optional, default paystack). Order and booking must flip to paid the moment verify succeeds. |
| A4 | **Bank list and account check for payouts** (MISSING) | `GET /banks` (name + code) and `POST /banks/resolve {account_number, bank_code}` returning the account name. The payout screen currently makes people type a raw bank code. |

## B. Methods and shapes the app had wrong, or the server should fix

| # | What | Needed |
|---|------|--------|
| B1 | `GET /bookings` | Returns creative-side only unless `role=buyer\|seller` (anything else 422). Make the default return both sides, with a `role` field on each row. |
| B2 | `GET /bookings/calendar` | Same role behaviour as B1. |
| B3 | New listings | Default to draft. Fine, but document it; the app now sends `status:"published"`. |
| B4 | Lists | Shapes vary (array, `items`, `data`, `offerings`). Pick one: Laravel paginator `{data, meta}` everywhere. |
| B5 | Reschedule | Confirm body: `{ date, time, reason? }`. |
| B6 | Categories | Confirm `name` vs `slug` is what listings and filters accept. |
| B7 | Account setup | Confirm which categories are required and the min/max count. |
| B8 | Unread count | Notifications returns `unread_count`; keep that name (the app reads it). |

## C. Notifications and push

| # | What | Needed |
|---|------|--------|
| C1 | Booking events (MISSING) | Laravel notification on: requested, accepted, declined, paid, started, completed, cancelled, rescheduled. Data block: `type:"booking_status"`, `booking_id`, `old_status`, `new_status`, `title`, `description`. |
| C2 | Order paid (MISSING) | Notify the seller when an order is paid. Same shape as the existing `order_status` notification. |
| C3 | Push | Expo/FCM/APNs credentials and `POST /devices` storing the token. Payload carries the same data block so a tap opens the right screen. Until then the app polls every 30 s. |

## D. Offers (price negotiation in chat). App side is built, switched off by `OFFERS_ENABLED`

| # | What | Needed |
|---|------|--------|
| D1 | `POST /offers` (MISSING) | `{ product_id\|offering_id, conversation_id, amount, note? }` creates an offer and a chat message of `type:"offer"`. |
| D2 | `GET /offers`, `GET /offers/{id}` (MISSING) | Seller inbox and detail, filter `status`, `role`. |
| D3 | `PUT /offers/{id}` (MISSING) | `{ action: accept\|decline\|counter, amount? }`. Only the other party may act; 422 `not_your_move` otherwise. |
| D4 | Rules | One open offer per buyer per item; expiry (default 48 h); accepted offer fixes the price in cart/quote and booking; sold-out or edited price voids it. |
| D5 | Notifications | `type:"offer"`, `offer_id`, `conversation_id`, `new_status`, `amount`. |
| D6 | Quotes | `/quotes` exists; confirm counter contract or fold into offers. |

## E. Orders and bookings: rules to confirm in code

- Seller sets packing, dispatched. Only buyer sets delivered and complete (422 `not_your_step`). Confirmed working.
- E1 `POST /orders/{id}/cancel` and `/refund` (MISSING): buyer may cancel before dispatch; refund to original method; seller notified.
- E2 Money release timing: when exactly seller funds become withdrawable (on complete? after N days?). ASK.
- E3 Platform fee: 5% confirmed on orders; confirm the same on bookings.
- E4 One-time phone and return address on an order address are dropped on save (WRONG): persist `phone`, `landmark`.
- E5 Booking milestone release is PATCH; keep.

## F. Public and web

| # | What | Needed |
|---|------|--------|
| F1 | Public receipt (MISSING) | `GET /payments/receipt?reference=` without login, returning kind (order/booking), items or service, amount, fee, status, date. The landing success page uses it. |
| F2 | Return URLs | Paystack callback and cancel URLs: `https://www.joinwami.com/payment/success?reference=` and `/payment/cancelled`. |

## G. Features with no backend yet (app hides or fakes them)

| # | Feature | Status |
|---|---------|--------|
| G1 | Delivery tracking (`DELIVERY_ENABLED`) | MISSING `/deliveries`, `/delivery/quote`. Needs a decision: own riders, partner, or pickup only at launch. ASK. |
| G2 | Instagram import (`INSTAGRAM_IMPORT_ENABLED`) | Needs Meta app review and credentials. |
| G3 | Place search and cities | `GET /locations/cities`, `GET /locations/search?q=` (MISSING). Needs a Maps/Places key. |
| G4 | Posts | `GET/POST /posts` (MISSING) if "Share a post" stays in the Post menu. ASK. |
| G5 | Buyer wallet | Only seller wallet exists. Confirm no buyer wallet at launch. ASK. |
| G6 | Loyalty and creative-match | Run on the phone only. Confirm if they ship; if yes they need endpoints. ASK. |
| G7 | Service photos | Upload and order of photos on a service listing. |

## H. Please confirm

Session length and refresh (`POST /auth/refresh`), account deletion (`/profile/delete` or `DELETE /profile`), and that `POST /payments/verify` is safe to call repeatedly.

## Already fixed on the server and confirmed working

Messaging, photos, listing fee fields, cart and quote, address book, reviews, order step rules, booking flow, booking pay, notifications for order status and new messages.

## Acceptance

Backend ticks every A to C item and the matching test passes with the two test accounts. D and G go live as each lands; the app turns them on with a flag, no release needed for flags already in `constants/Features.ts`.
