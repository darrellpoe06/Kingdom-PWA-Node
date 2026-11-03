// @vitest-environment node
// =============================================================================
// sov56 — Oversight is a charge, not a ceremony: the new cart, the father who
// did not restrain, and the king who told his judges what the seat was for
// (DR-1274)
// =============================================================================
// Darrell forwarded Gmail thread 1a10c8ffd4dc1cac on 2026-10-05 with one word
// above it: Lessons. The thread is a webinar registration confirmation from a
// certification company plus the promotional body for a three-part series, and
// its subject is "Governing AI in the public sector: from oversight to
// responsible adoption and operations".
//
// THIS LESSON'S FIRST DANGER IS THE SOURCE ITSELF. A receipt with advertising
// attached is not an article, and the temptation is to write as though a
// standard had been read. Nothing here attended a session or opened a
// framework, and the lesson has to SAY so in the reader's hearing rather than
// in a note somebody else keeps. So the gate below requires the provenance
// limit to be carried in the lesson AND in every band, requires the three
// frameworks to appear only as titles, and requires the three honesty tiers
// (established / open / refused) to be present with the refusal named.
//
// THE SECOND DANGER IS A SPINE CHOSEN BY HEADLINE. The subject is accountability
// for a delegated power, and the obvious verses for that are already the spines
// of other weeks: the watchman is carried in sov44, and the steward's reckoning,
// the shepherds of Ezekiel 34 and 1 Peter 5:2 are sov40's. So this lesson is
// built on three passages the course had not stood a lesson on: the due order
// (1 Chronicles 13 and 15), Eli's restraint (1 Samuel 2 and 3), and
// Jehoshaphat's charge to his judges (2 Chronicles 19). Each is pinned by
// literal span below, and the catalog's own duplicate and band-differentiation
// gates are pre-run against this module rather than paraphrased.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES, SOVEREIGN_AI_META } from '../lib/sovereign-ai-class.js';
import { lessonCreatedDay } from '../lib/lesson-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const ID = 'sov56-oversight-is-a-charge-not-a-ceremony';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = SOVEREIGN_AI_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);

function* strings(node) {
  if (typeof node === 'string') { yield node; return; }
  if (Array.isArray(node)) { for (const v of node) yield* strings(v); return; }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) yield* strings(v); }
}
const EVERY_STRING = L ? [...strings(L)] : [];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
/** The corpus text a reference names, handling ranges and a comma-joined second part. */
export function corpusText(ref) {
  const out = [];
  for (const piece of String(ref).split(';').map((s) => s.trim()).filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?((?:\s*,\s*\d+:\d+(?:-\d+)?)*)$/.exec(piece);
    if (!m) return null;
    const [, book, ch, from, through, extra] = m;
    const push = (c, a, b) => {
      const chap = chapter(book, c);
      if (!chap) return false;
      const to = b ? Number(b) : Number(a);
      for (let v = Number(a); v <= to; v += 1) { if (chap[v - 1] == null) return false; out.push(chap[v - 1]); }
      return true;
    };
    if (!push(ch, from, through)) return null;
    for (const part of (extra || '').split(',').map((s) => s.trim()).filter(Boolean)) {
      const mm = /^(\d+):(\d+)(?:-(\d+))?$/.exec(part);
      if (!mm || !push(mm[1], mm[2], mm[3])) return null;
    }
  }
  return out.join(' ');
}

/** Pairs by SPLITTING on the quote character, never by regex (DR-1258 / DR-1259). */
export function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}

export function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) { faults.push(`unresolved reference (${ref})`); continue; }
      if (!verse.includes(inside.trim())) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const referencedCount = (texts) => texts.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0);

