import React from 'react';
import { resolveKpiStatus } from '../lib/kpi-status.js';

// KpiDot — the ONE status indicator used by every live KPI across the app. A
// colored dot + a short TEXT label (never color-alone, WCAG 1.4.1) + title +
// aria-label. When `onClick` is given it renders as a <button> (an actionable
// KPI, e.g. the stale build -> tap to reload); otherwise a role="status" span.
//
// `status` is a canonical key ('good' | 'attention' | 'problem' | 'idle') OR any
// known synonym ('success', 'overdue', 'pinned', 'fresh', 'offline', ...) — see
// lib/kpi-status.js. `label` overrides the default state word for context-
// specific copy ("Latest", "Update available — reload"). The dot colors clear
// >=3:1 contrast on every theme (verified in kpi-status.test.js).
export function KpiDot({ status, label, title, ariaLabel, onClick, className = '' }) {
  const s = resolveKpiStatus(status);
  const text = label != null ? label : s.label;
  const t = title || (text === s.label ? s.meaning : `${s.label} — ${text}`);
  const aria = ariaLabel || (text === s.label ? `Status: ${s.label}` : `Status: ${s.label} — ${text}`);

  const inner = (
    <>
      <span
        aria-hidden="true"
        style={{
          display: 'inline-block',
          width: '0.5em',
          height: '0.5em',
          borderRadius: '9999px',
          backgroundColor: s.color,
          flexShrink: 0,
        }}
      />
      <span>{text}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={t}
        aria-label={aria}
        className={`inline-flex items-center gap-1 underline-offset-2 hover:underline ${className}`}
      >
        {inner}
      </button>
    );
  }
  return (
    <span role="status" title={t} aria-label={aria} className={`inline-flex items-center gap-1 ${className}`}>
      {inner}
    </span>
  );
}

export default KpiDot;
