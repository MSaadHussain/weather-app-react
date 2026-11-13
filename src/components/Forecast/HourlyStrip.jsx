import { Droplet } from 'lucide-react';
import WeatherIcon from '../common/WeatherIcon';
import { usePreferences } from '../../context/PreferencesContext';
import { formatTemp, toFahrenheit } from '../../utils/weatherHelpers';
import { formatCityHour } from '../../utils/dateHelpers';

const COL = 100; // SVG units per column
const H = 44; // curve height in SVG units

/**
 * Next 24 hours in 3-hour steps with a temperature curve. On narrow screens
 * the strip scrolls inside its own container, never the page.
 */
export default function HourlyStrip({ data }) {
  const { unit } = usePreferences();
  const slots = data.hourly;
  if (!slots?.length) return null; // older cached snapshots predate hourly data

  const temps = slots.map((s) => (unit === 'F' ? toFahrenheit(s.temp) : s.temp));
  const lo = Math.min(...temps);
  const hi = Math.max(...temps);
  const span = Math.max(hi - lo, 1);
  const points = temps.map((t, i) => [i * COL + COL / 2, 6 + (1 - (t - lo) / span) * (H - 12)]);
  // Smooth curve: midpoint quadratic segments through each point.
  const d = points.reduce((acc, [x, y], i) => {
    if (i === 0) return `M${x} ${y}`;
    const [px, py] = points[i - 1];
    const mx = (px + x) / 2;
    return `${acc} Q${px} ${py} ${mx} ${(py + y) / 2} T${x} ${y}`;
  }, '');
  const width = slots.length * COL;

  return (
    <section aria-labelledby="hourly-title" className="rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="hourly-title" className="text-[15px] font-semibold tracking-tight">
          Next 24 hours
        </h2>
        <p className="text-xs text-muted">3-hour steps</p>
      </div>

      {/* `relative` keeps the absolutely positioned sr-only labels inside this
          scroller; without it they escape the clip and widen the page on mobile. */}
      <div className="scroll-strip relative -mx-5 mt-4 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
        <ol className="grid min-w-[34rem]" style={{ gridTemplateColumns: `repeat(${slots.length}, minmax(0, 1fr))` }}>
          {slots.map((s, i) => (
            <li key={s.time} className="flex flex-col items-center gap-2 text-center">
              <span className={`text-xs ${i === 0 ? 'font-semibold text-fg' : 'text-muted'}`}>
                {i === 0 ? 'Now' : formatCityHour(s.time, data.timezoneOffset)}
              </span>
              <WeatherIcon condition={s.condition} isDay={s.isDay} size={24} animated={false} />
              <span className="text-sm font-semibold tabular">{formatTemp(s.temp, unit)}</span>
              <span className={`flex h-4 items-center gap-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 ${s.pop >= 20 ? '' : 'invisible'}`}>
                <Droplet size={10} aria-hidden="true" />
                {s.pop ?? 0}%
              </span>
              <span className="sr-only">{s.condition.replace('-', ' ')}</span>
            </li>
          ))}
        </ol>
        <svg
          viewBox={`0 0 ${width} ${H}`}
          preserveAspectRatio="none"
          className="mt-1 h-11 w-full min-w-[34rem]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hourly-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${d} L${points.at(-1)[0]} ${H} L${points[0][0]} ${H} Z`} fill="url(#hourly-fill)" />
          <path d={d} fill="none" stroke="var(--accent)" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
        </svg>
      </div>
    </section>
  );
}
