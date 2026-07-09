// =============================================================================
// interconnect-manifest — proof that the INTERCONNECTED-MODULE loops move LIVE
// data, file-verified at build (Darrell, 2026-06-29: "make sure all the loops of
// interconnected modules are actually moving LIVE data").
// =============================================================================
// The PoeTech app makes a lot of promises about modules feeding each other: a
// service recording fans out to The Word / Choir / Scripture; CRM funnels
// federate into one board; the inventory ledger derives on-hand and reconciles;
// feedback flows to the Concerns board and the proof rail. This manifest is the
// machine-checked record of WHICH of those interconnections are actually wired —
// and it can never paint a green it didn't earn (Verification Doctrine, DR-0076).
//
// Each loop names a real SOURCE (a persisted table / engine on disk) and the
// LINK points in real destination files that must reference it. The build reads
// those files and VERIFIES the wiring token is present. Rip the wiring out — drop
// the `practiceLeads` federation from CRM, stop ScriptureLibrary subscribing to
// the sermon stream — and the matching loop flips to `broken` (proven-to-catch):
// a loop can no longer silently go static.
//
//   status semantics (DECLARED truth, VERIFIED by the wiring):
//     'live'     — every link must be present; a missing token => broken (regression).
//     'building' — the seam/engine exists (source token verified) but the live
//                  wiring is not built yet; `awaiting` states the honest why. Never
//                  painted green — it reads amber "building", which is the truth.
//
// A loop is `broken` when its source token, or ANY declared link token, is absent
// from the file on disk. The guard (scripts/interconnect-guard.mjs) and a vitest
// both fail the build on any broken loop.
//
// Importable (buildInterconnectManifest) so vite.config bakes it into
// __INTERCONNECT_LOOPS__ and a vitest gates it. CLI: `node scripts/interconnect-manifest.mjs`.
// =============================================================================
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- the loop registry (the map). Each `token` is a literal substring that MUST
// appear in the named file for that wiring to count as present. -----------------
//
// Endpoints are real: SOURCE files are *-sync controllers / engines; LINK files
// are the destination components/libs that read the live source. The evidence
// behind every verdict is the 2026-06-29 interconnection trace.
export const INTERCONNECT_REGISTRY = [
  // ---- Flagship: church content fan-out (service recording -> destinations) ----
  {
    id: 'theword', name: 'Service recording → The Word', status: 'live',
    from: 'choir_sermons (ingested service corpus)', to: 'The Word (Pulpit) live feed',
    proves: 'A service message persists to choir_sermons and The Word reads the exact table live (realtime).',
    source: { file: 'app/src/lib/choir-sync.js', token: 'choir_sermons' },
    links: [{ file: 'app/src/components/Pulpit.jsx', token: 'subscribeSermons' }],
  },
  {
    id: 'choir-songbook', name: 'Service songs → Songbook', status: 'live',
    from: 'choir_songs (harvested repertoire)', to: 'Choir Songbook derived view',
    proves: 'Songs from the service corpus persist to choir_songs; the Songbook derives its view live (buildSongbook over the realtime stream).',
    source: { file: 'app/src/lib/choir-sync.js', token: 'choir_songs' },
    links: [
      { file: 'app/src/components/Choir.jsx', token: 'subscribeSongs' },
      { file: 'app/src/components/ChoirSongbook.jsx', token: 'buildSongbook' },
    ],
  },
  {
    id: 'scripture-appearances', name: 'Sermons + songs → Scripture connections', status: 'live',
    from: 'choir_sermons + choir_songs', to: 'Scripture "appearances" web',
    proves: 'A verse’s appearances in the church’s REAL sermons + songs surface live in Scripture connections (the engine was starved with [] before 2026-06-29; ScriptureLibrary now subscribes the live source).',
    source: { file: 'app/src/lib/choir-sync.js', token: 'choir_sermons' },
    links: [
      { file: 'app/src/components/ScriptureLibrary.jsx', token: 'subscribeSermons' },
      { file: 'app/src/components/ScriptureConnections.jsx', token: 'connectionsFor' },
    ],
  },

  // ---- CRM / revenue federation ----
  {
    id: 'crm-federation', name: 'Practice leads → one CRM board', status: 'live',
    from: 'practice_leads (revenue-team funnel)', to: 'CRM unified board',
    proves: 'The practice/revenue-team leads federate into the one CRM board live (the board was blind to practice_leads before 2026-06-29; now mapped via leadFromPracticeAcquisition).',
    source: { file: 'app/src/lib/practice-leads-sync.js', token: 'practice_leads' },
    links: [
      { file: 'app/src/components/CRM.jsx', token: 'leadFromPracticeAcquisition' },
      { file: 'app/src/poe-financial-mvp-v28.jsx', token: 'practiceLeads={data.practiceLeads' },
    ],
  },

  // ---- Inventory → value/variance → (financial) ----
  {
    id: 'inventory-onhand', name: 'Movement ledger → derived on-hand', status: 'live',
    from: 'inventory_movements (append-only ledger)', to: 'on-hand / kitchen stock',
    proves: 'On-hand is DERIVED live from the append-only movements ledger (onHandByItem), never a stored field.',
    source: { file: 'app/src/lib/inventory-movements-sync.js', token: 'inventory_movements' },
    links: [
      { file: 'app/src/lib/inventory.js', token: 'onHandByItem' },
      { file: 'app/src/components/KitchenInventory.jsx', token: 'onHandFor' },
    ],
  },
  {
    id: 'count-reconcile', name: 'Kitchen count → ledger reconcile', status: 'live',
    from: 'inventory_counts (count session)', to: 'inventory_movements (adjustments)',
    proves: 'Closing a count writes variance-adjustment movements back into the live ledger (reconcileCount → recordMovements), so value/variance round-trips.',
    source: { file: 'app/src/lib/kitchen-counts-sync.js', token: 'inventory_counts' },
    links: [{ file: 'app/src/components/KitchenInventory.jsx', token: 'reconcileCount' }],
  },
  {
    id: 'recipe-costing', name: 'Inventory cost → recipe costing', status: 'live',
    from: 'inventory_items (live unit costs)', to: 'Chef’s Corner recipe cost',
    proves: 'Recipe costing prices against the live inventory unit-costs (costRecipe over data.inventoryItems), not a static price list.',
    source: { file: 'app/src/lib/inventory-items-sync.js', token: 'inventory_items' },
    links: [{ file: 'app/src/components/ChefCorner.jsx', token: 'costRecipe' }],
  },

  // ---- Choir shared content → order of service ----
  {
    id: 'order-of-service', name: 'Choir songs → order of service', status: 'live',
    from: 'choir_songs (by id)', to: 'master order-of-service sector views',
    proves: 'The master order-of-service soft-links REAL choir songs by id and every sector view resolves them live (deriveSectorView), not free text.',
    source: { file: 'app/src/lib/service-program.js', token: 'church_service_segments' },
    links: [
      { file: 'app/src/components/ServiceProgram.jsx', token: 'subscribeSongs' },
      { file: 'app/src/lib/service-program.js', token: 'deriveSectorView' },
    ],
  },

  // ---- Feedback → concerns → proof rail ----
  {
    id: 'feedback-concerns', name: 'Feedback → Concerns → proof', status: 'live',
    from: 'feedback (per-surface capture)', to: 'Concerns board + Loop Health',
    proves: 'Feedback auto-feeds the Concerns board (composeConcerns) and the loop self-reports freshness in Loop Health.',
    source: { file: 'app/src/lib/feedback-sync.js', token: 'feedback' },
    links: [
      { file: 'app/src/components/ConcernsBoard.jsx', token: 'composeConcerns' },
      { file: 'app/src/lib/loop-health.js', token: 'feedback-concerns' },
    ],
  },

  // ---- Honest BUILDING loops: the seam exists, the live wiring does not yet. ----
  {
    id: 'trivia-engagement', name: 'Wednesday message → daily Trivia', status: 'building',
    from: 'trivia_questions (table + review pipeline)', to: 'Engagement trivia card',
    proves: 'When connected: each Wednesday message’s end-of-video questions flow to the live trivia card.',
    source: { file: 'app/src/lib/engagement-sync.js', token: 'trivia_questions' },
    // READ side wired 2026-07-05 (live-data-tabs audit): the surface now asks
    // the live table first and falls back to the authored anchor set honestly.
    links: [
      { file: 'app/src/components/Engagement.jsx', token: 'getActiveQuestion' },
      { file: 'app/src/components/Engagement.jsx', token: 'getRecentQuestions' },
    ],
    awaiting: 'Producer not wired: Engagement now READS trivia_questions live (falls back to the anchor set when empty), but nothing writes questions yet (blocked on the church-inbox / Whisper extraction of Bishop Gwin’s Wednesday questions). Flips live when the producer lands its first row.',
  },
  {
    id: 'purchasing-forecast', name: 'Purchasing draft → forecast', status: 'building',
    from: 'inventory counts / purchasing draft', to: 'forward cash-flow projection',
    proves: 'When connected: approved purchasing spend (and inventory value) feed the financial projection.',
    source: { file: 'app/src/lib/financial-engineering.js', token: 'buildProjection' },
    links: [],
    awaiting: 'Not wired: buildProjection ingests cash / salaries / rentals only — no inventory value, COGS, or purchasing spend reaches it. purchasing.js is a pure engine with no surface, no sync, and no forecast input. Wiring a Purchasing surface and feeding draft spend into the projection is the open build (Chef Mario P4).',
  },
  {
    id: 'presenter-worship', name: 'Order of service → Presenter', status: 'building',
    from: 'master program set list', to: 'worship Presenter (NDI screens)',
    proves: 'When connected: a song added to the master program flows onto the presentation screens via the shared Presenter.',
    source: { file: 'app/src/lib/worship-presenter.js', token: 'masterProgramToSetList' },
    links: [],
    awaiting: 'Built + tested but not mounted: no component renders the worship set-list through <Presenter> (6 other surfaces do). Needs a lyrics→sections mapper + a worship surface. The pure machinery and NDI output already exist.',
  },

  // ---- The system watching itself (DR-0091) ----
  {
    id: 'quality-throughput', name: 'Verification artifacts → Quality & Throughput board', status: 'live',
    from: 'legibility-health.json + audit-findings.json + ops_commands + _schema_migrations + the live harvest join', to: 'Quality & Throughput board (C2S See faculty)',
    proves: 'The steward board reads every quality/throughput number live from its real artifact — the vitest-synced legibility scan, the re-audit diff, the ops rows with timing+outcome, the migration ledger RPC, the harvest corpus join — with the governing DR + LESSONS principle resolved beside each number.',
    source: { file: 'app/src/lib/quality-throughput.js', token: 'resolveWhy' },
    links: [
      { file: 'app/src/components/QualityThroughput.jsx', token: 'legibilitySummaryLine' },
      { file: 'app/src/components/QualityThroughput.jsx', token: 'audit-findings.json' },
      { file: 'app/src/components/QualityThroughput.jsx', token: 'subscribeOpsCommands' },
      { file: 'app/src/components/QualityThroughput.jsx', token: 'fetchSchemaHealth' },
      { file: 'app/src/components/QualityThroughput.jsx', token: 'fetchLedger' },
      { file: 'app/src/components/CommandServeCenter.jsx', token: 'QualityThroughput' },
    ],
  },

  // ---- 2026-07-05 live-data-tabs audit — re-wired loops + the 0077 rails ----
  {
    id: 'library-sermon-recipes', name: 'Service recordings → Library book recipes', status: 'live',
    from: 'choir_sermons (ingested service corpus)', to: 'Library sermon-based book recipes',
    proves: 'The Library self-subscribes the live sermon stream (the shell mounted it with sermons={[]}, starving sermon-based recipes forever — the same starvation ScriptureLibrary had before 2026-06-29).',
    source: { file: 'app/src/lib/choir-sync.js', token: 'choir_sermons' },
    links: [{ file: 'app/src/components/Library.jsx', token: 'subscribeSermons' }],
  },
  {
    id: 'device-register-writer', name: 'Steward editor → church device register', status: 'live',
    from: 'DeviceInventory steward editor', to: 'church_devices (synced register)',
    proves: 'The device register has a producer: stewards add/edit devices in-surface via saveDevice, so the live-subscribed table can hold real state instead of only the bundled seed.',
    source: { file: 'app/src/lib/church-devices-sync.js', token: 'church_devices' },
    links: [{ file: 'app/src/components/DeviceInventory.jsx', token: 'saveDevice' }],
  },
  // The 0077 rails are declared BUILDING, not live, until Darrell applies
  // infra/supabase/migrations-auto/0077-live-data-rails.sql and rows are seen
  // landing on a signed-in device (P22: green means the target state MOVED;
  // a pending migration is runner-state, not a data-fact). The wiring tokens
  // are already declared so the flip to 'live' enforces them from day one.
  {
    id: 'doc-rails-0077', name: 'Device-local lists → family instance (doc rail)', status: 'building',
    from: 'game saves · subscriptions · skill profiles · prayer requests · One Voice', to: 'game_saves / family_subscriptions / skill_profiles / prayer_requests / church_voice (0077)',
    proves: 'When applied: the five audited device-local lists pool to the family instance on the jsonb-doc rail (the doc IS the record — no column drift), realtime both ways.',
    source: { file: 'app/src/lib/doc-sync.js', token: 'createDocTableSync' },
    links: [
      { file: 'app/src/poe-financial-mvp-v28.jsx', token: 'gameSavesSync' },
      { file: 'app/src/poe-financial-mvp-v28.jsx', token: 'subscriptionsSync' },
      { file: 'app/src/poe-financial-mvp-v28.jsx', token: 'skillProfilesSync' },
      { file: 'app/src/poe-financial-mvp-v28.jsx', token: 'prayerRequestsSync' },
      { file: 'app/src/poe-financial-mvp-v28.jsx', token: 'churchVoiceSync' },
    ],
    awaiting: '0077 APPLIED 2026-07-05 (db-migrate run 196, applied=1 failed=0) — the tables exist and the wiring is armed. Flips live per-rail as first real rows are verified landing cross-device (the watchlist rail already did; these five await their first real save).',
  },
  {
    id: 'watchlist-rail-0077', name: 'Markets watchlist → family instance', status: 'live',
    from: 'data.watchlist (Stooq symbols)', to: 'market_watchlist (0077)',
    proves: 'A ticker added on one device quotes on every family device. VERIFIED LIVE 2026-07-05: 0077 applied by db-migrate run 196 (applied=1 failed=0) and Darrell’s cross-device receipt — the same watchlist incl. a freshly-added symbol on his phone (3:06 AM) and desktop (3:08 AM), both on build 7F2A60D.',
    source: { file: 'app/src/lib/watchlist-sync.js', token: 'market_watchlist' },
    links: [
      { file: 'app/src/lib/live-rails.js', token: 'subscribeWatchlist' },
      { file: 'app/src/poe-financial-mvp-v28.jsx', token: 'wireLiveRails' },
    ],
  },
  {
    id: 'module-interest-rail-0077', name: 'Module priority votes → real family aggregate', status: 'building',
    from: 'About module votes (per member)', to: 'module_interest (0077) → Family Priority Votes',
    proves: 'When applied: About’s "family priority votes" is a REAL cross-member count (it was one device’s localStorage rendered as an aggregate — the painted claim this audit retired).',
    source: { file: 'app/src/lib/module-interest-sync.js', token: 'module_interest' },
    links: [
      { file: 'app/src/lib/live-rails.js', token: 'subscribeModuleInterest' },
      { file: 'app/src/poe-financial-mvp-v28.jsx', token: 'wireLiveRails' },
      { file: 'app/src/components/shared.jsx', token: 'familyModuleInterest' },
    ],
    awaiting: '0077 APPLIED 2026-07-05 — table exists, wiring armed; flips live when the first cross-member vote is verified in the Family Priority Votes aggregate.',
  },
];

