#!/usr/bin/env node
// =============================================================================
// build-scripture-voices — Yahweh's voices in red, across the whole Bible.
// =============================================================================
// Darrell 2026-10-18, on Psalms 110 in the reader: "We need the voices of Yahweh
// in red to be accurate based on what we believe is all Yahweh's Voices." The
// red-letter set had ~40 hand-verified quotes, so almost every chapter read
// "no voices verified in this chapter yet". This script writes one lazy asset
// per book, app/public/bible/voices/<File>.json, carrying every place Scripture
// itself says the Godhead spoke:
//
//   jesus   the Son's words. Source: the public-domain eBible.org KJV (OSIS,
//           <q who="Jesus">, the red-letter markup), aligned word by word onto
//           OUR shipped KJV so every quote is our text verbatim.
//   father  Yahweh's words, wherever the verse names Him as the speaker:
//           "the LORD said unto…", "God spake…, saying,", "Thus saith the LORD",
//           "…, saith the LORD", "the word of the LORD came… saying,", "a voice
//           from heaven, saying, This is my beloved Son", "I am the LORD".
//   spirit  the Holy Spirit's words: "the Holy Ghost said", "the Spirit said
//           unto…", "saith the Holy Ghost", "saith the Spirit".
//
// HONEST BY CONSTRUCTION (DR-0076). Nothing is attributed by guess: every span
// starts at a speech the TEXT ITSELF gives to the Godhead, and is carried into
// following verses only while the discourse plainly continues (it stops at
// narration, at another speaker, and in the prophets and Psalms wherever the
// verse speaks of the LORD in the third person). Words a human speaks are never
// colored red, even when they quote Him, unless that human is a prophet or an
// apostle carrying His word. Where it is unclear, the words stay plain. The
// hand-verified VOICE_QUOTES in scripture-voices.js always win for their verse.
//
// Run:  node scripts/build-scripture-voices.mjs [path/to/eng-kjv.osis.xml]
// The source is fetched from SOURCE_URL when no path is given, and its sha256
// must equal SOURCE_SHA256 or nothing is written.
// =============================================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KJV_DIR = join(ROOT, 'app/public/bible/kjv');
const OUT_DIR = join(ROOT, 'app/public/bible/voices');
const INDEX = JSON.parse(readFileSync(join(ROOT, 'app/src/lib/bible-kjv-index.json'), 'utf8'));

export const SOURCE_URL = 'https://raw.githubusercontent.com/seven1m/open-bibles/master/eng-kjv.osis.xml';
// The eBible.org KJV (public domain) as published by open-bibles, read 2026-10-18.
export const SOURCE_SHA256 = 'eeeae647fc28360ce47f9c0d5cc3b397b7fdd9913fe53dc9f44eb6deee50e253';

// The 66 canonical books in index order, by their OSIS ids.
export const OSIS_IDS = ['Gen', 'Exod', 'Lev', 'Num', 'Deut', 'Josh', 'Judg', 'Ruth', '1Sam', '2Sam', '1Kgs', '2Kgs',
  '1Chr', '2Chr', 'Ezra', 'Neh', 'Esth', 'Job', 'Ps', 'Prov', 'Eccl', 'Song', 'Isa', 'Jer', 'Lam', 'Ezek', 'Dan',
  'Hos', 'Joel', 'Amos', 'Obad', 'Jonah', 'Mic', 'Nah', 'Hab', 'Zeph', 'Hag', 'Zech', 'Mal', 'Matt', 'Mark', 'Luke',
  'John', 'Acts', 'Rom', '1Cor', '2Cor', 'Gal', 'Eph', 'Phil', 'Col', '1Thess', '2Thess', '1Tim', '2Tim', 'Titus',
  'Phlm', 'Heb', 'Jas', '1Pet', '2Pet', '1John', '2John', '3John', 'Jude', 'Rev'];

// ---------------------------------------------------------------------------
// 1. The Son's words: parse the OSIS red-letter markup into per-verse word masks.
// ---------------------------------------------------------------------------
export function parseOsisRedLetter(xml) {
  const body = xml.replace(/<note\b[\s\S]*?<\/note>/g, '');
  const out = new Map(); // osisID -> [{ text, jesus }]
  const tok = /<[^>]+>|[^<]+/g;
  let cur = null; let inq = false; let buf = [];
  const flush = () => { if (cur) out.set(cur, buf); buf = []; };
  for (const m of body.matchAll(tok)) {
    const t = m[0];
    if (t[0] === '<') {
      if (t.startsWith('<verse') && t.includes('sID=')) { flush(); cur = /osisID="([^"]+)"/.exec(t)[1]; }
      else if (t.startsWith('<verse') && t.includes('eID=')) { flush(); cur = null; }
      else if (t.startsWith('<q') && t.includes('who="Jesus"') && t.includes('sID=')) inq = true;
      else if (t.startsWith('<q') && t.includes('eID=')) inq = false;
    } else if (cur) buf.push({ text: t, jesus: inq });
  }
  flush();
  // -> osisID -> [{ word, jesus }]
  const words = new Map();
  for (const [id, parts] of out) {
    const w = [];
    for (const p of parts) for (const x of p.text.split(/\s+/)) if (x) w.push({ word: x, jesus: p.jesus });
    words.set(id, w);
  }
  return words;
}

const norm = (w) => w.toLowerCase().replace(/[^a-z]/g, '');

// Our verse as tokens with character offsets.
export function tokens(text) {
  const out = [];
  for (const m of String(text).matchAll(/\S+/g)) out.push({ word: m[0], start: m.index, end: m.index + m[0].length });
  return out;
}

