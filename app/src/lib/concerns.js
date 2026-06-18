// =============================================================================
// concerns — domain helpers for the Concerns & Solutions board
// =============================================================================
// The board pairs a real, dated CONCERN with the SOLUTION we intend, a TARGET
// DATE we hold ourselves to, and an honest STATUS. It is BuildBoard's sibling:
// BuildBoard shows what we're building; this shows what's wrong or worried-about
// and what we're doing about it — in the open, with dates.
//
// THREE inputs compose on the board (the component merges them):
//   1. SEED_CONCERNS — the dated baseline below. Platform truth, the same for
//      everyone with access, edited in code as part of shipping — exactly like
//      BuildBoard's ROADMAP constant. Honest status on each.
//   2. DB concerns (0039 `concerns` table, via concerns-sync) — net-new concerns
//      the family / Governor add, edit, re-date, and re-status. Fully synced.
//   3. feedback rows (read-through) — every submitted feedback item renders as a
//      concern automatically, so the loop returns in-app without hand-routing.
//      Read-only here; the source of truth stays the feedback table.
//
// Status palette reuses BuildBoard's exact themeable colors (proven to pass the
// per-theme contrast guard): open = blue (planned), in-progress = terracotta,
// done = olive. Each carries text/bg/border classes so the per-[data-theme]
// remap applies — never a raw inline color on the rendered chip.
// =============================================================================

// status: 'open' | 'in-progress' | 'done'
export const CONCERN_STATUS = {
  'open':        { label: 'Open',        color: '#2A5A8E', text: 'text-[#2A5A8E]', bg: 'bg-[#2A5A8E]', border: 'border-[#2A5A8E]', symbol: '○', blurb: 'Named, not yet started' },
  'in-progress': { label: 'In progress', color: '#B85838', text: 'text-[#B85838]', bg: 'bg-[#B85838]', border: 'border-[#B85838]', symbol: '◐', blurb: 'Being worked' },
  'done':        { label: 'Done',        color: '#5A6E3D', text: 'text-[#5A6E3D]', bg: 'bg-[#5A6E3D]', border: 'border-[#5A6E3D]', symbol: '✓', blurb: 'Resolved' },
};
export const CONCERN_STATUS_ORDER = ['open', 'in-progress', 'done'];

export function statusMeta(status) {
  return CONCERN_STATUS[status] || CONCERN_STATUS.open;
}

