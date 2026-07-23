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
//      everyone with access, edited in code as part of shipping. Honest status
//      on each. (BuildBoard's own hand-typed ROADMAP was retired by DR-0121 —
//      its ship story now derives from live sources via lib/build-story.js;
//      this seed list remains the one code-kept baseline, and its drain onto
//      the DB concerns table is on the DR-0121 cleaning backlog.)
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

import { evaluateFeedback, feedbackText } from './feedback-triage.js';
// Auto-audit findings (DR-0086) — the proactive surface audit writes this artifact
// (scripts/surface-audit.mjs); each finding is a pre-mapped read-through concern
// card so the board shows what the audit caught BEFORE anyone has to name it.
// A finding that disappears from the artifact has passed re-audit (auto-resolved),
// so its card simply stops appearing. Import is static so the cards ride the
// bundle exactly like SEED_CONCERNS; the file is regenerated, never hand-edited.
import auditArtifact from './audit-findings.json';

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
    status: 'done', targetDate: '2026-07-15', area: 'Consistency', created: '2026-06-25', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): VERIFIED shipped — consistency-guard.test.js
    // runs in the required suite (6400 green); drift fails before merge. Done on evidence.
  },
  {
    id: 'seed-feedback-auto-eval',
    concern: 'In-app feedback is never auto-evaluated — a submitted note just sits until someone reads it by hand.',
    solution: 'Shipped: every feedback item is now AUTO-EVALUATED on arrival (lib/feedback-triage, deterministic + offline) — categorized, given a severity, routed to an area, and paired with a concrete suggested next step — and rendered right here on the board. No item sits "awaiting evaluation"; a human still sets the real solution/target on top of the triaged starting point. (A model-graded follow-up sequence can layer on later behind the three brakes.)',
    status: 'done', targetDate: '2026-06-30', area: 'Feedback', created: '2026-06-18',
  },
  {
    id: 'seed-family-voice-no-wake',
    concern: 'Family-voice chat-in lands on disk only — there is no wake/notify, so a message can sit unseen.',
    solution: 'Wire the wake/handoff path (behind the Cage three-brakes) so a chat-in raises an in-app signal instead of waiting to be discovered on disk.',
    status: 'open', whenNote: 'build brakes-in, prove in CI, ship inactive, activate on proof (DR-0225)', area: 'Family voice', created: '2026-06-18', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225): "arming review" was the stall framing — the brakes are
    // build requirements, not a meeting. This rides the agent-teams-under-Ari build.
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
    status: 'in-progress', targetDate: '2026-08-01', area: 'PWA / Deploy', created: '2026-06-18', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): the worker was REBUILT under DR-0160 (the
    // P33 close) and two required CI gates now stand where devices stand (sw-nav-check +
    // boot-check's controlled second visit). Its own bar is still a real-device update-and-
    // dismiss confirmation — re-dated to the 2026-08-01 family device pass, not silently slid.
  },
  {
    id: 'seed-orchestrator-inert',
    concern: 'The orchestrator was never deployed; it is now inert — it exists but does not actually run the lanes.',
    solution: 'Deploy it ONLY behind the three brakes (budget + concurrency lock + kill-switch), turned on with someone watching — never active-and-unattended (the 2026-06-06 runaway lesson). Multi-lane orchestration is also being reconsidered in favor of one coherent owner.',
    status: 'open', whenNote: 'build brakes-in, prove in CI, ship inactive, activate on proof (DR-0225)', area: 'Orchestration', created: '2026-06-18', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225): same correction — the three brakes are engineering
    // deliverables designed into the build, proven-to-catch, then activated through the lane
    // with the witnesses live; never a permission conversation.
  },
  {
    id: 'seed-cloud-nas-split',
    concern: 'Cloud / NAS source-of-truth split — it is not always clear which side is authoritative for a given record.',
    solution: 'Ratified direction: database primary moves to home hardware (sovereignty phase ~Jul–Aug 2026) with the church NAS holding an encrypted sealed-blob backup. A clear single primary resolves the split.',
    status: 'open', whenNote: 'sovereignty phase ~Jul–Aug 2026', area: 'Infrastructure', created: '2026-06-18', refreshed: '2026-07-23',
  },
  {
    id: 'seed-vercel-cap',
    concern: 'Vercel daily deploy cap was hit — the 100/day limit blocks shipping when the build is busy.',
    solution: 'RESOLVED — the cutover happened: poetech.us serves from Cloudflare Pages (deploy-cloudflare-pages.yml is the production deploy the auto-merge heal dispatches; app/functions/ Pages Functions carry the asset guard, DR-0155). The Vercel daily cap no longer binds deploys.',
    status: 'done', area: 'Infrastructure', created: '2026-06-18', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): this sat "awaiting cutover" long after the
    // cutover shipped — the exact stale-verdict class the refresh pass exists to catch.
  },
  {
    id: 'seed-review-sequences',
    concern: 'Review sequences are not running — there is no watcher driving the staged review/freshness loop.',
    solution: 'Stand up the watcher that runs the review sequences (behind the three brakes) so staged proposals actually move through review instead of sitting.',
    status: 'done', whenNote: 'RUNNING — daily braked pass (review-watcher.yml); activated on watched proof run 30014172152', area: 'Review loop', created: '2026-06-18', refreshed: '2026-07-23',
    // CLOSED 2026-07-23 (DR-0225 arc complete): engine wired through all three brakes
    // (kill-switch first, skip-not-stack lock, item+wall budgets, repeated-failure auto-trip;
    // each proven-to-catch in review-watcher.test.js); durable attributed pause file proven
    // both ways; runner glue proven by watched dispatch run 30014172152 (green, 19s); daily
    // schedule activated ON that proof. The review sequences now run on a clock.
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
    status: 'done', targetDate: '2026-07-08', area: 'Privacy / Tenancy', created: '2026-06-23', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): VERIFIED closed across three fronts —
    // P14 close (anonymous=demo / authenticated=own data, provenance filters on every sync
    // path), DR-0074 (identity gated on isFamilyEmail, RLS reality-tested with the parishioner
    // incident), DR-0222 (persona honesty). And it now has a PERMANENT sentinel: Ari's
    // "Lessons recurrence" P14 check fires bug-severity if a demo row ever rides again.
  },
  {
    id: 'seed-fb-choir-add-data-loss',
    concern: 'Adding an entry under the Choir schedule discards it — a choir editor tapped "Add" and the information disappeared instead of saving.',
    solution: 'Code-side the discard path is closed: a failed save now keeps the form open with everything typed still there and an error banner saying why (the form closes ONLY on a confirmed save — regression-tested), and a skipped write is always reported instead of silent. Remaining: verify on a real device that a real entry survives a reload, then close.',
    status: 'in-progress', targetDate: '2026-08-01', area: 'Church · Choir', created: '2026-06-23', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): code-side discard path closed + regression-
    // tested; the remaining bar is a real-device save-survives-reload check — re-dated to the
    // same 2026-08-01 family device pass as the PWA update item.
  },
  {
    id: 'seed-fb-church-next-sunday-date',
    concern: 'The livestream surface shows the wrong date for "next Sunday" and the loop can go stale — it should always compute the actual upcoming Sunday.',
    solution: 'Derive the next-Sunday date from the real calendar each render (never a frozen value) so the livestream card is always current. Church-live work is in flight; verify the computed date against a real upcoming Sunday before closing.',
    status: 'done', targetDate: '2026-07-01', area: 'Church · Livestream', created: '2026-06-23', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): VERIFIED — church-live.js derives the next
    // service datetime from the real schedule each render (incl. week-boundary wrap, lines
    // ~115-137); nothing frozen. Done on evidence.
  },
  {
    id: 'seed-fb-choir-youtube-broken',
    concern: 'The Choir tab’s YouTube-link-to-video feature is broken — pasting a link does not process into a playable video.',
    solution: 'Fixed 2026-06-23: the church livestream recording links (youtube.com/live/…) and /shorts/ + /v/ forms were falling through to a plain link instead of embedding; the embed helper now recognizes them all and a regression test pins every form. A pasted link that resolves to a real video renders a playable in-place player; anything unrecognizable still gets an honest "Open link" instead of a dead card.',
    status: 'done', targetDate: '2026-07-09', area: 'Church · Choir', created: '2026-06-23',
  },
  {
    id: 'seed-fb-capex-tab-broken',
    concern: 'The Capital Expenditure tab is reported broken — and the reporter asked that all of its buttons be re-checked.',
    solution: 'Diagnose what is broken on the CapEx tab (it may be the held video-wall CapEx surface), fix it, and audit every button/control on the tab. Reproduce the break first — characterize before changing.',
    status: 'open', targetDate: '2026-08-05', area: 'Projects · CapEx', created: '2026-06-23', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): still needs a reproduction; folded into the
    // DR-0224 works-when-used/button-audit executor (dated 2026-08-05), which is built to catch
    // exactly this class. Re-dated to ride that gate, not silently slid.
  },
  {
    id: 'seed-fb-login-new-version',
    concern: 'Some users cannot sign in after an app update ("can’t login with the new version"). Root cause not yet confirmed — may relate to the reported sign-out-after-time / token-refresh symptom.',
    solution: 'DIAGNOSE FIRST (do not guess a fix): reproduce the post-update sign-in failure, check the service-worker/auth-token interaction and the session refresh path, then fix. UNKNOWN until reproduced. Target is a commitment to investigate, not yet to fix.',
    status: 'open', targetDate: '2026-08-01', area: 'Auth / Sign-in', created: '2026-06-23', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): the DR-0160 service-worker rebuild (P33)
    // removed the most likely mechanism (a broken cached worker killing navigations after
    // update), but this stays open until the sign-in path is confirmed on a real device —
    // re-dated to the 2026-08-01 family device pass. Diagnose-first still holds.
  },
  {
    id: 'seed-fb-feedback-multi-image',
    concern: 'The feedback screenshot picker only lets you attach one image at a time — users want to select 3-4 screenshots at once instead of filing multiple entries.',
    solution: 'Allow multi-select in the feedback image picker (the screenshots column is already jsonb/array-capable). Low effort, repeatedly requested — good early win. Verify a multi-image submission round-trips to the board thumbnail strip.',
    status: 'done', targetDate: '2026-07-05', area: 'Feedback', created: '2026-06-23', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): VERIFIED — the feedback file input is
    // `multiple` and picks accumulate (FeedbackCenter.jsx ~394, ~276). Done on evidence.
  },
  {
    id: 'seed-fb-tab-whitespace',
    concern: 'A tab row shows dead white space on the right and the tab can be hard to tap — it should look normal and be easily clickable.',
    solution: 'The shared TabScroll primitive + overflow guard (PR #279) is built to fix exactly this (horizontal sub-tab scrolling, no white void). Un-hold and ship #279, then confirm the reported tab row scrolls/taps cleanly.',
    status: 'done', whenNote: 'shipped — TabScroll live across 16 components', area: 'Layout / Tabs', created: '2026-06-23', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): VERIFIED — TabScroll shipped and is used
    // by 16 components (the 2026-07-07 sliding-tabs directive completed its tracked backlog).
    // The stale "PR #279 on hold" note outlived the ship — refreshed on evidence.
  },
  {
    id: 'seed-fb-rentals-photos-missing',
    concern: 'Some property photos do not load in Real Estate ("can’t get all photos / photos are missing").',
    solution: 'Genuinely-not-backed-up images are a NAS-side photo-bridge resolver limit, now flagged honestly via lib/photo-source-health rather than failing silently. Remaining work: resolve the missing-thumbnail generation on the NAS bridge so the real photos appear. Honest interim status: some are not yet retrievable.',
    status: 'in-progress', whenNote: 'NAS photo-bridge resolver limit; flagged via photo-source-health', area: 'Real Estate · Photos', created: '2026-06-23', refreshed: '2026-07-23',
  },
  {
    id: 'seed-fb-observation-photos-cameras',
    concern: 'Cannot upload photos to Observation, and the surveillance cameras are not yet viewable in the app.',
    solution: 'Two parts: (1) wire photo upload into the Observation surface; (2) stream the family/property cameras into the app via the planned docker-wyze-bridge on the NAS over Tailscale. Camera streaming is a larger sovereign-infra build — sequenced after the photo-upload fix.',
    status: 'open', whenNote: 'camera bridge (Wyze → NAS) planned', area: 'Church · Observation', created: '2026-06-23', refreshed: '2026-07-23',
  },
  {
    id: 'seed-fb-create-study-open-docs',
    concern: 'Cannot open documents inside the Create or Study spaces — and the user wants to draft documentation from past messages in the format of the Bishop’s original document.',
    solution: 'Two parts: (1) let the Create/Study spaces open existing documents; (2) a "draft from past messages" helper that produces a document matching the Bishop’s document format (ties to the Pulpit corpus-grounded prep). Study/creation work is in flight.',
    status: 'in-progress', targetDate: '2026-08-08', area: 'Create / Study', created: '2026-06-23', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): study/creation work is in flight but the
    // open-documents + draft-from-past-messages asks are not yet verified shipped — honestly
    // re-dated with the why, not silently slid.
  },
  {
    id: 'seed-fb-markets-ticker',
    concern: 'Markets shows stock data before the ticker is live — it should not display data until the ticker is on, moving, and accurate.',
    solution: 'Gate the Markets data display on a live, accurate ticker feed (no painted/stale numbers shown first). Verify the ticker reflects real, moving quotes before any figure renders.',
    status: 'done', targetDate: '2026-07-15', area: 'Markets', created: '2026-06-23', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): VERIFIED — Markets shows only real fetched
    // quotes with a visible "updated <time>" stamp; a failed feed renders an honest error +
    // dashes, never painted/stale numbers (Markets.jsx ~35-85; hardened after the 2026-07-05
    // two-device live test). The no-painted-numbers substance of this ask is shipped.
  },
  {
    id: 'seed-fb-choir-song-curation',
    concern: 'The choir wants to add and review song links, pick a final 10, send the rest back to the song list, and have the chosen songs populate an interactive area where all choir members can play them and leave comments.',
    solution: 'Shipped as the Choir → Songs workshop: any member adds a song or pastes a list; everyone plays them in-app, hearts them, and leaves comments; the director marks songs Final (or back to candidates / back to the pool) and assigns leads, with the Final set on top and the remainder in the collapsible pool. Choir-member-scoped end to end. The "final 10" count is held by the director’s hand rather than an enforced cap. In Christina’s hands — her 2026-07-04 schedule request builds on the imported songs from this tab.',
    status: 'done', targetDate: '2026-07-18', area: 'Church · Choir', created: '2026-06-23',
  },
  {
    id: 'seed-fb-projects-historical',
    concern: 'Projects need a historical record — past projects and "seeds of what was" — for audit and to understand the current operational position and what to do next.',
    solution: 'Surface a project history/lifecycle trail (archive + lifecycle stages + discussions) so prior projects inform current decisions. The Projects management cockpit + lifecycle trail (PR #237, held) is the home for this.',
    status: 'in-progress', whenNote: 'lifecycle trail in PR #237 (held)', area: 'Projects', created: '2026-06-23', refreshed: '2026-07-23',
  },
  {
    id: 'seed-fb-conference-all-ages',
    concern: 'Praise for the kids’ class plus a request: an all-ages technology class at the upcoming conference — the elders want to learn at their own pace, and the 35-45 middle wants the best for the whole family without having to help everyone constantly.',
    solution: 'The all-ages conference class (three paced lanes: elders / set-it-up-once 35-45 / youth) is already built on the feat/conference-all-ages-class branch. Remaining: Tier C soak + Bishop’s review + confirm the conference date, then ship.',
    status: 'in-progress', whenNote: 'built on branch; Bishop review + conference date (values the family holds)', area: 'Church · Learn', created: '2026-06-23', refreshed: '2026-07-23',
  },
  {
    id: 'seed-fb-books-number-drilldown',
    concern: 'The user wants budget numbers to be tappable — clicking a figure should link to its underlying sources, so users can see the numbers behind the number and learn how the business runs.',
    solution: 'Make Books figures drill down to their sources (the figures already derive from the ledger via lib/account-balances.js — expose that lineage on tap). Education-and-clarity feature, not a defect. Lower urgency than the correctness bugs.',
    status: 'open', targetDate: '2026-08-05', area: 'Books', created: '2026-06-23', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): PARTIALLY shipped — TraceableNumber (the
    // numbers-behind-the-number primitive, lib/number-trace.js) is live on Big Picture; the
    // remaining work is extending it to the Books figures themselves. Re-dated for that extension.
  },
  {
    id: 'seed-fb-church-obvious-next-steps',
    concern: 'The Church section "doesn’t feel finished" — the user wants obvious next choices so they know what to do (a clarity gap, not a missing feature).',
    solution: 'Apply the Anxiety→Clarity standard to the Church surfaces: every surface answers what / when / why / how, with an obvious next action. Audit the Church tabs for dead-ends and add clear next-step affordances.',
    status: 'open', targetDate: '2026-08-18', area: 'Church', created: '2026-06-23', refreshed: '2026-07-23',
    // Refresh 2026-07-23 (DR-0225 aged-items pass): aligned to DR-0224's dated anxiety-clarity
    // four-question gate (2026-08-18), which machine-enforces exactly this ask — every church
    // surface answers what/when/why/how with an obvious next action.
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
    status: 'open', whenNote: 'needs image review with Darrell', area: 'Feedback', created: '2026-06-23', refreshed: '2026-07-23',
  },
  {
    id: 'seed-fb-community-promotion',
    concern: 'A beta user (a community designer) asked for help getting their work seen beyond their current base — promotion / marketing reach. This is a product signal, not a defect.',
    solution: 'Logged as a community-product signal, not a bug. Re-review whether PoeTech offers community members promotion/marketing reach (aligned-brand, serve-not-extract) as a deliberate product decision rather than an ad-hoc fix.',
    status: 'open', whenNote: 're-review 2026-08-15 (product signal, not a defect)', area: 'Community', created: '2026-06-23', refreshed: '2026-07-23',
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
//
// Every card is AUTO-EVALUATED here (lib/feedback-triage) — category, severity,
// routed area, and a concrete suggested next step — so a submitted note lands
// actionable instead of "awaiting evaluation" (closes seed-feedback-auto-eval).
// A human still sets the real solution/target on the board; this is the triaged
// starting point. Severity is shown as a badge (critical feedback is visually
// flagged) without disturbing the curated board's nearest-target-first order.
// -----------------------------------------------------------------------------
export function feedbackToConcernCards(feedback = []) {
  return (feedback || [])
    .map((f) => (f ? { f, body: feedbackText(f) } : null))
    .filter((x) => x && x.body)
    .map(({ f, body }) => {
      const when = f.createdAt || f.submittedAt || f.submitted_at || null;
      const shots = Array.isArray(f.screenshots) && f.screenshots.length
        ? f.screenshots
        : (f.screenshot ? [f.screenshot] : []);
      // A triaged-as-resolved feedback row reads as done; everything else is an
      // open concern, now carrying its auto-evaluation.
      const status = f.triageStatus === 'resolved' || f.triageStatus === 'done' ? 'done' : 'open';
      const evaluation = evaluateFeedback(f);
      return {
        id: `fb-${f.id}`,
        concern: body,
        solution: null,
        status,
        targetDate: null,
        whenNote: `auto-triaged · ${evaluation.severityLabel}`,
        area: evaluation.routeArea,
        source: 'feedback',
        readOnly: true,
        evaluation,
        thumbnail: shots[0] || null,
        screenshotCount: shots.length,
        author: f.displayName || null,
        deviceLabel: f.deviceLabel || null,
        createdAt: when,
        created: when ? String(when).slice(0, 10) : null,
      };
    });
}

// -----------------------------------------------------------------------------
// auditToConcernCards — the proactive surface audit (DR-0086) as a read-through
// feed. The audit writes audit-findings.json with pre-mapped concern cards; we
// surface them here so a defect the audit caught lands on the board WITHOUT
// anyone naming it (Darrell is the Governor, not the QA). Read-only: the findings
// artifact is the source of truth (a re-audit that no longer finds it drops the
// card = auto-resolved). Defensive: never throws if the artifact is empty/absent.
// -----------------------------------------------------------------------------
export function auditToConcernCards(artifact = auditArtifact) {
  const cards = (artifact && Array.isArray(artifact.concerns)) ? artifact.concerns : [];
  return cards
    .filter((c) => c && c.id && c.concern)
    .map((c) => ({ ...c, source: 'audit', readOnly: true }));
}

// Compose the full board list from the inputs. DB concerns + seeds are the
// editable/baseline curated set; feedback + auto-audit + derived cards are
// appended read-through (feedback = human voice; audit = the machine's proactive
// voice; derived = the app's own processes flagging real-data gaps, coverage /
// reconciliation / shape — see lib/derive-concerns.js). A derived card auto-
// resolves the moment its detector stops finding the problem, exactly like audit.
export function composeConcerns({ dbConcerns = [], seeds = SEED_CONCERNS, feedback = [], audit = auditArtifact, derived = [] } = {}) {
  // DB rows win over a seed with the same id (a Governor can supersede a baseline
  // entry by adding a real row); de-dupe by id, DB first.
  const byId = new Map();
  for (const c of dbConcerns) if (c && c.id) byId.set(c.id, { ...c, source: c.source || 'manual' });
  for (const s of seeds) if (s && s.id && !byId.has(s.id)) byId.set(s.id, { ...s, source: 'seed' });
  const curated = [...byId.values()];
  const fb = feedbackToConcernCards(feedback);
  const au = auditToConcernCards(audit);
  // Derived cards are already board-shaped (source + readOnly set by the
  // detector); a curated DB/seed row with the same id supersedes it.
  const der = (Array.isArray(derived) ? derived : []).filter((c) => c && c.id && c.concern && !byId.has(c.id));
  return [...curated, ...fb, ...au, ...der];
}
