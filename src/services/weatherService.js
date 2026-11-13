import { fetchJson, ApiError } from './http';
import { OPENWEATHER_KEY } from './config';
import { conditionFromOwm, conditionFromWmo, capitalise } from '../utils/weatherHelpers';
import { cityDateKey } from '../utils/dateHelpers';

/**
 * Weather data access with provider fallback.
 *
 *   1. OpenWeatherMap (primary, needs VITE_OPENWEATHER_API_KEY)
 *   2. Open-Meteo     (fallback, keyless): used when OWM has no key, is
 *                     rate-limited, rejects the key, or is unreachable.
 *
 * Both are normalised into the same shape (see `WeatherData` below), so
 * components never branch on provider.
 *
 * @typedef {Object} WeatherData
 * @property {'openweathermap'|'open-meteo'} provider
 * @property {number} timezoneOffset   seconds from UTC for the city
 * @property {Object} current          metric units: °C, m/s, hPa, metres
 * @property {Array}  daily            5 entries: { dateKey, min, max, condition, description, pop }
 * @property {number} fetchedAt        ms epoch when the provider produced it
 * @property {number|null} cachedAt    set when served from the service-worker cache (offline)
 */

const OWM_BASE = 'https://api.openweathermap.org/data/2.5';
const OM_BASE = 'https://api.open-meteo.com/v1/forecast';
const FORECAST_DAYS = 5;
const MEMORY_TTL = 5 * 60 * 1000; // re-selecting a city within 5 min reuses data

const memoryCache = new Map(); // key -> { data, at }
const inflight = new Map(); // key -> Promise (dedupes concurrent identical requests)

const coordKey = (lat, lon) => `${lat.toFixed(3)},${lon.toFixed(3)}`;

