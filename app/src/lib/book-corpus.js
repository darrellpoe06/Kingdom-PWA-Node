// book-corpus.js — the IMPURE edge of the book engine: adapt the real,
// already-harvested corpus into BookSources, offer concrete book "recipes" the
// reader can build right now, and persist the resulting shelf sovereignly
// (device-local, like Study + the Eternal Algorithms library — never extracted).
//
// REUSE, DON'T RE-FETCH (Darrell's standing rule): every recipe assembles from
// content that already lives in the app — the Learn courses (authored
// curriculum), the Eternal Algorithms library, the Scripture library (KJV
// verbatim), and (when loaded) the sermon corpus. No new network calls here.
//
// Scripture is resolved through kjvResolver -> scriptures.kjvText (public-domain
// KJV, fetched-not-typed), satisfying the study-bible separation + attribution
// standard. Other translations are referenced, never reproduced.

import { assembleBook } from './book-engine.js';
import { kjvText, allThemes } from './scriptures.js';
import { LIVING_LESSONS_META, LIVING_LESSONS_MODULES } from './living-lessons-class.js';
import { CLASS_META, MODULES as AI_CLASS_MODULES } from './church-classes.js';
import { SOVEREIGN_AI_META, SOVEREIGN_AI_MODULES } from './sovereign-ai-class.js';
import { ECON_META, ECON_MODULES } from './economics-class.js';
import { SUCCESSION_META, SUCCESSION_MODULES } from './succession-class.js';
import { PV_META, PV_MODULES } from './prophetic-voices.js';
import { SEED_ALGORITHMS } from './eternal-algorithms.js';

const asArr = (v) => (Array.isArray(v) ? v : []);
const asStr = (v) => (typeof v === 'string' ? v : '');
const splitRefs = (s) => asStr(s).split(/[;\n]+/).map((r) => r.trim()).filter(Boolean);

// The Scripture resolver the engine uses — verbatim KJV or null (flagged
// unresolved by the integrity report, never faked).
export function kjvResolver(ref) {
  const t = kjvText(ref);
  return t ? { text: t, version: 'KJV', ref } : null;
}

// --- ADAPTERS: real corpus shapes -> BookSource ----------------------------

export function lessonModuleToSource(module, courseMeta = {}) {
  const refs = splitRefs(module?.anchor?.ref);
  const blocks = [];
  if (asStr(module?.lesson)) blocks.push({ kind: 'text', text: module.lesson });
  refs.forEach((ref) => blocks.push({ kind: 'scripture', ref, theme: asStr(module?.anchor?.theme) }));
  if (asArr(module?.benefits).length) {
    blocks.push({ kind: 'heading', text: 'What this frees in you' });
    blocks.push({ kind: 'list', items: module.benefits });
  }
  if (asStr(module?.inApp)) blocks.push({ kind: 'note', label: 'Try it', text: module.inApp });
  return {
    id: asStr(module?.id) || 'lesson',
    kind: 'lesson',
    title: asStr(module?.title) || 'Lesson',
    intro: asStr(module?.bigIdea),
    blocks,
    scriptureRefs: refs,
    launch: module?.launch || { view: 'church', churchView: 'learn' },
    provenance: { source: 'lesson', note: asStr(courseMeta?.title) },
  };
}

