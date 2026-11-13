/**
 * Safe localStorage access.
 *
 * localStorage can be missing or throw (Safari private mode, storage disabled,
 * quota exceeded, sandboxed iframes). Rather than crash, we fall back to an
 * in-memory Map so the app keeps working for the current session, and expose
 * `isPersistent` so the UI can tell users their changes won't be remembered.
 */
const PREFIX = 'wb:';
const memory = new Map();

function detect() {
  try {
    const probe = `${PREFIX}__probe__`;
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export const isPersistent = typeof window !== 'undefined' && detect();

/**
 * Read a JSON value. `validate` guards against corrupted or outdated data:
 * if it returns false, the fallback is used and the bad value is discarded.
 */
export function readJSON(key, fallback, validate) {
  const fullKey = PREFIX + key;
  let raw;
  try {
    raw = isPersistent ? window.localStorage.getItem(fullKey) : memory.get(fullKey);
  } catch {
    raw = memory.get(fullKey);
  }
  if (raw == null) return fallback;
  try {
    const value = JSON.parse(raw);
    if (validate && !validate(value)) throw new Error('invalid shape');
    return value;
  } catch {
    console.warn(`[storage] Discarding corrupted value for "${key}"`);
    removeKey(key);
    return fallback;
  }
}

/** Returns true when the value was persisted to localStorage. */
export function writeJSON(key, value) {
  const fullKey = PREFIX + key;
  const raw = JSON.stringify(value);
  memory.set(fullKey, raw);
  if (!isPersistent) return false;
  try {
    window.localStorage.setItem(fullKey, raw);
    return true;
  } catch (err) {
    console.warn(`[storage] Could not persist "${key}":`, err?.name);
    return false;
  }
}

export function removeKey(key) {
  const fullKey = PREFIX + key;
  memory.delete(fullKey);
  try {
    if (isPersistent) window.localStorage.removeItem(fullKey);
  } catch {
    /* ignore */
  }
}

export const STORAGE_PREFIX = PREFIX;
