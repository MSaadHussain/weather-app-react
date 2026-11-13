import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { sameCity } from './useWeather';

const MAX_RECENT = 5;
const isList = (v) => Array.isArray(v) && v.every((c) => c && typeof c.name === 'string' && typeof c.lat === 'number');

/** Most-recent-first list of viewed cities, shown when the search field is focused and empty. */
export function useRecentCities() {
  const [recent, setRecent] = useLocalStorage('recent-cities', [], isList);

  const remember = useCallback(
    (city) => {
      if (!city) return;
      const { id, name, region, country, countryCode, lat, lon } = city;
      setRecent((list) => [{ id, name, region, country, countryCode, lat, lon }, ...list.filter((c) => !sameCity(c, city))].slice(0, MAX_RECENT));
    },
    [setRecent],
  );
  const clear = useCallback(() => setRecent([]), [setRecent]);

  return { recent, remember, clear };
}
