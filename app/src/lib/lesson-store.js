// =============================================================================
// lesson-store — the app reads lessons from the NAS copy, never going blank (DR-0677)
// =============================================================================
// Darrell 2026-09-29: "Why don't the lessons live on the nas?!!!!!!!!!!" and,
// the same morning, "The apps code is needed to keep context!!!!!!!%". So the
// course files stay the master and ship in the bundle, and the NAS database
// (migration 0242) holds a synchronized copy the app can read through the same
// same-origin door every other read uses (poetech.us/sb, DR-0307).
//
// THE ORDER OF TRUST, and why the site can never go blank (DR-0107):
//   1. The BUNDLED lessons render first, synchronously, always. Nothing here is
//      awaited before a lesson paints, so DR-0652's open-fast path is untouched.
//   2. What was last read from the NAS is kept on this device (IndexedDB; the
//      Firestick and a phone offline read the same cache), and overlaid when
//      the mode says so.
//   3. The network refresh happens in the background; a NAS that is down, slow
//      or unreachable changes nothing on screen.
//
// THE MODE (a feature flag, default BUNDLE-FIRST until measured live reads say
// otherwise — DR-0677 Phase 2):
//   'bundle' — public lessons come from the bundle. Only PREVIEWS overlay.
//   'nas'    — a public lesson the NAS holds DIFFERENTLY (or holds and the bundle
//              lacks) overlays the bundled one.
// Set per device with localStorage 'poetech.lessons.source' = 'nas', or per
// build with VITE_LESSON_SOURCE.
//
// THE INSTANT PREVIEW (option A+). A lesson that passed every gate on the NAS
// but is not yet merged code is a `preview` row. Row level security returns it
// ONLY to Darrell's two sign-ins and the Governor (0242); for anyone else the
// same query returns nothing. Such a lesson carries `nasPreview: { prUrl }` and
// the reader shows "Preview — going public after review" with its PR.
// =============================================================================
import { useEffect, useState } from 'react';
import { rowsToCourses } from './curriculum-rows.js';

export const SOURCE_KEY = 'poetech.lessons.source';
export const PREVIEW_LABEL = 'Preview — going public after review';

/** 'bundle' (default) or 'nas'. */
export function lessonSourceMode(env = (typeof import.meta !== 'undefined' && import.meta.env) || {}) {
  const readLocal = () => {
    try { return typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(SOURCE_KEY) : null; } catch { return null; }
  };
  const v = readLocal() || env.VITE_LESSON_SOURCE || 'bundle';
  return v === 'nas' ? 'nas' : 'bundle';
}

// --- the read, through the same-origin door ---------------------------------

const PARTS = 'curriculum_lesson_bands(*),curriculum_lesson_quiz(*),curriculum_lesson_movements(*),curriculum_lesson_provenance(*)';

/** Flatten PostgREST's embedded parts back into the flat row document. */
export function flattenEmbedded(lessonRows) {
  const out = { lessons: [], bands: [], quiz: [], movements: [], sources: [] };
  for (const r of lessonRows || []) {
    const {
      curriculum_lesson_bands: b, curriculum_lesson_quiz: q,
      curriculum_lesson_movements: m, curriculum_lesson_provenance: p, ...lesson
    } = r;
    out.lessons.push(lesson);
    out.bands.push(...(b || []));
    out.quiz.push(...(q || []));
    out.movements.push(...(m || []));
    out.sources.push(...(p || []));
  }
  return out;
}

/** Rows -> { courseKey: [lesson] }, each preview lesson marked for the reader. */
export function lessonsFromRows(doc) {
  const byCourse = rowsToCourses(doc);
  const meta = new Map(doc.lessons.map((l) => [l.lesson_id, l]));
  for (const lessons of Object.values(byCourse)) {
    for (const l of lessons) {
      const row = meta.get(l.id);
      if (row && row.status === 'preview') l.nasPreview = { prUrl: row.pr_url || null };
    }
  }
  return byCourse;
}

async function defaultClient() {
  const mod = await import('./supabase.js');
  return mod.supabase;
}

/** Preview rows this sign-in may read (RLS decides; empty for everyone else). */
export async function fetchPreviews(client = null) {
  const c = client || await defaultClient();
  const { data, error } = await c.from('curriculum_lessons').select(`*,${PARTS}`).eq('status', 'preview');
  if (error) throw error;
  return lessonsFromRows(flattenEmbedded(data));
}

