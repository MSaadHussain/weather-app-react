import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal: focus moves in on open and back to the trigger on close,
 * Tab is trapped inside, Escape and backdrop click close it.
 *
 * variant="center": small confirmation dialog
 * variant="sheet":  bottom sheet on mobile, right-hand drawer from md up
 */
export default function Dialog({ open, onClose, title, description, children, variant = 'center', initialFocusRef }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descId = useId();
  // Keep the latest onClose without re-running the open/close effect (which
  // would steal focus) every time the parent re-renders.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    const panel = panelRef.current;
    const first = initialFocusRef?.current || panel?.querySelector(FOCUSABLE);
    first?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
      } else if (e.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll(FOCUSABLE)];
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, initialFocusRef]);

  if (!open) return null;

  const sheet = variant === 'sheet';
  return createPortal(
    <div className={`fixed inset-0 z-50 flex ${sheet ? 'items-end md:items-stretch md:justify-end' : 'items-center justify-center p-4'}`}>
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] anim-fade-up" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={`relative bg-surface text-fg shadow-2xl anim-fade-up border border-line ${
          sheet
            ? 'w-full max-h-[90dvh] overflow-y-auto rounded-t-2xl md:max-h-none md:h-full md:max-w-md md:rounded-none md:rounded-l-2xl'
            : 'w-full max-w-sm rounded-2xl'
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold tracking-tight">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-5 pb-5 pt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
