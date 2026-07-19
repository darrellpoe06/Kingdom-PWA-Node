// =============================================================================
// presentable — the generic "present this to a room" contract + adapters
// =============================================================================
// The two-screen present mode (a presenter window on the laptop, a clean projected
// AUDIENCE window behind the speaker) began life welded to ONE surface: the youth
// "Learning A.I." course (see teach-present.js / TeachMode.jsx). Darrell, looking at
// the live build 79dfccd: "currently only one course can use the live presenter
// instead of everyone and everything can."
//
// This module is the incremental generalization: a small, surface-agnostic CONTRACT
// any surface can implement to become presentable, plus the pure helpers the shared
// <Presenter> primitive and the projected <AudienceWindow> both read. It does NOT
// know about courses or sermons — adapters at the bottom translate those concrete
// surfaces into the contract, and new surfaces (creation-workspace documents,
// "family works") plug in later by writing one more adapter, with no change here.
//
// THE CONTRACT — a `presentable`:
//   {
//     id,            // stable id for the source (channel stays shared/versioned)
//     title,         // the presenter header + the holding-slide headline
//     kicker,        // small top label on the projected screen (defaults to COLG)
//     targetMin,     // the session-timer target, in minutes
//     scenes: [Scene]
//   }
// A `Scene` (one "slide" the presenter advances through):
//   {
//     id,
//     indexLabel,    // "Week 1 of 8" / "Message 3 of 40" — honest position text
//     dateLabel,     // a real formatted date, or null (never a painted date)
//     audience: {    // what the ROOM sees — learner/listener-facing only
//       title, lead, detail, detailLabel, anchorRef, anchorTheme
//     },
//     notes: [Note]  // presenter-ONLY; NEVER broadcast (no leak to the projector)
//   }
// A `Note` (one presenter-only panel): { kind:'body'|'steps'|'list'|'callout',
//   heading, body?, items? }.
//
// DESIGN INVARIANT (carried from the original, DR-0076): the broadcast payload
// carries ONLY audience fields. Facilitator notes, sermon prep, and document bodies
// stay on the presenter's laptop and can never reach the projected screen.
// =============================================================================
import { TEACH_CHANNEL, formatClock } from './teach-present.js';
import { formatClassDate } from './church-classes.js';
import { kjvText } from './scriptures.js';
import { serviceKindLabel } from './service-day.js';

// Re-export the shared, versioned channel + clock so callers import one module.
export { TEACH_CHANNEL, formatClock };

// The default projected kicker — the canonical "through the church to present"
// framing (see UX rules): a family's works go up on the screen THROUGH the church.
export const DEFAULT_KICKER = 'The Church of the Living God';

// The slide a Scene broadcasts to the audience window. Audience-only by construction
// — it reads scene.audience and never scene.notes. Returns null for an out-of-range
// index (the projector then holds its last good slide). Adds generic fields
// (index/indexLabel/kicker/detailLabel) on top of the original course payload shape,
// so the existing AudienceWindow keeps working and new surfaces label themselves.
// Resolve the audience LEAD line for the room at the current age band. A scene may
// carry `audience.leadByAge` ({ child, teen, adult }) so the speaker can RE-PITCH the
// same slide to the room LIVE — switch the band and this returns the matching text,
// with the base `lead` as the fallback (Darrell 2026-07-16: "have the audience choice
// the whole way through... switch instantly, not go out then back to the top").
export function resolveAudienceLead(audience, age) {
  const a = audience || {};
  if (a.leadByAge && typeof a.leadByAge === 'object' && age && a.leadByAge[age]) return a.leadByAge[age];
  return a.lead || '';
}

// Every Scripture reference a scene puts before the room — its anchor (split on ';')
// plus any references it cites. Used to build the running "Scriptures so far" rail.
function sceneScriptureRefs(scene) {
  const a = (scene && scene.audience) || {};
  const out = [];
  if (a.anchorRef) String(a.anchorRef).split(';').forEach((r) => { const t = r.trim(); if (t) out.push(t); });
  if (Array.isArray(a.citedRefs)) a.citedRefs.forEach((r) => { if (r) out.push(String(r).trim()); });
  return out;
}

export function buildSlideForScene(scenes, index, opts = {}) {
  const list = Array.isArray(scenes) ? scenes : [];
  const scene = list[index];
  if (!scene) return null;
  const total = list.length;
  const a = scene.audience || {};
  const lead = resolveAudienceLead(a, opts.age);
  const points = resolveAudiencePoints(a, opts.age);
  // The RUNNING list of Scriptures cited through THIS slide (deduped, in order), and
  // the lesson's grand total — a growing index the room can follow (Darrell 2026-07-19).
  const soFar = [];
  const seenSoFar = new Set();
  for (let k = 0; k <= index && k < list.length; k += 1) {
    for (const r of sceneScriptureRefs(list[k])) { if (!seenSoFar.has(r)) { seenSoFar.add(r); soFar.push(r); } }
  }
  const allRefs = new Set();
  for (const sc of list) for (const r of sceneScriptureRefs(sc)) allRefs.add(r);
  return {
    type: 'slide',
    index: index + 1,
    total,
    indexLabel: scene.indexLabel || `${index + 1} of ${total}`,
    id: scene.id || null,
    title: a.title || '',
    // `lead`/`detail` are the generic names; mirror them onto the original
    // `bigIdea`/`inApp` keys so an un-upgraded AudienceWindow still renders.
    lead,
    bigIdea: lead,
    // Bullet/numbered points shown UNDER the main idea for details + note-takers.
    points: points.length ? points : null,
    ordered: !!a.ordered,
    // Scripture references cited on this slide — AudienceSlide resolves them to
    // verbatim KJV so the room reads the Word directly, in context.
    citedRefs: Array.isArray(a.citedRefs) && a.citedRefs.length ? a.citedRefs : null,
    // The running list of every Scripture cited up to (and including) this slide, and
    // the lesson's total — the side-rail index the room follows to the end.
    scripturesSoFar: soFar.length ? soFar : null,
    scripturesTotal: allRefs.size,
    detail: a.detail || null,
    inApp: a.detail || null,
    detailLabel: a.detailLabel || 'In the app',
    anchorRef: a.anchorRef || null,
    anchorTheme: a.anchorTheme || null,
    // Verbatim Scripture the ROOM reads (opener + the closing recap) — the Word on
    // the class screen, not just the location (Darrell 2026-07-16).
    scripture: a.scripture || null,
    dateLabel: scene.dateLabel || null,
    kicker: opts.kicker || DEFAULT_KICKER,
  };
}

// An intentional holding placeholder (between scenes / at the door) so the projector
// shows something deliberate instead of a stale slide. Carries the kicker too.
export function holdingSlide(title, kicker) {
  return { type: 'hold', title: title || 'Ready to begin', kicker: kicker || DEFAULT_KICKER };
}

// -----------------------------------------------------------------------------
// Age-adaptive presenting hook (child / teen / adult)
// -----------------------------------------------------------------------------
// "Every user, every age presents their family's works." The full age-adaptive
// rendering is research-gated (see the follow-on doc); this is the shippable hook:
// a one-line coaching note the PRESENTER sees, tuned to who is in the room. It never
// changes what the audience sees — it only changes how the presenter is coached.
// Every authored VERSION of the lesson is selectable, not just the three ages
// (Darrell 2026-07-19: "why limit the speakers when we have all versions of the
// curriculum for any audiences?"). A lesson authors four audience registers — the
// general big idea (for a MIXED room, any age) plus the child / teen / senior
// rewrites — so the presenter exposes all four. `everyone` = the big idea; `adult`
// = the mature "senior" rewrite (the deeper register). Switching re-pitches the
// room's wording live; it never changes the presenter's depth notes.
export const PRESENT_AGE_BANDS = [
  { id: 'everyone', label: 'Everyone', hint: 'The one big idea, pitched for a mixed room — the version written for anyone, any age.' },
  { id: 'child', label: 'Children', hint: 'One idea per slide. Read it aloud, ask a question, keep it short and warm.' },
  { id: 'teen', label: 'Teens', hint: 'Move at a good clip. Invite reactions, connect each slide to something real to them.' },
  { id: 'adult', label: 'Adults', hint: 'The mature, seasoned-believer rewrite — give room for the deeper idea and discussion; the notes panel carries the depth.' },
];
// A mixed congregation is the common case, so the general "Everyone" register is the
// natural default; the speaker switches to a specific age with one tap.
export const DEFAULT_PRESENT_AGE = 'everyone';

