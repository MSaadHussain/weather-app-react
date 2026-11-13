# WeatherBoard

A calm, installable weather dashboard. Search any city, see current conditions and a 5-day forecast, pin up to five favourites, get a daily morning reminder, and keep using the last city offline.

**Live URL:** _add after deploying_ → `https://<your-app>.vercel.app`
**Repository:** _add after pushing_ → `https://github.com/<you>/weatherboard`

Built for the Edspire Frontend (React) technical challenge. The original brief is in [CHALLENGE.md](CHALLENGE.md), and the agent prompt history is in [PROMPTS.md](PROMPTS.md).

---

## Features

| Requirement | Implementation |
|---|---|
| City search with autocomplete | GeoDB Cities (RapidAPI) combobox: 250 ms debounce, request cancellation, result cache, keyboard navigation (↑ ↓ Enter Esc), loading / no-results / error states. Falls back to Open-Meteo Geocoding if the key is missing or GeoDB rate-limits. |
| Weather data | Current temperature, feels-like, high/low, humidity, wind (speed + direction), visibility, pressure, sunrise/sunset, condition icon, and a 5-day forecast with a precipitation chance. All data is real. |
| Provider fallback | OpenWeatherMap first, Open-Meteo automatically if OWM has no key, rate-limits (429), rejects the key, times out or is unreachable. Both are normalised to one internal shape. |
| Form validation | Inline errors on blur and on submit: empty field, too short, invalid characters, no matching city, network/API failure. Every message says what failed and what to do. Reminder time is validated too. |
| Favourite cities | Up to 5, stored in localStorage, quick-access sidebar (desktop) and chip strip (mobile), confirmation dialog before removal, graceful in-memory fallback plus a visible notice if storage is blocked, corrupted data discarded safely. |
| PWA | Web manifest (name, 192/512 + maskable icons, `theme_color`, `display: standalone`) and a hand-written service worker that precaches the app shell and caches the last viewed city's weather. An offline banner appears, and saved data is clearly labelled as possibly out of date. |
| Daily reminder | User-chosen time, an in-app explanation **before** the browser permission prompt, granted / denied / unsupported states, and a test notification. See [Reminders: what really happens](#reminders-what-really-happens). |
| Responsive | Verified at 375 / 768 / 1280 px with no horizontal scroll; all interactive targets are ≥ 44 × 44 px on mobile. |
| Bonus | **Realtime day/night theme** (see below), light / dark / system themes, °C / °F toggle (persisted, instant, no refetch), animated condition icons (CSS, reduced-motion aware), skeleton loading, designed empty states. |
| Extras | Next-24-hours strip with temperature curve, recent searches in the search field, a data-freshness status pill (Live / Updating / Saved / Update failed), and a mobile-style settings sheet (Appearance, Units, Daily reminder). |

### Realtime day/night theme

The default theme, **Auto**, follows the sun at the city you're viewing. It's light between that city's sunrise and sunset and dark otherwise, re-evaluated every minute, so the interface cross-fades to dark at sunset while you watch. Switching to a city where it's night (Tokyo, viewed from Karachi in the afternoon) flips it immediately. The hero card's sky and icons also follow the real sunrise/sunset rather than the moment the data was fetched. Before any city loads, Auto falls back to the OS preference, and the last resolved theme is painted before React mounts to avoid a flash. **System**, **Light** and **Dark** are available from the header menu and the settings sheet.

## Tech stack

- **React 18 + Vite 6** (JavaScript), with no router (it is one screen)
- **Tailwind CSS 4** with semantic colour tokens (`bg-surface`, `text-muted`…) that flip for dark mode in one place
- **lucide-react** icons
- Native `fetch`, `localStorage`, Cache Storage, Service Worker, Notifications and Periodic Background Sync APIs
- No state library: hooks and one small context are enough at this size

## Getting started

```bash
npm install
cp .env.example .env      # then fill in the keys (optional, see below)
npm run dev               # http://localhost:5173 (service worker disabled in dev)
npm run build && npm run preview   # production build with service worker, http://localhost:4173
```

Requires Node 18+.

### Environment variables

| Variable | Required? | Where to get it |
|---|---|---|
| `VITE_OPENWEATHER_API_KEY` | Optional* | [openweathermap.org → API keys](https://home.openweathermap.org/api_keys) (free; new keys can take ~1 h to activate) |
| `VITE_RAPIDAPI_KEY` | Optional* | [GeoDB Cities on RapidAPI](https://rapidapi.com/wirefreethought/api/geodb-cities) → subscribe to the free BASIC plan |
| `VITE_RAPIDAPI_HOST` | No | Defaults to `wft-geo-db.p.rapidapi.com` |

\* The app works with **no keys at all** thanks to the keyless Open-Meteo fallbacks. The *Data sources* card in the sidebar shows which provider is actually serving data, which makes a missing or exhausted key obvious.

> **About secrets:** this is a client-only app, so anything prefixed `VITE_` ships in the JavaScript bundle and is visible to anyone. Never commit `.env` (it is git-ignored). Only use free-tier keys, and restrict them where the provider allows (RapidAPI lets you limit by domain). Truly hiding a key requires a proxy/serverless function, which is out of scope.

## Architecture

```
src/
  pages/Dashboard.jsx          composition root: wires hooks → components
  components/
    Header/  Search/  WeatherCard/  Forecast/  WeatherDetails/
    FavouriteCities/  NotificationSettings/  OfflineBanner/
    Loading/  Error/  EmptyState/  Sidebar/  common/ (Dialog, ConfirmDialog, Toaster, WeatherIcon)
  hooks/
    useWeather.js        load + refresh + snapshot fallback + auto-refresh on reconnect
    useCitySearch.js     debounced, cancellable autocomplete
    useFavourites.js     max-5 list with validation
    useReminder.js       reminder state machine (permission, scheduling, SW sync)
    useLocalStorage.js   persisted state, cross-tab sync
    useGeolocation.js  useOnlineStatus.js  useNow.js
  services/
    weatherService.js    OWM → Open-Meteo fallback, normalisation, in-flight dedupe, 5-min memory cache
    geoDBService.js      GeoDB → Open-Meteo geocoding fallback, reverse geocoding
    notificationService.js  permission, showNotification, periodic sync, shared state with SW
    storage.js           safe localStorage wrapper (memory fallback, corruption guard)
    http.js              fetch wrapper → typed ApiError { kind: network | timeout | rate-limit | auth | … }
  utils/                 unit formatting, date/timezone helpers, validation, error copy
  context/PreferencesContext.jsx   theme + unit
public/
  service-worker.js  manifest.webmanifest  icons/
scripts/generate-icons.mjs   dependency-free PNG icon generator
```

### Key decisions

1. **Normalise at the edge.** Each provider's response is converted once in `weatherService.js` into a single internal shape (metric units, unix times, a city UTC offset, an internal condition vocabulary). Components never know which API answered, and adding a third provider is one function.
2. **Store metric, format at render.** Switching °C/°F only re-renders; it never refetches. Wind and visibility switch to mph/mi too.
3. **City time, not viewer time.** "Today", sunrise and local time use the city's UTC offset, so Tokyo's forecast is correct when viewed from Karachi.
4. **Typed errors → specific copy.** `http.js` classifies every failure (`network`, `timeout`, `rate-limit`, `auth`, `not-found`, `server`), and `errorMessages.js` maps each one to "what failed + what to do". There is no generic "Something went wrong" anywhere.
5. **No duplicate requests.** Identical concurrent weather requests share one promise; results are memoised for 5 minutes; autocomplete aborts stale requests and caches queries; a request-id guard drops out-of-order responses.
6. **Validation timing (Stripe-style).** A pristine field isn't nagged on blur; once the user has typed, blur validates; once an error shows, it re-validates on each keystroke so it clears as soon as the input is fixed.
7. **Hand-written service worker** instead of a plugin, so every caching strategy is explicit and explainable. A 30-line Vite plugin (`vite.config.js`) injects the hashed build file list for precaching.
8. **Design system pass.** Guided by the ui-ux-pro-max design-intelligence skill: one secondary-card radius, a single section-title size, a minimum 12 px text size, 150 ms colour/press transitions, `cursor: pointer` restored on controls, global styles placed in `@layer base` so utilities can override them, and safe-area padding on the sticky header and bottom sheet.
9. **Accessibility.** WAI-ARIA combobox, focus-trapped dialogs that restore focus, `aria-live` toasts and status, a skip link, visible focus rings, reduced-motion support, and screen-reader text for the forecast bars.

## PWA implementation

| Resource | Strategy |
|---|---|
| App shell (HTML, hashed JS/CSS, icons, manifest) | Precached on install; cache-first |
| Page navigations | Network-first, falling back to the cached shell |
| Weather APIs (OWM, Open-Meteo) | Network-first; successful responses are cached **for the last viewed location only**; offline responses are tagged `X-WB-Cached-At` |
| City search | Network-only (stale suggestions are worse than none) |
| Google Fonts | Stale-while-revalidate |

When offline the app shows a banner and labels the weather "Saved data from N h ago, which may be out of date". It never presents cached data as live. A second layer, a normalised snapshot in localStorage, means the last city still renders where service workers are unavailable. When the connection returns, data refreshes automatically.

The service worker registers only in production builds (`npm run build && npm run preview`, or the deployed site). In dev it would cache Vite's modules and break hot reload.

## Reminders: what really happens

The brief asks for a reminder that "fires even when the tab is closed". Honestly:

- A **client-only** web app **cannot** schedule a notification for an exact time while every window is closed. `setTimeout` dies with the page, and the Notification Triggers API (`showTrigger`) never shipped in a stable browser.
- Exact closed-browser delivery requires **Web Push from a server** (VAPID keys + a scheduler/cron that sends a push at each user's chosen time). The brief scopes the project as "client-side only, no backend", so this is not implemented.

What WeatherBoard does instead, from most to least reliable:

1. **App open (any tab, even in the background, or the installed window):** a scheduler checks every 30 s and fires on time through the service worker's `showNotification()`. A per-day "last fired" marker shared with the service worker prevents duplicates across tabs.
2. **App closed, Chrome/Edge, installed PWA:** **Periodic Background Sync** wakes the service worker even when the app is closed. If the reminder is due (within a 3-hour catch-up window), it fetches a fresh one-line forecast from Open-Meteo and shows the notification. The browser decides how often this runs (based on site engagement), so delivery is best-effort and may be late.
3. **Other browsers (Firefox, Safari):** reminders work while the app is open. The settings sheet says exactly which of these modes is active for the current browser.

The service worker already contains a `push` handler, so adding a small serverless function plus a push subscription later would enable exact delivery without changing the UI.

## Known limitations

- Exact-time reminders with the app fully closed need a push server (see above). Periodic Background Sync is Chromium-only, needs the app to be installed, and its timing is controlled by the browser.
- API keys are visible in the client bundle (inherent to "no backend"). Use free, restricted keys.
- GeoDB's free tier allows 1 request/second; fast typing can hit it. The app then switches to Open-Meteo geocoding for that query instead of failing.
- OpenWeatherMap's free forecast comes in 3-hour slots, so daily highs and lows are derived from those slots and can differ slightly from Open-Meteo's daily values.
- Offline mode covers the last viewed city only (by design, per the brief). Favourites other than the last viewed city need a connection.
- Notifications on iOS require iOS 16.4+ and the app added to the Home Screen.

## Deployment

### Vercel (recommended)
1. Push to GitHub, then *Add New → Project* in Vercel and import the repo (Vite is auto-detected; `vercel.json` is included).
2. Add `VITE_OPENWEATHER_API_KEY` and `VITE_RAPIDAPI_KEY` under *Settings → Environment Variables* (Production + Preview).
3. Deploy. Vercel serves HTTPS, which service workers and notifications require. `vercel.json` disables caching for `service-worker.js` so updates roll out immediately.

### Netlify
`netlify.toml` is included: import the repo, add the same environment variables, and deploy.

No SPA rewrite rules are needed because the app has a single route.

## Manual test checklist

Verified in Chromium against the production build (`vite preview`):

- [x] Autocomplete appears after a pause; ↑/↓/Enter/Esc work; no-results and invalid-input messages appear inline
- [x] Selecting a city loads real weather (Open-Meteo fallback verified live; OWM normaliser verified against documented response shapes)
- [x] °C ↔ °F switches temperature, wind and visibility instantly, and persists across reload
- [x] Favourite add persists across reload; remove asks for confirmation (Cancel focused by default)
- [x] Service worker controls the page; shell precached; only the last city's weather cached
- [x] App shell loads with the server stopped; offline banner shown when connectivity drops
- [x] Reminder sheet: denied state guidance and the pre-permission explanation
- [x] 375 / 768 / 1280 px: no horizontal scroll; all touch targets ≥ 44 px at 375 px
- [x] No console errors

Worth re-checking on a real device after deploying: installing the app, the granted-permission path and test notification, and airplane-mode behaviour (DevTools → Network → Offline).

## Credits

Weather data: [OpenWeatherMap](https://openweathermap.org) and [Open-Meteo](https://open-meteo.com) (CC BY 4.0). City search: [GeoDB Cities](http://geodb-cities-api.wirefreethought.com/). Reverse geocoding: [BigDataCloud](https://www.bigdatacloud.com/) free client API. Icons: [Lucide](https://lucide.dev).
