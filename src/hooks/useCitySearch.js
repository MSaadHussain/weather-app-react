import { useCallback, useEffect, useRef, useState } from 'react';
import { searchCities } from '../services/geoDBService';
import { validateCityQuery } from '../utils/validation';

// 250 ms of quiet before we query. Combined with the result cache and request
// cancellation, suggestions land within ~300 ms of the user pausing on a
// typical connection (network time permitting).
export const SEARCH_DEBOUNCE_MS = 250;

/**
 * Debounced, cancellable autocomplete.
 * status: 'idle' | 'loading' | 'success' | 'empty' | 'error'
 */
export function useCitySearch(query, { enabled = true } = {}) {
  const [state, setState] = useState({ status: 'idle', results: [], error: null, source: null });
  const controllerRef = useRef(null);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    const trimmed = query.trim();
    // Only search syntactically valid queries; validation messages are shown on blur/submit.
    if (!enabled || validateCityQuery(trimmed)) {
      controllerRef.current?.abort();
      setState({ status: 'idle', results: [], error: null, source: null });
      return undefined;
    }

    const timer = setTimeout(async () => {
      controllerRef.current?.abort(); // cancel the stale request: last keystroke wins
      const controller = new AbortController();
      controllerRef.current = controller;
      setState((s) => ({ ...s, status: 'loading', error: null }));
      try {
        const { results, source } = await searchCities(trimmed, { signal: controller.signal });
        if (controller.signal.aborted) return;
        setState({ status: results.length ? 'success' : 'empty', results, error: null, source });
      } catch (err) {
        if (err.kind === 'aborted' || controller.signal.aborted) return;
        setState({ status: 'error', results: [], error: err, source: null });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, enabled, retryToken]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const retry = useCallback(() => setRetryToken((n) => n + 1), []);
  return { ...state, retry };
}
