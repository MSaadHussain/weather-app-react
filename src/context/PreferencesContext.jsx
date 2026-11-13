import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useNow } from '../hooks/useNow';
import { writeJSON } from '../services/storage';

/**
 * App-wide display preferences: theme and temperature unit. Both persist and
 * re-render instantly (no reload).
 *
 * Theme modes
 *   auto:   realtime day/night. Light between the selected city's sunrise and
 *           sunset, dark otherwise; re-evaluated every minute, so the app turns
 *           dark at sunset while you're looking at it. Before any city has
 *           loaded it falls back to the OS preference.
 *   system: follows the OS light/dark setting.
 *   light / dark: fixed.
 */
const PreferencesContext = createContext(null);

export const THEMES = ['auto', 'system', 'light', 'dark'];
const isTheme = (v) => THEMES.includes(v);
const isUnit = (v) => v === 'C' || v === 'F';

function useSystemDark() {
  const query = '(prefers-color-scheme: dark)';
  const [dark, setDark] = useState(() => window.matchMedia?.(query).matches ?? false);
  useEffect(() => {
    const mql = window.matchMedia?.(query);
    if (!mql) return undefined;
    const onChange = (e) => setDark(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return dark;
}

/**
 * Where we are in the city's solar day.
 * Returns { isDay, nextChange } with nextChange in unix seconds (or null).
 */
export function solarPhase(sun, nowSec) {
  if (!sun?.sunrise || !sun?.sunset) return null;
  const { sunrise, sunset } = sun;
  if (nowSec < sunrise) return { isDay: false, nextChange: sunrise };
  if (nowSec < sunset) return { isDay: true, nextChange: sunset };
  // After sunset: tomorrow's sunrise is ~24 h after today's (accurate to a few minutes).
  return { isDay: false, nextChange: sunrise + 86400 };
}

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useLocalStorage('theme', 'auto', isTheme);
  const [unit, setUnit] = useLocalStorage('unit', 'C', isUnit);
  const [sun, setSunState] = useState(null); // { sunrise, sunset, place }
  const systemDark = useSystemDark();
  const now = useNow(60000);

  const phase = solarPhase(sun, Math.floor(now.getTime() / 1000));
  let resolvedTheme;
  if (theme === 'auto') resolvedTheme = phase ? (phase.isDay ? 'light' : 'dark') : systemDark ? 'dark' : 'light';
  else if (theme === 'system') resolvedTheme = systemDark ? 'dark' : 'light';
  else resolvedTheme = theme;

  const first = useRef(true);
  useEffect(() => {
    const root = document.documentElement;
    // Cross-fade colours when the theme flips (e.g. at sunset), never on first paint.
    if (!first.current) {
      root.classList.add('theme-transition');
      const t = setTimeout(() => root.classList.remove('theme-transition'), 700);
      root.classList.toggle('dark', resolvedTheme === 'dark');
      first.current = false;
      return () => clearTimeout(t);
    }
    first.current = false;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    return undefined;
  }, [resolvedTheme]);

  useEffect(() => {
    document.documentElement.style.colorScheme = resolvedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolvedTheme === 'dark' ? '#0b1120' : '#f5f7fa');
    // Remembered so index.html can paint the right theme before React loads.
    writeJSON('resolved-theme', resolvedTheme);
  }, [resolvedTheme]);

  const setSun = useCallback((next) => {
    setSunState((prev) =>
      prev && next && prev.sunrise === next.sunrise && prev.sunset === next.sunset && prev.place === next.place ? prev : next,
    );
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme, unit, setUnit, sun, setSun, phase }),
    // phase is derived from sun + the minute tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, setTheme, resolvedTheme, unit, setUnit, sun, setSun, phase?.isDay, phase?.nextChange],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}
