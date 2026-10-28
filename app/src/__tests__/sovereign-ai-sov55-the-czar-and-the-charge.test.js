// @vitest-environment node
// =============================================================================
// sov55 — The czar and the charge: and the desk above the desk
// =============================================================================
// Darrell forwarded a daily A.I. newsletter into this course under one word,
// Lessons. Its headline was a man being put in charge of a nation's direction
// on these machines: on 4 October 2026 the Director of National Intelligence
// was named to lead a new federal task force with three other officials and a
// hundred and twenty days to report.
//
// THIS LESSON'S DANGER IS PARTISANSHIP, not fabrication. A political
// appointment invites two failures no verse-count can see: praising an
// administration, or condemning one. Either turns a teaching into a tract. So
// the gate below requires the three tiers to be present BY NAME, requires the
// publication's closing question to be attributed to the publication rather
// than asserted, requires the unverified list to be stated out loud, and
// requires the lesson to say that it takes no side on the administration.
//
// AND THE SECOND DANGER IS A SPINE PASTED ONTO A HEADLINE (DR-0281). A verse
// about rulers that merely sounds apt is decoration. Daniel 4:17 earns the
// place only if its own clauses carry the argument, so the spec asserts the
// reasoning: the decree, the stated intent, the giving, and the clause about
// the basest — which is the clause that makes the verse unusable as propaganda
// in either direction, and is therefore required in every band.
//
// EVERY HOUSE RULE THAT HAS COST A RED PUSH IS PRE-RUN HERE against this
// module before it reaches CI — the gates' own exported functions, never a
// paraphrase of their rules (the ll269 finding: a local re-implementation of
// an enforced gate drifts from it, and its green gets read as the gate's).
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { lessonCreatedDay } from '../lib/lesson-dates.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { formatLessonText } from '../lib/lesson-format.js';

const ID = 'sov55-the-czar-and-the-charge-and-the-desk-above-the-desk';
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

