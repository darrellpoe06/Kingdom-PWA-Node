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
export function buildSlideForScene(scenes, index, opts = {}) {
  const list = Array.isArray(scenes) ? scenes : [];
  const scene = list[index];
  if (!scene) return null;
  const total = list.length;
  const a = scene.audience || {};
  return {
    type: 'slide',
    index: index + 1,
    total,
    indexLabel: scene.indexLabel || `${index + 1} of ${total}`,
    id: scene.id || null,
    title: a.title || '',
    // `lead`/`detail` are the generic names; mirror them onto the original
    // `bigIdea`/`inApp` keys so an un-upgraded AudienceWindow still renders.
    lead: a.lead || '',
    bigIdea: a.lead || '',
    detail: a.detail || null,
    inApp: a.detail || null,
    detailLabel: a.detailLabel || 'In the app',
    anchorRef: a.anchorRef || null,
    anchorTheme: a.anchorTheme || null,
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
export const PRESENT_AGE_BANDS = [
  { id: 'child', label: 'Children', hint: 'One idea per slide. Read it aloud, ask a question, keep it short and warm.' },
  { id: 'teen', label: 'Teens', hint: 'Move at a good clip. Invite reactions, connect each slide to something real to them.' },
  { id: 'adult', label: 'Adults', hint: 'Give room for the deeper idea and discussion; the notes panel carries the depth.' },
];
export const DEFAULT_PRESENT_AGE = 'teen';

export function ageHint(bandId) {
  const b = PRESENT_AGE_BANDS.find((x) => x.id === bandId) || PRESENT_AGE_BANDS.find((x) => x.id === DEFAULT_PRESENT_AGE);
  return b ? b.hint : '';
}

// -----------------------------------------------------------------------------
// Time-adaptive presenting: per-scene WEIGHT + proportional fit-to-budget
// -----------------------------------------------------------------------------
// "I have 30 minutes today." A scene carries planning fields so the presenter can
// reflow a full curriculum into the time actually available WITHOUT flattening it:
//   • estimatedMin — the section's relative WEIGHT: real minutes it needs at full
//     depth. Heavier/deeper sections weigh more; this is NOT a uniform split. Authors
//     set it; when unset we estimate a sensible (non-uniform) weight from content.
//   • minMin       — the floor: the smallest usable time the section can shrink to.
//   • priority     — 'core' (protected) | 'supplementary' (droppable first).
// All three are PRESENTER-side planning fields; like notes they are NEVER part of the
// audience broadcast (buildSlideForScene reads only scene.audience). Existing
// presentables keep working — the backfill helpers supply sensible defaults.
//
// THE REFLOW (fitToBudget) is PROPORTIONAL / weight-preserving:
//   1. Each surviving section gets (its weight / sum of surviving weights) × budget,
//      so every section keeps the SAME PERCENTAGE of the clock as the clock shrinks
//      — time-heavy areas stay proportionally heavy; light ones shrink more.
//   2. A MINIMUM FLOOR per section: a section pinned at its floor holds that floor
//      and the remaining budget is re-split proportionally among the others
//      (classic water-filling).
//   3. SKIP-FALLBACK: only when the floors themselves overflow the budget do we drop
//      sections — lowest-priority (supplementary) first, NEVER core — until the
//      floors fit. "As close as possible under the circumstances."
export const DEFAULT_SCENE_MIN = 5;     // floor for an estimated weight
export const DEFAULT_FLOOR_MIN = 2;     // default minimum a section can shrink to
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
  return {
    ...scene,
    estimatedMin: weight,
    priority: scene.priority === PRIORITY.SUPPLEMENTARY ? PRIORITY.SUPPLEMENTARY : PRIORITY.CORE,
    minMin: sceneFloor(scene, weight, opts),
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

function sceneKey(scene, i) {
  return scene && scene.id != null ? String(scene.id) : `#${i}`;
}

function fitSummary({ budget, counts, fits, overBudget, compressed }) {
  const m = Math.round(budget);
  const { coreKept, suppKept, suppSkipped, atFloor } = counts;
  if (overBudget) {
    return `Even the minimum times don’t fit ${m} min — ${coreKept} core section${coreKept === 1 ? '' : 's'} run below their floor to keep pace. Consider a little more time.`;
  }
  if (suppSkipped > 0) {
    const floored = atFloor > 0 ? ` (${atFloor} at their floor)` : '';
    return `To fit ${m} min: ${coreKept} core + ${suppKept} supplementary timed proportionally${floored}, skipping ${suppSkipped} supplementary so the core still lands.`;
  }
  if (compressed) {
    const floored = atFloor > 0 ? `, ${atFloor} held at their floor` : '';
    return `Reflowed into ${m} min — every section keeps its share of the time${floored}; heavier sections stay heavier.`;
  }
  const n = coreKept + suppKept;
  return `All ${n} section${n === 1 ? '' : 's'} fit ${m} min — each runs to its own weight (heavier sections get more time).`;
}

// Water-filling: split `amount` minutes across `active` rows PROPORTIONALLY by
// weight (estimatedMin), but pin any row that would fall below its floor (minMin) to
// the floor and re-split the remainder among the rest. Mutates allocatedMin/atFloor.
// Pre-req: sum(floors) <= amount (the caller guarantees this via skip-fallback), so
// it always converges in <= active.length passes. Pure aside from the row mutation.
function waterFillProportional(active, amount) {
  const pinned = new Set();
  for (let guard = 0; guard <= active.length; guard += 1) {
    const pool = active.filter((r) => !pinned.has(r));
    if (!pool.length) return;
    const pinnedFloor = active.filter((r) => pinned.has(r)).reduce((sum, r) => sum + r.minMin, 0);
    const remaining = amount - pinnedFloor;
    const sumW = pool.reduce((sum, r) => sum + r.estimatedMin, 0) || 1;
    const below = pool.filter((r) => (r.estimatedMin / sumW) * remaining < r.minMin - 1e-9);
    if (!below.length) {
      pool.forEach((r) => { r.allocatedMin = round1((r.estimatedMin / sumW) * remaining); r.atFloor = false; });
      return;
    }
    below.forEach((r) => { r.allocatedMin = round1(r.minMin); r.atFloor = true; pinned.add(r); });
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
// ALGORITHM:
//   1. Each surviving section's time = (weight / sum surviving weights) × budget, so
//      its PERCENTAGE of the clock is preserved as the budget changes.
//   2. With MORE time than the content needs, sections run to their natural weight
//      (finish early, no padding); only when budget < content do they shrink.
//   3. A section can't shrink past its floor (minMin) — water-filling pins it there
//      and re-splits the rest proportionally.
//   4. If even the floors overflow the budget, SKIP the lowest-priority
//      (supplementary) sections first, NEVER core, until the floors fit. If only core
//      remains and its floors still overflow, core is protected and compressed below
//      floor (overBudget) — "as close as possible under the circumstances."
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

  // --- skip-fallback: ONLY when the floors themselves can't fit the budget. Drop
  // lowest-priority (supplementary) sections first, NEVER core, until floors fit. ---
  const candidates = rows.filter((r) => !r.skipped && r.priority === PRIORITY.SUPPLEMENTARY && r.forced !== 'keep');
  const ranker = typeof opts.rankSkips === 'function' ? opts.rankSkips : deterministicSkipRanker;
  let order = [];
  try {
    const ranked = ranker(candidates.map((c) => ({ ...c })), { budget, fullMin }) || [];
    order = ranked.map((k) => candidates.find((c) => c._key === k)).filter(Boolean);
  } catch { order = []; }
  // Append any candidate the ranker omitted, deterministically, so we never stall.
  deterministicSkipRanker(candidates).forEach((k) => {
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
      const w = activeW || 1;
      active.forEach((r) => { r.allocatedMin = round1((r.estimatedMin / w) * budget); r.atFloor = false; });
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
  };
  const fits = fullMin <= budget;
  const compressed = budget < activeW;
  const strip = (r) => { const { _key, _i, ...rest } = r; return rest; };

  return {
    budgetMin: budget,
    fullMin,
    keptMin: kept.reduce((sum, r) => sum + r.allocatedMin, 0),
    fits,
    overBudget,
    compressed,
    plan: rows.map(strip),       // original order; every row annotated (allocatedMin/atFloor/skipped)
    kept: kept.map(strip),
    skipped: skipped.map(strip),
    counts,
    summary: fitSummary({ budget, counts, fits, overBudget, compressed }),
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
  const steps = typeof f.howToRun === 'string'
    ? f.howToRun.split('|').map((s) => s.trim()).filter(Boolean)
    : [];
  if (steps.length) out.push({ kind: 'steps', heading: 'Run of show', items: steps });
  if (f.talkingPoints?.length) out.push({ kind: 'list', heading: 'Say this', items: f.talkingPoints });
  if (f.discussionPrompts?.length) out.push({ kind: 'list', heading: 'Ask the room', items: f.discussionPrompts });
  if (f.watchFor) out.push({ kind: 'callout', heading: 'Watch for', body: f.watchFor });
  return out;
}

export function coursePresentable(course) {
  const meta = course?.meta || {};
  const schedule = Array.isArray(course?.schedule) ? course.schedule : [];
  const total = schedule.length;
  const detailLabel = meta.handsOnLabel || 'In the app';
  // Weights are NON-uniform by default: a module may set its own estimatedMin /
  // priority / minMin; otherwise backfillTiming derives a content-weighted estimate
  // (deeper weeks with more run-of-show / discussion weigh more), not a flat split.
  return {
    id: `course:${meta.key || 'course'}`,
    title: meta.title || 'Class',
    kicker: DEFAULT_KICKER,
    targetMin: meta.sessionMinutes || 75,
    scenes: backfillTiming(schedule.map((m, i) => ({
      id: m.id || `wk${i + 1}`,
      indexLabel: `Week ${m.week || i + 1} of ${total}`,
      dateLabel: formatClassDate(m.date),
      estimatedMin: m.estimatedMin,
      priority: m.priority,
      minMin: m.minMin,
      audience: {
        title: m.title || '',
        lead: m.bigIdea || '',
        detail: m.inApp || null,
        detailLabel,
        anchorRef: m.anchor?.ref || null,
        anchorTheme: m.anchor?.theme || null,
      },
      notes: courseNotes(m),
    }))),
  };
}

// -----------------------------------------------------------------------------
// Adapter: The Word — Migdal (sermon library) -> a presentable
// -----------------------------------------------------------------------------
// BG's area. Each published message becomes a scene the leader can put on the
// screen: the title big, the scripture as the anchor, who delivered it, the real
// service date. Prep/notes/document bodies stay presenter-side (they are already
// leadership-private at the data layer; present mode keeps them off the projector
// too). `sermons` is the library list already loaded by Pulpit.
function sermonDateLabel(iso) {
  if (!iso) return null;
  try {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
    });
  } catch { return null; }
}

export function wordPresentable(sermons, opts = {}) {
  const list = (Array.isArray(sermons) ? sermons : [])
    .filter((s) => s && s.title && s.status !== 'draft')
    .slice()
    .sort((a, b) => String(b.serviceDate || '').localeCompare(String(a.serviceDate || '')));
  const total = list.length;
  return {
    id: 'word:migdal',
    title: opts.title || 'The Word — Migdal',
    kicker: DEFAULT_KICKER,
    targetMin: opts.targetMin || 60,
    scenes: backfillTiming(list.map((s, i) => {
      const day = s.serviceType === 'wednesday' ? 'Wednesday Bible Study' : 'Sunday';
      const notes = [];
      if (s.speaker) notes.push({ kind: 'body', heading: 'Delivered by', body: s.speaker });
      notes.push({ kind: 'body', heading: 'When', body: `${sermonDateLabel(s.serviceDate) || 'date TBD'} · ${day}` });
      if (s.scriptureRef) notes.push({ kind: 'body', heading: 'Text', body: s.scriptureRef });
      if (s.notes) notes.push({ kind: 'callout', heading: 'Theme / key points', body: s.notes });
      if (s.documentUrl) notes.push({ kind: 'body', heading: 'Document', body: 'A sermon document is linked (open it from the library — kept off the screen).' });
      return {
        id: s.id || `msg${i + 1}`,
        indexLabel: `Message ${i + 1} of ${total}`,
        dateLabel: sermonDateLabel(s.serviceDate),
        estimatedMin: s.estimatedMin,
        priority: s.priority,
        minMin: s.minMin,
        audience: {
          title: s.title,
          lead: s.notes || '',
          detail: s.scriptureRef || null,
          detailLabel: 'Text',
          anchorRef: s.scriptureRef || null,
          anchorTheme: s.speaker ? `Delivered by ${s.speaker}` : null,
        },
        notes,
      };
    })),
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
