# Prompt history

**Agentic IDE / agent used:** Claude Code (Claude desktop app, Code tab), model Claude Opus 5.5

This is the complete prompt history, in order, as it was sent. Add any later prompts at the end, with the same numbering.

---

## Prompt 1: Understand the brief

> Attached: `Edspire-Frontend-Technical-Challenge.pdf` and a screenshot of the invitation email.
>
> Understand the PDF and make a MD file of this

**Result:** [CHALLENGE.md](CHALLENGE.md), a structured Markdown version of the brief with a requirements checklist. The agent also flagged three risks up front:
1. The brief asks for Cursor, Antigravity or OpenCode specifically.
2. "Fires even when the tab is closed" isn't achievable for a client-only app without a push server.
3. The deadline.

---

## Prompt 2: Master implementation prompt

The full prompt as sent:

<details>
<summary>Show full prompt (≈ 1,900 words)</summary>

```text
ROLE & OBJECTIVE
Act as a Senior Frontend Engineer, UI/UX Designer, and PWA Specialist.
Build a complete, production-quality weather dashboard called WeatherBoard using React. This application is being developed as part of a professional frontend developer technical assessment.
Do not create a basic tutorial project. Build a polished consumer-facing product with excellent UI/UX, real API integrations, robust error handling, responsive layouts, and working PWA functionality.
Work autonomously, make sensible engineering decisions, implement features completely, and verify the application before considering the task finished.
1. TECHNOLOGY STACK
Use:

* React with Vite
* JavaScript (or TypeScript if appropriate)
* Tailwind CSS
* Lucide React icons
* React Router only if genuinely necessary
* Native Fetch API for REST requests
* LocalStorage for persistent preferences and favourites
* Service Workers for offline functionality
* Web App Manifest for PWA installation
* Web Notifications API for reminders

Keep the architecture modular, maintainable, and easy to understand.
2. DESIGN DIRECTION
Create a premium, modern weather dashboard inspired by the design quality of:

* Linear: typography, spacing, and minimalism.
* Vercel Dashboard: information hierarchy and status indicators.
* Stripe: polished interactions and error states.
* Mercury: dashboard cards and calm visual design.
* Modern weather applications: visually appealing weather cards and forecasts.

Important: Take inspiration from these products, but do not copy their interfaces.
Visual requirements:

* Premium SaaS dashboard aesthetic.
* Clean, modern typography.
* Beautiful weather visualization.
* Carefully balanced spacing and alignment.
* Smooth transitions and subtle animations.
* Rounded cards with consistent design language.
* Responsive sidebar/navigation.
* Clear visual hierarchy.
* Excellent loading, empty, offline, and error states.

Use a sophisticated weather-inspired color palette.
Suggested direction:

* Background: #F5F7FA
* Primary: #172554
* Accent: #3B82F6
* Cards: #FFFFFF
* Text: #111827
* Muted text: #64748B

Support both light and dark modes if time permits.
Avoid generic AI-generated dashboard designs.
3. APPLICATION LAYOUT
Create the following main sections:
Header

* WeatherBoard logo and application name.
* City search with autocomplete.
* Current date and time.
* Temperature unit selector (°C / °F).
* Dark/light theme toggle.
* Notification settings access.

Main Weather Overview
Display:

* Selected city and country.
* Current temperature.
* Weather condition.
* Weather condition icon.
* Feels-like temperature.
* Today's high and low.
* Humidity.
* Wind speed.
* Visibility.
* Atmospheric pressure.

Make the main weather card visually prominent.
Five-Day Forecast
Display five forecast days with:

* Day name and date.
* Weather icon.
* Weather description.
* Minimum temperature.
* Maximum temperature.

Use a clean horizontal layout on desktop and responsive cards on mobile.
Weather Details
Create individual cards for:

* Humidity.
* Wind speed.
* Pressure.
* Visibility.
* Sunrise and sunset, when available from the API.

Favourite Cities

* Display saved cities.
* Allow users to quickly switch between them.
* Support a maximum of five favourites.
* Provide an add/remove interaction.
* Ask for confirmation before removing a favourite.

Notification Settings

* Enable/disable daily reminders.
* Allow users to choose their preferred reminder time.
* Explain notification permissions before requesting them.
* Show permission status.
* Provide graceful fallbacks for unsupported browsers.

4. API INTEGRATIONS
Use real data. Never hardcode weather information or use mock weather responses in the finished application.
OpenWeatherMap
API:
https://api.openweathermap.org/data/2.5/weather
Use it for:

* Current temperature.
* Weather conditions.
* Humidity.
* Wind speed.
* Pressure.
* Feels-like temperature.
* Weather icons.

Use the appropriate 5-day forecast endpoint:
https://api.openweathermap.org/data/2.5/forecast
Store API keys in environment variables.
Example:
VITE_OPENWEATHER_API_KEY=
Never expose actual secret credentials in source code or commit them to GitHub.
Open-Meteo
API:
https://api.open-meteo.com/v1/forecast
Implement Open-Meteo as a fallback weather provider if OpenWeatherMap fails or is rate-limited.
Normalize responses from both providers into a consistent internal weather data structure.
GeoDB Cities API
Use GeoDB Cities through RapidAPI for live city autocomplete.
Requirements:

* Search while typing.
* Debounce requests.
* Show suggestions within approximately 300ms after the user stops typing, subject to API/network response time.
* Display city, region, and country.
* Handle empty results.
* Handle API failures.
* Support keyboard navigation.
* Allow selection from the suggestion list.

Store RapidAPI credentials in environment variables.
5. VALIDATION & ERROR HANDLING
Implement proper client-side validation.
Handle:

* Empty city search.
* Invalid city.
* No autocomplete results.
* API errors.
* API rate limits.
* Network failures.
* Loading states.
* Missing API credentials.
* Unsupported browser features.

Validate search input on blur as well as submission.
Every asynchronous request must have:

* Loading state.
* Success state.
* Error state.
* User-friendly feedback.

Never display vague messages such as "Something went wrong."
Tell users what happened and what action they can take.
Prevent unnecessary duplicate API requests.
6. FAVOURITE CITIES
Implement favourite cities using LocalStorage.
Requirements:

* Maximum five cities.
* Save city name, country, and coordinates.
* Persist across browser sessions.
* Quick switching between saved cities.
* Remove confirmation.
* Gracefully handle unavailable or corrupted LocalStorage.

7. PROGRESSIVE WEB APP
Implement a genuine installable PWA.
Requirements:

1. Valid manifest.json.
2. Application name: WeatherBoard.
3. 192x192 application icon.
4. 512x512 application icon.
5. Theme color.
6. Display mode: standalone.
7. Service worker registration.
8. Cache application shell assets.
9. Cache the last viewed city's weather.
10. Offline fallback.
11. Display an offline-mode banner when the device loses connectivity.

When offline, show the last successfully cached weather data and clearly indicate that it may be outdated.
Do not pretend that uncached weather information is live.
8. PUSH NOTIFICATIONS
Implement a daily morning weather reminder using browser notification capabilities and service workers.
Requirements:

* Explain the purpose before requesting notification permission.
* Request permission only after an explicit user action.
* Allow users to select their preferred reminder time.
* Persist notification preferences.
* Handle granted, denied, and unsupported permission states.
* Ensure notification failures do not affect other application features.

Important technical consideration:
A browser-only application cannot reliably schedule arbitrary daily notifications while completely closed using only setTimeout or the standard Notifications API.
Do not falsely claim that reminders will work when the tab is closed.
Investigate the actual browser capabilities and implement the most reliable supported approach. If true scheduled background delivery requires a Web Push server, document that limitation clearly rather than pretending it has been implemented.
9. RESPONSIVE DESIGN
The application must work at:

* 375px mobile.
* 768px tablet.
* 1280px desktop.

Requirements:

* No horizontal scrolling.
* Mobile-friendly navigation.
* Responsive forecast layout.
* Cards rearrange appropriately.
* Minimum 44x44px touch targets on mobile.
* Readable typography.
* Proper spacing across breakpoints.

Test all three viewport sizes.
10. OPTIONAL ENHANCEMENTS
Implement these after the core requirements are complete:

* Dark/light theme with system preference detection.
* Celsius/Fahrenheit toggle.
* Persist user preferences.
* Animated weather icons.
* Smooth card transitions.
* Beautiful empty states.
* Subtle skeleton loading animations.

11. PROJECT ARCHITECTURE
Use a clean folder structure.
Suggested architecture:
src/
components/
Header/
Search/
WeatherCard/
Forecast/
WeatherDetails/
FavouriteCities/
NotificationSettings/
OfflineBanner/
Loading/
Error/
pages/
Dashboard.jsx
hooks/
useWeather.js
useGeolocation.js
useLocalStorage.js
services/
weatherService.js
geoDBService.js
utils/
weatherHelpers.js
dateHelpers.js
validation.js
context/
ThemeContext.jsx
styles/
App.jsx
main.jsx
public/
icons/
manifest.json
service-worker.js
Adjust the architecture if necessary, but maintain separation between UI, API services, state management, and utilities.
12. QUALITY ASSURANCE
Before completing the project:

* Run the application.
* Fix all compilation errors.
* Check browser console errors.
* Verify all API integrations.
* Test city autocomplete.
* Test weather fetching.
* Test five-day forecast.
* Test favourite city persistence.
* Test removal confirmation.
* Test offline behavior.
* Test PWA installation.
* Test notification permission states.
* Test Celsius/Fahrenheit conversion.
* Test responsive layouts at all required widths.
* Check for broken images and icons.
* Check accessibility and keyboard navigation.

Do not leave non-functional buttons or placeholder sections.
13. DOCUMENTATION
Generate:
README.md
Include:

* Project overview.
* Technologies used.
* Installation instructions.
* Environment variable configuration.
* API setup.
* Architecture decisions.
* PWA implementation.
* Known limitations.
* Deployment instructions.
* Live application URL.

PROMPTS.md
Maintain a complete chronological record of the prompts used with the AI agent.
Include:

* Initial master prompt.
* Follow-up implementation prompts.
* Debugging prompts.
* UI refinement prompts.
* Final testing prompts.
* Agentic IDE name.

Do not fabricate prompt history. Record the actual prompts used throughout development.
14. DEPLOYMENT
Prepare the project for deployment on Vercel or Netlify.
Ensure:

* Production build succeeds.
* Environment variables are configured.
* SPA routing works if applicable.
* HTTPS is used.
* Service worker works in production.
* PWA manifest and icons are accessible.

15. WORKING INSTRUCTIONS
Follow this implementation sequence:
Phase 1: Analyze requirements and create the project architecture.
Phase 2: Build the complete UI with responsive layouts.
Phase 3: Integrate GeoDB city search.
Phase 4: Integrate OpenWeatherMap and Open-Meteo fallback.
Phase 5: Implement favourite cities and persistent settings.
Phase 6: Implement PWA and offline caching.
Phase 7: Implement notification settings and the most reliable supported reminder functionality.
Phase 8: Implement optional enhancements.
Phase 9: Perform comprehensive testing and fix issues.
Phase 10: Generate documentation and prepare deployment.
IMPORTANT:

* Do not stop after generating the initial UI.
* Do not leave important requirements as TODO comments.
* Do not use fake API responses in the final product.
* Do not sacrifice functionality for visual appearance.
* Do not implement technically impossible functionality while claiming it works.
* Make decisions independently where requirements are clear.
* Ask questions only when an essential credential or decision is missing.
* Keep the code clean and understandable so I can explain every major implementation decision during my technical interview.

Start by inspecting the existing project directory. If no project exists, initialize it. Then implement the application phase by phase.
```