export function algorithmToSource(algo) {
  const refs = splitRefs(algo?.fourD?.scripture);
  const blocks = [];
  if (asStr(algo?.fourD?.summary)) {
    blocks.push({ kind: 'heading', text: 'The eternal pattern' });
    blocks.push({ kind: 'text', text: algo.fourD.summary });
  }
  refs.forEach((ref) => blocks.push({ kind: 'scripture', ref }));
  if (asStr(algo?.threeD?.summary)) {
    blocks.push({ kind: 'heading', text: 'In practice' });
    blocks.push({ kind: 'text', text: algo.threeD.summary });
  }
  if (asStr(algo?.outcome)) blocks.push({ kind: 'note', label: 'Outcome', text: algo.outcome });
  return {
    id: asStr(algo?.id) || `alg-${asStr(algo?.name).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    kind: 'algorithm',
    title: asStr(algo?.name) || 'Pattern',
    blocks,
    scriptureRefs: refs,
    launch: { view: 'study' },
    provenance: { source: 'eternal algorithm' },
  };
}

export function scriptureThemeToSource(theme) {
  const verses = asArr(theme?.verses);
  const refs = verses.map((v) => asStr(v?.ref)).filter(Boolean);
  const blocks = [];
  const lead = asStr(theme?.depths?.standard) || asStr(theme?.blurb);
  if (lead) blocks.push({ kind: 'text', text: lead });
  verses.forEach((v) => { if (asStr(v?.ref)) blocks.push({ kind: 'scripture', ref: v.ref, theme: asStr(v?.gloss) }); });
  return {
    id: asStr(theme?.id) || 'theme',
    kind: 'scripture',
    title: asStr(theme?.title) || 'Theme',
    intro: asStr(theme?.subtitle),
    blocks,
    scriptureRefs: refs,
    launch: { view: 'church', churchView: 'scripture' },
    provenance: { source: 'scripture library' },
  };
}

export function sermonToSource(row) {
  const date = asStr(row?.serviceDate) || asStr(row?.service_date) || null;
  const ref = asStr(row?.scriptureRef) || asStr(row?.scripture_ref);
  const url = asStr(row?.youtubeUrl) || asStr(row?.youtube_url) || null;
  const blocks = [{ kind: 'note', label: 'Watch', text: 'Watch the full message in The Word, inside the app.' }];
  if (asStr(row?.notes)) blocks.push({ kind: 'text', text: row.notes });
  if (ref) blocks.push({ kind: 'scripture', ref });
  return {
    id: asStr(row?.id) || 'sermon',
    kind: 'sermon',
    title: asStr(row?.title) || 'Message',
    author: asStr(row?.speaker) || '',
    date,
    intro: `A message${asStr(row?.speaker) ? ` from ${row.speaker}` : ''}${ref ? ` on ${ref}` : ''}.`,
    blocks,
    scriptureRefs: ref ? [ref] : [],
    launch: { view: 'church', churchView: 'pulpit' },
    provenance: {
      source: 'message',
      videoId: asStr(row?.videoId) || asStr(row?.video_id) || null,
      startSeconds: Number.isFinite(row?.startSeconds) ? row.startSeconds : null,
      url, date,
    },
  };
}

// --- RECIPES: real, buildable-now books ------------------------------------

// The courses whose authored curriculum can become books out of the box.
export function defaultCourses() {
  return [
    { key: 'living-lessons', meta: LIVING_LESSONS_META, modules: LIVING_LESSONS_MODULES, businesses: ['church'] },
    { key: 'learning-ai', meta: CLASS_META, modules: AI_CLASS_MODULES, businesses: ['church', 'poetech'] },
    { key: 'sovereign-ai', meta: SOVEREIGN_AI_META, modules: SOVEREIGN_AI_MODULES, businesses: ['poetech', 'church'] },
    { key: 'kingdom-economics', meta: ECON_META, modules: ECON_MODULES, businesses: ['church', 'poetech'] },
    { key: 'handed-forward', meta: SUCCESSION_META, modules: SUCCESSION_MODULES, businesses: ['poetech', 'church'] },
    { key: 'prophetic-voices', meta: PV_META, modules: PV_MODULES, businesses: ['church'] },
  ];
}

export function bookFromCourse(course, { nowIso } = {}) {
  const meta = course?.meta || {};
  return assembleBook({
    id: `book-course-${asStr(course?.key) || asStr(meta.key)}`,
    title: asStr(meta.title) || 'Course',
    subtitle: asStr(meta.audience) || asStr(meta.tagline) || asStr(meta.subtitle),
    author: 'Church of the Living God',
    frontMatter: asStr(meta.blurb) || asStr(meta.tagline),
    sources: asArr(course?.modules).map((m) => lessonModuleToSource(m, meta)),
    scriptureResolver: kjvResolver,
    businesses: course?.businesses || ['church'],
    nowIso,
  });
}

export function bookFromAlgorithms(entries, { nowIso, title } = {}) {
  return assembleBook({
    id: 'book-eternal-algorithms',
    title: asStr(title) || 'Eternal Algorithms',
    subtitle: 'Frameworks the Word gives — and the outcomes they yield',
    author: 'Darrell Poe / PoeTech',
    frontMatter: 'Patterns from Scripture, paired with the real-life outcome each one produces.',
    sources: asArr(entries).map(algorithmToSource),
    scriptureResolver: kjvResolver,
    businesses: ['church', 'poetech'],
    nowIso,
  });
}

export function bookFromScriptureThemes(themes, { nowIso, title } = {}) {
  return assembleBook({
    id: 'book-scripture-by-theme',
    title: asStr(title) || 'Scripture by Theme',
    subtitle: 'A themed walk through the Word (KJV)',
    author: 'Church of the Living God',
    sources: asArr(themes).map(scriptureThemeToSource),
    scriptureResolver: kjvResolver,
    businesses: ['church'],
    nowIso,
  });
}

export function bookFromSermons(rows, { nowIso, title } = {}) {
  return assembleBook({
    id: 'book-messages',
    title: asStr(title) || 'Messages from the House',
    subtitle: 'A reader companion to the preached Word',
    author: 'Church of the Living God',
    sources: asArr(rows).map(sermonToSource),
    scriptureResolver: kjvResolver,
    businesses: ['church'],
    nowIso,
  });
}

// What the reader can build right now, given what is loaded. Each descriptor is
// honest about availability + count (no painted options).
export function availableRecipes(ctx = {}) {
  const courses = asArr(ctx.courses).length ? ctx.courses : defaultCourses();
  const algos = asArr(ctx.algorithms).length ? ctx.algorithms : SEED_ALGORITHMS;
  const themes = asArr(ctx.scriptureThemes).length ? ctx.scriptureThemes : allThemes();
  const sermons = asArr(ctx.sermons);

  const list = courses.map((c) => ({
    id: `course-${c.key || c.meta?.key}`,
    title: asStr(c.meta?.title) || 'Course',
    kind: 'course',
    source: 'Learn curriculum',
    count: asArr(c.modules).length,
    available: asArr(c.modules).length > 0,
    businesses: c.businesses || ['church'],
  }));

  list.push({
    id: 'algorithms', title: 'Eternal Algorithms', kind: 'algorithm',
    source: asArr(ctx.algorithms).length ? 'Your library' : 'Seed catalog',
    count: algos.length, available: algos.length > 0, businesses: ['church', 'poetech'],
  });
  list.push({
    id: 'scripture-themes', title: 'Scripture by Theme', kind: 'scripture',
    source: 'Scripture library (KJV)', count: themes.length, available: themes.length > 0, businesses: ['church'],
  });
  list.push({
    id: 'sermons', title: 'Messages from the House', kind: 'sermon',
    source: 'Sermon corpus', count: sermons.length, available: sermons.length > 0,
    businesses: ['church'],
    // Surface-says-truth (DR-0239 §3): the Library SELF-subscribes to the
    // sermon stream, so "open the Word tab first" was stale advice — an empty
    // count now means the library itself has no rows yet (or you're signed out).
    reason: sermons.length ? '' : 'No messages have been loaded into the sermon library yet — sign in, and see Church → The Word.',
  });
  return list;
}

export function buildRecipe(id, ctx = {}, { nowIso } = {}) {
  const courses = asArr(ctx.courses).length ? ctx.courses : defaultCourses();
  if (asStr(id).startsWith('course-')) {
    const key = id.slice('course-'.length);
    const course = courses.find((c) => (c.key || c.meta?.key) === key);
    return course ? bookFromCourse(course, { nowIso }) : null;
  }
  if (id === 'algorithms') {
    const algos = asArr(ctx.algorithms).length ? ctx.algorithms : SEED_ALGORITHMS;
    return bookFromAlgorithms(algos, { nowIso });
  }
  if (id === 'scripture-themes') {
    const themes = asArr(ctx.scriptureThemes).length ? ctx.scriptureThemes : allThemes();
    return bookFromScriptureThemes(themes, { nowIso });
  }
  if (id === 'sermons') {
    const sermons = asArr(ctx.sermons);
    return sermons.length ? bookFromSermons(sermons, { nowIso }) : null;
  }
  return null;
}

// --- SOVEREIGN SHELF: device-local persistence (the only I/O; fails soft) ---

export const SHELF_VERSION = 1;
export function shelfKey(email) { return `poetech.bookshelf.${asStr(email).toLowerCase() || 'anon'}`; }

function safeStorage() {
  try { return (typeof localStorage !== 'undefined' && localStorage) ? localStorage : null; } catch { return null; }
}

export function loadShelf(email) {
  const ls = safeStorage();
  if (!ls) return { version: SHELF_VERSION, books: [] };
  try {
    const raw = ls.getItem(shelfKey(email));
    if (!raw) return { version: SHELF_VERSION, books: [] };
    const parsed = JSON.parse(raw);
    return { version: SHELF_VERSION, books: asArr(parsed.books) };
  } catch { return { version: SHELF_VERSION, books: [] }; }
}

export function saveShelf(email, books) {
  const ls = safeStorage();
  if (!ls) return { skipped: 'no-storage' };
  try {
    ls.setItem(shelfKey(email), JSON.stringify({ version: SHELF_VERSION, books: asArr(books) }));
    return { saved: true };
  } catch (e) { return { skipped: 'write-error', error: e }; }
}

export function upsertBook(books, book) {
  const list = asArr(books).filter((b) => b && b.id !== book?.id);
  return book ? [book, ...list] : list;
}

export function removeBook(books, id) {
  return asArr(books).filter((b) => b && b.id !== id);
}
