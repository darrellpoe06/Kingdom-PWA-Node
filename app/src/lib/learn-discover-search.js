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
import { conceptsFor, conceptWords, isConceptWord } from './learn-discover-concepts.js';
import { categoryMembers } from './learn-discover-categories.js';

const W_TITLE = 4;
const W_META = 2.5;
const W_BODY = 0.5;
const W_PLAIN = 1.2;
const W_COURSE = 1.6;
// A lesson whose title, theme, big idea or description says nothing about the subject is only a
// weak answer, however often its body repeats a word: its score is scaled down by this.
const NO_HEAD = 0.35;
// A reader's question that clearly belongs to a discovery category lifts the lessons strongly in it.
const W_CATEGORY = 2.2;
// A lesson hand-read as a true answer to an everyday concept (learn-discover-concepts.js `seeds`).
const W_SEED = 9;
// Words that say little about the subject ("high", "handle") count for a quarter of a subject word.
const GENERIC = new Set(
  [
    'high',
    'handle',
    'hard',
    'day',
    'make',
    'makes',
    'good',
    'great',
    'best',
    'new',
    'time',
    'life',
    'thing',
    'things',
    'people',
    'person',
    'problem',
    'problems',
    'advice',
    'skill',
    'skills',
    'tips',
    'lesson',
    'lessons',
    'work',
    'raise',
    'grow',
    'become',
    'find',
    'start',
    'begin',
    'deal',
    'keep',
    'closer',
    'first',
    'choose',
    'decide',
    'pick',
    'use',
    'using',
    'take',
    'help',
    'allow',
    'lost',
    'lose',
    'losing',
    'handle',
    'every',
    'month',
    'hard',
  ].map(stem)
);
const W_VERSE = 6;
const CONCEPT_WEIGHT = 0.5;
const PURE_WEIGHT = 0.85; // when the typed words are all ones a concept answers, the concept's own words count nearly as much as the typed ones
const RELATED_CAP = 7;
// A typed word among a lesson's most distinctive words (first CENTRAL_N) marks a lesson ABOUT the subject.
const CENTRAL_N = 24;
const W_CENTRAL = 3.2;
export const RESULT_LIMIT = 40;

