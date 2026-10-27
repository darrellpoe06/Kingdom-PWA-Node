// =============================================================================
// sov51 — every verse it stands on is the KJV corpus, verbatim
// =============================================================================
// Darrell forwarded a TLDR technology digest into the app on 2026-09-30 with one
// word above it: "Lessons." He named no item and asked no question, so the
// digest is the WHOLE of the source, and the lesson says that in its own prose
// rather than inventing an intention and teaching it back. This test pins that
// honesty along with the verses.
//
// THE THROUGH-LINE WAS CHOSEN BY MEASUREMENT, and the first candidate was
// thrown away because of it. A fourteen-item digest is not fourteen lessons, so
// the items were read for a common seam. The obvious seam -- speed against
// foundations, the house on the rock, counting the cost -- was measured against
// this course first and is already sov34's whole subject (count the cost before
// you build) and sov38's (the cost of owning). Counted in the catalog BEFORE a
// word was written: Luke 14:28 appears in 8 anchors, Matthew 7:24/26/27 in 3
// each, Proverbs 24:3-4 in 10, Psalms 127:1 in 6, Luke 16:10 in 7,
// 1 Corinthians 4:2 in 5. Writing that lesson would have produced a fifth copy.
// The delegation blueprint was the second candidate and is also taken: Acts
// 6:2-4 and Exodus 18:18/21/22/26 are sov45's and sov42's.
//
// What was FREE, counted and not guessed at: 2 Chronicles 26 (0 anchors, 0
// quoted spans), 1 Samuel 13:11-13 (0), Numbers 18:7 (0), Numbers 16:10 (0),
// Zechariah 11:17 (0), Galatians 6:5 (0), and John 10:11-14 (0 anchors). So the
// untaught seam is not HOW to delegate but WHETHER a given duty transfers at
// all -- the OFFICE -- and the two failures around it: taking up an office that
// is not yours (Uzziah's censer), and resting a duty that IS yours on a hand
// with no stake, which leaves when the wolf comes (the hireling).
//
// What this pins beyond the twenty-three verses:
//   * the curly apostrophe, because the corpus writes "priest’s" (Numbers 18:7,
//     twice) and "king’s" (2 Chronicles 26:21). A straight apostrophe inside a
//     quoted verse is an un-verbatim quote that a span check cannot see when the
//     whole span is consistently wrong.
//   * the DR-0210 bright line: "Yahweh" in OUR prose; the KJV's "God" and "the
//     LORD" live only inside quotations and are never substituted. Five of these
//     verses carry "the LORD" and three carry "God" inside the quotation.
//   * that the lesson body is not a band wearing a second label.
//   * that the digest is handled AS a digest: the seam is named, and the nine
//     items that do not serve it are named as left out rather than padded in.
//   * that the company in the launch-withdrawal item is not slandered -- the
//     report's own "more than fulfilled" is on the page, and the hireling is
//     described rather than accused, which is what the text itself does.
//   * that the array has no HOLE in it, the defect class that put an `undefined`
//     in this catalog when sov48 was spliced in.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SOVEREIGN_AI_MODULES } from '../lib/sovereign-ai-class.js';
import { hasAllThree, placesMissingDirections } from '../lib/talk-together.js';
import { anchorRefs } from '../lib/search-it-out.js';
import { scanQuotedVerses, describeFault, loweredHolyNames, ourVoice, SPAN_WITH_REFERENCE } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { unnamedBands, namesItsLesson } from '../../../scripts/title-in-narrative.mjs';
import { measureLesson, NEW_LESSON_CHILD_CEILING, isInverted } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';

const CORPUS = join(process.cwd(), 'public', 'bible', 'kjv');
const bookCache = new Map();

/** The verse exactly as the corpus on disk has it. No normalisation at all. */
function corpusText(ref) {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) return null;
  const name = m[1].trim().replace(/\s+/g, '');
  try {
    if (!bookCache.has(name)) {
      bookCache.set(name, JSON.parse(readFileSync(join(CORPUS, `${name}.json`), 'utf8')));
    }
  } catch { return null; }
  const chap = bookCache.get(name).chapters[Number(m[2]) - 1];
  if (!chap) return null;
  return chap[Number(m[3]) - 1] ?? null;
}

