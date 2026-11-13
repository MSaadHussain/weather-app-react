import { useEffect, useId, useRef, useState } from 'react';
import { Search, X, AlertCircle, MapPin, RefreshCw, LocateFixed } from 'lucide-react';
import { useCitySearch } from '../../hooks/useCitySearch';
import { validateCityQuery } from '../../utils/validation';
import { describeSearchError } from '../../utils/errorMessages';
import { Spinner } from '../Loading/Skeletons';

/**
 * WAI-ARIA combobox with live suggestions.
 *
 * Validation timing (Stripe-style):
 *   - on blur: only if the user has typed something (a pristine field isn't nagged)
 *   - on submit (Enter): always
 *   - once an error is visible, it re-validates on every keystroke so it clears
 *     as soon as the input becomes valid.
 */
export default function CitySearch({ onSelect, onLocate, locating }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const inputRef = useRef(null);
  const listId = useId();
  const errorId = useId();

  const search = useCitySearch(query);
  const { status, results } = search;
  const showList = open && status !== 'idle';

  useEffect(() => setActive(-1), [results]);

  // Enter pressed while suggestions were still loading: resolve once they arrive.
  useEffect(() => {
    if (!pendingSubmit || status === 'loading' || status === 'idle') return;
    setPendingSubmit(false);
    if (status === 'success') choose(results[0]);
    else if (status === 'empty') setError(noResultsMessage(query));
    else if (status === 'error') setError(describeSearchError(search.error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSubmit, status]);

  function choose(city) {
    if (!city) return;
    onSelect(city);
    setQuery('');
    setDirty(false);
    setError(null);
    setOpen(false);
    inputRef.current?.blur();
  }

  function handleChange(e) {
    const value = e.target.value;
    setQuery(value);
    setDirty(true);
    setOpen(true);
    if (error) setError(validateCityQuery(value));
  }

  function handleBlur() {
    setOpen(false);
    if (dirty) setError(validateCityQuery(query));
  }

  function submit() {
    const message = validateCityQuery(query);
    if (message) {
      setError(message);
      return;
    }
    if (active >= 0 && results[active]) return choose(results[active]);
    if (status === 'success') return choose(results[0]);
    if (status === 'empty') return setError(noResultsMessage(query));
    if (status === 'error') {
      search.retry();
      setPendingSubmit(true);
      return;
    }
    setPendingSubmit(true); // still debouncing/loading
  }

  function handleKeyDown(e) {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setOpen(true);
        if (results.length) setActive((i) => (i + 1) % results.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (results.length) setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
        break;
      case 'Enter':
        e.preventDefault();
        submit();
        break;
      case 'Escape':
        if (open) setOpen(false);
        else {
          setQuery('');
          setError(null);
        }
        break;
      default:
    }
  }

  const activeId = active >= 0 ? `${listId}-opt-${active}` : undefined;

  return (
    <div className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        noValidate
      >
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search for a city
        </label>
        <div
          className={`flex h-12 items-center gap-1 rounded-xl border bg-surface pl-3 transition-shadow sm:h-11 focus-within:ring-4 ${
            error ? 'border-danger focus-within:ring-red-500/15' : 'border-line focus-within:border-accent focus-within:ring-[var(--ring)]'
          }`}
        >
          {status === 'loading' || pendingSubmit ? (
            <Spinner size={16} className="text-muted" />
          ) : (
            <Search size={17} className="shrink-0 text-muted" aria-hidden="true" />
          )}
          <input
            ref={inputRef}
            id={`${listId}-input`}
            type="text"
            role="combobox"
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
            enterKeyHint="search"
            placeholder="Search any city…"
            value={query}
            onChange={handleChange}
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            aria-expanded={showList}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeId}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-fg outline-none placeholder:text-muted focus-visible:outline-none sm:text-sm"
          />
          {query && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery('');
                setError(null);
                inputRef.current?.focus();
              }}
              className="grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
          {onLocate && (
            <button
              type="button"
              onClick={onLocate}
              disabled={locating}
              className="grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg disabled:opacity-60"
              aria-label="Use my current location"
              title="Use my current location"
            >
              {locating ? <Spinner size={15} /> : <LocateFixed size={17} />}
            </button>
          )}
        </div>
      </form>

      {error && !showList && (
        <p
          id={errorId}
          className="absolute left-0 right-0 top-full z-30 mt-1.5 flex items-start gap-1.5 rounded-lg bg-surface px-2 py-1.5 text-[13px] leading-snug text-danger shadow-card"
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {showList && (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-xl anim-fade-up"
          onMouseDown={(e) => e.preventDefault()} // keep focus in the input while clicking
        >
          {status === 'loading' && results.length === 0 && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted">
              <Spinner size={14} /> Searching cities…
            </div>
          )}

          {status === 'empty' && (
            <div className="px-4 py-3 text-sm">
              <p className="font-medium">No cities match “{query.trim()}”</p>
              <p className="mt-0.5 text-muted">Check the spelling, or try a larger city nearby.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-3 px-4 py-3 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
              <p className="flex-1 text-fg">{describeSearchError(search.error)}</p>
              <button
                type="button"
                onClick={search.retry}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-xs font-medium hover:bg-surface-2"
              >
                <RefreshCw size={13} /> Retry
              </button>
            </div>
          )}

          <ul id={listId} role="listbox" aria-label="City suggestions" className="max-h-80 overflow-y-auto py-1">
            {results.map((city, i) => (
              <li
                key={city.id}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                onClick={() => choose(city)}
                onMouseEnter={() => setActive(i)}
                className={`flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 text-sm ${i === active ? 'bg-accent-soft' : ''}`}
              >
                <MapPin size={15} className="shrink-0 text-muted" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium text-fg">{city.name}</span>
                  <span className="text-muted">{[city.region, city.country].filter(Boolean).length ? `, ${[city.region, city.country].filter(Boolean).join(', ')}` : ''}</span>
                </span>
                {city.countryCode && (
                  <span aria-hidden="true" className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted ring-1 ring-inset ring-line">
                    {city.countryCode.toUpperCase()}
                  </span>
                )}
              </li>
            ))}
          </ul>
          {status === 'success' && search.source === 'open-meteo' && (
            <p className="border-t border-line px-4 py-1.5 text-[11px] text-muted">Suggestions from Open-Meteo (GeoDB unavailable)</p>
          )}
        </div>
      )}
    </div>
  );
}

function noResultsMessage(query) {
  return `No city called “${query.trim()}” was found. Check the spelling, or try a larger city nearby.`;
}
