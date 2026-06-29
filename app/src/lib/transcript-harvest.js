// =============================================================================
// transcript-harvest — mine the transcript-derived harvests from a service
// transcript (lessons / discernment / testimony / trivia).
// =============================================================================
// THE UNBLOCK (Darrell 2026-06-29): the harvest % was stuck ~22% because the
// transcript-derived harvests were gated on a Whisper-on-NAS (GPU) run that never
// happens. But YouTube AUTO-GENERATES captions for every service video — that IS
// the transcript. Source it from YouTube (infra/nas-sme-pipeline/youtube-captions.py
// → video_transcripts) and feed it here, and these harvests run NOW, no GPU.
//
// PURE + dependency-free: no imports -> safe in Node (the loader script), the
// browser (deriveSignals), and tests. Mirrors video-harvest.js's discipline.
//
// HONESTY (DR-0076 verification doctrine): every harvest this returns is backed
// by REAL text that literally appears in the transcript — the extracted questions
// are BG's own questions, the lesson beats are his own enumerations, the topics
// are words he actually said. Heuristic extraction lights a harvest 'partial'
// (started, evidence-backed); a later LLM pass over the SAME transcript can deepen
// 'partial' -> 'complete'. Nothing is painted; an absent signal stays a gap.
// =============================================================================

// --- Sentence / clause splitting ---------------------------------------------
// Auto-captions arrive as one long run with sparse punctuation and lots of ">>"
// speaker carets. Normalize first, then split on sentence terminators so each
// extracted snippet is a real, readable fragment of what was said.
function normalize(text) {
  return String(text || '')
    .replace(/>>/g, ' ')          // caption speaker carets
    .replace(/\[[^\]]*\]/g, ' ')  // [Music] / [Applause] tags
    .replace(/\s+/g, ' ')
    .trim();
}

function splitSentences(text) {
  const norm = normalize(text);
  if (!norm) return [];
  // Keep the terminator so a question keeps its '?'.
  return norm.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter(Boolean);
}

