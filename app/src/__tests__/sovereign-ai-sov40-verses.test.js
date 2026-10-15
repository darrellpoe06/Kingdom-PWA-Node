// =============================================================================
// sov40 — the leaders use it more than the led, and every verse is the corpus
// =============================================================================
// Darrell forwarded a CompTIA SmartBrief digest on 2026-10-15 with one word on
// it: "Lesson." The source is an advertising-dense trade digest in which every
// news item is a second-hand summary of somebody else's reporting, so the
// headline statistic reaches us at THREE removes and the lesson says so instead
// of laundering a research firm's claim into established fact (DR-0100).
//
// Two of this lesson's own claims make particular checks load-bearing:
//   1. It teaches that a number must be traced to whoever actually claims it.
//      A lesson that teaches that and then misquotes a verse, or prints an
//      unattributed quotation of its own, refutes itself — so the verbatim walk
//      covers every "quote" (Reference) pair in EVERY authored field, and a
//      second check requires every long quoted span to carry a reference.
//   2. It teaches that no worker is untraceable, and prints our own flow-graph
//      numbers as the proof. So the printed figures are checked against the
//      real registry and across the five places a reader meets them.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  SOVEREIGN_AI_MODULES, SOVEREIGN_AI_SESSION_FLOW, SOVEREIGN_AI_SESSION_MINUTES,
} from '../lib/sovereign-ai-class.js';
import { placesMissingDirections } from '../lib/talk-together.js';
import { formatLessonText, lessonShareText } from '../lib/lesson-format.js';
import { parseRunOfShow } from '../lib/presentable.js';
import { SYSTEM_FLOW } from '../../../scripts/system-flow-registry.mjs';

const CORPUS = join(process.cwd(), 'public', 'bible', 'kjv');
const bookCache = new Map();

/** The verse exactly as the corpus on disk has it. No normalisation at all. */
function corpusText(ref) {
  const m = /^(.+?)\s+(\d+):([\d\-,\s]+)$/.exec(String(ref).trim());
  if (!m) return null;
  const base = m[1].trim().replace(/\s+/g, '');
  for (const name of [base, `${base}s`]) {
    try {
      if (!bookCache.has(name)) {
        bookCache.set(name, JSON.parse(readFileSync(join(CORPUS, `${name}.json`), 'utf8')));
      }
    } catch { continue; }
    const chap = bookCache.get(name).chapters[Number(m[2]) - 1];
    if (!chap) return null;
    const nums = [];
    for (const part of m[3].split(',')) {
      const p = part.trim();
      if (!p) continue;
      const range = p.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        const [a, b] = [Number(range[1]), Number(range[2])];
        if (b < a) return null;
        for (let i = a; i <= b; i += 1) nums.push(i);
      } else nums.push(Number(p));
    }
    const parts = nums.map((n) => chap[n - 1]);
    return parts.some((x) => x == null) ? null : parts.join(' ').replace(/\s+/g, ' ').trim();
  }
  return null;
}