// Idioms whose words are not about their usual subject ("on purpose" is not about purpose).
const IDIOM = /\bon purpose\b|\bfor the most part\b|\bas a matter of course\b/gi;
const plainHead = (t) => String(t || '').replace(IDIOM, ' ');

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
      titleSet: new Set(stems(plainHead(`${l.t} ${l.p || ''} ${l.h || ''}`))),
      metaSet: new Set(stems(plainHead(`${l.th || ''} ${l.b || ''} ${l.d || ''} ${(l.tg || []).join(' ')}`))),
      // The course's own name is a head signal too ("eviction" lives in "Evictions Handled Righteously").
      courseSet: new Set(stems(c.t || '')),
      bodySet: new Set(l.w || []),
      // Where a word sits in the lesson's own list of its most distinctive words: first means the lesson is ABOUT it.
      bodyPos: new Map((l.w || []).slice(0, CENTRAL_N).map((w, i) => [w, i])),
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
    const all = new Set([...L.titleSet, ...L.metaSet, ...L.bodySet, ...L.plainSet, ...L.courseSet]);
    for (const s of all) df.set(s, (df.get(s) || 0) + 1);
  }
  // The words the curriculum itself uses (not stems), for a spelling that is one or two letters off.
  const rawVocab = new Map();
  const addRaw = (text) => {
    for (const w of String(text || '')
      .toLowerCase()
      .replace(/[\u2018\u2019']/g, '')
      .match(/[a-z]{4,}/g) || [])
      rawVocab.set(w, (rawVocab.get(w) || 0) + 1);
  };
  for (const l of data.lessons || []) {
    addRaw(l.t);
    addRaw(l.p);
    addRaw(l.th);
    addRaw(l.b);
    addRaw(l.d);
  }
  for (const w of conceptWords()) if (!rawVocab.has(w)) rawVocab.set(w, 1);
  const dfHead = new Map();
  for (const L of lessons) for (const s of new Set([...L.titleSet, ...L.metaSet, ...L.courseSet])) dfHead.set(s, (dfHead.get(s) || 0) + 1);
  const declared = new Set();
  for (const c of courses) for (const w of c.p || []) declared.add(String(w).toLowerCase());
  const P = {
    rawVocab,
    declared,
    lessons,
    df,
    dfHead,
    N: lessons.length,
    byId: new Map(lessons.map((L) => [L.raw.i, L])),
    finderRows: lessons.map((L) => L.row),
  };
  P.catStrong = new Map([...categoryMembers(P)].map(([id, m]) => [id, m.strong]));
  return P;
}

// A rare adjective ("godly") must not outweigh the subject it describes ("children"), so one word's weight is capped.
const IDF_CAP = 3.4;
// A word found in the heads of more than a fifth of all lessons ("God", "Yahweh") discriminates nothing.
const UBIQUITOUS = 0.2;
const weightOf = (P, t) => (GENERIC.has(t) || ((P.dfHead.get(t) || 0) > UBIQUITOUS * P.N && !isConceptWord(t)) ? 0.25 : 1);
// Rarity is measured where the word matched: in lesson HEADS (title, theme, idea, course name) or in BODIES.
const idfH = (P, s) => Math.min(IDF_CAP, Math.log(1 + P.N / (P.dfHead.get(s) || 0.5)));
const idf = (P, s) => Math.min(IDF_CAP, Math.log(1 + P.N / (P.df.get(s) || 0.5)));

/** Edit distance counting a swapped pair of neighbours as one slip. */
export function editDistance(a, b, max = 3) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev2 = new Array(b.length + 1).fill(0);
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const cur = [i];
    for (let j = 1; j <= b.length; j += 1) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) cur[j] = Math.min(cur[j], prev2[j - 2] + 1);
    }
    for (let j = 0; j <= b.length; j += 1) prev2[j] = prev[j];
    prev = cur;
  }
  return prev[b.length];
}

/**
 * A word the curriculum does not use, one or two slips from a word it does, is read as that word.
 * Only words of five letters or more are touched, and a word the curriculum already uses is never changed.
 * @returns {{ text: string, changed: Array<[string, string]> }}
 */
export function correctQuery(P, q) {
  const changed = [];
  const out = String(q).replace(/[A-Za-z]{5,}/g, (word) => {
    const w = word.toLowerCase();
    if (P.rawVocab.has(w) || P.df.has(stem(w)) || P.declared.has(w)) return word;
    const max = w.length >= 7 ? 2 : 1;
    let best = null;
    let bestD = max + 1;
    let bestN = 0;
    for (const [cand, n] of P.rawVocab) {
      if (Math.abs(cand.length - w.length) > max) continue;
      const d = editDistance(w, cand, max);
      if (d < bestD || (d === bestD && n > bestN)) {
        best = cand;
        bestD = d;
        bestN = n;
      }
    }
    if (best && bestD <= max) {
      changed.push([word, best]);
      return best;
    }
    return word;
  });
  return { text: out, changed };
}

/**
 * Answer a typed question.
 * @returns {Array<{ lessonId, courseKey, score, why: 'title'|'verse'|'topic'|'content'|'related', finder: boolean }>}
 */
