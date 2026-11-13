/**
 * Daily reminder plumbing.
 *
 * Reality check (Nov 2026): a client-only web app cannot schedule a
 * notification for an exact time while every tab is closed.
 *   - setTimeout dies with the tab.
 *   - Notification Triggers (showTrigger) never shipped in a stable browser.
 *   - Exact, closed-browser delivery needs Web Push from a server (VAPID keys plus
 *     a scheduler), which the brief's "no backend" scope excludes.
 *
 * So reminders are delivered by the most reliable mechanisms available:
 *   1. Foreground scheduler: while any WeatherBoard tab or installed window
 *      is open, a timer checks every 30 s and fires through the service
 *      worker's showNotification() at the chosen time.
 *   2. Periodic Background Sync (Chromium, installed PWA): the browser wakes
 *      the service worker periodically, even with the app closed; the worker
 *      fires the reminder if it's due. The browser, not us, decides how often
 *      this runs (engagement-based, typically up to a few times a day), so
 *      timing is best-effort.
 *
 * The page and the service worker share reminder state through Cache Storage
 * (service workers cannot read localStorage).
 */

const REMINDER_CACHE = 'wb-reminder';
const REMINDER_URL = '/__wb/reminder.json';
export const PERIODIC_SYNC_TAG = 'wb-daily-reminder';
/** A morning reminder that arrives hours late is noise, so the catch-up window is limited. */
export const CATCH_UP_WINDOW_MS = 3 * 60 * 60 * 1000;

export function getSupport() {
  const hasWindow = typeof window !== 'undefined';
  const notifications = hasWindow && 'Notification' in window;
  const serviceWorker = hasWindow && 'serviceWorker' in navigator;
  return {
    notifications,
    serviceWorker,
    secureContext: hasWindow && window.isSecureContext,
    periodicSync: serviceWorker && 'PeriodicSyncManager' in window,
    standalone:
      hasWindow &&
      (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true),
  };
}

/** 'unsupported' | 'default' | 'granted' | 'denied' */
export function getPermission() {
  const s = getSupport();
  if (!s.notifications || !s.secureContext) return 'unsupported';
  return Notification.permission;
}

export async function requestPermission() {
  if (getPermission() === 'unsupported') return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    // Old Safari only supports the callback form.
    return new Promise((resolve) => Notification.requestPermission(resolve));
  }
}

async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return (await navigator.serviceWorker.getRegistration()) || null;
  } catch {
    return null;
  }
}

/** Show a notification, preferring the service worker (required on Android / installed apps). */
export async function showNotification(title, options = {}) {
  if (getPermission() !== 'granted') throw new Error('Notification permission is not granted');
  const opts = {
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-96.png',
    tag: 'wb-daily-reminder',
    renotify: true,
    data: { url: '/' },
    ...options,
  };
  const reg = await getRegistration();
  if (reg) return reg.showNotification(title, opts);
  // eslint-disable-next-line no-new
  new Notification(title, opts);
  return undefined;
}

// ---- Shared state with the service worker -----------------------------------

export async function readReminderState() {
  if (!('caches' in window)) return null;
  try {
    const cache = await caches.open(REMINDER_CACHE);
    const res = await cache.match(REMINDER_URL);
    return res ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function writeReminderState(patch) {
  if (!('caches' in window)) return;
  try {
    const current = (await readReminderState()) || {};
    const cache = await caches.open(REMINDER_CACHE);
    await cache.put(
      REMINDER_URL,
      new Response(JSON.stringify({ ...current, ...patch }), { headers: { 'Content-Type': 'application/json' } }),
    );
  } catch (err) {
    console.warn('[reminder] Could not share state with the service worker:', err);
  }
}

// ---- Periodic Background Sync ------------------------------------------------

/**
 * Returns 'registered' | 'unsupported' | 'not-installed' | 'denied' | 'no-service-worker'.
 * Chromium only grants periodic sync to installed PWAs with enough site engagement.
 */
export async function registerBackgroundReminder() {
  const support = getSupport();
  if (!support.periodicSync) return 'unsupported';
  const reg = await getRegistration();
  if (!reg) return 'no-service-worker';
  try {
    const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
    if (status.state !== 'granted') return support.standalone ? 'denied' : 'not-installed';
    await reg.periodicSync.register(PERIODIC_SYNC_TAG, { minInterval: 60 * 60 * 1000 });
    return 'registered';
  } catch {
    return support.standalone ? 'denied' : 'not-installed';
  }
}

export async function unregisterBackgroundReminder() {
  const reg = await getRegistration();
  try {
    await reg?.periodicSync?.unregister(PERIODIC_SYNC_TAG);
  } catch {
    /* nothing registered */
  }
}

// ---- Scheduling logic (mirrored in public/service-worker.js) ------------------

export function localDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today's reminder moment in the device's local time. */
export function reminderMoment(time, now = new Date()) {
  const [h, m] = time.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  return target;
}

export function isReminderDue({ enabled, time, lastFired }, now = new Date()) {
  if (!enabled || !time) return false;
  const target = reminderMoment(time, now);
  const diff = now - target;
  return diff >= 0 && diff < CATCH_UP_WINDOW_MS && lastFired !== localDateKey(now);
}

export function nextReminderDate(time, now = new Date()) {
  const target = reminderMoment(time, now);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target;
}
