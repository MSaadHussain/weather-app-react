import { CloudOff, RefreshCw } from 'lucide-react';
import { Spinner } from '../Loading/Skeletons';

/** Full error card: what failed, why, and a clear next action. */
export default function ErrorState({ title, detail, onRetry, retrying }) {
  return (
    <section
      role="alert"
      className="rounded-3xl border border-line bg-surface p-6 text-center shadow-card sm:p-10"
    >
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-danger-soft text-danger">
        <CloudOff size={22} />
      </div>
      <h2 className="mt-4 text-lg font-semibold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">{detail}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#172554] px-5 text-sm font-semibold text-white hover:bg-[#1e3a8a] disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          {retrying ? <Spinner /> : <RefreshCw size={16} />}
          {retrying ? 'Retrying…' : 'Try again'}
        </button>
      )}
    </section>
  );
}
