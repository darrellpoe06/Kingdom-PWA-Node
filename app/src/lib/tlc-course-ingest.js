// =============================================================================
// tlc-course-ingest — YouTube teacher → ATTRIBUTED, copyright-safe DRAFT course
// =============================================================================
// Declared by Darrell 2026-06-29 (deliverable #6): Darrell has teachers in his
// YouTube history whose teaching he likes and wants used as SOURCE for the training
// library. He PROVIDES the links/channels (SME-pending — the agent can't access his
// YouTube account/history). When provided, the link runs through the existing
// YouTube auto-caption harvest pipeline (no GPU needed), and the captions are
// DISTILLED into ORIGINAL course material, ATTRIBUTED to the source teacher/channel.
//
// COPYRIGHT-SAFE BY DESIGN (binding): we TRANSFORM and SYNTHESIZE — we do NOT
// reproduce transcripts verbatim. The deterministic core here:
//   * extracts the SHAPE of the teaching (its key topics) as SHORT seed phrases —
//     never long verbatim runs — to scaffold a draft a human/LLM then writes in
//     original words,
//   * carries at most ONE short, clearly-ATTRIBUTED quote (word-capped),
//   * and ships a `verifyCopyrightSafe` GATE that REJECTS any draft whose body
//     reproduces a long verbatim run from the transcript (proven-to-catch, DR-0076).
// The original prose is written downstream (the NAS local LLM distill step, or
// Christina), and — like every course — the draft is `validated:false` and goes
// through Christina's AGREE / DISAGREE gate (lib/tlc-course-approval.js) before any
// learner sees it.
//
// PURE: no Date.now() / Math.random(); callers pass `now`. Dependency-light (only the
// library's makeCourse shape). Safe in Node (the CLI script) + browser + tests.
// =============================================================================
import { makeCourse, TRAINING_FIELDS, fieldSlug } from './tlc-training-library.js';

// The longest run of consecutive transcript words allowed to appear verbatim in a
// draft body before it's flagged as a copyright violation. Short phrases (titles,
// common idioms) are unprotectable and pass; a long lifted passage does not.
export const MAX_VERBATIM_WORDS = 14;

// The hard cap on the single attributed quote a draft may carry. Kept BELOW
// MAX_VERBATIM_WORDS on purpose: the one short, attributed excerpt must itself be
// short enough to clear the copyright gate — a brief quote, never a lifted passage.
export const MAX_QUOTE_WORDS = 12;

const STOPWORDS = new Set((
  'a an and are as at be but by for from had has have he her his i in is it its of on or our she that the their them they this to was we were what when which who will with you your would could should about into over your yeah okay gonna going really just like so do does did not no yes if then there here out up down can cap also more most than them these those'
).split(/\s+/));

