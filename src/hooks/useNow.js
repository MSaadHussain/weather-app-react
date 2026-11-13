import { useEffect, useState } from 'react';

/** Current Date, refreshed on an interval aligned to the next whole minute. */
export function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let interval;
    const align = setTimeout(() => {
      setNow(new Date());
      interval = setInterval(() => setNow(new Date()), intervalMs);
    }, intervalMs - (Date.now() % intervalMs));
    return () => {
      clearTimeout(align);
      clearInterval(interval);
    };
  }, [intervalMs]);
  return now;
}
