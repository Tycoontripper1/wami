# WAMI API Audit — Part 1: Auth, Account Setup & Profile

Audit of the Expo/React Native client against the **WAMI Postman collection**
(`WAMI.postman_collection.json`, 8 phases).

Scope of this part: the `Auth`, `Account Setup` and `Profile` collection folders, plus every
auth-adjacent feature already built in the app.

- Client auth code: `services/authService.ts`
- Client profile code: `services/api/profileService.ts`
- Endpoint constants: `services/api/config.ts`
- Screens: `app/(auth)/*`, `app/change-password.tsx`, `app/account-actions.tsx`, `app/edit-profile.tsx`

Legend: **OK** = matches collection · **MISMATCH** = needs a decision · **MISSING** = the app
calls or needs an endpoint that is not in the collection.

---

## 1. What already matches the collection

| Collection request | Client implementation | Verdict |
|---|---|---|
| `POST /auth/send-code` `{email}` -> `{token}` | `authService.sendSignUpCode()` — `app/(auth)/sign-up-email.tsx` | **OK** |
| `POST /auth/verify-code` `{token, otp}` | `authService.verifySignUpCode()` — `app/(auth)/verification-code.tsx` | **OK** — 4-digit OTP input matches the collection's `"otp": "5098"` sample |
| `POST /auth/complete` `{token, first_name, last_name, username, password, password_confirmation}` | `authService.completeSignUp()` — `app/(auth)/create-account.tsx` | **OK** — request body is field-for-field identical |
| `POST /auth/login` `{email, password}` | `authService.signIn()` — `app/(auth)/sign-in.tsx` | **OK** — reads `access_token`, the same key the collection's own test script saves |
| `GET /profile` | `profileService.getProfile()` — `app/(tabs)/profile.tsx`, `app/edit-profile.tsx` | **OK** |
| `POST /account/setup` | `authService.setupAccount()` — `app/(auth)/onboarding-complete.tsx`, `creative-complete.tsx` | **Partial** — see §2.4 |
| `GET /account/categories` | `authService.getCategories()` exists but **is never called** | see §3.1 |

The 3-step sign-up chain (`send-code` -> `verify-code` -> `complete`) correctly threads the
server `token` through navigation params at each hop, and tolerates both `{token}` and
`{data:{token}}` response envelopes. Login and complete-registration persist `access_token`
to AsyncStorage and push it into `apiClient` as a bearer token.

---

## 2. Mismatches — need a decision from backend

### 2.1 `/api` vs `/api/v1` — highest priority

The collection defines `BASE_URL_PROD = https://api.joinwami.com/api` and then uses **two
different prefixes underneath it**:

- **No `v1`:** `auth/*`, `account/*`, `profile`, `offerings/*`, `discovery/*`, `products/*`, `cart`, `orders`, `payments/*`, `bookings/*`
- **With `v1`:** `v1/reviews`, `v1/messages/*`, `v1/notifications/*`, `v1/seller/*`, `v1/admin/*`, `v1/webhooks/*`, and *duplicates* of products/offerings/bookings (`v1/products/bulk/update`, `v1/bookings/1/reschedule`, ...)

The client assumes `v1` everywhere:

- `services/authService.ts:12` — `const PROD_BASE = 'https://api.joinwami.com/api/v1'`
- `services/api/config.ts:16` — `BASE_URL: 'https://api.joinwami.com/api/v1'`

**So the client is calling `/api/v1/auth/login` while the collection documents
`/api/auth/login`.** One of the two is wrong, and the same ambiguity affects every
`apiClient` call (`/api/v1/profile`, `/api/v1/products`, `/api/v1/bookings`, ...).

**Ask:** please confirm the canonical prefix per route group — ideally one `/api/v1/...`
namespace, with the un-versioned paths kept as aliases. Are `products/bulk/update` and
`v1/products/bulk/update` the same handler, or two different ones?

### 2.2 `PUT /profile` vs `POST /profile/update`

- Collection: `PUT {{BASE_URL_PROD}}/profile`
- Client: `profileService.updateProfile()` -> `POST /profile/update` (`services/api/config.ts:57`)

Used by `app/edit-profile.tsx:64`, so profile editing cannot work as written. **Ask:**
confirm `PUT /profile` is the contract and we will change the client, or add
`POST /profile/update`.

### 2.3 `POST /auth/signin` is stale in our config

`API_ENDPOINTS.AUTH.SIGN_IN = '/auth/signin'` (`services/api/config.ts:37`) contradicts the
collection's `/auth/login`. Harmless today — the whole `API_ENDPOINTS.AUTH` block is dead
code, nothing imports it — but it should be deleted so nobody wires it up later.
*Client-side cleanup, no backend action needed.*

