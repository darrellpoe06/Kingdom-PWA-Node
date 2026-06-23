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
  return {
    id: `course:${meta.key || 'course'}`,
    title: meta.title || 'Class',
    kicker: DEFAULT_KICKER,
    targetMin: meta.sessionMinutes || 75,
    scenes: schedule.map((m, i) => ({
      id: m.id || `wk${i + 1}`,
      indexLabel: `Week ${m.week || i + 1} of ${total}`,
      dateLabel: formatClassDate(m.date),
      audience: {
        title: m.title || '',
        lead: m.bigIdea || '',
        detail: m.inApp || null,
        detailLabel,
        anchorRef: m.anchor?.ref || null,
        anchorTheme: m.anchor?.theme || null,
      },
      notes: courseNotes(m),
    })),
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
    scenes: list.map((s, i) => {
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
    }),
  };
}
