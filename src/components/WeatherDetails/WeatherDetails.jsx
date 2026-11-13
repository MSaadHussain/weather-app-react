import { Droplets, Wind, Gauge, Eye, Sunrise, Sunset, Navigation } from 'lucide-react';
import { usePreferences } from '../../context/PreferencesContext';
import {
  formatWind,
  formatVisibility,
  windDirection,
  describeHumidity,
  describeVisibility,
  describePressure,
  describeWind,
} from '../../utils/weatherHelpers';
import { formatCityTime, daylightProgress } from '../../utils/dateHelpers';
import { useNow } from '../../hooks/useNow';

function DetailCard({ icon: Icon, title, children, className = '' }) {
  return (
    <div className={`flex flex-col rounded-2xl border border-line bg-surface p-4 shadow-card ${className}`}>
      <h3 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
        <Icon size={14} aria-hidden="true" /> {title}
      </h3>
      {children}
    </div>
  );
}

function Value({ value, unit }) {
  return (
    <p className="mt-3 text-2xl font-semibold tracking-tight tabular">
      {value}
      {unit && <span className="ml-1 text-sm font-medium text-muted">{unit}</span>}
    </p>
  );
}

export default function WeatherDetails({ data }) {
  const { unit } = usePreferences();
  const now = useNow();
  const c = data.current;
  const wind = formatWind(c.windSpeed, unit);
  const vis = formatVisibility(c.visibility, unit);
  const progress = daylightProgress(c.sunrise, c.sunset, now.getTime() / 1000);

  return (
    <section aria-labelledby="details-title">
      <h2 id="details-title" className="mb-3 text-[15px] font-semibold tracking-tight">
        Today’s details
      </h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <DetailCard icon={Droplets} title="Humidity">
          <Value value={c.humidity ?? '–'} unit="%" />
          <div className="mt-3 h-1.5 rounded-full bg-line" aria-hidden="true">
            <div className="h-full rounded-full bg-blue-500" style={{ width: `${c.humidity ?? 0}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">{describeHumidity(c.humidity)}</p>
        </DetailCard>

        <DetailCard icon={Wind} title="Wind">
          <div className="flex items-end justify-between">
            <Value value={wind.value} unit={wind.label} />
            {c.windDeg != null && (
              <span
                className="mb-1 grid size-9 place-items-center rounded-full border border-line"
                title={`From the ${windDirection(c.windDeg)}`}
              >
                {/* Meteorological degrees give where wind comes FROM; arrow points where it blows TO. */}
                <Navigation size={15} className="text-accent" style={{ transform: `rotate(${c.windDeg + 180 - 45}deg)` }} aria-hidden="true" />
              </span>
            )}
          </div>
          <p className="mt-auto pt-2 text-xs text-muted">
            {describeWind(c.windSpeed)}
            {c.windDeg != null && ` · from ${windDirection(c.windDeg)}`}
          </p>
        </DetailCard>

        <DetailCard icon={Gauge} title="Pressure">
          <Value value={c.pressure ?? '–'} unit="hPa" />
          <p className="mt-auto pt-2 text-xs text-muted">{describePressure(c.pressure)}</p>
        </DetailCard>

        <DetailCard icon={Eye} title="Visibility">
          <Value value={vis.value} unit={vis.label} />
          <p className="mt-auto pt-2 text-xs text-muted">{describeVisibility(c.visibility)}</p>
        </DetailCard>

        <DetailCard icon={Sunrise} title="Sunrise & sunset" className="col-span-2 md:col-span-2">
          {c.sunrise && c.sunset ? (
            <>
              <div className="relative mt-3 h-14" aria-hidden="true">
                <svg viewBox="0 0 200 56" className="h-full w-full" preserveAspectRatio="none">
                  <path d="M4 52 Q100 -20 196 52" fill="none" stroke="var(--line)" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
                </svg>
                {progress != null && (
                  <span
                    className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 shadow-[0_0_12px_3px_rgba(251,191,36,0.55)]"
                    style={{
                      left: `${2 + progress * 96}%`,
                      // quadratic bezier y for the arc above, mapped to the 56px box
                      top: `${((1 - progress) ** 2 * 52 + 2 * (1 - progress) * progress * -20 + progress ** 2 * 52) / 56 * 100}%`,
                    }}
                  />
                )}
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <p>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Sunrise size={13} aria-hidden="true" /> Sunrise
                  </span>
                  <span className="font-semibold tabular">{formatCityTime(c.sunrise, data.timezoneOffset)}</span>
                </p>
                <p className="text-right">
                  <span className="flex items-center justify-end gap-1 text-xs text-muted">
                    Sunset <Sunset size={13} aria-hidden="true" />
                  </span>
                  <span className="font-semibold tabular">{formatCityTime(c.sunset, data.timezoneOffset)}</span>
                </p>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">No sunrise/sunset today (polar day or night).</p>
          )}
        </DetailCard>
      </div>
    </section>
  );
}