// Longest-common-subsequence alignment of two normalized word lists; returns
// pairs [i, j] of matched indexes. Verses are short, so O(n*m) is fine.
export function align(a, b) {
  const n = a.length; const m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs = []; let i = 0; let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { pairs.push([i, j]); i += 1; j += 1; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i += 1;
    else j += 1;
  }
  return pairs;
}

// Carry the source's Jesus mask onto our verse; return [start, end] runs in OUR text.
export function jesusRuns(ourText, srcWords) {
  if (!srcWords || !srcWords.some((w) => w.jesus)) return [];
  const ours = tokens(ourText);
  const pairs = align(srcWords.map((w) => norm(w.word)), ours.map((t) => norm(t.word)));
  const mask = new Array(ours.length).fill(false);
  for (const [i, j] of pairs) mask[j] = srcWords[i].jesus;
  // an unmatched word of ours between two Jesus words is inside the quote too
  for (let j = 1; j < ours.length - 1; j += 1) {
    if (!mask[j] && !pairs.some(([, jj]) => jj === j)) {
      const prev = mask.slice(0, j).lastIndexOf(true); const next = mask.indexOf(true, j + 1);
      if (prev >= 0 && next > j && prev === j - 1) mask[j] = true;
    }
  }
  const runs = []; let s = -1;
  for (let j = 0; j <= ours.length; j += 1) {
    if (j < ours.length && mask[j]) { if (s < 0) s = j; }
    else if (s >= 0) { runs.push([ours[s].start, ours[j - 1].end]); s = -1; }
  }
  return runs;
}