### 2.4 `POST /account/setup` — the app sends far more than the collection documents

Collection body:

```json
{ "account_type": "promote", "creative_categories": [1, 4, 7] }
```

What the client actually sends (`services/api/onboardingUtils.ts`, `types/accountTypes.ts`),
varying by `account_type` (`discover` | `promote` | `both`):

```json
{
  "account_type": "both",
  "categories": [1, 3],
  "interests": [1, 3],
  "discovery_preference": "near_me | anywhere | specific_city",
  "location": { "city": "Lagos", "country": "Nigeria", "latitude": 6.5, "longitude": 3.3 },
  "creative_categories": [1, 4],
  "offering_type": "services | products | both",
  "brand": { "name": "...", "description": "...", "city": "Lagos", "country": "Nigeria" },
  "instagram_handle": "@handle",
  "website": "https://...",
  "availability": ["appointment", "walk_in", "online", "delivery"],
  "visibility": "public | private",
  "bio": "..."
}
```

**Ask:** does `/account/setup` accept and persist all of these? Specifically `location`
(with lat/lng), `brand`, `availability[]`, `visibility`, `offering_type`,
`discovery_preference`, and the `categories` vs `interests` distinction. If any are silently
dropped, the entire creative-onboarding flow (10+ screens) is collecting data that never
lands anywhere. Please also confirm the accepted enum values match the strings above.

---

## 3. MISSING endpoints — features already built in the app

All of these are wired to real, reachable screens today. The first three are already being
called against production, and are the reason the forgot-password flow cannot work.

### 3.1 Auth

| # | Endpoint the app needs | Body / returns | Called from | Why |
|---|---|---|---|---|
| 1 | `POST /auth/forgot-password` | `{email}` -> `{token, message}` | `services/authService.ts:141` <- `app/(auth)/forgot-password.tsx:24` | Step 1 of password reset. **Already called in prod.** |
| 2 | `POST /auth/reset-password` | `{token, otp, password, password_confirmation}` -> `{message}` | `services/authService.ts:163` <- `app/(auth)/reset-password.tsx:40` | Step 3 of password reset (OTP collected in `reset-verification-code.tsx`). **Already called in prod.** |
| 3 | `POST /auth/resend-code` | `{email}` -> `{message}` | `services/authService.ts:296` <- `app/(auth)/verification-code.tsx` "Resend" (unlocks after a 10-min timer) | Sign-up OTP resend. **Already called in prod.** |
| 4 | `POST /auth/logout` | bearer token -> `{message}` | `app/(tabs)/profile.tsx:62`, `app/account-actions.tsx:64` | Logout is local-only right now; the issued `access_token` is never revoked server-side. |
| 5 | `GET /auth/me` (or confirm `GET /profile` is the equivalent) | bearer token -> current `user` | `app/index.tsx:47` via `authService.restoreSession()` | On cold start we trust the cached token with no validation. If it is expired or revoked, the user is dropped into `(tabs)` and then every request 401s. We need one cheap call to validate. |
| 6 | `POST /auth/refresh` | refresh token -> new `access_token` | declared at `services/api/config.ts:43`, unimplemented | **Ask:** do `access_token`s expire, and what is the TTL? If they do, we need refresh — or long-lived tokens plus a documented 401 contract. |

**Also for §3.1: what is the canonical category list?**

`GET /account/categories` is in the collection and `authService.getCategories()` is
implemented — but **no screen calls it**. Instead `services/api/onboardingUtils.ts:14-29`
*derives* the numeric IDs from the 1-based index of two hardcoded local arrays:

- `types/onboarding.ts` `INTEREST_OPTIONS` -> `Photography, Venues, Fashion, Events, Videography, Food, Hair, Nails, Shoes, Others`
- `types/creativeOnboarding.ts` `CREATIVE_CATEGORIES` -> `Photography, Makeup, Fashion, Events, Videography, Food, Hair, Nails, Shoes, Others`

The two lists disagree at index 2 (`Venues` vs `Makeup`), so the same concept can be sent as
different IDs — and neither is guaranteed to match the backend's category table at all.

**Ask:** please send the authoritative `id` / `name` / `slug` list from
`GET /account/categories`, and confirm whether "interests" (buyer side) and "creative
categories" (seller side) draw from the same table. We will then delete the hardcoded arrays
and fetch at runtime.

### 3.2 Profile / account management

