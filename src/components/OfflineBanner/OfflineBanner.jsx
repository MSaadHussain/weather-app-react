import { WifiOff } from 'lucide-react';
import { timeAgo } from '../../utils/dateHelpers';

export default function OfflineBanner({ savedAt, cityName }) {
  return (
    <div role="status" className="border-b border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
      <div className="mx-auto flex max-w-7xl items-start gap-2.5 px-4 py-2.5 text-sm sm:items-center sm:px-6 lg:px-8">
        <WifiOff size={16} className="mt-0.5 shrink-0 sm:mt-0" aria-hidden="true" />
        <p className="leading-snug">
          <strong className="font-semibold">Offline mode.</strong>{' '}
          {savedAt
            ? `Showing ${cityName ? `${cityName} weather` : 'weather'} saved ${timeAgo(savedAt)}, which may be out of date. It will refresh when you reconnect.`
            : 'City search and live weather are unavailable until you reconnect.'}
        </p>
      </div>
    </div>
  );
}