// -----------------------------------------------------------------------------
// SEED_CONCERNS — today's confirmed concerns (real), dated. Honest status on
// each. These are the baseline the board opens with; the family/Governor add
// more (DB-backed) on top. Edited in code as part of shipping, like the Build
// board's roadmap. `created` is the date the concern was confirmed/logged.
// -----------------------------------------------------------------------------
export const SEED_CONCERNS = [
  {
    id: 'seed-feedback-auto-eval',
    concern: 'In-app feedback is never auto-evaluated — a submitted note just sits until someone reads it by hand.',
    solution: 'Feedback → AI-reviewed follow-up: route each item to the right person with a follow-up sequence that improves over time (the loop this very board closes the first half of — feedback now returns in-app automatically).',
    status: 'in-progress', targetDate: '2026-07-01', area: 'Feedback', created: '2026-06-18',
  },
  {
    id: 'seed-family-voice-no-wake',
    concern: 'Family-voice chat-in lands on disk only — there is no wake/notify, so a message can sit unseen.',
    solution: 'Wire the wake/handoff path (behind the Cage three-brakes) so a chat-in raises an in-app signal instead of waiting to be discovered on disk.',
    status: 'open', whenNote: 'after the wake-orchestrator arming review (Tier C)', area: 'Family voice', created: '2026-06-18',
  },
  {
    id: 'seed-wf18-import-down',
    concern: 'wf18 import was down — imported transactions stalled and never reached the ledger.',
    solution: 'Root-caused and fixed; the stalled-import path was repaired (see the 2026-06-17 session note).',
    status: 'done', targetDate: '2026-06-17', area: 'Banking import', created: '2026-06-17',
  },
  {
    id: 'seed-darkmode-contrast',
    concern: 'Dark-mode contrast failed in both directions — light-on-light and dark-on-dark on themed surfaces.',
    solution: 'Themed surfaces moved to classes (not inline colors); the contrast guard now checks accents per-theme (incl. midnight) and scans inline colors. Proven-to-catch.',
    status: 'done', targetDate: '2026-06-16', area: 'Accessibility', created: '2026-06-18',
  },
  {
    id: 'seed-tofu-icons',
    concern: 'Tofu icons (missing glyphs) appeared on some devices — icons fell back to empty boxes cross-device.',
    solution: 'Switched to inline SVG icons that render the same on every device instead of relying on a font glyph.',
    status: 'done', targetDate: '2026-06-16', area: 'Icons', created: '2026-06-18',
  },
  {
    id: 'seed-church-stream-frozen',
    concern: 'The church stream surface was frozen on 2019 content — it showed stale, years-old data.',
    solution: 'Church-live wired to the real current stream/source so it reflects today, not 2019.',
    status: 'done', targetDate: '2026-06-17', area: 'Church', created: '2026-06-18',
  },
  {
    id: 'seed-static-finance',
    concern: 'Finance numbers were static — figures were painted, not derived from the real ledger.',
    solution: 'Books figures now derive from the ledger (opening + settled transactions via the account-balances helper); obligations flow into the forecast. Real data, not a hardcoded number.',
    status: 'done', targetDate: '2026-06-13', area: 'Finance', created: '2026-06-18',
  },
  {
    id: 'seed-re-doors-static',
    concern: 'Real-estate doors / roll-up were static — counts and totals did not reflect the real portfolio state.',
    solution: 'Real Estate wired to the synced rentals data so doors and the roll-up read live state across devices.',
    status: 'done', targetDate: '2026-06-11', area: 'Real Estate', created: '2026-06-18',
  },
  {
    id: 'seed-pwa-reload-update',
    concern: 'The PWA needed a manual reload to pick up an update — users could sit on a stale app.',
    solution: 'Deploy-freshness fix: every deploy ships a fresh service worker so updates always reach the device.',
    status: 'done', targetDate: '2026-06-10', area: 'PWA / Deploy', created: '2026-06-18',
  },
  {
    id: 'seed-orchestrator-inert',
    concern: 'The orchestrator was never deployed; it is now inert — it exists but does not actually run the lanes.',
    solution: 'Deploy it ONLY behind the three brakes (budget + concurrency lock + kill-switch), turned on with someone watching — never active-and-unattended (the 2026-06-06 runaway lesson). Multi-lane orchestration is also being reconsidered in favor of one coherent owner.',
    status: 'open', whenNote: 'after the three-brakes arming review (Tier C)', area: 'Orchestration', created: '2026-06-18',
  },
  {
    id: 'seed-cloud-nas-split',
    concern: 'Cloud / NAS source-of-truth split — it is not always clear which side is authoritative for a given record.',
    solution: 'Ratified direction: database primary moves to home hardware (sovereignty phase ~Jul–Aug 2026) with the church NAS holding an encrypted sealed-blob backup. A clear single primary resolves the split.',
    status: 'open', whenNote: 'sovereignty phase ~Jul–Aug 2026', area: 'Infrastructure', created: '2026-06-18',
  },
  {
    id: 'seed-vercel-cap',
    concern: 'Vercel daily deploy cap was hit — the 100/day limit blocks shipping when the build is busy.',
    solution: 'Off-Vercel → Cloudflare Pages pipeline is built and merged, gated off behind CF_PAGES_ENABLED; it removes the daily cap. Awaiting Darrell’s Cloudflare creds + DNS cutover.',
    status: 'open', whenNote: 'awaiting Cloudflare creds + DNS cutover', area: 'Infrastructure', created: '2026-06-18',
  },
  {
    id: 'seed-review-sequences',
    concern: 'Review sequences are not running — there is no watcher driving the staged review/freshness loop.',
    solution: 'Stand up the watcher that runs the review sequences (behind the three brakes) so staged proposals actually move through review instead of sitting.',
    status: 'open', whenNote: 'after the watcher is built + brake-reviewed', area: 'Review loop', created: '2026-06-18',
  },
];

