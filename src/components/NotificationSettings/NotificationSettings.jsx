import { useEffect, useId, useState } from 'react';
import { BellRing, BellOff, ShieldCheck, ShieldAlert, ShieldQuestion, CheckCircle2, CircleDashed, XCircle, Send, Info, Download } from 'lucide-react';
import Dialog from '../common/Dialog';
import { validateReminderTime } from '../../utils/validation';
import { nextReminderDate } from '../../services/notificationService';
import { useToast } from '../common/Toaster';
import { ThemeSegmented } from '../Settings/ThemeControls';
import { UnitToggle } from '../Header/Header';
import { useInstallPrompt } from '../../hooks/useInstallPrompt';

/** Grouped settings block, iOS/Android settings style: label, helper, control. */
function SettingsSection({ title, description, children, last }) {
  return (
    <section className={`${last ? '' : 'mb-6 border-b border-line pb-6'}`}>
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      {description && <p className="mt-0.5 text-xs leading-relaxed text-muted">{description}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

const PERMISSION_BADGE = {
  granted: { icon: ShieldCheck, text: 'Allowed', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' },
  denied: { icon: ShieldAlert, text: 'Blocked', cls: 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-300' },
  default: { icon: ShieldQuestion, text: 'Not asked yet', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300' },
  unsupported: { icon: BellOff, text: 'Not supported', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-400/10 dark:text-slate-300' },
};

function formatNext(date) {
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${isToday ? 'Today' : 'Tomorrow'} at ${time}`;
}

function DeliveryRow({ ok, pending, title, detail, action }) {
  const Icon = ok ? CheckCircle2 : pending ? CircleDashed : XCircle;
  return (
    <li className="flex gap-3">
      <Icon size={17} className={`mt-0.5 shrink-0 ${ok ? 'text-ok' : pending ? 'text-warn' : 'text-muted'}`} aria-hidden="true" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">{detail}</p>
        {action}
      </div>
    </li>
  );
}

function backgroundCopy(background, support) {
  switch (background) {
    case 'triggers':
      return { ok: true, detail: 'Scheduled with your browser for the next 7 days, so each reminder arrives on time even with WeatherBoard closed. Opening the app tops the schedule up.' };
    case 'registered':
      return { ok: true, detail: 'Active. Your browser will wake WeatherBoard in the background to deliver the reminder. The browser decides exactly when, so it may arrive a little late.' };
    case 'not-installed':
      return { pending: true, detail: 'Install WeatherBoard to let Chrome/Edge wake it in the background while it’s closed (the browser picks the exact moment, so it may be a little late). On a phone, use “Add to Home screen”.' };
    case 'denied':
      return { pending: true, detail: 'Your browser hasn’t granted background sync to this app yet (it requires some regular use). Reminders still arrive while the app is open.' };
    case 'unsupported':
      return { detail: `${support.periodicSync ? '' : 'This browser doesn’t support Periodic Background Sync (only Chrome/Edge do). '}Exact delivery with every window closed needs a push server, which this client-only app doesn’t have.` };
    case 'no-service-worker':
      return { detail: 'The offline service worker isn’t running (it only runs in the production build over HTTPS), so background checks are unavailable.' };
    default:
      return { detail: 'Turn on the reminder to enable background checks.' };
  }
}

export default function NotificationSettings({ open, onClose, reminder, cityName }) {
  const toast = useToast();
  const installer = useInstallPrompt();
  const { prefs, permission, support, background, active } = reminder;
  const [time, setTime] = useState(prefs.time);
  const [timeError, setTimeError] = useState(null);
  const [explaining, setExplaining] = useState(false);
  const [busy, setBusy] = useState(false);
  const timeId = useId();
  const errId = useId();

  useEffect(() => {
    if (open) {
      setTime(prefs.time);
      setTimeError(null);
      setExplaining(false);
    }
  }, [open, prefs.time]);

  const badge = PERMISSION_BADGE[permission];
  const BadgeIcon = badge.icon;

  function commitTime() {
    const err = validateReminderTime(time);
    setTimeError(err);
    if (!err && time !== prefs.time) {
      reminder.setTime(time);
      if (prefs.enabled) toast(`Daily reminder moved to ${time}.`, { type: 'success' });
    }
    return !err;
  }

  async function handleToggle() {
    if (prefs.enabled) {
      reminder.setEnabled(false);
      toast('Daily reminder turned off.', { type: 'info' });
      return;
    }
    if (!commitTime()) return;
    if (permission === 'granted') {
      reminder.setEnabled(true);
      toast(`Daily reminder set for ${time}.`, { type: 'success' });
      return;
    }
    // Never trigger the browser prompt cold: explain first, then ask on an explicit click.
    setExplaining(true);
  }

  async function handleAllow() {
    setBusy(true);
    try {
      const result = await reminder.askPermission();
      setExplaining(false);
      if (result === 'granted') {
        reminder.setEnabled(true);
        toast(`Notifications allowed. Daily reminder set for ${time}.`, { type: 'success' });
      } else if (result === 'denied') {
        toast('Notifications were blocked. Everything else in WeatherBoard still works.', { type: 'info' });
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleTest() {
    try {
      await reminder.sendTest();
      toast('Test notification sent. Check your system notifications.', { type: 'success' });
    } catch {
      toast('Your browser refused to show the notification. Check that notifications for this site are allowed in your system settings.', { type: 'error' });
    }
  }

  const bg = backgroundCopy(background, support);

  return (
    <Dialog open={open} onClose={onClose} variant="sheet" title="Settings">
      <SettingsSection title="Appearance">
        <ThemeSegmented />
      </SettingsSection>

      <SettingsSection title="Units" description="Temperature, wind speed and visibility switch together.">
        <UnitToggle className="w-fit" />
      </SettingsSection>

      <SettingsSection title="Daily reminder" description="One notification each morning with the day’s forecast. Nothing else." last>
      <div className="space-y-5">
        <div className="flex items-center justify-between rounded-xl border border-line px-3.5 py-3">
          <span className="text-sm text-muted">Browser permission</span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge.cls}`}>
            <BadgeIcon size={13} aria-hidden="true" /> {badge.text}
          </span>
        </div>

        {permission === 'unsupported' ? (
          <div className="rounded-xl bg-surface-2 p-4 text-sm leading-relaxed">
            <p className="font-medium">Reminders aren’t available in this browser</p>
            <p className="mt-1 text-muted">
              {!support.secureContext
                ? 'Notifications need a secure (HTTPS) connection.'
                : 'This browser doesn’t support web notifications. On iPhone and iPad, add WeatherBoard to your Home Screen first (iOS 16.4 or later), then open it from there.'}{' '}
              Search, forecasts, favourites and offline mode all work normally.
            </p>
          </div>
        ) : (
          <>
            <div>
              <label htmlFor={timeId} className="text-sm font-medium">
                Reminder time
              </label>
              <input
                id={timeId}
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  if (timeError) setTimeError(validateReminderTime(e.target.value));
                }}
                onBlur={commitTime}
                aria-invalid={!!timeError}
                aria-describedby={timeError ? errId : undefined}
                className={`mt-1.5 h-11 w-full rounded-xl border bg-surface px-3 text-sm tabular outline-none focus:ring-4 ${
                  timeError ? 'border-danger focus:ring-red-500/15' : 'border-line focus:border-accent focus:ring-[var(--ring)]'
                }`}
              />
              {timeError ? (
                <p id={errId} role="alert" className="mt-1.5 text-xs text-danger">
                  {timeError}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-muted">
                  Uses your device’s time zone. Forecast for {cityName || 'your last viewed city'}.
                </p>
              )}
            </div>

            {explaining ? (
              <div className="rounded-xl border border-blue-200 bg-accent-soft p-4 dark:border-blue-400/20" role="region" aria-label="Why we need permission">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Info size={16} className="text-accent" aria-hidden="true" /> Before your browser asks…
                </p>
                <p className="mt-2 text-sm leading-relaxed text-fg/85">
                  To remind you at <strong>{time}</strong>, WeatherBoard needs permission to show notifications. We send{' '}
                  <strong>one per day</strong> with that day’s forecast, and never for anything else. You can turn it off here anytime.
                </p>
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setExplaining(false)} className="h-11 rounded-lg px-4 text-sm font-medium text-muted hover:text-fg">
                    Not now
                  </button>
                  <button
                    type="button"
                    onClick={handleAllow}
                    disabled={busy}
                    className="h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {busy ? 'Waiting for your browser…' : 'Continue to browser prompt'}
                  </button>
                </div>
              </div>
            ) : permission === 'denied' ? (
              <div className="rounded-xl bg-danger-soft p-4 text-sm leading-relaxed">
                <p className="font-medium text-danger">Notifications are blocked for this site</p>
                <p className="mt-1 text-fg/80">
                  To turn them on, click the lock or settings icon in the address bar, set <strong>Notifications</strong> to <strong>Allow</strong>, then come back here. Nothing else is affected.
                </p>
              </div>
            ) : (
              <button
                type="button"
                role="switch"
                aria-checked={prefs.enabled}
                onClick={handleToggle}
                className="flex min-h-14 w-full items-center justify-between gap-4 rounded-xl border border-line px-4 py-3 text-left hover:bg-surface-2"
              >
                <span>
                  <span className="block text-sm font-medium">{prefs.enabled ? 'Reminder is on' : 'Turn on daily reminder'}</span>
                  <span className="block text-xs text-muted">
                    {active ? `Next: ${formatNext(nextReminderDate(prefs.time))}` : 'You’ll be asked for permission first'}
                  </span>
                </span>
                <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${prefs.enabled ? 'bg-blue-600' : 'bg-line'}`} aria-hidden="true">
                  <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${prefs.enabled ? 'left-6' : 'left-1'}`} />
                </span>
              </button>
            )}

            {active && (
              <>
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted">How it’s delivered</h3>
                  <ul className="mt-3 space-y-3">
                    <DeliveryRow ok title="While WeatherBoard is open" detail="On time, from any open tab or installed window, even in the background." />
                    <DeliveryRow
                      ok={bg.ok}
                      pending={bg.pending}
                      title="While WeatherBoard is closed"
                      detail={bg.detail}
                      action={
                        installer.status === 'available' && background !== 'triggers' ? (
                          <button
                            type="button"
                            onClick={async () => {
                              const outcome = await installer.install();
                              if (outcome === 'accepted') {
                                toast('WeatherBoard installed. Open it from your apps so it can check for reminders in the background.', { type: 'success' });
                              }
                            }}
                            className="mt-2 inline-flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            <Download size={15} aria-hidden="true" /> Install WeatherBoard
                          </button>
                        ) : null
                      }
                    />
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={handleTest}
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-line text-sm font-medium hover:bg-surface-2"
                >
                  <Send size={15} aria-hidden="true" /> Send a test notification
                </button>
              </>
            )}
          </>
        )}

        {!active && permission !== 'unsupported' && (
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <BellRing size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            Reminders are optional. Declining permission doesn’t affect anything else in WeatherBoard.
          </p>
        )}
      </div>
      </SettingsSection>
    </Dialog>
  );
}