const SOV51_ID = 'sov51-the-office-that-does-not-transfer';
const L = () => SOVEREIGN_AI_MODULES.find((m) => m.id === SOV51_ID);

// The spans this week's teaching turns on, re-read from the corpus at test time.
const PINNED = [
  // the category: an office is a gift held, not a task assigned
  'Numbers 18:7',
  // failure one: taking up an office that is not yours
  '2 Chronicles 26:16', '2 Chronicles 26:17', '2 Chronicles 26:18',
  '2 Chronicles 26:19', '2 Chronicles 26:20', '2 Chronicles 26:21',
  // why a good man crosses it: the clock
  '1 Samuel 13:11', '1 Samuel 13:12', '1 Samuel 13:13',
  // the reach
  'Numbers 16:10',
  // failure two: a duty rested on a hand with no stake
  'John 10:12', 'John 10:13', 'Zechariah 11:17',
  // the rule
  'Galatians 6:5',
  // the close: the Owner who came Himself
  'John 10:11', 'John 10:14', 'John 1:29', 'John 3:16', 'Hebrews 1:8',
  // growth, the Word's way
  'Galatians 5:22', 'Deuteronomy 6:7', 'Hebrews 3:13',
];

const PLACES = () => {
  const m = L();
  return ['lesson', 'child', 'youth', 'teen', 'senior'].map((k) => ({
    place: k,
    text: k === 'lesson' ? m.lesson : m.levels[k],
  }));
};

const EVERY_TEXT = () => {
  const m = L();
  const out = [m.lesson, m.bigIdea, m.inApp, m.title, m.anchor.theme, ...(m.benefits || [])];
  out.push(...Object.values(m.levels));
  out.push(...Object.values(m.rpe));
  out.push(m.facilitator.howToRun, ...m.facilitator.talkingPoints, ...m.facilitator.discussionPrompts);
  for (const q of m.quiz.questions) out.push(q.q, q.explain, ...q.options);
  for (const s of m.stories || []) out.push(s.title, s.body);
  return out.filter((x) => typeof x === 'string');
};

