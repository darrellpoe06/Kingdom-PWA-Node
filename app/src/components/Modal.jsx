// =============================================================================
// Modal — one accessible, focus-trapped dialog primitive for the whole app
// =============================================================================
// Auth, account, and other "act in place" surfaces open QUIETLY over the page
// the user is already on (Darrell 2026-06-17: "not messy" — no full-page jumps).
// This is the shared shell so every such surface gets the same calm, correct
// behavior instead of hand-rolling it:
//
//   - role="dialog" + aria-modal + aria-labelledby (heading wired by the caller)
//   - ESC closes; clicking the backdrop closes; the × button closes
//   - focus moves into the dialog on open and is TRAPPED (Tab/Shift+Tab cycle
//     within); focus is RESTORED to whatever was focused before, on close
//   - body scroll locked while open (the page behind doesn't drift)
//   - rendered through a portal to <body> so stacking/overflow can't clip it
//
// TWO SHAPES, ONE PRIMITIVE (DR-1575). `variant="card"` (the default) is the
// white padded card every auth/account surface uses. `variant="sheet"` is for
// content that brings its own themed surface (the Love Corner's All-features
// and Personalize sheets): the portal lands on <body>, OUTSIDE the shell's
// themed wrapper, so the card's white padding showed as a thick white frame
// around a dark sheet, with a grey × on near-black (measured 2.73:1) hanging
// over the sheet's first control. A sheet panel carries the caller's `theme`
// itself, has no padding of its own, is the ONE scroll box (the sheet inside
// no longer scrolls within it), and its × is a 44px chrome button that never
// grows with the text size and never scrolls away.
//
// Presentational + self-contained. It renders nothing unless `open`. The caller
// owns the content and the onClose handler. Unbreakable by design: no network,
// no app state; if children throw, the app-wide ErrorBoundary still wraps it.
// =============================================================================
import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({
  open,
  onClose,
  labelledBy,
  label,
  children,
  closeLabel = 'Close',
  initialFocusRef = null,
  maxWidthClass = 'max-w-sm',
  variant = 'card',
  theme = null,
}) {
  const isSheet = variant === 'sheet';
  const panelRef = useRef(null);
  const restoreRef = useRef(null);

  const close = useCallback(() => { if (onClose) onClose(); }, [onClose]);

  // Remember what had focus so we can restore it when the dialog closes.
  useEffect(() => {
    if (!open) return undefined;
    restoreRef.current = (typeof document !== 'undefined' && document.activeElement) || null;
    return () => {
      const el = restoreRef.current;
      if (el && typeof el.focus === 'function') {
        try { el.focus(); } catch (_) { /* element may be gone */ }
      }
    };
  }, [open]);

  // Move focus into the dialog on open (preferred element, else first focusable,
  // else the panel itself so the screen reader lands inside the dialog).
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const preferred = initialFocusRef && initialFocusRef.current;
      if (preferred && typeof preferred.focus === 'function') { preferred.focus(); return; }
      const panel = panelRef.current;
      if (!panel) return;
      const first = panel.querySelector(FOCUSABLE);
      if (first && typeof first.focus === 'function') first.focus();
      else panel.focus();
    }, 0);
    return () => clearTimeout(t);
  }, [open, initialFocusRef]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC to close + Tab focus trap.
  const onKeyDown = useCallback((e) => {
    if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
    if (e.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;
    const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement,
    );
    if (items.length === 0) { e.preventDefault(); panel.focus(); return; }
    const firstEl = items[0];
    const lastEl = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === firstEl || !panel.contains(active)) { e.preventDefault(); lastEl.focus(); }
    } else if (active === lastEl) {
      e.preventDefault();
      firstEl.focus();
    }
  }, [close]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-read-skip className="fixed inset-0 z-[120] bg-[#1A1815]/95 flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden"
      onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        tabIndex={-1}
        data-theme={isSheet && theme ? theme : undefined}
        data-modal-variant={isSheet ? 'sheet' : 'card'}
        className={
          isSheet
            ? `modal-sheet relative w-full ${maxWidthClass} shadow-2xl focus:outline-none`
            : `relative bg-white border border-[#1A1815] w-full ${maxWidthClass} max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl focus:outline-none`
        }
        style={{ fontFamily: '"DM Sans", system-ui, sans-serif' }}
      >
        <button
          type="button"
          onClick={close}
          aria-label={closeLabel}
          data-testid="modal-close"
          className={
            isSheet
              ? 'modal-sheet-x'
              : 'absolute top-2.5 right-2.5 w-11 h-11 min-h-[44px] flex items-center justify-center text-2xl leading-none text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]'
          }
        >
          {isSheet ? (
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            '×'
          )}
        </button>
        {isSheet ? (
          <div className="modal-sheet-scroll" data-testid="modal-sheet-scroll">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>,
    document.body,
  );
}
