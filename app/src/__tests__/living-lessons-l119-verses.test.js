// =============================================================================
// L119 — "Does she feel like your favorite person?": preferring one another,
// the first works, and the home you cannot wait to reach. Verbatim KJV.
// =============================================================================
// Captured 2026-09-02 from a third spoken clip Darrell brought in — a man the
// account names Marcellus, recounting his mentor of thirty-plus years asking him
// who his favorite person was, then asking the question that actually landed:
// but does she FEEL like she is?
//
// This is the WARMTH of the set. L114 gave the husband an account of his own
// post; L117 gave the wife hers and took the beam out of the pointing eye. A
// series carrying only those two would be backbone with no heart, which fails
// the Religion AND Relationship test on its own terms — so the pairing is
// asserted here rather than left to a reader to notice.
//
// The four things this lesson had to get right, and which are pinned here:
//   • THE GAP IS DELIVERY, NOT SINCERITY (1 John 3:18). A man can love his wife
//     genuinely and still be disobedient to that verse, because the verse
//     measures what arrived.
//   • THE DRIFT HAS A NAME AND A REPAIR (Revelation 2:4-5) — and the honest note
//     rides WITH it: that word is spoken to the church at Ephesus about her love
//     for the Lord, NOT about a marriage. The pattern transfers on the Word's
//     own authority (Ephesians 5:32), and the lesson says which is which. A
//     teacher who lets a room hear it as a marriage verse has traded accuracy
//     for impact.
//   • THE REPAIR IS WORKS BEFORE FEELINGS. "do the first works" is the move
//     almost nobody makes, because it refuses to wait for the mood to return.
//   • BOTH CAVEATS, NEITHER SKIPPED (DR-0100). A spouse in depression, illness
//     or grief may feel nothing, and that flat feeling is not a verdict on the
//     love given (Galatians 6:9). And the question is a MIRROR, never a bill —
//     turned outward it becomes the accounting L114 dismantled.
//
// Whole-span gate: no quoted span may differ from the in-repo KJV by a single
// character. Authoring L119 produced THREE real in-quote alterations, all caught
// by the sweep before anything was spliced: an abbreviation that invented a
// string ("not in word, neither in tongue…" — 1 John 3:18 reads "let us not LOVE
// in word"), the same invented span repeated in a benefit, and a comma pulled
// inside "in honour preferring one another," (Romans 12:10 ends that clause with
// a semicolon). Each is pinned below as absent from the corpus.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIVING_LESSONS_MODULES, LIVING_LESSONS_META } from '../lib/living-lessons-class.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, '..', 'lib', 'living-lessons-class.js'), 'utf8');
const ID = 'll119-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works';
const start = src.indexOf(`id: '${ID}'`);
const l = src.slice(start).split('\n  },\n];')[0];

const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const verse = (book, ch, v) => JSON.parse(readFileSync(join(KJV_DIR, `${book}.json`), 'utf8')).chapters[ch - 1][v - 1];

const WHOLE_KJV = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;   // index.json is not a book
    for (const ch of j.chapters) all += `${ch.join('\n')}\n`;
  }
  return all;
})();

