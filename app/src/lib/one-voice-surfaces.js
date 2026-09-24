// =============================================================================
// one-voice-surfaces — per-surface CONFIG for the one master input box
// =============================================================================
// The OneVoiceInput component is the shared "say it once, route it" primitive.
// Everything that differs PER SURFACE — the default route, the framing border,
// the source tag, and the confirmation tone — is pure data, pulled out here so
// it is (a) testable in a node env without rendering React, and (b) EXTENSIBLE
// by a caller: a new surface (a Study capture, an Engagement thread, a cockpit
// "issue a directive" box) can adopt the one primitive by passing its own
// `surfaceConfig`, without editing the component. This mirrors why planDispatch
// was pulled into one-voice-routing.js: keep "what the input is configured to
// do" as a table you can pin with a test, not behavior buried in a component.
//
// Adding a surface does NOT change the two built-ins (church, notes): a caller
// that passes nothing gets exactly SURFACES[surface]. That invariant is what
// the consolidation (PR #154) characterization test protects, and what this
// extraction preserves byte-for-byte.

import { declaredPersonOf } from './admin-allowlist.js';

// THE LESSON DOOR, SAID TRUE FOR EVERYONE (DR-0630). The reader Routine writes
// new lessons from Darrell's own rows; a member's row is kept and counted, and
// a lesson written for their situation is reviewed before it is published
// (DR-0608, DR-0312). So a member is told exactly that, and the lessons that
// already speak to their words are shown to them on the spot.
export const LESSON_MEMBER_CONFIRMATION = '📖 Heard. The lessons from the Word shown here are for you now. Your words are kept, and a new lesson written for your situation is reviewed before it is published.';

// SAID BEFORE THEY SEND (Darrell 2026-09-24: "Make sure they know this could
// be used in a lesson... so they know"). Shown above Send every time the
// Lesson chip is chosen, on every surface that offers it.
export const LESSON_NOTICE = 'What you share here may be used to write a lesson from the Word that others read. Your name is never used, and personal details are changed so no one can tell it was you.';

// THE NAME, BY THE MEMBER'S CHOICE (DR-0639; Darrell 2026-09-24: "Name is used
// if they want to though... make sense?"). Off by default. Ticked, the notice
// says exactly which name will be used; the row carries the choice as tags so
// the reader never guesses: `lesson-name-ok` + `lesson-name:<name>`.
export const LESSON_NAME_OK_TAG = 'lesson-name-ok';
export const LESSON_NAME_TAG_PREFIX = 'lesson-name:';
export const LESSON_NAME_MAX = 60;

/** The name as it will be used: one line, trimmed, at most LESSON_NAME_MAX. */
export function cleanLessonName(name) {
  return String(name || '').replace(/\s+/g, ' ').trim().slice(0, LESSON_NAME_MAX).trim();
}

/** The tags a lesson row carries for the name choice ([] = anonymous). */
export function lessonNameTags(nameOk, name) {
  const n = cleanLessonName(name);
  return nameOk && n ? [LESSON_NAME_OK_TAG, `${LESSON_NAME_TAG_PREFIX}${n}`] : [];
}

/** The name a row allows, or '' (anonymous). */
export function lessonNameOf(tags) {
  const list = Array.isArray(tags) ? tags : [];
  if (!list.includes(LESSON_NAME_OK_TAG)) return '';
  const t = list.find((x) => String(x).startsWith(LESSON_NAME_TAG_PREFIX));
  return t ? cleanLessonName(String(t).slice(LESSON_NAME_TAG_PREFIX.length)) : '';
}

/** The notice above Send, true for the choice made. */
export function lessonNotice(nameOk, name) {
  const n = cleanLessonName(name);
  if (!nameOk || !n) return LESSON_NOTICE;
  return `What you share here may be used to write a lesson from the Word that others read. Your name will be used as you wrote it: ${n}. Other personal details are still changed.`;
}

/** Whose lesson row is read straight into a new lesson: the Governor's own
 *  sign-in doors (DR-0608). Everyone else gets the member confirmation. */
export function isLessonDoorOwner(email) {
  return declaredPersonOf(email) === 'darrell';
}

