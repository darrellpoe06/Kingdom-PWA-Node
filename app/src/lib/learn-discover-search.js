// =============================================================================
// learn-discover-search — natural-language search over the whole curriculum
// =============================================================================
// Reads learn-discover-index.json (derived from the mounted catalog by
// scripts/derive-learn-discover-index.mjs) and answers a typed question with
// lessons, in the order a reader would choose.
//
// WHAT IT SEARCHES, in weight order: the original title and the promotional
// title and headline; the anchor theme, big idea and promotional description;
// the scripture the lesson anchors on and quotes; the course's declared plain
// words; the lesson's most distinctive body words; and, at lower weight, the
// curriculum's own words for what was typed (learn-discover-concepts.js).
//
// THE EXISTING GUARANTEES ARE KEPT, NOT RE-IMPLEMENTED. The finder Learn already
// uses (learn-organize.js searchLessons: title, then verse reference, then a
// course's declared plain word, with its seat-in-the-window guarantees,
// DR-1049 / DR-1129 / DR-1329) runs here on rows rebuilt to the same shape.
// The best-scored lessons lead; the finder's declared-word seats are then
// guaranteed inside the window (see the seat pass in discoverSearch). The new
// scoring reaches what that finder cannot (a question, a feeling, body content).
//
// Pure: no React, no storage, no network, no cost per query.
// =============================================================================
import { searchLessons } from './learn-organize.js';
import { stem, stems, queryStems, subjectWords, scriptureRefs } from './learn-discover-text.js';
import { conceptsFor } from './learn-discover-concepts.js';

const W_TITLE = 4;
const W_META = 2.5;
const W_BODY = 1.0;
const W_PLAIN = 2;
const W_VERSE = 6;
const CONCEPT_WEIGHT = 0.3;
export const RESULT_LIMIT = 40;

/** Prepare the derived file for searching. Pure; ~30 ms for 995 lessons. */
export function prepareIndex(data) {
  const courses = data.courses || [];
  const lessons = (data.lessons || []).map((l, order) => {
    const c = courses[l.c] || {};
    const plain = (c.p || []).join(' ').toLowerCase();
    return {
      order,
      raw: l,
      course: c,
      titleSet: new Set(stems(`${l.t} ${l.p || ''} ${l.h || ''}`)),
      metaSet: new Set(stems(`${l.th || ''} ${l.b || ''} ${l.d || ''} ${(l.tg || []).join(' ')} ${c.t || ''}`)),
      bodySet: new Set(l.w || []),
      plainSet: new Set(stems(plain)),
      refSet: new Set(l.s || []),
      // The finder's own row, same formula as learn-organize.js buildLessonIndex.
      row: {
        courseKey: c.k,
        courseTitle: String(c.t || c.k || ''),
        deep: !!c.deep,
        unitLabel: `Week ${l.u || ''}`.trim(),
        lessonId: l.i,
        title: l.t,
        ref: l.r,
        theme: l.th,
        hayTitle: String(l.t || '').toLowerCase(),
        hayRef: String(l.r || '').toLowerCase(),
        hayBody: [l.b, l.th, Array.isArray(l.tg) ? l.tg.join(' ') : ''].filter(Boolean).join(' ').toLowerCase() + (plain ? ` ${plain}` : ''),
        hayPlain: plain,
      },
    };
  });
  const df = new Map();
  for (const L of lessons) {
    const all = new Set([...L.titleSet, ...L.metaSet, ...L.bodySet, ...L.plainSet]);
    for (const s of all) df.set(s, (df.get(s) || 0) + 1);
  }
  const declared = new Set();
  for (const c of courses) for (const w of c.p || []) declared.add(String(w).toLowerCase());
  return { declared, lessons, df, N: lessons.length, byId: new Map(lessons.map((L) => [L.raw.i, L])), finderRows: lessons.map((L) => L.row) };
}

// A rare adjective ("godly") must not outweigh the subject it describes ("children"), so one word's weight is capped.
const IDF_CAP = 3.4;
const idf = (P, s) => Math.min(IDF_CAP, Math.log(1 + P.N / (P.df.get(s) || 0.5)));

/**
 * Answer a typed question.
 * @returns {Array<{ lessonId, courseKey, score, why: 'title'|'verse'|'topic'|'content'|'related', finder: boolean }>}
 */