const quotedSpans = (text) => {
  const unescaped = text.replace(/\\'/g, "'");
  const at = [...unescaped.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(unescaped.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

const QUOTED_FRAGMENTS = [
  'let us not love in word, neither in tongue; but in deed and in truth',    // 1 John 3:18
  'in honour preferring one another',                                       // Rom 12:10
  'And above all things have fervent charity among yourselves',              // 1 Pet 4:8
  'This is my beloved, and this is my friend, O daughters of Jerusalem.',    // Song 5:16
  'A friend loveth at all times, and a brother is born for adversity.',      // Prov 17:17
  'A man that hath friends must shew himself friendly',                      // Prov 18:24
  'so doth the sweetness of a man’s friend by hearty counsel',              // Prov 27:9
  'but I have called you friends',                                          // John 15:15
  'Nevertheless I have somewhat against thee, because thou hast left thy first love.', // Rev 2:4
  'Remember therefore from whence thou art fallen, and repent, and do the first works', // Rev 2:5
  'This is a great mystery: but I speak concerning Christ and the church.',  // Eph 5:32
  'Rise up, my love, my fair one, and come away.',                          // Song 2:10
  'seemed unto him but a few days, for the love he had to her',              // Gen 29:20
  'As cold waters to a thirsty soul, so is good news from a far country.',   // Prov 25:25
  'Heaviness in the heart of man maketh it stoop: but a good word maketh it glad.', // Prov 12:25
  'The light of the eyes rejoiceth the heart: and a good report maketh the bones fat.', // Prov 15:30
  'He that covereth a transgression seeketh love; but he that repeateth a matter separateth very friends.', // Prov 17:9
  'A talebearer revealeth secrets: but he that is of a faithful spirit concealeth the matter.', // Prov 11:13
  'To speak evil of no man, to be no brawlers, but gentle, shewing all meekness unto all men.', // Titus 3:2
  'Beareth all things, believeth all things, hopeth all things, endureth all things.', // 1 Cor 13:7
  'her husband also, and he praiseth her',                                   // Prov 31:28
  'Let thy fountain be blessed: and rejoice with the wife of thy youth.',    // Prov 5:18
  'and be thou ravished always with her love.',                             // Prov 5:19
  'Live joyfully with the wife whom thou lovest all the days of the life of thy vanity', // Eccl 9:9
  'he shall be free at home one year, and shall cheer up his wife which he hath taken', // Deut 24:5
  'And let us not be weary in well doing: for in due season we shall reap, if we faint not.', // Gal 6:9
  'He that loveth father or mother more than me is not worthy of me',        // Matt 10:37
  'notwithstanding ye give them not those things which are needful to the body; what doth it profit?', // Jas 2:16
];

describe('L119 exists in the catalog with its full shape', () => {
  it('the module is present with anchor, levels, quiz, benefits, and facilitator', () => {
    expect(start).toBeGreaterThan(-1);
    for (const key of [
      'bigIdea:', 'inApp:',
      "ref: '1 John 3:18; Romans 12:10; Revelation 2:4-5'",
      'benefits:', 'child:', 'teen:', 'senior:', 'quiz:', 'facilitator:',
    ]) {
      expect(l).toContain(key);
    }
  });

  it('is registered in the live series and the painted lesson count is the real one', () => {
    const m = LIVING_LESSONS_MODULES.find((x) => x.id === ID);
    expect(m, 'L119 must be in LIVING_LESSONS_MODULES').toBeTruthy();
    expect(m.quiz.questions.length).toBeGreaterThanOrEqual(5);
    expect(m.benefits.length).toBeGreaterThanOrEqual(6);
    expect(m.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(5);
    expect(LIVING_LESSONS_META.weeks).toBe(LIVING_LESSONS_MODULES.length);
  });

  it('no duplicate lesson id anywhere in the series (three sessions collided on L114 tonight)', () => {
    const ids = LIVING_LESSONS_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('teaches the whole arc in order — gap, vocabulary, friend, drift+repair, the list, delight, caveats, order of loves', () => {
    const order = [
      '1) THE GAP THE QUESTION EXPOSES',
      '2) THE WORD ALREADY HAS A NAME FOR FAVORITE PERSON',
      '3) THE ONE THE CLIP GETS EXACTLY RIGHT - THEY FORGOT TO BE FRIENDS',
      '4) THE DRIFT HAS A NAME, AND A THREE-STEP REPAIR',
      '5) THE MENTOR’S LIST, ITEM BY ITEM, ALREADY IN THE WORD',
      '6) DELIGHT IS COMMANDED, NOT OPTIONAL',
      '7) THE HONEST CAVEAT',
      '8) THE ORDER OF LOVES',
      'THE WHOLE OF IT',
    ];
    let cursor = 0;
    for (const h of order) {
      const at = l.indexOf(h, cursor);
      expect(at, `movement out of order or missing: ${h}`).toBeGreaterThan(cursor - 1);
      cursor = at;
    }
  });

  it('attributes the clip as the occasion and does NOT invent provenance (DR-0190)', () => {
    expect(l).toContain('Darrell');
    expect(l, 'the speaker is named only as the account names him').toContain('Marcellus');
    expect(l, 'the clip is the occasion, not the authority').toMatch(/occasion, not the authority|occasion, never as the authority/);
    expect(l, 'the mentor is unnamed in the source and stays unnamed').toMatch(/the mentor is unnamed in the source|do not invent provenance/);
  });

  it('puts the weight on DELIVERY rather than sincerity', () => {
    expect(l).toContain('let us not love in word, neither in tongue; but in deed and in truth');
    expect(l).toMatch(/about the DELIVERY|measures what arrived|not about the sincerity/);
    expect(l, 'she should not have to infer it').toMatch(/should not have to infer it/);
  });

  it('names favorite person in the Word’s own vocabulary, as a command at a stated temperature', () => {
    expect(l).toContain('in honour preferring one another');
    expect(l).toContain('have fervent charity among yourselves');
    expect(l, 'a command rather than a mood').toMatch(/command rather than a mood|from a mood into obedience/);
  });

  it('HANDLES REVELATION 2:4-5 HONESTLY — says who it addresses BEFORE applying it', () => {
    expect(l).toContain('thou hast left thy first love');
    expect(l).toContain('Remember therefore from whence thou art fallen, and repent, and do the first works');
    // the honest note is mandatory, and must name the real addressee
    expect(l).toMatch(/church at Ephesus/);
    expect(l).toMatch(/not about a marriage|not to a marriage/);
    // and the transfer is licensed by the Word itself, not asserted
    expect(l).toContain('This is a great mystery: but I speak concerning Christ and the church.');
    // the repair is WORKS before FEELINGS — the whole point of the movement
    expect(l).toMatch(/not feel the first feelings|DO the first WORKS/);
  });

  it('grounds every item of the mentor’s list in the text, and presses the covering one', () => {
    expect(l).toContain('Rise up, my love, my fair one, and come away.');          // looking forward
    expect(l).toContain('so is good news from a far country');                     // good news first
    expect(l).toContain('but a good word maketh it glad');                         // lifting with words
    expect(l).toContain('he that repeateth a matter separateth very friends');     // covering
    expect(l).toContain('he that is of a faithful spirit concealeth the matter');  // covering
    expect(l).toContain('believeth all things');                                   // benefit of the doubt
    expect(l, 'the talebearer point is named plainly').toMatch(/office of talebearer|complains about his wife to his friends/);
  });

  it('states that delight is COMMANDED rather than a bonus for the fortunate', () => {
    expect(l).toContain('rejoice with the wife of thy youth');
    expect(l).toContain('and be thou ravished always with her love.');
    expect(l).toContain('Live joyfully with the wife whom thou lovest');
    expect(l).toMatch(/commanded, not optional|COMMANDED, NOT OPTIONAL|not a bonus for the fortunate/i);
  });

  it('refuses BOTH misuses — the flat feeling is not a verdict, and the question is a mirror not a bill (DR-0100)', () => {
    expect(l).toMatch(/depression/i);
    expect(l).toContain('let us not be weary in well doing');
    expect(l, 'the feeling is not the judge').toMatch(/not a verdict on the love/);
    expect(l, 'mirror, never a bill').toMatch(/MIRROR, never a bill|mirror, never a bill/);
    expect(l, 'and it names what it becomes if turned outward').toContain('L114');
  });

  it('keeps the order of loves straight so no spouse is asked to be a god', () => {
    expect(l).toContain('He that loveth father or mother more than me is not worthy of me');
    expect(l).toMatch(/favorite PERSON|favorite person; she is not your first LOVE|not your first LOVE/);
    expect(l).toMatch(/will fail at it|fail at something no human was built to do|failing at what no human was built to do/);
  });

  it('keeps our authored voice on Yahweh, with no capitalized adversary name', () => {
    const { spans } = quotedSpans(l);
    let ours = l.replace(/\\'/g, "'");
    for (const s of spans) ours = ours.split(`"${s}"`).join(' ');
    expect((ours.match(/\bSatan\b/g) || []).length).toBe(0);
    expect((ours.match(/\bLucifer\b/g) || []).length).toBe(0);
    expect((ours.match(/\bGod\b/g) || []).length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(15);
  });
});

describe('every quoted fragment is letter-for-letter KJV (fetched, not remembered)', () => {
  for (const frag of QUOTED_FRAGMENTS) {
    it(`quotes verbatim: "${frag.slice(0, 48)}${frag.length > 48 ? '…' : ''}"`, () => {
      expect(WHOLE_KJV, 'the pin itself must be real KJV').toContain(frag);
      expect(l).toContain(frag);
    });
  }
});

describe('NO in-quote alteration anywhere in the lesson — the whole-span gate', () => {
  it('the lesson\'s double quotes are balanced', () => {
    expect(quotedSpans(l).balanced).toBe(true);
  });

  it('EVERY double-quoted span appears verbatim in the in-repo KJV', () => {
    const { spans } = quotedSpans(l);
    expect(spans.length).toBeGreaterThan(55);
    const altered = [];
    for (const span of spans) {
      for (const part of span.split('...').map((s) => s.trim()).filter(Boolean)) {
        if (!WHOLE_KJV.includes(part)) altered.push(part);
      }
    }
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.map((a) => ` - ${JSON.stringify(a)}`).join('\n')}`).toEqual([]);
  });

  it('is PROVEN-TO-CATCH against the three alterations actually made while authoring THIS lesson', () => {
    // 1+2. An abbreviation that INVENTED a string: 1 John 3:18 reads "let us not
    //      LOVE in word", so dropping the verb produced text Scripture never has.
    expect(WHOLE_KJV.includes('not in word, neither in tongue; but in deed and in truth')).toBe(false);
    expect(WHOLE_KJV.includes('let us not love in word, neither in tongue; but in deed and in truth')).toBe(true);
    // 3. A comma pulled inside the quotation — Romans 12:10 ends that clause on a semicolon.
    expect(WHOLE_KJV.includes('in honour preferring one another,')).toBe(false);
    expect(WHOLE_KJV.includes('in honour preferring one another')).toBe(true);
  });
});

describe('every age level carries the message (child, teen, senior — full coverage)', () => {
  const level = (name) => {
    const i = l.indexOf(`${name}: '`);
    const j = l.indexOf("',\n", i);
    return l.slice(i, j);
  };

  it('each band carries the deed-not-word command and the do-the-first-works repair', () => {
    for (const band of ['child', 'teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries the delivery command`).toMatch(/in deed and in truth|1 John 3:18/);
      // case-insensitive, and 2:4-5 counts: the senior band cites the pair and
      // writes the move in caps (DO THE FIRST WORKS). The first version of this
      // assertion was literal on both counts and flagged a band that carries the
      // repair in full — the test was wrong, not the content.
      expect(t, `${band} carries the repair`).toMatch(/do the first works|Revelation 2:(4-)?5/i);
      expect(t, `${band} puts works before feelings`).toMatch(/before you feel|before the feeling|before they feel|does not wait for the feeling|refuses to wait for the feeling/i);
    }
  });

  it('teen and senior additionally carry the friend, the honest Ephesus note, and the order of loves', () => {
    for (const band of ['teen', 'senior']) {
      const t = level(band);
      expect(t, `${band} carries beloved AND friend`).toMatch(/this is my friend|Song of Solomon 5:16/);
      expect(t, `${band} carries the honest addressee note`).toMatch(/church|Ephesians 5:32/);
      expect(t, `${band} carries the order of loves`).toMatch(/Matthew 10:37|first love/);
    }
  });

  it('the child level teaches without adult weight, and is not a stub', () => {
    const child = level('child');
    expect(child.length).toBeGreaterThan(400);
    expect(child).toContain('do the first works');
    expect(child, 'it teaches the practice a child can actually run').toMatch(/tell them your good news first|say something nice about them/i);
    const childProse = (() => {
      let t = child.replace(/\\'/g, "'");
      for (const sp of quotedSpans(child).spans) t = t.split(`"${sp}"`).join(' ');
      return t;
    })();
    expect(childProse, 'no marital frame at the child level').not.toMatch(/wife|husband|marriage|spouse|divorce/i);
  });
});

describe('corpus witness — the pins are re-read from the corpus files themselves', () => {
  it('a representative set matches the repo KJV exactly', () => {
    expect(verse('1John', 3, 18)).toBe('My little children, let us not love in word, neither in tongue; but in deed and in truth.');
    expect(verse('Romans', 12, 10)).toBe('Be kindly affectioned one to another with brotherly love; in honour preferring one another;');
    expect(verse('Revelation', 2, 4)).toBe('Nevertheless I have somewhat against thee, because thou hast left thy first love.');
    expect(verse('Revelation', 2, 5)).toContain('and repent, and do the first works');
    expect(verse('SongofSolomon', 5, 16)).toContain('This is my beloved, and this is my friend');
    expect(verse('SongofSolomon', 2, 10)).toContain('Rise up, my love, my fair one, and come away');
    expect(verse('Ephesians', 5, 32)).toBe('This is a great mystery: but I speak concerning Christ and the church.');
    expect(verse('Proverbs', 17, 9)).toBe('He that covereth a transgression seeketh love; but he that repeateth a matter separateth very friends.');
    expect(verse('Proverbs', 11, 13)).toContain('he that is of a faithful spirit concealeth the matter');
    expect(verse('1Corinthians', 13, 7)).toBe('Beareth all things, believeth all things, hopeth all things, endureth all things.');
    expect(verse('Proverbs', 5, 19)).toContain('be thou ravished always with her love');
    expect(verse('Ecclesiastes', 9, 9)).toContain('Live joyfully with the wife whom thou lovest');
    expect(verse('Galatians', 6, 9)).toBe('And let us not be weary in well doing: for in due season we shall reap, if we faint not.');
    expect(verse('Matthew', 10, 37)).toContain('He that loveth father or mother more than me is not worthy of me');
    expect(verse('1Peter', 4, 8)).toContain('have fervent charity among yourselves');
    expect(verse('John', 15, 15)).toContain('but I have called you friends');
  });
});
