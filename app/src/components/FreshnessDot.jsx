import React from 'react';
import { useStaleBuild, freshnessDescriptor } from '../lib/freshness.js';
import { applyUpdate } from '../lib/sw-update.js';

// FreshnessDot — a tiny color + TEXT badge placed next to a build stamp.
//   GREEN "Latest"            when the running build is the newest deployed one.
//   RED   "Update available"  when a newer service worker is waiting (stale).
//
// Color is ALWAYS paired with a visible text label + title + aria-label, so it
// never conveys state by color alone (WCAG 1.4.1); the dot colors clear >=3:1
// contrast on every theme (see lib/freshness.js). In the stale state the badge
// becomes a button that triggers the existing reload-to-update flow
// (applyUpdate -> SKIP_WAITING -> single reload, lib/sw-update.js).
//
// `compact` shortens the visible word for tight spots (the mobile header stamp);
// the full message still reaches screen readers via aria-label.
export function FreshnessDot({ className = '', compact = false }) {
  const stale = useStaleBuild();
  const d = freshnessDescriptor(stale);
  const label = compact ? (stale ? 'Update' : 'Latest') : d.label;

  const inner = (
    <>
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: '0.5em',
          height: '0.5em',
          borderRadius: '9999px',
          backgroundColor: d.color,
          flexShrink: 0,
        }}
      />
      <span>{label}</span>
    </>
  );

  if (stale) {
    return (
      <button
        type="button"
        onClick={() => {
          try {
            applyUpdate(typeof window !== 'undefined' ? window.__pwaReg : null, window);
          } catch (_) {
            /* noop — best effort; the SW update flow is the source of truth */
          }
        }}
        title={d.title}
        aria-label={d.ariaLabel}
        className={`inline-flex items-center gap-1 underline-offset-2 hover:underline ${className}`}
      >
        {inner}
      </button>
    );
  }

  return (
    <span
      role="status"
      title={d.title}
      aria-label={d.ariaLabel}
      className={`inline-flex items-center gap-1 ${className}`}
    >
      {inner}
    </span>
  );
}