// The spine, pinned by literal text. Every span was read out of the corpus on
// disk before it was written into the lesson, and each must still be there.
const SPINE = [
  ['Exodus 25:14', 'that the ark may be borne with them'],
  ['Exodus 25:15', 'The staves shall be in the rings of the ark: they shall not be taken from it'],
  ['Numbers 7:9', 'that they should bear upon their shoulders'],
  ['Numbers 4:15', 'but they shall not touch any holy thing, lest they die'],
  ['1 Chronicles 13:7', 'And they carried the ark of God in a new cart out of the house of Abinadab'],
  ['1 Chronicles 13:9', 'Uzza put forth his hand to hold the ark; for the oxen stumbled'],
  ['1 Chronicles 13:12', 'And David was afraid of God that day'],
  ['1 Chronicles 13:13', 'but carried it aside into the house of Obededom the Gittite'],
  ['1 Chronicles 15:2', 'None ought to carry the ark of God but the Levites'],
  ['1 Chronicles 15:13', 'for that we sought him not after the due order'],
  ['1 Chronicles 15:15', 'bare the ark of God upon their shoulders with the staves thereon'],
  ['1 Samuel 2:22', 'and heard all that his sons did unto all Israel'],
  ['1 Samuel 2:23', 'Why do ye such things?'],
  ['1 Samuel 3:13', 'his sons made themselves vile, and he restrained them not'],
  ['2 Chronicles 19:5', 'throughout all the fenced cities of Judah, city by city'],
  ['2 Chronicles 19:6', 'Take heed what ye do: for ye judge not for man, but for the LORD'],
  ['2 Chronicles 19:7', 'nor respect of persons, nor taking of gifts'],
  ['2 Chronicles 19:11', 'Deal courageously, and the LORD shall be with the good'],
  ['Proverbs 27:23', 'Be thou diligent to know the state of thy flocks, and look well to thy herds'],
];

// Carried in EVERY register, because a reader reads one band. The due order is
// the lesson's thesis, the restraint is its warning, the charge is its remedy.
const IN_EVERY_BAND = [
  'for that we sought him not after the due order',
  'his sons made themselves vile, and he restrained them not',
  'Take heed what ye do: for ye judge not for man, but for the LORD',
  'Deal courageously, and the LORD shall be with the good',
];

describe('sov56 is in the course, whole, and counted', () => {
  it('exists exactly once with all four bands and two parables', () => {
    expect(L, `${ID} is not in the Sovereign A.I. catalog`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.stories).toHaveLength(2);
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
    }
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(12);
    expect(L.benefits.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(10);
    expect(L.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
  });

  // Deliberately NOT asserting that sov56 is the HIGHEST week. sov52's spec made
  // that claim about itself and sov53 falsified it the same day (DR-1256 /
  // DR-1260): a check that hands a permanent role to whichever lesson is newest
  // fails on the next one. Which week is last belongs to the course's own order
  // test, not here.
  it('claims the number 56 exactly once, and the course count stays derived', () => {
    const numbers = SOVEREIGN_AI_MODULES.map((m) => /^sov(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(numbers.filter((n) => n === 56)).toEqual([56]);
    expect(SOVEREIGN_AI_META.weeks).toBe(SOVEREIGN_AI_MODULES.length);
  });

  it('carries its build day, and an anchor whose every reference resolves', () => {
    expect(lessonCreatedDay('sovereign-ai', ID)).toBe('2026-10-28');
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(50);
    for (const r of refs) expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
  });

  it('every reference the lesson quotes is also named in the anchor', () => {
    const inAnchor = new Set(String(L.anchor.ref).split(';').map((s) => s.trim()));
    const quoted = new Set(EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.ref)).filter(Boolean));
    expect([...quoted].filter((r) => !inAnchor.has(r))).toEqual([]);
  });

  // AND THE OTHER DIRECTION, which is the half that actually bit. The first
  // build of this lesson carried Proverbs 29:2 in the senior band only, so the
  // anchor named a verse the adult lesson never reached -- and because Search
  // it out derives its links from anchor.ref (DR-0734), an anchor reference
  // with no home in the lesson sends a reader to a verse the teaching does not
  // discuss. The verse was folded into movement eleven, where that thought
  // already lived, rather than dropped from the anchor.
  it('and every anchor reference has a home in the ADULT lesson, not a band only', () => {
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.filter((r) => !L.lesson.includes(`(${r})`))).toEqual([]);
  });

  it('PROVEN TO CATCH: an anchor reference quoted in a band only is named', () => {
    const planted = { ...L, anchor: { ...L.anchor, ref: `${L.anchor.ref}; Proverbs 29:18` } };
    const refs = String(planted.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.filter((r) => !planted.lesson.includes(`(${r})`))).toEqual(['Proverbs 29:18']);
    expect(corpusText('Proverbs 29:18'), 'the planted reference must itself be real').not.toBeNull();
  });
});