| # | Endpoint the app needs | Body | Called from | Status |
|---|---|---|---|---|
| 7 | `POST /profile/password` | `{current_password, password, password_confirmation}` | `profileService.updatePassword()` <- `app/change-password.tsx:65` | **MISSING** — screen is built and reachable |
| 8 | `POST /profile/deactivate` | `{password?, reason?}` | `profileService.deactivateAccount()` <- `app/account-actions.tsx:56` | **MISSING** — screen is built. Also: what reactivates it? We currently tell the user "sign in again" |
| 9 | `DELETE /profile/delete` | `{password?, reason?}` | `profileService.deleteAccount()` <- `app/account-actions.tsx:59` | **MISSING** — screen is built |
| 10 | `POST /profile/image` (multipart) | `image` file field | `profileService.uploadProfileImage()` <- `app/edit-profile.tsx:90` | **MISSING** — avatar upload is built |
| 11 | `DELETE /profile/image` | — | `profileService.deleteProfileImage()` <- `app/edit-profile.tsx:123` | **MISSING** — "remove photo" is built |
| 12 | `GET /profile/{userId}` | — | `profileService.getUserProfile()` (implemented, not yet wired) | **MISSING** — needed to view another user's / creative's public profile |
| 13 | `GET /account/setup-status` | — | `authService.getSetupStatus()` (implemented, not yet wired) | **MISSING** — needed to resume a half-finished onboarding after reinstall |
| 14 | `GET /account/setup-options` | — | `authService.getSetupOptions()` (implemented, not yet wired) | **MISSING** — would let onboarding options be server-driven instead of hardcoded |
| 15 | `PATCH /account/update` | partial setup payload | `authService.updateAccount()` (implemented, not yet wired) | **MISSING** — needed to edit categories / availability / visibility after onboarding |

### 3.3 Contract questions

- **401 contract.** What does the API return for an expired or invalid bearer token — status,
  `code`, `message`? We want to force a global sign-out on it rather than handling it
  per-screen.
- **Validation errors.** The client currently reads `json.message` for every failure. Laravel
  normally returns `{message, errors: {field: [...]}}` on 422 — please confirm, so we can map
  errors onto the right form field instead of showing one generic alert.
- **OTP rules.** Confirm 4 digits, and the expiry window. `verification-code.tsx` shows a
  10-minute countdown and only then allows resend — is that the real TTL, and is there a
  resend rate limit we should respect?
- **`token` lifetime in the sign-up chain.** Is the `token` from `send-code` still valid for
  `complete` after `verify-code`, or does `verify-code` issue a fresh one? The client accepts
  either (`json.token ?? previous`), but a definitive answer lets us drop the fallback.
- **Username uniqueness.** `create-account.tsx` only validates locally (non-empty). Is
  `username` unique server-side, and is there a check-availability endpoint? A pre-flight
  check would avoid failing the user at the very last step of sign-up.

---

## 4. Client-side bugs found during this audit (our side, no backend action)

1. **Logout does not clear the session.** `app/(tabs)/profile.tsx:62` dispatches only the
   Redux `signOut()` action; it never calls `authService.signOut()`. AsyncStorage
   `@wami_user` / `@wami_token` survive and `apiClient` keeps its bearer token, so the next
   cold start hits `restoreSession()` in `app/index.tsx:47` and **silently signs the user
   back in**. `app/account-actions.tsx:64` has the same pattern.
2. **Auth bypasses `apiClient`.** Every `authService` auth call is a raw `fetch` against the
   hardcoded `PROD_BASE`, so it gets no `TIMEOUT_MS` abort, no shared error transform, and
   ignores `API_CONFIG.USE_MOCK` — flipping mock mode on will not mock login or sign-up.
3. **Dead mock auth.** `authService.signUp()` and `verifyEmailCode()` are leftovers backed by
   an in-memory `mockUsers` map, and `verifyEmailCode` accepts any **6**-digit code while the
   real flow is 4 digits. Both are unused and should be deleted.
4. **No global 401 handling.** `client.ts` `handleHttpError()` does not special-case 401.
5. `API_ENDPOINTS.AUTH` is entirely unreferenced (see §2.3).

---

## 5. Summary of the ask

**Confirm:** the `/api` vs `/api/v1` prefix per route group (§2.1) · `PUT /profile` (§2.2) ·
the full `/account/setup` payload (§2.4) · the canonical category ID list (§3.1) · the
401 / 422 / OTP / token-lifetime contracts (§3.3).

**Build — blocking features already shipped in the app:** `/auth/forgot-password`,
`/auth/reset-password`, `/auth/resend-code`, `/auth/logout`, `/auth/me`,
`/profile/password`, `/profile/deactivate`, `/profile/delete`, `/profile/image`
(POST + DELETE).

**Build — features implemented client-side and ready to wire up:** `/profile/{userId}`,
`/account/setup-status`, `/account/setup-options`, `PATCH /account/update`, and
`/auth/refresh` if tokens expire.