export function ageHint(bandId) {
  const b = PRESENT_AGE_BANDS.find((x) => x.id === bandId) || PRESENT_AGE_BANDS.find((x) => x.id === DEFAULT_PRESENT_AGE);
  return b ? b.hint : '';
}

// -----------------------------------------------------------------------------
// Time-adaptive presenting: per-scene WEIGHT + proportional fit-to-budget
// -----------------------------------------------------------------------------
// "I have 30 minutes today." A scene carries planning fields so the presenter can
// reflow a full curriculum into the time actually available WITHOUT flattening it:
//   • estimatedMin — the section's TIME-NEED weight: real minutes it needs at full
//     depth. Heavier/deeper sections weigh more; this is NOT a uniform split. Authors
//     set it; when unset we estimate a sensible (non-uniform) weight from content.
//   • importance   — the LESSON WEIGHT: how essential this material is (default 1).
//     Higher = more essential. The most essential material is PROTECTED and gets the
//     minutes; lower-importance material compresses, and drops first. (Coordinates
//     with the Learn-engine lesson-weighting primitive — see IMPORTANCE seam below.)
//   • minMin       — the floor: the smallest usable time the section can shrink to.
//   • priority     — 'core' (protected) | 'supplementary' (droppable first).
// All are PRESENTER-side planning fields; like notes they are NEVER part of the
// audience broadcast (buildSlideForScene reads only scene.audience). Existing
// presentables keep working — the backfill helpers supply sensible defaults (and
// importance defaults to 1, so a curriculum with no weights reflows exactly as before).
//
// THE REFLOW (fitToBudget) is PROPORTIONAL + IMPORTANCE-WEIGHTED:
//   1. Time given to each surviving section ∝ (estimatedMin × importance), so heavier
//      AND more-essential material holds more of the clock; lower-importance material
//      compresses more. A section never gets MORE than its natural need (estimatedMin)
//      and never less than its floor (minMin) — two-sided water-filling.
//   2. With uniform importance this is exactly the time-proportional reflow (#304/#309).
//   3. SKIP-FALLBACK: only when the floors themselves overflow the budget do we drop
//      sections — by ASCENDING IMPORTANCE (least-essential first), NEVER core — until
//      the floors fit. The weightiest substance is never the thing cut.
export const DEFAULT_SCENE_MIN = 5;     // floor for an estimated weight
export const DEFAULT_FLOOR_MIN = 2;     // default minimum a section can shrink to
export const DEFAULT_IMPORTANCE = 1;    // lesson weight; >1 = more essential, <1 = less
export const PRIORITY = { CORE: 'core', SUPPLEMENTARY: 'supplementary' };

const round1 = (x) => Math.round((Number(x) || 0) * 10) / 10;

// A sensible NON-uniform default weight when an author hasn't set estimatedMin:
// deeper sections (more learner copy, more run-of-show steps, more discussion) need
// more time. Bounded so one rich scene can't dominate. Deterministic + pure.
export function estimateSceneMinutes(scene) {
  if (!scene || typeof scene !== 'object') return DEFAULT_SCENE_MIN;
  const a = scene.audience || {};
  const notes = Array.isArray(scene.notes) ? scene.notes : [];
  let m = 3; // any slide needs a few minutes
  const copyLen = String(a.lead || '').length + String(a.detail || '').length;
  m += Math.min(4, Math.round(copyLen / 140));           // richer learner copy
  notes.forEach((n) => {
    if (n && n.kind === 'steps') m += Math.min(6, (n.items || []).length);            // run-of-show steps take real time
    else if (n && n.kind === 'list') m += Math.min(4, Math.ceil((n.items || []).length / 2));
    else m += 1;                                           // a body / callout note
  });
  return Math.max(DEFAULT_SCENE_MIN, Math.min(25, m));
}

// The floor never exceeds the section's own weight and never drops below 1 min.
function sceneFloor(scene, weight, opts) {
  const raw = Number(scene && scene.minMin);
  const base = Number.isFinite(raw) && raw > 0
    ? raw
    : (Number.isFinite(opts.floorMin) && opts.floorMin > 0 ? opts.floorMin : DEFAULT_FLOOR_MIN);
  return Math.max(1, Math.min(base, weight));
}

// Non-mutating: return a copy of `scene` guaranteed to carry a positive weight
// (estimatedMin), a valid priority, and a floor (minMin). A provided estimatedMin is
// the author's weight; otherwise opts.defaultMin, else the content estimate. Unknown
// priority defaults to CORE so an un-annotated curriculum is treated as all-core.
export function withSceneTiming(scene, opts = {}) {
  if (!scene || typeof scene !== 'object') return scene;
  const estIn = Number(scene.estimatedMin);
  const weight = Number.isFinite(estIn) && estIn > 0
    ? estIn
    : (Number.isFinite(opts.defaultMin) && opts.defaultMin > 0 ? opts.defaultMin : estimateSceneMinutes(scene));
  const impIn = Number(scene.importance);
  return {
    ...scene,
    estimatedMin: weight,
    priority: scene.priority === PRIORITY.SUPPLEMENTARY ? PRIORITY.SUPPLEMENTARY : PRIORITY.CORE,
    minMin: sceneFloor(scene, weight, opts),
    importance: Number.isFinite(impIn) && impIn > 0 ? impIn : DEFAULT_IMPORTANCE,
  };
}

// Backfill timing across a scene array (used by adapters + fitToBudget).
export function backfillTiming(scenes, opts = {}) {
  return (Array.isArray(scenes) ? scenes : []).map((s) => withSceneTiming(s, opts));
}

// Total minutes to teach the WHOLE curriculum at full depth.
export function fullContentMin(scenes, opts = {}) {
  return backfillTiming(scenes, opts).reduce((sum, s) => sum + s.estimatedMin, 0);
}

// The default (deterministic, no-LLM) order in which supplementary scenes are
// dropped to make room: largest time first, so the FEWEST sections are cut to fit;
// ties break by original position (stable). Returns the drop order as keys.
//
// SEAM (research-gated, behind brakes — intentionally NOT wired here): an adaptive
// suggester could replace this with a model-ranked order. fitToBudget accepts
// `opts.rankSkips(candidates, ctx) -> [key]`; the local-LLM tier would supply that
// behind the three brakes (budget / concurrency-lock / kill-switch). Leave the seam
// clean; do not call a model from this pure module.
export function deterministicSkipRanker(candidates) {
  return candidates
    .slice()
    .sort((a, b) => (b.estimatedMin - a.estimatedMin) || (a._i - b._i))
    .map((c) => c._key);
}

// The IMPORTANCE-WEIGHTED drop order (the default for fitToBudget): drop the LEAST
// essential material first — ascending importance, so the weightiest substance is the
// last thing ever cut. Ties (equal importance — the default-uniform case) fall back to
// the deterministic largest-time-first order, so an un-weighted curriculum drops
// exactly as it did before weighting existed.
export function importanceSkipRanker(candidates) {
  return candidates
    .slice()
    .sort((a, b) => ((a.importance || DEFAULT_IMPORTANCE) - (b.importance || DEFAULT_IMPORTANCE))
      || (b.estimatedMin - a.estimatedMin)
      || (a._i - b._i))
    .map((c) => c._key);
}

function sceneKey(scene, i) {
  return scene && scene.id != null ? String(scene.id) : `#${i}`;
}

