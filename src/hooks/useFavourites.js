import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { sameCity } from './useWeather';

export const MAX_FAVOURITES = 5;

const isCity = (c) =>
  c && typeof c.name === 'string' && typeof c.lat === 'number' && typeof c.lon === 'number';

// Corrupted or hand-edited storage is rejected wholesale rather than half-trusted.
const isFavouriteList = (v) => Array.isArray(v) && v.length <= MAX_FAVOURITES && v.every(isCity);

export function useFavourites() {
  const [favourites, setFavourites] = useLocalStorage('favourites', [], isFavouriteList);

  const isFavourite = useCallback((city) => favourites.some((f) => sameCity(f, city)), [favourites]);

  /** Returns { ok: true } or { ok: false, reason } so the UI can explain why. */
  const addFavourite = useCallback(
    (city) => {
      if (!isCity(city)) return { ok: false, reason: 'This location is missing coordinates and can’t be saved.' };
      if (favourites.some((f) => sameCity(f, city))) {
        return { ok: false, reason: `${city.name} is already in your favourites.` };
      }
      if (favourites.length >= MAX_FAVOURITES) {
        return {
          ok: false,
          reason: `You can save up to ${MAX_FAVOURITES} cities. Remove one to make room for ${city.name}.`,
        };
      }
      const { id, name, region, country, countryCode, lat, lon } = city;
      setFavourites((list) => [...list, { id, name, region, country, countryCode, lat, lon }]);
      return { ok: true };
    },
    [favourites, setFavourites],
  );

  const removeFavourite = useCallback(
    (city) => setFavourites((list) => list.filter((f) => !sameCity(f, city))),
    [setFavourites],
  );

  return { favourites, isFavourite, addFavourite, removeFavourite, isFull: favourites.length >= MAX_FAVOURITES };
}
