/** Skeletons mirror the real layout so content doesn't jump when data arrives. */
export function HeroSkeleton() {
  return (
    <section aria-busy="true" aria-label="Loading current weather" className="rounded-3xl border border-line bg-surface p-6 shadow-card sm:p-8">
      <div className="skeleton h-5 w-40" />
      <div className="skeleton mt-3 h-3 w-56" />
      <div className="mt-8 flex items-center gap-6">
        <div className="skeleton size-20 rounded-full" />
        <div className="space-y-3">
          <div className="skeleton h-14 w-32" />
          <div className="skeleton h-4 w-44" />
        </div>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    </section>
  );
}

export function ForecastSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-3 md:grid-cols-5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="skeleton h-14 rounded-xl md:h-44" />
      ))}
    </div>
  );
}

export function DetailsSkeleton() {
  return (
    <div aria-hidden="true" className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className={`skeleton h-32 rounded-2xl ${i === 4 ? 'col-span-2' : ''}`} />
      ))}
    </div>
  );
}

export function Spinner({ size = 16, className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
