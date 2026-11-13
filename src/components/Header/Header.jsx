import { Bell, BellRing, Moon, Sun, Monitor } from 'lucide-react';
import CitySearch from '../Search/CitySearch';
import { usePreferences } from '../../context/PreferencesContext';
import { useNow } from '../../hooks/useNow';
import { formatClock, formatLongDate } from '../../utils/dateHelpers';

const THEME_ORDER = ['system', 'light', 'dark'];
const THEME_META = {
  system: { icon: Monitor, label: 'System theme' },
  light: { icon: Sun, label: 'Light theme' },
  dark: { icon: Moon, label: 'Dark theme' },
};

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/icons/favicon.svg" alt="" className="size-8 rounded-lg" width="32" height="32" />
      {/* On the narrowest phones the wordmark yields its space to the controls. */}
      <span className="text-[15px] font-semibold tracking-tight text-fg max-[399px]:sr-only">WeatherBoard</span>
    </div>
  );
}

export function UnitToggle() {
  const { unit, setUnit } = usePreferences();
  return (
    <div role="group" aria-label="Temperature unit" className="flex items-center rounded-xl border border-line bg-surface">
      {['C', 'F'].map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => setUnit(u)}
          aria-pressed={unit === u}
          className={`h-11 min-w-11 rounded-[11px] px-2 text-sm font-medium transition-colors ${
            unit === u ? 'bg-[#172554] text-white dark:bg-blue-600' : 'text-muted hover:text-fg'
          }`}
        >
          °{u}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = usePreferences();
  const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length];
  const { icon: Icon, label } = THEME_META[theme];
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      className="grid size-11 place-items-center rounded-xl border border-line bg-surface text-muted hover:text-fg"
      aria-label={`${label}. Switch to ${THEME_META[next].label.toLowerCase()}`}
      title={`${label} (click for ${THEME_META[next].label.toLowerCase()})`}
    >
      <Icon size={18} />
    </button>
  );
}

function Clock() {
  const now = useNow();
  return (
    <div className="hidden text-right leading-tight xl:block">
      <p className="text-sm font-medium tabular text-fg">{formatClock(now)}</p>
      <p className="text-xs text-muted">{formatLongDate(now)}</p>
    </div>
  );
}

export default function Header({ onSelectCity, onLocate, locating, onOpenReminders, reminderActive }) {
  const BellIcon = reminderActive ? BellRing : Bell;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md supports-[backdrop-filter]:bg-canvas/70">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
        <Logo />
        <div className="order-last w-full lg:order-none lg:mx-6 lg:max-w-xl lg:flex-1">
          <CitySearch onSelect={onSelectCity} onLocate={onLocate} locating={locating} />
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Clock />
          <UnitToggle />
          <ThemeToggle />
          <button
            type="button"
            onClick={onOpenReminders}
            className="relative grid size-11 place-items-center rounded-xl border border-line bg-surface text-muted hover:text-fg"
            aria-label={`Daily reminder settings${reminderActive ? ' (on)' : ''}`}
          >
            <BellIcon size={18} />
            {reminderActive && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-blue-500 ring-2 ring-surface" />}
          </button>
        </div>
      </div>
    </header>
  );
}
