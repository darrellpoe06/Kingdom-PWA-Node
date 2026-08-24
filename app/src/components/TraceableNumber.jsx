// =============================================================================
// TraceableNumber.jsx — a tappable budget figure that reveals its sources
// =============================================================================
// Darrell 2026-06-16: "click on the number in the budget and have it be a link
// to the sources so users like myself can see the underlying numbers and
// sources." This is the reusable surface for that. Wrap any displayed budget
// figure with <TraceableNumber trace={...}>{value}</TraceableNumber> and it
// becomes a button that opens a panel showing:
//   (a) the input values that feed it,
//   (b) the math/derivation in plain terms (trace.formula),
//   (c) the source rows/records it traces to (trace.sources).
//
// The `trace` object is built by the pure functions in lib/number-trace.js,
// so what the panel shows can never drift from what the figure displays.
//
// Accessibility (WCAG 2.1 AA — this surface must meet the binding standard):
//   · the trigger is a real <button>: keyboard-focusable, Enter/Space opens it
//   · affordance is NOT color-only — a dotted underline + an "i" marker signal
//     it is interactive, so it reads for colorblind + low-vision users
//   · the panel is a role="dialog" aria-modal, labelled by its heading
//   · focus moves into the panel on open and returns to the trigger on close
//   · Escape closes; the backdrop is click-to-close but not a focus trap risk
//   · all text colors are the app's verified-AA palette on #FFFFFF / #FAF8F4
// =============================================================================
import React, { useState, useRef, useEffect, useId } from 'react';

const fmtMoney = (n) =>
  n == null || !isFinite(n)
    ? '—'
    : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;

// Format one trace value by its `kind`.
export function formatTraceValue(item) {
  if (!item) return '—';
  const v = item.value;
  switch (item.kind) {
    case 'percent':
      return v == null || !isFinite(v) ? '—' : `${v.toFixed(1)}%`;
    case 'count':
      return `${v ?? 0}`;
    case 'years':
      return v == null || !isFinite(v) ? '—' : `${v.toFixed(1)} yr`;
    case 'date':
    case 'text':
      return v == null || v === '' ? '—' : `${v}`;
    case 'money':
    default:
      return fmtMoney(v);
  }
}

// A signed operator glyph rendered before a row's value (+, −, ÷, ×).
function OpBadge({ op }) {
  if (!op) return null;
  return (
    <span aria-hidden="true" className="inline-block w-4 text-center text-[#5A5751] font-mono">
      {op}
    </span>
  );
}

