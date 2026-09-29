#!/usr/bin/env node
// =============================================================================
// who-he-is-generate — every passage in the whole Word that tells Who He Is
// =============================================================================
// Reads the KJV corpus (app/public/bible/kjv) and the public-domain cross-
// reference data (app/public/bible/xref) through the written rule in
// app/src/lib/who-he-is-rules.js, and writes app/src/lib/who-he-is-data.json.
//
//   node scripts/who-he-is-generate.mjs          write the data
//   node scripts/who-he-is-generate.mjs --check  fail if the committed data
//                                                is not what the rule makes
//
// Deterministic: no clock, no network, no randomness; the same corpus and the
// same rule give byte-identical output (pinned by who-he-is-data.test.js).
// Every count the app shows is derived from the entries this writes (DR-0675;
// DR-0076: a count is measured, never typed).
// =============================================================================
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as RULES from '../app/src/lib/who-he-is-rules.js';

// The rule in force. generate(rules) swaps it for one run, so a test can hand
// in a planted fault and prove the guards catch it.
let R = RULES;

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const KJV = join(ROOT, 'app', 'public', 'bible', 'kjv');
const XREF = join(ROOT, 'app', 'public', 'bible', 'xref');
export const DATA_PATH = join(ROOT, 'app', 'src', 'lib', 'who-he-is-data.json');

// ---- corpus -----------------------------------------------------------------
let CORPUS = null;
export function loadCorpus() {
  if (CORPUS) return CORPUS;
  const index = JSON.parse(readFileSync(join(KJV, 'index.json'), 'utf8'));
  const verses = [];
  const byRef = new Map();
  index.forEach((b, bi) => {
    const d = JSON.parse(readFileSync(join(KJV, `${b.file}.json`), 'utf8'));
    d.chapters.forEach((ch, ci) => ch.forEach((t, vi) => {
      const v = { book: b.name, bi, c: ci + 1, v: vi + 1, t, ref: `${b.name} ${ci + 1}:${vi + 1}`, i: verses.length };
      verses.push(v);
      byRef.set(v.ref, v);
    }));
  });
  CORPUS = { index, verses, byRef };
  return CORPUS;
}

let XREF_MAP = null;
function loadXref() {
  if (XREF_MAP) return XREF_MAP;
  const map = new Map();
  XREF_MAP = map;
  for (const f of readdirSync(XREF).filter((x) => x.endsWith('.json') && x !== 'index.json').sort()) {
    const d = JSON.parse(readFileSync(join(XREF, f), 'utf8'));
    if (!d || !d.refs) continue;
    for (const [cv, list] of Object.entries(d.refs)) map.set(`${d.book} ${cv}`, list);
  }
  return map;
}

const isNT = (v) => v.bi >= 39;
const re = (s, flags = '') => new RegExp(s, flags);

export function rangeRef(a, b) {
  if (a.book !== b.book) throw new Error(`range across books: ${a.ref} ${b.ref}`);
  if (a.i === b.i) return a.ref;
  if (a.c === b.c) return `${a.book} ${a.c}:${a.v}-${b.v}`;
  return `${a.book} ${a.c}:${a.v}-${b.c}:${b.v}`;
}

