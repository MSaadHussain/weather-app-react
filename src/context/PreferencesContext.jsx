import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

/**
 * App-wide display preferences: theme (light/dark/system) and temperature unit.
 * Both persist across sessions; switching either re-renders without a reload.
 */
const PreferencesContext = createContext(null);

const isTheme = (v) => ['light', 'dark', 'system'].includes(v);
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

export function PreferencesProvider({ children }) {
  const [theme, setTheme] = useLocalStorage('theme', 'system', isTheme);
  const [unit, setUnit] = useLocalStorage('unit', 'C', isUnit);
  const systemDark = useSystemDark();
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.style.colorScheme = resolvedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      resolvedTheme === 'dark' ? '#0b1120' : '#172554',
    );
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({ theme, setTheme, resolvedTheme, unit, setUnit }),
    [theme, setTheme, resolvedTheme, unit, setUnit],
  );
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return ctx;
}
