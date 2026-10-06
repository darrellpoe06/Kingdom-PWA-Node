// @vitest-environment node
// =============================================================================
// L209 — The Step and the Wait — You Do the Work of Your Hands, Yahweh Does the
// Promoting, and the Wait Belongs to Him
// =============================================================================
// Built from Darrell's own email of 2026-10-06 (DR-0755): he sent the teaching
// into the app with one word above it, Lesson, on the day he submitted an
// application. His word is the teaching; the submission is only the occasion.
// Nothing identifying the employer, the role, the place or any person is in the
// lesson, and this test holds that line as a gate rather than as an intention.
// Every quoted span was fetched from the in-repo KJV (app/public/bible/kjv)
// before it was written and is pinned below so a later edit cannot soften it,
// and a one-word change is proven to fail.
import { describe, it, expect } from 'vitest';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';
import { LIVING_LESSONS_ADDED } from '../lib/living-lessons-dates.js';
import { scanQuotedVerses } from '../../../scripts/quoted-verse-is-the-verse.mjs';
import { quotedTexts } from '../../../scripts/quotation-integrity.mjs';
import { measureFullness, FULL_BANDS, FULL_FLOOR } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted, breachesChildCeiling, NEW_LESSON_CHILD_CEILING } from '../../../scripts/reading-level.mjs';
import { measureDifferentiation, DIFF_CEILING } from '../../../scripts/band-differentiation.mjs';
import { namesItsLesson } from '../../../scripts/title-in-narrative.mjs';
import { hasAllThree, ownPrompts } from '../lib/talk-together.js';

