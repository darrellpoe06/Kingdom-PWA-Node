// @vitest-environment node
// =============================================================================
// econ9 — The engine and the reserve: what the labor built, and a storehouse
// of our own (Kingdom Economics, DR-1402)
// =============================================================================
// A spoken teaching, Darrell 2026-11-10: how profitable the African American
// community has been for America since its beginning; what the arithmetic says
// had that engine of work never existed; and how to become an engine for our own
// situations while still fueling everything else, by a reserve the community
// owns and governs, outside government or anybody.
//
// THIS LESSON'S TWO DANGERS are the two DR-0100 names. Under-claiming: hedging
// measured history into "nobody knows". Over-claiming: staking a disputed figure
// as settled. So the measured facts are pinned as stated plainly, in the bands
// that carry them, each with a source carrying publisher, url and as-of date;
// the one disputed claim (the share of growth through cotton) is pinned as named
// and NARROW; and a check refuses the hedge words anywhere. The reserve
// arithmetic is recomputed here, not trusted.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ECON_MODULES, ECON_META, econSources } from '../lib/economics-class.js';
import { measureFullness, shortBands, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { NEW_LESSON_CHILD_CEILING, measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, duplicatedBands, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { placesMissingDirections, hasAllThree } from '../lib/talk-together.js';
import { formatLessonText } from '../lib/lesson-format.js';
import { elidedQuotations, recitedRecords } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands } from '../../../scripts/title-in-narrative.mjs';
import { anchorRefs } from '../lib/search-it-out.js';

const ID = 'econ9-the-engine-and-the-reserve';
const BANDS = ['child', 'youth', 'teen', 'senior'];
const L = ECON_MODULES.find((m) => m.id === ID);
const TEXTS = L ? { adult: L.lesson, ...Object.fromEntries(BANDS.map((b) => [b, L.levels[b]])) } : {};
const PLACES = Object.keys(TEXTS);

function* strings(node) {
  if (typeof node === 'string') {
    yield node;
    return;
  }
  if (Array.isArray(node)) {
    for (const v of node) yield* strings(v);
    return;
  }
  if (node && typeof node === 'object') for (const v of Object.values(node)) yield* strings(v);
}
// Reader-facing strings only: the sources list carries claims in our register
// and is checked on its own below.
const READER = L ? [...strings({ ...L, sources: undefined })] : [];

const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const cache = {};
function chapter(book, ch) {
  const file = join(KJV, `${String(book).replace(/\s+/g, '')}.json`);
  if (!existsSync(file)) return null;
  if (!cache[file]) cache[file] = JSON.parse(readFileSync(file, 'utf8'));
  return cache[file].chapters[Number(ch) - 1] || null;
}
function corpusText(ref) {
  const out = [];
  for (const piece of String(ref)
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)) {
    const m = /^((?:[1-3]\s*)?[A-Za-z]+)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(piece);
    if (!m) return null;
    const chap = chapter(m[1], m[2]);
    if (!chap) return null;
    const to = m[4] ? Number(m[4]) : Number(m[3]);
    for (let v = Number(m[3]); v <= to; v += 1) {
      if (chap[v - 1] == null) return null;
      out.push(chap[v - 1]);
    }
  }
  return out.join(' ');
}
function quotedPairs(text) {
  const parts = String(text).split('"');
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    const m = /^\s*\(([^)]+)\)/.exec(parts[i + 1] || '');
    out.push({ inside: parts[i], ref: m ? m[1] : null });
  }
  return out;
}
function verbatimFaults(texts) {
  const faults = [];
  for (const t of texts) {
    for (const { inside, ref } of quotedPairs(t)) {
      if (!ref) continue;
      const verse = corpusText(ref);
      if (verse == null) {
        faults.push(`unresolved reference (${ref})`);
        continue;
      }
      const bare = inside.replace(/^[,;:.\s]+|[,;:\s]+$/g, '');
      if (!verse.includes(bare)) faults.push(`(${ref}) is not the verse: ${inside.slice(0, 70)}`);
    }
  }
  return faults;
}
const parse = (r) => {
  const m = /^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/.exec(r);
  return m && { book: m[1], ch: +m[2], a: +m[3], b: +(m[4] || m[3]) };
};