// --- verification (the only source of truth for a loop's status) ---------------
function fileHasToken(file, token) {
  const abs = join(ROOT, file);
  if (!existsSync(abs)) return { fileExists: false, tokenPresent: false };
  let src = '';
  try { src = readFileSync(abs, 'utf8'); } catch { return { fileExists: false, tokenPresent: false }; }
  return { fileExists: true, tokenPresent: src.includes(token) };
}

export function verifyLoop(loop) {
  const src = fileHasToken(loop.source.file, loop.source.token);
  const sourceWired = src.fileExists && src.tokenPresent;
  const links = (loop.links || []).map((l) => {
    const r = fileHasToken(l.file, l.token);
    return { ...l, fileExists: r.fileExists, wired: r.fileExists && r.tokenPresent };
  });
  const linksWired = links.every((l) => l.wired);
  // 'live' requires source + every link; 'building' requires only its source seam.
  const wired = loop.status === 'building' ? sourceWired : (sourceWired && linksWired);
  // broken = a DECLARED wiring point is missing (regression). Building loops with
  // [] links are not broken unless their source seam itself vanished.
  const missing = [];
  if (!sourceWired) missing.push(`source ${loop.source.file} :: "${loop.source.token}"`);
  for (const l of links) if (!l.wired) missing.push(`link ${l.file} :: "${l.token}"`);
  const broken = missing.length > 0;
  return {
    id: loop.id, name: loop.name, status: loop.status, from: loop.from, to: loop.to,
    proves: loop.proves, awaiting: loop.awaiting || null,
    sourceFile: loop.source.file, links: links.map((l) => ({ file: l.file, token: l.token, wired: l.wired })),
    wired, broken, missing,
  };
}

