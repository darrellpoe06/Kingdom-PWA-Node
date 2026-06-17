import React from 'react';
import { useStaleBuild, useUpdateStuck, freshnessDescriptor } from '../lib/freshness.js';
import { applyUpdate } from '../lib/sw-update.js';
import { KpiDot } from './KpiDot.jsx';

// FreshnessDot — the SINGLE quiet, inline update indicator (the only one in the
// app; the old floating "New version ready" popup that overlaid the header
// controls was removed). Built on the shared <KpiDot> system:
//   GREEN "Latest"                  the running build is the newest deployed one.
//   RED   "Update available — reload" a newer worker is waiting (tap to apply).
//   RED   "Update ready — close & reopen"  an in-place reload didn't stick; the
//                                   honest hard-relaunch hint (never a dead tap).
//
// It lives inline in the header build stamp, so it never covers the business
// switcher / theme / text-size controls. Color is ALWAYS paired with a visible
// text label + title + aria-label (WCAG 1.4.1) and the colors come from the
// shared KPI palette (>=3:1 on every theme). Tapping the stale badge runs the
// unbreakable apply flow (applyUpdate -> SKIP_WAITING -> single reload, with a
// guaranteed timed-fallback reload so a tap is never a silent no-op). Once the
// update applies the badge returns to GREEN "Latest" on its own — the update
// auto-clears, no dismiss needed.
//
// `compact` shortens the visible word for tight spots (the mobile header stamp);
// the full message still reaches screen readers via aria-label.
export function FreshnessDot({ className = '', compact = false }) {
  const stale = useStaleBuild();
  const stuck = useUpdateStuck();
  const d = freshnessDescriptor(stale, stuck);
  const label = compact
    ? (stale ? (stuck ? 'Reopen' : 'Update') : 'Latest')
    : d.label;

  return (
    <KpiDot
      status={d.status}
      label={label}
      title={d.title}
      ariaLabel={d.ariaLabel}
      // Stale-but-not-stuck: tap to apply. Stuck: a reload won't help — the title
      // tells them to fully close & reopen, so no click handler (no dead tap).
      onClick={stale && !stuck
        ? () => {
            try {
              applyUpdate(typeof window !== 'undefined' ? window.__pwaReg : null, window);
            } catch (_) {
              /* noop — best effort; the SW update flow is the source of truth */
            }
          }
        : undefined}
      className={className}
    />
  );
}