// THE SPINE, pinned by literal text read out of the corpus before it was written.
const SPINE = [
  ['Jeremiah 22:13', 'that useth his neighbour’s service without wages, and giveth him not for his work'],
  ['Leviticus 19:13', 'the wages of him that is hired shall not abide with thee all night until the morning'],
  ['Deuteronomy 15:13-14', 'thou shalt not let him go away empty: Thou shalt furnish him liberally'],
  ['Proverbs 21:20', 'There is treasure to be desired and oil in the dwelling of the wise; but a foolish man spendeth it up.'],
  ['Proverbs 30:25', 'The ants are a people not strong, yet they prepare their meat in the summer'],
  ['1 Corinthians 16:2', 'Upon the first day of the week let every one of you lay by him in store, as God hath prospered him'],
  ['Leviticus 25:35', 'And if thy brother be waxen poor, and fallen in decay with thee; then thou shalt relieve him'],
  ['Leviticus 25:36', 'Take thou no usury of him, or increase: but fear thy God'],
  ['Galatians 6:10', 'let us do good unto all men, especially unto them who are of the household of faith'],
  ['Jeremiah 29:7', 'seek the peace of the city'],
  ['Romans 13:7', 'Render therefore to all their dues: tribute to whom tribute is due'],
  ['Proverbs 10:22', 'The blessing of the LORD, it maketh rich, and he addeth no sorrow with it.'],
  ['Proverbs 13:22', 'A good man leaveth an inheritance to his children’s children'],
  ['Proverbs 27:17', 'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend'],
];

describe('econ9 is in the course, numbered, and whole', () => {
  it('exists exactly once as the ninth session with all four bands', () => {
    expect(L, `${ID} is not in the course`).toBeTruthy();
    expect(ECON_MODULES.filter((m) => m.id === ID)).toHaveLength(1);
    expect(ECON_MODULES[8].id).toBe(ID);
    expect(ECON_META.weeks).toBe(ECON_MODULES.length);
    expect(ECON_META.format).toMatch(/Self-paced or 9 sessions/);
    for (const b of BANDS) expect(typeof L.levels[b], b).toBe('string');
  });

  it('carries a quiz whose answers are in range, and every anchor resolves and is named in the lesson', () => {
    expect(L.quiz.questions.length).toBeGreaterThanOrEqual(5);
    for (const q of L.quiz.questions) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(String(q.explain).length).toBeGreaterThan(40);
    }
    const refs = anchorRefs(L);
    expect(refs.length).toBe(15);
    const named = [...L.lesson.matchAll(/\(((?:[1-3] )?[A-Z][A-Za-z ]+? \d+:\d+(?:-\d+)?)\)/g)].map((m) => parse(m[1])).filter(Boolean);
    for (const r of refs) {
      expect(corpusText(r), `anchor ref ${r}`).not.toBeNull();
      const p = parse(r);
      const ok = named.some((q) => q.book === p.book && q.ch === p.ch && q.a <= p.b && p.a <= q.b);
      expect(ok, `anchor ${r} is not named in the lesson`).toBe(true);
    }
  });
});

describe('his questions, in his order, rendered for meaning', () => {
  it('the lesson carries all three of his questions and his clarification', () => {
    expect(L.lesson).toMatch(/He asked how profitable the African American community has been for America since its beginning/);
    expect(L.lesson).toMatch(/what the arithmetic would say if that engine of human work/);
    expect(L.lesson).toMatch(/become an engine for our own situations while still fueling other things/);
    expect(L.lesson).toMatch(/He was clear that he is not saying stop everything/);
    expect(L.lesson).toMatch(/outside government or anybody else/);
    for (const k of PLACES) expect(TEXTS[k], `${k}: names Darrell`).toMatch(/Darrell/);
  });
});

