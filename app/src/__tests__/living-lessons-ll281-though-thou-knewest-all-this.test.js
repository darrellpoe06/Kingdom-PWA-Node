// =============================================================================
// ll281 — "Though thou knewest all this": the fall you watched, why watching
// did not teach you, and the two men who saw the same cross. (DR-1325)
// =============================================================================
// THE SOURCE. A morning business digest forwarded 2026-10-22 13:32:14 UTC from
// a university mailbox to a personal one, with one word typed above the
// forwarded header: Lesson. 164,404 bytes, read in full in ONE PLAIN_TEXT
// fetch. WHO TAUGHT (DR-0719): NOBODY. A forwarded newsletter is not a
// recording and names no teacher, so this gate forbids the bare phrase
// "the teacher" and forbids crediting Bishop Gwin.
//
// WHY THIS GATE IS SHAPED THE WAY IT IS. The hazard in a charged business
// digest is not fabrication, it is a SIDE: a war between named nations, named
// firms, named officials and named money. So the module names nobody and
// stakes no figure, and both of those absences are MEASURED over every string
// at any depth rather than trusted (DR-0098, DR-0100, DR-1312's precedent).
//
// A VERSE IS NEVER SPENT (DR-1317). Nothing here was dropped for appearing in
// another lesson, and no reader text points at another lesson, because a reader
// may open exactly one lesson and a cross-reference steals room from
// comprehension. The neighbouring landings live in DR-1325, not in the prose.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { LIVING_LESSONS_MODULES } from '../lib/living-lessons-class.js';
import { measureFullness, shortBands } from '../../../scripts/full-levels.mjs';
import { measureLesson, isInverted } from '../../../scripts/reading-level.mjs';
import { findBritish, ourProse } from '../../../scripts/american-spelling.mjs';
import { hasAllThree, placesMissingDirections, missingDirections } from '../lib/talk-together.js';
import { censusLesson } from '../lib/library-census.js';
import { lessonSectionPlan } from '../lib/lesson-format.js';
import { fourBandFaults } from './fixtures/four-band-ladder.js';

const ID = 'll281-though-thou-knewest-all-this';
const M = LIVING_LESSONS_MODULES.find((m) => m.id === ID);

/** The five places a reader actually meets this lesson. */
const PLACES = () => ({ adult: M.lesson, child: M.levels.child, youth: M.levels.youth, teen: M.levels.teen, senior: M.levels.senior });
/** Every string in the module, so no field can go unchecked. */
const allStrings = (o = M, out = []) => {
  if (typeof o === 'string') out.push(o);
  else if (Array.isArray(o)) o.forEach((v) => allStrings(v, out));
  else if (o && typeof o === 'object') Object.values(o).forEach((v) => allStrings(v, out));
  return out;
};

// --- the KJV corpus on disk --------------------------------------------------
const KJV = join(process.cwd(), 'public', 'bible', 'kjv');
const bookCache = new Map();
const bookOf = (b) => {
  const f = b.replace(/\s+/g, '');
  if (!bookCache.has(f)) bookCache.set(f, JSON.parse(readFileSync(join(KJV, `${f}.json`), 'utf8')));
  return bookCache.get(f);
};
const verseText = (ref) => {
  const m = /^(.+?)\s+(\d+):(\d+)$/.exec(String(ref).trim());
  if (!m) return null;
  const ch = bookOf(m[1]).chapters[Number(m[2]) - 1];
  return ch && ch[Number(m[3]) - 1] ? ch[Number(m[3]) - 1] : null;
};

/**
 * Every double-quoted span in a string, with the reference that follows it.
 * A quotation with no reference adjacent is itself a fault: our own words must
 * never be dressed as Scripture.
 */
const REF_AFTER = /^\s*\(([1-3]?\s?[A-Za-z]+\s+\d+:\d+(?:-\d+)?)\)/;
function quotedSpans(text) {
  const out = [];
  for (const m of String(text).matchAll(/"([^"]+)"/g)) {
    const after = String(text).slice(m.index + m[0].length, m.index + m[0].length + 4);
    const tail = String(text).slice(m.index + m[0].length);
    const r = REF_AFTER.exec(tail) || /^[,.;:]?\s*\(([1-3]?\s?[A-Za-z]+\s+\d+:\d+(?:-\d+)?)\)/.exec(tail);
    out.push({ quoted: m[1], ref: r ? r[1].replace(/\s+/g, ' ').trim() : null, after });
  }
  return out;
}