describe('every verse is the corpus on disk', () => {
  it('each pinned span of the spine is verbatim and present in the lesson', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the lesson does not carry it`).toBe(true);
    }
  });

  it('EVERY referenced quoted span in EVERY string of the module is verbatim', () => {
    expect(verbatimFaults(EVERY_STRING)).toEqual([]);
  });

  it('and the sweep asserts its own count', () => {
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(195);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('for the oxen stumbled', 'for the horses stumbled');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('Yahweh is never inside a quotation, and a planted one is caught', () => {
    for (const t of EVERY_STRING) {
      for (const { inside, ref } of quotedPairs(t)) {
        expect(/\bYahweh\b/.test(inside), `Yahweh inside (${ref || 'no ref'})`).toBe(false);
      }
    }
    const tampered = L.lesson.replace('for that we sought him not after the due order', 'for that we sought Yahweh not after the due order');
    expect(tampered).not.toBe(L.lesson);
    expect(quotedPairs(tampered).some((p) => /\bYahweh\b/.test(p.inside))).toBe(true);
    expect(verbatimFaults([tampered]).length).toBeGreaterThan(0);
  });

  it('no generic God, GOD or LORD in our authored voice, while the quotations keep theirs', () => {
    const ourVoice = (t) => String(t).split('"').filter((_, i) => i % 2 === 0).join(' ');
    const found = [];
    for (const t of EVERY_STRING) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 55)}`);
    }
    expect(found).toEqual([]);
    const inQuotes = EVERY_STRING.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('And they carried the ark of God in a new cart out of the house of Abinadab');
    expect(inQuotes).toContain('Deal courageously, and the LORD shall be with the good');
  });

  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });

  // The -our spelling of the color family is NOT re-checked here:
  // american-spelling.test.js scans every file under app/src including the test
  // files, so a spec that spells the banned word in order to look for it fails
  // that gate on itself. The terminal-punctuation rule is likewise left to
  // living-lessons-quoted-terminal.test.js — pre-run a gate's own module, never
  // a paraphrase of its rule (the ll269 finding).
  it('no quoted span carries an ellipsis, and no reader-facing field prints a record id', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
});

