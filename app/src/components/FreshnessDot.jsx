import React from 'react';
import { useStaleBuild, freshnessDescriptor } from '../lib/freshness.js';
import { applyUpdate } from '../lib/sw-update.js';
import { KpiDot } from './KpiDot.jsx';

// FreshnessDot — the build-freshness KPI, built on the shared <KpiDot> system.
//   GREEN "Latest"            when the running build is the newest deployed one.
//   RED   "Update available"  when a newer service worker is waiting (stale).
//
// Color is ALWAYS paired with a visible text label + title + aria-label (WCAG
// 1.4.1) and the colors come from the shared KPI palette (>=3:1 on every theme).
// In the stale state the badge is a button that triggers the existing
// reload-to-update flow (applyUpdate -> SKIP_WAITING -> single reload).
//
// `compact` shortens the visible word for tight spots (the mobile header stamp);
// the full message still reaches screen readers via aria-label.
export function FreshnessDot({ className = '', compact = false }) {
  const stale = useStaleBuild();
  const d = freshnessDescriptor(stale);
  const label = compact ? (stale ? 'Update' : 'Latest') : d.label;

  return (
    <KpiDot
      status={d.status}
      label={label}
      title={d.title}
      ariaLabel={d.ariaLabel}
      onClick={stale
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