/** 8-word phrases, the same window the band-differentiation gate uses. */
const shingles = (text, n = 8) => {
  const w = String(text || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  const out = new Set();
  for (let i = 0; i + n <= w.length; i += 1) out.add(w.slice(i, i + n).join(' '));
  return out;
};
const overlap = (a, b) => {
  if (!a.size || !b.size) return 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  let hit = 0;
  for (const s of small) if (big.has(s)) hit += 1;
  return hit / small.size;
};

describe('sov51 — the verses are the corpus, verbatim', () => {
  it('is in the catalog as week 51, uniquely, with all four bands', () => {
    const m = L();
    expect(m, 'sov51 is not in SOVEREIGN_AI_MODULES').toBeTruthy();
    expect(SOVEREIGN_AI_MODULES.filter((x) => x.id === SOV51_ID)).toHaveLength(1);
    expect(SOVEREIGN_AI_MODULES.filter((x) => /^sov51-/.test(x.id))).toHaveLength(1);
    expect(Object.keys(m.levels).sort()).toEqual(['child', 'senior', 'teen', 'youth']);
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(typeof m.levels[band], `band ${band}`).toBe('string');
      expect(m.levels[band].length, `band ${band} is too short to teach`).toBeGreaterThan(1500);
    }
  });

  // What is sov51's to guarantee is its own number and that nobody else claims
  // it. Course-wide contiguity belongs to sovereign-ai-class.test.js, which has
  // the mechanism for an in-flight hold; no single branch can keep that claim
  // when several weeks are written in parallel.
  it('the weeks ascend, uniquely, and this lesson is week 51 alone', () => {
    const n = (id) => Number((String(id).match(/^sov(\d+)-/) || [])[1]);
    const weeks = SOVEREIGN_AI_MODULES.map((m) => n(m.id));
    expect(weeks.every((x) => Number.isFinite(x)), `a module id carries no week: ${weeks.join(',')}`).toBe(true);
    expect(weeks, `weeks ascend: ${weeks.join(',')}`).toEqual([...weeks].sort((a, b) => a - b));
    expect(new Set(weeks).size).toBe(weeks.length);
    expect(n(L().id)).toBe(51);
    expect(weeks.filter((w) => w === 51)).toHaveLength(1);
  });

  // PROVEN TO CATCH. The splice that added sov48 left a double comma behind and
  // put an `undefined` in this array; every id-based check would have THROWN
  // rather than failed, and the catalog would have rendered a hole to a reader.
  it('PROVEN TO CATCH: the modules array has no hole in it', () => {
    expect(SOVEREIGN_AI_MODULES.every((m) => m && typeof m.id === 'string' && m.id)).toBe(true);
    expect(SOVEREIGN_AI_MODULES.length).toBe(Object.keys(SOVEREIGN_AI_MODULES).length);
  });

  it('every quoted span that names a reference IS that verse, character for character', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.faults.map(describeFault)).toEqual([]);
    expect(scan.spans, 'the scan found nothing to check').toBeGreaterThan(100);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every pinned verse is quoted somewhere in the module, as the corpus has it', () => {
    const all = EVERY_TEXT().join('\n');
    const missing = [];
    for (const ref of PINNED) {
      const text = corpusText(ref);
      expect(text, `${ref} does not resolve in the corpus`).toBeTruthy();
      if (!all.includes(text)) missing.push(ref);
    }
    expect(missing, 'pinned verses the module never quotes verbatim').toEqual([]);
  });

  // PROVEN TO CATCH. An altered quotation must fail. Uzziah's rebuke is the
  // sentence the whole lesson turns on, so it is the one tested: swap the
  // corpus's "It appertaineth not unto thee" for a modernised paraphrase and
  // both the span scan and the pinned-verse check must report it, while the real
  // module reads clean.
  it('PROVEN TO CATCH: an altered quotation is reported, and the real text is not', () => {
    const m = L();
    const real = corpusText('2 Chronicles 26:18');
    expect(real).toContain('It appertaineth not unto thee');
    const tampered = {
      ...m,
      lesson: m.lesson.replace(real, real.replace('It appertaineth not unto thee', 'It does not belong to you')),
    };
    expect(tampered.lesson).not.toBe(m.lesson);
    const bad = scanQuotedVerses([tampered], quotedTexts);
    expect(bad.faults.length, 'the altered quotation was not caught').toBeGreaterThan(0);
    expect(bad.verbatim).toBeLessThan(bad.spans);
    // restored: the module as it actually ships
    const good = scanQuotedVerses([m], quotedTexts);
    expect(good.faults).toEqual([]);
    expect(good.verbatim).toBe(good.spans);
  });

  // PROVEN TO CATCH. The corpus writes "priest’s" and "king’s" with a curly
  // apostrophe. A span check cannot see a straight one when the whole span is
  // consistently wrong, which is how sov47 shipped "watchman's" three times.
  it('PROVEN TO CATCH: no quoted verse carries a straight apostrophe where the corpus has a curly one', () => {
    const offenders = [];
    for (const text of EVERY_TEXT()) {
      for (const ref of PINNED) {
        const txt = corpusText(ref);
        if (!txt.includes('’')) continue;
        const words = txt.split(' ');
        for (let i = 0; i + 5 <= words.length; i += 1) {
          const win = words.slice(i, i + 5).join(' ');
          const straight = win.replace(/’/g, "'");
          if (straight !== win && text.includes(straight)) offenders.push(`${ref} — ${straight}`);
        }
      }
    }
    expect(offenders).toEqual([]);
    // and the instrument is live: the verses it guards really do carry one.
    expect(corpusText('Numbers 18:7')).toContain('priest’s');
    expect(corpusText('2 Chronicles 26:21')).toContain('king’s');
  });

  it('no quotation carries an ellipsis, so there is nothing to elide and nothing to stitch', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/"[^"]*(?:\.\.\.|…)[^"]*"\s*\(/.test(all)).toBe(false);
  });
});

