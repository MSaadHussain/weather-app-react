import { useCallback, useEffect, useMemo, useState } from 'react';
import HourlyStrip from '../components/Forecast/HourlyStrip';
import StatusPill from '../components/common/StatusPill';
import { useRecentCities } from '../hooks/useRecentCities';
import Header from '../components/Header/Header';
import OfflineBanner from '../components/OfflineBanner/OfflineBanner';
import WeatherHero from '../components/WeatherCard/WeatherHero';
import Forecast from '../components/Forecast/Forecast';
import WeatherDetails from '../components/WeatherDetails/WeatherDetails';
import FavouriteCities from '../components/FavouriteCities/FavouriteCities';
import NotificationSettings from '../components/NotificationSettings/NotificationSettings';
import Welcome from '../components/EmptyState/Welcome';
import ErrorState from '../components/Error/ErrorState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { ReminderCard, DataSourcesCard } from '../components/Sidebar/StatusCards';
import { HeroSkeleton, ForecastSkeleton, DetailsSkeleton } from '../components/Loading/Skeletons';
import { useToast } from '../components/common/Toaster';
import { useWeather, readSnapshot } from '../hooks/useWeather';
import { useFavourites } from '../hooks/useFavourites';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useGeolocation } from '../hooks/useGeolocation';
import { useReminder } from '../hooks/useReminder';
import { useNow } from '../hooks/useNow';
import { usePreferences } from '../context/PreferencesContext';
import { describeWeatherError } from '../utils/errorMessages';
import { formatTemp } from '../utils/weatherHelpers';
import { formatLongDate, formatClock } from '../utils/dateHelpers';

const isCity = (c) => c === null || (c && typeof c.lat === 'number' && typeof c.lon === 'number' && typeof c.name === 'string');