// --- assemble ----------------------------------------------------------------
export function buildInterconnectManifest() {
  const loops = INTERCONNECT_REGISTRY.map(verifyLoop);
  const live = loops.filter((l) => l.status === 'live');
  const building = loops.filter((l) => l.status === 'building');
  return {
    ok: true,
    loops,
    summary: {
      total: loops.length,
      live: live.length,
      liveWired: live.filter((l) => l.wired).length,
      building: building.length,
      broken: loops.filter((l) => l.broken).length,
      allLiveWired: live.every((l) => l.wired),
    },
  };
}

// --- CLI ---------------------------------------------------------------------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const m = buildInterconnectManifest();
  console.log('# INTERCONNECTION LOOPS (real, file-verified)\n');
  for (const l of m.loops) {
    const tag = l.broken ? 'BROKEN' : l.status === 'building' ? 'building' : 'live';
    console.log(`[${tag.toUpperCase().padEnd(8)}] ${l.name}`);
    if (l.broken) for (const miss of l.missing) console.log(`             missing ${miss}`);
  }
  console.log(`\nLive wired: ${m.summary.liveWired}/${m.summary.live} · building: ${m.summary.building} · broken: ${m.summary.broken}`);
  if (m.summary.broken > 0) {
    console.log('\nA declared interconnection loop lost its wiring — a loop went static. Fix the wiring or update the registry.');
    process.exit(1);
  }
  console.log('\nAll live interconnection loops are wired; building loops are honestly declared.');
}