// ---------------------------------------------------------------------------
// 2. The Father's and the Spirit's words: the speech the verse gives to Him.
// ---------------------------------------------------------------------------
const OT_GOD = String.raw`(?:[Tt]he LORD God|[Tt]he LORD of hosts|[Tt]he Lord GOD|[Tt]he Lord God|[Tt]he LORD|[Tt]he Lord|God Almighty|God)`;
const NT_GOD = String.raw`(?:God)`;
const SPIRIT = String.raw`(?:[Tt]he Holy Ghost|[Tt]he Spirit of the LORD|[Tt]he Spirit of God|[Tt]he Spirit)`;
const SPEECH_VERB = /\b(said|spake|saith|sware|sworn|spoken|answered|called|commanded|cried|talked|saying|say)\b/;
const NARRATION_VERBS = 'said|spake|went|came|did|took|rose|arose|returned|made|sent|brought|told|cried|answered|called|wrote|built|gathered|turned|saw|heard|lifted|fell|bowed|stood|sat|departed|hid|was|were|had|gave|set|smote|slew|died|dwelt|journeyed|offered|worshipped|prayed|knew|begat|reigned|fled|passed|looked|got|ran|wept|kissed|blessed|cursed|feared|believed|removed|pitched|encamped|charged|commanded|spread|put|laid|brought|carried|delivered|besought|entreated|confessed|rent|sought|found|left|led';
// a verse that opens on narration (someone did something, in the past tense)
const SUBJECT = String.raw`(?:[A-Z][a-z]+(?:(?:\s|,\s|\sand\s)[A-Z][a-z]+)*|[Tt]he (?:LORD God|LORD|Lord|[a-z]+(?: of [A-Za-z]+)*)|all the [a-z]+|he|she|they)`;
const PAST = String.raw`(?:${NARRATION_VERBS}|[a-z]{2,}ed)`;
const NARRATION_OPENER = new RegExp(String.raw`^(?:(?:And|Then|So|Now|But|Moreover|After|When|And when|And after|Thus|Therefore|Wherefore|Also|And also)\s+)?(?:it came to pass|there (?:was|were|came|went)|${SUBJECT}\s+(?:also\s+|again\s+)?${PAST}\b)`);
const ANGEL_SPEAKS = /\b(?:the|an) angel(?: of (?:the LORD|God))?\b[^.]*?\b(?:said|called|answered|spake|talked)\b/;
const HE_SAID = /^(?:(And|Moreover|Also|Again|Then|And again)\s+)?he\s+(?:said|answered|spake|called)\b/;
const OTHER_SAID = /^(?:(?:And|Then|So|But|Now)\s+)?(?:she|they|the woman|the people|all the people)\s+(?:said|answered|spake)\b/;
// the formula words themselves are not His speech
// "(For) thus saith the LORD, thy Redeemer, the Holy One of Israel;" — the leading
// "thus", the formula and the titles that follow it are the prophet's frame, not His words.
const SAITH_FORMULA = /(?:(?:^|\b)(?:(?:For|And|But|Therefore|Wherefore|Now therefore|for|and|but|therefore|wherefore)\s+)?(?:thus|Thus)\s+)?,?\s*\bsaith (?:the (?:LORD(?: of hosts| God| thy God| your God)?|Lord GOD(?: of hosts)?|Lord(?: GOD| Almighty)?|Holy Ghost|Spirit|Almighty|Holy One(?: of Israel)?|King of [A-Z][a-z]+)|(?:your|thy|my) God)(?:\s+(?:thy|your) (?:Redeemer|Maker|Saviour|Holy One))?(?:\s+(?:that|which|who)\s[^.;:,]*|(?:,\s*(?:and\s+)?(?:thy|the|your|their|his|O|even)\b[^;:,.]*)+)?[,.;:!?]?/g;
const MOUTH_FORMULA = /:?\s*for the mouth of the LORD(?: of hosts)? hath spoken it[.:;]?/g;
const SELF_NAME = /\bI (?:am|the) (?:the )?(?:LORD|God|Almighty)\b(?!['’]s)|\bI AM\b|\bI am God\b/;
const FIRST_PERSON = /\b(?:I|me|my|mine|myself)\b/;
// prophets/apostles carry His word: their relays of it are colored
const PROPHETS = /^(?:(?:And|Then|So|But|Now)\s+)?(?:Moses|Samuel|Nathan|Gad|Elijah|Elisha|Isaiah|Jeremiah|Ezekiel|Daniel|Jonah|Micaiah|Shemaiah|Ahijah|Jehu|Azariah|Oded|Haggai|Zechariah|Peter|Paul|John|Stephen|Agabus)\b/;

// Prophets and Psalms speak about Him in the third person too, so their
// continuation is strict; narrative, law and Job continue until narration.
// The history books join them: His speeches there are short and set among kings
// and prophets who speak of Him in the third person.
// Deuteronomy is Moses' own sermon, quoting Him at times; it is strict too, or a
// quotation would run on through Moses' law (18:17 into chapters 19-23).
const STRICT_BOOKS = new Set(['Deuteronomy', 'Joshua', 'Judges', '1Samuel', '2Samuel', '1Kings', '2Kings', '1Chronicles', '2Chronicles', 'Ezra', 'Nehemiah', 'Psalms', 'Proverbs', 'Ecclesiastes', 'SongofSolomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah', 'Malachi']);
const NO_TAG_BOOKS = new Set(['Proverbs', 'Ecclesiastes', 'SongofSolomon', 'Esther', 'Ruth']);

// A verse told in the past tense with no one addressed and nothing commanded is
// the narrator's, not a continuing speech (Numbers 26:57-64 after His census order).
const SPEECH_MARKERS = /\b(?:thou|thee|thy|thine|ye|you|your|I|me|my|mine|shall|shalt|let|will|wilt|must)\b/;
const PAST_TENSE = /\b(?:was|were|had|did|begat|bare|came|went|said|spake|died|took|gave|made)\b|\b[a-z]{3,}ed\b/;
// A verse that opens on "For", "Because", "Lest"… is a reason inside the speech
// ("For in six days the LORD made heaven and earth", Exodus 20:11), not the narrator.
const REASON_OPENER = /^(?:For|Because|Lest|That|If|Whosoever|Wherefore|Therefore)\b/;
function readsAsNarration(text) {
  return PAST_TENSE.test(text) && !SPEECH_MARKERS.test(text) && !REASON_OPENER.test(text);
}

// Third-person mention of Him that is not one of His own self-formulas.
function speaksOfHimInThirdPerson(text) {
  const stripped = text.replace(SAITH_FORMULA, ' ').replace(MOUTH_FORMULA, ' ')
    .replace(/\bI (?:am )?the LORD(?: thy God| your God| their God| his God)?\b/g, ' ')
    .replace(/\bI (?:am |the )?(?:God|the Almighty God|the God of [A-Z][a-z]+)\b/g, ' ')
    .replace(/\bI (?:will be|am) (?:his|their|your|thy) God\b|\bbe (?:their|your|his) God\b/g, ' ')
    .replace(/\bthe LORD (?:thy|your|their) God\b(?=[^.]*\bI\b)/g, ' ');
  // "a jealous God", "thy God": a description of Him, not a third-person mention
  return /\b(?:[Tt]he LORD|[Tt]he Lord GOD)\b|(?<!\b(?:a|an|jealous|mighty|my|thy|your|their|his|our|no|other|strange|merciful|great|living|true|holy) )\bGod\b/.test(stripped);
}

// Where a Godhead speech begins in this verse, if it does: { start, voice, runsToEnd }.
export function findOpener(text, { nt = false, book = '' } = {}) {
  const subj = nt ? NT_GOD : OT_GOD;
  const tries = [
    // "a voice from heaven, saying, This is my beloved Son" (the Father, in the Gospels)
    { re: /\b(?:a|the) voice (?:came )?(?:out of the cloud|from heaven|out of heaven|from the excellent glory)[^,]*?,\s*(?:saying,\s*|which said,\s*)?(?=This is my|Thou art my|I have both)/g, voice: 'father', heaven: true },
    // "he that sat upon the throne said, Behold, I make all things new" (Revelation 21:5)
    { re: /\bhe that sat (?:up)?on the throne (?:said|saith)\b[^.]*?,\s*(?=[A-Z])/g, voice: 'father', heaven: true },
    // the Spirit speaking
    { re: new RegExp(String.raw`\b${SPIRIT}\s+(?:also\s+)?(?:said|saith|spake)\b[^,.]*?,\s*(?:saying,\s*)?(?=[A-Z])`, 'g'), voice: 'spirit' },
    { re: /\bThus saith the Holy Ghost,\s*(?=[A-Z])/g, voice: 'spirit' },
    { re: /\bas the Holy Ghost saith,\s*(?=[A-Z])/g, voice: 'spirit' },
    // "the word of the LORD came unto X, saying,"
    { re: new RegExp(String.raw`\bthe word of ${OT_GOD} (?:came|was)\b[^.]*?,\s*saying,\s*`, 'g'), voice: 'father', ot: true },
    // "Thus saith the LORD," / "Thus saith the Lord GOD;"
    { re: /\b(?:Thus|thus|So|Therefore|therefore|Wherefore|wherefore) (?:saith|said) the (?:LORD(?: of hosts| God(?: of [A-Z][a-z]+)?)?|Lord GOD|Lord)(?:[^,:;.]|,\s*(?=[a-z]|O [A-Z]))*?[,:;]\s*(?=(?!O [A-Z])[A-Z]|$)/g, voice: 'father', ot: true },
    // "I heard the voice of the Lord, saying,"
    { re: new RegExp(String.raw`\bthe voice of ${OT_GOD}\b[^.]*?,\s*saying,\s*(?=[A-Z]|$)`, 'g'), voice: 'father', ot: true },
    // "God did tempt Abraham, and said unto him,"
    { re: new RegExp(String.raw`(?<=^|[.;:]\s|\b(?:And|Then|So|But|that|when) )${subj}\b[^.,;:]{0,50},? and (?:said|spake)(?: unto (?:[a-z]+|[A-Z][a-z]+))?,\s*(?=[A-Z]|$)`, 'g'), voice: 'father' },
    // inverted: "Then said the LORD unto…," / "And the LORD answered and said"
    { re: new RegExp(String.raw`(?:^|[.;:]\s+)(?:Then|And|So|Thus|Moreover)\s+(?:said|spake|answered|called|cried)\s+${subj}\b[^.]*?[,:]\s*(?=[A-Z]|$)`, 'g'), voice: 'father' },
    // "And the LORD said unto Moses," / "God spake all these words, saying,"
    { re: new RegExp(String.raw`(?<!\bof |\bunto |\bto |\bbefore |\bagainst |\bwith |\bfrom |\bby |\bas |\bwhich |\bwhom |\b[Tt]he |\b[Mm]y |\b[Tt]hy |\b[Oo]ur |\b[Yy]our |\b[Hh]is |\b[Tt]heir )${subj}\b(?:\s+(?:also|again|himself|moreover))?\s+(?:(?:had|hath|did|was)\s+)?(?:said|spake|saith|sware|sworn|spoken|answered|called|commanded|cried|talked|appeared|blessed|came)\b[^.]*?[,:]\s*(?=[A-Z]|$)`, 'g'), voice: 'father' },
  ];
  let best = null;
  for (const t of tries) {
    if (t.ot && nt && t.voice === 'father' && !/saith the Lord/.test(text)) { /* OT formulas still apply when an apostle quotes them */ }
    t.re.lastIndex = 0;
    let m;
    while ((m = t.re.exec(text))) {
      const matched = m[0];
      if (t.voice === 'father' && !SPEECH_VERB.test(matched) && !/word of|voice/.test(matched)) continue;
      // "the LORD called Samuel: and he answered, Here am I" — the words are the answer's
      if (/\band (?:he|she|they|[A-Z][a-z]+) (?:said|answered|spake)\b/.test(matched.slice(1))) continue;
      // "strengthen, O God, that which thou hast wrought" — words spoken TO Him
      if (/^O (?:God|LORD|Lord)\b/.test(text.slice(m.index + matched.length))) continue;
      // the subject must be the speaker: reject "unto the LORD", "angel of the LORD" etc. at the true start
      const before = text.slice(0, m.index);
      if (/\b(?:angel|prophet|man|servant|priest|house|ark|name|people|hand|fear|spirit|glory|captain|host) of\s*$/.test(before)) continue;
      // a human already speaking earlier in this verse: this is a quotation inside their speech
      if (/\b(?:said|saith|spake|answered)\b[^,]*,\s*[A-Z]/.test(before) && !PROPHETS.test(before)) continue;
      let start = m.index + matched.length;
      // "unto Joshua the son of Nun, Moses' minister, saying," — the speech starts after "saying,"
      const saying = /^[^.:;]{0,60}?,\s*saying,\s*/.exec(text.slice(start));
      if (saying) start += saying[0].length;
      if (start >= text.length) { if (!best || m.index < best.at) best = { at: m.index, start, voice: t.voice, emptyHere: true }; break; }
      if (!best || m.index < best.at) best = { at: m.index, start, voice: t.voice, emptyHere: false, heaven: Boolean(t.heaven) };
      break;
    }
  }
  // the opener verbs only count when the matched clause carries a speech verb or formula
  if (best && book && NO_TAG_BOOKS.has(book)) return null;
  return best;
}

// Cut the speech where narration resumes inside the same verse.
const INNER_NARRATION = new RegExp(String.raw`(?:[.:;?!])\s+(?=(?:Then|And) said (?:I|he|she|they)\b|and there [a-z]+ed (?:he|she|they)\b|(?:And|Then|But) (?:I|we) (?:said|answered)\b|(?:and |And |So |Then )?(?:it was so|there was|God (?:saw|called|made|created|divided|set|blessed)|${SUBJECT}\s+${PAST}\b))`);
// "…at Ramothgilead? And one said on this manner" — a new sentence that opens on
// someone else speaking ends His words.
const NEXT_SPEAKER = /[.?!]\s+(?=And [^,.;:]{0,30}\b(?:said|spake|answered)\b)/;
// "…from off you. Wherefore the name of the place is called Gilgal unto this day."
const NAMING = /[.;:]\s+(?=(?:Wherefore|Therefore|And|and|wherefore|therefore) (?:the name of|the name|it is called|it was called|he called|they called)\b)/;
function trimInnerNarration(speech) {
  const cuts = [INNER_NARRATION.exec(speech), NEXT_SPEAKER.exec(speech), NAMING.exec(speech)].filter(Boolean).map((m) => m.index);
  return cuts.length ? speech.slice(0, Math.min(...cuts) + 1) : speech;
}

// Spans of His speech inside a verse given that the whole verse is His (continuation
// or a "saith the LORD" verse): everything except the formula words.
function wholeVerseSpans(text) {
  const spans = [];
  const re = new RegExp(`${SAITH_FORMULA.source}|${MOUTH_FORMULA.source}`, 'g');
  let last = 0; let m;
  while ((m = re.exec(text))) {
    if (m.index > last) spans.push([last, m.index]);
    last = m.index + m[0].length;
  }
  if (last < text.length) spans.push([last, text.length]);
  return spans.map(([s, e]) => trimSpan(text, s, e)).filter(Boolean);
}

function trimSpan(text, s, e) {
  while (s < e && /[\s,;:]/.test(text[s])) s += 1;
  while (e > s && /[\s,;:]/.test(text[e - 1])) e -= 1;
  if (e - s < 2) return null;
  // keep a closing sentence mark if the span ended just before it
  if (e < text.length && /[.?!]/.test(text[e])) e += 1;
  return [s, e];
}

// A human speech opener at the head of a verse ("And Moses said unto the LORD,").
const HUMAN_OPENER = new RegExp(String.raw`^(?:(?:And|Then|So|But|Now|Moreover|Also|Again)\s+)?(${SUBJECT})\s+(?:also\s+|again\s+)?(?:said|spake|answered|cried|called|sware|saith)\b[^.]*?[,:]\s*(?=[A-Z])`);
const GOD_NAMES = /^(?:[Tt]he (?:LORD|Lord|Holy Ghost|Spirit)|God)\b/;
// "Unto the woman he said, I will…" inside a running speech: His words start after it
const INNER_HE_SAID = /^[^,]{0,40}?\b(?:he|God|the LORD(?: God)?)\s+(?:said|spake)(?: unto [a-z ]+| unto [A-Z][a-z]+)?,\s*(?=[A-Z])/;
// a decree in the second person keeps a Psalm/prophet speech going ("Thou shalt break them")
const DECREE = /\b(?:[Tt]hou shalt|[Yy]e shall|[Tt]hou art my)\b/;

function speechSpans(text, start, voice) {
  // "…Moses, Moses. And he said, Here am I." — a vocative answered by the human
  const spans = []; let open = true;
  let speech = text.slice(start);
  const reply = /[.:;?!]\s+and he said,\s*(?=[A-Z])/i.exec(speech);
  let rest = null;
  if (reply) {
    const before = speech.slice(0, reply.index);
    rest = { at: start + reply.index + reply[0].length, vocative: before.trim().split(/\s+/).length <= 3 };
    speech = before + speech[reply.index];
  }
  const trimmed = trimInnerNarration(speech);
  if (trimmed.length < speech.length) open = false;
  const sp = trimSpan(text, start, start + trimmed.length);
  if (sp) spans.push([voice, ...sp]);
  if (rest) {
    if (rest.vocative) open = false; // the human answers; His next words come with their own "he said"
    else {
      const more = trimInnerNarration(text.slice(rest.at));
      const sp2 = trimSpan(text, rest.at, rest.at + more.length);
      if (sp2) spans.push([voice, ...sp2]);
      open = more.length === text.length - rest.at;
    }
  }
  return { spans, open, humanLast: Boolean(rest && rest.vocative) };
}

// The Psalms trade speakers with no marker, so no speech is carried from verse to
// verse there by rule. Instead these passages, where He plainly speaks in the
// first person, were read one by one and are listed here: [ref, where His words
// start in the verse (null = the whole verse), voice]. The Word explains the Word:
// Psalms 82:6 is "the word of God" by John 10:34-35; Psalms 95:7-11 is the Holy
// Ghost speaking by Hebrews 3:7-11; Psalms 75:3's pillars are the LORD's by
// 1 Samuel 2:8.
export const READ_BY_HAND = {
  Psalms: [
    ['2:6', null], ['2:7', 'Thou art my Son'], ['2:8', null], ['2:9', null],
    ['50:5', null], ['50:7', null], ['50:8', null], ['50:9', null], ['50:10', null], ['50:11', null],
    ['50:12', null], ['50:13', null], ['50:14', null], ['50:15', null], ['50:16', 'What hast thou'],
    ['50:17', null], ['50:18', null], ['50:19', null], ['50:20', null], ['50:21', null], ['50:22', null], ['50:23', null],
    ['60:6', 'I will rejoice'], ['60:7', null], ['60:8', null], ['68:22', 'I will bring'], ['68:23', null],
    ['75:2', null], ['75:3', null], ['75:4', null], ['75:5', null],
    ['81:6', null], ['81:7', null], ['81:8', null], ['81:9', null], ['81:10', null], ['81:11', null],
    ['81:12', null], ['81:13', null], ['81:14', null], ['81:15', null], ['81:16', null],
    ['82:2', null], ['82:3', null], ['82:4', null], ['82:5', null], ['82:6', null], ['82:7', null],
    ['89:3', null], ['89:4', null], ['89:19', 'I have laid help'],
    ['89:20', null], ['89:21', null], ['89:22', null], ['89:23', null], ['89:24', null], ['89:25', null],
    ['89:26', null], ['89:27', null], ['89:28', null], ['89:29', null], ['89:30', null], ['89:31', null],
    ['89:32', null], ['89:33', null], ['89:34', null], ['89:35', null], ['89:36', null], ['89:37', null],
    ['91:14', null], ['91:15', null], ['91:16', null],
    ['95:7', 'To day if ye will hear his voice', 'spirit'], ['95:8', null, 'spirit'], ['95:9', null, 'spirit'],
    ['95:10', null, 'spirit'], ['95:11', null, 'spirit'],
    ['105:15', 'Touch not'],
    ['108:7', 'I will rejoice'], ['108:8', null], ['108:9', null],
    ['132:11', 'Of the fruit'], ['132:12', null], ['132:14', null], ['132:15', null], ['132:16', null],
    ['132:17', null], ['132:18', null],
    // The New Testament names these the Son's own words (voice 'jesus'):
    // Matthew 27:46 "Jesus cried… My God, my God, why hast thou forsaken me?";
    // Hebrews 2:11-12 "he is not ashamed to call them brethren, Saying, I will declare thy name";
    // Hebrews 10:5-7 "when he cometh into the world, he saith, Sacrifice and offering…";
    // Acts 2:25, 31 "David speaketh concerning him… spake of the resurrection of Christ";
    // Romans 15:3 "even Christ… as it is written, The reproaches of them that reproached thee fell on me";
    // John 13:18, Jesus: "that the scripture may be fulfilled, He that eateth bread with me…".
    ['22:1', null, 'jesus'], ['22:22', null, 'jesus'],
    ['40:6', null, 'jesus'], ['40:7', null, 'jesus'], ['40:8', null, 'jesus'],
    ['16:8', null, 'jesus'], ['16:9', null, 'jesus'], ['16:10', null, 'jesus'], ['16:11', null, 'jesus'],
    ['69:9', null, 'jesus'], ['41:9', null, 'jesus'],
    // And the Father's, spoken to the Son and of the angels (Hebrews 1:7, 1:8-9, 1:10-12).
    ['45:6', null], ['45:7', null], ['102:25', null], ['102:26', null], ['102:27', null], ['104:4', null],
  ],
  // Isaiah 40-55, read by hand: His words where no formula marks them, the
  // Servant's Father-spoken lines, and Isaiah 61:1-3, which the Son read as His
  // own: "This day is this scripture fulfilled in your ears" (Luke 4:21). Isaiah
  // 8:18 is the Son's by Hebrews 2:13. The Servant's own words elsewhere (49:1-5,
  // 50:4-9) are not named His speech by the New Testament, so they stay plain.
  Isaiah: [
    ['8:18', null, 'jesus'], ['61:1', null, 'jesus'], ['61:2', null, 'jesus'], ['61:3', null, 'jesus'],
    ['40:2', null],
    ['41:1-3', null], ['41:5-12', null], ['41:16-20', null], ['41:22-29', null],
    ['42:1-4', null], ['42:14-20', null],
    ['43:8-9', null], ['43:11', null], ['43:18-28', null],
    ['44:1', null], ['44:4-5', null], ['44:21-22', null], ['44:27-28', null],
    ['45:1', 'whose right hand'], ['45:3-4', null], ['45:20-21', null],
    ['46:3-5', null], ['46:8', null],
    ['47:1-3', null], ['47:5-15', null],
    ['48:3-15', null], ['48:19', null],
    ['49:3', 'Thou art my servant'], ['49:6', 'It is a light thing'], ['49:9-12', null], ['49:15-17', null],
    ['50:11', null],
    ['51:1-8', null], ['51:12-16', null], ['51:22', 'Behold, I have taken'], ['51:23', null],
    ['52:13-15', null], ['53:11-12', null],
    ['54:5', null], ['54:13-16', null],
    ['55:1-5', null], ['55:13', null],
  ],
  // Moses gives the Ten Commandments as the LORD spoke them: "The LORD talked with
  // you face to face… saying," (Deuteronomy 5:4-5).
  Deuteronomy: [
    ['5:6', null], ['5:7', null], ['5:8', null], ['5:9', null], ['5:10', null], ['5:11', null], ['5:12', null],
    ['5:13', null], ['5:14', null], ['5:15', null], ['5:16', null], ['5:17', null], ['5:18', null], ['5:19', null],
    ['5:20', null], ['5:21', null],
  ],
};
const NO_CARRY_BOOKS = new Set(['Psalms']);

function readByHand(file, chapters) {
  const out = new Map();
  for (const [ref, from, voice = 'father'] of READ_BY_HAND[file] || []) {
    const [c, range] = ref.split(':');
    const [a, b = a] = range.split('-').map(Number);
    for (let v = a; v <= b; v += 1) {
      const text = chapters[Number(c) - 1][v - 1];
      if (text == null) throw new Error(`${file} ${c}:${v} is not a verse`);
      const start = from ? text.indexOf(from) : 0;
      if (start < 0) throw new Error(`${file} ${c}:${v}: "${from}" is not in the verse`);
      const sp = trimSpan(text, start, text.length);
      if (sp) out.set(`${c}:${v}`, [[voice, ...sp]]);
    }
  }
  return out;
}

// Tag one book: returns Map "c:v" -> [[voice, start, end], ...]
export function tagGodheadSpeech(file, chapters, { jesusByRef = new Map() } = {}) {
  const nt = INDEX.findIndex((b) => b.file === file) >= 39;
  // The New Testament quotes His oracles inside an apostle's own words, so it is
  // strict like the prophets: a quotation runs on only while it is still His.
  const strict = nt || STRICT_BOOKS.has(file);
  const result = new Map();
  if (NO_TAG_BOOKS.has(file)) return result;
  // who is speaking, and whether their speech runs on into the next verse
  let cur = { who: null, open: false, voice: null };
  // 'god' | 'angel' | 'human' — "And he said" answers whoever spoke before the last speaker.
  // An angel is never assumed to be Him; his words are colored only where the verse
  // itself names them the LORD's ("By myself have I sworn, saith the LORD").
  // "And he said" is only read as His when He spoke within the last few verses —
  // in a long court scene the "he" is far more likely the king or the prophet.
  let lastSpeaker = null; let prevSpeaker = null; let godAt = -99; let n = 0;
  let pending = null; // a held verse in a strict continuation: { ref, spans }
  let humanAt = -99; // where the last human speech opened
  const humanOpen = () => cur.who === 'human' && cur.open && n - humanAt <= 3;
  const spoke = (who) => {
    if (who === 'god') godAt = n;
    if (who !== lastSpeaker) { prevSpeaker = lastSpeaker; lastSpeaker = who; }
  };
  chapters.forEach((verses, ci) => {
    if (strict) cur = { who: null, open: false, voice: null };
    verses.forEach((text, vi) => {
      const ref = `${ci + 1}:${vi + 1}`;
      n += 1;
      const hadPending = pending;
      if (jesusByRef.has(ref)) {
        // "Father, glorify thy name. Then came there a voice from heaven, saying, I have
        // both glorified it" (John 12:28) — the Father's answer shares the Son's verse.
        const op = findOpener(text, { nt, book: file });
        const sonSpans = jesusByRef.get(ref);
        if (op && op.heaven && !op.emptyHere) {
          const r = speechSpans(text, op.start, op.voice);
          const free = r.spans.filter(([, s0, e0]) => !sonSpans.some(([, a, b]) => s0 < b && a < e0));
          if (free.length) result.set(ref, free);
        }
        cur = { who: 'jesus', open: false, voice: null };
        return;
      }
      const spans = [];
      const narration = NARRATION_OPENER.test(text);
      const human = HUMAN_OPENER.exec(text);
      const humanSubject = human && !GOD_NAMES.test(human[1]) ? human[1] : null;
      let opener = findOpener(text, { nt, book: file });
      // inside a human's running speech, a later "God hath said, …" is their quotation
      if (opener && !opener.heaven && humanOpen() && !narration && !humanSubject) {
        const prefix = text.slice(0, opener.at);
        if (prefix.length > 40 || /,\s*[A-Z]/.test(prefix)) opener = null;
      }
      if (opener && humanSubject && opener.at > 0 && !PROPHETS.test(text)) opener = null;
      const saith = nt ? /\bsaith the Lord\b/.test(text) : /\bsaith (?:the (?:LORD|Lord|Holy Ghost|Spirit|Almighty|Holy One|King of [A-Z])|(?:your|thy|my) God\b)/.test(text);
      const heSaid = HE_SAID.exec(text);
      const angel = !nt && ANGEL_SPEAKS.test(text);

      if (opener) {
        if (opener.emptyHere) cur = { who: 'god', open: true, voice: opener.voice };
        else {
          const r = speechSpans(text, opener.start, opener.voice);
          spans.push(...r.spans);
          cur = { who: r.humanLast ? 'human' : 'god', open: r.open && !r.humanLast, voice: opener.voice };
          if (r.humanLast) { spoke('god'); spoke('human'); }
        }
        if (cur.who === 'god') spoke('god');
      } else if (saith && !narration && !humanOpen()) {
        const intro = /^(?:[^,]{0,60},\s*){0,2}?[^,]{0,40}?\b(?:said|saith|spake|cried|written)\b[^,]{0,40},\s*(?=[A-Z])/.exec(text);
        const from = intro && intro.index === 0 && !/\bsaith the\b/.test(intro[0]) ? intro[0].length : 0;
        for (const [s0, e0] of wholeVerseSpans(text.slice(from))) {
          const sp = trimSpan(text, s0 + from, e0 + from);
          if (sp) spans.push(['father', ...sp]);
        }
        cur = { who: 'god', open: true, voice: 'father' };
        spoke('god');
      } else if (angel) {
        cur = { who: 'human', open: false, voice: null };
        spoke('angel');
        if (/:\s+and he said,/.test(text)) spoke('human');
      } else if (heSaid && lastSpeaker && (!nt || /^(?:And|Then)\s+he\s+said\s+unto\s+me\b/.test(text))) {
        const same = heSaid[1] && /Moreover|Also|Again|And again/.test(heSaid[1]);
        const recent = n - godAt <= 3;
        const untoMe = /^(?:And|Then)\s+he\s+said\s+unto\s+me\b/.test(text);
        const god = recent && (same || untoMe ? lastSpeaker === 'god' : (lastSpeaker !== 'god' && prevSpeaker === 'god'));
        const m = /,\s*(?=[A-Z])/.exec(text);
        if (god && m) {
          const r = speechSpans(text, m.index + m[0].length, 'father');
          spans.push(...r.spans);
          cur = { who: 'god', open: r.open, voice: 'father' };
          spoke('god');
          if (r.humanLast) { spoke('human'); cur = { who: 'human', open: false, voice: null }; }
        } else { cur = { who: 'human', open: true, voice: null }; humanAt = n; spoke('human'); }
      } else if (humanSubject) {
        const prophet = PROPHETS.test(text);
        cur = { who: prophet ? 'prophet' : 'human', open: true, voice: null };
        humanAt = n;
        spoke('human');
      } else if (cur.who === 'god' && cur.open && !narration) {
        const third = speaksOfHimInThirdPerson(text);
        // "I spake also to Zedekiah…" (Jeremiah 27:12): the prophet telling what he did
        const prophetTells = /^(?:(?:And|Then|So|But)\s+)?I\s+(?:also\s+)?(?:spake|went|took|came|saw|looked|arose|bought|wrote|sat|turned|lifted|heard|answered|stood|fell|prayed|did|brought|set|gave)\b/.test(text);
        const ok = strict
          ? (!third && !prophetTells && (FIRST_PERSON.test(text) || SELF_NAME.test(text) || DECREE.test(text)))
          : !readsAsNarration(text);
        // strict books may carry ONE verse that simply lacks a first person (Joshua 1:4,
        // the land's borders) when the next verse is plainly His again
        const holdable = strict && !ok && !third && !prophetTells && !readsAsNarration(text) && !pending;
        if (ok) {
          if (pending) { result.set(pending.ref, pending.spans); pending = null; }
          const inner = INNER_HE_SAID.exec(text);
          const from = inner ? inner[0].length : 0;
          for (const [s, e] of wholeVerseSpans(text.slice(from))) {
            const sp = trimSpan(text, s + from, e + from);
            if (sp) spans.push([cur.voice, ...sp]);
          }
        } else if (holdable) {
          pending = { ref, spans: wholeVerseSpans(text).map((sp) => [cur.voice, ...sp]) };
        } else cur = { who: null, open: false, voice: null };
      } else if (!nt && strict && SELF_NAME.test(text) && !speaksOfHimInThirdPerson(text) && !narration) {
        for (const sp of wholeVerseSpans(text)) spans.push(['father', ...sp]);
        cur = { who: 'god', open: true, voice: 'father' };
      } else if (narration) {
        cur = { who: null, open: false, voice: null };
      } else if (cur.who !== 'human' && cur.who !== 'prophet') {
        cur = { who: null, open: false, voice: null };
      }
      if (pending && pending === hadPending) pending = null; // the next verse did not take it up
      if (NO_CARRY_BOOKS.has(file)) { cur = { ...cur, open: false }; pending = null; }
      if (spans.length) result.set(ref, spans);
    });
    pending = null;
    // One plain verse between two verses of His in the same chapter, with no
    // narration, no other speaker and no third-person mention of Him, is His too
    // (Isaiah 1:17 between 1:16 and 1:18).
    verses.forEach((text, vi) => {
      const ref = `${ci + 1}:${vi + 1}`;
      const prev = result.get(`${ci + 1}:${vi}`); const next = result.get(`${ci + 1}:${vi + 2}`);
      if (result.has(ref) || jesusByRef.has(ref) || !prev || !next) return;
      const voice = prev[prev.length - 1][0];
      if (voice === 'jesus' || next[0][0] !== voice) return;
      if (NARRATION_OPENER.test(text) || HUMAN_OPENER.test(text) || HE_SAID.test(text) || speaksOfHimInThirdPerson(text) || readsAsNarration(text)) return;
      if (/\b(?:said|saith|spake|answered)\b/.test(text)) return;
      const spans = wholeVerseSpans(text).map((sp) => [voice, ...sp]);
      if (spans.length) result.set(ref, spans);
    });
  });
  return result;
}

// ---------------------------------------------------------------------------
// 3. Write the per-book assets.
// ---------------------------------------------------------------------------
export function buildBook(file, chapters, osisWords, osisId) {
  const jesusByRef = new Map();
  chapters.forEach((verses, ci) => verses.forEach((text, vi) => {
    const runs = jesusRuns(text, osisWords.get(`${osisId}.${ci + 1}.${vi + 1}`));
    if (runs.length) jesusByRef.set(`${ci + 1}:${vi + 1}`, runs.map(([s, e]) => ['jesus', s, e]));
  }));
  const godhead = tagGodheadSpeech(file, chapters, { jesusByRef });
  for (const [ref, spans] of readByHand(file, chapters)) godhead.set(ref, spans);
  const merged = new Map(godhead);
  for (const [ref, spans] of jesusByRef) {
    merged.set(ref, [...spans, ...(merged.get(ref) || [])].sort((a, b) => a[1] - b[1]));
  }
  const out = {};
  for (const [ref, spans] of [...merged].sort((a, b) => cmpRef(a[0], b[0]))) {
    const [c, v] = ref.split(':');
    const text = chapters[Number(c) - 1][Number(v) - 1];
    (out[c] || (out[c] = {}))[v] = spans.map(([voice, s, e]) => [voice, text.slice(s, e)]);
  }
  return out;
}

function cmpRef(a, b) {
  const [ac, av] = a.split(':').map(Number); const [bc, bv] = b.split(':').map(Number);
  return ac - bc || av - bv;
}

async function main() {
  const arg = process.argv[2];
  let xml;
  if (arg && existsSync(arg)) xml = readFileSync(arg, 'utf8');
  else {
    const res = await fetch(SOURCE_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${SOURCE_URL}`);
    xml = await res.text();
  }
  const sha = createHash('sha256').update(xml).digest('hex');
  if (sha !== SOURCE_SHA256) throw new Error(`source sha256 ${sha} != pinned ${SOURCE_SHA256}`);
  const osisWords = parseOsisRedLetter(xml);
  mkdirSync(OUT_DIR, { recursive: true });
  const manifest = { source: SOURCE_URL, sourceSha256: sha, books: {} };
  INDEX.forEach((b, i) => {
    const data = JSON.parse(readFileSync(join(KJV_DIR, `${b.file}.json`), 'utf8'));
    const chapters = buildBook(b.file, data.chapters, osisWords, OSIS_IDS[i]);
    const counts = { jesus: 0, father: 0, spirit: 0 };
    for (const vs of Object.values(chapters)) for (const spans of Object.values(vs)) for (const [voice] of spans) counts[voice] += 1;
    manifest.books[b.file] = counts;
    writeFileSync(join(OUT_DIR, `${b.file}.json`), `${JSON.stringify({ name: b.name, chapters })}\n`);
  });
  writeFileSync(join(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`);
  const total = Object.values(manifest.books).reduce((a, c) => ({ jesus: a.jesus + c.jesus, father: a.father + c.father, spirit: a.spirit + c.spirit }), { jesus: 0, father: 0, spirit: 0 });
  console.log(`voices written: ${JSON.stringify(total)} (source sha256 ${sha})`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}
