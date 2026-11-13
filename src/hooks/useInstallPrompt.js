import { useCallback, useEffect, useState } from 'react';

/**
 * Captures Chrome/Edge's `beforeinstallprompt` so the app can offer its own
 * "Install" button. Installing matters for reminders: Periodic Background Sync,
 * the only client-side way to wake the app while it's closed, is granted to
 * installed PWAs only.
 *
 * status: 'installed' | 'available' | 'unavailable'
 */
let deferredPrompt = null; // module-level: the event fires once, possibly before React mounts
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event('wb:installable'));
  });
}

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export function useInstallPrompt() {
  const [status, setStatus] = useState(() => (isStandalone() ? 'installed' : deferredPrompt ? 'available' : 'unavailable'));

  useEffect(() => {
    const onInstallable = () => setStatus('available');
    const onInstalled = () => {
      deferredPrompt = null;
      setStatus('installed');
    };
    window.addEventListener('wb:installable', onInstallable);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('wb:installable', onInstallable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  /** Must be called from a click. Resolves 'accepted' | 'dismissed' | 'unavailable'. */
  const install = useCallback(async () => {
    if (!deferredPrompt) return 'unavailable';
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (outcome !== 'accepted') setStatus('unavailable');
    return outcome;
  }, []);

  return { status, install };
}