function fitSummary({ budget, counts, fits, overBudget, compressed, weighted }) {
  const m = Math.round(budget);
  const { coreKept, suppKept, suppSkipped, atFloor } = counts;
  const byWeight = weighted ? ' the most essential material is protected;' : '';
  if (overBudget) {
    return `Even the minimum times don’t fit ${m} min —${byWeight} ${coreKept} core section${coreKept === 1 ? '' : 's'} run below their floor to keep pace. Consider a little more time.`;
  }
  if (suppSkipped > 0) {
    const floored = atFloor > 0 ? ` (${atFloor} at their floor)` : '';
    const dropped = weighted ? `dropping ${suppSkipped} least-essential` : `skipping ${suppSkipped} supplementary`;
    return `To fit ${m} min: ${coreKept} core + ${suppKept} supplementary timed by weight${floored}, ${dropped} so the core still lands.`;
  }
  if (compressed) {
    const floored = atFloor > 0 ? `, ${atFloor} held at their floor` : '';
    const tail = weighted ? 'the most essential material keeps the most time' : 'heavier sections stay heavier';
    return `Reflowed into ${m} min — every section keeps its share of the time${floored}; ${tail}.`;
  }
  const n = coreKept + suppKept;
  return `All ${n} section${n === 1 ? '' : 's'} fit ${m} min — each runs to its own weight (heavier sections get more time).`;
}

// The importance-weighted allocation weight: time given ∝ time-need × essentialness.
// With uniform importance (the default) this is just estimatedMin, so the reflow is
// byte-identical to the pure time-proportional one.
const allocWeight = (r) => r.estimatedMin * (r.importance || DEFAULT_IMPORTANCE);

// Two-sided water-filling: split `amount` minutes across `active` rows proportionally
// by allocWeight, but clamp each row to [floor (minMin), cap (estimatedMin)] — a row
// never shrinks below its floor and never gets MORE than its natural need. Floored
// rows are pinned UP and re-split; capped rows are pinned DOWN, freeing their surplus
// for the rest, which is how a high-importance row gets protected while low-importance
// rows compress. Mutates allocatedMin / atFloor / atCap.
// Pre-req: sum(floors) <= amount <= sum(caps) (the caller guarantees this), so it
// converges in <= 2*active.length passes. Pure aside from the row mutation.
function waterFillProportional(active, amount) {
  const pinned = new Set();
  const fixedSum = () => active.filter((r) => pinned.has(r)).reduce((sum, r) => sum + r.allocatedMin, 0);
  for (let guard = 0; guard <= active.length * 2 + 1; guard += 1) {
    const pool = active.filter((r) => !pinned.has(r));
    if (!pool.length) return;
    const remaining = amount - fixedSum();
    const sumW = pool.reduce((sum, r) => sum + allocWeight(r), 0) || 1;
    const share = (r) => (allocWeight(r) / sumW) * remaining;
    const below = pool.filter((r) => share(r) < r.minMin - 1e-9);
    const above = pool.filter((r) => share(r) > r.estimatedMin + 1e-9);
    if (!below.length && !above.length) {
      pool.forEach((r) => { r.allocatedMin = round1(share(r)); r.atFloor = false; r.atCap = false; });
      return;
    }
    below.forEach((r) => { r.allocatedMin = round1(r.minMin); r.atFloor = true; r.atCap = false; pinned.add(r); });
    above.forEach((r) => { r.allocatedMin = round1(r.estimatedMin); r.atCap = true; r.atFloor = false; pinned.add(r); });
  }
}

// Reflow a curriculum into a time budget — PROPORTIONAL + floors + skip-fallback.
//   scenes    — the Scene array (weight/floor/priority backfilled here)
//   budgetMin — minutes available; <=0 / non-finite means "no budget" (full weights)
//   opts.overrides — { [sceneKey]: 'keep' | 'skip' } user force-keep / force-skip.
//                    A force-kept supplementary survives auto-skip; a force-skip
//                    drops a scene up front (core included — the user decides).
//   opts.defaultMin / opts.floorMin — defaults for un-timed scenes.
//   opts.rankSkips  — optional adaptive ranker (the LLM seam above).
//
// ALGORITHM (importance-weighted):
//   1. Each surviving section's time ∝ (estimatedMin × importance) / Σ(…) × budget, so
//      the most ESSENTIAL material holds more of the clock and lower-importance material
//      compresses more. With uniform importance this is the pure time-proportional split
//      (every section keeps the same % of the clock).
//   2. A section never gets MORE than its natural need (estimatedMin) nor less than its
//      floor (minMin) — two-sided water-filling protects the weighty and floors the rest.
//   3. If even the floors overflow the budget, SKIP by ASCENDING IMPORTANCE (least
//      essential first), NEVER core, until floors fit. If only core remains and its
//      floors still overflow, core is protected and compressed below floor (overBudget,
//      still importance-weighted) — "as close as possible under the circumstances."
export function fitToBudget(scenes, budgetMin, opts = {}) {
  const overrides = opts.overrides || {};
  const timed = backfillTiming(scenes, opts);
  const fullMin = timed.reduce((sum, s) => sum + s.estimatedMin, 0);
  const budget = Number.isFinite(budgetMin) && budgetMin > 0 ? budgetMin : fullMin;

  // Build working rows, applying explicit user overrides first.
  const rows = timed.map((s, i) => {
    const key = sceneKey(s, i);
    const forced = overrides[key] === 'keep' ? 'keep' : (overrides[key] === 'skip' ? 'skip' : null);
    return {
      ...s,
      _key: key,
      _i: i,
      forced,
      skipped: forced === 'skip',
      skipReason: forced === 'skip' ? 'forced' : null,
      atFloor: false,
      allocatedMin: 0,
    };
  });

  const activeRows = () => rows.filter((r) => !r.skipped);
  const floorSum = () => activeRows().reduce((sum, r) => sum + r.minMin, 0);

  // --- skip-fallback: ONLY when the floors themselves can't fit the budget. Drop the
  // LEAST ESSENTIAL (lowest importance) supplementary sections first, NEVER core,
  // until floors fit — so the weightiest substance is never the thing cut. ---
  const candidates = rows.filter((r) => !r.skipped && r.priority === PRIORITY.SUPPLEMENTARY && r.forced !== 'keep');
  const ranker = typeof opts.rankSkips === 'function' ? opts.rankSkips : importanceSkipRanker;
  let order = [];
  try {
    const ranked = ranker(candidates.map((c) => ({ ...c })), { budget, fullMin }) || [];
    order = ranked.map((k) => candidates.find((c) => c._key === k)).filter(Boolean);
  } catch { order = []; }
  // Append any candidate the ranker omitted, by ascending importance, so we never stall.
  importanceSkipRanker(candidates).forEach((k) => {
    const c = candidates.find((x) => x._key === k);
    if (c && !order.includes(c)) order.push(c);
  });

  let di = 0;
  while (floorSum() > budget && di < order.length) {
    order[di].skipped = true;
    order[di].skipReason = 'auto';
    di += 1;
  }

  // --- proportional allocation with floors over the surviving sections ---
  const active = activeRows();
  const activeW = active.reduce((sum, r) => sum + r.estimatedMin, 0);
  // Fill up to the content weight: more time than needed -> natural weights (slack);
  // less -> proportional shrink. Floors handled inside waterFillProportional.
  const fill = Math.min(budget, activeW);
  const overBudget = floorSum() > budget; // even the floors don't fit (core too big)
  if (active.length) {
    if (overBudget) {
      // can't honor floors — still protect importance: split below floor by allocWeight
      const w = active.reduce((sum, r) => sum + allocWeight(r), 0) || 1;
      active.forEach((r) => { r.allocatedMin = round1((allocWeight(r) / w) * budget); r.atFloor = false; r.atCap = false; });
    } else {
      waterFillProportional(active, fill);
    }
  }

  const kept = rows.filter((r) => !r.skipped);
  const skipped = rows.filter((r) => r.skipped);
  const counts = {
    total: rows.length,
    coreKept: kept.filter((r) => r.priority === PRIORITY.CORE).length,
    suppKept: kept.filter((r) => r.priority === PRIORITY.SUPPLEMENTARY).length,
    suppSkipped: skipped.filter((r) => r.priority === PRIORITY.SUPPLEMENTARY).length,
    coreSkipped: skipped.filter((r) => r.priority === PRIORITY.CORE).length,
    atFloor: kept.filter((r) => r.atFloor).length,
    atCap: kept.filter((r) => r.atCap).length,
  };
  const fits = fullMin <= budget;
  const compressed = budget < activeW;
  // weighted = the curriculum carries non-uniform lesson weights (importance varies)
  const weighted = active.some((r) => (r.importance || DEFAULT_IMPORTANCE) !== DEFAULT_IMPORTANCE);
  const strip = (r) => { const { _key, _i, ...rest } = r; return rest; };

  return {
    budgetMin: budget,
    fullMin,
    keptMin: kept.reduce((sum, r) => sum + r.allocatedMin, 0),
    fits,
    overBudget,
    compressed,
    weighted,
    plan: rows.map(strip),       // original order; every row annotated (allocatedMin/atFloor/atCap/skipped)
    kept: kept.map(strip),
    skipped: skipped.map(strip),
    counts,
    summary: fitSummary({ budget, counts, fits, overBudget, compressed, weighted }),
  };
}

