import { useCallback, useEffect, useRef, useState } from 'react';
import { getWeather } from '../services/weatherService';
import { readJSON, writeJSON } from '../services/storage';

const SNAPSHOT_KEY = 'last-weather';

const isSnapshot = (v) => v && v.city && typeof v.city.lat === 'number' && v.data && v.data.current;

/** The last successfully loaded city + weather, used for instant paint and offline. */
export function readSnapshot() {
  return readJSON(SNAPSHOT_KEY, null, isSnapshot);
}

/**
 * Loads weather for `city` and exposes { status, data, error, isStale, refresh }.
 *
 * status: 'idle' | 'loading' | 'success' | 'error'
 *
 * Offline strategy (two layers):
 *   - The service worker caches API responses; when offline it serves them and
 *     tags them with X-WB-Cached-At, which surfaces here as data.cachedAt.
 *   - A normalised snapshot is also kept in localStorage, so the last city
 *     still renders even where service workers are unavailable (dev mode,
 *     some private-browsing modes).
 * Either way the UI is told the data is stale; it never pretends to be live.
 */
export function useWeather(city) {
  const [state, setState] = useState(() => {
    const snap = readSnapshot();
    if (city && snap && sameCity(snap.city, city)) {
      return { status: 'loading', data: snap.data, error: null, fromSnapshot: true };
    }
    return { status: city ? 'loading' : 'idle', data: null, error: null, fromSnapshot: false };
  });
  const requestId = useRef(0);

  const load = useCallback(
    async ({ force = false } = {}) => {
      if (!city) return;
      const id = ++requestId.current;
      const snap = readSnapshot();
      const snapshotForCity = snap && sameCity(snap.city, city) ? snap.data : null;

      setState((s) => ({
        status: 'loading',
        // keep showing what we have for this city while refreshing
        data: s.data && s.cityId === city.id ? s.data : snapshotForCity,
        fromSnapshot: !(s.data && s.cityId === city.id) && !!snapshotForCity,
        error: null,
        cityId: city.id,
      }));

      try {
        const data = await getWeather(city, { force });
        if (id !== requestId.current) return; // a newer request superseded this one
        if (!data.cachedAt) writeJSON(SNAPSHOT_KEY, { city, data });
        setState({ status: 'success', data, error: null, fromSnapshot: false, cityId: city.id });
      } catch (error) {
        if (id !== requestId.current) return;
        setState({
          status: 'error',
          error,
          data: snapshotForCity,
          fromSnapshot: !!snapshotForCity,
          cityId: city.id,
        });
      }
    },
    [city],
  );

  useEffect(() => {
    load();
  }, [load]);

  // When connectivity returns, refresh automatically.
  useEffect(() => {
    const onOnline = () => load({ force: true });
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [load]);

  const data = state.data;
  const isStale = !!data && (state.fromSnapshot || !!data.cachedAt);

  return {
    status: city ? state.status : 'idle',
    data: city ? data : null,
    error: state.error,
    isStale,
    refresh: () => load({ force: true }),
  };
}

export function sameCity(a, b) {
  if (!a || !b) return false;
  return Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01;
}