describe('the measured history is stated plainly, and the one dispute is named narrowly (DR-0100)', () => {
  it('every band carries the core measured facts', () => {
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: three billion`).toMatch(/three billion dollars/);
      expect(TEXTS[k], `${k}: more than railroads and factories`).toMatch(/railroads|trains/);
      expect(TEXTS[k], `${k}: more than half of exports`).toMatch(/more than half/);
      expect(TEXTS[k], `${k}: sent away empty`).toMatch(/go away empty|sent away (?:empty|with nothing)|let go with nothing/);
    }
    for (const k of ['adult', 'youth', 'teen', 'senior']) {
      expect(TEXTS[k], `${k}: Craemer`).toMatch(/Craemer/);
      expect(TEXTS[k], `${k}: Freedman's bank depositors`).toMatch(/61,000/);
      expect(TEXTS[k], `${k}: Greenwood businesses`).toMatch(/191 Black-owned businesses/);
      expect(TEXTS[k], `${k}: 2022 wealth`).toMatch(/285,000 dollars/);
      expect(TEXTS[k], `${k}: 2022 wealth`).toMatch(/44,900/);
      expect(TEXTS[k], `${k}: Free African Society`).toMatch(/Free African Society/);
      expect(TEXTS[k], `${k}: Maggie Lena Walker`).toMatch(/Maggie Lena Walker/);
    }
  });

  it('names the counterfactual limit and the disputed share, and says it does not erase the measured facts', () => {
    expect(L.lesson).toMatch(/There is no single honest number for an America in which that labor never happened/);
    expect(L.lesson).toMatch(/Alan Olmstead and Paul Rhode/);
    expect(L.lesson).toMatch(/That dispute is real and it is narrow/);
    expect(L.lesson).toMatch(/must never be used to erase them/);
    expect(L.levels.senior).toMatch(/That dispute is real and narrow/);
  });

  it('refuses the false-skeptical hedge anywhere a reader meets it', () => {
    for (const t of READER) expect(t).not.toMatch(/nobody (really )?knows|some say|it is contested whether|allegedly|may or may not have/i);
  });

  it('says in its own prose what was not checked', () => {
    expect(L.lesson).toMatch(/WHAT WE DID NOT CHECK\./);
    expect(L.lesson).toMatch(/Two of those source sites could not be opened directly/);
  });

  it('every source carries a claim, a publisher, a url and an as-of date, and the course lists them', () => {
    const mine = econSources().filter((s) => s.moduleId === ID);
    expect(mine.length).toBeGreaterThanOrEqual(8);
    for (const s of mine) {
      expect(s.claim.length, s.title).toBeGreaterThan(40);
      expect(s.publisher.length).toBeGreaterThan(2);
      expect(s.url).toMatch(/^https:\/\//);
      expect(s.asOf).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    const all = mine.map((s) => s.claim).join(' ');
    for (const fact of ['three billion dollars', 'more than half', '5.9 to 14.2 trillion', '61,000', '191', '285,000', 'one shilling a month', '1903']) {
      expect(all, `no source carries ${fact}`).toContain(fact);
    }
    expect(all).toMatch(/disputed among economic historians/);
  });
});

describe('the reserve: what it needs, what outside government means, and the arithmetic', () => {
  it('names every requirement of a reserve in the lesson', () => {
    expect(L.lesson).toMatch(/WHAT A RESERVE NEEDS\./);
    for (const need of [
      /weekly/,
      /named stewards and open, audited books/,
      /usury/,
      /A legal form the members own/,
      /More than one place to keep it/,
      /teaching/i,
    ]) {
      expect(L.lesson).toMatch(need);
    }
  });

  it('outside government means owned and governed, never hidden from the law', () => {
    expect(L.lesson).toMatch(/Owned and governed by the community, not funded or directed by government/);
    expect(L.lesson).toMatch(/It does not mean hidden from the law/);
    expect(L.levels.teen).toMatch(/not hidden from the law/);
  });

  it('the arithmetic is right, recomputed here, and labeled as arithmetic', () => {
    expect(1000 * 10 * 52).toBe(520000);
    expect(10000 * 10 * 52).toBe(5200000);
    expect(L.lesson).toMatch(/1,000 households each lay by 10 dollars a week, that is 10,000 dollars a week and 520,000 dollars a year/);
    expect(L.lesson).toMatch(/the year's total is 5\.2 million dollars/);
    expect(L.lesson).toMatch(/call it arithmetic, not a promise/);
    expect(L.levels.child).toMatch(/ten families each save one dollar a week, that is ten dollars a week\. After a year, that is five hundred twenty dollars/);
    expect(10 * 1 * 52).toBe(520);
  });

  it('PROVEN TO CATCH: a wrong yearly total is not the arithmetic the lesson pins', () => {
    const wrong = L.lesson.replace('520,000 dollars a year', '52,000 dollars a year');
    expect(wrong).not.toBe(L.lesson);
    expect(/1,000 households each lay by 10 dollars a week, that is 10,000 dollars a week and 520,000 dollars a year/.test(wrong)).toBe(false);
  });

  it('keeps the hand open outward: provide for the household first, and still do good to all', () => {
    expect(L.lesson).toMatch(/STILL FUELING EVERYTHING ELSE\./);
    expect(L.lesson).toMatch(/Provide for the household first and keep the hand open outward/);
  });
});

describe('every verse is the corpus on disk, and the sweep cannot pass vacuously', () => {
  it('each pinned span of the spine is verbatim and present in the lesson', () => {
    for (const [ref, span] of SPINE) {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `${ref}: the pinned span is not in the corpus`).toBe(true);
      expect(L.lesson.includes(span), `${ref}: the lesson does not carry it`).toBe(true);
    }
  });
  it('EVERY referenced quoted span in every reader-facing string is verbatim, and there are enough of them', () => {
    expect(verbatimFaults(READER)).toEqual([]);
    expect(READER.reduce((n, t) => n + quotedPairs(t).filter((p) => p.ref).length, 0)).toBeGreaterThanOrEqual(40);
  });
  it('every double-quoted span carries a reference: nothing of ours is dressed as Scripture', () => {
    const bare = [];
    for (const t of READER) for (const p of quotedPairs(t)) if (!p.ref) bare.push(p.inside.slice(0, 60));
    expect(bare).toEqual([]);
  });
  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    const broken = L.lesson.replace('thou shalt not let him go away empty', 'thou shalt not let him go away poor');
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });
  it('PROVEN TO CATCH: a straight apostrophe where the corpus carries the typographic one is not the verse', () => {
    const broken = L.lesson.replace('neighbour’s service', "neighbour's service");
    expect(broken).not.toBe(L.lesson);
    expect(verbatimFaults([broken]).length).toBeGreaterThan(0);
  });
  it('no quotation is cut, and no decision-record id reaches the reader', () => {
    expect(elidedQuotations(L)).toEqual([]);
    expect(recitedRecords(L)).toEqual([]);
  });
});

