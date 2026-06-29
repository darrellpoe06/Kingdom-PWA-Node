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
    id: 'seed-consistency-enforced',
    concern: 'Surfaces drifted because consistency was a slogan, not an enforced standard — phone render differed from laptop, a device-font emoji showed as a tofu box on one device, contrast and text-size varied surface to surface. Every same-day bug shared this one root.',
    solution: 'Consistency enforced via shared primitives + a CI check. CONSISTENCY-STANDARD.md (DR-0079) names the one canonical primitive per axis (UiIcon for icons, theme tokens for color, lib/text-size.js for text, the shell container for layout, supabase.js for persistence, surfaces.js for module mounting, canonical entities for identity). A new consistency-guard (vitest-gated) hard-fails the build on any NEW emoji-as-icon or fixed-px font over a frozen per-file baseline; color stays owned by the contrast guard, boundaries by the module-boundary guard. Drift now fails before merge.',
    status: 'in-progress', targetDate: '2026-07-15', area: 'Consistency', created: '2026-06-25',
  },
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
    concern: 'The "Update now" prompt does not clear / the app does not finish updating on some devices — users can sit on a stale app.',
    solution: 'Deploy-freshness fix shipped (every deploy ships a fresh service worker). REOPENED 2026-06-23: real reports on 2026-06-14 and 2026-06-15 show the Update-now prompt still does not leave / the update does not complete on some devices, so the service-worker fix did not fully resolve it. Re-verifying the update-and-dismiss flow on a real device before this is claimed done again (Verification Doctrine — "done" was not evidence-backed).',
    status: 'in-progress', targetDate: '2026-07-01', area: 'PWA / Deploy', created: '2026-06-18',
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

  // ---------------------------------------------------------------------------
  // Feedback-derived concerns — triaged 2026-06-23 from the 40 real rows in the
  // cloud `feedback` table (Christina's, the owner's, and beta users' voice).
  // Each is the EVALUATED disposition of a feedback cluster: a de-identified
  // problem statement (the raw, named feedback stays in the RLS-scoped feedback
  // table — never copied into this shipped bundle), the SOLUTION we intend, an
  // honest STATUS, and a TARGET we hold ourselves to (or a whenNote when the
  // path is gated / the cause is not yet known). `area` routes each to its
  // home module on the board. Full triage + impact×effort ranking + work list:
  // docs/99-session-notes/2026-06-23-feedback-triage-prioritization.md.
  // ---------------------------------------------------------------------------
  {
    id: 'seed-fb-seed-data-bleed',
    concern: 'Signed-in users still see sample/seed data and other people’s names mixed with their own — "this is not my information", a wrong name at the top, accounts/assets that aren’t mine. It reads like the data is compromised or mixed up.',
    solution: 'Make a signed-in instance show ONLY that instance’s real data: drop the seed/sample world once a real user signs in (root-caused: seed re-downloads from cloud + missing RLS DELETE policy on accounts/debts), and replace the hardcoded Adam/Naomi profile names with the signed-in identity. Verify with a real second-account login that no foreign name/number appears. Highest-trust item — the no-leak gate (RLS) already holds; this is the cosmetic/seed-bleed layer on top.',
    status: 'in-progress', targetDate: '2026-07-08', area: 'Privacy / Tenancy', created: '2026-06-23',
  },
  {
    id: 'seed-fb-choir-add-data-loss',
    concern: 'Adding an entry under the Choir schedule discards it — a choir editor tapped "Add" and the information disappeared instead of saving.',
    solution: 'Reproduce and fix the Choir schedule add path so a saved entry persists (and syncs). Data-loss on a real user’s input — treat as a correctness bug, not polish. Verify by adding a real entry on a real device and confirming it survives a reload.',
    status: 'open', targetDate: '2026-07-04', area: 'Church · Choir', created: '2026-06-23',
  },
  {
    id: 'seed-fb-church-next-sunday-date',
    concern: 'The livestream surface shows the wrong date for "next Sunday" and the loop can go stale — it should always compute the actual upcoming Sunday.',
    solution: 'Derive the next-Sunday date from the real calendar each render (never a frozen value) so the livestream card is always current. Church-live work is in flight; verify the computed date against a real upcoming Sunday before closing.',
    status: 'in-progress', targetDate: '2026-07-01', area: 'Church · Livestream', created: '2026-06-23',
  },
  {
    id: 'seed-fb-choir-youtube-broken',
    concern: 'The Choir tab’s YouTube-link-to-video feature is broken — pasting a link does not process into a playable video.',
    solution: 'Repair the Choir YouTube link → embed/processing path so a pasted link renders a playable video for the worship team. Verify with a real link end-to-end.',
    status: 'open', targetDate: '2026-07-09', area: 'Church · Choir', created: '2026-06-23',
  },
  {
    id: 'seed-fb-capex-tab-broken',
    concern: 'The Capital Expenditure tab is reported broken — and the reporter asked that all of its buttons be re-checked.',
    solution: 'Diagnose what is broken on the CapEx tab (it may be the held video-wall CapEx surface), fix it, and audit every button/control on the tab. Reproduce the break first — characterize before changing.',
    status: 'open', targetDate: '2026-07-09', area: 'Projects · CapEx', created: '2026-06-23',
  },
  {
    id: 'seed-fb-login-new-version',
    concern: 'Some users cannot sign in after an app update ("can’t login with the new version"). Root cause not yet confirmed — may relate to the reported sign-out-after-time / token-refresh symptom.',
    solution: 'DIAGNOSE FIRST (do not guess a fix): reproduce the post-update sign-in failure, check the service-worker/auth-token interaction and the session refresh path, then fix. UNKNOWN until reproduced. Target is a commitment to investigate, not yet to fix.',
    status: 'open', targetDate: '2026-07-02', area: 'Auth / Sign-in', created: '2026-06-23',
  },
  {
    id: 'seed-fb-feedback-multi-image',
    concern: 'The feedback screenshot picker only lets you attach one image at a time — users want to select 3-4 screenshots at once instead of filing multiple entries.',
    solution: 'Allow multi-select in the feedback image picker (the screenshots column is already jsonb/array-capable). Low effort, repeatedly requested — good early win. Verify a multi-image submission round-trips to the board thumbnail strip.',
    status: 'open', targetDate: '2026-07-05', area: 'Feedback', created: '2026-06-23',
  },
  {
    id: 'seed-fb-tab-whitespace',
    concern: 'A tab row shows dead white space on the right and the tab can be hard to tap — it should look normal and be easily clickable.',
    solution: 'The shared TabScroll primitive + overflow guard (PR #279) is built to fix exactly this (horizontal sub-tab scrolling, no white void). Un-hold and ship #279, then confirm the reported tab row scrolls/taps cleanly.',
    status: 'in-progress', whenNote: 'TabScroll primitive ready (PR #279, on hold)', area: 'Layout / Tabs', created: '2026-06-23',
  },
  {
    id: 'seed-fb-rentals-photos-missing',
    concern: 'Some property photos do not load in Real Estate ("can’t get all photos / photos are missing").',
    solution: 'Genuinely-not-backed-up images are a NAS-side photo-bridge resolver limit, now flagged honestly via lib/photo-source-health rather than failing silently. Remaining work: resolve the missing-thumbnail generation on the NAS bridge so the real photos appear. Honest interim status: some are not yet retrievable.',
    status: 'in-progress', whenNote: 'NAS photo-bridge resolver limit; flagged via photo-source-health', area: 'Real Estate · Photos', created: '2026-06-23',
  },
  {
    id: 'seed-fb-observation-photos-cameras',
    concern: 'Cannot upload photos to Observation, and the surveillance cameras are not yet viewable in the app.',
    solution: 'Two parts: (1) wire photo upload into the Observation surface; (2) stream the family/property cameras into the app via the planned docker-wyze-bridge on the NAS over Tailscale. Camera streaming is a larger sovereign-infra build — sequenced after the photo-upload fix.',
    status: 'open', whenNote: 'camera bridge (Wyze → NAS) planned', area: 'Church · Observation', created: '2026-06-23',
  },
  {
    id: 'seed-fb-create-study-open-docs',
    concern: 'Cannot open documents inside the Create or Study spaces — and the user wants to draft documentation from past messages in the format of the Bishop’s original document.',
    solution: 'Two parts: (1) let the Create/Study spaces open existing documents; (2) a "draft from past messages" helper that produces a document matching the Bishop’s document format (ties to the Pulpit corpus-grounded prep). Study/creation work is in flight.',
    status: 'in-progress', targetDate: '2026-07-12', area: 'Create / Study', created: '2026-06-23',
  },
  {
    id: 'seed-fb-markets-ticker',
    concern: 'Markets shows stock data before the ticker is live — it should not display data until the ticker is on, moving, and accurate.',
    solution: 'Gate the Markets data display on a live, accurate ticker feed (no painted/stale numbers shown first). Verify the ticker reflects real, moving quotes before any figure renders.',
    status: 'open', targetDate: '2026-07-15', area: 'Markets', created: '2026-06-23',
  },
  {
    id: 'seed-fb-choir-song-curation',
    concern: 'The choir wants to add and review song links, pick a final 10, send the rest back to the song list, and have the chosen songs populate an interactive area where all choir members can play them and leave comments.',
    solution: 'Build choir song curation: add/review links, a "final 10" selection with the remainder returning to the pool, and a shared interactive area (play + comment) scoped to choir members. Feature for Christina’s worship-team workflow (ties to the Choir module). Reviewed by use in her hands.',
    status: 'open', targetDate: '2026-07-18', area: 'Church · Choir', created: '2026-06-23',
  },
  {
    id: 'seed-fb-projects-historical',
    concern: 'Projects need a historical record — past projects and "seeds of what was" — for audit and to understand the current operational position and what to do next.',
    solution: 'Surface a project history/lifecycle trail (archive + lifecycle stages + discussions) so prior projects inform current decisions. The Projects management cockpit + lifecycle trail (PR #237, held) is the home for this.',
    status: 'in-progress', whenNote: 'lifecycle trail in PR #237 (held)', area: 'Projects', created: '2026-06-23',
  },
  {
    id: 'seed-fb-conference-all-ages',
    concern: 'Praise for the kids’ class plus a request: an all-ages technology class at the upcoming conference — the elders want to learn at their own pace, and the 35-45 middle wants the best for the whole family without having to help everyone constantly.',
    solution: 'The all-ages conference class (three paced lanes: elders / set-it-up-once 35-45 / youth) is already built on the feat/conference-all-ages-class branch. Remaining: Tier C soak + Bishop’s review + confirm the conference date, then ship.',
    status: 'in-progress', whenNote: 'built on branch; Tier C soak + Bishop review', area: 'Church · Learn', created: '2026-06-23',
  },
  {
    id: 'seed-fb-books-number-drilldown',
    concern: 'The user wants budget numbers to be tappable — clicking a figure should link to its underlying sources, so users can see the numbers behind the number and learn how the business runs.',
    solution: 'Make Books figures drill down to their sources (the figures already derive from the ledger via lib/account-balances.js — expose that lineage on tap). Education-and-clarity feature, not a defect. Lower urgency than the correctness bugs.',
    status: 'open', targetDate: '2026-07-20', area: 'Books', created: '2026-06-23',
  },
  {
    id: 'seed-fb-church-obvious-next-steps',
    concern: 'The Church section "doesn’t feel finished" — the user wants obvious next choices so they know what to do (a clarity gap, not a missing feature).',
    solution: 'Apply the Anxiety→Clarity standard to the Church surfaces: every surface answers what / when / why / how, with an obvious next action. Audit the Church tabs for dead-ends and add clear next-step affordances.',
    status: 'open', targetDate: '2026-07-22', area: 'Church', created: '2026-06-23',
  },
  {
    id: 'seed-fb-engagement-pollutes-feedback',
    concern: 'Learn engagement telemetry events ("[Learn engagement] band=... signal=started ...") are being written into the feedback table, cluttering real-feedback triage.',
    solution: 'Route engagement/telemetry events to their own store (or tag + filter them out of the feedback triage view) so the feedback board shows real human feedback, not machine events. Low effort, improves every future triage pass.',
    status: 'open', targetDate: '2026-07-25', area: 'Feedback / Learn', created: '2026-06-23',
  },
  {
    id: 'seed-fb-unlabeled-screenshots',
    concern: 'A few feedback items are screenshot-only with no usable text (just "[bug]", or "what does this image mean?"). They cannot be dispositioned without viewing the attached images.',
    solution: 'UNKNOWN until the images are reviewed. The screenshots were deliberately NOT pulled into this triage (privacy + size); they need a quick look-through with Darrell to classify. Then each becomes its own concern or is closed.',
    status: 'open', whenNote: 'needs image review with Darrell', area: 'Feedback', created: '2026-06-23',
  },
  {
    id: 'seed-fb-community-promotion',
    concern: 'A beta user (a community designer) asked for help getting their work seen beyond their current base — promotion / marketing reach. This is a product signal, not a defect.',
    solution: 'Logged as a community-product signal, not a bug. Re-review whether PoeTech offers community members promotion/marketing reach (aligned-brand, serve-not-extract) as a deliberate product decision rather than an ad-hoc fix.',
    status: 'open', whenNote: 're-review 2026-08-15 (product signal, not a defect)', area: 'Community', created: '2026-06-23',
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
