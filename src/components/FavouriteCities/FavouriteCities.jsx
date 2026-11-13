import { Star, X, AlertTriangle } from 'lucide-react';
import { MAX_FAVOURITES } from '../../hooks/useFavourites';
import { sameCity } from '../../hooks/useWeather';
import { isPersistent } from '../../services/storage';

/**
 * Quick-access favourites.
 *   variant="panel": sidebar card (desktop)
 *   variant="strip": horizontally scrollable chips (mobile/tablet), scrolling
 *                     inside its own container so the page never scrolls sideways.
 */
export default function FavouriteCities({ favourites, current, onSelect, onRequestRemove, variant = 'panel' }) {
  const storageWarning = !isPersistent && (
    <p className="flex items-start gap-1.5 text-xs text-warn">
      <AlertTriangle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
      Your browser is blocking storage, so favourites will be forgotten when you close this tab.
    </p>
  );

  if (variant === 'strip') {
    if (!favourites.length) return storageWarning || null;
    return (
      <nav aria-label="Favourite cities" className="-mx-4 sm:-mx-6">
        <ul className="scroll-strip flex gap-2 overflow-x-auto px-4 pb-1 sm:px-6">
          {favourites.map((city) => {
            const active = sameCity(city, current);
            return (
              <li key={city.id || `${city.lat},${city.lon}`} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onSelect(city)}
                  aria-current={active ? 'true' : undefined}
                  className={`flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
                    active
                      ? 'border-transparent bg-[#172554] text-white dark:bg-blue-600'
                      : 'border-line bg-surface text-fg hover:border-accent'
                  }`}
                >
                  <Star size={14} className={active ? 'fill-amber-300 text-amber-300' : 'fill-amber-400 text-amber-400'} aria-hidden="true" />
                  {city.name}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="px-4 sm:px-6">{storageWarning}</div>
      </nav>
    );
  }

  return (
    <section aria-labelledby="fav-title" className="rounded-3xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-baseline justify-between">
        <h2 id="fav-title" className="text-sm font-semibold tracking-tight">
          Favourite cities
        </h2>
        <span className="text-xs tabular text-muted" aria-label={`${favourites.length} of ${MAX_FAVOURITES} saved`}>
          {favourites.length}/{MAX_FAVOURITES}
        </span>
      </div>

      {favourites.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line px-4 py-6 text-center">
          <div className="mx-auto grid size-10 place-items-center rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-400/10">
            <Star size={18} />
          </div>
          <p className="mt-3 text-sm font-medium">No favourites yet</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Tap the star on any city to pin it here. You can save up to {MAX_FAVOURITES}.
          </p>
        </div>
      ) : (
        <ul className="mt-3 space-y-1">
          {favourites.map((city) => {
            const active = sameCity(city, current);
            return (
              <li key={city.id || `${city.lat},${city.lon}`} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelect(city)}
                  aria-current={active ? 'true' : undefined}
                  className={`flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl px-3 text-left transition-colors ${
                    active ? 'bg-accent-soft' : 'hover:bg-surface-2'
                  }`}
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${active ? 'bg-accent' : 'bg-line'}`}
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{city.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {[city.region, city.country].filter(Boolean).join(', ') || 'Saved location'}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onRequestRemove(city)}
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-muted opacity-100 hover:bg-danger-soft hover:text-danger lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                  aria-label={`Remove ${city.name} from favourites`}
                >
                  <X size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {storageWarning && <div className="mt-3">{storageWarning}</div>}
    </section>
  );
}