describe('our own voice names Yahweh, and the adversary is never capitalised', () => {
  const ourVoice = (t) =>
    String(t)
      .split('"')
      .filter((_, i) => i % 2 === 0)
      .join(' ');
  it('no generic God, GOD or LORD in our authored voice, while the quotations keep them', () => {
    const found = [];
    for (const t of READER) {
      if (t === L.anchor.ref) continue;
      for (const m of ourVoice(t).match(/\b(God|GOD|LORD)\b/g) || []) found.push(`${m} :: ${t.slice(0, 60)}`);
    }
    expect(found).toEqual([]);
    const inQuotes = READER.flatMap((t) => quotedPairs(t).map((p) => p.inside)).join(' ');
    expect(inQuotes).toContain('as God hath prospered him');
  });
  it('names Yahweh in our prose in every band, and never capitalises the adversary', () => {
    for (const k of PLACES) expect(ourVoice(TEXTS[k]), k).toMatch(/\bYahweh\b/);
    expect(READER.join(' ')).not.toMatch(/\b(Satan|Lucifer|Devil|Baal)\b/);
  });
});

describe('every band sends the reader all three ways, and says the core again', () => {
  it('the lesson and all four bands carry their own three directions and the rhythm', () => {
    expect(hasAllThree(L)).toBe(true);
    expect(placesMissingDirections(L)).toEqual([]);
    for (const k of PLACES) {
      expect(TEXTS[k], `${k}: listen`).toMatch(/[Ll]isten (all the way )?to the end|[Ll]isten all the way/);
      expect(TEXTS[k], `${k}: retell`).toMatch(/in (their|your) own words/);
      expect(TEXTS[k], `${k}: the four places`).toMatch(/at the table, on the way, at bedtime, or first thing/);
      expect(TEXTS[k], `${k}: the aim`).toMatch(/until we see that Yahweh has been right/);
    }
  });
  it('the child, youth and teen bands repeat the core on purpose, because overlap brings clarity', () => {
    for (const k of ['child', 'youth', 'teen']) expect(TEXTS[k], k).toMatch(/SAY IT AGAIN\./);
  });
});

