import { useCallback, useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import {
  getPermission,
  getSupport,
  requestPermission,
  showNotification,
  writeReminderState,
  readReminderState,
  registerBackgroundReminder,
  unregisterBackgroundReminder,
  isReminderDue,
  localDateKey,
} from '../services/notificationService';

const DEFAULT_PREFS = { enabled: false, time: '07:30' };
const isPrefs = (v) => v && typeof v.enabled === 'boolean' && typeof v.time === 'string';
const CHECK_EVERY_MS = 30 * 1000;

/**
 * Daily reminder state machine. Every operation is wrapped so a failure here
 * (unsupported API, denied permission, SW missing) never affects the rest of the app.
 *
 * background: 'registered' | 'unsupported' | 'not-installed' | 'denied' | 'no-service-worker' | 'off'
 */
export function useReminder({ city, summary, unit }) {
  const [prefs, setPrefs] = useLocalStorage('reminder', DEFAULT_PREFS, isPrefs);
  const [permission, setPermission] = useState(getPermission);
  const [background, setBackground] = useState('off');
  const support = getSupport();

  // Permission can change outside the app (site settings); re-read on focus.
  useEffect(() => {
    const sync = () => setPermission(getPermission());
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, []);

  const active = prefs.enabled && permission === 'granted';

  // Share prefs + latest forecast summary with the service worker (it can't read localStorage).
  useEffect(() => {
    writeReminderState({
      enabled: active,
      time: prefs.time,
      unit,
      city: city ? { name: city.name, lat: city.lat, lon: city.lon } : null,
      summary,
    });
  }, [active, prefs.time, unit, city, summary]);

  // Register / unregister background checks.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!active) {
        await unregisterBackgroundReminder();
        if (!cancelled) setBackground('off');
        return;
      }
      const result = await registerBackgroundReminder();
      if (!cancelled) setBackground(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  // Foreground scheduler: checks every 30 s while the app is open in any tab.
  useEffect(() => {
    if (!active) return undefined;
    const check = async () => {
      const state = (await readReminderState()) || {};
      const now = new Date();
      if (!isReminderDue({ enabled: true, time: prefs.time, lastFired: state.lastFired }, now)) return;
      await writeReminderState({ lastFired: localDateKey(now) }); // claim first to avoid double-firing across tabs
      try {
        await showNotification('Good morning ☀ Your weather is ready', {
          body: summary || 'Open WeatherBoard to see today’s forecast.',
        });
      } catch (err) {
        console.warn('[reminder] Could not show notification:', err);
      }
    };
    check();
    const id = setInterval(check, CHECK_EVERY_MS);
    return () => clearInterval(id);
  }, [active, prefs.time, summary]);

  /** Call only from a user gesture, after the in-app explanation. */
  const askPermission = useCallback(async () => {
    const result = await requestPermission();
    setPermission(result);
    return result;
  }, []);

  const setEnabled = useCallback((enabled) => setPrefs((p) => ({ ...p, enabled })), [setPrefs]);
  const setTime = useCallback(async (time) => {
    setPrefs((p) => ({ ...p, time }));
    // A new time means today's reminder may still be due.
    await writeReminderState({ lastFired: null });
  }, [setPrefs]);

  const sendTest = useCallback(async () => {
    await showNotification('WeatherBoard test notification', {
      body: summary || 'Reminders are working. You’ll get one like this each day.',
      tag: 'wb-test',
    });
  }, [summary]);

  return { prefs, permission, support, background, active, askPermission, setEnabled, setTime, sendTest };
}
