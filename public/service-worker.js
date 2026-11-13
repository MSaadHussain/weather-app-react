/* WeatherBoard service worker
 *
 * Strategies
 *   - App shell (HTML/JS/CSS/icons): precached at install from a build-time
 *     manifest injected by vite.config.js, then served cache-first.
 *   - Navigations: network-first, falling back to the cached shell offline.
 *   - Weather API responses: network-first. Successful responses are cached
 *     for the LAST viewed location only (older locations are evicted). When the
 *     network fails, the cached copy is returned with an X-WB-Cached-At header
 *     so the UI can label it as saved data, never as live.
 *   - City search (GeoDB / geocoding): network-only; stale suggestions are worse than none.
 *   - Google Fonts: stale-while-revalidate.
 *
 * It also handles the daily reminder (periodicsync) and notification clicks.
 */

const VERSION = '__BUILD_VERSION__';
const SHELL_CACHE = `wb-shell-${VERSION}`;
const DATA_CACHE = 'wb-weather-data';
const FONT_CACHE = 'wb-fonts';
const REMINDER_CACHE = 'wb-reminder';
const REMINDER_URL = '/__wb/reminder.json';
const PRECACHE = self.__PRECACHE_MANIFEST || ['/'];

const WEATHER_HOSTS = ['api.openweathermap.org', 'api.open-meteo.com'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('wb-shell-') && k !== SHELL_CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  if (WEATHER_HOSTS.includes(url.hostname)) {
    event.respondWith(weatherNetworkFirst(request, url));
    return;
  }
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }
  if (url.origin === self.location.origin && !url.pathname.startsWith('/__wb/')) {
    event.respondWith(cacheFirst(request));
  }
  // Everything else (city search, reverse geocoding) goes straight to the network.
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(SHELL_CACHE);
    cache.put('/', response.clone());
    return response;
  } catch {
    const cached = await caches.match('/', { cacheName: SHELL_CACHE });
    return cached || new Response('WeatherBoard is offline and the app has not been cached yet.', { status: 503 });
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(SHELL_CACHE);
    cache.put(request, response.clone());
  }
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === 'opaque') cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

function locationOf(url) {
  const lat = url.searchParams.get('lat') ?? url.searchParams.get('latitude');
  const lon = url.searchParams.get('lon') ?? url.searchParams.get('longitude');
  return lat && lon ? `${Number(lat).toFixed(2)},${Number(lon).toFixed(2)}` : null;
}

async function weatherNetworkFirst(request, url) {
  const cache = await caches.open(DATA_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const savedAt = String(Date.now());
      const body = await response.clone().arrayBuffer();
      const headers = new Headers(response.headers);
      headers.set('X-WB-Saved-At', savedAt);
      // Keep only the last viewed location.
      const loc = locationOf(url);
      const keys = await cache.keys();
      await Promise.all(keys.filter((k) => locationOf(new URL(k.url)) !== loc).map((k) => cache.delete(k)));
      await cache.put(request, new Response(body, { status: 200, headers }));
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (!cached) throw err;
    const headers = new Headers(cached.headers);
    headers.set('X-WB-Cached-At', cached.headers.get('X-WB-Saved-At') || '0');
    return new Response(await cached.arrayBuffer(), { status: 200, headers });
  }
}

// ---- Daily reminder ---------------------------------------------------------

const CATCH_UP_WINDOW_MS = 3 * 60 * 60 * 1000;

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isReminderDue({ enabled, time, lastFired }, now = new Date()) {
  if (!enabled || !time) return false;
  const [h, m] = time.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  const diff = now - target;
  return diff >= 0 && diff < CATCH_UP_WINDOW_MS && lastFired !== localDateKey(now);
}

async function readReminderState() {
  const cache = await caches.open(REMINDER_CACHE);
  const res = await cache.match(REMINDER_URL);
  return res ? res.json() : null;
}

async function writeReminderState(state) {
  const cache = await caches.open(REMINDER_CACHE);
  await cache.put(REMINDER_URL, new Response(JSON.stringify(state), { headers: { 'Content-Type': 'application/json' } }));
}

/** Fresh one-line forecast from keyless Open-Meteo; falls back to the page's last summary. */
async function buildSummary(state) {
  const city = state.city;
  if (!city) return state.summary || 'Open WeatherBoard to see today’s forecast.';
  try {
    const params = new URLSearchParams({
      latitude: city.lat,
      longitude: city.lon,
      current: 'temperature_2m',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      timezone: 'auto',
      forecast_days: '1',
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    const data = await res.json();
    const f = (c) => Math.round(state.unit === 'F' ? (c * 9) / 5 + 32 : c);
    const rain = data.daily.precipitation_probability_max?.[0];
    return `${city.name}: ${f(data.current.temperature_2m)}° now, high ${f(data.daily.temperature_2m_max[0])}°, low ${f(
      data.daily.temperature_2m_min[0],
    )}°${rain != null ? `, ${rain}% chance of rain` : ''}.`;
  } catch {
    return state.summary || `Check today’s weather for ${city.name}.`;
  }
}

async function fireReminderIfDue() {
  const state = await readReminderState();
  if (!state || !isReminderDue(state)) return;
  const body = await buildSummary(state);
  await self.registration.showNotification('Good morning ☀ Your weather is ready', {
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: 'wb-daily-reminder',
    renotify: true,
    data: { url: '/' },
  });
  await writeReminderState({ ...state, lastFired: localDateKey(new Date()) });
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'wb-daily-reminder') event.waitUntil(fireReminderIfDue());
});

// Ready for server-sent Web Push if a backend is added later (see README).
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data?.text() };
  }
  event.waitUntil(
    self.registration.showNotification(payload.title || 'WeatherBoard', {
      body: payload.body || 'Your daily weather is ready.',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      tag: 'wb-daily-reminder',
      data: { url: '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => new URL(c.url).origin === self.location.origin);
      if (existing) return existing.focus();
      return self.clients.openWindow(target);
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
