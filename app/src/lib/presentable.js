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
// Time-adaptive presenting: per-scene timing + fit-to-budget + skip-suggest
// -----------------------------------------------------------------------------
// "I have 30 minutes today." A scene now carries two more contract fields so the
// presenter can reflow a full curriculum into the time actually available without
// losing the core/competent understanding:
//   • estimatedMin — minutes to teach this scene well (default DEFAULT_SCENE_MIN)
//   • priority     — 'core' (protected) | 'supplementary' (droppable first)
// Both are PRESENTER-side planning fields; like notes they are NEVER part of the
// audience broadcast (buildSlideForScene reads only scene.audience). Existing
// presentables (course / word adapters, and any older scene array) keep working —
// the backfill helpers supply sensible defaults so nothing is required upstream.
export const DEFAULT_SCENE_MIN = 5;
export const PRIORITY = { CORE: 'core', SUPPLEMENTARY: 'supplementary' };

// Non-mutating: return a copy of `scene` guaranteed to carry a positive
// estimatedMin and a valid priority. Unknown/blank priority defaults to CORE so an
// un-annotated curriculum is treated as all-core (skip-suggest then protects it).
export function withSceneTiming(scene, opts = {}) {
  if (!scene || typeof scene !== 'object') return scene;
  const def = Number.isFinite(opts.defaultMin) && opts.defaultMin > 0 ? opts.defaultMin : DEFAULT_SCENE_MIN;
  const est = Number(scene.estimatedMin);
  return {
    ...scene,
    estimatedMin: Number.isFinite(est) && est > 0 ? est : def,
    priority: scene.priority === PRIORITY.SUPPLEMENTARY ? PRIORITY.SUPPLEMENTARY : PRIORITY.CORE,
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

function fitSummary({ budget, coreKept, suppKept, suppSkipped, fits, overBudget }) {
  const m = Math.round(budget);
  if (fits) {
    const n = coreKept + suppKept;
    return `All ${n} section${n === 1 ? '' : 's'} fit in ${m} min — teaching the full curriculum.`;
  }
  if (overBudget) {
    return `Even the core won’t fully fit ${m} min — ${coreKept} core section${coreKept === 1 ? '' : 's'} are paced tighter to keep up. Consider a little more time.`;
  }
  const skip = suppSkipped > 0
    ? ` skipping ${suppSkipped} supplementary one${suppSkipped === 1 ? '' : 's'}.`
    : '.';
  return `To fit ${m} min: covering ${coreKept} core section${coreKept === 1 ? '' : 's'}${suppKept ? ` + ${suppKept} supplementary` : ''},${skip} The core understanding still lands.`;
}

// Reflow a curriculum into a time budget. Pure + fully testable.
//   scenes    — the Scene array (timing backfilled here)
//   budgetMin — minutes available; <=0 / non-finite means "no budget" (keep all)
//   opts.overrides — { [sceneKey]: 'keep' | 'skip' } user force-keep / force-skip.
//                    A force-kept supplementary survives auto-skip; a force-skip
//                    drops a scene up front (core included — the user decides).
//   opts.defaultMin — default per-scene estimate for un-timed scenes.
//   opts.rankSkips  — optional adaptive ranker (the LLM seam above).
//
// RULES: drop LOWEST priority first (supplementary before core); NEVER auto-skip a
// core scene. If, after dropping every droppable supplementary, the kept content
// still exceeds the budget, core is protected — kept scenes are instead COMPRESSED
// proportionally so the run still finishes in time (flagged overBudget+compressed).
// When the full curriculum fits, every scene keeps its own estimate (finishing early
// is fine — we don't pad to fill).
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
      allocatedMin: s.estimatedMin,
    };
  });

  const keptSum = () => rows.filter((r) => !r.skipped).reduce((sum, r) => sum + r.estimatedMin, 0);

  // Auto-skip candidates: supplementary, not already skipped, not force-kept.
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
  while (keptSum() > budget && di < order.length) {
    order[di].skipped = true;
    order[di].skipReason = 'auto';
    di += 1;
  }

  // Core (+ any force-kept) alone still over budget? Protect core; compress to fit.
  const overBudget = keptSum() > budget;
  const keptTotal = keptSum();
  const scale = overBudget && keptTotal > 0 ? budget / keptTotal : 1;
  rows.forEach((r) => {
    r.allocatedMin = r.skipped ? 0 : Math.round(r.estimatedMin * scale * 10) / 10;
  });

  const kept = rows.filter((r) => !r.skipped);
  const skipped = rows.filter((r) => r.skipped);
  const counts = {
    total: rows.length,
    coreKept: kept.filter((r) => r.priority === PRIORITY.CORE).length,
    suppKept: kept.filter((r) => r.priority === PRIORITY.SUPPLEMENTARY).length,
    suppSkipped: skipped.filter((r) => r.priority === PRIORITY.SUPPLEMENTARY).length,
    coreSkipped: skipped.filter((r) => r.priority === PRIORITY.CORE).length,
  };
  const fits = fullMin <= budget;
  const strip = (r) => { const { _key, _i, ...rest } = r; return rest; };

  return {
    budgetMin: budget,
    fullMin,
    keptMin: kept.reduce((sum, r) => sum + r.allocatedMin, 0),
    fits,
    overBudget,
    compressed: scale < 1,
    plan: rows.map(strip),       // original order; every row annotated (skipped/allocatedMin)
    kept: kept.map(strip),
    skipped: skipped.map(strip),
    counts,
    summary: fitSummary({ budget, coreKept: counts.coreKept, suppKept: counts.suppKept, suppSkipped: counts.suppSkipped, fits, overBudget }),
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
  // Sensible per-scene default: split the session target across the weeks (a module
  // may override with its own estimatedMin / priority). backfillTiming fills any gap.
  const perScene = total > 0 ? Math.max(2, Math.round((meta.sessionMinutes || 75) / total)) : DEFAULT_SCENE_MIN;
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
      audience: {
        title: m.title || '',
        lead: m.bigIdea || '',
        detail: m.inApp || null,
        detailLabel,
        anchorRef: m.anchor?.ref || null,
        anchorTheme: m.anchor?.theme || null,
      },
      notes: courseNotes(m),
    })), { defaultMin: perScene }),
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
    }), { defaultMin: opts.defaultSceneMin || DEFAULT_SCENE_MIN }),
  };
}
