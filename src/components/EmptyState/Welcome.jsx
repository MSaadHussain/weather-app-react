import { LocateFixed, Search, AlertCircle } from 'lucide-react';
import { Spinner } from '../Loading/Skeletons';

// Starting points only (names + coordinates). All weather shown is fetched live.
const SUGGESTED = [
  { id: 'sug-karachi', name: 'Karachi', region: 'Sindh', country: 'Pakistan', countryCode: 'PK', lat: 24.8607, lon: 67.0011 },
  { id: 'sug-lahore', name: 'Lahore', region: 'Punjab', country: 'Pakistan', countryCode: 'PK', lat: 31.5497, lon: 74.3436 },
  { id: 'sug-london', name: 'London', region: 'England', country: 'United Kingdom', countryCode: 'GB', lat: 51.5072, lon: -0.1276 },
  { id: 'sug-dubai', name: 'Dubai', region: 'Dubai', country: 'United Arab Emirates', countryCode: 'AE', lat: 25.2048, lon: 55.2708 },
  { id: 'sug-tokyo', name: 'Tokyo', region: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.6762, lon: 139.6503 },
  { id: 'sug-nyc', name: 'New York', region: 'New York', country: 'United States', countryCode: 'US', lat: 40.7128, lon: -74.006 },
];

export default function Welcome({ onSelect, onLocate, locating, locateError, geoSupported }) {
  return (
    <section className="rounded-3xl border border-line bg-surface px-6 py-12 text-center shadow-card sm:px-12 sm:py-16 anim-fade-up">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#172554] to-blue-600 text-white shadow-lg">
        <Search size={24} />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">Check the weather anywhere</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted sm:text-base">
        Search for a city above to see current conditions and a 5-day forecast. Star the ones you check often.
      </p>

      {geoSupported && (
        <button
          type="button"
          onClick={onLocate}
          disabled={locating}
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-[#172554] px-5 text-sm font-semibold text-white hover:bg-[#1e3a8a] disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {locating ? <Spinner /> : <LocateFixed size={16} />}
          {locating ? 'Finding you…' : 'Use my location'}
        </button>
      )}
      {locateError && (
        <p role="alert" className="mx-auto mt-3 flex max-w-sm items-start justify-center gap-1.5 text-left text-sm text-danger">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /> {locateError}
        </p>
      )}

      <div className="mt-10">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Or start with</p>
        <ul className="mt-3 flex flex-wrap justify-center gap-2">
          {SUGGESTED.map((city) => (
            <li key={city.id}>
              <button
                type="button"
                onClick={() => onSelect(city)}
                className="h-11 rounded-full border border-line bg-surface-2 px-4 text-sm font-medium hover:border-accent hover:text-accent"
              >
                {city.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
