// =============================================================================
// institute-studio — the redesigned Institute home's data, every number real
// =============================================================================
// The approved design (2026-11-25) puts a student dashboard on the Institute:
// enrolled / completed / certificates, a learning-progress bar, Continue
// Learning, Next Up for You, photographic program cards. This file is the
// spine of that surface, pure over injected inputs so it is unit-tested.
//
// WHERE EACH NUMBER COMES FROM (DR-0076 §1, DR-0061 reality-trace):
//   • enrolled      — the student's own institute_enrollments rows, not withdrawn
//                     (sync.readMyEnrollments; RLS is the wall).
//   • completed     — enrollments with status 'completed' OR whose server
//                     completion (institute_completion RPC) reads complete.
//   • certificates  — the student's own institute_credentials rows.
//   • progress %    — required courses passed ÷ required courses, summed over
//                     live enrollments, from the same completion RPC
//                     (course_keys snapshot minus coursesMissing). No
//                     enrollment, or no completion read → null, and the
//                     surface says so instead of painting a number.
//   • Continue      — the device's own saved lesson places (lib/learn-resume),
//                     filtered to courses an Institute program names.
//   • Next Up       — the first required course still to pass in the
//                     student's own enrollment; else the first program course
//                     not yet begun on this device. Never invented.
//
// The preview is OWNER-DEVICE ONLY by default (same pattern as the Learn
// studio, presentation.js isLearnStudioOn): on for the owner personas' device,
// `?instituteStudio=1` / `=0` opts a device in or out and is remembered.
import { PROGRAMS } from './church-institute.js';

export const INSTITUTE_STUDIO_FLAG_KEY = 'poe-institute-studio';

export function isInstituteStudioOn({ search = null, storage = null, defaultOn = false } = {}) {
  let store = storage;
  try {
    if (!store && typeof window !== 'undefined') store = window.localStorage;
  } catch {
    store = null;
  }
  try {
    const q = search != null ? search : typeof window !== 'undefined' && window.location ? window.location.search : '';
    const v = new URLSearchParams(q || '').get('instituteStudio');
    if (v === '1' || v === '0') {
      try {
        if (store) store.setItem(INSTITUTE_STUDIO_FLAG_KEY, v);
      } catch {
        /* no storage */
      }
      return v === '1';
    }
  } catch {
    /* no URL */
  }
  try {
    const remembered = store && store.getItem(INSTITUTE_STUDIO_FLAG_KEY);
    if (remembered === '1' || remembered === '0') return remembered === '1';
  } catch {
    /* no storage */
  }
  return defaultOn;
}

/** Existing lesson artwork already shipped in public/learn-thumbs — reused, nothing generated or bought. */
export const PROGRAM_ART = Object.freeze({
  'biblical-studies': { src: 'learn-thumbs/topics/faith/w640.webp', alt: 'Believers outdoors, Bibles open, faces lifted' },
  'ministry-leadership': { src: 'learn-thumbs/handed-forward/succ2-read-before-you-rule/w640.webp', alt: 'Two elders reading together at a desk' },
  'christian-education': { src: 'learn-thumbs/topics/history-math/w640.webp', alt: 'A teacher with children around a table and a globe' },
});

/** Every course key any Institute program names (required or open study). */
export function instituteCourseKeys(programs = PROGRAMS) {
  const out = new Set();
  for (const p of programs) for (const k of [...(p.courseKeys || []), ...(p.alsoKeys || [])]) out.add(k);
  return out;
}

const liveOf = (mine) => (Array.isArray(mine) ? mine : []).filter((e) => e && e.status !== 'withdrawn');

/**
 * The dashboard's three counts and the progress share, from the student's own rows.
 * @returns {{enrolled:number, completed:number, certificates:number, progress:number|null, required:number, passed:number}}
 */
export function studentStats({ mine = [], standing = {}, creds = [] } = {}) {
  const live = liveOf(mine);
  let completed = 0;
  let required = 0;
  let passed = 0;
  let read = 0;
  for (const e of live) {
    const c = standing && standing[e.id];
    if (e.status === 'completed' || (c && c.complete === true)) completed += 1;
    const keys = Array.isArray(e.course_keys) ? e.course_keys : [];
    if (c && keys.length > 0) {
      const missing = Array.isArray(c.coursesMissing) ? c.coursesMissing.length : 0;
      required += keys.length;
      passed += Math.max(0, keys.length - missing);
      read += 1;
    }
  }
  const progress = read > 0 && required > 0 ? Math.round((passed / required) * 100) : null;
  return { enrolled: live.length, completed, certificates: Array.isArray(creds) ? creds.length : 0, progress, required, passed };
}