describe('sov51 — the anchor holds in BOTH directions', () => {
  it('names every verse the lesson stands on, and each one resolves', () => {
    const refs = anchorRefs(L());
    expect(refs.length).toBe(PINNED.length);
    for (const ref of PINNED) {
      expect(refs, `${ref} is taught but missing from anchor.ref`).toContain(ref);
    }
    const dead = refs.filter((r) => !corpusText(r));
    expect(dead, 'anchor refs that do not resolve in the corpus').toEqual([]);
  });

  it('and names nothing it does not quote — every anchor ref is quoted on the page', () => {
    const quoted = new Set();
    for (const [, text] of quotedTexts(L())) {
      for (const sp of String(text).matchAll(SPAN_WITH_REFERENCE)) {
        quoted.add(`${sp[2].trim()} ${sp[3]}:${sp[4].trim()}`);
      }
    }
    const unquoted = anchorRefs(L()).filter((r) => !quoted.has(r));
    expect(unquoted, 'anchor refs named but never quoted').toEqual([]);
    const unnamed = [...quoted].filter((r) => !anchorRefs(L()).includes(r));
    expect(unnamed, 'verses quoted on the page but absent from anchor.ref').toEqual([]);
  });

  // Search it out derives its links from anchor.ref and never from a typed
  // list, so a verse taught but unnamed there is a verse a reader cannot reach.
  it('does not re-teach the ground another week already holds', () => {
    const mine = new Set(anchorRefs(L()));
    // sov34 and sov38 own counting the cost and the rock against the sand.
    for (const taken of ['Luke 14:28', 'Luke 14:29', 'Luke 14:30', 'Matthew 7:24', 'Matthew 7:26', 'Matthew 7:27', 'Proverbs 24:3', 'Proverbs 24:4', 'Psalms 127:1']) {
      expect(mine.has(taken), `${taken} is sov34/sov38 ground and must not be a spine here`).toBe(false);
    }
    // sov45 and sov42 own the delegation blueprint.
    for (const taken of ['Acts 6:2', 'Acts 6:3', 'Acts 6:4', 'Exodus 18:21', 'Exodus 18:22', 'Exodus 18:26']) {
      expect(mine.has(taken), `${taken} is sov45/sov42 ground and must not be a spine here`).toBe(false);
    }
    // sov40 and sov42 own the shepherds who feed themselves.
    for (const taken of ['Ezekiel 34:2', 'Ezekiel 34:4']) {
      expect(mine.has(taken), `${taken} is sov40/sov42 ground`).toBe(false);
    }
    // And it NAMES those weeks instead, so a reader is sent rather than served
    // the same teaching again.
    const all = EVERY_TEXT().join('\n');
    expect(all).toMatch(/week thirty-four/);
    expect(all).toMatch(/weeks forty-two and forty-five/);
    expect(all).toMatch(/week thirty's/);
    // DR-1185's rule flags a pair at ten or more shared verses in one course.
    for (const other of SOVEREIGN_AI_MODULES) {
      if (!other || other.id === SOV51_ID) continue;
      const theirs = new Set(anchorRefs(other));
      const shared = [...mine].filter((r) => theirs.has(r)).length;
      expect(shared, `${other.id} shares ${shared} verses with sov51`).toBeLessThan(10);
    }
  });
});

describe('sov51 — the provenance is honest about its own limit', () => {
  it('every band says who forwarded it, on the day, and that it was forwarded', () => {
    for (const { place, text } of PLACES()) {
      expect(/Darrell/.test(text), `${place} does not say who forwarded it`).toBe(true);
      expect(/2026-09-30/.test(text), `${place} does not carry the day it arrived`).toBe(true);
      expect(/forwarded/i.test(text), `${place} does not say it was forwarded`).toBe(true);
      expect(/"Lessons\."/.test(text), `${place} does not carry his one word`).toBe(true);
    }
  });

  it('the page says his word is the WHOLE request — no question, no item named', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.youth, L().levels.senior].join('\n');
    expect(/whole of the request|entire request|whole source|whole of the source/i.test(adult), 'the page never states that his one word is all there is').toBe(true);
    expect(/(?:asked no question|no question, no item|did not say which story|named no item)/i.test(adult), 'the page never says he named no item').toBe(true);
    expect(/inventing an intention|inventing an intent|rather than guessed at|pretending to know/i.test(adult), 'the page never refuses to invent an intent for him').toBe(true);
  });

  it('the advertising is named and nothing is taken from it', () => {
    for (const { place, text } of PLACES()) {
      expect(/advertis/i.test(text), `${place} never marks the paid placements as advertising`).toBe(true);
    }
    const all = EVERY_TEXT().join('\n');
    expect(/paid placement/i.test(all)).toBe(true);
    // The sponsors' own claims are deliberately absent from the teaching.
    for (const { place, text } of PLACES()) {
      expect(/\$9T|\$30K|\$3\.30/.test(text), `${place} leans on a sponsor's figure`).toBe(false);
    }
  });

  it('a digest is handled AS a digest: the seam is named and the leave-outs are named', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.youth].join('\n');
    expect(/fourteen items/i.test(adult), 'the page never says how many items arrived').toBe(true);
    expect(/not a round-?up|newsletter with verses/i.test(adult), 'the page never refuses the round-up shape').toBe(true);
    expect(/moves? a responsibility/i.test(adult), 'the page never names the seam').toBe(true);
    // The nine it did not teach, named in the lesson so nobody has to guess.
    for (const left of [/autonomous-aircraft/i, /shared-workspace/i, /enterprise-compute/i, /publisher-payment/i, /astroturfing/i, /advertiser analysis/i, /browser-redesign/i, /mathematician/i, /laboratories should pay/i]) {
      expect(left.test(L().lesson), `the lesson never says it left out ${left}`).toBe(true);
    }
    expect(/nearest miss/i.test(L().lesson), 'the closest leave-out is not named as one').toBe(true);
  });

  it('the vendor announcement is attributed as an announcement, not as a result', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.youth].join('\n');
    expect(/ONGOING RESPONSIBILITIES/.test(adult), 'the phrase the lesson weighs is not on the page').toBe(true);
    expect(/vendor(?:'s)? announcement/i.test(adult), 'the announcement is not attributed as one').toBe(true);
    expect(/(?:no result is claimed|nothing (?:here )?treats it as a measured result|nothing here claims)/i.test(adult)).toBe(true);
  });

  it('the three tiers run, so a truth is not shrunk and a claim is not inflated', () => {
    for (const place of ['lesson', 'teen']) {
      const text = place === 'lesson' ? L().lesson : L().levels[place];
      expect(/ESTABLISHED/.test(text), `${place} never states what is established`).toBe(true);
      expect(/OPEN,/.test(text), `${place} never names the open narrowly`).toBe(true);
      expect(/OVER-REACH/.test(text), `${place} never corrects the over-reach`).toBe(true);
    }
    // Both directions of over-reach, not only the convenient one.
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(/capability was never the qualification/i.test(adult), 'the first over-reach is not answered').toBe(true);
    expect(/nothing may be delegated at all/i.test(adult), 'the second over-reach is not answered').toBe(true);
  });

  // The report says the provider OVER-delivered. A lesson that read it as a
  // moral failure would be slander, and would deserve to be thrown out.
  it('the launch-withdrawal item is read for placement, never as an accusation', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.youth, L().levels.senior].join('\n');
    expect(/more than fulfilled|over-?delivered/i.test(adult), 'the report\'s own over-delivery is not on the page').toBe(true);
    expect(/(?:nobody here is accusing|nothing here accuses|is not accusing that company)/i.test(adult), 'the page never refuses the accusation').toBe(true);
    expect(/withdrawal is lawful/i.test(adult), 'the rule the item yields is missing').toBe(true);
    // The hireling is described, not condemned — which is what John 10 does.
    expect(/(?:not a villain|described rather than accused|No accusation|without a (?:single )?(?:word of|moral) accusation)/i.test(adult)).toBe(true);
    expect(/whose own the sheep are not/.test(adult), 'the text\'s own diagnosis is missing').toBe(true);
  });
});