function TraceRow({ item, action = null }) {
  const selectId = useId();
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 border-b border-[#E8E4DC] last:border-b-0">
      <div className="flex items-baseline gap-1 min-w-0">
        <OpBadge op={item.op} />
        <div className="min-w-0">
          <div className="text-sm text-[#1A1815] truncate" style={{ fontFamily: '"Fraunces", serif' }}>
            {item.label}
          </div>
          {item.meta && (
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{item.meta}</div>
          )}
          {/* Optional per-record action (e.g. recategorize a purchase in place —
              the same control the Tx tab has, so no drill-down is a dead end). */}
          {action && (
            <div className="mt-1">
              <label htmlFor={selectId} className="sr-only">{`${action.label || 'Set'} for ${item.label}`}</label>
              <select
                id={selectId}
                value={action.value(item)}
                onChange={(e) => action.onPick(item, e.target.value)}
                className="text-[0.6875rem] border border-[#8A857B] bg-white text-[#1A1815] px-1.5 py-1 min-h-[32px] focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                {action.options.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      <div
        className="text-sm text-[#1A1815] shrink-0 tabular-nums"
        style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}
      >
        {formatTraceValue(item)}
      </div>
    </div>
  );
}

export default function TraceableNumber({
  trace,
  children,
  label,
  className = '',
  align = 'left',
  // Optional action rendered on every SOURCE row: { label, options: [...],
  // value(item), onPick(item, value) }. Lets a drill-down act on its records
  // in place (recategorize a purchase) instead of sending the user elsewhere.
  sourceAction = null,
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const headingId = useId();

  useEffect(() => {
    if (!open) return undefined;
    // Move focus into the panel.
    const t = setTimeout(() => closeRef.current && closeRef.current.focus(), 0);
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        // Return focus to the trigger for keyboard users.
        if (triggerRef.current) triggerRef.current.focus();
      }
    };
    document.addEventListener('keydown', onKey, true);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    // Return focus to the trigger for keyboard users.
    if (triggerRef.current) triggerRef.current.focus();
  };

  // No trace -> render the value plain (graceful fallback, never breaks layout).
  // Placed after all hooks so hook order stays stable across renders.
  if (!trace) return <>{children}</>;

  const accessibleLabel = `Show how ${label || trace.title || 'this number'} is calculated`;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={accessibleLabel}
        title={accessibleLabel}
        className={`trace-number group inline-flex items-baseline gap-0.5 cursor-pointer bg-transparent border-0 p-0 m-0 text-left focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B85838] ${className}`}
        style={{
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textDecorationThickness: '1px',
          textUnderlineOffset: '3px',
          textDecorationColor: '#8A857B',
        }}
      >
        {children}
        <span
          aria-hidden="true"
          className="self-start ml-0.5 text-[0.5625rem] leading-none text-[#5A5751] border border-[#8A857B] rounded-full w-[13px] h-[13px] inline-flex items-center justify-center shrink-0 group-hover:text-[#B85838] group-hover:border-[#B85838]"
          style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700 }}
        >
          i
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={close}
        >
          <div className="absolute inset-0 bg-[#1A1815]/40" aria-hidden="true" />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={headingId}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white border border-[#1A1815] w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-[#1A1815] px-4 py-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">
                  Where this number comes from
                </div>
                <h2
                  id={headingId}
                  className="text-lg leading-tight text-[#1A1815]"
                  style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}
                >
                  {trace.title}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close"
                className="shrink-0 text-[#5A5751] hover:text-[#B85838] text-xl leading-none px-1 focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
              >
                ×
              </button>
            </div>

            <div className="px-4 py-3 space-y-4">
              {/* The result */}
              <div className="bg-[#FAF8F4] border border-[#E8E4DC] px-3 py-2.5 flex items-baseline justify-between gap-3">
                <span className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A5751]">This number</span>
                <span
                  className="text-2xl text-[#1A1815] tabular-nums"
                  style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}
                >
                  {formatTraceValue(trace.result)}
                </span>
              </div>

              {/* (b) the math in plain terms */}
              <section>
                <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">
                  How it's calculated
                </div>
                <p className="text-sm leading-relaxed text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
                  {trace.formula}
                </p>
              </section>

              {/* (a) the inputs that feed it */}
              {trace.inputs && trace.inputs.length > 0 && (
                <section>
                  <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">
                    The inputs that feed it
                  </div>
                  <div>
                    {trace.inputs.map((it, i) => (
                      <TraceRow key={`in-${i}`} item={it} />
                    ))}
                  </div>
                </section>
              )}

              {/* (c) the real source rows it traces to */}
              {trace.sources && trace.sources.length > 0 && (
                <section>
                  <div className="text-[0.625rem] uppercase tracking-[0.2em] text-[#5A6E3D] font-semibold mb-1">
                    The records it comes from <span className="text-[#5A5751] normal-case tracking-normal font-normal">· {trace.sources.length}</span>
                  </div>
                  <div>
                    {trace.sources.map((it, i) => (
                      <TraceRow key={`src-${i}`} item={it} action={sourceAction} />
                    ))}
                  </div>
                </section>
              )}

              {trace.note && (
                <p className="text-xs italic text-[#5A5751] leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
                  {trace.note}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
