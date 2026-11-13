import { Bell, ChevronRight } from 'lucide-react';
import { OPENWEATHER_KEY, RAPIDAPI_KEY } from '../../services/config';

/** Compact entry point to the reminder settings sheet. */
export function ReminderCard({ reminder, onOpen }) {
  const { active, prefs, permission } = reminder;
  const status = active
    ? `Every day at ${prefs.time}`
    : permission === 'unsupported'
      ? 'Not supported in this browser'
      : permission === 'denied'
        ? 'Blocked in browser settings'
        : 'Off';
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-5 text-left shadow-card hover:border-accent/50"
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${active ? 'bg-accent-soft text-accent' : 'bg-surface-2 text-muted'}`}>
        <Bell size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold tracking-tight">Morning reminder</span>
        <span className="block truncate text-xs text-muted">{status}</span>
      </span>
      <ChevronRight size={16} className="text-muted" aria-hidden="true" />
    </button>
  );
}

function Row({ name, state, note }) {
  const colour = { live: 'bg-emerald-500', fallback: 'bg-amber-500', off: 'bg-slate-400', cached: 'bg-amber-500' }[state];
  return (
    <li className="flex items-start gap-2.5 py-2">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${colour}`} aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{name}</span>
        <span className="block text-xs text-muted">{note}</span>
      </span>
    </li>
  );
}

/** Transparent "which API answered" panel: useful for users and for debugging rate limits. */
export function DataSourcesCard({ data, online }) {
  const provider = data?.provider;
  const owmNote = !OPENWEATHER_KEY
    ? 'No API key configured, so Open-Meteo is used'
    : provider === 'openweathermap'
      ? 'Serving current weather & forecast'
      : provider === 'open-meteo'
        ? 'Unavailable or rate-limited; using fallback'
        : 'Primary weather provider';
  return (
    <section aria-labelledby="sources-title" className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h2 id="sources-title" className="text-[15px] font-semibold tracking-tight">
        Data sources
      </h2>
      <ul className="mt-2 divide-y divide-line">
        <Row name="OpenWeatherMap" state={provider === 'openweathermap' ? (data.cachedAt ? 'cached' : 'live') : 'off'} note={owmNote} />
        <Row
          name="Open-Meteo"
          state={provider === 'open-meteo' ? (data.cachedAt ? 'cached' : 'fallback') : 'off'}
          note={provider === 'open-meteo' ? 'Serving weather (keyless fallback)' : 'Standby fallback'}
        />
        <Row
          name="GeoDB Cities"
          state={!online ? 'off' : RAPIDAPI_KEY ? 'live' : 'fallback'}
          note={!online ? 'Offline' : RAPIDAPI_KEY ? 'City autocomplete & location lookup' : 'No RapidAPI key; Open-Meteo geocoding used'}
        />
      </ul>
    </section>
  );
}