describe('sov51 — the Word is taught, not debated, and it is run across the Word', () => {
  it('the category comes before any failure, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never establishes that an office is given and kept`).toContain(corpusText('Numbers 18:7'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.youth].join('\n');
    expect(/task is (?:something you )?finish/i.test(adult), 'the task/office distinction is never drawn').toBe(true);
    expect(/service of gift|a service of GIFT/i.test(adult)).toBe(true);
  });

  it('Uzziah is read in sequence, with strength named as the cause, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never names the cause the verse gives`).toContain(corpusText('2 Chronicles 26:16'));
      expect(text, `${place} never reaches the sentence the lesson turns on`).toContain(corpusText('2 Chronicles 26:18'));
      expect(text, `${place} never reaches the cost`).toContain(corpusText('2 Chronicles 26:21'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('2 Chronicles 26:17'));
    expect(adult).toContain(corpusText('2 Chronicles 26:19'));
    expect(adult).toContain(corpusText('2 Chronicles 26:20'));
    // The point that is easy to miss: it is not a competence judgment.
    expect(/not (?:a )?"?you (?:are bad at this|would do it badly)/i.test(adult) || /not a competence judgment/i.test(adult)).toBe(true);
    expect(/examiner was never given to the examined/i.test(adult), 'the self-policing read is missing').toBe(true);
  });

  it('Gilgal supplies the commonest cause, and the pressure is granted as real', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.youth, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('1 Samuel 13:11'));
    expect(adult).toContain(corpusText('1 Samuel 13:12'));
    expect(adult).toContain(corpusText('1 Samuel 13:13'));
    expect(/I forced myself therefore/.test(adult), 'the sentence the movement turns on is missing').toBe(true);
    expect(/(?:pressure was real|real pressure)/i.test(adult), 'the page never grants that the pressure was real').toBe(true);
    expect(/was not a defence/i.test(adult), 'the page never says it was no defence').toBe(true);
    // Reported intentions are marked as intentions, never as outcomes.
    expect(/stated intentions, not (?:measured )?(?:outcomes|results)|reported INTENTIONS/i.test(adult)).toBe(true);
  });

  it('the hireling clause and the Owner are both on the page, in every band', () => {
    for (const { place, text } of PLACES()) {
      expect(text, `${place} never reaches the hireling`).toContain(corpusText('John 10:12'));
      expect(text, `${place} never reaches the reason he flees`).toContain(corpusText('John 10:13'));
      expect(text, `${place} never reaches the good shepherd`).toContain(corpusText('John 10:11'));
      expect(text, `${place} never reaches the One who knows His sheep`).toContain(corpusText('John 10:14'));
    }
    const adult = [L().lesson, L().levels.teen, L().levels.youth, L().levels.senior].join('\n');
    expect(adult).toContain(corpusText('Zechariah 11:17'));
    expect(/had the flock and left it/i.test(adult), 'the woe is not aimed where Scripture aims it').toBe(true);
    expect(/(?:honours hired labour|honours hired work)/i.test(adult), 'the page never protects hired work from contempt').toBe(true);
  });

  it('the reach is named, and the rule is the eight words', () => {
    const adult = [L().lesson, L().levels.teen, L().levels.youth].join('\n');
    expect(adult).toContain(corpusText('Numbers 16:10'));
    for (const { place, text } of PLACES()) {
      expect(text, `${place} drops the rule`).toContain(corpusText('Galatians 6:5'));
    }
    expect(/same chapter commands/i.test(adult), 'the page never says burdens ARE shared').toBe(true);
  });

  it('the three-question test is on the page, and names a person rather than a team', () => {
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(/task or (?:an )?office/i.test(adult)).toBe(true);
    expect(/not a (?:team|department) and not a tool|never a department|not a team and not a tool/i.test(adult)).toBe(true);
    expect(/lawfully stops/i.test(adult)).toBe(true);
    expect(/already been dropped/i.test(adult), 'the finding the test produces is missing').toBe(true);
  });
});

