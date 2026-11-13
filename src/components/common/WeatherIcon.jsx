import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from 'lucide-react';

/**
 * Condition icon with a subtle CSS animation per weather type (sun turns,
 * clouds drift, rain bobs, lightning flickers). Animations are disabled
 * automatically for users who prefer reduced motion (see index.css).
 */
const MAP = {
  clear: { day: Sun, night: Moon, anim: { day: 'anim-spin-slow', night: 'anim-bob' }, tint: { day: 'text-amber-400', night: 'text-indigo-300' } },
  'partly-cloudy': { day: CloudSun, night: CloudMoon, anim: 'anim-drift', tint: { day: 'text-amber-400', night: 'text-indigo-300' } },
  cloudy: { day: Cloud, night: Cloud, anim: 'anim-drift', tint: 'text-slate-400' },
  fog: { day: CloudFog, night: CloudFog, anim: 'anim-drift', tint: 'text-slate-400' },
  drizzle: { day: CloudDrizzle, night: CloudDrizzle, anim: 'anim-bob', tint: 'text-sky-500' },
  rain: { day: CloudRain, night: CloudRain, anim: 'anim-bob', tint: 'text-blue-500' },
  snow: { day: CloudSnow, night: CloudSnow, anim: 'anim-bob', tint: 'text-sky-300' },
  thunderstorm: { day: CloudLightning, night: CloudLightning, anim: 'anim-flash', tint: 'text-violet-500' },
};

const pick = (v, isDay) => (typeof v === 'string' ? v : isDay ? v.day : v.night);

export default function WeatherIcon({ condition, isDay = true, size = 32, animated = true, onDark = false, className = '', label }) {
  const entry = MAP[condition] || MAP.cloudy;
  const Icon = isDay ? entry.day : entry.night;
  const tint = onDark ? 'text-white' : pick(entry.tint, isDay);
  return (
    <span
      className={`inline-flex shrink-0 ${animated ? pick(entry.anim, isDay) : ''} ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Icon size={size} strokeWidth={1.75} className={tint} />
    </span>
  );
}