// The spans the lesson actually stands on, pinned by hand as well as by the
// walk below. Each is a CONTIGUOUS piece of the verse it names, so the pin is
// re-read from the corpus at test time and never trusted from memory.
const PINNED = {
  'Proverbs 18:13': 'He that answereth a matter before he heareth it, it is folly and shame unto him.',
  'Proverbs 18:17': 'He that is first in his own cause seemeth just; but his neighbour cometh and searcheth him.',
  'Deuteronomy 19:15': 'at the mouth of two witnesses, or at the mouth of three witnesses, shall the matter be established',
  'Galatians 6:3': 'For if a man think himself to be something, when he is nothing, he deceiveth himself.',
  '1 Corinthians 8:2': 'And if any man think that he knoweth any thing, he knoweth nothing yet as he ought to know.',
  'Proverbs 26:12': 'Seest thou a man wise in his own conceit? there is more hope of a fool than of him.',
  'Romans 12:3': 'not to think of himself more highly than he ought to think; but to think soberly',
  'Proverbs 28:26': 'He that trusteth in his own heart is a fool: but whoso walketh wisely, he shall be delivered.',
  'Proverbs 12:1': 'Whoso loveth instruction loveth knowledge: but he that hateth reproof is brutish.',
  'Proverbs 9:9': 'Give instruction to a wise man, and he will be yet wiser',
  'Luke 12:48': 'For unto whomsoever much is given, of him shall be much required',
  'Luke 6:39': 'Can the blind lead the blind? shall they not both fall into the ditch?',
  'Luke 6:40': 'The disciple is not above his master',
  'Proverbs 27:23': 'Be thou diligent to know the state of thy flocks',
  'Ezekiel 34:2': 'should not the shepherds feed the flocks?',
  '1 Peter 5:2': 'Feed the flock of God which is among you, taking the oversight thereof, not by constraint, but willingly',
  'Exodus 31:2': 'See, I have called by name Bezaleel the son of Uri',
  'Exodus 31:3': 'in wisdom, and in understanding, and in knowledge, and in all manner of workmanship',
  'Exodus 35:34': 'And he hath put in his heart that he may teach',
  '2 Timothy 2:2': 'the same commit thou to faithful men, who shall be able to teach others also',
  'Hosea 4:6': 'My people are destroyed for lack of knowledge',
  'Luke 16:2': 'give an account of thy stewardship',
  'Matthew 10:26': 'there is nothing covered, that shall not be revealed; and hid, that shall not be known',
  'Revelation 20:12': 'and the books were opened',
  'Nehemiah 3:1': 'Then Eliashib the high priest rose up with his brethren the priests, and they builded the sheep gate',
  '1 Thessalonians 5:21': 'Prove all things; hold fast that which is good.',
  'Acts 17:11': 'searched the scriptures daily, whether those things were so',
  'Proverbs 24:3': 'Through wisdom is an house builded',
  'Proverbs 24:4': 'And by knowledge shall the chambers be filled with all precious and pleasant riches.',
  'Psalms 127:1': 'Except the LORD build the house, they labour in vain that build it',
  'Colossians 1:17': 'And he is before all things, and by him all things consist.',
  'John 1:29': 'Behold the Lamb of God',
};

// The spans a reader must meet NO MATTER WHICH BAND THEY READ. A reader reads
// one band; a verse carried only on the adult lesson is a verse that reader
// never sees, so the spine of the teaching is required in all five places.
const REQUIRED_EVERYWHERE = [
  'Galatians 6:3', 'Luke 12:48', 'Proverbs 27:23', 'Exodus 35:34', 'Luke 16:2',
  '1 Thessalonians 5:21', 'Proverbs 24:3', 'John 1:29',
];

const lesson = SOVEREIGN_AI_MODULES.find((m) => m.id.startsWith('sov40-'));

const PLACES = () => ['lesson', 'child', 'youth', 'teen', 'senior'].map((k) => ({
  place: k, text: k === 'lesson' ? lesson.lesson : lesson.levels[k],
}));

/** EVERY authored string in the module, not only the prose a reader scrolls. */
const EVERY_TEXT = () => {
  const out = [...PLACES()];
  const push = (place, v) => { if (typeof v === 'string' && v) out.push({ place, text: v }); };
  push('title', lesson.title);
  push('bigIdea', lesson.bigIdea);
  push('inApp', lesson.inApp);
  push('anchor.theme', lesson.anchor && lesson.anchor.theme);
  for (const [k, v] of Object.entries(lesson.rpe || {})) push(`rpe.${k}`, v);
  (lesson.benefits || []).forEach((b, i) => push(`benefits[${i}]`, b));
  const f = lesson.facilitator || {};
  (f.talkingPoints || []).forEach((t, i) => push(`talkingPoints[${i}]`, t));
  push('howToRun', f.howToRun);
  (f.discussionPrompts || []).forEach((p, i) => push(`discussionPrompts[${i}]`, p));
  ((lesson.quiz || {}).questions || []).forEach((q, i) => {
    push(`quiz[${i}].q`, q.q); push(`quiz[${i}].explain`, q.explain);
    (q.options || []).forEach((o, j) => push(`quiz[${i}].options[${j}]`, o));
  });
  return out;
};