export default function Dashboard() {
  const toast = useToast();
  const { unit, setSun } = usePreferences();
  const { recent, remember, clear: clearRecent } = useRecentCities();
  const online = useOnlineStatus();
  const now = useNow();

  // The selected city survives reloads; fall back to the last weather snapshot's city.
  const [city, setCity] = useLocalStorage('last-city', readSnapshot()?.city ?? null, isCity);
  const weather = useWeather(city);
  const { favourites, isFavourite, addFavourite, removeFavourite } = useFavourites();
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [remindersOpen, setRemindersOpen] = useState(false);

  const selectCity = useCallback(
    (next) => {
      setCity(next);
      remember(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setCity, remember],
  );
  const geo = useGeolocation(selectCity);

  // One-line forecast for the reminder notification.
  const summary = useMemo(() => {
    if (!weather.data || !city) return null;
    const c = weather.data.current;
    return `${city.name}: ${formatTemp(c.temp, unit)} and ${c.description.toLowerCase()}. High ${formatTemp(c.high, unit)}, low ${formatTemp(c.low, unit)}.`;
  }, [weather.data, city, unit]);
  const reminder = useReminder({ city, summary, unit });

  // Feed the selected city's sunrise/sunset to the Auto (day/night) theme.
  const sunrise = weather.data?.current.sunrise;
  const sunset = weather.data?.current.sunset;
  const offset = weather.data?.timezoneOffset;
  useEffect(() => {
    setSun(sunrise && sunset && city ? { sunrise, sunset, offset, place: city.name } : null);
  }, [sunrise, sunset, offset, city, setSun]);

  function toggleFavourite() {
    if (!city) return;
    if (isFavourite(city)) {
      setPendingRemoval(city);
      return;
    }
    const result = addFavourite(city);
    toast(result.ok ? `${city.name} saved to favourites.` : result.reason, { type: result.ok ? 'success' : 'error' });
  }

  function confirmRemoval() {
    removeFavourite(pendingRemoval);
    toast(`${pendingRemoval.name} removed from favourites.`, { type: 'info' });
    setPendingRemoval(null);
  }

  const { status, data, error, isStale } = weather;
  const errorCopy = status === 'error' ? describeWeatherError(error, city?.name) : null;

  let main;
  if (!city) {
    main = (
      <Welcome
        onSelect={selectCity}
        onLocate={geo.locate}
        locating={geo.status === 'locating'}
        locateError={geo.error}
        geoSupported={geo.supported}
      />
    );
  } else if (!data && status === 'loading') {
    main = (
      <>
        <HeroSkeleton />
        <div className="skeleton h-40 rounded-2xl" aria-hidden="true" />
        <ForecastSkeleton />
        <DetailsSkeleton />
      </>
    );
  } else if (!data && status === 'error') {
    main = <ErrorState title={errorCopy.title} detail={errorCopy.detail} onRetry={weather.refresh} />;
  } else if (data) {
    main = (
      <>
        {status === 'error' && (
          // We have saved data to show, but the refresh failed: say so without hiding the data.
          <div role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
            <strong className="font-semibold">{errorCopy.title}.</strong> {errorCopy.detail.replace(/ and there is no saved copy for this city yet\./, '.')} Showing your saved copy below.
          </div>
        )}
        <WeatherHero
          city={city}
          data={data}
          isStale={isStale}
          refreshing={status === 'loading'}
          onRefresh={weather.refresh}
          isFavourite={isFavourite(city)}
          onToggleFavourite={toggleFavourite}
        />
        <HourlyStrip data={data} />
        <Forecast data={data} />
        <WeatherDetails data={data} />
      </>
    );
  }

  const favouritesPanel = (
    <FavouriteCities favourites={favourites} current={city} onSelect={selectCity} onRequestRemove={setPendingRemoval} />
  );

  return (
    <div className="min-h-dvh">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-lg">
        Skip to weather
      </a>
      <Header
        onSelectCity={selectCity}
        onLocate={geo.locate}
        locating={geo.status === 'locating'}
        onOpenSettings={() => setRemindersOpen(true)}
        reminderActive={reminder.active}
        recent={recent}
        onClearRecent={clearRecent}
      />
      {!online && <OfflineBanner savedAt={data ? data.cachedAt || data.fetchedAt : null} cityName={data ? city?.name : null} />}

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        {/* Context bar: today's date (the header shows it from xl) and data freshness. */}
        <div className="mb-4 flex min-h-7 items-center justify-between gap-3">
          <p className="text-sm text-muted">
            <span className="font-medium text-fg">{formatLongDate(now)}</span>
            <span className="tabular xl:hidden"> · {formatClock(now)}</span>
          </p>
          {city && <StatusPill status={status} data={data} isStale={isStale} online={online} />}
        </div>

        <div className="mb-4 lg:hidden">
          <FavouriteCities variant="strip" favourites={favourites} current={city} onSelect={selectCity} />
        </div>

        {geo.error && city && (
          <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {geo.error}
          </p>
        )}

        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
          <main id="main" className="min-w-0 space-y-6" aria-live="polite" aria-busy={status === 'loading'}>
            {main}
          </main>

          <aside className="mt-6 space-y-6 lg:mt-0" aria-label="Favourites and settings">
            {favouritesPanel}
            <ReminderCard reminder={reminder} onOpen={() => setRemindersOpen(true)} />
            <DataSourcesCard data={data} online={online} />
          </aside>
        </div>

        <footer className="mt-12 text-center text-xs text-muted">
          Weather data from OpenWeatherMap and Open-Meteo · City search by GeoDB Cities
        </footer>
      </div>

      <ConfirmDialog
        open={!!pendingRemoval}
        title={`Remove ${pendingRemoval?.name ?? ''} from favourites?`}
        description="You can add it again anytime by searching for it and tapping the star."
        confirmLabel="Remove"
        destructive
        onConfirm={confirmRemoval}
        onCancel={() => setPendingRemoval(null)}
      />

      <NotificationSettings open={remindersOpen} onClose={() => setRemindersOpen(false)} reminder={reminder} cityName={city?.name} />
    </div>
  );
}
