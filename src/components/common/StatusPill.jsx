import { timeAgo } from '../../utils/dateHelpers';
import { useNow } from '../../hooks/useNow';

/**
 * Compact data-freshness indicator (Vercel-style deployment status):
 *   Live (green, pulsing) · Updating (blue) · Saved/offline (amber) · Failed (red)
 */
const TONES = {
  live: { dot: 'bg-emerald-500 text-emerald-500 anim-pulse-dot', text: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-500/20 bg-emerald-500/5' },
  updating: { dot: 'bg-blue-500 animate-pulse', text: 'text-blue-700 dark:text-blue-300', ring: 'ring-blue-500/20 bg-blue-500/5' },
  saved: { dot: 'bg-amber-500', text: 'text-amber-800 dark:text-amber-300', ring: 'ring-amber-500/25 bg-amber-500/5' },
  error: { dot: 'bg-red-500', text: 'text-red-700 dark:text-red-300', ring: 'ring-red-500/20 bg-red-500/5' },
};

export default function StatusPill({ status, data, isStale, online }) {
  const now = useNow();
  if (!data && status !== 'loading') return null;

  let tone;
  let label;
  if (status === 'loading') {
    tone = 'updating';
    label = data ? 'Updating…' : 'Loading…';
  } else if (!online || isStale) {
    tone = 'saved';
    label = `Saved ${timeAgo(data.cachedAt || data.fetchedAt, now.getTime())}`;
  } else if (status === 'error') {
    tone = 'error';
    label = 'Update failed';
  } else {
    tone = 'live';
    label = `Live · ${timeAgo(data.fetchedAt, now.getTime())}`;
  }
  const t = TONES[tone];
  return (
    <span role="status" className={`inline-flex h-7 items-center gap-2 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset ${t.ring} ${t.text}`}>
      <span className={`size-1.5 rounded-full ${t.dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