/** Our own sentences, with every quotation removed — the band-gate discipline. */
const oursOnly = (t) => String(t).replace(/"[^"]*"/g, ' ');

describe('sov40 — the verses are the corpus, verbatim', () => {
  it('the lesson is in the catalog with all four bands', () => {
    expect(lesson).toBeTruthy();
    expect(Object.keys(lesson.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
  });

  // The ORDER, in both directions — never "sov40 is last" (DR-0791). "Last" was
  // a proxy that turns the NEXT lesson's merge red; the real property is that
  // every earlier week is lower and every later week is higher, which a sibling
  // lane landing week 41 satisfies and a week filed out of order does not.
  it('is week 40, uniquely, and the weeks around it are in order', () => {
    const n = (id) => Number((String(id).match(/^sov(\d+)-/) || [])[1]);
    const weeks = SOVEREIGN_AI_MODULES.map((m) => n(m.id));
    const at = weeks.indexOf(40);
    expect(n(lesson.id)).toBe(40);
    expect(weeks.filter((w) => w === 40)).toHaveLength(1);
    expect(weeks.slice(0, at).every((w) => w < 40), `earlier weeks: ${weeks.slice(0, at)}`).toBe(true);
    expect(weeks.slice(at + 1).every((w) => w > 40), `later weeks: ${weeks.slice(at + 1)}`).toBe(true);
  });

  for (const [ref, span] of Object.entries(PINNED)) {
    it(`${ref} is in the corpus on disk, exactly as we quote it`, () => {
      const verse = corpusText(ref);
      expect(verse, `${ref} does not resolve`).not.toBeNull();
      expect(verse.includes(span), `(${ref}) does not contain:\n  ours  "${span}"\n  verse "${verse}"`).toBe(true);
    });
  }

  it('every pinned span is quoted somewhere in the module beside its reference', () => {
    const all = EVERY_TEXT().map((p) => p.text).join('\n');
    const missing = Object.entries(PINNED).filter(([ref, span]) => !all.includes(`"${span}" (${ref})`)
      && !all.includes(span));
    expect(missing.map(([r]) => r)).toEqual([]);
  });

  it('every quoted span that names a reference is that verse, character for character', () => {
    const RE = /"([^"]{10,})"\s*\(([1-3]?\s?[A-Za-z]+)\s+(\d+):([\d\-,\s]+)\)/g;
    const offenders = [];
    let pairs = 0;
    for (const { place, text } of EVERY_TEXT()) {
      RE.lastIndex = 0;
      let m;
      while ((m = RE.exec(text))) {
        pairs += 1;
        const ref = `${m[2].trim()} ${m[3]}:${m[4].trim()}`;
        const verse = corpusText(ref);
        if (verse === null || !verse.includes(m[1])) offenders.push(`${place} :: ${ref}`);
      }
    }
    expect(pairs).toBeGreaterThan(240); // 261 on 2026-10-15
    expect(offenders, 'a lesson about tracing a claim may not misquote').toEqual([]);
  });

  it('anchor.ref names every verse the lesson stands on, and each one resolves and is quoted (DR-0734)', () => {
    const refs = lesson.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
    expect(refs.length).toBeGreaterThan(45); // 49 on 2026-10-15
    expect(refs.filter((r) => corpusText(r) === null), 'unresolvable references').toEqual([]);
    const all = EVERY_TEXT().map((p) => p.text).join('\n');
    expect(refs.filter((r) => !all.includes(`(${r})`)), 'named in the anchor but never quoted').toEqual([]);
  });

  // The other half of handling a claim honestly: our OWN sentences may not
  // arrive in quotation marks without a source. Quote marks PAIR, so the spans
  // are the odd segments of a split — a global regex here matches the prose
  // BETWEEN two quotations and reports every verse in the lesson as loose.
  it('no long quoted span anywhere in the module lacks its reference', () => {
    const loose = [];
    for (const { place, text } of EVERY_TEXT()) {
      const parts = String(text).split('"');
      for (let i = 1; i < parts.length; i += 2) {
        if (parts[i].trim().length < 10) continue;
        if (/^\s*\([1-3]?\s?[A-Za-z]+\s+\d+:/.test(parts[i + 1] || '')) continue;
        loose.push(`${place} :: "${parts[i].slice(0, 60)}"`);
      }
    }
    expect(loose, 'a claim may not enter in quotation marks unattributed').toEqual([]);
  });

  it('the spine of the teaching reaches a reader in EVERY band, not only the adult lesson', () => {
    for (const { place, text } of PLACES()) {
      for (const ref of REQUIRED_EVERYWHERE) {
        expect(text.includes(PINNED[ref]), `${place} never quotes ${ref}`).toBe(true);
      }
    }
  });
});

describe('sov40 — the source is named honestly, at three removes (DR-0100)', () => {
  it('every band says what the source is and that its advertising is discarded', () => {
    for (const { place, text } of PLACES()) {
      const t = text.toLowerCase();
      expect(t, `${place} never classifies the source`).toMatch(/trade[- ]association|trade digest|news email|news digest/);
      expect(t, `${place} never names the labelled advertising`).toMatch(/advertis|sponsored|\bads\b/);
      expect(t, `${place} never says the advertising is discarded`).toMatch(/discard|threw the ads away|we drop/);
    }
  });

  it('every band says the news is second-hand, so the claim is not first-hand', () => {
    for (const { place, text } of PLACES()) {
      const t = text.toLowerCase();
      expect(t, `${place} never says the item is a summary of someone else's reporting`)
        .toMatch(/summary of (?:a story|an article|somebody else|someone else)|not news the writers saw/);
      expect(t, `${place} never says it is not first-hand`)
        .toMatch(/first-hand|three removes|three steps away/);
    }
  });

  it('every band states the numbers as a CLAIM and says what was never seen', () => {
    for (const { place, text } of PLACES()) {
      const t = text.toLowerCase();
      expect(t, `${place} never calls it a claim`).toMatch(/\bclaim\b/);
      expect(t, `${place} never says the method was unseen`)
        .toMatch(/did not see|never saw|was never published/);
    }
  });

  it('the adult lesson names the research firms, the date and the four figures', () => {
    const l = lesson.lesson;
    expect(l).toContain('Channel V Media');
    expect(l).toContain('Proper Insights and Analytics');
    expect(l).toContain('fifth of October');
    for (const n of ['53.2', '37.9', '18 percent', '27 percent']) expect(l).toContain(n);
    expect(l, 'a percent SIGN never reaches a reader; the word is written out').not.toContain('%');
  });

  it('the forecast in the issue is named as a forecast, never as a measurement', () => {
    for (const place of ['lesson', 'youth', 'teen', 'senior']) {
      const t = (place === 'lesson' ? lesson.lesson : lesson.levels[place]).toLowerCase();
      expect(t, `${place} drops the forecast caveat`).toMatch(/forecast, not a measurement|guess about the future|forecast rather than a measurement/);
    }
  });

  it('both over-reaches are corrected and the datum under them is left standing', () => {
    for (const { place, text } of PLACES()) {
      const t = oursOnly(text).toLowerCase();
      expect(t, `${place} never corrects "the leaders are fine"`).toMatch(/deceiv|wise in his own|superior|conceit|acts? like|act as though|pretend/);
      expect(t, `${place} never refuses contempt for the whole class`)
        .toMatch(/not all of them|rather than all of them|contempt|eighteen in a hundred/);
      expect(t, `${place} drops the datum that survives both corrections`)
        .toMatch(/your own house|own team|own home/);
    }
  });
});

describe('sov40 — the untraceable worker, and this house\'s own trace', () => {
  it('every band teaches that a steward gives an account and that builders are named', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops the account`).toContain(PINNED['Luke 16:2']);
      expect(text, `${place} drops the named builder`).toMatch(/Bezaleel|Eliashib/);
      expect(oursOnly(text).toLowerCase(), `${place} never puts a NAME on the work`)
        .toMatch(/a name on the work|name and a date|name and the date|names the (?:men|workers)/);
    }
  });

  it('every band refuses the delete-timer as an answer to accountability', () => {
    for (const { place, text } of PLACES()) {
      expect(oursOnly(text).toLowerCase(), `${place} lets a timer pass for an account`)
        .toMatch(/not accountability|not accounting|housekeeping|hides the mess/);
    }
  });

  // The lesson prints MEASURED numbers from our own flow graph as its answer to
  // the article's problem. Two risks: the five places drifting apart, and the
  // lesson over-claiming. Both are checked. The live registry may GROW without
  // turning this red — the lesson's sentence is dated on purpose — but it may
  // never be smaller than what the page claims.
  it('the printed flow-graph figures agree across every place and do not over-claim', () => {
    // DIGIT BOUNDARIES, not substrings. The first version of this check used
    // toContain('176') and a mutation that inflated the senior band's figure to
    // 17600 PASSED, because "17600" contains "176" — a gate that cannot fail is
    // itself a lie (DR-0076 section 3), and this one was caught by mutation
    // rather than by reading it.
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops or inflates the measured node count`).toMatch(/(?<!\d)176(?!\d)/);
      expect(text, `${place} drops or inflates the measured connection count`).toMatch(/(?<!\d)439(?!\d)/);
      expect(text, `${place} never dates the measurement`).toMatch(/day this lesson was written|day the lesson was written|this lesson's day/);
    }
    expect(SYSTEM_FLOW.nodes.length, 'the lesson claims more nodes than the registry holds')
      .toBeGreaterThanOrEqual(176);
  });
});