/** One course's public lessons from the NAS copy. */
export async function fetchCourse(courseKey, client = null) {
  const c = client || await defaultClient();
  const { data, error } = await c.from('curriculum_lessons').select(`*,${PARTS}`)
    .eq('course_key', courseKey).eq('status', 'public').order('position');
  if (error) throw error;
  return lessonsFromRows(flattenEmbedded(data))[courseKey] || [];
}

// --- the device cache (IndexedDB; memory when it is not there) --------------

const DB_NAME = 'poetech-curriculum';
const STORE = 'lessons';
const memory = new Map();

function openDb() {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') { resolve(null); return; }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { try { req.result.createObjectStore(STORE); } catch { /* exists */ } };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export async function cacheGet(key) {
  if (memory.has(key)) return memory.get(key);
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      req.onsuccess = () => { if (req.result) memory.set(key, req.result); resolve(req.result || null); };
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export async function cachePut(key, value) {
  memory.set(key, value);
  const db = await openDb();
  if (!db) return;
  try { db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key); } catch { /* best effort */ }
}

// --- the overlay (pure) -----------------------------------------------------

const scheduleOf = (c) => (Array.isArray(c.schedule) ? c.schedule : null);

/**
 * Bundled courses + what the NAS copy says -> the courses the reader sees.
 * `nasCourses` and `previews` are { courseKey: [lesson] }. A lesson keeps its
 * bundled row's place; only its content is taken from the NAS. A NAS-only
 * lesson (a preview, or in 'nas' mode a public one the bundle lacks) is added
 * at the end of its course. Courses with no NAS data are returned untouched —
 * the same object, so nothing re-renders for nothing.
 */
export function overlayCourses(courses, { mode = 'bundle', nasCourses = {}, previews = {} } = {}) {
  return courses.map((course) => {
    const key = course.key || (course.meta && course.meta.key);
    const schedule = scheduleOf(course);
    const pub = mode === 'nas' ? (nasCourses[key] || []) : [];
    const pre = previews[key] || [];
    if (!schedule || (pub.length === 0 && pre.length === 0)) return course;
    const byId = new Map();
    for (const l of pub) byId.set(l.id, l);
    for (const l of pre) byId.set(l.id, l);
    const seen = new Set();
    const next = schedule.map((row) => {
      const nas = byId.get(row.id);
      if (!nas) return row;
      seen.add(row.id);
      return { ...row, ...nas };
    });
    for (const [id, l] of byId) if (!seen.has(id)) next.push({ ...l });
    return { ...course, schedule: next };
  });
}

// --- the hook ---------------------------------------------------------------

const isTestRun = () => {
  try { return import.meta.env && import.meta.env.MODE === 'test'; } catch { return false; }
};

/**
 * The mounted courses with the NAS copy overlaid. Renders the bundle at once;
 * the cache and the network arrive later and only ever ADD what they know.
 * `client` is injectable (tests); with none, the test run never touches the
 * network.
 */
export function useCurriculumOverlay(courses, { client = null, mode = null } = {}) {
  const m = mode || lessonSourceMode();
  const [state, setState] = useState(() => ({
    previews: (memory.get('previews') || {}).lessons || {},
    nas: (memory.get('nas') || {}).lessons || {},
  }));
  const keys = courses.map((c) => c.key || (c.meta && c.meta.key)).join('|');

  useEffect(() => {
    let alive = true;
    const live = client || !isTestRun();
    (async () => {
      const [p, n] = await Promise.all([cacheGet('previews'), cacheGet('nas')]);
      if (alive && (p || n)) setState((s) => ({ previews: (p && p.lessons) || s.previews, nas: (n && n.lessons) || s.nas }));
      if (!live) return;
      try {
        const lessons = await fetchPreviews(client);
        await cachePut('previews', { lessons, at: Date.now() });
        if (alive) setState((s) => ({ ...s, previews: lessons }));
      } catch { /* the NAS is down or unreachable: the bundle stands */ }
      if (m !== 'nas') return;
      const out = {};
      for (const key of keys.split('|').filter(Boolean)) {
        try { out[key] = await fetchCourse(key, client); } catch { /* keep what we had */ }
      }
      await cachePut('nas', { lessons: out, at: Date.now() });
      if (alive) setState((s) => ({ ...s, nas: { ...s.nas, ...out } }));
    })();
    return () => { alive = false; };
  }, [keys, m, client]);

  // Cheap and pure: an untouched course is returned as the same object.
  return overlayCourses(courses, { mode: m, nasCourses: state.nas, previews: state.previews });
}