export async function getWeather({ lat, lon }, { force = false } = {}) {
  const key = coordKey(lat, lon);

  const cached = memoryCache.get(key);
  if (!force && cached && Date.now() - cached.at < MEMORY_TTL && !cached.data.cachedAt) {
    return cached.data;
  }
  if (inflight.has(key)) return inflight.get(key);

  const promise = loadWithFallback(lat, lon)
    .then((data) => {
      memoryCache.set(key, { data, at: Date.now() });
      return data;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, promise);
  return promise;
}

async function loadWithFallback(lat, lon) {
  let primaryError = null;
  if (OPENWEATHER_KEY) {
    try {
      return await fetchOpenWeather(lat, lon);
    } catch (err) {
      primaryError = err;
      console.warn('[weather] OpenWeatherMap failed, falling back to Open-Meteo:', err.message);
    }
  }
  try {
    const data = await fetchOpenMeteo(lat, lon);
    return { ...data, fallbackReason: primaryError ? primaryError.kind : 'no-key' };
  } catch (fallbackError) {
    // Surface the most useful of the two errors: a rate-limit/timeout on the
    // primary is more actionable than a generic failure on the fallback.
    const err = fallbackError.kind === 'network' && primaryError ? primaryError : fallbackError;
    throw err instanceof ApiError ? err : new ApiError('server', String(err?.message || err));
  }
}

// ---- OpenWeatherMap ----------------------------------------------------------

async function fetchOpenWeather(lat, lon) {
  const qs = `lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_KEY}`;
  const provider = 'OpenWeatherMap';
  const [cur, fc] = await Promise.all([
    fetchJson(`${OWM_BASE}/weather?${qs}`, { provider }),
    fetchJson(`${OWM_BASE}/forecast?${qs}`, { provider }),
  ]);
  return normaliseOpenWeather(cur.data, fc.data, cur.cachedAt || fc.cachedAt);
}

export function normaliseOpenWeather(cur, fc, cachedAt = null) {
  const tz = cur.timezone ?? fc.city?.timezone ?? 0;
  const w = cur.weather?.[0] || {};

  // The /forecast endpoint returns 3-hour slots; collapse them into days in
  // the city's local time. The slot nearest 13:00 represents the day's sky.
  const groups = new Map();
  for (const slot of fc.list || []) {
    const dateKey = cityDateKey(slot.dt, tz);
    if (!groups.has(dateKey)) groups.set(dateKey, []);
    groups.get(dateKey).push(slot);
  }

  const todayKey = cityDateKey(cur.dt, tz);
  const daily = [...groups.entries()].slice(0, FORECAST_DAYS).map(([dateKey, slots]) => {
    let min = Math.min(...slots.map((s) => s.main.temp_min));
    let max = Math.max(...slots.map((s) => s.main.temp_max));
    if (dateKey === todayKey) {
      min = Math.min(min, cur.main.temp);
      max = Math.max(max, cur.main.temp);
    }
    const rep = slots.reduce((best, s) => {
      const hour = new Date((s.dt + tz) * 1000).getUTCHours();
      const bestHour = new Date((best.dt + tz) * 1000).getUTCHours();
      return Math.abs(hour - 13) < Math.abs(bestHour - 13) ? s : best;
    });
    return {
      dateKey,
      min,
      max,
      condition: conditionFromOwm(rep.weather[0].id),
      description: capitalise(rep.weather[0].description),
      pop: Math.round(Math.max(...slots.map((s) => s.pop || 0)) * 100),
    };
  });

  const today = daily.find((d) => d.dateKey === todayKey);

  return {
    provider: 'openweathermap',
    timezoneOffset: tz,
    current: {
      temp: cur.main.temp,
      feelsLike: cur.main.feels_like,
      high: today ? today.max : cur.main.temp_max,
      low: today ? today.min : cur.main.temp_min,
      humidity: cur.main.humidity,
      pressure: cur.main.pressure,
      windSpeed: cur.wind?.speed ?? null,
      windDeg: cur.wind?.deg ?? null,
      visibility: cur.visibility ?? null,
      condition: conditionFromOwm(w.id),
      description: capitalise(w.description || ''),
      isDay: (w.icon || 'd').endsWith('d'),
      sunrise: cur.sys?.sunrise ?? null,
      sunset: cur.sys?.sunset ?? null,
      observedAt: cur.dt,
    },
    daily,
    fetchedAt: cachedAt || Date.now(),
    cachedAt,
  };
}

// ---- Open-Meteo --------------------------------------------------------------

async function fetchOpenMeteo(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'is_day',
      'weather_code',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'visibility',
    ].join(','),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: String(FORECAST_DAYS),
    wind_speed_unit: 'ms',
  });
  const { data, cachedAt } = await fetchJson(`${OM_BASE}?${params}`, { provider: 'Open-Meteo' });
  return normaliseOpenMeteo(data, cachedAt);
}

export function normaliseOpenMeteo(data, cachedAt = null) {
  const tz = data.utc_offset_seconds || 0;
  // Open-Meteo returns local wall-clock strings ("2026-11-13T06:41"); convert to unix.
  const toUnix = (local) => (local ? Date.parse(`${local}Z`) / 1000 - tz : null);
  const c = data.current || {};
  const d = data.daily || {};
  const [condition, description] = conditionFromWmo(c.weather_code);

  const daily = (d.time || []).map((dateKey, i) => {
    const [cond, desc] = conditionFromWmo(d.weather_code[i]);
    return {
      dateKey,
      min: d.temperature_2m_min[i],
      max: d.temperature_2m_max[i],
      condition: cond,
      description: desc,
      pop: d.precipitation_probability_max?.[i] ?? null,
    };
  });

  return {
    provider: 'open-meteo',
    timezoneOffset: tz,
    current: {
      temp: c.temperature_2m,
      feelsLike: c.apparent_temperature,
      high: daily[0]?.max ?? null,
      low: daily[0]?.min ?? null,
      humidity: c.relative_humidity_2m,
      pressure: c.pressure_msl != null ? Math.round(c.pressure_msl) : null,
      windSpeed: c.wind_speed_10m ?? null,
      windDeg: c.wind_direction_10m ?? null,
      visibility: c.visibility ?? null,
      condition,
      description,
      isDay: c.is_day === 1,
      sunrise: toUnix(d.sunrise?.[0]),
      sunset: toUnix(d.sunset?.[0]),
      observedAt: toUnix(c.time),
    },
    daily,
    fetchedAt: cachedAt || Date.now(),
    cachedAt,
  };
}