// Collapse to a stable de-dup key (lowercased, punctuation-stripped, whitespace
// collapsed) so near-identical caption repeats don't double-count.
function dedupeKey(s) {
  return s.toLowerCase().replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, ' ').trim();
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const k = dedupeKey(it);
    if (k.length < 8 || seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

// =============================================================================
// Trivia — BG's own questions (the type description names this exactly:
// "Engagement questions drawn from the message — BG's own end-of-message
// questions"). We pull real questions out of the transcript and drop the
// call-and-response filler ("Can I get an amen?", a bare "right?").
// =============================================================================

// Filler / call-and-response that isn't a teaching question.
const TRIVIA_FILLER = /\b(amen|hallelujah|hallelu|glory|can i get|y'?all|come on|you hear me|you with me|are you with me|somebody|preach)\b/i;

export function extractTrivia(text, limit = 12) {
  const out = [];
  for (const s of splitSentences(text)) {
    if (!s.endsWith('?')) continue;
    const words = s.split(/\s+/);
    if (words.length < 4 || s.length < 18 || s.length > 180) continue;
    if (TRIVIA_FILLER.test(s)) continue;
    // Must read like a real question (starts with a capital, contains a vowel-y
    // word). Skip fragments that are just "?" noise.
    if (!/[A-Za-z]{3,}/.test(s)) continue;
    out.push(s);
  }
  return dedupe(out).slice(0, limit);
}

// =============================================================================
// Lessons — teaching beats. The message turned into paced Learn material starts
// from the structure BG himself lays down: his enumerations ("first... second"),
// his "I want you to understand", his "watch this". Each captured beat is a real
// sentence — a seed for a Learn course point, never an invented one.
// =============================================================================

const LESSON_MARKERS = [
  /\bnumber (?:one|two|three|four|five|1|2|3|4|5)\b/i,
  /\b(?:first|second|third|fourth|fifth)ly\b/i,
  /\bthe (?:first|second|third|next|last|main) (?:thing|point|key|reason|step)\b/i,
  /\bI want (?:you|us) to (?:know|understand|see|get|hear|remember)\b/i,
  /\bwatch this\b/i,
  /\bhere'?s the (?:point|key|lesson|thing|deal)\b/i,
  /\bthe (?:point|lesson|principle|truth) (?:is|here is|that)\b/i,
  /\bdon'?t (?:miss|forget) this\b/i,
  /\bthe Bible (?:says|tells us|teaches)\b/i,
  /\bwhat (?:God|the Lord) (?:is|was) (?:saying|telling)\b/i,
];

export function extractLessons(text, limit = 12) {
  const out = [];
  for (const s of splitSentences(text)) {
    if (s.length < 24 || s.length > 240) continue;
    if (LESSON_MARKERS.some((re) => re.test(s))) out.push(s);
  }
  return dedupe(out).slice(0, limit);
}

// =============================================================================
// Testimony & stories — quotable testimonies / Sermon Stories. First-person
// narrative markers. Conservative on purpose: when the message has no personal
// story, this stays empty (an honest gap), it is never invented.
// =============================================================================

const TESTIMONY_MARKERS = [
  /\bI remember\b/i,
  /\bwhen I was\b/i,
  /\bgrowing up\b/i,
  /\byears ago\b/i,
  /\bI'?ll never forget\b/i,
  /\blet me tell you (?:about|a story|something)\b/i,
  /\bmy (?:mother|father|grandmother|grandfather|grandma|grandpa|mama|daddy|wife|husband|son|daughter)\b/i,
  /\bthe Lord (?:brought|delivered|healed|blessed|saved|kept) me\b/i,
  /\bGod (?:brought|delivered|healed|blessed|saved|kept) me\b/i,
  /\bmy testimony\b/i,
  /\bpraise report\b/i,
];

export function extractTestimony(text, limit = 10) {
  const out = [];
  for (const s of splitSentences(text)) {
    if (s.length < 24 || s.length > 260) continue;
    if (TESTIMONY_MARKERS.some((re) => re.test(s))) out.push(s);
  }
  return dedupe(out).slice(0, limit);
}

// =============================================================================
// Discernment — world-issue / cultural context the teaching engages, fed to the
// discernment track. Registry of the themes this congregation's teaching speaks
// to; we report the topics the message ACTUALLY engages (the words are really in
// the transcript), with a hit count, above a small threshold so a single passing
// mention doesn't light a whole topic.
// =============================================================================

export const WORLD_ISSUE_TOPICS = [
  { key: 'family',        label: 'Family & fatherhood',     re: /\b(father|fathers|fatherhood|dad|daddy|family|families|household|mother|parent|parents)\b/i },
  { key: 'marriage',      label: 'Marriage',                re: /\b(marriage|marriages|married|husband|wife|spouse|covenant)\b/i },
  { key: 'children',      label: 'Children & the next generation', re: /\b(children|child|kids|youth|young people|generation|generations|raise|raising)\b/i },
  { key: 'race',          label: 'Race & justice',          re: /\b(racism|racial|injustice|justice|oppression|equality|prejudice|slavery|african[- ]american|black (?:people|community|men|women))\b/i },
  { key: 'money',         label: 'Money & provision',       re: /\b(money|finances|financial|debt|poverty|poor|wealth|provision|bills|paycheck|economy)\b/i },
  { key: 'fear_anxiety',  label: 'Fear & anxiety',          re: /\b(fear|fearful|afraid|anxiety|anxious|worry|worried|stress|depression|depressed)\b/i },
  { key: 'addiction',     label: 'Addiction & bondage',     re: /\b(addiction|addict|drugs|alcohol|bondage|stronghold|habit)\b/i },
  { key: 'culture',       label: 'Culture & the world',     re: /\b(culture|cultural|society|the world|worldly|media|social media|politics|political|nation|government)\b/i },
  { key: 'identity',      label: 'Identity & purpose',      re: /\b(identity|purpose|destiny|calling|self[- ]worth|who you are|made you)\b/i },
  { key: 'health',        label: 'Health & healing',        re: /\b(health|healing|sick|sickness|disease|cancer|hospital|mental health|body)\b/i },
  { key: 'relationships', label: 'Relationships & forgiveness', re: /\b(forgive|forgiveness|relationship|relationships|reconcile|bitterness|unforgiveness|offense)\b/i },
];

// Count topic hits across the whole transcript. A topic must clear `threshold`
// hits to count as "engaged" (a real theme, not a passing word).
export function extractDiscernment(text, threshold = 3, limit = 8) {
  const norm = normalize(text);
  if (!norm) return [];
  const out = [];
  for (const topic of WORLD_ISSUE_TOPICS) {
    const re = new RegExp(topic.re.source, 'gi');
    const matches = norm.match(re);
    const count = matches ? matches.length : 0;
    if (count >= threshold) out.push({ key: topic.key, label: topic.label, count });
  }
  // Strongest themes first.
  out.sort((a, b) => b.count - a.count);
  return out.slice(0, limit);
}

// =============================================================================
// harvestFromTranscript — the one call deriveSignals + the loader script use.
// Runs every transcript-derived extractor and returns a SPARSE signal map: only
// the harvests with real evidence are present, each `evidenced: true`. The
// foundation `transcript` is 'complete' (the transcript IS here); the four mined
// harvests are 'partial' (heuristic-extracted, deepenable). scripture/songs are
// handled by deriveSignals (it owns the row fields), not here.
// =============================================================================
export function harvestFromTranscript(text) {
  const norm = normalize(text);
  const sig = {};
  if (!norm || norm.length < 40) return sig; // nothing usable

  // The transcript itself, present and real.
  sig.transcript = { status: 'complete', count: 1, evidenced: true };

  const lessons = extractLessons(text);
  if (lessons.length) sig.lessons = { status: 'partial', count: lessons.length, refs: lessons, evidenced: true };

  const discern = extractDiscernment(text);
  if (discern.length) {
    sig.discernment = {
      status: 'partial',
      count: discern.length,
      refs: discern.map((d) => `${d.label} (${d.count})`),
      evidenced: true,
    };
  }

  const testimony = extractTestimony(text);
  if (testimony.length) sig.testimony = { status: 'partial', count: testimony.length, refs: testimony, evidenced: true };

  const trivia = extractTrivia(text);
  if (trivia.length) sig.trivia = { status: 'partial', count: trivia.length, refs: trivia, evidenced: true };

  return sig;
}