describe('the four bands are four bands, measured not claimed', () => {
  const full = measureFullness(L);
  const grades = measureLesson(L);
  it('each band is a real share of the adult lesson, reads as a ladder, and is not a copy', () => {
    expect(shortBands(full, FULL_FLOOR)).toEqual([]);
    expect(isInverted(grades)).toBe(false);
    expect(grades.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    for (const [a, b] of [
      ['child', 'youth'],
      ['youth', 'teen'],
      ['teen', 'senior'],
    ])
      expect(grades.bands[b].authored, `${b} above ${a}`).toBeGreaterThan(grades.bands[a].authored);
    expect(duplicatedBands(measureDifferentiation(L), DIFF_CEILING)).toEqual([]);
  });
  it('every band opens on the whole title, and the lesson numbers its points in order', () => {
    expect(unnamedBands(L)).toEqual([]);
    for (const k of BANDS) expect(TEXTS[k].startsWith('THE ENGINE AND THE RESERVE — what the labor built, and a storehouse of our own.'), k).toBe(true);
    const ns = formatLessonText(L.lesson)
      .items.filter((i) => i.kind === 'heading')
      .map((h) => h.n);
    expect(ns.length).toBeGreaterThanOrEqual(12);
    for (let i = 1; i < ns.length; i += 1) expect(ns[i]).toBe(ns[i - 1] + 1);
  });
  it('carries no doubled word and no ordinal marker', () => {
    const doubled = [];
    for (const t of READER) for (const m of t.match(/\b(\w+)\s+\1\b/gi) || []) if (!/^(that that|had had)$/i.test(m)) doubled.push(m);
    expect(doubled).toEqual([]);
    for (const k of PLACES) expect(TEXTS[k]).not.toMatch(/(?:^|[.!?]\s+)(FIRST|SECOND|THIRD|FOURTH|FIFTH)\b[,.:]/);
  });
});

describe('the two stories are the lesson’s own', () => {
  it('econ9 carries two titled parables on its own spine', async () => {
    const SIDE = (await import('../lib/lesson-stories.json')).default;
    const mine = SIDE['kingdom-economics'][ID];
    expect(mine).toHaveLength(2);
    const anchors = anchorRefs(L);
    for (const s of mine) {
      expect(s.kind).toBe('parable');
      expect(s.body.split(/\s+/).length).toBeGreaterThanOrEqual(100);
      expect(anchors).toContain(s.verse);
    }
    expect(mine.map((s) => s.title)).toEqual(['The Shilling Box', 'Not Empty']);
    expect(mine[0].body).toMatch(/it was ours, it was open, and it was faithful/);
    expect(mine[1].body).toMatch(/nobody would go away empty again/);
  });
});
