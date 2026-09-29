// @vitest-environment node
// =============================================================================
// L196 — I AM: What the Rest of the Word Tells About Him — Every Occasion the
// Rule Left Out
// =============================================================================
// Darrell, 2026-09-29, after L194 (fifty-four occasions by a stated rule),
// rendered for meaning (DR-0331): a lesson with all of the rest, so we have all
// of them in our curriculum. If people talked about Jesus but not to Him, it did
// not count. If He did not answer, it did not count. Stories from outside the
// four books did not count. Those verses tell about Him too. We kept the rule
// the same all the way through.
//
// What is pinned here, so no later edit can soften it (DR-0604 pattern, DR-0661):
//   1. the six movements are L194's six exclusions, in L194's order, and L194
//      and L196 point at each other (one line each way);
//   2. every count the lesson states is DERIVED from its numbered entries here:
//      per movement, per mark (its own scene / inside the fifty-four / the
//      writer's own word), the five-movement total, and movement six's three
//      parts; a fresh scene is counted in one movement only;
//   3. every "inside the fifty-four: occasion n" names a real L194 occasion;
//   4. every quoted span is the verse it names, on every surface;
//   5. the four scenes found on the way are named and not counted;
//   6. the register gates, measured.
// Each structural check is PROVEN TO CATCH on a deliberately broken copy.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';

const TITLE = 'I AM: What the Rest of the Word Tells About Him — Every Occasion the Rule Left Out';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id.startsWith('ll196-'));
  expect(m, 'L196 must be in the series').toBeTruthy();
  return m;
};
const L194 = () => LIVING_LESSONS_MODULES.find((x) => x.id.startsWith('ll194-'));
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');

// ---------------------------------------------------------------------------
// The numbered entries, read from the adult lesson as it is written.
//   OCCASION m.k: HEAD (refs). ... <mark>.
//   WITNESS n: ...   FORETOLD n: ...
// ---------------------------------------------------------------------------
const MARK_OWN = 'Its own scene.';
const MARK_WRITER = "The writer's own word.";
const MARK_INSIDE = /Inside the fifty-four: occasion (\d+)\.$/;

function entries(lesson) {
  const text = String(lesson);
  const heads = [...text.matchAll(/(OCCASION (\d)\.(\d+)|WITNESS (\d+)|FORETOLD (\d+)): ([^(]*)\(([^)]*)\)/g)];
  return heads.map((h, i) => {
    const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
    // An entry's body stops at the next heading, or at the next ALL-CAPS section
    // head (a movement close, NAMED, PART, FOUND ON THE WAY, THE COUNT).
    let body = text.slice(h.index, end);
    const cut = body.slice(h[0].length).search(/ (MOVEMENT [A-Z]+[,:]|NAMED, NOT COUNTED\.|PART [A-Z]+:|FOUND ON THE WAY\.|THE COUNT, CHECKED\.)/);
    if (cut >= 0) body = body.slice(0, h[0].length + cut);
    body = body.trim();
    const kind = h[2] ? 'occasion' : h[4] ? 'witness' : 'foretold';
    let mark = null;
    let inside = null;
    if (body.endsWith(MARK_OWN)) mark = 'own';
    else if (body.endsWith(MARK_WRITER)) mark = 'writer';
    else if (MARK_INSIDE.test(body)) { mark = 'inside'; inside = Number(body.match(MARK_INSIDE)[1]); }
    return {
      kind,
      movement: h[2] ? Number(h[2]) : 6,
      k: Number(h[3] || h[4] || h[5]),
      head: h[6].trim(),
      refs: h[7].trim(),
      mark,
      inside,
    };
  });
}

const WORDS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX'];