export function discoverSearch(P, query, limit = RESULT_LIMIT) {
  const q = String(query || '').trim();
  if (!q || !P) return [];
  let typed = [...new Set(queryStems(q))];
  let words = subjectWords(q);
  // A word a course DECLARED ("bible", "will") can also be a question word or a stopword. When it is
  // everything the reader typed, it is the subject, and the declaring courses keep their seats.
  if (!typed.length && !words.length) {
    const own = q.toLowerCase().split(/[^a-z]+/).filter((t) => t.length >= 3 && P.declared.has(t));
    words = own;
    typed = [...new Set(own.map((t) => stem(t)))];
  }
  const qRefs = scriptureRefs(q);
  if (!typed.length && !qRefs.length && !words.length) return [];

  const { words: related } = conceptsFor(typed);
  const refIdf = Math.log(1 + P.N / 3);
  const needIdf = typed.reduce((a, t) => a + idf(P, t), 0) + qRefs.length * refIdf;
  const scored = [];
  for (const L of P.lessons) {
    let score = 0;
    let hitIdf = 0;
    let why = null;
    const mark = (w) => { if (!why || RANK[w] > RANK[why]) why = w; };
    for (const t of typed) {
      const i = idf(P, t);
      let got = 0;
      if (L.titleSet.has(t)) { got = Math.max(got, W_TITLE); mark('title'); }
      if (L.metaSet.has(t)) { got = Math.max(got, W_META); mark('topic'); }
      if (L.plainSet.has(t)) { got = Math.max(got, W_PLAIN); mark('topic'); }
      if (L.bodySet.has(t)) { got = Math.max(got, W_BODY); mark('content'); }
      if (got) { score += got * i; hitIdf += i; }
    }
    for (const t of related) {
      const i = idf(P, t) * CONCEPT_WEIGHT;
      let got = 0;
      if (L.titleSet.has(t)) got = W_TITLE; else if (L.metaSet.has(t)) got = W_META; else if (L.bodySet.has(t)) got = W_BODY;
      if (got) { score += got * i; mark('related'); }
    }
    for (const r of qRefs) if (L.refSet.has(r)) { score += W_VERSE * 2; hitIdf += refIdf; mark('verse'); }
    if (!score) continue;
    // Matching more of what was typed beats matching one word hard, and a
    // distinctive word ("children") counts for more than a common one ("God").
    if (typed.length + qRefs.length > 1 && needIdf > 0) score *= 0.45 + 0.55 * Math.min(1, hitIdf / needIdf);
    scored.push({ L, score, why: why || 'related' });
  }
  scored.sort((a, b) => (b.score - a.score) || (a.L.order - b.L.order));

  // Best-scored lessons lead. Then the finder's guarantee is applied: every
  // course that DECLARED the typed word keeps one seat in the window (DR-1049,
  // DR-1129, DR-1329), taken from the lowest-ranked rows and never from another
  // course's only seat.
  const window = scored.slice(0, limit).map((s) => ({ L: s.L, score: s.score, why: s.why, finder: false, seat: false }));
  if (words.length) {
    const finderHits = searchLessons(P.finderRows, words.join(' '), limit);
    const whyOf = new Map(scored.map((s) => [s.L.raw.i, s.why]));
    const have = new Set(window.map((w) => w.L.course.k));
    const owed = [];
    const taken = new Set();
    for (const r of finderHits) {
      const declared = r.hayPlain && words.every((w) => r.hayPlain.includes(w));
      const L = P.byId.get(r.lessonId);
      if (!L) continue;
      const k = L.course.k;
      if (declared && !have.has(k) && !taken.has(k)) { taken.add(k); owed.push(L); }
      const w = window.find((x) => x.L === L);
      if (w) w.finder = true;
    }
    let at = window.length - 1;
    for (const L of owed) {
      if (window.length < limit) { window.push({ L, score: 0, why: whyOf.get(L.raw.i) || 'topic', finder: true, seat: true }); continue; }
      while (at >= 0) {
        const k = window[at].L.course.k;
        const sole = window[at].seat || window.filter((x) => x.L.course.k === k).length === 1;
        if (!sole) break;
        at -= 1;
      }
      if (at < 0) break;
      window[at] = { L, score: 0, why: whyOf.get(L.raw.i) || 'topic', finder: true, seat: true };
      at -= 1;
    }
  }
  return window.map((w) => ({ lessonId: w.L.raw.i, courseKey: w.L.course.k, score: w.score, why: w.why, finder: w.finder, seat: w.seat }));
}

const RANK = { related: 1, content: 2, topic: 3, title: 4, verse: 5 };
