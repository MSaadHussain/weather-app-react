import { useCallback, useState } from 'react';
import { nameForCoordinates } from '../services/geoDBService';

/**
 * Browser geolocation, only requested after an explicit click.
 * status: 'idle' | 'locating' | 'error'
 */
export function useGeolocation(onLocated) {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const supported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  const locate = useCallback(() => {
    if (!supported) {
      setStatus('error');
      setError('Your browser doesn’t support location access. Search for your city instead.');
      return;
    }
    setStatus('locating');
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const city = await nameForCoordinates(coords.latitude, coords.longitude);
        setStatus('idle');
        onLocated(city);
      },
      (err) => {
        setStatus('error');
        setError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access is blocked. Allow it in your browser’s site settings, or search for your city.'
            : err.code === err.TIMEOUT
              ? 'Finding your location took too long. Try again, or search for your city.'
              : 'Your device couldn’t determine its location. Search for your city instead.',
        );
      },
      { timeout: 10000, maximumAge: 10 * 60 * 1000 },
    );
  }, [supported, onLocated]);

  return { locate, status, error, supported };
}