/** The confirmation key for a delivered lesson, by who sent it. */
export function lessonConfirmationKey(email) {
  return isLessonDoorOwner(email) ? 'lessonGovernor' : 'lesson';
}

export const SURFACES = {
  church: {
    defaultRoute: 'prayer',
    borderCls: 'border-[#B85838]',
    sourceTag: 'church-one-voice',
    sourceLabel: 'from Church One Voice',
    inquiryFrom: '(from church)',
    counselingNote: 'Requested counseling via Church One Voice. Their words stay private — TLC connects directly.',
    saveNoteOnCounseling: false,
    confirmations: {
      prayer:     '🙏 On the prayer list. The church is standing with you.',
      conference: '🎪 Received for the Assembly — it goes straight onto the build list.',
      poetech:    '💡 PoeTech heard you — program processes and procedures begin. It’s on the build inbox.',
      work:       '🛠 On the Action Queue as a work order — it can dispatch to a worker from Big Picture.',
      counseling: '💚 The practice knows you’d like to talk — your words stayed private here. Reaching out took courage.',
      serve:      '🤝 Leadership will see your serving hands — thank you.',
      pastor:     '⛪ A note to the pastors — received.',
      voice:      '💬 Heard and kept. Thank you for your voice.',
      lesson:     LESSON_MEMBER_CONFIRMATION,
      lessonGovernor: '📖 Heard as a lesson — it is in the Learn intake. The Word-first lesson it becomes is reported back to you.',
      lessonFailed: '📖 Not sent as a lesson ({reason}) — sign in and send it again, or keep it as a note.',
    },
    lessonNotice: LESSON_NOTICE,
  },
  notes: {
    defaultRoute: 'private',
    borderCls: 'border-[#1A1815]',
    sourceTag: 'thinking-space',
    sourceLabel: 'from Thinking Space',
    inquiryFrom: '(from notes)',
    // On the diary the field beside Save is a TITLE, not a signature — Darrell
    // typed "Conference Review and Future Plans" there (2026-08-03) and the
    // label was silently dropped. nameIsLabel keeps it as the note's title line.
    namePlaceholder: 'Title / label (optional)',
    nameIsLabel: true,
    counselingNote: 'Requested counseling via Thinking Space. Their words stay private on their device — TLC connects directly.',
    saveNoteOnCounseling: true,
    confirmations: {
      poetech:    '💡 PoeTech heard you — it’s on the build inbox. You shape what gets built.',
      prayer:     '🙏 On the prayer list. The church is standing with you.',
      pastor:     '⛪ A note to the pastors — they’ll see it on the Church tab.',
      serve:      '🤝 Leadership will see your serving hands — thank you.',
      work:       '🛠 On the Action Queue as a work order — dispatch it to a worker from Big Picture.',
      counseling: '💚 The practice knows you’d like to talk — your words stayed private here, for you to share with them directly. Reaching out took courage.',
      private:    '📓 Kept — private to you. Come back to it anytime.',
      lesson:     LESSON_MEMBER_CONFIRMATION,
      lessonGovernor: '📖 Heard as a lesson — it is in the Learn intake. The Word-first lesson it becomes is reported back to you.',
      lessonFailed: '📖 Not sent as a lesson ({reason}) — sign in and send it again, or keep it as a private note.',
    },
    lessonNotice: LESSON_NOTICE,
  },
};

// resolveSurface — the PURE resolution of a surface's config, given the built-in
// `surface` name and an optional caller `override`. When override is absent the
// built-in config is returned UNCHANGED (the byte-identical invariant). When an
// override is given, it merges OVER the base (falling back to the church base
// for an unknown surface name), and `confirmations` deep-merge so a caller can
// supply just the tones it cares about and inherit the rest. This is the seam
// that lets a new surface reuse the one input primitive without touching it.
export function resolveSurface(surface, override) {
  const base = SURFACES[surface] || SURFACES.church;
  if (!override) return base;
  return {
    ...base,
    ...override,
    confirmations: { ...(base.confirmations || {}), ...(override.confirmations || {}) },
  };
}
