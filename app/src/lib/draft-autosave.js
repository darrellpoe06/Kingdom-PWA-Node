// =============================================================================
// draft-autosave — words in the one input surface survive without a Save tap
// =============================================================================
// "Can you see if you can automatically save your notes like a google doc
// without hitting save. So when you stall out with time or forget and come
// back, your information is still there." (Christina, 2026-07-10, typing
// "1. Book cover" into the Thinking Space.)
//
// Every keystroke in the ONE input primitive (OneVoiceInput, DR-0131) is
// persisted as a device-local DRAFT — text, chosen destination, and name —
// keyed per surface. Coming back (a reload, a stall-out, a closed tab)
// restores the draft into the box; a successful Send/Save clears it. Drafts
// are the writer's own words on their own device (DATA-AS-EMPOWERMENT:
// localStorage, nothing egresses until they choose a destination and send).
//
// Pure + null-safe + injectable storage — unit-tested in draft-autosave.test.js.

export const DRAFT_PREFIX = 'poe-onevoice-draft:';

export function draftKey(surface) {
  return `${DRAFT_PREFIX}${surface || 'default'}`;
}

function storage(win) {
  try {
    const w = win !== undefined ? win : (typeof window !== 'undefined' ? window : null);
    return w && w.localStorage && typeof w.localStorage.getItem === 'function' ? w.localStorage : null;
  } catch {
    return null; // private mode can throw
  }
}

// The saved draft for a surface, or null (missing, corrupt, or empty text).
export function readDraft(surface, win) {
  const ls = storage(win);
  if (!ls) return null;
  try {
    const raw = JSON.parse(ls.getItem(draftKey(surface)) || 'null');
    if (!raw || typeof raw !== 'object' || typeof raw.text !== 'string' || !raw.text.trim()) return null;
    return {
      text: raw.text,
      route: typeof raw.route === 'string' ? raw.route : null,
      name: typeof raw.name === 'string' ? raw.name : '',
      at: typeof raw.at === 'string' ? raw.at : null,
    };
  } catch {
    return null;
  }
}

// Persist the draft. Empty text CLEARS it (an emptied box is not a draft).
// Never throws; returns whether a draft is now stored.
export function writeDraft(surface, { text = '', route = null, name = '' } = {}, win, at) {
  const ls = storage(win);
  if (!ls) return false;
  try {
    if (!String(text).trim()) { ls.removeItem(draftKey(surface)); return false; }
    ls.setItem(draftKey(surface), JSON.stringify({ text: String(text), route, name: String(name || ''), at: at || new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(surface, win) {
  const ls = storage(win);
  if (!ls) return;
  try { ls.removeItem(draftKey(surface)); } catch { /* nothing to do */ }
}

// =============================================================================
// A FORM OF SEVERAL FIELDS IS ALSO SOMEBODY'S WORDS (DR-1181)
// =============================================================================
// Darrell, 2026-10-21: "Where did my text and typing go?!!!!!!!!!!!!!!!!"
//
// Measured: the keeper above protects exactly ONE box — OneVoiceInput, which is
// the Thinking Space. Every other box in the app holds its words in React state
// alone. The worst of them is the perspective form on a lesson
// (LessonStories.jsx): a title, a verse, "Who lived it", and a SIX-ROW story
// body, seeded by `perspectiveDraftFor`, whose own docstring says what it is —
// "The empty form for a new perspective". It persists nothing. A reload, a
// phone discarding the tab, or any remount takes the whole story.
//
// The form's own copy even promises otherwise: "Saved on this device... nothing
// is lost" — true, but only AFTER a submit that failed to reach the queue.
// Before the Share tap there was nothing on the device at all.
//
// So the same keeper, widened to a shallow object, in the SAME file rather than
// a second draft road beside it. One discipline: injectable storage, a private
// window that throws is survived, and an emptied form clears rather than
// lingering.

/**
 * The fields that are a person's WORDS, as against the form's own scaffolding.
 * A draft is kept when any of these carries something; `kind`, `tone` and the
 * lesson id are defaults, and a form holding only those is an untouched form.
 */
export const WORD_FIELDS = Object.freeze(['title', 'verse', 'body', 'source', 'text', 'note']);

/**
 * Fields NEVER restored from a draft, whatever was stored.
 *
 * `consent` is an attestation — "I lived this, or the person who did has agreed
 * to share it, and it may be shown to my space with this name." Restoring a
 * ticked box from storage would re-make that promise on the person's behalf,
 * days later, without them looking at it. The words come back; the promise is
 * made again, by them.
 */
export const NEVER_RESTORED = Object.freeze(['consent']);

/**
 * Whether a form holds any of the PERSON'S own words — measured against the
 * blank the form was seeded with, not against emptiness.
 *
 * WHY THE SEED MATTERS, found by this record's own suite. `perspectiveDraftFor`
 * pre-fills `verse` with the lesson's first anchor ("Psalms 90:12"), as a
 * courtesy. Testing for non-empty text therefore called an UNTOUCHED form a
 * draft: it would have persisted something nobody wrote and shown "Kept on this
 * device" over a form with nothing in it — a promise to keep nothing, which is
 * worse than no promise. A verse the person CHANGES is their word and is kept;
 * the one the app offered is not.
 */
export function hasWords(form, blank = null) {
  if (!form || typeof form !== 'object') return false;
  return WORD_FIELDS.some((k) => {
    const v = form[k];
    if (typeof v !== 'string' || !v.trim()) return false;
    if (!blank || !Object.prototype.hasOwnProperty.call(blank, k)) return true;
    return v.trim() !== String(blank[k] ?? '').trim();
  });
}

/**
 * Persist a shallow form object. A form with no words CLEARS the draft, so an
 * emptied box does not come back from the dead. Never throws; returns whether a
 * draft is now stored.
 */
export function writeFormDraft(surface, form, win, at, blank = null) {
  const ls = storage(win);
  if (!ls) return false;
  try {
    if (!hasWords(form, blank)) { ls.removeItem(draftKey(surface)); return false; }
    const keep = {};
    for (const [k, v] of Object.entries(form)) {
      if (v === null || ['string', 'number', 'boolean'].includes(typeof v)) keep[k] = v;
    }
    ls.setItem(draftKey(surface), JSON.stringify({ form: keep, at: at || new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

/**
 * The saved form draft for a surface merged over `blank`, or `blank` itself
 * when there is none. Always returns a usable form, so a caller can seed state
 * with it unconditionally — a corrupt or absent draft is simply the blank form,
 * never a throw and never a half-filled one.
 */
export function readFormDraft(surface, blank = {}, win, seed = null) {
  const base = { ...blank };
  const ls = storage(win);
  if (!ls) return base;
  try {
    const raw = JSON.parse(ls.getItem(draftKey(surface)) || 'null');
    const saved = raw && typeof raw === 'object' ? raw.form : null;
    if (!saved || typeof saved !== "object" || !hasWords(saved, seed)) return base;
    for (const [k, v] of Object.entries(saved)) {
      if (NEVER_RESTORED.includes(k)) continue;
      // Only fields the blank form declares: a stale draft from an older shape
      // cannot smuggle a key this form does not have.
      if (Object.prototype.hasOwnProperty.call(base, k)) base[k] = v;
    }
    return base;
  } catch {
    return base;
  }
}

/** When the stored draft was last written, or null. */
export function draftWrittenAt(surface, win) {
  const ls = storage(win);
  if (!ls) return null;
  try {
    const raw = JSON.parse(ls.getItem(draftKey(surface)) || 'null');
    return raw && typeof raw.at === 'string' ? raw.at : null;
  } catch {
    return null;
  }
}