/**
 * Lessons begun on this device in an Institute course, newest first.
 * `places` is learn-resume's listPlaces({inProgress:true}); `reached` its placeReached.
 * `lookup(courseKey, lessonId)` returns { title, image } from the presentation records (or null).
 */
export function continueItems(places = [], { reached = () => 0, lookup = () => null, courseTitle = (k) => k, programs = PROGRAMS, limit = 2 } = {}) {
  const keys = instituteCourseKeys(programs);
  const out = [];
  for (const p of Array.isArray(places) ? places : []) {
    if (!p || !p.courseKey || !p.lessonId || !keys.has(p.courseKey)) continue;
    const rec = lookup(p.courseKey, p.lessonId) || {};
    const share = Number(reached(p)) || 0;
    out.push({
      courseKey: p.courseKey,
      lessonId: p.lessonId,
      title: rec.title || p.lessonId,
      course: courseTitle(p.courseKey),
      image: rec.image || null,
      percent: Math.max(0, Math.min(100, Math.round(share * 100))),
      at: p.at || 0,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * The one course to recommend next. First: a required course the student's
 * own enrollment still has to pass (server truth). Then: the first course of
 * an Institute program with no saved place on this device. Null if neither.
 */
export function nextUpCourse({ mine = [], standing = {}, programs = PROGRAMS, startedKeys = new Set(), registered = () => true } = {}) {
  for (const e of liveOf(mine)) {
    const c = standing && standing[e.id];
    const missing = c && Array.isArray(c.coursesMissing) ? c.coursesMissing : [];
    const key = missing.find((k) => registered(k));
    if (key) return { courseKey: key, programKey: e.program_key, programTitle: e.program_title, why: 'required' };
  }
  for (const p of programs) {
    for (const k of [...(p.courseKeys || []), ...(p.alsoKeys || [])]) {
      if (!startedKeys.has(k) && registered(k)) return { courseKey: k, programKey: p.key, programTitle: p.title, why: 'start' };
    }
  }
  return null;
}

/** "Christina" from "Christina Poe"; null when nothing real is known. */
export function firstName(name) {
  const s = String(name || '').trim();
  if (!s || s.includes('@')) return null;
  return s.split(/\s+/)[0];
}

/**
 * Only the sizes that are really shipped. MEASURED 2026-11-25: 826 of 976 records list four
 * widths (320, 640, 1280, 1920) while public/learn-thumbs holds only w640 and w1280 for every
 * lesson (982 each; zero w320, zero w1920). On a sharp screen the browser picked the 1920
 * candidate, got a 404 and drew a broken image (Darrell's Fold, the Institute course cards).
 */
export const SHIPPED_THUMB_WIDTHS = Object.freeze([640, 1280]);
export function shippedSrcSet(srcSet) {
  return String(srcSet || '')
    .split(',')
    .map((x) => x.trim())
    .filter((x) => SHIPPED_THUMB_WIDTHS.some((w) => new RegExp(`/w${w}\\.webp\\s+${w}w$`).test(x)))
    .join(', ');
}

/**
 * One cover image per course, taken from the lesson artwork already shipped in
 * public/learn-thumbs (presentation-records.json). The first eligible record of
 * a course wins. `preview` (the owner-device studio) admits records still in
 * review, the same rule the owner-only Learn studio uses; without it only
 * approved/published records count, so a public launch shows only released art.
 * Images only: titles always come from the catalog, never from a review record.
 * @returns {Map<string, {src:string, srcSet:string}>}
 */
export function courseCovers(records = [], { preview = false, visible = ['approved', 'published'] } = {}) {
  const out = new Map();
  for (const r of Array.isArray(records) ? records : []) {
    if (!r || !r.courseKey || out.has(r.courseKey)) continue;
    if (!(preview || visible.includes(r.status))) continue;
    const img = r.image;
    if (!img || !img.src) continue;
    out.set(r.courseKey, { src: img.src, srcSet: shippedSrcSet(img.srcSet && img.srcSet.webp) });
  }
  return out;
}
