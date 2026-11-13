import { useCallback, useEffect, useState } from 'react';
import { readJSON, writeJSON, STORAGE_PREFIX } from '../services/storage';

/**
 * useState that persists to localStorage (via the safe storage wrapper) and
 * stays in sync across tabs through the `storage` event.
 */
export function useLocalStorage(key, initialValue, validate) {
  const [value, setValue] = useState(() => readJSON(key, initialValue, validate));

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        writeJSON(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_PREFIX + key) setValue(readJSON(key, initialValue, validate));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // initialValue/validate are expected to be stable for a given key
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [value, update];
}