// -----------------------------------------------------------------------------
// User-extensible curriculum (the "living curriculum"): add + edit scenes in place
// -----------------------------------------------------------------------------
// The presenter can ADD a section or EDIT/upgrade one as they teach, so a course or
// sermon set grows richer over time. These are pure transforms over a scene array;
// the component layers them as a persisted OVERLAY (see loadOverlay/applyOverlay) so
// the base adapter output is never mutated and the no-leak invariant is preserved —
// an added scene's notes still travel only in scene.notes, never to the projector.

// Build a well-formed Scene from the minimal fields an add/edit form collects.
export function makeScene(input = {}) {
  const a = input.audience || {};
  const notes = Array.isArray(input.notes)
    ? input.notes
    : (input.note ? [{ kind: 'body', heading: 'Your note', body: String(input.note) }] : []);
  return withSceneTiming({
    id: input.id || `user-${input.uid || ''}`,
    indexLabel: input.indexLabel || '',          // empty -> buildSlideForScene shows "N of M"
    dateLabel: input.dateLabel || null,
    userAdded: input.userAdded !== false,
    audience: {
      title: a.title || input.title || 'New section',
      lead: a.lead || input.lead || '',
      detail: a.detail || input.detail || null,
      detailLabel: a.detailLabel || 'In the app',
      anchorRef: a.anchorRef || input.anchorRef || null,
      anchorTheme: a.anchorTheme || input.anchorTheme || null,
    },
    notes,
    estimatedMin: input.estimatedMin,
    priority: input.priority,
  });
}

// Insert a scene (or raw form input) at `atIndex` (append when null/out of range).
export function addScene(scenes, scene, atIndex = null) {
  const list = Array.isArray(scenes) ? scenes.slice() : [];
  const s = scene && scene.audience ? withSceneTiming(scene) : makeScene(scene);
  if (atIndex == null || atIndex < 0 || atIndex > list.length) list.push(s);
  else list.splice(atIndex, 0, s);
  return list;
}

// Patch a scene in place by id. `patch.audience` shallow-merges onto the existing
// audience; `patch.notes`, estimatedMin, priority, etc. replace. Timing re-normalized.
export function editScene(scenes, id, patch = {}) {
  const target = String(id);
  return (Array.isArray(scenes) ? scenes : []).map((s, i) => {
    if (sceneKey(s, i) !== target) return s;
    const merged = {
      ...s,
      ...patch,
      audience: { ...(s.audience || {}), ...(patch.audience || {}) },
      notes: patch.notes != null ? patch.notes : s.notes,
    };
    return withSceneTiming(merged);
  });
}

// --- persistence overlay (storage-injected, so it is pure + testable) ---------
// The overlay is the user's living-curriculum delta on top of the adapter output:
//   { added: [Scene...], edits: { [sceneKey]: patch } }
// Persisted per-presentable on the PRESENTER's own device (localStorage by default).
// This is the "appropriate" scope: a personal teaching layer that never alters the
// shared/broadcast contract and never touches another user's data. A surface that
// needs server-shared curriculum passes its own onCurriculumChange handler instead.
export const OVERLAY_PREFIX = 'poe-present-overlay:';
export function overlayKey(presentableId) { return `${OVERLAY_PREFIX}${presentableId || 'default'}`; }
export const EMPTY_OVERLAY = { added: [], edits: {} };

export function loadOverlay(presentableId, storage) {
  if (!storage || typeof storage.getItem !== 'function') return { ...EMPTY_OVERLAY };
  try {
    const raw = storage.getItem(overlayKey(presentableId));
    if (!raw) return { ...EMPTY_OVERLAY };
    const o = JSON.parse(raw);
    return { added: Array.isArray(o.added) ? o.added : [], edits: o.edits && typeof o.edits === 'object' ? o.edits : {} };
  } catch { return { ...EMPTY_OVERLAY }; }
}

export function saveOverlay(presentableId, overlay, storage) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    storage.setItem(overlayKey(presentableId), JSON.stringify({
      added: Array.isArray(overlay?.added) ? overlay.added : [],
      edits: overlay?.edits && typeof overlay.edits === 'object' ? overlay.edits : {},
    }));
    return true;
  } catch { return false; }
}

// Apply an overlay (edits + added scenes) onto a base scene array. Edits first
// (so a user can retime/upgrade a built-in scene), then appended additions.
export function applyOverlay(scenes, overlay) {
  let out = Array.isArray(scenes) ? scenes.slice() : [];
  const edits = overlay && overlay.edits ? overlay.edits : {};
  Object.keys(edits).forEach((id) => { out = editScene(out, id, edits[id]); });
  const added = overlay && Array.isArray(overlay.added) ? overlay.added : [];
  added.forEach((s) => { out = addScene(out, s); });
  return out;
}

// -----------------------------------------------------------------------------
// Adapter: a Learn course -> a presentable
// -----------------------------------------------------------------------------
// `course` = { meta, schedule } as ChurchLearn already assembles per course (the
// schedule rows carry the real computed `date`, `week`, learner copy, and the
// facilitator guide). Works for ANY course in the picker, not just the A.I. one.
function courseNotes(m) {
  const out = [];
  if (m?.lesson) out.push({ kind: 'body', heading: 'The deeper idea', body: m.lesson });
  const f = m?.facilitator || {};
  // NOTE: the run-of-show is NO LONGER a static 'steps' note here — it is parsed into
  // reflowable segments (scene.runOfShow, below) so the presenter's time budget can
  // rescale every segment's minutes. Emitting it twice would show stale numbers.
  if (f.talkingPoints?.length) out.push({ kind: 'list', heading: 'Say this', items: f.talkingPoints });
  if (f.discussionPrompts?.length) out.push({ kind: 'list', heading: 'Ask the room', items: f.discussionPrompts });
  if (f.watchFor) out.push({ kind: 'callout', heading: 'Watch for', body: f.watchFor });
  return out;
}

// Parse a facilitator run-of-show string ("Name (minutes): detail | ...") into the
// structured, REFLOWABLE segments. The authored per-segment minutes ARE the weights
// (Hands-on 25 is heaviest by design); estimatedMin carries them straight into
// fitToBudget so lowering the clock rescales every line proportionally (with floors +
// the supplementary-skip fallback). Segments are PRESENTER-side — never broadcast.
export function parseRunOfShow(howToRun) {
  if (typeof howToRun !== 'string' || !howToRun.trim()) return [];
  return howToRun.split('|').map((raw, i) => {
    const seg = raw.trim();
    if (!seg) return null;
    // "Prayer + the anchor (5): open in prayer..." -> name / minutes / detail
    const m = seg.match(/^(.*?)\s*\((\d+(?:\.\d+)?)\)\s*:?\s*([\s\S]*)$/);
    let name; let minutes; let detail;
    if (m) { name = m[1].trim(); minutes = Number(m[2]); detail = m[3].trim(); } else {
      const colon = seg.indexOf(':');
      name = (colon >= 0 ? seg.slice(0, colon) : seg).trim();
      detail = colon >= 0 ? seg.slice(colon + 1).trim() : '';
      minutes = undefined;
    }
    return {
      id: `seg${i + 1}`,
      name,
      detail,
      // the authored minutes ARE the weight; undefined -> fitToBudget content-estimates it
      estimatedMin: Number.isFinite(minutes) && minutes > 0 ? minutes : undefined,
      priority: PRIORITY.CORE, // segments default to core (proportional + floor + compress)
    };
  }).filter(Boolean);
}

