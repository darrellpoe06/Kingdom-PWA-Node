// =============================================================================
// lesson-read-mark — which lessons I have read, and which VERSION (DR-1255)
// =============================================================================
// Darrell 2026-10-27, with the lesson list on his tablet: "Why can't I tell
// which ones I've already read?!!!!!!!!!!!!!!!! Even which version so I can
// try the one I didn't read!!!!!! Fix it!!!!!!"
//
// MEASURED FIRST (DR-0076 §4). The list's mark came from ONE source, the
// device's own place (lib/learn-resume.js): a lesson said FINISHED only when
// the place on THAT device carried `done`, so a lesson read on his phone said
// nothing on his tablet, and a lesson finished and then opened again (which
// clears `done` so it can resume from the top) said nothing at all. And no
// place, no record, no row anywhere named WHICH of a lesson's versions was
// read: a finish counted the lesson, never the words.
//
// This file is PURE. It answers one question for one lesson from everything
// the app really holds — the device's place, the learner's own cloud record
// (learner_lesson_records, which crosses his devices, DR-0754) and the
// versions the lesson really carries (lib/learn-organize.js, never assumed) —
// and names the words a reading serves, so the reader and the deck can record
// the version they read.
// =============================================================================
import { READING_VERSIONS, lessonVersions } from './learn-organize.js';
import { resolveForAge } from './learn-framework.js';
import { placeFinishes, versionsRead, READ_VERSION_IDS } from './learn-resume.js';

/** Version id → the word a reader sees ("Adult"). */
export const VERSION_LABEL = Object.fromEntries(READING_VERSIONS.map((b) => [b.id, b.label]));
const ID_OF_KEY = Object.fromEntries(READING_VERSIONS.map((b) => [b.key, b.id]));
const same = (a, b) => typeof a === 'string' && typeof b === 'string' && a.trim() === b.trim();

/**
 * The version whose WORDS the lesson space serves this reader: the band's
 * own level when the lesson carries it, else the words it fell back to (a
 * child handed the adult text has read the adult version — the honest
 * answer, and the one that lets the child's own version still be offered).
 * null when the lesson has no words at all.
 */
export function versionRead(module, ageBand, levelOverride = null) {
  if (!module || typeof module !== 'object') return null;
  const r = resolveForAge(module, ageBand, levelOverride);
  if (!r || !r.text) return null;
  const levels = module.levels && typeof module.levels === 'object' ? module.levels : null;
  if (levels) {
    for (const b of READING_VERSIONS) {
      if (same(levels[b.key], r.text)) return b.id;
    }
  }
  if (same(module.lesson, r.text)) return 'adult';
  return ID_OF_KEY[r.levelId] || null;
}

/**
 * The version the DECK reads. Its parts are dealt from the lesson's own
 * `lesson` text — the adult version — whatever register the room is set to
 * (lib/presentable.js lessonPresentable: the register re-pitches the lead,
 * the parts are `m.lesson`). A lesson with no `lesson` text presents the
 * register's own level, so that is what was read; `everyone` is the big idea,
 * which is no version at all.
 */
export function deckVersion(module, presentAge = null) {
  if (!module || typeof module !== 'object') return null;
  if (typeof module.lesson === 'string' && module.lesson.trim()) return 'adult';
  const lv = module.levels && typeof module.levels === 'object' ? module.levels : {};
  const byAge = { child: 'child', teen: 'teen', adult: 'senior' };
  const key = byAge[presentAge];
  if (key && typeof lv[key] === 'string' && lv[key].trim()) return ID_OF_KEY[key] || null;
  return null;
}

/**
 * The mark for one lesson's row, from the device's place, the learner's own
 * cloud record and the versions the lesson carries. Every field is derived;
 * nothing is painted.
 * @returns {{ read:boolean, times:number, fromRecord:boolean, readIds:string[],
 *   unreadIds:string[], versions:string[], known:boolean }}
 */
export function readMark({ place = null, record = null, versions = null } = {}) {
  const times = placeFinishes(place);
  const fromRecord = !!(record && record.completedAt);
  const ids = new Set(versionsRead(place));
  for (const v of (record && Array.isArray(record.versionsRead)) ? record.versionsRead : []) {
    if (VERSION_LABEL[v]) ids.add(v);
  }
  const all = (Array.isArray(versions) ? versions : []).filter((v) => VERSION_LABEL[v]);
  let readIds = READ_VERSION_IDS.filter((id) => ids.has(id));
  const read = times > 0 || fromRecord || readIds.length > 0;
  // ONE VERSION, ONE ANSWER: a lesson written once has only those words, so
  // a read with no version recorded was a read of them — nothing is offered.
  if (read && !readIds.length && all.length === 1) readIds = all.slice();
  return {
    read,
    times,
    fromRecord,
    readIds,
    unreadIds: all.filter((id) => !readIds.includes(id)),
    versions: all,
    known: readIds.length > 0,
  };
}

/** The versions a lesson really carries, by id — the row's own list. */
export function versionIdsOf(module) {
  return lessonVersions(module);
}

/** "✓ READ · Adult", "✓ READ ×3 · Child, Adult", "✓ READ · version not recorded". */
export function readMarkLabel(mark) {
  if (!mark || !mark.read) return '';
  const times = mark.times > 1 ? ` ×${mark.times}` : '';
  // A one-version lesson has nothing to name; the versions are named only
  // where there is a choice to make.
  if (mark.versions.length <= 1) return `✓ READ${times}`;
  if (mark.readIds.length) return `✓ READ${times} · ${mark.readIds.map((id) => VERSION_LABEL[id]).join(', ')}`;
  return `✓ READ${times} · version not recorded`;
}

/** The whole truth for a screen reader or a long press. */
export function readMarkSays(mark, title = 'this lesson') {
  if (!mark || !mark.read) return '';
  const where = mark.times > 0 ? (mark.fromRecord ? 'on this device and in your record' : 'on this device') : 'in your record';
  const names = (ids) => ids.map((id) => VERSION_LABEL[id]).join(', ');
  const head = mark.readIds.length && mark.versions.length > 1
    ? `You read the ${names(mark.readIds)} ${mark.readIds.length === 1 ? 'version' : 'versions'} of ${title} ${where}`
    : `You read ${title} ${where}${mark.versions.length > 1 ? '; which version was not recorded' : ''}`;
  const tail = mark.unreadIds.length
    ? `. Not read yet: ${names(mark.unreadIds)} — tap one to read it.`
    : (mark.versions.length > 1 ? '. Every version is read.' : '.');
  return `${head}${tail}`;
}