// The spine, pinned by literal text. Every span was fetched from the corpus on
// disk before it was written into the lesson, and each is asserted BOTH to be
// in the corpus and to be carried by the lesson — a span that is verbatim but
// absent would leave the reasoning unpinned.
const SPINE = [
  ['Daniel 4:17', 'the most High ruleth in the kingdom of men, and giveth it to whomsoever he will, and setteth up over it the basest of men'],
  ['Daniel 4:17', 'to the intent that the living may know'],
  ['Daniel 2:21', 'he removeth kings, and setteth up kings'],
  ['Jeremiah 27:5', 'and have given it unto whom it seemed meet unto me'],
  ['John 19:11', 'Thou couldest have no power at all against me, except it were given thee from above'],
  ['Daniel 4:30', 'Is not this great Babylon, that I have built for the house of the kingdom by the might of my power, and for the honour of my majesty?'],
  ['Daniel 4:32', 'until thou know that the most High ruleth in the kingdom of men'],
  ['Daniel 4:37', 'those that walk in pride he is able to abase'],
  ['Luke 16:2', 'give an account of thy stewardship; for thou mayest be no longer steward'],
  ['Luke 12:48', 'unto whomsoever much is given, of him shall be much required'],
  ['James 4:13', 'To day or to morrow we will go into such a city, and continue there a year, and buy and sell, and get gain'],
  ['James 4:15', 'If the Lord will, we shall live, and do this, or that'],
  ['Proverbs 11:14', 'in the multitude of counsellors there is safety'],
  ['Proverbs 29:12', 'If a ruler hearken to lies, all his servants are wicked'],
  ['Proverbs 18:17', 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him'],
  ['Deuteronomy 16:19', 'doth blind the eyes of the wise, and pervert the words of the righteous'],
  ['Deuteronomy 17:18-19', 'read therein all the days of his life'],
  ['1 Samuel 8:17', 'He will take the tenth of your sheep: and ye shall be his servants'],
  ['Daniel 6:4', 'could find none occasion nor fault'],
  ['Daniel 6:5', 'concerning the law of his God'],
  ['Daniel 6:10', 'as he did aforetime'],
  ['Daniel 1:8', 'purposed in his heart'],
  ['Jeremiah 31:33', 'I will put my law in their inward parts, and write it in their hearts'],
  ['Romans 2:15', 'shew the work of the law written in their hearts'],
  ['Isaiah 33:22', 'For the LORD is our judge, the LORD is our lawgiver, the LORD is our king'],
  ['Daniel 5:27', 'Thou art weighed in the balances, and art found wanting'],
  ['1 Timothy 2:1-2', 'For kings, and for all that are in authority'],
  ['Proverbs 21:1', 'The king’s heart is in the hand of the LORD'],
  ['Psalms 146:3', 'Put not your trust in princes'],
];

describe('sov55 is in the course, numbered, dated and whole', () => {
  it('exists exactly once with all four bands and two stories', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
    expect(L.stories).toHaveLength(2);
    expect(L.stories.map((s) => s.tone).sort()).toEqual(['light', 'solemn']);
    for (const s of L.stories) {
      expect(s.kind).toBe('parable');
      expect(String(s.body).trim().split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(corpusText(s.verse), `story verse ${s.verse}`).not.toBeNull();
    }
  });

  // Deliberately NOT asserting that 55 is the highest week. ll268's spec did
  // assert that about itself and the next lesson falsified it within the day
  // (DR-1256). Which week is newest belongs to sovereign-ai-class.test.js.
  it('claims week 55 exactly once, and nothing else claims it', () => {
    const weeks = SOVEREIGN_AI_MODULES.map((m) => /^sov(\d+)-/.exec(m.id)).filter(Boolean).map((m) => Number(m[1]));
    expect(weeks.filter((n) => n === 55)).toEqual([55]);
  });

  it('carries its build day, and an anchor whose every reference resolves', () => {
    expect(lessonCreatedDay('sovereign-ai', ID)).toBe('2026-10-28');
    const refs = String(L.anchor.ref).split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThanOrEqual(40);
    for (const r of refs) expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
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
    expect(referencedCount(EVERY_STRING)).toBeGreaterThanOrEqual(170);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('setteth up over it the basest of men', 'setteth up over it the wisest of men');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });

  it('Yahweh is never inside a quotation, and a planted one is caught', () => {
    for (const t of EVERY_STRING) {
      for (const { inside, ref } of quotedPairs(t)) {
        expect(/\bYahweh\b/.test(inside), `Yahweh inside (${ref || 'no ref'})`).toBe(false);
      }
    }
    const tampered = L.lesson.replace('the most High ruleth in the kingdom of men', 'Yahweh the most High ruleth in the kingdom of men');
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
    expect(inQuotes).toContain('to keep all the words of this law and these statutes');
    expect(inQuotes).toContain('the powers that be are ordained of God');
  });

  it('never capitalises the adversary', () => {
    expect(EVERY_STRING.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });

  // The -our spelling of the color family and the quoted-terminal rule are NOT
  // re-implemented here. american-spelling.test.js and
  // living-lessons-quoted-terminal.test.js own those and run on every push; a
  // second implementation of an enforced gate drifts from it and its green
  // gets mistaken for the gate's (the ll269 finding).
  it('no quoted span carries an ellipsis, and no reader-facing field prints a DR identifier', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
});

describe('the spine is reasoned, not pasted onto a headline (DR-0281)', () => {
  it('walks Daniel 4:17 clause by clause rather than quoting it once', () => {
    expect(L.lesson).toMatch(/the order is the argument/i);
    expect(L.lesson).toMatch(/A decree, first/);
    expect(L.lesson).toMatch(/stated intent/i);
    expect(L.lesson).toMatch(/Then the giving/);
  });

  it('names the clause that blocks BOTH comfortable readings, and says what each would be', () => {
    expect(L.lesson).toMatch(/forbids both of the easy readings/i);
    expect(L.lesson).toMatch(/proof that Yahweh approves of him/);
    expect(L.lesson).toMatch(/proof that Yahweh has lost control of the room/);
  });

  it('carries the basest clause in EVERY band, because it is what keeps the verse off a banner', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k} does not carry the basest clause`).toContain('setteth up over it the basest of men');
    }
  });

  it('teaches the humbling as instruction with a stated end, not as a spectacle', () => {
    expect(L.lesson).toContain('until thou know that the most High ruleth in the kingdom of men');
    expect(L.lesson).toMatch(/He was not destroyed; he was INTERRUPTED/);
  });
});

describe('the three tiers are stated out loud, and the forecast is not taught as fact', () => {
  it('names all three tiers by name in the lesson', () => {
    expect(L.lesson).toContain('ESTABLISHED');
    expect(L.lesson).toContain('ASSERTED');
    expect(L.lesson).toContain('FORECAST');
  });

  it('states the corroborated facts plainly, with the appointment, the four seats and the clock', () => {
    expect(L.lesson).toMatch(/Jay Clayton/);
    expect(L.lesson).toMatch(/Super Intelligence Force/);
    expect(L.lesson).toMatch(/one hundred and twenty days/);
    expect(L.lesson).toMatch(/Federal Trade Commission/);
    expect(L.lesson).toMatch(/Office of Personnel Management/);
    expect(L.lesson).toMatch(/several independent outlets/i);
  });

  it('says out loud what it did NOT verify, rather than repeating it as a finding', () => {
    expect(L.lesson).toMatch(/not confirmed by this house/i);
    expect(L.lesson).toMatch(/We did not verify those/);
    expect(L.lesson).toMatch(/interview we could not reach/i);
  });

  it('attributes the publication’s closing question to the publication and reaches no verdict', () => {
    expect(L.lesson).toMatch(/That question is theirs/);
    expect(L.lesson).toMatch(/It is not a fact, and we will not teach it as one/);
    expect(L.lesson).toMatch(/we are not going to pretend to know the answer/i);
  });

  it('refuses a partisan posture explicitly, and teaches the office instead of the officeholder', () => {
    expect(L.lesson).toMatch(/Nor will this lesson take a side for or against the administration/);
    expect(L.lesson).toMatch(/true no matter who holds it/);
    expect(L.lesson).toMatch(/the principle and not a verdict on a man/);
    expect(L.lesson).toMatch(/We do not know these men's hearts/);
  });

  it('teaches the conflict question as structure — a gift BLINDS — never as an accusation', () => {
    expect(L.lesson).toMatch(/Not that a gift makes a wise man dishonest, but that it BLINDS him/);
    expect(L.lesson).toMatch(/in any administration, of any party, in any century/);
  });

  it('refuses the ads as material', () => {
    expect(L.lesson).toMatch(/sponsor blocks, referral strips and product round-ups are not material/);
    expect(L.lesson).toMatch(/material to STUDY/);
    for (const t of EVERY_STRING) expect(t).not.toMatch(/Shopify|Attio|Sidekick|Vitra|Vorker|Overpath|Omnio|Polylane|Yedric/);
  });
});

describe('it teaches past the man-agreement debate instead of staging it (DR-0098)', () => {
  it('declines the two-chairs framing on the scholars story by name', () => {
    expect(L.lesson).toMatch(/will not stage that as a debate with two chairs/);
    expect(L.lesson).toContain('I will put my law in their inward parts, and write it in their hearts');
    expect(L.lesson).toMatch(/no inward parts to write in/);
  });

  it('stops where the Word is reticent instead of inventing a verdict', () => {
    expect(L.lesson).toMatch(/Where the Word is reticent, we stop/);
    expect(L.lesson).toMatch(/is not a question Scripture answers/);
    expect(L.lesson).toMatch(/in either direction/);
  });

  it('lands the course’s own argument as dependency, and counsels no evasion of any law', () => {
    expect(L.lesson).toMatch(/What changes is DEPENDENCY/);
    expect(L.lesson).toMatch(/counsels no evasion of any law/);
    expect(L.lesson).toContain('the powers that be are ordained of God');
  });

  it('prays for the man by name rather than ending in commentary', () => {
    expect(L.lesson).toMatch(/Pray for Jay Clayton by name/);
    expect(L.lesson).toContain('For kings, and for all that are in authority');
    for (const k of PLACES) expect(TEXTS[k], `${k} never prays for him`).toMatch(/Jay Clayton/);
  });
});

describe('every band sends the reader all three ways (DR-0733 / DR-0795)', () => {
  it('the lesson and all four bands carry their own three directions', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping the child friend line names child and only child, while the pooled check stays green', () => {
    const child = L.levels.child;
    const friend = /Ask a friend this week which of their toys or tools[^.]*\./.exec(child);
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
  });

  it('reads as a ladder, and the child band is inside its own age range', () => {
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [['child', 'youth'], ['youth', 'teen'], ['teen', 'senior']]) {
      expect(grades.bands[b].authored, `${b} should read above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    }
  });

  it('no band is a reworded copy of another', () => {
    // IT WAS NOT, and the reason is worth recording: each band was written from
    // its OWN material rather than from another band's sentences. The child
    // band works a calendar, a hall-monitor badge and a borrowed hammer; youth
    // a team captain, the renaming and three piles; teen the agency levers,
    // a worked example on the three-percent figure and centralizing as a
    // design tradeoff; senior a long memory of commissions, the renaming read
    // as an administrator's instrument, and what to say to a grandchild. The
    // worst pair measured 0.03 against a 0.50 ceiling.
    const d = measureDifferentiation(L);
    expect(duplicatedBands(d, DIFF_CEILING)).toEqual([]);
    expect(d.worst).toBeLessThan(0.3);
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