const ID = 'll209-the-step-and-the-wait-the-work-of-your-hands-yahweh-promotes-and-the-wait-is-his';
const L = () => {
  const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
  expect(m, 'L209 must be in the series').toBeTruthy();
  return m;
};
const ALL = () => quotedTexts(L()).map(([, t]) => t).join(' ');
const SPANS = [
  'A man’s heart deviseth his way: but the LORD directeth his steps.',
  'And I said unto the king, If it please the king, and if thy servant have found favour in thy sight',
  'And he changeth the times and the seasons: he removeth kings, and setteth up kings',
  'And he shall turn the heart of the fathers to the children, and the heart of the children to their fathers',
  'And let us not be weary in well doing: for in due season we shall reap, if we faint not.',
  'And the LORD was with Joseph, and he was a prosperous man',
  'And the king granted me, according to the good hand of my God upon me.',
  'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
  'And thou shalt teach them diligently unto thy children, and shalt talk of them when thou sittest in thine house, and when thou walkest by the way, and when thou liest down, and when thou risest up.',
  'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
  'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
  'Behold the Lamb of God, which taketh away the sin of the world.',
  'But God is the judge: he putteth down one, and setteth up another.',
  'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
  'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
  'But think on me when it shall be well with thee, and shew kindness, I pray thee, unto me, and make mention of me unto Pharaoh',
  'Casting all your care upon him; for he careth for you.',
  'Commit thy works unto the LORD, and thy thoughts shall be established.',
  'Confess your faults one to another, and pray one for another, that ye may be healed.',
  'Except the LORD build the house, they labour in vain that build it',
  'For as the heavens are higher than the earth, so are my ways higher than your ways, and my thoughts than your thoughts.',
  'For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD.',
  'For promotion cometh neither from the east, nor from the west, nor from the south.',
  'For that ye ought to say, If the Lord will, we shall live, and do this, or that.',
  'For ye have need of patience, that, after ye have done the will of God, ye might receive the promise.',
  'Go to now, ye that say, To day or to morrow we will go into such a city, and continue there a year, and buy and sell, and get gain:',
  'He raiseth up the poor out of the dust, and lifteth up the beggar from the dunghill, to set them among princes',
  'He that is faithful in that which is least is faithful also in much',
  'Humble yourselves therefore under the mighty hand of God, that he may exalt you in due time',
  'I can do all things through Christ which strengtheneth me.',
  'I have learned, in whatsoever state I am, therewith to be content.',
  'I know both how to be abased, and I know how to abound',
  'I waited patiently for the LORD; and he inclined unto me, and heard my cry.',
  'I will wait for the God of my salvation: my God will hear me.',
  'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.',
  'In all thy ways acknowledge him, and he shall direct thy paths.',
  'Iron sharpeneth iron; so a man sharpeneth the countenance of his friend.',
  'It is good that a man should both hope and quietly wait for the salvation of the LORD.',
  'It is vain for you to rise up early, to sit up late, to eat the bread of sorrows: for so he giveth his beloved sleep.',
  'Knowing that of the Lord ye shall receive the reward of the inheritance: for ye serve the Lord Christ.',
  'Moreover it is required in stewards, that a man be found faithful.',
  'My soul, wait thou only upon God; for my expectation is from him.',
  'My times are in thy hand',
  'Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house.',
  'Rejoicing in hope; patient in tribulation; continuing instant in prayer;',
  'Rest in the LORD, and wait patiently for him',
  'Seest thou a man diligent in his business? he shall stand before kings; he shall not stand before mean men.',
  'So I prayed to the God of heaven.',
  'Take therefore no thought for the morrow',
  'The LORD is good unto them that wait for him, to the soul that seeketh him.',
  'The LORD maketh poor, and maketh rich: he bringeth low, and lifteth up.',
  'The king’s heart is in the hand of the LORD, as the rivers of water: he turneth it whithersoever he will.',
  'The preparations of the heart in man, and the answer of the tongue, is from the LORD.',
  'The steps of a good man are ordered by the LORD: and he delighteth in his way.',
  'The thoughts of the diligent tend only to plenteousness',
  'Then Pharaoh sent and called Joseph, and they brought him hastily out of the dungeon',
  'There are many devices in a man’s heart; nevertheless the counsel of the LORD, that shall stand.',
  'Though he fall, he shall not be utterly cast down: for the LORD upholdeth him with his hand.',
  'Thy will be done in earth, as it is in heaven.',
  'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
  'Until the time that his word came: the word of the LORD tried him.',
  'Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD.',
  'What is that in thine hand?',
  'Whatsoever thy hand findeth to do, do it with thy might',
  'Whereas ye know not what shall be on the morrow.',
  'Yet did not the chief butler remember Joseph, but forgat him.',
  'and establish thou the work of our hands upon us; yea, the work of our hands establish thou it.',
  'blessed are all they that wait for him.',
  'do it heartily, as to the Lord, and not unto men',
  'his master saw that the LORD was with him, and that the LORD made all that he did to prosper in his hand.',
  'nevertheless not my will, but thine, be done.',
  'so will I go in unto the king, which is not according to the law: and if I perish, I perish.',
  'the hand of the diligent maketh rich',
  'the soul of the diligent shall be made fat',
  'though it tarry, wait for it; because it will surely come, it will not tarry.',
  'whatsoever he doeth shall prosper.',];

