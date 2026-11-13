import { useEffect, useId, useRef, useState } from 'react';
import { Sun, Moon, Monitor, SunMoon, Check } from 'lucide-react';
import { usePreferences, THEMES } from '../../context/PreferencesContext';
import { formatCityTime } from '../../utils/dateHelpers';

export const THEME_META = {
  auto: { icon: SunMoon, label: 'Auto', hint: 'Day & night by sunrise/sunset' },
  system: { icon: Monitor, label: 'System', hint: 'Match your device' },
  light: { icon: Sun, label: 'Light', hint: 'Always light' },
  dark: { icon: Moon, label: 'Dark', hint: 'Always dark' },
};

/** One-line explanation of what Auto is doing right now. */
export function useAutoThemeStatus() {
  const { sun, phase } = usePreferences();
  if (!phase) return 'Pick a city to follow its sunrise and sunset. Until then, your device setting is used.';
  const at = formatCityTime(phase.nextChange, sun.offset);
  return phase.isDay
    ? `Daytime in ${sun.place}: dark mode starts at sunset (${at}).`
    : `Night in ${sun.place}: light mode returns at sunrise (${at}).`;
}

/** Header dropdown: menu button pattern with radio items. */
export function ThemeMenu() {
  const { theme, setTheme, resolvedTheme } = usePreferences();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuId = useId();
  const status = useAutoThemeStatus();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    ref.current?.querySelector('[aria-checked="true"]')?.focus();
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function onMenuKey(e) {
    const items = [...ref.current.querySelectorAll('[role="menuitemradio"]')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(i + 1) % items.length].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length].focus();
    }
  }

  // Auto shows the live state: a sun by day, a moon by night.
  const Icon = theme === 'auto' ? (resolvedTheme === 'dark' ? Moon : Sun) : THEME_META[theme].icon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Theme: ${THEME_META[theme].label}${theme === 'auto' ? ` (currently ${resolvedTheme})` : ''}`}
        className="relative grid size-11 place-items-center rounded-xl border border-line bg-surface text-muted hover:text-fg"
      >
        <Icon size={18} />
        {theme === 'auto' && (
          <span className="absolute bottom-1.5 right-1.5 rounded-[4px] bg-accent px-[3px] text-[8px] font-bold leading-[11px] text-white" aria-hidden="true">
            A
          </span>
        )}
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Theme"
          onKeyDown={onMenuKey}
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-line bg-surface p-1.5 shadow-xl anim-fade-up"
        >
          {THEMES.map((t) => {
            const { icon: I, label, hint } = THEME_META[t];
            return (
              <button
                key={t}
                type="button"
                role="menuitemradio"
                aria-checked={theme === t}
                onClick={() => {
                  setTheme(t);
                  setOpen(false);
                }}
                className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left hover:bg-surface-2 focus-visible:bg-surface-2"
              >
                <I size={16} className="shrink-0 text-muted" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-muted">{hint}</span>
                </span>
                {theme === t && <Check size={16} className="text-accent" aria-hidden="true" />}
              </button>
            );
          })}
          {theme === 'auto' && <p className="border-t border-line px-2.5 pb-1 pt-2 text-xs leading-relaxed text-muted">{status}</p>}
        </div>
      )}
    </div>
  );
}

/** Segmented control for the settings sheet. */
export function ThemeSegmented() {
  const { theme, setTheme } = usePreferences();
  const status = useAutoThemeStatus();
  return (
    <div>
      <div role="radiogroup" aria-label="Theme" className="grid grid-cols-4 gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-inset ring-line">
        {THEMES.map((t) => {
          const { icon: I, label } = THEME_META[t];
          const active = theme === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(t)}
              className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium ${
                active ? 'bg-surface text-fg shadow-card ring-1 ring-line' : 'text-muted hover:text-fg'
              }`}
            >
              <I size={16} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{theme === 'auto' ? status : THEME_META[theme].hint + '.'}</p>
    </div>
  );
}
