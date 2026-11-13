import { fetchJson } from './http';
import { RAPIDAPI_KEY, RAPIDAPI_HOST } from './config';

/**
 * City autocomplete.
 *
 *   1. GeoDB Cities via RapidAPI (primary, required by the brief)
 *   2. Open-Meteo Geocoding (keyless fallback): used when the RapidAPI key is
 *      missing, or GeoDB rate-limits us. The GeoDB free tier allows only
 *      1 request/second, which fast typists can exceed.
 *
 * Results are normalised to:
 *   { id, name, region, country, countryCode, lat, lon }
 */

const GEODB_URL = `https://${RAPIDAPI_HOST}/v1/geo/cities`;
const OM_GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const LIMIT = 8;

const cache = new Map(); // normalised query -> { results, source }

export async function searchCities(query, { signal } = {}) {
  const q = query.trim();
  const cacheKey = q.toLowerCase();
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  let result;
  if (RAPIDAPI_KEY) {
    try {
      result = { results: await searchGeoDB(q, signal), source: 'geodb' };
    } catch (err) {
      if (err.kind === 'aborted') throw err;
      console.warn('[search] GeoDB failed, falling back to Open-Meteo geocoding:', err.message);
    }
  }
  if (!result) {
    result = { results: await searchOpenMeteo(q, signal), source: 'open-meteo' };
  }

  cache.set(cacheKey, result);
  return result;
}

async function searchGeoDB(q, signal) {
  const params = new URLSearchParams({
    namePrefix: q,
    limit: String(LIMIT > 10 ? 10 : LIMIT), // free plan caps at 10
    sort: '-population',
    types: 'CITY',
  });
  const { data } = await fetchJson(`${GEODB_URL}?${params}`, {
    signal,
    provider: 'GeoDB Cities',
    timeout: 6000,
    headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST },
  });
  return (data.data || []).map((c) => ({
    id: `geodb-${c.id}`,
    name: c.name,
    region: c.region || '',
    country: c.country || '',
    countryCode: c.countryCode || '',
    lat: c.latitude,
    lon: c.longitude,
  }));
}

async function searchOpenMeteo(q, signal) {
  const params = new URLSearchParams({ name: q, count: String(LIMIT), language: 'en', format: 'json' });
  const { data } = await fetchJson(`${OM_GEO_URL}?${params}`, {
    signal,
    provider: 'Open-Meteo Geocoding',
    timeout: 6000,
  });
  return (data.results || []).map((c) => ({
    id: `om-${c.id}`,
    name: c.name,
    region: c.admin1 || '',
    country: c.country || '',
    countryCode: c.country_code || '',
    lat: c.latitude,
    lon: c.longitude,
  }));
}

/** GeoDB location id in ISO-6709 form, e.g. "+24.8607+067.0011". */
export function toLocationId(lat, lon) {
  const fmt = (v, intDigits) => {
    const sign = v < 0 ? '-' : '+';
    const [int, frac] = Math.abs(v).toFixed(4).split('.');
    return `${sign}${int.padStart(intDigits, '0')}.${frac}`;
  };
  return `${fmt(lat, 2)}${fmt(lon, 3)}`;
}

/**
 * Reverse lookup for "Use my location": the nearest named city.
 *   1. GeoDB  GET /v1/geo/locations/{locationId}/nearbyCities  (same provider as search)
 *   2. BigDataCloud keyless reverse geocoding (no RapidAPI key, or GeoDB failed)
 * The user's exact coordinates are kept, so the weather is for where they are,
 * and only the label comes from the nearest city.
 */
export async function nameForCoordinates(lat, lon) {
  if (RAPIDAPI_KEY) {
    try {
      const params = new URLSearchParams({ radius: '50', distanceUnit: 'KM', limit: '5', types: 'CITY' });
      const { data } = await fetchJson(
        `https://${RAPIDAPI_HOST}/v1/geo/locations/${encodeURIComponent(toLocationId(lat, lon))}/nearbyCities?${params}`,
        {
          provider: 'GeoDB Cities',
          timeout: 6000,
          headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': RAPIDAPI_HOST },
        },
      );
      const nearest = (data.data || []).reduce((best, c) => (!best || (c.distance ?? Infinity) < (best.distance ?? Infinity) ? c : best), null);
      if (nearest) {
        return {
          id: `geo-${lat.toFixed(2)},${lon.toFixed(2)}`,
          name: nearest.name,
          region: nearest.region || '',
          country: nearest.country || '',
          countryCode: nearest.countryCode || '',
          lat,
          lon,
        };
      }
    } catch (err) {
      console.warn('[location] GeoDB nearbyCities failed, using fallback:', err.message);
    }
  }
  // Fallback: BigDataCloud's client endpoint is free and keyless.
  try {
    const { data } = await fetchJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
      { provider: 'Reverse geocoding', timeout: 5000 },
    );
    return {
      id: `geo-${lat.toFixed(2)},${lon.toFixed(2)}`,
      name: data.city || data.locality || 'Your location',
      region: data.principalSubdivision || '',
      country: data.countryName || '',
      countryCode: data.countryCode || '',
      lat,
      lon,
    };
  } catch {
    return {
      id: `geo-${lat.toFixed(2)},${lon.toFixed(2)}`,
      name: 'Your location',
      region: '',
      country: '',
      countryCode: '',
      lat,
      lon,
    };
  }
}
