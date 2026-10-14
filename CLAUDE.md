# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Wami — an Expo/React Native marketplace app connecting "creatives" (service/product sellers) with buyers. Booking + escrow payments, product orders/delivery, chat, wallet, and creative onboarding are the core domains.

## Commands

```bash
npm start          # expo start — Metro bundler, scan QR with Expo Go or press i/a/w
npm run ios        # expo start --ios (requires macOS + Xcode simulator)
npm run android    # expo start --android (requires Android emulator/device)
npm run web        # expo start --web

npx tsc --noEmit   # type-check the whole project (no lint or test script is configured)

npm run build      # eas build -p android --profile preview
npm run build:dev  # eas build --platform android --profile development
```

There is no automated test suite (no Jest config, no `test` script) and no ESLint config. Verification is: `npx tsc --noEmit`, then manually exercising the app via `expo start`. When agent-driven testing is needed, run the app with `expo start` and use the `/run` skill or a connected simulator — there's no headless test harness to fall back on.

## Architecture

### Routing (expo-router, file-based)

`app/` maps directly to routes. Route groups: `(auth)` (onboarding/sign-in flow) and `(tabs)` (the 5-tab bottom nav: Home, Shop/`discover`, Post/`sell`, Chats/`messages`, Profile). A file existing under `app/` is automatically navigable — you only need to add a `<Stack.Screen name="...">` entry in `app/_layout.tsx` when a route needs non-default options (`headerShown: false`, `presentation: 'modal'`, `gestureEnabled: false`), which is nearly every screen in this app.

`experiments.typedRoutes` is on (`app.json`), so `.expo/types/router.d.ts` is generated from the file tree and `router.push()` calls are type-checked against it. That generated file sometimes fails to produce a template-literal type for routes nested more than one dynamic segment deep (e.g. `delivery/arrange/[orderId]`) — the existing convention when that happens is to cast the call with `as any` (see many `router.push(...)` call sites) rather than switching to the verbose `{ pathname, params }` object form everywhere.

The center "Post" tab doesn't navigate to its own screen — `app/(tabs)/_layout.tsx` intercepts its `tabPress` and shows a modal (Add a Service / List a Product / Share a Post) instead.

### State (Redux Toolkit)

`store/store.ts` composes one slice per domain: `auth`, `payment` (bookings, escrow payments, product orders, chat conversations/messages all live here), `wallet`, `creativeOnboarding`, `favorites`, `bookings`, `loyalty`, `creativeMatch`, `location`, `onboarding`. `types/payment.ts` is the central domain model for bookings/escrow/orders — `ProductOrder.orderStatus` and `Booking.status` drive most of the order-tracking/service-tracking UI state machines.

### API layer

`services/api/client.ts` is the single HTTP client; it talks to `API_CONFIG.BASE_URL` (`https://api.joinwami.com/api/v1`, set in `services/api/config.ts`). There is no mock mode — the old `USE_MOCK` switch and its fixtures (`data/mock*.ts`, `services/api/mock/`) were removed once every endpoint was wired, so UI work needs the real backend (or a test account on it). Individual services live in `services/api/*Service.ts` (products, bookings, discovery, wallet/seller, chat, offerings, reviews, profile, quotes), imported directly by path.

Two things bite repeatedly:
- **List shapes vary by endpoint** — a bare array, `{ items }`, or Laravel's paginator `{ data: [...] }`. Always read lists through `utils/extractList.ts`.
- **Unsupported flows are gated, not simulated**: `constants/Payments.ts` (`PAYMENTS_ENABLED`) and `constants/Features.ts` (`INSTAGRAM_IMPORT_ENABLED`, `DELIVERY_ENABLED`). The simulated `services/instagramService.ts` and `services/deliveryService.ts` stay only behind those switches until real endpoints exist.

`services/api/discoveryService.ts` treats creatives, products, and services as one generic "offering" shape (`DiscoveryOffering`) for feed/search/save endpoints — UI code maps defensively over loosely-typed fields (`name || title`, `media_url || thumbnail_url || image`) rather than assuming a strict shape.

### Styling

Plain `StyleSheet.create` throughout — no Tailwind/NativeWind. There's no centralized theme provider beyond `constants/Colors.ts` (`Colors.light.primary` = `#00BCD4`, used for the primary accent in both light and dark mode) and `constants/Brand.ts`. Every screen instead reads `useColorScheme()` locally and builds its own small `tc`/`themeColors` object of hex values for that screen's dark/light variants — follow that per-screen pattern rather than introducing a new theming mechanism.

Controls follow one size: **primary buttons 48px tall with a 12px radius** (about 13px vertical padding), **small secondary buttons a 10px radius** (about 9px vertical padding), and **text fields 46px tall with a 10px radius and 15px text**. `components/FloatingLabelInput.tsx` is the standard field. Chips, tags and filter pills stay fully rounded, and circular icon buttons stay circles. Match these rather than adding new radii.

Path alias `@/*` maps to the project root (`tsconfig.json`).