// -----------------------------------------------------------------------------
// daysLate — how many days past its committed target an unresolved concern is.
// Only open / in-progress concerns with a real YYYY-MM-DD target count, so the
// board flags its own slips the same way BuildBoard does. A board that won't
// flag its own misses is decoration, not transparency.
// -----------------------------------------------------------------------------
export function daysLate(c) {
  if (!c || c.status === 'done') return 0;
  const d = c.targetDate || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return 0;
  const days = Math.floor((Date.now() - Date.parse(d)) / 86400000);
  return days > 0 ? days : 0;
}

// Sort key from the target date (NaN/prose-condition concerns sink to the end).
export function targetSortKey(c) {
  const t = Date.parse((c && c.targetDate) || '');
  return Number.isNaN(t) ? Infinity : t;
}

// Order a list of concerns within a status group: nearest target first (asc),
// done most-recent-first (desc). Prose-condition (undated) concerns sink to the
// bottom in stable order. Honors a hand-set sortRank when present (lower first).
export function orderConcerns(list, dir = 'asc') {
  const sign = dir === 'desc' ? -1 : 1;
  return [...(list || [])]
    .map((c, i) => [c, i])
    .sort((a, b) => {
      const ra = a[0]?.sortRank, rb = b[0]?.sortRank;
      if (ra != null || rb != null) {
        return (ra == null ? Infinity : ra) - (rb == null ? Infinity : rb) || (a[1] - b[1]);
      }
      const ka = targetSortKey(a[0]), kb = targetSortKey(b[0]);
      if (ka === Infinity && kb === Infinity) return a[1] - b[1];
      if (ka === Infinity) return 1;
      if (kb === Infinity) return -1;
      return sign * (ka - kb) || (a[1] - b[1]);
    })
    .map(([c]) => c);
}

// -----------------------------------------------------------------------------
// feedbackToConcernCards — map feedback rows (local + remote, the prototype
// shape) into read-through concern cards. The feedback table stays the source
// of truth; these are NOT persisted into `concerns`. The first screenshot rides
// along as a thumbnail so an image submitted with feedback shows on the board.
// A feedback item carries no target/solution, so it renders as an OPEN concern
// awaiting triage — exactly what an un-evaluated piece of feedback is.
// -----------------------------------------------------------------------------
export function feedbackToConcernCards(feedback = []) {
  return (feedback || [])
    .filter((f) => f && (f.text || f.feedback_text))
    .map((f) => {
      const when = f.createdAt || f.submittedAt || f.submitted_at || null;
      const shots = Array.isArray(f.screenshots) && f.screenshots.length
        ? f.screenshots
        : (f.screenshot ? [f.screenshot] : []);
      // A triaged-as-resolved feedback row reads as done; everything else is an
      // open concern awaiting evaluation.
      const status = f.triageStatus === 'resolved' || f.triageStatus === 'done' ? 'done' : 'open';
      return {
        id: `fb-${f.id}`,
        concern: f.text || f.feedback_text,
        solution: null,
        status,
        targetDate: null,
        whenNote: 'awaiting evaluation',
        area: f.currentView || f.which_tab || f.area || 'Feedback',
        source: 'feedback',
        readOnly: true,
        thumbnail: shots[0] || null,
        screenshotCount: shots.length,
        author: f.displayName || null,
        deviceLabel: f.deviceLabel || null,
        createdAt: when,
        created: when ? String(when).slice(0, 10) : null,
      };
    });
}

// Compose the full board list from the three inputs. DB concerns + seeds are the
// editable/baseline curated set; feedback cards are appended read-through.
export function composeConcerns({ dbConcerns = [], seeds = SEED_CONCERNS, feedback = [] } = {}) {
  // DB rows win over a seed with the same id (a Governor can supersede a baseline
  // entry by adding a real row); de-dupe by id, DB first.
  const byId = new Map();
  for (const c of dbConcerns) if (c && c.id) byId.set(c.id, { ...c, source: c.source || 'manual' });
  for (const s of seeds) if (s && s.id && !byId.has(s.id)) byId.set(s.id, { ...s, source: 'seed' });
  const curated = [...byId.values()];
  const fb = feedbackToConcernCards(feedback);
  return [...curated, ...fb];
}
