import { Droplet } from 'lucide-react';
import WeatherIcon from '../common/WeatherIcon';
import { usePreferences } from '../../context/PreferencesContext';
import { formatTemp } from '../../utils/weatherHelpers';
import { formatDayKey, cityDateKey } from '../../utils/dateHelpers';

/**
 * Five-day outlook. Each day's min–max is drawn as a bar positioned on the
 * whole week's temperature range, so warmer/cooler days are visible at a glance.
 * Desktop/tablet: five columns. Mobile: compact rows.
 */
export default function Forecast({ data }) {
  const { unit } = usePreferences();
  const days = data.daily;
  const lo = Math.min(...days.map((d) => d.min));
  const hi = Math.max(...days.map((d) => d.max));
  const span = Math.max(hi - lo, 1);
  const todayKey = cityDateKey(Math.floor(Date.now() / 1000), data.timezoneOffset);

  return (
    <section aria-labelledby="forecast-title" className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 id="forecast-title" className="text-[15px] font-semibold tracking-tight">
          5-day forecast
        </h2>
        <p className="text-xs text-muted">Daily low – high</p>
      </div>

      <ol className="mt-4 divide-y divide-line md:grid md:grid-cols-5 md:gap-3 md:divide-y-0">
        {days.map((d, i) => {
          const label = d.dateKey === todayKey ? 'Today' : formatDayKey(d.dateKey).weekday;
          const left = ((d.min - lo) / span) * 100;
          const width = Math.max(((d.max - d.min) / span) * 100, 4);
          return (
            <li
              key={d.dateKey}
              className="grid grid-cols-[4.5rem_auto_1fr] items-center gap-3 py-3 anim-fade-up md:flex md:flex-col md:gap-2 md:rounded-2xl md:bg-surface-2 md:px-3 md:py-4 md:text-center md:ring-1 md:ring-inset md:ring-line"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="leading-tight">
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted">{formatDayKey(d.dateKey).short}</p>
              </div>

              <div className="flex items-center gap-2 md:flex-col md:gap-1">
                <WeatherIcon condition={d.condition} size={30} animated={false} label={d.description} />
                {d.pop != null && d.pop >= 10 ? (
                  <span className="flex items-center gap-0.5 text-xs font-medium text-blue-600 dark:text-blue-400" title="Chance of precipitation">
                    <Droplet size={11} aria-hidden="true" />
                    {d.pop}%
                  </span>
                ) : (
                  <span className="hidden text-xs md:block md:invisible">0%</span>
                )}
              </div>

              <div className="min-w-0 md:w-full">
                <p className="hidden truncate text-xs text-muted md:block" title={d.description}>
                  {d.description}
                </p>
                <div className="flex items-center gap-2.5 md:mt-3 md:flex-wrap md:justify-center md:gap-x-1.5 md:gap-y-2.5">
                  <span className="w-9 text-right text-sm tabular text-muted md:order-2 md:w-auto">{formatTemp(d.min, unit)}</span>
                  <div className="relative h-1.5 flex-1 rounded-full bg-line md:order-3 md:basis-full" aria-hidden="true">
                    <div
                      className="absolute inset-y-0 rounded-full bg-gradient-to-r from-sky-400 to-amber-400"
                      style={{ left: `${left}%`, width: `${width}%` }}
                    />
                  </div>
                  <span className="w-9 text-sm font-semibold tabular md:order-1 md:w-auto md:text-base">{formatTemp(d.max, unit)}</span>
                </div>
                <p className="sr-only">
                  {d.description}. Low {formatTemp(d.min, unit, { withUnit: true })}, high {formatTemp(d.max, unit, { withUnit: true })}.
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