describe('the source is named for what it is, not dressed as an article', () => {
  it('the lesson states the provenance limit in its own words', () => {
    expect(L.lesson).toMatch(/registration confirmation/i);
    expect(L.lesson).toMatch(/It is not an article/);
    expect(L.lesson).toMatch(/Nobody here attended a session, opened a standard, or verified a figure/);
  });

  it('every band tells its reader the source was a receipt with advertising, not a study', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k} does not name the source`).toMatch(/receipt|registration|sign-up|email/i);
      expect(TEXTS[k], `${k} does not state what nobody did`).toMatch(/nobody (here )?(went|attended|sat)|No one here sat|nobody read/i);
    }
  });

  it('the three frameworks appear as TITLES only, with no borrowed content', () => {
    expect(L.lesson).toMatch(/a governance standard with six principles/);
    expect(L.lesson).toMatch(/a value chain/);
    expect(L.lesson).toMatch(/a national risk framework/);
    expect(L.lesson).toMatch(/as titles, never as content we have read/);
  });

  it('keeps the three honesty tiers apart and names the refusal', () => {
    expect(L.lesson).toMatch(/Established, from the email itself/);
    expect(L.lesson).toMatch(/Open, and narrowly/);
    expect(L.lesson).toMatch(/Over-reach we refuse/);
    expect(L.lesson).toMatch(/treating a receipt as a syllabus/);
    expect(L.lesson).toMatch(/adoption ran ahead of the governing/);
  });

  it('says why an advertisement was used at all', () => {
    expect(L.lesson).toMatch(/ignored unless it bears on the lesson/);
    expect(L.lesson).toMatch(/the subject line is the lesson/);
  });
});

describe('the Word is quoted AND reasoned, not pasted onto a headline (DR-0281)', () => {
  it('takes the due-order verse apart clause by clause rather than citing it', () => {
    expect(L.lesson).toMatch(/Four things sit inside that one verse/);
    expect(L.lesson).toMatch(/located in a method/);
    expect(L.lesson).toMatch(/dated, at the first/);
    expect(L.lesson).toMatch(/The pronoun is us/);
    expect(L.lesson).toMatch(/a due order is a thing that can be sought/);
  });

  it('reads Eli’s actions as a complete record before naming the word it lacks', () => {
    expect(L.lesson).toMatch(/Informed\. Enquired\. Recorded the concern\. Escalated the principle\./);
    expect(L.lesson).toMatch(/Restrained\. Not informed, not concerned, not minuted/);
    expect(L.lesson).toContain('In that day I will perform against Eli all things which I have spoken concerning his house');
  });

  it('gives the mechanism of the breach from the text, not from sentiment', () => {
    expect(L.lesson).toMatch(/Shoulders do not stumble/);
    expect(L.lesson).toMatch(/introduced a failure mode the shoulders did not have/);
  });

  it('names what the parade had, and that joy is not a control', () => {
    expect(L.lesson).toMatch(/Right intention\. Consensus, all Israel\. Investment, a new cart\./);
    expect(L.lesson).toMatch(/joy, which is the thing most often mistaken for confirmation/);
  });

  it('sets the three stages against the two failures and lands on operations', () => {
    expect(L.lesson).toMatch(/Oversight without adoption is Eli/);
    expect(L.lesson).toMatch(/Adoption without oversight is the new cart/);
    expect(L.lesson).toMatch(/the ark went up on shoulders or it did not/);
  });

  it('puts the overseer inside the consequence of the warning clause', () => {
    expect(L.lesson).toContain('so wrath come upon you, and upon your brethren');
    expect(L.lesson).toMatch(/he is inside it/);
  });

  it('carries the three-question test, each answer needing a name and a date', () => {
    expect(L.lesson).toMatch(/Who may stop this, and have they ever stopped anything/);
    expect(L.lesson).toMatch(/on which day was the measurement taken/);
    expect(L.lesson).toMatch(/Whose shoulder is actually under it on an ordinary Tuesday/);
  });

  it('says where this house is still a ceremony instead of claiming it is not', () => {
    expect(L.lesson).toMatch(/Now the honest half/);
    expect(L.lesson).toMatch(/a minute book with better formatting/);
    expect(L.lesson).toMatch(/precisely the authority Eli held and did not use/);
    expect(L.lesson).toMatch(/rather than letting a green check speak for a shoulder/);
  });

  it('confesses Jesus as the Lamb and the Eternal Son in the close', () => {
    expect(L.lesson).toMatch(/Behold the Lamb of Yahweh/);
    expect(L.lesson).toContain('Behold the Lamb of God, which taketh away the sin of the world');
    expect(L.lesson).toContain('that he gave his only begotten Son');
    expect(L.lesson).toContain('Thy throne, O God, is for ever and ever');
  });

  it('every band carries the thesis, the warning and the remedy by their own text', () => {
    for (const span of IN_EVERY_BAND) {
      for (const k of PLACES) expect(TEXTS[k], `${k} does not carry: ${span.slice(0, 40)}`).toContain(span);
    }
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the child friend line names child and only child, while the pooled check stays green', () => {
    const child = L.levels.child;
    const friend = /Friend to friend, tell a friend this week[^.]*\./.exec(child);
    expect(friend, 'the child band’s friend sentence is not where this test expects it').toBeTruthy();
    const stripped = { ...L, levels: { ...L.levels, child: child.replace(friend[0], '') } };
    expect(placesMissingDirections(stripped)).toEqual([{ place: 'child', missing: ['friends'] }]);
    expect(hasAllThree(stripped)).toBe(true);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);

  it('each band is a real share of the adult lesson', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
    expect(full.bands.child.share).toBeGreaterThanOrEqual(FULL_FLOOR.child);
  });

  it('reads as a ladder, and the child band is inside its own age range', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [['child', 'youth'], ['youth', 'teen'], ['teen', 'senior']]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });

  it('no band is a reworded copy of another, and the worst pair is far under the ceiling', () => {
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.worst).toBeLessThan(0.15);
  });

  it('PROVEN TO CATCH: a senior band copied from teen fails the differentiation gate', () => {
    const faked = { ...L, levels: { ...L.levels, senior: L.levels.teen } };
    expect(duplicatedBands(measureDifferentiation(faked), DIFF_CEILING)).toContain('teen~senior');
  });

  it('each band is written from its OWN material, proven by an illustration no other band uses', () => {
    expect(L.levels.child).toMatch(/badge/i);
    expect(L.levels.youth).toMatch(/treasurer/i);
    expect(L.levels.teen).toMatch(/permit/i);
    expect(L.levels.senior).toMatch(/minute book|ordination/i);
    // and the illustration does not leak into the adult lesson
    expect(L.lesson).not.toMatch(/treasurer|learner.s permit/i);
  });
});

describe('the reader meets numbered points, in order, with nothing skipped', () => {
  it('the lesson’s own headings number from one and stay contiguous', () => {
    const ns = formatLessonText(L.lesson).items.filter((i) => i.kind === 'heading').map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(12);
    expect(ns[0]).toBe(1);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });

  it('no band opens a sentence with an ordinal the formatter would read as a heading', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], k).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH)\b[,.]/);
    }
  });

  it('carries no doubled word in any string', () => {
    const doubled = [];
    for (const t of EVERY_STRING) {
      for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    }
    expect(doubled).toEqual([]);
  });
});