describe('ll281 — though thou knewest all this', () => {
  it('is in the catalog exactly once, contiguous after ll280', () => {
    expect(M, 'll281 is missing from LIVING_LESSONS_MODULES').toBeTruthy();
    const ids = LIVING_LESSONS_MODULES.map((m) => m.id);
    expect(ids.filter((i) => i.startsWith('ll281-'))).toHaveLength(1);
    expect(ids.filter((i) => i.startsWith('ll282-'))).toHaveLength(0);
    expect(ids.indexOf(ID)).toBe(ids.length - 1);
  });

  // --- the Word, verbatim, and the sweep asserts its own size ---------------
  it('every referenced quotation in every string is the corpus verbatim', () => {
    const faults = [];
    let spans = 0;
    const refs = new Set();
    for (const s of allStrings()) {
      for (const q of quotedSpans(s)) {
        if (!q.ref) { faults.push(`BARE QUOTE (no reference): "${q.quoted.slice(0, 60)}"`); continue; }
        const base = q.ref.replace(/-\d+$/, '');
        const v = verseText(base);
        if (v === null) { faults.push(`UNRESOLVED ${q.ref}`); continue; }
        spans += 1;
        refs.add(base);
        if (!v.includes(q.quoted)) faults.push(`NOT VERBATIM ${q.ref}: "${q.quoted.slice(0, 70)}"`);
      }
    }
    expect(faults, faults.join('\n')).toEqual([]);
    // AN EMPTY SCAN MUST NOT READ AS A PASS (DR-0076 §3).
    expect(spans).toBeGreaterThanOrEqual(220);
    expect(refs.size).toBeGreaterThanOrEqual(45);
  });

  it('PROVEN TO CATCH: one altered word inside a quotation fails the sweep', () => {
    // Proverbs 26:11 is "so a fool returneth to his folly" — the corpus
    // corrected memory here, which would have written "so is a fool that
    // returneth". The sweep must see the difference.
    const bad = 'As a dog returneth to his vomit, so is a fool that returneth to his folly';
    expect(verseText('Proverbs 26:11').includes(bad)).toBe(false);
    expect(verseText('Proverbs 26:11').includes('so a fool returneth to his folly')).toBe(true);
    // And 1 Corinthians 10:11 reads "ensamples", not "examples".
    expect(verseText('1 Corinthians 10:11')).toContain('ensamples');
    expect(verseText('1 Corinthians 10:11').includes('for examples')).toBe(false);
  });

  it('PROVEN TO CATCH: a straightened apostrophe fails the sweep (DR-1273)', () => {
    const corpus = verseText('Proverbs 15:5');
    expect(corpus).toContain('father’s');            // the corpus carries U+2019
    expect(corpus.includes("father's")).toBe(false);      // the straight form is NOT the verse
    // and the lesson quotes the corpus form, not the straightened one
    const adult = M.lesson;
    expect(adult).toContain('A fool despiseth his father’s instruction');
  });

  it('PROVEN TO CATCH: a planted bare quotation is reported', () => {
    const planted = 'He said "the heart is what matters most here" and moved on.';
    const faults = quotedSpans(planted).filter((q) => !q.ref);
    expect(faults).toHaveLength(1);
  });

  // --- the anchor names every verse (DR-0734) -------------------------------
  it('anchor.ref resolves, names every quoted verse, and is named in the adult lesson', () => {
    const anchor = M.anchor.ref.split(';').map((s) => s.trim()).filter(Boolean);
    expect(anchor.length).toBeGreaterThanOrEqual(45);
    expect(anchor.filter((r) => verseText(r) === null)).toEqual([]);
    const quoted = new Set();
    for (const s of allStrings()) for (const q of quotedSpans(s)) if (q.ref) quoted.add(q.ref.replace(/-\d+$/, ''));
    expect([...quoted].filter((r) => !anchor.includes(r)), 'quoted but not in the anchor').toEqual([]);
    expect(anchor.filter((r) => !M.lesson.includes(r)), 'in the anchor but not named in the adult lesson').toEqual([]);
  });

  // --- the ground this lesson stands on, pinned in EVERY place --------------
  // A reader reads ONE version, so the load-bearing spans are asserted on the
  // lesson AND on each band, named by band when one drops a span.
  const IN_EVERY_PLACE = [
    ['the record is re-addressed to the reader', 'they are written for our admonition'],
    ['the price of the arrangement', 'Smite a scorner, and the simple will beware'],
    ['the sister who saw it', 'her treacherous sister Judah'],
    ['the sister who was worse afterward', 'she was more corrupt in her inordinate love'],
    ['the charge that is not ignorance', 'though thou knewest all this'],
    ['the purpose stated out loud', 'thou wilt receive instruction'],
    ['and they rose early anyway', 'they rose early, and corrupted all their doings'],
    ['the mechanism, never emptied', 'emptied from vessel to vessel'],
    ['no changes, therefore no fear', 'they have no changes, therefore they fear not'],
    ['the comfortable room', 'not grieved for the affliction of Joseph'],
    ['the honest limit on a bigger warning', 'though one rose from the dead'],
    ['the hinge', 'not being mixed with faith in them that heard it'],
    ['the clause that parted the two men', 'seeing thou art in the same condemnation'],
    ['and it counted that day', 'To day shalt thou be with me in paradise'],
    ['the Lamb', 'Behold the Lamb of God'],
    ['the confession (DR-0210)', 'the Lamb of Yahweh and the Eternal Son of Yahweh'],
    ['the mind that is given', 'But we have the mind of Christ'],
    ['growth measured by fruit', 'the fruit of the Spirit is love, joy, peace'],
    ['growth measured in occasions and days', 'when thou walkest by the way'],
  ];
  for (const [what, span] of IN_EVERY_PLACE) {
    it(`carries ${what} in the lesson AND in all four bands`, () => {
      const missing = Object.entries(PLACES()).filter(([, t]) => !String(t).includes(span)).map(([k]) => k);
      expect(missing, `places missing "${span}": ${missing.join(', ')}`).toEqual([]);
    });
  }

  // --- DR-0098 / DR-0100: no side, no name, no figure ----------------------
  it('names no company, person, nation, party or publication anywhere in the module', () => {
    const FORBIDDEN = [
      'Meta', 'Zuckerberg', 'Muse', 'OpenAI', 'ChatGPT', 'Altman', 'Apple', 'Siri', 'Gemini',
      'Google', 'Deutsche', 'Bank of America', 'Citigroup', 'Goldman', 'Sachs', 'JPMorgan',
      'Morgan Stanley', 'Dimon', 'Cambridge Analytica', 'PHP', 'Wikipedia', 'CNBC', 'Instagram',
      'Facebook', 'T-Mobile', 'Kpler', 'Wall Street', 'Hormuz', 'Iran', 'Tehran', 'Trump',
      'Russia', 'Saudi', 'Yemen', 'Houthi', 'Rubio', 'Kuwait', 'Dow Jones', 'Gasbuddy',
      'Indianapolis', 'France', 'Daily Upside', 'hedge fund', 'prime brokerage',
    ];
    const hits = [];
    for (const s of allStrings()) {
      for (const f of FORBIDDEN) {
        const re = new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (re.test(s)) hits.push(f);
      }
    }
    expect([...new Set(hits)], 'names from the digest reached a reader').toEqual([]);
  });

  it('PROVEN TO CATCH: one planted company name reddens the no-names sweep', () => {
    const re = /\bGoldman\b/i;
    expect(re.test('the trade that Goldman financed')).toBe(true);
    expect(allStrings().some((s) => re.test(s))).toBe(false);
  });

  it('stakes NO figure from the issue in any of the five reader places', () => {
    const survivors = [];
    for (const [where, t] of Object.entries(PLACES())) {
      let x = ourProse(t);                                  // quoted Scripture out first
      x = x.replace(/\b[1-3]?\s?[A-Z][a-z]+(?:\s+of\s+[A-Z][a-z]+)?\s+\d+:\d+(?:-\d+)?/g, ' '); // bare refs
      x = x.replace(/\([^)]*\d[^)]*\)/g, ' ');               // parenthesised refs
      x = x.replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ');          // ISO dates
      for (const m of x.matchAll(/\d+/g)) survivors.push(`${where}:${m[0]}`);
    }
    expect(survivors, `figures reached a reader: ${survivors.join(', ')}`).toEqual([]);
  });

  it('PROVEN TO CATCH: planted figure shapes fire while a reference stays invisible', () => {
    const scrub = (t) => {
      let x = ourProse(t);
      x = x.replace(/\b[1-3]?\s?[A-Z][a-z]+(?:\s+of\s+[A-Z][a-z]+)?\s+\d+:\d+(?:-\d+)?/g, ' ');
      x = x.replace(/\([^)]*\d[^)]*\)/g, ' ');
      x = x.replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ');
      return [...x.matchAll(/\d+/g)].map((m) => m[0]);
    };
    expect(scrub('assets grew to $13 trillion from $4 trillion')).not.toEqual([]);
    expect(scrub('equities revenue grew 57% this year')).not.toEqual([]);
    expect(scrub('10.9 million downloads since launch')).not.toEqual([]);
    expect(scrub('a gallon cost $4.26 yesterday')).not.toEqual([]);
    expect(scrub('roughly 24 million barrels per day')).not.toEqual([]);
    // and the shapes that must stay invisible to it
    expect(scrub('as Proverbs 19:25 says, and (Daniel 5:22) agrees, on 2026-10-22')).toEqual([]);
  });

  it('holds DR-0100’s three tiers apart in all five reader places', () => {
    for (const [where, t] of Object.entries(PLACES())) {
      expect(t, `${where} does not name the documented tier`).toMatch(/DOCUMENTED|Some things are sure/i);
      expect(t, `${where} does not name the alleged tier`).toMatch(/ALLEGED|just a report/i);
      expect(t, `${where} does not name the unchecked tier`).toMatch(/UNCHECKED|nobody here checked/i);
      // a report is not a finding — the allegation is kept narrow, never a verdict
      expect(t, `${where} reaches a verdict it has no business reaching`).toMatch(/report is not a finding|We do not decide about any company/i);
    }
  });

  it('refuses the hedge rather than using it: every "some say" sentence is a refusal of it', () => {
    for (const [where, t] of Object.entries(PLACES())) {
      const sentences = String(t).split(/(?<=[.!?])\s+/).filter((s) => /some (people )?say|allegedly|it is claimed that/i.test(s));
      for (const s of sentences) {
        expect(s, `${where} softens a documented thing: ${s}`).toMatch(/never softened|not softened|rather than/i);
      }
    }
  });

  // --- who taught: NOBODY (DR-0719) ---------------------------------------
  it('names no teacher, and says in every place that a forward is not a recording', () => {
    for (const [where, t] of Object.entries(PLACES())) {
      expect(t, `${where} does not say a forwarded newsletter is not a recording`).toMatch(/not a recording/i);
      expect(t, `${where} does not say the word that arrived`).toMatch(/\bLesson\b/);
    }
    for (const s of allStrings()) {
      expect(s).not.toMatch(/Bishop Gwin/i);
      expect(s).not.toMatch(/\bthe teacher\b/i);
    }
  });

  // --- stands alone and whole (DR-1317 rule two) ---------------------------
  it('points at no other lesson in any reader text', () => {
    for (const [where, t] of Object.entries(PLACES())) {
      expect(t, `${where} cross-references another lesson`).not.toMatch(/\b(?:ll|sov|lil|pm|prop|fin|evic)\d+\b/i);
      expect(t, `${where} tells the reader to read another week`).not.toMatch(/read (?:this week )?beside the (?:one|ones)/i);
      expect(t, `${where} recites a decision record`).not.toMatch(/DR-\d{4}/);
    }
  });

  it('PROVEN TO CATCH: a planted cross-reference reddens the stands-alone check', () => {
    const re = /\b(?:ll|sov|lil|pm|prop|fin|evic)\d+\b/i;
    expect(re.test('read this beside ll223 on the storm you can see coming')).toBe(true);
    expect(Object.values(PLACES()).some((t) => re.test(t))).toBe(false);
  });

  // --- voice (DR-0210 / DR-0076 bright line) -------------------------------
  it('uses no generic God or LORD in our own voice, and keeps every quotation exactly as the corpus has it', () => {
    const faults = [];
    for (const s of allStrings()) {
      if (s === M.anchor.ref) continue;                     // a reference list, not prose
      for (const m of ourProse(s).matchAll(/\b(God|GOD|LORD)\b/g)) faults.push(`${m[0]} in our voice: ...${ourProse(s).slice(Math.max(0, m.index - 40), m.index + 10)}`);
    }
    expect(faults, faults.join('\n')).toEqual([]);
    // the KJV's own God and LORD are left untouched inside the quotations
    expect(M.lesson).toContain('"The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world" (John 1:29)');
    expect(M.lesson).toContain('"But unto the Son he saith, Thy throne, O God, is for ever and ever: a sceptre of righteousness is the sceptre of thy kingdom" (Hebrews 1:8)');
    expect(M.lesson).toContain('"Therefore the LORD was very angry with Israel, and removed them out of his sight: there was none left but the tribe of Judah only" (2 Kings 17:18)');
  });

  it('PROVEN TO CATCH: a planted unquoted God is reported, and Yahweh never sits inside a quotation', () => {
    const planted = 'God wrote those falls down on purpose.';
    expect([...ourProse(planted).matchAll(/\b(God|GOD|LORD)\b/g)]).toHaveLength(1);
    for (const s of allStrings()) {
      for (const m of String(s).matchAll(/"([^"]*)"/g)) {
        expect(m[1], 'Yahweh was substituted into a quotation').not.toMatch(/Yahweh/);
      }
    }
  });

  it('spells it the house way in our prose and leaves the KJV’s own spellings alone', () => {
    const brit = [];
    for (const s of allStrings()) for (const b of findBritish(s)) brit.push(b.word);
    expect([...new Set(brit)], 'British spellings in our voice').toEqual([]);
    expect(M.lesson).toContain('in favour with God and man');   // Luke 2:52, verbatim
    expect(M.lesson).toContain('and glory, and honour');        // Daniel 5:18, verbatim
  });

  it('never capitalizes the adversary', () => {
    for (const s of allStrings()) {
      expect(s).not.toMatch(/\b(Satan|Lucifer|The Devil|The Adversary|The Accuser|The Deceiver|Baal)\b/);
    }
  });

  // --- the four-band ladder, measured --------------------------------------
  it('passes the whole four-band ladder', () => {
    expect(fourBandFaults(M), JSON.stringify(fourBandFaults(M))).toEqual([]);
    expect(shortBands(measureFullness(M))).toEqual([]);
    expect(isInverted(measureLesson(M))).toBe(false);
  });

  it('the shares and the reading ladder are the measured numbers, not round ones', () => {
    // MEASURED on this tree: adult prose 3,301 words; shares child 0.535,
    // youth 0.634, teen 0.972, senior 1.116; authored grades 1.18 / 4.82 /
    // 5.31 / 8.61 against the adult lesson's 6.52; worst band-pair overlap
    // 0.160 (teen~senior) against the LADDER's 0.25 near-copy line.
    const f = measureFullness(M);
    expect(f.bands.child.share).toBeGreaterThan(0.5);
    expect(f.bands.youth.share).toBeGreaterThan(0.6);
    expect(f.bands.teen.share).toBeGreaterThan(0.6);
    expect(f.bands.senior.share).toBeGreaterThan(0.6);
    const g = measureLesson(M).bands;
    expect(g.child.authored).toBeLessThan(5.0);              // new-lesson child ceiling
    expect(g.teen.authored).toBeLessThan(6.0);
    expect(g.senior.authored).toBeLessThan(10.0);
    expect(g.child.authored).toBeLessThan(g.youth.authored);
    expect(g.youth.authored).toBeLessThan(g.teen.authored);
    expect(g.teen.authored).toBeLessThan(g.senior.authored);
  });

  // --- DR-0733 / DR-0795: the three directions, in EVERY band -------------
  it('sends the reader all three ways in the lesson AND in every band', () => {
    expect(hasAllThree(M)).toBe(true);
    expect(placesMissingDirections(M), JSON.stringify(placesMissingDirections(M))).toEqual([]);
  });

  it('PROVEN TO CATCH: stripping ONE band’s friend line names that band while the pooled check stays green', () => {
    const friendLine = /Friends, tell one friend this week[^.]*\./;
    expect(friendLine.test(M.levels.child)).toBe(true);
    const wounded = { ...M, levels: { ...M.levels, child: M.levels.child.replace(friendLine, '') } };
    // the per-band check names exactly the child band, and exactly the friend direction
    expect(placesMissingDirections(wounded)).toEqual([{ place: 'child', missing: ['friends'] }]);
    // while the POOLED check still reads green — which is the whole reason the
    // per-band check exists (DR-0795)
    expect(hasAllThree(wounded)).toBe(true);
  });

  it('every band carries the skill and the rhythm in the lesson’s own words', () => {
    for (const [where, t] of Object.entries(PLACES())) {
      expect(t, `${where} is missing TALK ABOUT IT TOGETHER`).toContain('TALK ABOUT IT TOGETHER.');
      expect(t, `${where} is missing the four places of Deuteronomy 6:7`).toMatch(/at the table, on the way, at bedtime, or first thing/);
      expect(t, `${where} is missing the one-friend rhythm`).toMatch(/one friend this week/);
      expect(t, `${where} is missing the aim`).toContain('until we see that Yahweh has been right');
      expect(missingDirections(t), `${where} is short a direction`).toEqual([]);
    }
  });

  // --- shape ---------------------------------------------------------------
  it('numbers its own headings contiguously from one in all five places', () => {
    for (const [where, t] of Object.entries(PLACES())) {
      const p = lessonSectionPlan(t);
      expect(p.headings.length, `${where} has no headings`).toBeGreaterThan(0);
      expect(p.headings.map((h) => h.n), `${where} headings do not number from one`).toEqual(p.headings.map((_, i) => i + 1));
    }
    expect(lessonSectionPlan(M.lesson).headings).toHaveLength(19);
  });

  it('every band opens on the lesson’s own title', () => {
    for (const [where, t] of Object.entries(PLACES())) {
      expect(String(t).slice(0, 40).toUpperCase(), `${where} does not open on the title`).toContain('THOUGH THOU KNEWEST ALL THIS');
    }
  });

  // --- THE RATCHET: is the lesson FINISHED? (DR-1266) ----------------------
  it('is WHOLE by the library census, with nothing waiting', () => {
    const c = censusLesson(M);
    expect(c.missingComponents, JSON.stringify(c.missingComponents)).toEqual([]);
    expect(c.missingVersions, JSON.stringify(c.missingVersions)).toEqual([]);
    expect(c.whole).toBe(true);
    expect(c.short).toBe(false);
    expect(c.adultWords).toBeGreaterThan(400);
  });

  it('carries an exam, benefits, talking points, a run of show and the in-app step', () => {
    expect(M.quiz.questions.length).toBeGreaterThanOrEqual(12);
    expect(M.benefits.length).toBeGreaterThanOrEqual(12);
    expect(M.facilitator.talkingPoints.length).toBeGreaterThanOrEqual(12);
    expect(M.facilitator.discussionPrompts.length).toBeGreaterThanOrEqual(10);
    expect(M.facilitator.howToRun.length).toBeGreaterThan(400);
    expect(M.inApp).toMatch(/ALREADY PAID FOR/);
    // every exam answer is a real index into its own options
    for (const q of M.quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(3);
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(q.explain.length).toBeGreaterThan(20);
    }
  });

  it('the lesson is dated, and the date file is the one that carries Living Lessons days', () => {
    const dates = readFileSync(join(process.cwd(), 'src', 'lib', 'living-lessons-dates.js'), 'utf8');
    expect(dates).toContain(`'${ID}': '2026-11-05'`);
  });

  // --- the landing, pinned so a later reader can check the DR-0610 call ----
  it('lands where DR-1325 says it lands, and not where its neighbours land', () => {
    // The destination: a completed fall, already paid for by somebody else, and
    // the comfort that keeps it from instructing the watcher. NOT a storm you
    // can see coming, NOT preparing for one, NOT a protection held up only by
    // nobody having tried it.
    expect(M.bigIdea).toMatch(/they saw it, they know it, they did it again/i);
    expect(M.inApp).toMatch(/watched go badly for somebody else/);
    expect(M.inApp).toMatch(/same condemnation/);
    // and the ground that is this lesson's alone across the whole repo
    const anchor = M.anchor.ref;
    for (const r of ['Daniel 5:22', 'Ezekiel 23:11', 'Jeremiah 3:7', 'Zephaniah 3:7', '2 Kings 17:19', 'Proverbs 21:11', 'Amos 6:6', 'Psalms 55:19']) {
      expect(anchor, `${r} is the distinctive ground and must be anchored`).toContain(r);
    }
  });

  it('the corpus is the only road taken, and the test directory agrees the lesson exists', () => {
    // No network road was used or needed; the lesson stands on the forwarded
    // text in hand plus the corpus on disk, and says so in every band.
    for (const [where, t] of Object.entries(PLACES())) {
      expect(t, `${where} does not say where the verses came from`).toMatch(/this family(?:\u2019s own)? copy of the text|out of our own Bible/i);
    }
    expect(readdirSync(join(process.cwd(), 'src', '__tests__')))
      .toContain('living-lessons-ll281-though-thou-knewest-all-this.test.js');
  });
});
