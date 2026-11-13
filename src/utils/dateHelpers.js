/**
 * All city times are computed from the provider's UTC offset (seconds) rather
 * than the viewer's timezone, so "Today" and sunrise are correct for the city
 * being viewed, not for wherever the user is sitting.
 */

/** Returns a Date whose UTC fields equal the city's local wall-clock time. */
export function shiftToCity(unixSeconds, offsetSeconds = 0) {
  return new Date((unixSeconds + offsetSeconds) * 1000);
}

export function cityDateKey(unixSeconds, offsetSeconds = 0) {
  return shiftToCity(unixSeconds, offsetSeconds).toISOString().slice(0, 10);
}

export function formatCityTime(unixSeconds, offsetSeconds = 0) {
  if (unixSeconds == null) return '–';
  return shiftToCity(unixSeconds, offsetSeconds).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

/** "14:00" / "2 PM" style hour label in the city's local time. */
export function formatCityHour(unixSeconds, offsetSeconds = 0) {
  // hour + minutes so 24-hour locales show "05:00" rather than an ambiguous "05"
  return shiftToCity(unixSeconds, offsetSeconds).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
}

/** dateKey 'YYYY-MM-DD' -> { weekday: 'Mon', long: 'Monday', short: '14 Nov' } */
export function formatDayKey(dateKey) {
  const d = new Date(`${dateKey}T12:00:00Z`);
  return {
    weekday: d.toLocaleDateString([], { weekday: 'short', timeZone: 'UTC' }),
    long: d.toLocaleDateString([], { weekday: 'long', timeZone: 'UTC' }),
    short: d.toLocaleDateString([], { day: 'numeric', month: 'short', timeZone: 'UTC' }),
  };
}

export function formatLongDate(date = new Date()) {
  return date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
}

export function formatClock(date = new Date()) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** "just now", "5 min ago", "3 h ago", "2 days ago" */
export function timeAgo(timestampMs, now = Date.now()) {
  const diff = Math.max(0, now - timestampMs);
  const min = Math.round(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

/** Daylight progress 0..1 between sunrise and sunset, or null at night. */
export function daylightProgress(sunrise, sunset, nowSeconds = Date.now() / 1000) {
  if (!sunrise || !sunset || sunset <= sunrise) return null;
  if (nowSeconds < sunrise || nowSeconds > sunset) return null;
  return (nowSeconds - sunrise) / (sunset - sunrise);
}