export function coursePresentable(course) {
  const meta = course?.meta || {};
  const schedule = Array.isArray(course?.schedule) ? course.schedule : [];
  const total = schedule.length;
  const detailLabel = meta.handsOnLabel || 'In the app';
  // A week's weight is its REAL session length = the sum of its run-of-show minutes
  // (a module may still override with its own estimatedMin). Falls back to the content
  // estimate when a week has no timed run-of-show.
  return {
    id: `course:${meta.key || 'course'}`,
    title: meta.title || 'Class',
    kicker: DEFAULT_KICKER,
    targetMin: meta.sessionMinutes || 75,
    scenes: backfillTiming(schedule.map((m, i) => {
      const runOfShow = parseRunOfShow(m.facilitator?.howToRun);
      const rosMin = runOfShow.reduce((t, s) => t + (Number.isFinite(s.estimatedMin) ? s.estimatedMin : 0), 0);
      return {
      id: m.id || `wk${i + 1}`,
      indexLabel: `Week ${m.week || i + 1} of ${total}`,
      dateLabel: formatClassDate(m.date),
      estimatedMin: Number.isFinite(m.estimatedMin) && m.estimatedMin > 0 ? m.estimatedMin : (rosMin > 0 ? rosMin : undefined),
      priority: m.priority,
      minMin: m.minMin,
      // IMPORTANCE seam (lesson weighting, lane local_5b6c0f25): a module's importance
      // weight flows straight into the reflow. The Learn-engine lesson-weighting
      // primitive sets `module.importance` (default 1 when absent); higher = more
      // essential -> protected + given the minutes, dropped last.
      importance: m.importance,
      audience: {
        title: m.title || '',
        lead: m.bigIdea || '',
        detail: m.inApp || null,
        detailLabel,
        anchorRef: m.anchor?.ref || null,
        anchorTheme: m.anchor?.theme || null,
      },
      notes: courseNotes(m),
      // the session's reflowable run-of-show (this week's timed segments)
      runOfShow,
    };
    })),
  };
}

// -----------------------------------------------------------------------------
// Adapter: a SINGLE Learn lesson -> a presentable (present ONE lesson, not all 16)
// -----------------------------------------------------------------------------
// The course-level presentable above makes each WEEK one scene, so the whole 16-week
// series is one presentation whose full time is the SUM of every week (~607 min). You
// do not teach all sixteen in one sitting, and squeezing "I have 45 minutes" across
// all of them gives each lesson ~2.8 min — nonsense (Darrell 2026-07-16: "607 is too
// long for any human; the time should be PER LESSON... each lesson can be taught, not
// all lessons for 2 min each"). This is the SAME pattern the The Word library already
// uses (pick ONE message, present THAT one): here the scenes are the CHOSEN lesson's
// own run-of-show segments (Open -> Big idea -> Go deeper -> Reflect -> Take it), so a
// time budget reflows THIS lesson (its ~38 authored minutes) up to whatever the room
// has — never the whole series. The series total stays context; a lesson is the unit.
//
// opts.level is a module.levels KEY ('child'|'teen'|'senior', or null for the general
// big idea) — the pace already chosen in the lesson, so the presenter does not
// re-introduce it. handsOnLabel labels the in-app detail line.
// Split a block of teaching text into two balanced halves on a sentence boundary,
// so a lesson's big-idea + go-deeper parts EACH carry real content at the age level
// (not one scaled slide and four unscaled ones). Never drops content.
export function splitTeachingText(text) {
  const clean = typeof text === 'string' ? text.trim() : '';
  if (!clean) return ['', ''];
  const sentences = clean.match(/[^.!?]+[.!?]*\s*/g) || [clean];
  if (sentences.length < 2) return [clean, ''];
  const totalLen = clean.length;
  let acc = 0; let cut = 1;
  for (let i = 0; i < sentences.length; i += 1) {
    acc += sentences[i].length;
    if (acc >= totalLen / 2) { cut = i + 1; break; }
  }
  cut = Math.min(Math.max(cut, 1), sentences.length - 1);
  return [sentences.slice(0, cut).join('').trim(), sentences.slice(cut).join('').trim()];
}

// slideOutline — turn a block of teaching prose into a projectable slide: ONE concise
// MAIN IDEA (the lead / headline) + a few BULLET POINTS under it for details and
// note-takers (Darrell 2026-07-19: "some of the audience slides look too wordy for an
// audience... add points as bullet or numbered under the main idea for each slide...
// for details and note takers"). The first sentence is the main idea; the following
// sentences become the points, capped so the screen stays scannable — the FULL text
// still rides in presenter NOTES, so nothing is lost or summarized (DR-0076: this only
// re-shapes what the ROOM sees; no word is invented). Pure + deterministic.
export function slideOutline(text, opts = {}) {
  const clean = typeof text === 'string' ? text.trim() : '';
  if (!clean) return { lead: '', points: [] };
  const sentences = (clean.match(/[^.!?]+[.!?]*\s*/g) || [clean]).map((s) => s.trim()).filter(Boolean);
  if (sentences.length <= 1) return { lead: clean, points: [] };
  const maxPoints = Number(opts.maxPoints) > 0 ? Number(opts.maxPoints) : 6;
  return { lead: sentences[0], points: sentences.slice(1, 1 + maxPoints) };
}

// Pull the Scripture REFERENCES a block of teaching text cites (Darrell 2026-07-19:
// "each scripture should be shown so it can be seen in context when cited... for the
// audience to see and eat the Word directly"). Matches "Book Ch:V", an optional
// leading 1-3, a "of" (Song of Solomon), and a -verse range. Over-matches are harmless:
// the slide resolves each against the real KJV corpus and simply drops any that don't
// resolve, so a non-book capture never shows. Deduped, order-preserving, capped.
const SCRIPTURE_REF_RE = /(?:[1-3]\s)?[A-Z][a-z]+(?:\s(?:of\s)?[A-Z][a-z]+){0,2}\s\d+:\d+(?:-\d+)?/g;
export function scriptureRefsInText(text, opts = {}) {
  const clean = typeof text === 'string' ? text : '';
  if (!clean) return [];
  const cap = Number(opts.max) > 0 ? Number(opts.max) : 4;
  const seen = new Set();
  const out = [];
  for (const m of clean.match(SCRIPTURE_REF_RE) || []) {
    const ref = m.trim();
    if (seen.has(ref)) continue;
    seen.add(ref);
    out.push(ref);
    if (out.length >= cap) break;
  }
  return out;
}

// Resolve the audience POINTS for the room at the current band (the bullet sibling of
// resolveAudienceLead): pointsByAge wins when present so a live band-switch re-pitches
// the bullets too; else the base `points`; else none.
export function resolveAudiencePoints(audience, age) {
  const a = audience || {};
  if (a.pointsByAge && typeof a.pointsByAge === 'object' && age && Array.isArray(a.pointsByAge[age])) return a.pointsByAge[age];
  return Array.isArray(a.points) ? a.points : [];
}

// A presenter band ('child'|'teen'|'adult') -> the module.levels KEY it reads. The
// course authors child/teen/senior rewrites, so the ADULT band presents the mature
// 'senior' rewrite (not the general big idea) — the whole lesson lands at the class's
// level, every part, not just the opener.
const LEVEL_KEY_TO_BAND = { child: 'child', teen: 'teen', senior: 'adult', standard: 'adult' };