describe('sov51 — typographic theology holds on every surface', () => {
  it('our own voice says Yahweh', () => {
    for (const { place, text } of PLACES()) {
      expect(/Yahweh/.test(text), `${place} never names Yahweh`).toBe(true);
    }
  });

  it('the KJV\'s own "the LORD" and "God" are untouched inside the quotations', () => {
    const all = EVERY_TEXT().join('\n');
    expect(all).toContain(corpusText('2 Chronicles 26:16'));  // "...against the LORD his God..."
    expect(all).toContain(corpusText('2 Chronicles 26:18'));  // "...from the LORD God."
    expect(all).toContain(corpusText('1 Samuel 13:13'));      // "...the LORD thy God..."
    expect(all).toContain(corpusText('John 1:29'));           // "Behold the Lamb of God..."
    expect(all).toContain(corpusText('John 3:16'));           // "For God so loved the world..."
  });

  // DR-0210 / DR-0076: "Yahweh" is ours to say; "God" and "the LORD" belong to
  // the quotation and are never substituted into it nor introduced into our own
  // prose.
  it('and neither word is ever in our own prose', () => {
    for (const { place, text } of PLACES()) {
      const ours = ourVoice(text);
      expect(/\bGod\b/.test(ours), `${place}: "God" in our own prose`).toBe(false);
      expect(/\bthe LORD\b/.test(ours), `${place}: "the LORD" in our own prose`).toBe(false);
    }
  });

  it('Jesus is confessed as the Lamb and the Eternal Son of Yahweh', () => {
    const all = EVERY_TEXT().join('\n');
    expect(/Lamb of Yahweh/.test(all)).toBe(true);
    expect(/Eternal Son of Yahweh/.test(all)).toBe(true);
    expect(all).toContain(corpusText('John 1:29'));
    expect(all).toContain(corpusText('John 3:16'));
    expect(all).toContain(corpusText('Hebrews 1:8'));
  });

  it('no holy name is lowercased in our own voice', () => {
    for (const { place, text } of PLACES()) {
      expect(loweredHolyNames(ourVoice(text)), `${place} lowercases a holy name`).toEqual([]);
    }
  });

  it('no adversary name is capitalised, anywhere', () => {
    const all = EVERY_TEXT().join('\n');
    for (const bad of ['Satan', 'Lucifer', 'The Devil', 'The Adversary', 'The Deceiver', 'The Accuser', 'Baal']) {
      expect(all.includes(bad), `${bad} is capitalised`).toBe(false);
    }
  });

  it('no decision-record id reaches a reader', () => {
    for (const { place, text } of PLACES()) {
      expect(/DR-\d{4}/.test(text), `${place} shows a decision-record id to a reader`).toBe(false);
    }
  });
});