function words(text) {
  return String(text || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function sentences(text) {
  return String(text || '').replace(/\s+/g, ' ').match(/[^.!?]+[.!?]*/g) || [];
}

// Score each sentence by the summed frequency of its content (non-stopword) words,
// normalized lightly by length so we don't just pick the longest sentence. Returns
// the top `count` distinct sentences in their ORIGINAL document order.
function topSentences(text, count) {
  const sents = sentences(text).map((s) => s.trim()).filter((s) => words(s).length >= 5);
  if (!sents.length) return [];
  const freq = new Map();
  for (const s of sents) for (const w of words(s)) if (!STOPWORDS.has(w)) freq.set(w, (freq.get(w) || 0) + 1);
  const scored = sents.map((s, i) => {
    const ws = words(s).filter((w) => !STOPWORDS.has(w));
    const raw = ws.reduce((t, w) => t + (freq.get(w) || 0), 0);
    return { i, s, score: ws.length ? raw / Math.sqrt(ws.length) : 0 };
  });
  const seenKeys = new Set();
  const picked = [...scored].sort((a, b) => b.score - a.score).filter((x) => {
    const key = words(x.s).slice(0, 6).join(' ');
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  }).slice(0, count);
  return picked.sort((a, b) => a.i - b.i).map((x) => x.s);
}

// Turn a sentence into a SHORT seed phrase (a topic cue, not the sentence). Caps at
// `maxWords` words so no long verbatim run survives. Strips a leading filler word.
function seedPhrase(sentence, maxWords = 10) {
  const raw = String(sentence || '').trim().replace(/^[a-z]+\s+(?=[a-z])/i, (m) => (STOPWORDS.has(m.trim().toLowerCase()) ? '' : m));
  const ws = raw.split(/\s+/).filter(Boolean).slice(0, maxWords);
  let phrase = ws.join(' ').replace(/[.,;:!?]+$/, '');
  if (phrase) phrase = phrase.charAt(0).toUpperCase() + phrase.slice(1);
  return phrase;
}

// The attribution line every distilled course carries.
export function attributionLine(source) {
  const s = source || {};
  const who = s.teacher || s.channel || 'the source teacher';
  const via = s.channel && s.teacher ? ` (${s.channel})` : '';
  const url = s.url ? ` — ${s.url}` : '';
  return `Source teaching by ${who}${via}${url}. Distilled into original material; reviewed and approved by Christina (LCSW) before use.`;
}

// ---------------------------------------------------------------------------
// distillTranscript — extract a copyright-safe DRAFT outline from a transcript.
// Returns { keyPoints:[short phrases], modules:[draft module objects], quote }.
// Each draft module body is a synthesis INSTRUCTION + short seed cues — NOT verbatim
// transcript — so a human/LLM writes the original prose. Pure + deterministic.
// ---------------------------------------------------------------------------
export function distillTranscript(transcript, { idPrefix = 'tl-yt', pointsPerModule = 4, maxPoints = 12 } = {}) {
  const text = typeof transcript === 'string' ? transcript : (transcript && transcript.text) || '';
  const tops = topSentences(text, maxPoints);
  const keyPoints = tops.map((s) => seedPhrase(s, 10)).filter(Boolean);

  // One short, attributed quote candidate: the shortest high-signal sentence, capped.
  const quoteSrc = tops.slice().sort((a, b) => words(a).length - words(b).length).find((s) => words(s).length <= MAX_QUOTE_WORDS);
  const quote = quoteSrc ? quoteSrc.trim().split(/\s+/).slice(0, MAX_QUOTE_WORDS).join(' ') : '';

  const modules = [];
  for (let i = 0; i < keyPoints.length; i += pointsPerModule) {
    const chunk = keyPoints.slice(i, i + pointsPerModule);
    if (!chunk.length) break;
    const n = modules.length + 1;
    modules.push({
      id: `${idPrefix}-m${n}`,
      title: `Teaching points — part ${n}`,
      bigIdea: 'A draft module distilled from the source teaching — to be written in original words and reviewed before use.',
      draft: true,
      // The body is a WRITING BRIEF, not the transcript: short topic cues to develop
      // into original explanation. No long verbatim run lives here (each cue ≤ 10 words).
      levels: {
        standard: `Develop these teaching points into original explanation (do not copy the source wording):\n${chunk.map((p) => `• ${p}`).join('\n')}`,
      },
      // No fabricated quiz — the check-for-understanding is authored on SME review.
      quiz: { questions: [] },
    });
  }

  return { keyPoints, modules, quote };
}

// ---------------------------------------------------------------------------
// draftCourseFromSource — the drop-in: a YouTube link (+ its captions, when the
// pipeline has fetched them) becomes a DRAFT course in the library shape, attributed,
// copyright-safe, validated:false, awaiting Christina's gate.
//
//   { url, channel, teacher, field, title, transcript, trainingHours, now }
//
// With a transcript → a distilled draft with module outlines + an attributed quote.
// Without one → an honest SKELETON flagged `needsTranscript:true` (the SME-pending
// state until Darrell supplies the link and the caption pipeline runs).
// ---------------------------------------------------------------------------
export function draftCourseFromSource({
  url = '', channel = '', teacher = '', field = TRAINING_FIELDS[0],
  title = '', transcript = '', trainingHours = 0, now = null,
} = {}) {
  const safeField = TRAINING_FIELDS.includes(field) ? field : TRAINING_FIELDS[0];
  const source = { teacher: teacher || null, channel: channel || null, url: url || null, distilledAt: now };
  const baseTitle = title || (teacher ? `${teacher} — ${safeField}` : `${safeField} (source-distilled)`);
  const idBase = `tl-yt-${fieldSlug(safeField)}-${fieldSlug(teacher || channel || 'source')}`;

  const text = typeof transcript === 'string' ? transcript : (transcript && transcript.text) || '';
  if (!text || text.trim().length < 40) {
    // Honest skeleton — no captions yet. SME-pending on Darrell's link + the run.
    return makeCourse({
      id: idBase,
      field: safeField,
      title: baseTitle,
      summary: `Draft awaiting source captions. ${attributionLine(source)}`,
      origin: 'youtube-distilled',
      source,
      validated: false,
      trainingHours: Math.max(0, Number(trainingHours) || 0),
      smeConfirm: 'Awaiting the YouTube auto-caption fetch; once captions are present the draft outline + assessment are generated, then Christina reviews.',
      modules: [],
      preTest: null,
      postTest: null,
    });
  }

  const distilled = distillTranscript(text, { idPrefix: idBase });
  const quoteLine = distilled.quote
    ? ` One short attributed excerpt: “${distilled.quote}…” — ${teacher || channel || 'source'}.`
    : '';

  return makeCourse({
    id: idBase,
    field: safeField,
    title: baseTitle,
    summary: `${attributionLine(source)}${quoteLine}`,
    origin: 'youtube-distilled',
    source,
    validated: false,
    // Hours hint, or a modest estimate from the draft size — flagged for SME.
    trainingHours: Math.max(0, Number(trainingHours) || Math.min(4, Math.max(1, distilled.modules.length))),
    smeConfirm: 'Draft outline distilled from source captions — to be written in original words; tests and final hours authored on Christina’s review.',
    modules: distilled.modules,
    preTest: null,
    postTest: null,
  });
}

// ---------------------------------------------------------------------------
// verifyCopyrightSafe — THE GATE (proven-to-catch). Scans every authored body string
// in a course for any run of > MAX_VERBATIM_WORDS consecutive words that also appears,
// in order, in the transcript. Returns { safe, violations:[{ moduleId, run }], checked }.
// A draft produced by distillTranscript passes (its bodies are briefs + short cues);
// a body that lifted a long passage verbatim FAILS — the test proves it catches that.
// ---------------------------------------------------------------------------
export function verifyCopyrightSafe(course, transcript, { maxVerbatimWords = MAX_VERBATIM_WORDS } = {}) {
  const text = typeof transcript === 'string' ? transcript : (transcript && transcript.text) || '';
  const srcWords = words(text);
  const n = maxVerbatimWords + 1; // a run LONGER than the allowed max
  const srcGrams = new Set();
  for (let i = 0; i + n <= srcWords.length; i += 1) srcGrams.add(srcWords.slice(i, i + n).join(' '));

  const bodies = [];
  const push = (moduleId, s) => { if (s && typeof s === 'string') bodies.push({ moduleId, s }); };
  push(course && course.id, course && course.summary);
  for (const m of (course && course.modules) || []) {
    push(m.id, m.title);
    push(m.id, m.bigIdea);
    if (m.levels) for (const v of Object.values(m.levels)) push(m.id, v);
  }

  const violations = [];
  for (const { moduleId, s } of bodies) {
    const bw = words(s);
    for (let i = 0; i + n <= bw.length; i += 1) {
      const gram = bw.slice(i, i + n).join(' ');
      if (srcGrams.has(gram)) { violations.push({ moduleId, run: gram }); break; }
    }
  }
  return { safe: violations.length === 0, violations, checked: bodies.length, maxVerbatimWords };
}