export function lessonPresentable(module, opts = {}) {
  const m = module || {};
  const handsOnLabel = opts.handsOnLabel || 'In the app';
  const lv = m.levels || {};
  // The FULL text per presenter register. `everyone` = the general big idea (a mixed
  // room); child/teen/adult = the authored rewrites (adult -> the mature "senior"
  // one). Every register falls back to the big idea when its rewrite is absent, so a
  // lesson with only a big idea still presents at every choice.
  const textByBand = {
    everyone: m.bigIdea || lv.senior || lv.teen || '',
    child: lv.child || m.bigIdea || '',
    teen: lv.teen || m.bigIdea || '',
    adult: lv.senior || m.bigIdea || '',
  };
  const BANDS = Object.keys(textByBand);
  // Each register's text split across the two teaching beats (big idea -> go deeper),
  // so BOTH scale to the room and both re-pitch when the register is switched live.
  const halves = Object.fromEntries(BANDS.map((b) => [b, splitTeachingText(textByBand[b])]));
  const bigLeadByAge = Object.fromEntries(BANDS.map((b) => [b, halves[b][0]]));
  const deeperLeadByAge = Object.fromEntries(BANDS.map((b) => [b, halves[b][1] || halves[b][0]]));
  const baseBand = LEVEL_KEY_TO_BAND[opts.level] || 'teen';
  const tp = Array.isArray(m.facilitator?.talkingPoints) ? m.facilitator.talkingPoints : [];
  const dp = Array.isArray(m.facilitator?.discussionPrompts) ? m.facilitator.discussionPrompts : [];
  const anchorRef = m.anchor?.ref || null;
  const anchorTheme = m.anchor?.theme || null;
  // The lesson's anchor Scriptures, resolved to VERBATIM KJV (DR-0076: from the
  // fetched store, never memory). One sourced list serves all three: the room reads
  // it on the opener, the speaker recalls it in notes the whole way, and the closing
  // "The Word we stood on" recap gives the room a refresher (Darrell 2026-07-16).
  const scriptureLines = String(anchorRef || '')
    .split(';').map((s) => s.trim()).filter(Boolean)
    .map((ref) => { const t = kjvText(ref); return t ? `${ref} — "${t}"` : ref; });
  const scriptureBlock = scriptureLines.join('\n');

  // The FIRST slide is a TITLE CARD — the lesson's title (+ today's text) — so the
  // room has a standing background on the wall as people gather, until the speaker
  // begins and advances (Darrell 2026-07-19). Weightless-ish + supplementary, so it
  // never steals teaching minutes and is the first thing dropped when time is tight.
  const titleScene = {
    id: `${m.id || 'lesson'}-title`,
    estimatedMin: 1,
    priority: PRIORITY.SUPPLEMENTARY,
    audience: {
      title: m.title || 'The lesson',
      lead: '',
      detail: null,
      detailLabel: handsOnLabel,
      anchorRef: anchorRef || null,
      anchorTheme: null, // a clean title card: the reference only, not the full theme
    },
    notes: [{ kind: 'body', heading: 'Title slide — the standing background', body: 'Leave this up as the room gathers; advance when you begin.' }],
    runOfShow: [],
  };

  const ros = parseRunOfShow(m.facilitator?.howToRun);
  // Which segment carries the actual teaching / go-deeper / discussion, by name.
  const isBigIdea = (name) => /big idea|the core|main|^teach/i.test(name || '');
  const isDeeper = (name) => /deeper|dig|explore|unpack/i.test(name || '');
  const isReflect = (name) => /reflect|discuss|respond|engage|prompt|apply/i.test(name || '');
  const isTakeaway = (name) => /take it|with you|send|send-off|close|charge/i.test(name || '');

  let scenes;
  if (ros.length) {
    const total = ros.length;
    scenes = ros.map((seg, i) => {
      const big = isBigIdea(seg.name);
      const deeper = isDeeper(seg.name);
      const notes = [];
      // The opener carries the anchor Scriptures VERBATIM so the minister can recall
      // and read the Word, not just the location.
      if (i === 0 && scriptureLines.length) notes.push({ kind: 'list', heading: 'Scriptures to read (KJV)', items: scriptureLines });
      if (isReflect(seg.name) && dp.length) notes.push({ kind: 'list', heading: 'Ask the room', items: dp });
      // The teaching beats (big idea / go deeper) become a CONCISE main idea + bullet
      // POINTS for the room (Darrell 2026-07-19: audience slides were too wordy — a
      // headline + points, not a paragraph). The FULL age text moves into presenter
      // NOTES so nothing is lost; every band is outlined so a live band-switch
      // re-pitches BOTH the main idea and the points.
      const teachingFull = big ? bigLeadByAge : (deeper ? deeperLeadByAge : null);
      let lead; let leadByAge = null; let points = null; let pointsByAge = null;
      if (teachingFull) {
        const outByAge = Object.fromEntries(BANDS.map((b) => [b, slideOutline(teachingFull[b])]));
        leadByAge = Object.fromEntries(BANDS.map((b) => [b, outByAge[b].lead]));
        pointsByAge = Object.fromEntries(BANDS.map((b) => [b, outByAge[b].points]));
        lead = leadByAge[baseBand] || m.bigIdea || seg.detail || '';
        points = pointsByAge[baseBand] || [];
        // Full teaching text (this band) -> presenter notes, so the room sees the
        // outline while the speaker keeps every word. Skip when there's nothing extra.
        const fullText = teachingFull[baseBand] || '';
        if (fullText && (points.length || fullText !== lead)) {
          notes.unshift({ kind: 'body', heading: big ? 'The teaching — say it in your own words' : 'Go deeper — say it in your own words', body: fullText });
        }
      } else {
        lead = seg.detail || '';
      }
      // Talking points ride as presenter-only notes on the big-idea beat.
      if (big && tp.length) notes.push({ kind: 'list', heading: 'Say this', items: tp });
      // The Scriptures this beat CITES -> shown verbatim on the slide (resolved from the
      // sovereign KJV corpus in AudienceSlide), so the room reads the Word directly.
      const citedRefs = teachingFull ? scriptureRefsInText(teachingFull[baseBand] || '') : [];
      return {
        id: `${m.id || 'lesson'}-s${i + 1}`,
        indexLabel: `Part ${i + 1} of ${total}`,
        estimatedMin: seg.estimatedMin,
        audience: {
          title: seg.name || `Part ${i + 1}`,
          lead,
          // Every band's main idea + points, so switching the band mid-talk re-pitches
          // the WHOLE slide to the room without leaving it.
          leadByAge,
          points,
          pointsByAge,
          citedRefs: citedRefs.length ? citedRefs : null,
          detail: isTakeaway(seg.name) ? (m.inApp || null) : null,
          detailLabel: handsOnLabel,
          anchorRef: i === 0 ? anchorRef : null,
          anchorTheme: i === 0 ? anchorTheme : null,
          // The opener puts the anchor Word VERBATIM on the class screen for the room
          // to read together — not just the location.
          scripture: i === 0 ? (scriptureBlock || null) : null,
        },
        notes,
        runOfShow: [],
      };
    });
    // Closing recap the ROOM sees — "The Word we stood on" — a refresher of every
    // anchor Scripture, verbatim, to take home (Darrell's design choice 2026-07-16).
    if (scriptureBlock) {
      scenes.push({
        id: `${m.id || 'lesson'}-recap`,
        indexLabel: `Part ${scenes.length + 1}`,
        estimatedMin: 2,
        audience: {
          title: 'The Word we stood on',
          lead: 'The Scriptures from today — take them with you.',
          scripture: scriptureBlock,
          detailLabel: handsOnLabel,
        },
        notes: [{ kind: 'list', heading: 'Scriptures (KJV)', items: scriptureLines }],
        runOfShow: [],
      });
    }
    // The title card leads — the standing background until the speaker begins.
    scenes.unshift(titleScene);
    // Re-label every part now the count is final (title prepended, recap may be appended).
    const finalTotal = scenes.length;
    scenes = scenes.map((sc, i) => ({ ...sc, indexLabel: `Part ${i + 1} of ${finalTotal}` }));
  } else {
    // A lesson with no authored run-of-show still presents as one scene — a concise
    // main idea + points for the room, the FULL age text kept in presenter notes.
    const wholeByAge = { ...textByBand };
    const outByAge = Object.fromEntries(BANDS.map((b) => [b, slideOutline(wholeByAge[b])]));
    const leadByAge = Object.fromEntries(BANDS.map((b) => [b, outByAge[b].lead]));
    const pointsByAge = Object.fromEntries(BANDS.map((b) => [b, outByAge[b].points]));
    const fullText = wholeByAge[baseBand] || '';
    const lead = leadByAge[baseBand] || m.bigIdea || '';
    const notes = [];
    if (fullText && (pointsByAge[baseBand].length || fullText !== lead)) {
      notes.push({ kind: 'body', heading: 'The teaching — say it in your own words', body: fullText });
    }
    if (tp.length) notes.push({ kind: 'list', heading: 'Say this', items: tp });
    scenes = [
      titleScene, // the standing title background, then the lesson
      {
        id: `${m.id || 'lesson'}-s1`,
        audience: {
          title: m.title || 'The lesson',
          lead,
          leadByAge,
          points: pointsByAge[baseBand] || [],
          pointsByAge,
          detail: m.inApp || null,
          detailLabel: handsOnLabel,
          anchorRef, anchorTheme,
        },
        notes,
        runOfShow: [],
      },
    ].map((sc, i, arr) => ({ ...sc, indexLabel: `Part ${i + 1} of ${arr.length}` }));
  }

  // The lesson's OWN length = the sum of its TEACHING parts (authored run-of-show +
  // the recap), so the timer target matches the "full = N min" the reflow shows. NEVER
  // the 607 series sum. The title card is a standing background, not teaching time, so
  // it is excluded from the target (it still reflows as a 1-min supplementary in fit).
  const fullMin = scenes.reduce((t, s) => (
    t + (String(s.id || '').endsWith('-title') ? 0 : (Number.isFinite(s.estimatedMin) ? s.estimatedMin : 0))
  ), 0);
  return {
    id: `lesson:${m.id || 'lesson'}`,
    title: m.title || 'Lesson',
    kicker: DEFAULT_KICKER,
    // Fall back to 45 when a lesson has no timed segments.
    targetMin: fullMin > 0 ? fullMin : (opts.targetMin || 45),
    scenes: backfillTiming(scenes),
  };
}