describe('sov40 — the byline we went to check (DR-0076 section 8)', () => {
  // The byline was flagged as probably wrong; the live check found it RIGHT, and
  // the suspicion was the error. A lesson that then printed the suspicion as a
  // finding would be the very failure it is teaching about, so both directions
  // are pinned: the credit is affirmed, and the mis-credit is never asserted.
  it('every band says the credit was checked and was correct', () => {
    for (const { place, text } of PLACES()) {
      const t = text.toLowerCase();
      expect(t, `${place} never names the byline that was checked`).toMatch(/nobel prize in literature|prize for writing/);
      expect(t, `${place} never says the check came back right`)
        .toMatch(/the digest was right|the line was right|the credit was (?:accurate|correct)|we were wrong/);
      expect(t, `${place} never names the suspicion as the thing that was wrong`)
        .toMatch(/the suspicion was not|our head was out of date|we were wrong/);
    }
  });

  it('the award is stated as established fact, with its date, and is never hedged', () => {
    for (const place of ['lesson', 'youth', 'teen', 'senior']) {
      const t = place === 'lesson' ? lesson.lesson : lesson.levels[place];
      expect(t, `${place} drops the announcing body`).toMatch(/Swedish Academy/);
      expect(t, `${place} drops the date of the announcement`).toMatch(/eighth of October, 2026/);
      expect(t.toLowerCase(), `${place} hedges a verified fact`).not.toMatch(/may have won|possibly won|appears to have won/);
    }
  });

  it('the mis-credit is never asserted anywhere in the module', () => {
    for (const { place, text } of EVERY_TEXT()) {
      const t = text.toLowerCase();
      expect(t, `${place} asserts a mis-credit the check disproved`)
        .not.toMatch(/mis-?credit|printed an unverified honour|wrongly credited|did not win/);
    }
  });
});

