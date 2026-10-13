// =============================================================================
// ReviewsPeek — the review records, surfaced where the steward actually looks
// =============================================================================
// Darrell 2026-07-15: "it's difficult to see your reviews ... maybe you should
// add the reviews inside the app's ... preview of the app or users views etc."
// The REV records (docs/reviews/REVIEWS.md) were already IN the app -- but only
// buried in the Governor-gated CommandServeCenter -> QualityProof. This surfaces
// the same records, newest-first, right in the Reviewer-mode strip: so when a
// steward reviews the LIVE production push as a user meets it (DR-0104), the
// written review for what they are looking at is one tap away, not a repo dig.
//
// SAME ONE SOURCE (DR-0079): reads the build-time __UIUX_REVIEWS__ (docs/reviews/
// REVIEWS.md parsed in vite.config.js) through the SAME normalizeReviews the
// QualityProof surface uses -- no second copy, no drift. Honest-empty: with no
// records it says so; it never paints rows (DR-0061/0076). Advisory only -- a
// window onto what was written, it changes nothing.
//
// PALETTE: it lives under the dark Reviewer-mode banner, so it wears the banner's
// own scheme -- white on #1A1815 -- one cohesive dark overlay (and no light-on-
// dark theme clash for the legibility/contrast guards).
// =============================================================================
import React, { useState } from 'react';
import { normalizeReviews } from '../lib/quality-proof.js';

const TYPE_LABEL = {
  accessibility: 'Accessibility',
  'ui-ux': 'UI/UX',
  security: 'Security',
  'code-review': 'Code review',
  orchestration: 'Ways review',
};

// Read the build-time records (same global QualityProof reads). Injectable for
// tests so the pure list logic is exercised without the build define.
export function loadReviewRecords() {
  try {
    return normalizeReviews(typeof __UIUX_REVIEWS__ !== 'undefined' ? __UIUX_REVIEWS__ : null);
  } catch {
    return normalizeReviews(null);
  }
}

// Newest-first by each record's own Date field, capped. File POSITION is not
// trusted: the registry historically carries a prepended newest-first run atop
// the older oldest-first body (both conventions are real), so position-order
// ("tail is newest") silently hid the newest records from this strip -- the
// exact surface DR-0104 built to keep the written review one tap away (caught
// 2026-08-05, REV-0239). Ties fall back to the higher REV id; an unparseable
// date sorts last. Pure so a test can pin it.
export function recentReviews(data, limit = 8) {
  const items = (data && Array.isArray(data.items)) ? data.items : [];
  const when = (r) => {
    const ms = Date.parse(r && r.date ? r.date : '');
    return Number.isNaN(ms) ? -Infinity : ms;
  };
  const idNum = (r) => {
    const m = /^REV-(\d+)/.exec((r && r.id) || '');
    return m ? parseInt(m[1], 10) : -1;
  };
  return items.slice().sort((a, b) => (when(b) - when(a)) || (idNum(b) - idNum(a))).slice(0, limit);
}

export default function ReviewsPeek({ reviews = null, limit = 8, defaultOpen = false }) {
  const data = reviews || loadReviewRecords();
  const recent = recentReviews(data, limit);
  const [open, setOpen] = useState(defaultOpen);
  const [expandedId, setExpandedId] = useState(null);

  return (
    <div className="bg-[#1A1815] text-white border-t border-white/10">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[0.625rem] uppercase tracking-[0.18em] font-semibold opacity-70 hover:opacity-100 focus:outline focus:outline-2 focus:outline-white"
      >
        <span>Recent reviews{data && data.count ? ` (${data.count})` : ''}</span>
        <span aria-hidden="true">{open ? '[-]' : '[+]'}</span>
      </button>

      {open && (
        <div className="px-3 pb-2 max-h-[50vh] overflow-y-auto">
          {recent.length === 0 ? (
            <p className="text-[0.6875rem] opacity-70 py-2" style={{ fontFamily: '"Fraunces", serif' }}>
              No review records yet. As reviews are written to docs/reviews/REVIEWS.md, the newest appear here.
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {recent.map((r) => {
                const isOpen = expandedId === r.id;
                return (
                  <li key={r.id || `${r.date}-${r.title}`} className="py-1.5">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isOpen ? null : r.id)}
                      aria-expanded={isOpen}
                      className="w-full text-left focus:outline focus:outline-2 focus:outline-white"
                    >
                      <span className="block text-xs text-white" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>
                        {r.title}
                      </span>
                      <span className="block text-[0.625rem] opacity-60 mt-0.5" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        {r.date}{r.type ? ` · ${TYPE_LABEL[r.type] || r.type}` : ''}
                      </span>
                    </button>
                    {isOpen && r.findings && (
                      <p className="text-[0.6875rem] opacity-80 mt-1 leading-snug" style={{ fontFamily: '"Fraunces", serif' }}>
                        {r.findings}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