describe('sov51 — every band sends the reader in all three directions', () => {
  it('the module carries all three, and no band is short of one', () => {
    expect(hasAllThree(L())).toBe(true);
    expect(placesMissingDirections(L())).toEqual([]);
  });

  it('every band carries the skill and the rhythm in the lesson\'s own words', () => {
    for (const { place, text } of PLACES()) {
      expect(/TALK ABOUT IT TOGETHER/.test(text), `${place} has no close`).toBe(true);
      expect(/listen all the way to the end/i.test(text), `${place} drops the listening skill`).toBe(true);
      expect(/retell/i.test(text), `${place} drops the retelling skill`).toBe(true);
      expect(/teach them one verse back/i.test(text), `${place} drops teaching one verse back`).toBe(true);
      expect(/once today/i.test(text), `${place} drops the rhythm`).toBe(true);
      expect(/four places of Deuteronomy 6:7/.test(text), `${place} drops the four places`).toBe(true);
      expect(/one friend this week/i.test(text), `${place} drops the friend rhythm`).toBe(true);
    }
  });

  // PROVEN TO CATCH (DR-0795). hasAllThree POOLS the whole module, so one band
  // can carry the friend line while another carries the parent line and the
  // module still reads whole — while a reader who only ever opens the teen band
  // is sent nowhere. Strip the teen band's friend line ALONE: the per-band check
  // must name teen, and the pooled check must still read green, which is exactly
  // why the per-band one exists.
  it('PROVEN TO CATCH: one band stripped of its friend line is named, and the pooled check still passes', () => {
    const m = L();
    const stripped = {
      ...m,
      levels: { ...m.levels, teen: m.levels.teen.replace(/Friend to friend, each name one thing[^.]*\./, '') },
    };
    expect(stripped.levels.teen, 'the strip did not change the teen band').not.toBe(m.levels.teen);
    const short = placesMissingDirections(stripped);
    expect(short.map((p) => p.place)).toContain('teen');
    expect(short.find((p) => p.place === 'teen').missing).toContain('friends');
    expect(hasAllThree(stripped), 'the pooled check should still read whole — that is the point').toBe(true);
    expect(placesMissingDirections(m), 'the real module is short of nothing').toEqual([]);
  });

  it('growth is measured the Word\'s way, qualitative and quantitative', () => {
    const adult = [L().lesson, L().levels.teen].join('\n');
    expect(adult).toContain(corpusText('Galatians 5:22'));
    expect(adult).toContain(corpusText('Deuteronomy 6:7'));
    expect(adult).toContain(corpusText('Hebrews 3:13'));
  });
});