// The stated close of movements one to five, as numbers.
function statedMovementCounts(lesson) {
  const out = {};
  for (const m of String(lesson).matchAll(/MOVEMENT (ONE|TWO|THREE|FOUR|FIVE), COUNTED: (\d+) occasions; (\d+) in scenes of their own, (\d+) inside the fifty-four(?:, (\d+) in the writers' own words)?\./g)) {
    out[WORDS.indexOf(m[1]) + 1] = { total: +m[2], own: +m[3], inside: +m[4], writer: m[5] ? +m[5] : 0 };
  }
  return out;
}

function derivedMovementCounts(list) {
  const out = {};
  for (const e of list.filter((x) => x.kind === 'occasion' && x.movement <= 5)) {
    const c = (out[e.movement] ||= { total: 0, own: 0, inside: 0, writer: 0 });
    c.total += 1;
    c[e.mark] += 1;
  }
  return out;
}

function inOrder(list, movement, kind = 'occasion') {
  const ks = list.filter((e) => e.kind === kind && e.movement === movement).map((e) => e.k);
  return ks.length > 0 && ks.every((k, i) => k === i + 1);
}

describe('L196 is really in the series, and it and L194 point at each other', () => {
  it('carries all nine fields and four authored bands, with I AM in the title', () => {
    const m = L();
    expect(m.title).toBe(TITLE);
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    for (const r of ['John 1:29', 'Matthew 27:54', 'Isaiah 53:7', 'Mark 4:41', 'Matthew 28:6', 'Acts 9:5', 'Revelation 22:13', 'Hebrews 13:8', 'Acts 1:8']) {
      expect(m.anchor.ref).toContain(r);
    }
    expect(m.benefits).toHaveLength(14);
    expect(m.quiz.questions).toHaveLength(6);
    expect(m.facilitator.talkingPoints).toHaveLength(10);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count equals the module count, and L196 comes after every lesson before it', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    // L196 was the last lesson when it landed; L197 (Think Soberly, DR-0663)
    // followed it on 2026-09-29, so the pin is its place, not the end.
    const i196 = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll196-'));
    const i195 = LIVING_LESSONS_MODULES.findIndex((m) => m.id.startsWith('ll195-'));
    expect(i196).toBeGreaterThan(i195);
    expect(LIVING_LESSONS_MODULES.slice(i196 + 1).every((m) => Number(/^ll(\d+)-/.exec(m.id)[1]) > 196)).toBe(true);
  });

  it('L194 carries ONE line pointing here, placed right after its six exclusions, and its fifty-four stand', () => {
    const l = L194().lesson;
    const line = 'All the rest: L196, I AM: What the Rest of the Word Tells About Him — Every Occasion the Rule Left Out, walks every one of these six kinds by the same rule.';
    expect(l.split('All the rest: L196').length - 1).toBe(1);
    expect(l).toContain(`A reader who counts them in will reach a larger number, never a different Christ. ${line}`);
    expect(l).toMatch(/By that rule the four Gospels record fifty-four occasions\./);
  });

  it('L196 names L194 by its number and title at its start', () => {
    expect(L().lesson.slice(0, 400)).toContain('L194, I AM: Who He Said He Was — Every Hearer, All of Them');
    expect(L194().title).toBe('I AM: Who He Said He Was — Every Hearer, All of Them');
  });

  it('carries no color field: nothing here can put red on anything but the Blood (DR-0099)', () => {
    for (const k of Object.keys(L())) expect(/colou?r|highlight/i.test(k), `field ${k}`).toBe(false);
  });
});

describe('the rule is L194’s, kept the same', () => {
  it('Darrell’s request is in the lesson, rendered for its meaning', () => {
    const l = L().lesson;
    expect(l).toContain('if people talked about Jesus but not to Him, it did not count; if He did not answer, it did not count; stories from outside the four books did not count. Those verses tell about Him too. We kept the rule the same all the way through.');
  });

  it('the six movements are L194’s six exclusions, in L194’s order', () => {
    const l = L().lesson;
    const heads = [
      'MOVEMENT ONE: WORDS SPOKEN ABOUT HIM, NOT TO HIM.',
      'MOVEMENT TWO: CHALLENGES HE DID NOT ANSWER ABOUT HIMSELF.',
      'MOVEMENT THREE: CLAIMS MADE BY AN ACT.',
      'MOVEMENT FOUR: HIS PREDICTIONS.',
      'MOVEMENT FIVE: THE CLAIMS IN HIS TEACHING.',
      'MOVEMENT SIX: WHAT THE REST OF THE WORD TELLS.',
    ];
    const at = heads.map((h) => l.indexOf(h));
    for (const [i, a] of at.entries()) expect(a, heads[i]).toBeGreaterThan(-1);
    for (let i = 1; i < at.length; i += 1) expect(at[i]).toBeGreaterThan(at[i - 1]);
    // L194's own exclusion list, in its own order, is what these six answer to.
    const x = L194().lesson;
    const ex = ['First, words others spoke about Him', 'Second, challenges', 'Third, claims made by an act', 'Fourth, His predictions', 'Fifth, the claims woven through His teaching', 'Sixth, everything outside the four Gospels'].map((s) => x.indexOf(s));
    for (let i = 1; i < ex.length; i += 1) expect(ex[i]).toBeGreaterThan(ex[i - 1]);
  });

  it('the unit, the joined parallels, the three marks and the three exclusions are written out in words', () => {
    const l = L().lesson;
    expect(l).toContain('An occasion is still one scene, meaning one time, one place and one set of hearers.');
    expect(l).toContain('the parallels are joined and every reference is given');
    expect(l).toContain('Its own scene means L194 never walked that scene at all.');
    expect(l).toContain('Inside the fifty-four means the words sit inside one of L194\'s scenes');
    expect(l).toContain('The writer\'s own word means a Gospel writer says it in his own telling');
    expect(l).toContain('it is counted once, in the movement where most of its words belong, and the other movement points to it');
    expect(l).toContain('Three things are named and not counted anywhere');
  });
});

describe('every count is derived from the numbered entries, never typed beside them', () => {
  it('movements one to five run 1..n with no gap, and every occasion carries exactly one mark', () => {
    const list = entries(L().lesson);
    for (const m of [1, 2, 3, 4, 5, 6]) expect(inOrder(list, m), `movement ${m} in order`).toBe(true);
    expect(inOrder(list, 6, 'witness')).toBe(true);
    expect(inOrder(list, 6, 'foretold')).toBe(true);
    for (const e of list.filter((x) => x.kind === 'occasion' && x.movement <= 5)) {
      expect(e.mark, `OCCASION ${e.movement}.${e.k} ${e.head} has no mark`).toBeTruthy();
    }
    // The writer's own word belongs to movement one only.
    expect(list.filter((e) => e.mark === 'writer').every((e) => e.movement === 1)).toBe(true);
  });

  it('each movement’s stated count equals the count of its entries, by mark', () => {
    const l = L().lesson;
    const stated = statedMovementCounts(l);
    const derived = derivedMovementCounts(entries(l));
    expect(Object.keys(stated)).toEqual(['1', '2', '3', '4', '5']);
    expect(stated).toEqual(derived);
  });

  it('the five-movement total and its split are the sums of the movements', () => {
    const l = L().lesson;
    const d = Object.values(derivedMovementCounts(entries(l)));
    const sum = (k) => d.reduce((t, c) => t + c[k], 0);
    const m = l.match(/the first five movements gather (\d+) occasions: (\d+), (\d+), (\d+), (\d+) and (\d+)\. Of those, (\d+) stand in scenes of their own that L194 never walked, (\d+) sit inside its fifty-four, and (\d+) are the writers' own words\./);
    expect(m, 'the count sentence must be present').toBeTruthy();
    expect(+m[1]).toBe(sum('total'));
    expect([+m[2], +m[3], +m[4], +m[5], +m[6]]).toEqual(d.map((c) => c.total));
    expect(+m[7]).toBe(sum('own'));
    expect(+m[8]).toBe(sum('inside'));
    expect(+m[9]).toBe(sum('writer'));
    expect(+m[7] + +m[8] + +m[9]).toBe(+m[1]);
  });

  it('movement six’s three parts are counted from their entries, twice over (the close and the checked count)', () => {
    const l = L().lesson;
    const list = entries(l);
    const six = list.filter((e) => e.kind === 'occasion' && e.movement === 6).length;
    const w = list.filter((e) => e.kind === 'witness').length;
    const f = list.filter((e) => e.kind === 'foretold').length;
    expect(l).toContain(`PART ONE, COUNTED: ${six} occasions.`);
    expect(l).toContain(`MOVEMENT SIX, COUNTED: ${six} occasions in part one, ${w} witnesses in part two, ${f} passages in part three.`);
    expect(l).toContain(`Movement six adds ${six} occasions where the risen Lord named Himself, ${w} witnesses and ${f} passages from the prophets.`);
    // The seven churches are seven sets of hearers, so seven occasions.
    expect(list.filter((e) => e.movement === 6 && /^THE CHURCH/.test(e.head))).toHaveLength(7);
  });

  it('the two gathered parts say plainly that they are gatherings, not closed counts', () => {
    const l = L().lesson;
    expect(l).toContain('this part is a gathering, not a closed count');
    expect(l).toContain('This too is a gathering, not a closed count');
    expect(l).toContain('The witnesses and the prophets are gathered, not closed');
  });

  it('a fresh scene is counted in ONE movement only (no own-scene reference set appears twice)', () => {
    const own = entries(L().lesson).filter((e) => e.mark === 'own').map((e) => e.refs);
    expect(new Set(own).size).toBe(own.length);
  });

  it('every "inside the fifty-four" names a real L194 occasion (1..54)', () => {
    const inside = entries(L().lesson).filter((e) => e.mark === 'inside');
    expect(inside.length).toBeGreaterThan(0);
    const real = new Set([...L194().lesson.matchAll(/OCCASION (\d+): /g)].map((x) => Number(x[1])));
    expect(real.size).toBe(54);
    for (const e of inside) expect(real.has(e.inside), `${e.movement}.${e.k} names occasion ${e.inside}`).toBe(true);
  });

  it('PROVEN TO CATCH: a dropped entry, a changed mark, or a hand-typed count breaks the derivation', () => {
    const l = L().lesson;
    // 1. An occasion renamed out of the list: the sequence breaks and the stated count no longer matches.
    const dropped = l.replace('OCCASION 2.5: ', 'ANOTHER SCENE: ');
    expect(inOrder(entries(dropped), 2)).toBe(false);
    expect(statedMovementCounts(dropped)).not.toEqual(derivedMovementCounts(entries(dropped)));
    // 2. One mark changed: movement three's split no longer matches what it states.
    const remarked = l.replace('"Is not this the son of David?" (Matthew 12:23). Inside the fifty-four: occasion 16.', '"Is not this the son of David?" (Matthew 12:23). Its own scene.');
    expect(remarked).not.toBe(l);
    expect(statedMovementCounts(remarked)).not.toEqual(derivedMovementCounts(entries(remarked)));
    // 3. A count typed by hand beside the list: caught.
    const typed = l.replace('MOVEMENT FOUR, COUNTED: 20 occasions;', 'MOVEMENT FOUR, COUNTED: 21 occasions;');
    expect(typed).not.toBe(l);
    expect(statedMovementCounts(typed)).not.toEqual(derivedMovementCounts(entries(typed)));
    // 4. A mark pointing at an occasion L194 does not have.
    const ghost = entries(l.replace('Inside the fifty-four: occasion 53.', 'Inside the fifty-four: occasion 55.'));
    const real = new Set([...L194().lesson.matchAll(/OCCASION (\d+): /g)].map((x) => Number(x[1])));
    expect(ghost.some((e) => e.mark === 'inside' && !real.has(e.inside))).toBe(true);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on EVERY surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans, 'a low count means the scan broke').toBeGreaterThan(700);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('PROVEN TO CATCH: one changed word in one quotation is a fault', () => {
    const broken = { ...L(), lesson: L().lesson.replace('"I am Jesus of Nazareth, whom thou persecutest" (Acts 22:8)', '"I am Jesus of Nazareth, whom thou persecuted" (Acts 22:8)') };
    expect(broken.lesson).not.toBe(L().lesson);
    const scan = scanQuotedVerses([broken], quotedTexts);
    expect(scan.faults.some((f) => f.ref === 'Acts 22:8' && f.kind === 'not-the-verse')).toBe(true);
  });

  it('every double-quoted span carries its reference — a quote means Scripture and nothing else', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
    }
  });

  it('uses straight quotation marks, no ellipsis inside a quotation, and recites no record id', () => {
    const all = ALL();
    expect(all.includes('“')).toBe(false);
    expect(all.includes('”')).toBe(false);
    for (const [where, text] of quotedTexts(L())) {
      for (const span of String(text).matchAll(/"([^"]+)"/g)) {
        expect(/\.\.\.|…/.test(span[1]), `${where} elides inside a quotation`).toBe(false);
      }
      expect(/DR-\d{4}/.test(text), `${where} recites a record id at the reader`).toBe(false);
    }
  });
});

describe('the movements carry the Word they name', () => {
  const carries = (s) => expect(ALL()).toContain(s);

  it('the passages L194 itself named as left out are all here', () => {
    carries('Behold the Lamb of God, which taketh away the sin of the world'); // John 1:29
    carries('Truly this was the Son of God'); // Matthew 27:54
    carries('If thou be the Son of God, command that these stones be made bread'); // Matthew 4:3
    carries('If thou be the Son of God, come down from the cross'); // Matthew 27:40
    carries('Then he questioned with him in many words; but he answered him nothing'); // Luke 23:9
    carries('What manner of man is this, that even the wind and the sea obey him?'); // Mark 4:41
    carries('Who is this that forgiveth sins also?'); // Luke 7:49
    carries('The Son of man is delivered into the hands of men'); // Mark 9:31
    carries('Think not that I am come to destroy the law, or the prophets'); // Matthew 5:17
    carries('Whosoever shall confess me before men, him shall the Son of man also confess before the angels of God'); // Luke 12:8
    carries('Who art thou, Lord? And the Lord said, I am Jesus whom thou persecutest'); // Acts 9:5
    carries('I am he that liveth, and was dead; and, behold, I am alive for evermore'); // Revelation 1:18
  });

  it('the passages the request named outside the Gospels are here', () => {
    for (const s of [
      'I see the heavens opened, and the Son of man standing on the right hand of God', // Acts 7:56
      'God hath made that same Jesus, whom ye have crucified, both Lord and Christ', // Acts 2:36
      'for there is none other name under heaven given among men, whereby we must be saved', // Acts 4:12
      'Who is the image of the invisible God, the firstborn of every creature', // Colossians 1:15
      'Who, being in the form of God, thought it not robbery to be equal with God', // Philippians 2:6
      'Thy throne, O God, is for ever and ever', // Hebrews 1:8
      'Jesus Christ the same yesterday, and to day, and for ever', // Hebrews 13:8
      'God was manifest in the flesh', // 1 Timothy 3:16
      'the glorious appearing of the great God and our Saviour Jesus Christ', // Titus 2:13
      'This is the true God, and eternal life', // 1 John 5:20
      'I am Alpha and Omega, the beginning and the ending, saith the Lord', // Revelation 1:8
      'Worthy is the Lamb that was slain', // Revelation 5:12
      'KING OF KINGS, AND LORD OF LORDS', // Revelation 19:16
      'I am the root and the offspring of David, and the bright and morning star', // Revelation 22:16
      'his name shall be called Wonderful, Counsellor, The mighty God, The everlasting Father, The Prince of Peace', // Isaiah 9:6
      'whose goings forth have been from of old, from everlasting', // Micah 5:2
      'The LORD said unto my Lord, Sit thou at my right hand', // Psalm 110:1
    ]) carries(s);
  });

  it('the scenes found on the way are named, not counted, and L194 is not silently changed', () => {
    const l = L().lesson;
    const found = l.slice(l.indexOf('FOUND ON THE WAY.'), l.indexOf('THE COUNT, CHECKED.'));
    expect(found.length).toBeGreaterThan(0);
    for (const s of ['O my Father, if it be possible, let this cup pass from me', 'Father, forgive them; for they know not what they do', 'Father, into thy hands I commend my spirit', 'A prophet is not without honour, but in his own country']) {
      expect(found).toContain(s);
    }
    expect(found).toContain('They are named here and not counted in this lesson');
    expect(found).not.toMatch(/OCCASION \d/);
    expect(found).toContain('A reader who counts them in will reach a larger number, never a different Christ.');
  });

  it('teaches the Word by the Word: Yahweh’s words applied to Jesus are shown side by side', () => {
    carries('Prepare ye the way of the LORD, make straight in the desert a highway for our God'); // Isaiah 40:3
    carries('That unto me every knee shall bow, every tongue shall swear'); // Isaiah 45:23
    carries('That at the name of Jesus every knee should bow'); // Philippians 2:10
    carries('and they shall look upon me whom they have pierced'); // Zechariah 12:10
    carries('They shall look on him whom they pierced'); // John 19:37
    carries('He maketh the storm a calm, so that the waves thereof are still'); // Psalm 107:29
  });

  it('every surface ends the way this house ends, and the lesson turns the question to the reader', () => {
    const end = 'Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.';
    expect(L().lesson.trimEnd().endsWith(end)).toBe(true);
    expect(L().lesson).toContain('WHICH WITNESS WILL YOU BE?');
    for (const b of FULL_BANDS) {
      expect(L().levels[b].trimEnd().endsWith(end), `${b} ends the way this house ends`).toBe(true);
      expect(L().levels[b], `${b} carries the commission`).toContain('ye shall be witnesses unto me');
    }
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) {
      expect(f.bands[b].share, `${b} share ${f.bands[b].share} under floor ${FULL_FLOOR[b]}`).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
    }
  });

  it('the grades ascend and the child band is held to the age', () => {
    const m = measureLesson(L());
    expect(isInverted(m)).toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING), `child reads ${m.bands.child.authored}`).toBe(false);
  });

  it('the four bands are genuinely different texts', () => {
    const d = measureDifferentiation(L());
    expect(d).toBeTruthy();
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });

  it('every band names its own lesson near its start', () => {
    const m = L();
    for (const b of FULL_BANDS) expect(namesItsLesson(m.title, m.levels[b]), b).toBe(true);
  });
});