// Expand "Book c:v", "Book c:v-v2" or "Book c:v-c2:v2" to verse refs.
export function expandRef(ref, byRef, verses) {
  const m = /^(.+?) (\d+):(\d+)(?:-(?:(\d+):)?(\d+))?$/.exec(ref);
  if (!m) return [];
  const start = byRef.get(`${m[1]} ${m[2]}:${m[3]}`);
  if (!start) return [];
  if (!m[5]) return [start.ref];
  const end = byRef.get(`${m[1]} ${m[4] || m[2]}:${m[5]}`);
  if (!end) return [];
  const out = [];
  for (let i = start.i; i <= end.i; i++) out.push(verses[i].ref);
  return out;
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const uniq = (a) => [...new Set(a)];
const cvKey = (s) => s.split(':').map(Number);
const cvLE = (a, b) => (a[0] < b[0]) || (a[0] === b[0] && a[1] <= b[1]);

// ---- titles -------------------------------------------------------------------
function titleMatcher() {
  const pats = R.NAME_LEXICON.filter((x) => x.title !== 'the Word').map((x) => ({ title: x.title, rx: re(x.pattern) }));
  const excluded = new Set(R.NAME_EXCLUSIONS.map((x) => x.ref));
  const word = new Set(R.WORD_VERSES);
  const lord = new Set(R.LORD_VERSES.map((x) => x[0]));
  return (v) => {
    if (!isNT(v) || excluded.has(v.ref)) return [];
    const found = pats.filter((p) => p.rx.test(v.t)).map((p) => p.title);
    if (word.has(v.ref)) found.push('the Word');
    if (lord.has(v.ref)) { found.push('the Lord'); USED.lord.add(v.ref); }
    return found;
  };
}

// ---- scenes -----------------------------------------------------------------
// Every written row must match something; a row that matches nothing is a
// stale judgment and fails the build (see assertAllUsed).
const USED = { joins: new Set(), presence: new Set(), applies: new Set(), lord: new Set() };

export function segmentBook(book, corpus) {
  const vs = corpus.verses.filter((v) => v.book === book);
  const open = re(R.SCENE_OPEN);
  const move = re(R.SCENE_MOVE);
  const vision = re(R.VISION_OPEN);
  const forced = new Set(R.FORCED_CUTS);
  const cuts = []; // [startIndex, forced]
  for (const v of vs) {
    if (v.v === 1 || forced.has(v.ref)) { cuts.push([v.i, true]); continue; }
    const head = v.t.split(/[,;:]/).slice(0, 2).join(',');
    const isCut = book === 'Revelation' ? vision.test(v.t) : (open.test(v.t) && move.test(head));
    if (isCut) cuts.push([v.i, false]);
  }
  let pieces = cuts.map(([s, f], k) => ({ s, e: (k + 1 < cuts.length ? cuts[k + 1][0] : vs[vs.length - 1].i + 1) - 1, forced: f }));
  // A short piece is a scene's opening line: it joins the piece after it in
  // the same chapter (unless that one is forced to begin a scene); failing
  // that, it joins the piece before it (unless it is itself forced).
  const chap = (x) => corpus.verses[x.s].c;
  let changed = true;
  while (changed) {
    changed = false;
    for (let k = 0; k < pieces.length; k++) {
      const p = pieces[k];
      if (p.e - p.s + 1 >= R.SCENE_MIN) continue;
      const next = pieces[k + 1];
      const prev = pieces[k - 1];
      if (next && chap(next) === chap(p) && !next.forced) {
        pieces.splice(k, 2, { s: p.s, e: next.e, forced: p.forced });
        changed = true; break;
      }
      if (prev && chap(prev) === chap(p) && !p.forced) {
        pieces.splice(k - 1, 2, { s: prev.s, e: p.e, forced: prev.forced });
        changed = true; break;
      }
    }
  }
  // Written joins.
  const joins = new Map(R.SCENE_JOINS);
  const out = [];
  for (const p of pieces) {
    const prev = out[out.length - 1];
    if (prev && joins.has(corpus.verses[p.s].ref)) { prev.e = p.e; USED.joins.add(corpus.verses[p.s].ref); } else out.push({ ...p });
  }
  return out.map((p) => ({ s: p.s, e: p.e }));
}

// ---- quotations -------------------------------------------------------------
function contentWords(t, stop) {
  return new Set(t.toLowerCase().replace(/[’']/g, '').replace(/[^a-z ]+/g, ' ').split(/\s+/)
    .filter((w) => w && !stop.has(w)).map((w) => w.replace(/(eth|est|ed|ing|es|s)$/, '').slice(0, 6)));
}

export function findQuotations(corpus, xref) {
  const Q = R.QUOTE_METHOD;
  const stop = new Set(Q.STOPWORDS.split(' '));
  const formula = re(Q.FORMULA);
  const found = [];
  for (const n of corpus.verses) {
    if (!isNT(n)) continue;
    const win = [corpus.verses[n.i - 2], corpus.verses[n.i - 1], n]
      .filter((x) => x && x.book === n.book && x.c === n.c).map((x) => x.t).join(' ');
    const hasFormula = formula.test(win);
    const cn = contentWords(n.t, stop);
    const cands = [];
    for (const [to, votes] of (xref.get(n.ref) || [])) {
      for (const o of expandRef(to, corpus.byRef, corpus.verses)) {
        const ov = corpus.byRef.get(o);
        if (!ov || isNT(ov)) continue;
        const co = contentWords(ov.t, stop);
        let s = 0;
        for (const w of co) if (cn.has(w)) s++;
        const ratio = s / Math.max(1, Math.min(co.size, cn.size));
        const ok = hasFormula
          ? ((s >= Q.FORMULA_SHARED && ratio >= Q.FORMULA_RATIO) || (s >= Q.FORMULA_SHARED_TIGHT && ratio >= Q.FORMULA_RATIO_TIGHT))
          : (s >= Q.FREE_SHARED && ratio >= Q.FREE_RATIO && votes >= Q.FREE_VOTES);
        if (ok) cands.push({ ot: ov, s, votes });
      }
    }
    if (!cands.length) continue;
    cands.sort((a, b) => b.s - a.s || b.votes - a.votes || a.ot.i - b.ot.i);
    const best = cands[0];
    const seen = new Set();
    for (const c of cands) {
      const near = c.ot.book === best.ot.book && c.ot.c === best.ot.c && Math.abs(c.ot.v - best.ot.v) <= Q.NEIGHBOUR && c.s >= best.s - 2;
      if ((c === best || near) && !seen.has(c.ot.ref)) {
        seen.add(c.ot.ref);
        found.push({ nt: n.ref, ot: c.ot.ref, shared: c.s, votes: c.votes, formula: hasFormula });
      }
    }
  }
  return found;
}

// ---- the build ----------------------------------------------------------------
function textOf(refs, corpus) { return refs.map((r) => corpus.byRef.get(r).t).join(' '); }

function verseObj(ref, corpus) {
  const v = corpus.byRef.get(ref);
  if (!v) throw new Error(`unknown verse ${ref}`);
  return { ref, text: v.t };
}

function narrativeEra(v) {
  for (const [book, from, to, era] of R.NARRATIVE_ERAS) {
    if (book !== v.book) continue;
    if (cvLE(cvKey(from), [v.c, v.v]) && cvLE([v.c, v.v], cvKey(to))) return era;
  }
  return null;
}

function otEra(v) {
  const b = R.OT_BOOKS[v.book];
  if (b.era !== 'by-chapter') return b.era;
  for (const [a, z, era] of R.GENESIS_ERAS) if (v.c >= a && v.c <= z) return era;
  throw new Error(`no era for ${v.ref}`);
}

function placesIn(text) {
  const out = [];
  for (const p of R.PLACES) {
    const lower = p[0] === p[0].toLowerCase();
    const rx = new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, lower ? 'i' : '');
    const m = rx.exec(text);
    if (m) out.push([m.index, p]);
  }
  // A longer name wins over a shorter one it contains (Caesarea Philippi / Caesarea).
  const names = out.sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  return names.filter((n) => !names.some((o) => o !== n && o.includes(n)));
}

const SPEAKER = /\b((?:[A-Z][a-z]+)(?: [A-Z][a-z]+)?|the (?:centurion|high priest|devil|angel|angels|people|multitude|disciples|Pharisees|scribes|chief priests|woman|women|governor|officers|Jews|eleven|twelve|unclean spirit|thief|soldiers|servant|ruler|Samaritans|men)|a voice (?:from heaven|out of the cloud|out of heaven))(?:,[^,.;:]{0,60},)? (?:answered and said|answering said|said|saith|cried|spake|asked)\b/g;
const NOT_A_NAME = /^(?:And|Then|But|Now|For|So|When|He|She|They|It|Ye|I|Verily|Behold|Lord|Master|Sir|Woman|Why|What|Who|Thus|Therefore|Again|Moreover|Yea|Nay|O|If|Whosoever|Blessed|Howbeit|Others|Some|This|These|Omega|Gentiles|Jerusalem|God|Father|Spirit|Truly|Wherefore|Neither|Also|Afterward)$/;
function speakersIn(text) {
  const out = [];
  for (const m of text.matchAll(SPEAKER)) {
    let name = m[1].split(' ');
    while (name.length && NOT_A_NAME.test(name[0])) name = name.slice(1);
    const n = name.join(' ');
    if (n && !NOT_A_NAME.test(n)) out.push(n);
  }
  return uniq(out);
}

function pointsTo(text, ownEra) {
  const out = [];
  for (const e of R.ERAS) {
    if (e.id === ownEra) continue;
    const pat = R.POINTS_TO[e.id];
    if (pat && re(pat).test(text)) out.push(e.id);
  }
  return out;
}

const joinList = (a) => (a.length <= 1 ? (a[0] || '') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const refRange = (refs, corpus) => rangeRef(corpus.byRef.get(refs[0]), corpus.byRef.get(refs[refs.length - 1]));

export function generate(rules = RULES) {
  R = rules;
  try { return build(); } finally { R = RULES; for (const k of Object.keys(USED)) USED[k].clear(); }
}

function build() {
  const corpus = loadCorpus();
  const xref = loadXref();
  const titlesOf = titleMatcher();
  const eraOrder = new Map(R.ERAS.map((e) => [e.id, e.order]));
  const wholeBooks = new Map(R.WHOLE_BOOKS.map((w) => [w.book, w]));
  const presence = new Map(R.PRESENCE.map((p) => [p[0], p]));
  const entries = [];

  // --- New Testament passages (rules A and B) ---
  const ntBooks = corpus.index.slice(39).map((b) => b.name);
  const pieces = []; // { book, refs, rule, basis }
  for (const book of ntBooks) {
    if (wholeBooks.has(book) || book === 'Acts') {
      for (const sc of segmentBook(book, corpus)) {
        const refs = corpus.verses.slice(sc.s, sc.e + 1).map((v) => v.ref);
        if (wholeBooks.has(book)) {
          pieces.push({ book, refs, rule: 'A', basisRefs: [wholeBooks.get(book).basis] });
        } else {
          const hit = refs.find((r) => titlesOf(corpus.byRef.get(r)).length);
          if (hit) pieces.push({ book, refs, rule: 'B', basisRefs: [hit] });
        }
      }
      continue;
    }
    // Letters: a title verse, carried forward while the next verse still
    // speaks of Him by pronoun, joined to a neighbour within two verses.
    const vs = corpus.verses.filter((v) => v.book === book);
    const pron = new RegExp(R.CARRY_PRONOUNS, 'i');
    const spans = [];
    for (let k = 0; k < vs.length; k++) {
      if (!titlesOf(vs[k]).length) continue;
      let e = k;
      while (e + 1 < vs.length && vs[e + 1].c === vs[k].c && (titlesOf(vs[e + 1]).length || pron.test(vs[e + 1].t))) e++;
      spans.push([k, e]);
      k = e;
    }
    const joined = [];
    for (const sp of spans) {
      const prev = joined[joined.length - 1];
      if (prev && vs[prev[1]].c === vs[sp[0]].c && sp[0] - prev[1] - 1 <= 2) prev[1] = sp[1];
      else joined.push([...sp]);
    }
    for (const [a, z] of joined) {
      const refs = vs.slice(a, z + 1).map((v) => v.ref);
      const hit = refs.find((r) => titlesOf(corpus.byRef.get(r)).length);
      pieces.push({ book, refs, rule: 'B', basisRefs: [hit] });
    }
  }

  for (const p of pieces) {
    const first = corpus.byRef.get(p.refs[0]);
    const text = textOf(p.refs, corpus);
    const titles = uniq(p.refs.flatMap((r) => titlesOf(corpus.byRef.get(r))));
    // Key verse: scored by the written rule (KEY_VERSE): titles, then words
    // that say what He is, less a greeting line; ties go to the earlier verse.
    const K = R.KEY_VERSE;
    let key = p.refs[0]; let best = -Infinity;
    for (const r of p.refs) {
      const t = corpus.byRef.get(r).t;
      const score = titlesOf(corpus.byRef.get(r)).length * K.title
        + (t.match(re(K.says, 'g')) || []).length * K.saysWeight
        - (re(K.greeting).test(t) ? K.greetingPenalty : 0);
      if (score > best) { best = score; key = r; }
    }
    const isLetter = !!R.LETTERS[p.book];
    const isRev = p.book === 'Revelation';
    const era = isLetter || isRev ? 'church' : narrativeEra(first);
    if (!era) throw new Error(`no era for ${first.ref}`);

    let where; let how; let present; let presentDetail; let presentReason;
    const speakers = speakersIn(text);
    if (isLetter) {
      const L = R.LETTERS[p.book];
      const right = /right hand/.test(text);
      where = { text: `A letter to ${L.to}.${right ? ' The passage names Him at the right hand.' : ''} The passage does not say where it was written.`, places: [], basis: L.basis };
      how = { mode: 'letter', by: L.by, to: L.to, speakers: [], text: `A letter: ${L.by}, to ${L.to} (${L.basis}).` };
      present = 'no'; presentDetail = 'spoken of in a letter'; presentReason = 'A letter tells of Him; He is not in a scene.';
    } else if (isRev) {
      const places = placesIn(text).concat(/\bheaven\b/.test(text) ? ['heaven'] : []);
      where = { text: `Seen in vision in ${R.REVELATION_HOW.place} (${R.REVELATION_HOW.placeBasis})${places.length ? `; the vision names ${joinList(places)}` : ''}.`, places, basis: R.REVELATION_HOW.placeBasis };
      how = { mode: 'vision', by: R.REVELATION_HOW.by, to: 'John, for the seven churches', speakers, text: `A vision: ${R.REVELATION_HOW.by} (${R.REVELATION_HOW.basis}).${speakers.length ? ` Speaking in the passage: ${joinList(speakers)}.` : ''}` };
      const seen = /\bI am\b|I Jesus|\bLamb\b|Son of man|Faithful and True|KING OF KINGS|I come quickly|These things saith/.test(text);
      present = seen ? 'yes' : 'no';
      presentDetail = seen ? 'seen or heard in the vision' : 'the vision shows other things';
      presentReason = seen ? 'He speaks or is seen in the passage.' : 'No word of His and no sight of Him in this part of the vision.';
    } else {
      const places = placesIn(text);
      where = { text: places.length ? `Named in the passage: ${joinList(places)}.` : (era === 'before-time' ? 'Before time, in the beginning: "the Word was with God" (John 1:1).' : 'The passage does not name the place.'), places, basis: '' };
      how = { mode: 'narration', by: `the book of ${p.book}`, to: '', speakers, text: `Told in the book of ${p.book}.${speakers.length ? ` Speaking in the passage: ${joinList(speakers)}.` : ''}` };
      if (era === 'before-time') { present = 'pre-incarnate'; presentDetail = 'before time, with the Father'; presentReason = '"In the beginning was the Word, and the Word was with God" (John 1:1).'; } else if (p.book === 'Acts' && era === 'church') { present = 'no'; presentDetail = 'spoken of by His witnesses'; presentReason = 'After He was taken up, the witnesses speak of Him.'; } else { present = 'yes'; presentDetail = era === 'resurrection' ? 'risen, in the scene' : 'in the flesh, in the scene'; presentReason = 'The Gospel scene tells what He did and said there.'; }
    }
    const ov = presence.get(p.refs[0]);
    if (ov) { present = ov[1]; presentDetail = ov[2]; presentReason = ov[3]; USED.presence.add(p.refs[0]); }

    const what = titles.length
      ? `It calls Him ${joinList(titles)}.`
      : 'No title stands in these verses; the key verse shows what they tell of Him.';
    entries.push({
      id: slug(refRange(p.refs, corpus)),
      ref: refRange(p.refs, corpus),
      book: p.book, testament: 'NT', rules: [p.rule],
      verses: p.refs.length,
      basis: p.basisRefs.map((r) => verseObj(r, corpus)),
      titles, keyVerse: verseObj(key, corpus), what, where,
      when: { era, pointsTo: pointsTo(text, era), note: '' },
      how, present, presentDetail, presentReason, parallels: [],
    });
  }

  // --- Old Testament passages (rules C and D) ---
  const pairs = findQuotations(corpus, xref);
  const Q = R.QUOTE_METHOD;
  const fulfil = /fulfilled|this day is this scripture/;
  const ntEntryOf = new Map();
  for (const e of entries) for (const r of expandRef(e.ref, corpus.byRef, corpus.verses)) ntEntryOf.set(r, e);
  const quotePairs = [];
  for (const q of pairs) {
    const n = corpus.byRef.get(q.nt);
    const prev = corpus.verses[n.i - 1];
    const win = [prev && prev.c === n.c && prev.book === n.book ? prev : null, n].filter(Boolean);
    const titled = win.some((v) => titlesOf(v).length);
    const byRule = fulfil.test(win.map((v) => v.t).join(' ')) || titled;
    const key = `${q.nt}|${q.ot}`;
    const ov = R.APPLIES[key];
    if (ov) USED.applies.add(key);
    const applies = ov ? ov[0] === 'yes' : byRule;
    const reason = ov ? ov[1] : (byRule ? (titled ? 'A title of His stands in the quoting verse or the one before it.' : 'The New Testament says it was fulfilled.') : 'No fulfillment and no title of His in the quoting verses: the words are applied to another subject.');
    quotePairs.push({ nt: q.nt, ot: q.ot, shared: q.shared, votes: q.votes, formula: q.formula, applies, judged: !!ov, reason });
  }
  const otHits = new Map(); // ot ref -> { rules:Set, bases: [{ref, reason}], present, how, detail }
  const addHit = (ot, rule, basisRef, reason, extra = {}) => {
    if (!corpus.byRef.get(ot)) throw new Error(`unknown OT verse ${ot}`);
    if (!otHits.has(ot)) otHits.set(ot, { rules: new Set(), bases: [], extra: {} });
    const h = otHits.get(ot);
    h.rules.add(rule);
    if (!h.bases.some((b) => b.ref === basisRef)) h.bases.push({ ref: basisRef, reason });
    Object.assign(h.extra, extra);
  };
  for (const q of quotePairs) if (q.applies) addHit(q.ot, 'C', q.nt, q.reason);
  for (const [nt, ots, why] of R.QUOTE_SUPPLEMENT) for (const ot of ots) addHit(ot, 'C', nt, why);
  for (const t of R.OT_TITLE_VERSES) for (const ot of t.refs) addHit(ot, 'C', t.basis, t.reason, { title: t.title });
  for (const t of R.TYPE_TABLE) for (const ot of t.refs) addHit(ot, 'D', t.basis, t.reason, { typeHow: t.how, typePresent: t.present });

  const otSorted = [...otHits.keys()].map((r) => corpus.byRef.get(r)).sort((a, b) => a.i - b.i);
  const units = [];
  for (const v of otSorted) {
    const u = units[units.length - 1];
    if (u && u.book === v.book && u.c === v.c && v.v - u.lastV - 1 <= Q.OT_UNIT_GAP) { u.hits.push(v); u.lastV = v.v; } else units.push({ book: v.book, c: v.c, lastV: v.v, hits: [v] });
  }
  for (const u of units) {
    const a = u.hits[0]; const z = u.hits[u.hits.length - 1];
    const refs = corpus.verses.slice(a.i, z.i + 1).map((v) => v.ref);
    const hits = u.hits.map((v) => otHits.get(v.ref));
    const rules = uniq(hits.flatMap((h) => [...h.rules])).sort();
    const bases = [];
    for (const h of hits) for (const b of h.bases) if (!bases.some((x) => x.ref === b.ref)) bases.push(b);
    bases.sort((x, y) => corpus.byRef.get(x.ref).i - corpus.byRef.get(y.ref).i);
    const extra = Object.assign({}, ...hits.map((h) => h.extra));
    const B = R.OT_BOOKS[a.book];
    const era = otEra(a);
    const text = textOf(refs, corpus);
    // When it points: its own words, the applying verse and the verse after
    // it, and the era of the Gospel scene where the New Testament says it was
    // fulfilled (a letter's own era, the church, is where it was written, not
    // what it points to).
    const pts = new Set(pointsTo(text, era));
    for (const b of bases) {
      const n = corpus.byRef.get(b.ref);
      const next = corpus.verses[n.i + 1];
      const win = [n, next && next.book === n.book && next.c === n.c ? next : null].filter(Boolean).map((x) => x.t).join(' ');
      for (const x of pointsTo(win, era)) pts.add(x);
      const ne = ntEntryOf.get(b.ref);
      if (ne && ne.when.era !== 'church') pts.add(ne.when.era);
    }
    pts.delete(era);
    const pointsList = R.ERAS.map((e) => e.id).filter((id) => pts.has(id));
    // Who spoke it. A psalm is David's where the quoting New Testament verses name him.
    let by = B.by;
    let byBasis = B.basis;
    if (a.book === 'Psalms') {
      const named = bases.find((b) => {
        const n = corpus.byRef.get(b.ref);
        return [corpus.verses[n.i - 2], corpus.verses[n.i - 1], n].some((x) => x && x.book === n.book && x.c === n.c && /\bDavid\b/.test(x.t));
      });
      by = named ? 'David' : 'a psalmist the quoting verse does not name';
      byBasis = named ? named.ref : '';
    }
    const mode = extra.typeHow || B.how;
    const key = u.hits.find((v) => extra.title && R.OT_TITLE_VERSES.some((t) => t.refs.includes(v.ref))) || u.hits[0];
    const present = extra.typePresent || 'no';
    const ntList = bases.map((b) => b.ref);
    const what = rules.includes('D') && !rules.includes('C')
      ? `The New Testament says this pictured Him or held Him: ${joinList(ntList)}.`
      : `The New Testament applies these words to Him: ${joinList(ntList)}.`;
    entries.push({
      id: slug(refRange(refs, corpus)),
      ref: refRange(refs, corpus),
      book: a.book, testament: 'OT', rules,
      verses: refs.length,
      basis: bases.map((b) => ({ ...verseObj(b.ref, corpus), reason: b.reason })),
      titles: extra.title ? [extra.title] : [],
      keyVerse: verseObj(key.ref, corpus), what,
      where: { text: B.place ? `${a.book === 'Psalms' ? 'Sung' : 'Spoken'} in ${B.place}.` : `The Word does not say where it was ${a.book === 'Psalms' ? 'sung' : 'spoken'}.`, places: B.place ? [B.place] : [], basis: B.basis },
      when: { era, pointsTo: pointsList, note: B.note || '' },
      how: { mode, by, to: '', speakers: [], text: `${mode === 'type' ? 'A picture the New Testament names' : mode[0].toUpperCase() + mode.slice(1)}${by ? `: ${by}` : ''}${byBasis ? ` (${byBasis})` : ''}.` },
      present,
      presentDetail: present === 'pre-incarnate' ? 'there before He came in the flesh' : 'spoken of before He came in the flesh',
      presentReason: present === 'pre-incarnate' ? (bases.find((b) => R.TYPE_TABLE.some((t) => t.basis === b.ref && t.present === 'pre-incarnate')) || bases[0]).reason : 'Spoken or written before His birth.',
      parallels: [],
    });
  }

  // --- parallels among the Gospel scenes ---
  const gospels = new Set(['Matthew', 'Mark', 'Luke', 'John']);
  const stop = new Set(Q.STOPWORDS.split(' '));
  const grams = new Map();
  for (const e of entries) {
    if (!gospels.has(e.book)) continue;
    const w = textOf(expandRef(e.ref, corpus.byRef, corpus.verses), corpus).toLowerCase().replace(/[’']/g, '').replace(/[^a-z ]+/g, ' ').split(/\s+/).filter(Boolean);
    const g = new Set();
    for (let k = 0; k + 5 <= w.length; k++) { const s = w.slice(k, k + 5); if (s.filter((x) => !stop.has(x)).length >= 2) g.add(s.join(' ')); }
    grams.set(e.id, g);
  }
  const gEntries = entries.filter((e) => gospels.has(e.book));
  for (const e of gEntries) {
    const mine = grams.get(e.id);
    for (const o of gEntries) {
      if (o.book === e.book) continue;
      let s = 0;
      const theirs = grams.get(o.id);
      for (const x of theirs) if (mine.has(x)) s++;
      if (s >= R.PARALLEL_MIN_SHARED && s / Math.max(1, Math.min(mine.size, theirs.size)) >= R.PARALLEL_MIN_SHARE) e.parallels.push(o.ref);
    }
  }

  // --- order on the line: era, then the book's order, then the verse ---
  const pos = (e) => corpus.byRef.get(expandRef(e.ref, corpus.byRef, corpus.verses)[0]).i;
  entries.sort((x, y) => eraOrder.get(x.when.era) - eraOrder.get(y.when.era) || pos(x) - pos(y));
  entries.forEach((e, k) => { e.seq = k + 1; });

  const edge = R.EDGE_TABLE.map((x) => ({
    ref: refRange(x.refs, corpus),
    verses: x.refs.map((r) => verseObj(r, corpus)),
    tie: x.tie.map((r) => verseObj(r, corpus)),
    reason: x.reason,
    era: otEra(corpus.byRef.get(x.refs[0])),
  }));

  assertAllUsed();
  return {
    rule: 'DR-0675',
    source: 'app/public/bible/kjv (KJV); cross-references app/public/bible/xref (openbible.info, Treasury of Scripture Knowledge)',
    eras: R.ERAS.map((e) => ({ ...e, markerText: verseObj(e.marker, corpus).text })),
    wholeBooks: R.WHOLE_BOOKS.map((w) => ({ ...w, basisText: verseObj(w.basis, corpus).text })),
    exclusions: R.NAME_EXCLUSIONS.map((x) => ({ ...x, text: verseObj(x.ref, corpus).text })),
    entries,
    edge,
    quotePairs,
  };
}

function assertAllUsed() {
  const stale = [
    ...R.SCENE_JOINS.map((x) => x[0]).filter((r) => !USED.joins.has(r)).map((r) => `SCENE_JOINS ${r}`),
    ...R.PRESENCE.map((x) => x[0]).filter((r) => !USED.presence.has(r)).map((r) => `PRESENCE ${r}`),
    ...Object.keys(R.APPLIES).filter((k) => !USED.applies.has(k)).map((k) => `APPLIES ${k}`),
    ...R.LORD_VERSES.map((x) => x[0]).filter((r) => !USED.lord.has(r)).map((r) => `LORD_VERSES ${r}`),
  ];
  for (const k of Object.keys(USED)) USED[k].clear();
  if (stale.length) throw new Error(`written rows that match nothing (stale judgments):\n${stale.join('\n')}`);
}

// One record per line: compact enough to ship, and a change to one passage is
// a one-line diff a reviewer can read.
export function serialize(data) {
  const parts = Object.entries(data).map(([k, v]) => {
    const body = Array.isArray(v) ? `[\n${v.map((x) => JSON.stringify(x)).join(',\n')}\n]` : JSON.stringify(v);
    return `${JSON.stringify(k)}: ${body}`;
  });
  return `{\n${parts.join(',\n')}\n}\n`;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = serialize(generate());
  if (process.argv.includes('--check')) {
    const cur = readFileSync(DATA_PATH, 'utf8');
    if (cur !== out) { console.error('who-he-is-data.json is not what the rule makes. Run: node scripts/who-he-is-generate.mjs'); process.exit(1); }
    console.log('who-he-is-data.json matches the rule.');
  } else {
    writeFileSync(DATA_PATH, out);
    const d = JSON.parse(out);
    console.log(`wrote ${d.entries.length} entries, ${d.edge.length} at the edge, ${d.quotePairs.length} quotation pairs`);
  }
}