</details>

### Prompting strategy behind it

- **Front-load constraints that AI usually gets wrong:** no mock data, no fake "works when closed" claims, no vague error copy, no TODOs.
- **Name the hard part explicitly** (closed-tab notifications) and ask the agent to investigate real browser capabilities rather than guess.
- **Phased plan + a QA checklist**, so the agent verifies its work in a real browser instead of stopping at "it compiles".
- **Explainability as a requirement**, because every decision has to be defended in the interview.

### What the agent built, and what had to be corrected

The agent scaffolded the project, implemented all phases, then ran the production build in a browser and fixed what it found. Problems found and fixed in this session (useful for the interview walkthrough):

| # | Problem found | Fix |
|---|---|---|
| 1 | Shell heredoc corrupted a regex in `vite.config.js` (`/\\/g` → `/\/g`), breaking the build | Replaced with `split(path.sep).join('/')`; switched to writing files directly |
| 2 | Tailwind CSS 4.0.0 crashed on build ("Cannot convert undefined or null to object") | Upgraded to the stable 4.1.17 |
| 3 | `Dialog` re-ran its focus effect on every parent render (unstable `onClose` prop), so focus could jump | Stored `onClose` in a ref |
| 4 | Clicking the favourite star scrolled the hero card's content sideways (decorative glow overflowed an `overflow-hidden` box, and focus scrolled it) | Switched to `overflow-clip`, which can't be scrolled |
| 5 | Country flag emoji render as letters ("GB") on Windows | Replaced with a styled country-code badge |
| 6 | Touch-target audit at 375 px found the °C/°F buttons (34 px), in-field search buttons (36 px) and input (42 px) under 44 px | Resized all to ≥ 44 px; re-ran the audit with zero failures |
| 7 | At 375 px the header controls wrapped onto their own row | Wordmark becomes screen-reader-only below 400 px; tighter gaps |
| 8 | Forecast range bars were cramped in the 5-column tablet layout | The bar wraps to its own line in card mode, high shown before low |
| 9 | Inner search input showed a second focus outline inside the field's focus ring | Suppressed the inner outline |