describe('sov51 — four bands, genuinely differentiated, each at its own level', () => {
  it('no band is unnamed in its opening window', () => {
    expect(unnamedBands(L())).toEqual([]);
    for (const band of ['child', 'youth', 'teen', 'senior']) {
      expect(namesItsLesson(L().title, L().levels[band]), `${band} does not name its lesson`).toBe(true);
    }
  });

  it('the child band reads at a child\'s level and the ladder is not inverted', () => {
    const measured = measureLesson(L());
    expect(measured.bands.child.authored).toBeLessThanOrEqual(NEW_LESSON_CHILD_CEILING);
    expect(isInverted(measured), `ladder inverted: ${JSON.stringify(measured.bands)}`).toBe(false);
  });

  it('the four bands are four lessons, not one lesson four times', () => {
    expect(measureDifferentiation(L()).worst).toBeLessThan(DIFF_CEILING);
  });

  // PROVEN TO CATCH. Re-registering one band as another is the defect this
  // ceiling exists for, and it must fail while the real module passes.
  it('PROVEN TO CATCH: re-registering the teen band as the youth band is caught', () => {
    const m = L();
    const doubled = { ...m, levels: { ...m.levels, youth: m.levels.teen } };
    expect(measureDifferentiation(doubled).worst).toBeGreaterThanOrEqual(DIFF_CEILING);
    expect(measureDifferentiation(m).worst).toBeLessThan(DIFF_CEILING);
  });

  // PROVEN TO CATCH. sov48's first draft built the lesson body out of its teen
  // band and read 0.995 against it. band-differentiation compares the four bands
  // to each other and never to the lesson, so nothing else in the house would
  // say so.
  it('PROVEN TO CATCH: the lesson body is not a band wearing a second label', () => {
    const body = shingles(L().lesson);
    for (const k of ['child', 'youth', 'teen', 'senior']) {
      const o = overlap(body, shingles(L().levels[k]));
      expect(o, `lesson~${k} overlap ${o.toFixed(3)}`).toBeLessThan(0.5);
    }
  });

  // PROVEN TO CATCH. An opening that drifts off its subject must be named, and
  // the real child band must not be.
  it('PROVEN TO CATCH: an opening that drops the title is named, and the real child band is not', () => {
    const m = L();
    const drift = 'Here we begin somewhere else entirely. Nothing in these first lines says what we study today. We talk about the weather, the drive over, the snack table, the chairs, and the long slow week now behind us, and we keep talking about those things for a good while longer than anybody needs. ' + m.levels.child;
    expect(unnamedBands({ ...m, levels: { ...m.levels, child: drift } })).toContain('child');
    expect(unnamedBands(m)).toEqual([]);
  });
});
