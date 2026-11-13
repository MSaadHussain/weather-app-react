import { Star, RefreshCw, MapPin, Droplets, Wind, Eye, Gauge } from 'lucide-react';
import WeatherIcon from '../common/WeatherIcon';
import { usePreferences } from '../../context/PreferencesContext';
import { formatTemp, formatWind, formatVisibility } from '../../utils/weatherHelpers';
import { formatCityTime, timeAgo } from '../../utils/dateHelpers';
import { useNow } from '../../hooks/useNow';
import { Spinner } from '../Loading/Skeletons';
import { solarPhase } from '../../context/PreferencesContext';

// The card's sky reflects the actual conditions and time of day at the city.
function skyFor(condition, isDay) {
  if (!isDay) {
    return condition === 'clear' || condition === 'partly-cloudy'
      ? 'from-[#1e1b4b] via-[#172554] to-[#020617]'
      : 'from-slate-800 via-[#172554] to-[#020617]';
  }
  switch (condition) {
    case 'clear':
      return 'from-sky-500 via-blue-600 to-[#172554]';
    case 'partly-cloudy':
      return 'from-sky-600 via-blue-700 to-[#172554]';
    case 'cloudy':
    case 'fog':
      return 'from-slate-500 via-slate-600 to-[#1e293b]';
    case 'snow':
      return 'from-slate-400 via-slate-500 to-slate-700';
    case 'thunderstorm':
      return 'from-slate-700 via-indigo-900 to-[#020617]';
    default:
      return 'from-slate-600 via-blue-800 to-[#172554]';
  }
}

const PROVIDER_NAME = { openweathermap: 'OpenWeatherMap', 'open-meteo': 'Open-Meteo' };

export default function WeatherHero({ city, data, isStale, refreshing, onRefresh, isFavourite, onToggleFavourite }) {
  const { unit } = usePreferences();
  const now = useNow();
  const c = data.current;
  const wind = formatWind(c.windSpeed, unit);
  const vis = formatVisibility(c.visibility, unit);
  const place = [city.region, city.country].filter(Boolean).join(', ');
  const nowSec = Math.floor(now.getTime() / 1000);
  const savedAt = data.cachedAt || data.fetchedAt;
  // Realtime day/night: the sky and icon flip at the city's actual sunrise/sunset,
  // not just at fetch time.
  const phase = solarPhase({ sunrise: c.sunrise, sunset: c.sunset }, nowSec);
  const isDay = phase ? phase.isDay : c.isDay;

  const stats = [
    { icon: Droplets, label: 'Humidity', value: c.humidity != null ? `${c.humidity}%` : '–' },
    { icon: Wind, label: 'Wind', value: `${wind.value} ${wind.label}` },
    { icon: Eye, label: 'Visibility', value: `${vis.value} ${vis.label}` },
    { icon: Gauge, label: 'Pressure', value: c.pressure != null ? `${c.pressure} hPa` : '–' },
  ];

  return (
    <section
      aria-labelledby="hero-city"
      className={`relative overflow-clip rounded-3xl bg-gradient-to-br ${skyFor(c.condition, isDay)} transition-[background-image] duration-700 p-5 text-white shadow-lg sm:p-8 anim-fade-up`}
    >
      {/* soft light bloom for depth */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 id="hero-city" className="flex items-center gap-1.5 text-xl font-semibold tracking-tight sm:text-2xl">
            <MapPin size={18} className="shrink-0 opacity-80" aria-hidden="true" />
            <span className="truncate">{city.name}</span>
          </h1>
          {place && <p className="mt-0.5 truncate text-sm text-white/75">{place}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="grid size-11 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white disabled:opacity-70"
            aria-label={refreshing ? 'Refreshing weather' : 'Refresh weather'}
          >
            {refreshing ? <Spinner size={16} /> : <RefreshCw size={18} />}
          </button>
          <button
            type="button"
            onClick={onToggleFavourite}
            aria-pressed={isFavourite}
            className="grid size-11 place-items-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white"
            aria-label={isFavourite ? `Remove ${city.name} from favourites` : `Save ${city.name} to favourites`}
          >
            <Star size={19} className={isFavourite ? 'fill-amber-300 text-amber-300' : ''} />
          </button>
        </div>
      </div>

      <div className="relative mt-6 flex flex-wrap items-center gap-x-6 gap-y-4 sm:mt-8">
        <WeatherIcon condition={c.condition} isDay={isDay} size={84} onDark className="drop-shadow-lg" />
        <div>
          <p className="text-7xl font-semibold leading-none tracking-tighter tabular sm:text-8xl">
            {formatTemp(c.temp, unit)}
          </p>
          <p className="mt-2 text-lg font-medium">{c.description}</p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm text-white/85 sm:ml-auto sm:text-right">
          <dt className="text-white/65">Feels like</dt>
          <dd className="font-medium tabular">{formatTemp(c.feelsLike, unit)}</dd>
          <dt className="text-white/65">High / Low</dt>
          <dd className="font-medium tabular">
            {formatTemp(c.high, unit)} / {formatTemp(c.low, unit)}
          </dd>
          <dt className="text-white/65">Local time</dt>
          <dd className="font-medium tabular">{formatCityTime(nowSec, data.timezoneOffset)}</dd>
        </dl>
      </div>

      <dl className="relative mt-6 grid grid-cols-2 gap-2 sm:mt-8 sm:grid-cols-4 sm:gap-3">
        {stats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-2xl bg-white/10 px-3.5 py-3 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
            <dt className="flex items-center gap-1.5 text-xs text-white/70">
              <Icon size={13} aria-hidden="true" /> {label}
            </dt>
            <dd className="mt-1 text-base font-semibold tabular">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="relative mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/75">
        {isStale && (
          <>
            <span className="inline-block size-2 rounded-full bg-amber-300" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-amber-200">Saved data</strong> from {timeAgo(savedAt, now.getTime())}, which may be out of date
            </span>
            <span aria-hidden="true">·</span>
          </>
        )}
        {c.observedAt && <span>Observed {formatCityTime(c.observedAt, data.timezoneOffset)} local</span>}
        <span aria-hidden="true">·</span>
        <span>Source: {PROVIDER_NAME[data.provider]}</span>
      </p>
    </section>
  );
}