export function discoverSearch(P, query, limit = RESULT_LIMIT) {
  let q = String(query || '').trim();
  if (!q || !P) return [];
  q = correctQuery(P, q).text;
  let typed = [...new Set(queryStems(q))];
  let words = subjectWords(q);
  // A word a course DECLARED ("bible", "will") can also be a question word or a stopword. When it is
  // everything the reader typed, it is the subject, and the declaring courses keep their seats.
  if (!typed.length && !words.length) {
    const own = q
      .toLowerCase()
      .split(/[^a-z]+/)
      .filter((t) => t.length >= 3 && P.declared.has(t));
    words = own;
    typed = [...new Set(own.map((t) => stem(t)))];
  }
  const qRefs = scriptureRefs(q);
  if (!typed.length && !qRefs.length && !words.length) return [];

  const { words: related, cats, seeds, pure } = conceptsFor(typed);
  const cw = pure ? PURE_WEIGHT : CONCEPT_WEIGHT;
  const anchored = !pure && typed.some((t) => weightOf(P, t) === 1);
  const strongSets = cats.map((c) => P.catStrong.get(c)).filter(Boolean);
  const refIdf = Math.log(1 + P.N / 3);
  const needIdf = typed.reduce((a, t) => a + idfH(P, t) * weightOf(P, t), 0) + qRefs.length * refIdf;
  const scored = [];
  for (const L of P.lessons) {
    let score = 0;
    let hitIdf = 0;
    let head = false;
    let why = null;
    const mark = (w) => {
      if (!why || RANK[w] > RANK[why]) why = w;
    };
    for (const t of typed) {
      const g = weightOf(P, t);
      const iH = idfH(P, t) * g;
      const iB = idf(P, t) * g;
      let got = 0;
      let used = iH;
      const take = (w, i, isHead) => {
        if (w * i > got) {
          got = w * i;
          used = i;
        }
        if (isHead) head = true;
      };
      if (L.titleSet.has(t)) {
        take(W_TITLE, iH, true);
        mark('title');
      }
      if (L.metaSet.has(t)) {
        take(W_META, iH, true);
        mark('topic');
      }
      if (L.courseSet.has(t)) {
        take(W_COURSE, iH, true);
        mark('topic');
      }
      if (L.plainSet.has(t)) {
        take(W_PLAIN, iH, false);
        mark('topic');
      }
      if (L.bodySet.has(t)) {
        take(W_BODY, iB, false);
        mark('content');
      }
      const pos = L.bodyPos.get(t);
      if (pos !== undefined) {
        const c = W_CENTRAL * iH * (1 - pos / CENTRAL_N);
        got += c;
        head = true;
        mark('topic');
      }
      if (got) {
        score += got;
        hitIdf += used;
      }
    }
    let relScore = 0;
    for (const t of related) {
      const iH = idfH(P, t) * cw;
      const iB = idf(P, t) * cw;
      let got = 0;
      if (L.titleSet.has(t)) {
        got = W_TITLE * iH;
        head = true;
      } else if (L.metaSet.has(t)) {
        got = W_META * iH;
        head = true;
      } else if (L.bodySet.has(t)) got = W_BODY * iB;
      if (got) {
        relScore += got;
        mark('related');
      }
    }
    // The words the curriculum uses for what was typed can support a lesson, never outweigh one that says it.
    // A question with no distinctive word of its own ("grow closer to God") IS its related words, so it is not capped.
    score += anchored ? Math.min(relScore, RELATED_CAP) : relScore;
    for (const r of qRefs)
      if (L.refSet.has(r)) {
        score += W_VERSE * 2;
        hitIdf += refIdf;
        mark('verse');
      }
    if (seeds.has(L.raw.i)) {
      score += W_SEED;
      head = true;
      if (!why || RANK.topic > RANK[why]) why = 'topic';
    }
    if (strongSets.some((set) => set.has(L.raw.i))) {
      score += W_CATEGORY;
      head = true;
      if (!why) why = 'topic';
    }
    if (!score) continue;
    if (!head && !qRefs.length) score *= NO_HEAD;
    // Matching more of what was typed beats matching one word hard, and a
    // distinctive word ("children") counts for more than a common one ("God").
    if (typed.length + qRefs.length > 1 && needIdf > 0) score *= 0.45 + 0.55 * Math.min(1, hitIdf / needIdf);
    scored.push({ L, score, why: why || 'related' });
  }
  scored.sort((a, b) => b.score - a.score || a.L.order - b.L.order);

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
      if (declared && !have.has(k) && !taken.has(k)) {
        taken.add(k);
        owed.push(L);
      }
      const w = window.find((x) => x.L === L);
      if (w) w.finder = true;
    }
    let at = window.length - 1;
    for (const L of owed) {
      if (window.length < limit) {
        window.push({ L, score: 0, why: whyOf.get(L.raw.i) || 'topic', finder: true, seat: true });
        continue;
      }
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