Verification performed by the agent: production build; autocomplete; keyboard selection; real weather; °C/°F; favourite persistence and confirm dialog; validation on blur and submit; service worker and cache inspection; app shell loading with the server stopped; offline banner; reminder denied and pre-permission states; 375/768/1280 layouts with scroll-width and touch-target checks; console errors; and the OpenWeatherMap normaliser against documented response shapes (no OWM key was available).

---

## Prompt 3: Commit history

> Update git with proper commit messages

**Result:** the work was committed as nine Conventional Commits in dependency order (scaffold → utils → API services → hooks → PWA → reminders → UI → docs).

---

## Prompt 4: UI/UX refinement pass

> then
> use /ui-ux-pro-max
>
> To update
>
> Clean layout, excellent empty states, tight typography hierarchy.
> Status indicators, subtle motion, information density done right.
> Error-handling UX, inline form validation patterns.
> Dashboard cards, data hierarchy, calm and confident colour palette.
> "weather dashboard" Modern visual patterns for weather cards and forecast layouts.
>  Real mobile-app patterns: search, notifications, settings flows.
> +
> Realtime Day / Night setting with theme

**How the agent used the skill:** it generated a design system for "weather dashboard, calm, data-dense, day/night" (data-dense dashboard style, sky + sun-amber palette, subtle motion) and queried the UX guideline database for inline validation, empty states, loading/status feedback, mobile settings and dark-mode contrast. It then applied the parts that fit the existing brand rather than replacing it. Inter and the navy palette from the brief were kept; the suggested Fira fonts were not adopted.

