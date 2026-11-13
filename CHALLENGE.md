# WeatherBoard — Edspire Frontend (React) Technical Challenge

> A personal weather dashboard, built with an Agentic IDE and powered by public APIs.

| | |
|---|---|
| **Role** | Frontend (React) Developer, Edspire |
| **Deadline** | **Saturday, 14 Nov 2026, 11:00 AM PKT** |
| **Time estimate** | 4–6 hours of focused work |
| **Deliverables** | Live URL + public GitHub repo |
| **Submit to** | jobs@edspire.app |

---

## 1. Overview: What You're Building

**WeatherBoard** is a responsive, installable weather dashboard. Users can:

- Search for any city
- View current conditions and a **5-day forecast**
- Save **favourite cities**
- Receive a **daily push notification** each morning reminding them to check the weather

The app must **work offline for the last viewed city** and feel like a **polished consumer product**, not a tutorial project.

### Tooling requirement
Use an **Agentic IDE** (**Cursor**, **Antigravity** or **OpenCode**) as your primary development tool. The AI agent is expected to do much of the scaffolding. Edspire is evaluating:

- Your judgment in **prompting** the agent
- Your ability to **fix what it gets wrong**
- The quality of **your decisions** where the AI gives generic output

### Scope
- Single-page web app
- Client-side only, with no backend to write
- Public / free-tier REST APIs only
- Deployed as a PWA

### Time guidance
- 4–6 hours of focused work
- Quality over quantity
- One feature done well beats five done poorly

---

## 2. Data Sources (All Free Tier)

| API | Purpose | Key required? |
|---|---|---|
| **OpenWeatherMap** ([openweathermap.org](https://openweathermap.org)) | Current conditions + 5-day forecast: temperature, humidity, wind speed, condition icons | Yes (free signup) |
| **Open-Meteo** ([open-meteo.com](https://open-meteo.com)) | Fallback weather source if OpenWeatherMap rate-limits | No |
| **GeoDB Cities API** (via RapidAPI) | Live city autocomplete as the user types in the search field | Yes (free tier) |
| **Web Push / Notifications API** (browser native) | Daily morning reminder notification; fires even when the tab is closed | No |

---

## 3. Core Requirements: What the App Must Do

### 01. City Search with Autocomplete
`VALIDATION` `REST API`
- Integrate **GeoDB Cities API** for live city suggestions as the user types. A plain text input with no feedback is not acceptable.
- Results must appear **within 300 ms** of the user pausing (debounce).
- Show the **no-results** and **API error** states visibly.

### 02. Weather Data Display
`REST API`
- Fetch and display **current conditions**: temperature, humidity, wind speed and condition icon.
- Fetch and display a **5-day forecast**.
- Use OpenWeatherMap or Open-Meteo. Data must be **real**, not mocked or hardcoded.
- **Every async fetch** needs a **loading state** and a **user-friendly error** if it fails.

### 03. Form Validation
`VALIDATION`
- Every submittable input needs **client-side validation** with **clear inline error messages**.
- Validate **on blur**, not only on submit.
- Must handle:
  - Empty city field
  - API returning no results
  - Network failure
- "Something went wrong" is **not acceptable**. Tell the user **what failed** and **what they can do**.

### 04. Favourite Cities
`VALIDATION` `STATE`
- Users can save **up to 5** favourite cities.
- Persist favourites in **localStorage** across sessions.
- Provide a **quick-access panel**.
- Removing a favourite must **ask for confirmation**.
- If localStorage is unavailable, **degrade gracefully**.

### 05. Progressive Web App (PWA)
`PWA` `SERVICE WORKER`
- Installable on mobile and desktop.
- Valid **web manifest** with:
  - `name`
  - **192 px** and **512 px** icons
  - `theme_color`
  - `display: standalone`
- A **service worker** that caches:
  - The app shell
  - The **last-viewed city's weather**
- **Usable offline** for the last cached city, with an **"offline mode" banner** when offline is detected.

### 06. Push Notifications
`PWA` `PUSH NOTIFICATION`
- A **daily morning weather reminder** via the Web Push / Notifications API, **through the service worker**.
- Users **choose their reminder time**.
- It must **fire even when the tab is closed**.
- **Explain why** before the browser permission prompt appears (a pre-permission prompt).
- Show a **clear fallback if unsupported**. A denied permission must **not break anything else**.

### 07. Responsive Design
`RESPONSIVE`
- Must work correctly at **375 px** (mobile), **768 px** (tablet) and **1280 px** (desktop).
- **No horizontal scroll** at any breakpoint.
- **Touch targets at least 44×44 px** on mobile.

---

## 4. UI & Design References (Study These, Don't Copy Them)

| Site / Reference | What to study from it |
|---|---|
| **Linear** (linear.app) | Clean layout, excellent empty states, tight typography hierarchy |
| **Vercel Dashboard** (vercel.com) | Status indicators, subtle motion, information density done right |
| **Stripe** (stripe.com) | Error-handling UX, inline form validation patterns |
| **Mercury** (mercury.com) | Dashboard cards, data hierarchy, calm and confident colour palette |
| **Dribbble** ("weather dashboard") | Modern visual patterns for weather cards and forecast layouts |
| **Mobbin** (mobbin.com) | Real mobile-app patterns: search, notifications, settings flows |



## 5. Requirements Checklist

**Core**
- [ ] City autocomplete (GeoDB), debounced to ≤300 ms, with no-results and error states
- [ ] Current weather: temperature, humidity, wind and icon (real data)
- [ ] 5-day forecast
- [ ] Loading and specific, actionable error states on every fetch
- [ ] OpenWeatherMap with an Open-Meteo fallback on rate limit
- [ ] Inline validation on blur and submit (empty field, no results, network failure)
- [ ] Up to 5 favourites in localStorage, quick-access panel, confirm on remove, graceful fallback
- [ ] Web manifest (name, 192/512 icons, theme_color, standalone)
- [ ] Service worker: app shell + last-viewed city's weather cached; offline banner
- [ ] Daily reminder at a user-chosen time, firing with the tab closed; pre-permission explainer; unsupported/denied fallback
- [ ] Responsive at 375 / 768 / 1280 with no horizontal scroll and ≥44×44 px touch targets