// -----------------------------------------------------------------------------
// The Word — Migdal: a LIBRARY of messages, each its OWN presentation
// -----------------------------------------------------------------------------
// BG's area. A collection is NOT one presentation containing every message — you do
// not preach all 163 at once. It is a LIBRARY: the leader PICKS one message and
// presents THAT one. `wordLibrary` lists the pickable items (newest first; older ones
// remain selectable); `messagePresentable` builds the single-message presentation the
// <Presenter> renders, whose own slides are what the "X of N" pager walks. Prep/theme
// bodies stay presenter-side (leadership-private at the data layer; present mode keeps
// them off the projector too).
function sermonDateLabel(iso) {
  if (!iso) return null;
  try {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
  } catch { return null; }
}

// The KIND of service (Service / Bible study / Rehearsal) — NOT a weekday word.
// The picker's dateLabel already shows the real weekday from the date, so this
// must not assert a contradicting weekday (a Monday conference is not "Sunday").
const sermonDay = (s) => serviceKindLabel(s.serviceType);

// The pickable library: published messages, newest service date first. Each entry is
// lightweight (what the picker shows) — the full presentation is built on selection.
export function wordLibrary(sermons) {
  return (Array.isArray(sermons) ? sermons : [])
    .filter((s) => s && s.title && s.status !== 'draft')
    .slice()
    .sort((a, b) => String(b.serviceDate || '').localeCompare(String(a.serviceDate || '')))
    .map((s) => ({
      id: s.id,
      title: s.title,
      speaker: s.speaker || null,
      serviceType: s.serviceType || 'sunday',
      serviceDate: s.serviceDate || null,
      dateLabel: sermonDateLabel(s.serviceDate),
      dayLabel: sermonDay(s),
      scriptureRef: s.scriptureRef || null,
    }));
}

// ONE message -> ONE presentation. Its slides are built from the message's own real
// fields (opening / the text / the message), so the budget + proportional reflow apply
// WITHIN this single message — never across the whole library.
export function messagePresentable(sermon, opts = {}) {
  const s = sermon || {};
  const dateLabel = sermonDateLabel(s.serviceDate);
  const who = s.speaker ? `Delivered by ${s.speaker}` : null;
  const scenes = [];

  // 1) Opening — title big, who/when as the anchor line.
  scenes.push({
    id: 'open',
    indexLabel: 'Opening',
    dateLabel,
    audience: {
      title: s.title || 'The Word',
      lead: s.scriptureRef ? `Today’s text — ${s.scriptureRef}` : '',
      detail: null,
      detailLabel: 'Text',
      anchorRef: null,
      anchorTheme: who,
    },
    notes: [
      { kind: 'body', heading: 'When', body: `${dateLabel || 'date TBD'} · ${sermonDay(s)}` },
      ...(s.speaker ? [{ kind: 'body', heading: 'Delivered by', body: s.speaker }] : []),
    ],
  });

  // 2) The text — the scripture as the focus slide.
  if (s.scriptureRef) {
    scenes.push({
      id: 'text',
      indexLabel: 'The text',
      dateLabel: null,
      audience: { title: s.scriptureRef, lead: 'Turn with us to the Word.', detail: null, detailLabel: 'Text', anchorRef: s.scriptureRef, anchorTheme: null },
      notes: [{ kind: 'body', heading: 'Read the text', body: s.scriptureRef }],
    });
  }

  // 3) The message — theme / key points.
  if (s.notes) {
    const noteList = [{ kind: 'callout', heading: 'Theme / key points', body: s.notes }];
    if (s.documentUrl) noteList.push({ kind: 'body', heading: 'Document', body: 'A sermon document is linked (open it from the library — kept off the screen).' });
    scenes.push({
      id: 'message',
      indexLabel: 'The message',
      dateLabel: null,
      audience: { title: 'The message', lead: s.notes, detail: null, detailLabel: 'Theme', anchorRef: s.scriptureRef || null, anchorTheme: null },
      notes: noteList,
    });
  }

  return {
    id: `message:${s.id || 'msg'}`,
    title: s.title || 'The Word — Migdal',
    kicker: opts.kicker || DEFAULT_KICKER,
    targetMin: opts.targetMin || 30,
    scenes: backfillTiming(scenes),
  };
}

// -----------------------------------------------------------------------------
// Adapter: Darrell's Study (reflections) -> a presentable
// -----------------------------------------------------------------------------
// The Study (lib/study-space.js) holds each reflection in TWO layers, and that
// split IS the present-mode contract already: `plain` is the wider-audience
// distillation (what a room hears) and `deep` is the 4th-dimensional source (the
// presenter's depth). So the audience screen carries `plain`; `deep` rides only in
// presenter notes and can never reach the projector (DR-0076 no-leak — the same
// invariant the original course/word adapters hold). Only entries that actually
// have a plain layer are presentable (an un-distilled entry has nothing to put up
// on the screen yet), so this naturally skips deep-only drafts.
const STUDY_KIND_LABEL = { reflection: 'Reflection', processing: 'Processing', research: 'Cultural research' };