describe('sov40 — typographic theology holds on every surface', () => {
  it('our own voice says Yahweh and never the generic name (DR-0210)', () => {
    for (const { place, text } of EVERY_TEXT()) {
      expect(oursOnly(text), `${place} uses the generic name in our own voice`).not.toMatch(/\bGod\b/);
    }
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never names Yahweh in our voice`).toContain('Yahweh');
    }
  });

  it('the KJV\'s own "God" and "the LORD" are untouched inside the quotations', () => {
    const all = EVERY_TEXT().map((p) => p.text).join('\n');
    expect(all).toContain('"Feed the flock of God which is among you');
    expect(all).toContain('"Behold the Lamb of God, which taketh away the sin of the world."');
    expect(all).toContain('"Except the LORD build the house, they labour in vain that build it"');
  });

  it('Jesus is confessed as the Lamb and the Eternal Son of Yahweh', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never confesses the Lamb`).toContain('Behold the Lamb of God');
      expect(oursOnly(text), `${place} never names Jesus`).toContain('Jesus');
      expect(oursOnly(text), `${place} never confesses Him as the Lamb of Yahweh`).toMatch(/Lamb of Yahweh/);
    }
    for (const place of ['lesson', 'youth', 'teen', 'senior']) {
      const t = place === 'lesson' ? lesson.lesson : lesson.levels[place];
      expect(t, `${place} drops the Eternal Son`).toMatch(/Eternal Son/);
    }
  });

  it('no adversary name is capitalised, anywhere', () => {
    for (const { place, text } of EVERY_TEXT()) {
      for (const name of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'The Accuser', 'Baal']) {
        expect(text, `${place} capitalises ${name}`).not.toContain(name);
      }
    }
  });

  it('the Resources are capitalised where they are named as the Resources (DR-0530)', () => {
    for (const { place, text } of PLACES()) {
      const ours = oursOnly(text);
      expect(ours, `${place} lowercases Wisdom`).toMatch(/\bWisdom\b/);
      expect(ours, `${place} lowercases Understanding`).toMatch(/\bUnderstanding\b/);
      expect(ours, `${place} lowercases Knowledge`).toMatch(/\bKnowledge\b/);
      expect(ours, `${place} never names them as the Resources`).toMatch(/the Resources/);
    }
    // And never substituted INTO the verses, which carry them lower case.
    const all = EVERY_TEXT().map((p) => p.text).join('\n');
    expect(all).toContain('in wisdom, and in understanding, and in knowledge, and in all manner of workmanship"');
  });

  it('no decision-record id reaches a reader', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} recites a record id`).not.toMatch(/DR-\d{4}/);
    }
    expect(lesson.bigIdea).not.toMatch(/DR-\d{4}/);
    expect(lesson.inApp).not.toMatch(/DR-\d{4}/);
  });
});

describe('sov40 — the fifteen sections are numbered exactly once (DR-0520)', () => {
  const SECTIONS = [
    'WHERE THIS CAME FROM, AND WHAT IT IS.',
    'THE NUMBERS, AND WHOSE NUMBERS THEY ARE.',
    'WHAT WE DID NOT CHECK.',
    'A LEADER WHO PERFORMS WHAT HE DOES NOT KNOW.',
    'THE CURE IS INSTRUCTION, AND IT STINGS.',
    'TO WHOM MUCH IS GIVEN.',
    'KNOW THE STATE OF THY FLOCKS.',
    'THE GIFT CARRIES AN ORDER TO TEACH IT.',
    'THE WORKER WITH NO NAME ON HIS WORK.',
    'WHAT THIS HOUSE DOES ABOUT THE TRACE.',
    'DIRECT AND EVALUATE IS THE TEST.',
    'THE BYLINE WE WENT TO CHECK.',
    'THROUGH WISDOM IS AN HOUSE BUILDED.',
    'TALK ABOUT IT TOGETHER.',
    'YOUR WORK THIS WEEK.',
  ];

  it('every place carries all fifteen sections, in the same order', () => {
    for (const { place, text } of PLACES()) {
      let from = 0;
      for (const s of SECTIONS) {
        const at = text.indexOf(s, from);
        expect(at, `${place} is missing or misorders: ${s}`).toBeGreaterThan(-1);
        from = at + s.length;
      }
    }
  });

  // The formatter is the witness here, not the author. A paragraph that ENDS on
  // a bare "(Reference)" swallows the NEXT heading — the sentence splitter cuts
  // after the quotation's full stop and hands the detector a fragment starting
  // with "(". Two headings were lost that way in the first draft, so the count
  // is asserted equal across all five places rather than assumed.
  it('the formatter finds the same number of headings in every place', () => {
    const counts = PLACES().map(({ place, text }) => ({
      place, n: formatLessonText(text).items.filter((i) => i.kind === 'heading').length,
    }));
    expect(counts[0].n).toBe(15);
    expect(counts.filter((c) => c.n !== 15)).toEqual([]);
  });

  it('the share text numbers its sections and keeps every word', () => {
    const share = lessonShareText(lesson.lesson);
    expect(share).toMatch(/^1\. /m);
    expect(share.replace(/^\d+\.\s/gm, '').replace(/\s+/g, ' ').trim())
      .toBe(String(lesson.lesson).replace(/\s+/g, ' ').trim());
  });

  it('no author numbering remains, which would disable the caps-heading pass', () => {
    const offenders = PLACES().filter(({ text }) => /(?:^|\n\n)(?:MOVEMENT\s+)?(?:ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|[1-9])\.\s+[A-Z]/.test(text));
    expect(offenders.map((o) => o.place)).toEqual([]);
  });
});

describe('sov40 — the facilitator guide is whole', () => {
  it('carries all three facilitator fields', () => {
    const f = lesson.facilitator;
    expect(f.talkingPoints.length).toBeGreaterThan(0);
    expect(typeof f.howToRun).toBe('string');
    expect(f.discussionPrompts.length).toBeGreaterThan(0);
  });

  it('the run of show is the course session flow, and it sums to 75 minutes', () => {
    const segs = parseRunOfShow(lesson.facilitator.howToRun);
    expect(segs.map((s) => s.name)).toEqual(SOVEREIGN_AI_SESSION_FLOW.map((s) => s.name));
    expect(segs.map((s) => s.estimatedMin)).toEqual(SOVEREIGN_AI_SESSION_FLOW.map((s) => s.minutes));
    expect(segs.reduce((t, s) => t + s.estimatedMin, 0)).toBe(SOVEREIGN_AI_SESSION_MINUTES);
    expect(segs.filter((s) => !s.detail)).toEqual([]);
  });

  it('every discussion prompt opens on a verse and then asks something', () => {
    for (const p of lesson.facilitator.discussionPrompts) {
      expect(p, 'a prompt opens with the quotation').toMatch(/^"[^"]+"\s*\([^)]+\)/);
      expect(p.trim(), 'and it ends on a question').toMatch(/\?$/);
    }
  });

  it('the hands-on segment sends the room into the app and into the real count', () => {
    const segs = parseRunOfShow(lesson.facilitator.howToRun);
    const hands = segs.find((s) => s.name === 'Hands-on in the app');
    expect(hands.detail).toMatch(/Sovereign A\.I\./);
    expect(hands.detail.toLowerCase()).toMatch(/count sheet|who uses the tools/);
  });
});

describe('sov40 — every band sends the reader in all three directions', () => {
  it('no place is short of a direction (DR-0733 / DR-0795)', () => {
    expect(placesMissingDirections(lesson)).toEqual([]);
  });
});

describe('sov40 — the quiz answers are real and its explanations are grounded', () => {
  it('every question has a reachable answer and four options', () => {
    for (const q of lesson.quiz.questions) {
      expect(q.options.length).toBe(4);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(typeof q.explain).toBe('string');
      expect(q.explain.length).toBeGreaterThan(40);
    }
  });

  it('the provenance question\'s right answer is the three-removes answer', () => {
    const q = lesson.quiz.questions[0];
    expect(q.q.toLowerCase()).toMatch(/source/);
    expect(q.options[q.answer].toLowerCase()).toMatch(/two named research firms/);
    expect(q.explain).toMatch(/three removes/);
  });
});