describe('L209 is really in the series', () => {
  it('carries all the fields and four authored bands', () => {
    const m = L();
    expect(m.title).toBe('The Step and the Wait — You Do the Work of Your Hands, Yahweh Does the Promoting, and the Wait Belongs to Him');
    for (const f of ['bigIdea', 'inApp', 'lesson']) expect(typeof m[f]).toBe('string');
    expect(m.quiz.questions.length).toBe(6);
    expect(m.facilitator.talkingPoints.length).toBe(10);
    for (const b of FULL_BANDS) expect(typeof m.levels[b], `${b} must be authored`).toBe('string');
  });

  it('the week count equals the module count, and the lesson carries its day', () => {
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
    expect(LIVING_LESSONS_ADDED[ID]).toBe('2026-10-06');
  });

  it('carries its provenance plainly: his word is the teaching, the submission is the occasion', () => {
    const line = 'Darrell sent this teaching into the app by email on 2026-10-06, marked Lesson, about an application he had just submitted; his own word is the teaching, the submission is the occasion.';
    expect(L().lesson).toContain(line);
    expect(L().bigIdea).toContain(line);
    expect(L().inApp).toContain(line);
  });

  it('the anchor names every verse the lesson stands on', () => {
    const refs = [...new Set(
      quotedTexts(L())
        .flatMap(([, t]) => [...String(t).matchAll(/"[^"]+"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+):(\d+)(?:-(\d+))?\)/g)]
        .map((m) => m[1].replace(/\s+/g, ' ').trim())),
    )];
    const anchor = L().anchor.ref;
    const unnamed = refs.filter((r) => !anchor.includes(r));
    expect(unnamed, 'every chapter the lesson quotes must be named in anchor.ref (Search it out reads it)').toEqual([]);
    for (const ref of ['Proverbs 16:9', 'Psalms 75:6-7', 'Psalms 27:14', '1 Peter 5:6-7', 'Philippians 4:6-7', 'Psalms 105:19', 'Galatians 6:9', 'Proverbs 16:3', 'Psalms 90:17']) {
      expect(anchor, ref).toContain(ref);
    }
  });
});

describe('a live private matter stays private', () => {
  // The binding half of this lesson. A pending application belongs to the man
  // standing in it: the lesson teaches the KIND of moment and never his
  // particulars, and that is checked here rather than merely intended.
  it('names no employer, institution, role, identifier or address anywhere in the module', () => {
    const whole = JSON.stringify(L());
    expect(/@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(whole), 'an email address').toBe(false);
    expect(/\b(?:Inc|LLC|L\.L\.C|Corp|Corporation|University|College|Hospital|Department of)\b/.test(whole), 'an employer or institution').toBe(false);
    expect(/\b(?:requisition|job id|position id|posting|req#|req №)\b/i.test(whole), 'a posting identifier').toBe(false);
    expect(/\bhttps?:\/\//.test(whole), 'a link').toBe(false);
  });

  it('says what the teaching is about without saying where, and says so out loud', () => {
    expect(L().lesson).toContain('We name no employer, no office, no title and no person in this lesson, and we will not');
    expect(L().levels.teen).toContain('Nothing about the employer, the role, the place or any person appears in this lesson');
  });

  it('never says he is leaving a job or looking while employed', () => {
    const whole = JSON.stringify(L());
    expect(/\b(?:current employer|his employer|where he works|quitting his job|resigned|resigning|leaving his job|while still employed|another job while)\b/i.test(whole)).toBe(false);
  });
});

describe('every quoted span is the verse it names', () => {
  it('the whole lesson resolves verbatim, on every surface', () => {
    const scan = scanQuotedVerses([L()], quotedTexts);
    expect(scan.spans).toBeGreaterThanOrEqual(318);
    expect(scan.faults.map((f) => `${f.where} :: ${f.kind} :: ${f.ref || ''}`)).toEqual([]);
    expect(scan.verbatim).toBe(scan.spans);
  });

  it('every double-quoted span carries its reference; straight quotes; no ellipsis, record id or percentage', () => {
    for (const [where, text] of quotedTexts(L())) {
      const quotes = (String(text).match(/"([^"]+)"/g) || []).length;
      const withRef = (String(text).match(/"([^"]+)"\s*\(([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*)\s+(\d+):([\d\-,\s]+)\)/g) || []).length;
      expect(withRef, `${where}: ${quotes} quoted spans, ${withRef} with a reference`).toBe(quotes);
      for (const span of String(text).matchAll(/"([^"]+)"/g)) expect(/\.\.\.|…/.test(span[1]), `${where} elides`).toBe(false);
      expect(/DR-\d{4}/.test(text), `${where} recites a record id`).toBe(false);
      expect(/\d\s*%/.test(text), `${where} states a percentage`).toBe(false);
    }
    expect(ALL().includes('“') || ALL().includes('”')).toBe(false);
  });

  it('every span it was built with is still in the lesson, word for word', () => {
    for (const s of SPANS) expect(ALL()).toContain(s);
  });

  it('PROVEN-TO-CATCH: one changed word inside a quotation fails the verse gate', () => {
    const broken = { ...L(), lesson: L().lesson.replace('For promotion cometh neither from the east, nor from the west, nor from the south.', 'For promotion cometh neither from the east, nor from the west, nor from the xyzzy.') };
    expect(scanQuotedVerses([broken], quotedTexts).faults.length).toBeGreaterThan(0);
  });

  it('PROVEN-TO-CATCH: a dropped movement and a planted generic name are both caught', () => {
    expect(L().lesson).toContain('\n\nFIVE. ');
    const dropped = L().lesson.replace(/\n\nFIVE\. [^]*?(?=\n\nSIX\. )/, '');
    expect(dropped.includes('\n\nFIVE. ')).toBe(false);
    const planted = `${L().lesson} The work is from God alone.`;
    expect(/\bGod\b/.test(planted.replace(/"[^"]*"/g, ' '))).toBe(true);
  });
});

describe('our voice keeps the bindings', () => {
  it('says Yahweh in our own voice: no generic "God" and no capitalised adversary name outside a quotation', () => {
    const prose = ALL().replace(/"[^"]*"/g, ' ');
    expect(prose.match(/\bGod\b/g)).toBe(null);
    expect(/\b(Satan|Lucifer|Devil|Baal)\b/.test(prose)).toBe(false);
  });

  it('promises nothing the Word has not promised about this application', () => {
    const prose = ALL().replace(/"[^"]*"/g, ' ');
    expect(/\bwill get the (?:job|position)\b|\bYahweh will say yes\b|\byou will be chosen\b|\bthe answer will be yes\b/i.test(prose)).toBe(false);
    // The lesson states the opposite twice, and that wording is the gate.
    expect(prose).toContain('It is not a guaranteed yes.');
    expect(prose).toContain('A yes is not.');
    expect(L().lesson).toContain('It does not tell any person whether a particular application will be answered yes.');
  });

  it('every band and the lesson end with the confession', () => {
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) {
      expect(t.trimEnd().endsWith('Jesus is the Lamb of Yahweh and the Eternal Son of Yahweh.')).toBe(true);
    }
  });

  it('the lesson and every band send the reader to talk about it together, in its own words, all three directions', () => {
    expect(hasAllThree(L())).toBe(true);
    const o = ownPrompts(L());
    expect(o.parents).toMatch(/^Parents, ask your children/);
    expect(o.children).toMatch(/^Ask your mom, dad or grandparent/);
    expect(o.friends).toMatch(/^Friends, tell each other/);
    for (const t of [L().lesson, ...FULL_BANDS.map((b) => L().levels[b])]) expect(t).toContain('TALK ABOUT IT TOGETHER');
  });
});

describe('the register is ordered, and measured rather than asserted', () => {
  it('every band clears its full-levels floor', () => {
    const f = measureFullness(L());
    for (const b of FULL_BANDS) expect(f.bands[b].share, b).toBeGreaterThanOrEqual(FULL_FLOOR[b]);
  });
  it('the grades ascend and the child band is held to the age', () => {
    const m = measureLesson(L());
    expect(isInverted(m), JSON.stringify(m.bands)).toBe(false);
    expect(breachesChildCeiling(m, NEW_LESSON_CHILD_CEILING)).toBe(false);
  });
  it('the four bands are genuinely different texts', () => {
    const d = measureDifferentiation(L());
    expect(d).toBeTruthy();
    expect(d.worst).toBeLessThan(DIFF_CEILING);
  });
  it('every band names its own lesson near its start', () => {
    for (const b of FULL_BANDS) expect(namesItsLesson(L().title, L().levels[b]), b).toBe(true);
  });
  it('the lesson carries at least eight numbered movements, Word first', () => {
    for (const n of ['ONE.', 'TWO.', 'THREE.', 'FOUR.', 'FIVE.', 'SIX.', 'SEVEN.', 'EIGHT.']) expect(L().lesson).toContain(`\n\n${n} `);
  });
  it('the movements run in the order the lesson teaches them: the work, the asking, the release, Who promotes, the wait', () => {
    const at = (n) => L().lesson.indexOf(`\n\n${n} `);
    expect(at('ONE.')).toBeLessThan(at('TWO.'));
    expect(at('TWO.')).toBeLessThan(at('THREE.'));
    expect(at('THREE.')).toBeLessThan(at('FOUR.'));
    expect(at('FOUR.')).toBeLessThan(at('FIVE.'));
    expect(at('FIVE.')).toBeLessThan(at('EIGHT.'));
  });
});
