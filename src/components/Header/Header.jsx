import { Settings2 } from 'lucide-react';
import CitySearch from '../Search/CitySearch';
import { ThemeMenu } from '../Settings/ThemeControls';
import { usePreferences } from '../../context/PreferencesContext';
import { useNow } from '../../hooks/useNow';
import { formatClock, formatLongDate } from '../../utils/dateHelpers';

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/icons/favicon.svg" alt="" className="size-8 rounded-lg" width="32" height="32" />
      {/* On the narrowest phones the wordmark yields its space to the controls. */}
      <span className="text-[15px] font-semibold tracking-tight text-fg max-[399px]:sr-only">WeatherBoard</span>
    </div>
  );
}

export function UnitToggle({ className = '' }) {
  const { unit, setUnit } = usePreferences();
  return (
    <div role="radiogroup" aria-label="Temperature unit" className={`flex items-center rounded-xl border border-line bg-surface ${className}`}>
      {['C', 'F'].map((u) => (
        <button
          key={u}
          type="button"
          role="radio"
          onClick={() => setUnit(u)}
          aria-checked={unit === u}
          aria-label={u === 'C' ? 'Celsius' : 'Fahrenheit'}
          className={`h-11 min-w-11 rounded-[11px] px-2 text-sm font-medium ${
            unit === u ? 'bg-[#172554] text-white dark:bg-blue-600' : 'text-muted hover:text-fg'
          }`}
        >
          °{u}
        </button>
      ))}
    </div>
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

export default function Header({ onSelectCity, onLocate, locating, onOpenSettings, reminderActive, recent, onClearRecent }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/80 pt-[env(safe-area-inset-top)] backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6 lg:flex-nowrap lg:px-8">
        <Logo />
        <div className="order-last w-full lg:order-none lg:mx-6 lg:max-w-xl lg:flex-1">
          <CitySearch onSelect={onSelectCity} onLocate={onLocate} locating={locating} recent={recent} onClearRecent={onClearRecent} />
        </div>
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Clock />
          <UnitToggle />
          <div className="hidden sm:block">
            <ThemeMenu />
          </div>
          <button
            type="button"
            onClick={onOpenSettings}
            className="relative grid size-11 place-items-center rounded-xl border border-line bg-surface text-muted hover:text-fg"
            aria-label={`Settings and daily reminder${reminderActive ? ' (reminder on)' : ''}`}
          >
            <Settings2 size={18} />
            {reminderActive && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-blue-500 ring-2 ring-surface" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