export function studyPresentable(entries, opts = {}) {
  const list = (Array.isArray(entries) ? entries : [])
    .filter((e) => e && e.plain && String(e.plain).trim());
  // Pinned first, then newest first — the same order the Study surface shows.
  const sorted = list.slice().sort(
    (a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)
      || String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
  );
  const total = sorted.length;
  return {
    id: opts.id || 'study',
    title: opts.title || "Darrell's Study",
    kicker: opts.kicker || DEFAULT_KICKER,
    targetMin: opts.targetMin || 45,
    scenes: backfillTiming(sorted.map((e, i) => {
      // Presenter-only depth: the deep source, the research culture, the tags.
      // NONE of this is in `audience`, so buildSlideForScene never projects it.
      const notes = [];
      if (e.deep && String(e.deep).trim()) notes.push({ kind: 'body', heading: 'The deep source · 4th-dimensional', body: e.deep });
      if (e.culture && String(e.culture).trim()) notes.push({ kind: 'body', heading: 'Audience in view', body: e.culture });
      if (Array.isArray(e.tags) && e.tags.length) notes.push({ kind: 'list', heading: 'Tags', items: e.tags });
      return {
        id: e.id || `study-${i + 1}`,
        indexLabel: `Reflection ${i + 1} of ${total}`,
        dateLabel: null,                       // reflections are timeless; never paint a date
        audience: {
          title: e.title || 'Untitled',
          lead: e.plain,                       // the wider-audience layer, by design
          detail: null,
          detailLabel: '',
          anchorRef: e.scripture || null,
          anchorTheme: STUDY_KIND_LABEL[e.kind] || null,
        },
        notes,
      };
    }), { defaultMin: opts.defaultSceneMin || DEFAULT_SCENE_MIN }),
  };
}

// -----------------------------------------------------------------------------
// Adapter: a Conference agenda (sessions) -> a presentable
// -----------------------------------------------------------------------------
// The Event Center holds the real session list (event_sessions; see
// EventCenterModule / conference-sync.toSessionShape). A host can put the agenda
// up one session at a time: the room sees the session TITLE, who is bringing it,
// when + where, and (for a main service) the linked message + music set. Host
// logistics — capacity vs. registration, the session type, the room assignment —
// stay in presenter notes, off the screen. Room/sermon/song NAMES are resolved by
// the caller (the component already has the lookups) via opts resolvers, so this
// stays a pure module with no conference-sync import.
const CONF_SESSION_KIND = { main_service: 'Main service', breakout: 'Breakout', other: 'Session' };

export function conferencePresentable(sessions, opts = {}) {
  const list = (Array.isArray(sessions) ? sessions : [])
    .filter((s) => s && s.title && s.status !== 'archived')
    .slice()
    .sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  const total = list.length;
  const roomOf = typeof opts.resolveRoom === 'function' ? opts.resolveRoom : () => null;
  const sermonOf = typeof opts.resolveSermon === 'function' ? opts.resolveSermon : () => null;
  const songsOf = typeof opts.resolveSongs === 'function' ? opts.resolveSongs : () => [];
  return {
    id: opts.id || 'conference',
    title: opts.title || 'Conference',
    kicker: opts.kicker || DEFAULT_KICKER,
    targetMin: opts.targetMin || 90,
    scenes: backfillTiming(list.map((s, i) => {
      const when = [s.day, s.time].filter(Boolean).join(' · ');
      const where = roomOf(s) || null;
      const sermonTitle = sermonOf(s) || null;
      const songs = (songsOf(s) || []).filter(Boolean);
      // Presenter-only logistics: type, room assignment, capacity. Not projected.
      const notes = [{ kind: 'body', heading: 'Session type', body: CONF_SESSION_KIND[s.sessionType] || 'Session' }];
      if (where) notes.push({ kind: 'body', heading: 'Room', body: where });
      if (Number.isFinite(s.capacity)) notes.push({ kind: 'body', heading: 'Capacity', body: String(s.capacity) });
      return {
        id: s.id || `sess-${i + 1}`,
        indexLabel: `Session ${i + 1} of ${total}`,
        dateLabel: s.day || null,
        audience: {
          title: s.title,
          lead: s.speaker || '',
          detail: [when, where].filter(Boolean).join(' · ') || null,
          detailLabel: 'When & where',
          anchorRef: sermonTitle,
          anchorTheme: songs.length ? songs.join(' · ') : null,
        },
        notes,
      };
    }), { defaultMin: opts.defaultSceneMin || DEFAULT_SCENE_MIN }),
  };
}

// -----------------------------------------------------------------------------
// Adapter: a created Document (Creation Workspace) -> a presentable
// -----------------------------------------------------------------------------
// A workspace document (lib/creation-workspace.js) is ONE contenteditable HTML
// blob, not a structured deck. To present it, split it on its own heading marks
// (H1 / H2 the editor inserts) into one scene per section; a document with no
// headings collapses to a single title scene carrying the whole body. Everything
// in a document is audience-facing — there is no separate presenter layer — so
// `notes` is always empty and nothing can leak (the contract holds trivially).
// Only the 'document' type is presentable; an 'image' tile is a single visual unit
// with no sections to advance through (the caller gates on type).

// stripTags — pure (no DOM, so it runs in node tests): turn an HTML fragment into
// readable plain text, inserting spaces at block boundaries and decoding the few
// entities the editor emits. Used to derive the audience text from each section.
export function stripTags(html) {
  return String(html || '')
    .replace(/<\/(p|div|h[1-6]|li|ul|ol|tr|blockquote)>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// splitHtmlSections — pure. Split an HTML document on its H1/H2 headings into
// [{ heading, level, html, text }]. Content before the first heading is a
// heading-less section (the preamble); a document with no headings yields one
// heading-less section carrying the whole body.
export function splitHtmlSections(html) {
  const src = String(html || '');
  if (!src.trim()) return [];
  const re = /<(h[12])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  const sections = [];
  let lastIndex = 0;
  let pending = null; // the heading whose body we are now collecting
  const push = (heading, bodyHtml) => {
    const text = stripTags(bodyHtml);
    const headingText = heading ? stripTags(heading.raw) : null;
    if (!headingText && !text) return; // drop fully-empty gaps
    sections.push({ heading: headingText, level: heading ? Number(heading.tag.slice(1)) : 0, html: bodyHtml, text });
  };
  let m;
  while ((m = re.exec(src)) !== null) {
    push(pending, src.slice(lastIndex, m.index));
    pending = { tag: m[1].toLowerCase(), raw: m[2] };
    lastIndex = re.lastIndex;
  }
  push(pending, src.slice(lastIndex));
  return sections;
}

export function documentPresentable(workspace, opts = {}) {
  const ws = workspace || {};
  const docTitle = String(ws.title || '').trim() || 'Untitled document';
  const sections = splitHtmlSections(ws.content || '');
  const headed = sections.filter((s) => s.heading);
  const preamble = sections.find((s) => !s.heading && s.text);
  const scenes = [];
  if (headed.length === 0) {
    // No headings — the whole document is one slide.
    const body = sections.map((s) => s.text).filter(Boolean).join(' ');
    scenes.push({
      id: 'doc-1', indexLabel: 'Document', dateLabel: null,
      audience: { title: docTitle, lead: body || '', detail: null, detailLabel: '', anchorRef: null, anchorTheme: null },
      notes: [],
    });
  } else {
    // A title slide, then one slide per heading section.
    scenes.push({
      id: 'doc-title', indexLabel: 'Title', dateLabel: null,
      audience: { title: docTitle, lead: preamble ? preamble.text : '', detail: null, detailLabel: '', anchorRef: null, anchorTheme: null },
      notes: [],
    });
    headed.forEach((s, i) => {
      scenes.push({
        id: `doc-${i + 1}`,
        indexLabel: `Section ${i + 1} of ${headed.length}`,
        dateLabel: null,
        audience: { title: s.heading, lead: s.text || '', detail: null, detailLabel: '', anchorRef: null, anchorTheme: null },
        notes: [],
      });
    });
  }
  return {
    id: opts.id || `doc:${ws.id || 'workspace'}`,
    title: docTitle,
    kicker: opts.kicker || DEFAULT_KICKER,
    targetMin: opts.targetMin || 15,
    scenes: backfillTiming(scenes, { defaultMin: opts.defaultSceneMin || DEFAULT_SCENE_MIN }),
  };
}