**Changes:**
- **Realtime day/night "Auto" theme:** light/dark follows the selected city's sunrise/sunset, checked every minute, with a cross-fade on switch. The hero sky and icons also follow the real sun. A header theme menu (Auto/System/Light/Dark) explains when the next switch happens.
- **Next 24 hours strip:** 3-hour steps with a temperature curve, normalised from both providers.
- **Status pill:** Live / Updating / Saved / Update failed, next to the date.
- **Search:** recent cities shown when the field is focused and empty; matched prefix in bold; errors announced with `role="alert"`.
- **Settings sheet:** Appearance, Units and Daily reminder sections; drag-handle bottom sheet on mobile; safe-area padding.
- **Visual system:** consistent card radius and section titles, 12 px minimum text, 150 ms transitions, press feedback, pointer cursor on controls.

**Problems found during verification and fixed:**

| # | Problem | Fix |
|---|---|---|
| 1 | At 375 px the page was 548 px wide. The hourly strip's `sr-only` labels are `position: absolute`; with no positioned ancestor inside the scroller they escaped its clipping. On mobile the browser widened the layout viewport, which masked the overflow in the first measurement. | Made the scroller `relative`; re-measured clientWidth = scrollWidth = 375. |
| 2 | Global `:focus-visible` and interaction rules were unlayered, so they beat Tailwind utilities (the search input still drew a second focus outline). | Moved them into `@layer base`. |

---

<!-- Add follow-up prompts below, in order: debugging, UI refinement, final testing, deployment. -->
