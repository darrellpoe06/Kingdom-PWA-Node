// @vitest-environment node
//
// economics-class — "Kingdom Economics" must ride the SHARED Learn framework, be
// grounded in BODY-OF-CHRIST-ECONOMIC-STEWARDSHIP, and — per the Governor's
// 2026-07-04 correction — TELL THE DOCUMENTED TRUTH, not softened "allegations."
// The verification disciplines pinned here (DR-0076) cut BOTH ways:
//   • refuse a FALSE number: the "6-hour Black dollar" stat is taught as a myth;
//   • state the TRUE, documented, quantified realities plainly, each sourced:
//     the 50% résumé-callback gap, ~2x Black unemployment, the DOJ redlining
//     settlements, the beauty-supply distribution gate, the ~6:1 Fed wealth gap;
//   • carry the ACCOUNTABILITY spine: God judges unjust economics, and
//     reconciliation comes through repentance + restitution (Zacchaeus).
import { describe, it, expect } from 'vitest';
import {
  ECON_META, ECON_MODULES, ECON_SESSION_MINUTES,
  ECON_CONFIRMED_COHORT, ECON_PROPOSED_COHORT_START,
  buildEconSchedule, econProgressSummary, exportEconCurriculumMarkdown,
  resolveEconCohort, econSources, ECON_TUTOR_META,
} from '../lib/economics-class.js';
import { defaultCourses } from '../lib/book-corpus.js';
import { resolveForAge } from '../lib/learn-framework.js';

describe('curriculum shape', () => {
  it('has an 8-module set, each with the shared fields', () => {
    expect(ECON_MODULES).toHaveLength(8);
    expect(ECON_META.weeks).toBe(8);
    expect(ECON_MODULES.every((m) => m.id && m.title && m.bigIdea && m.inApp && m.anchor?.ref && m.anchor?.theme)).toBe(true);
  });
  it('module ids are unique, prefixed econ*, and cover the full arc', () => {
    const ids = ECON_MODULES.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual([
      'econ1-soul-first', 'econ2-ownership-vs-consumption', 'econ3-circulation',
      'econ4-group-economics', 'econ5-the-real-barriers',
      'econ6-accountability-and-judgment', 'econ7-build-institutions',
      'econ8-test-build-multiply',
    ]);
  });
  it('session flow sums to 75 minutes with the money-tools hands-on label', () => {
    expect(ECON_SESSION_MINUTES).toBe(75);
    expect(ECON_META.handsOnLabel).toMatch(/money/i);
  });
  it('every module carries a facilitator guide, a real lesson, and a valid quiz', () => {
    for (const m of ECON_MODULES) {
      expect(m.lesson && m.lesson.length > 200, m.id).toBe(true);
      expect(m.facilitator?.talkingPoints?.length, m.id).toBeGreaterThan(0);
      expect(m.facilitator?.howToRun, m.id).toBeTruthy();
      for (const q of m.quiz.questions) {
        expect(q.options[q.answer], `${m.id} answer index valid`).toBeTruthy();
        expect(q.explain, `${m.id} quiz explain`).toBeTruthy();
      }
    }
  });
});

describe('age-adaptive', () => {
  it('every module renders child + senior through the shared framework', () => {
    for (const m of ECON_MODULES) {
      expect(m.levels?.child, `${m.id} child`).toBeTruthy();
      expect(m.levels?.senior, `${m.id} senior`).toBeTruthy();
      expect(resolveForAge(m, 'child').text, `${m.id} resolves child`).toBeTruthy();
      expect(resolveForAge(m, 'senior').text, `${m.id} resolves senior`).toBeTruthy();
    }
  });
});

describe('grounded in the mission frame (soul-first + truth that cuts both ways)', () => {
  it('opens with the soul-first order and truth-love (John 8:32)', () => {
    const m1 = ECON_MODULES[0];
    expect(m1.anchor.ref).toMatch(/3 John 1:2/);
    expect(m1.anchor.ref).toMatch(/John 8:32/);
    expect(`${m1.lesson} ${m1.bigIdea}`.toLowerCase()).toMatch(/mut(e|ing)|soften|allegation/);
  });
});

describe('the Governor correction: documented reality, NOT softened allegations (DR-0076)', () => {
  const barriers = ECON_MODULES.find((m) => m.id === 'econ5-the-real-barriers');
  it('names the documented gates as FACT with sources — housing, hiring, lending, distribution', () => {
    const blob = `${barriers.bigIdea} ${barriers.lesson} ${barriers.levels.senior}`;
    expect(blob).toMatch(/50%|50 percent/);              // Bertrand-Mullainathan callback gap
    expect(blob.toLowerCase()).toMatch(/redlining|city national|department of justice|doj/); // lending
    expect(blob).toMatch(/9,?000/);                       // beauty-supply store count
    expect(barriers.lesson.toLowerCase()).toMatch(/not .*allegations|documented|court/);
  });
  it('leads with the WRITTEN housing exclusion — covenants, the FHA manual, redlining, and the persistent interest penalty', () => {
    const blob = `${barriers.bigIdea} ${barriers.lesson} ${barriers.levels.senior} ${barriers.levels.child}`.toLowerCase();
    expect(blob).toMatch(/covenant/);                     // racial restrictive covenants
    expect(blob).toMatch(/redlin|holc|fha/);              // federal redlining
    expect(blob).toMatch(/ghetto|hood/);                  // the manufactured neighborhood
    expect(blob).toMatch(/credit score|controlling for credit|regardless of credit|same.*credit/); // interest penalty persists
    // the interest penalty is sourced (Harvard JCHS or similar)
    const src = econSources().filter((s) => s.moduleId === 'econ5-the-real-barriers');
    expect(src.some((s) => /credit|interest|mortgage/i.test(s.claim))).toBe(true);
  });
  it('the real wealth-gap numbers are stated (module 3), stronger than the debunked myth', () => {
    const m3 = ECON_MODULES.find((m) => m.id === 'econ3-circulation');
    const blob = `${m3.bigIdea} ${m3.lesson} ${m3.levels.senior}`;
    expect(blob).toMatch(/284,?310/);                     // median white household wealth
    expect(blob).toMatch(/44,?100/);                      // median Black household wealth
    // the myth is still dropped, but not used to mute the reality
    expect(blob.toLowerCase()).toMatch(/myth|debunk|unsubstantiated/);
  });
  it('keeps the one-new-man frame governing the RESPONSE, never the muting of facts', () => {
    const blob = `${barriers.anchor.ref} ${barriers.levels.senior} ${barriers.lesson}`;
    expect(blob).toMatch(/Ephesians 2:14/);
    expect(barriers.lesson.toLowerCase()).toMatch(/never .*mute|truth first|build access/);
  });
});

describe('the accountability + judgment spine (no one gets away with anything)', () => {
  const acc = ECON_MODULES.find((m) => m.id === 'econ6-accountability-and-judgment');
  it('exists and names God’s judgment on unjust economics', () => {
    expect(acc).toBeTruthy();
    expect(acc.anchor.ref).toMatch(/James 5/);
    expect(acc.anchor.ref).toMatch(/Galatians 6:7/);
    expect(`${acc.lesson} ${acc.levels.senior}`).toMatch(/Proverbs 11:1|false balance/);
  });
  it('holds reconciliation through repentance + restitution (Zacchaeus), not around the truth', () => {
    const blob = `${acc.bigIdea} ${acc.lesson} ${acc.levels.senior}`;
    expect(blob).toMatch(/Zacchaeus/);
    expect(blob.toLowerCase()).toMatch(/restitution|restore.*fourfold|fourfold/);
    expect(blob.toLowerCase()).toMatch(/no one gets away|God is not mocked|judgment/);
  });
  it('the exposure is GOD’s doing and the account is INDIVIDUAL (each actor answers)', () => {
    const blob = `${acc.bigIdea} ${acc.lesson} ${acc.levels.senior}`;
    expect(blob).toMatch(/Romans 14:12|give account of himself|judgment seat of Christ/);
    expect(blob.toLowerCase()).toMatch(/nothing hidden|exposing|exposure|revealed/);
    // the actors named plainly (governments/banks/news-as-mammon)
    expect(blob.toLowerCase()).toMatch(/bank|government|politician|news|corporation/);
  });
  it('carries the COVERING of the oppressed — El Roi saw Hagar; He covers His children', () => {
    const blob = `${acc.bigIdea} ${acc.lesson} ${acc.levels.senior} ${acc.levels.child}`;
    expect(blob).toMatch(/Hagar|El Roi|God who sees|God seest me/);
    expect(blob.toLowerCase()).toMatch(/cover/);          // He covers His children
    expect(blob).toMatch(/Genesis 16:13|Psalm 91|feathers|wings/);
  });
  it('cites Dr. Frederick K.C. Price’s "Race, Religion & Racism" as the primary Christian voice on the Church’s account', () => {
    const src = econSources().filter((s) => s.moduleId === 'econ6-accountability-and-judgment');
    expect(src.length).toBeGreaterThan(0);
    const price = src.find((s) => /Frederick K\.?C\.? Price|Race, Religion/i.test(`${s.title} ${s.publisher} ${s.claim}`));
    expect(price, 'the Dr. Price source').toBeTruthy();
    expect(price.url).toMatch(/^https?:\/\//);
    expect(acc.lesson).toMatch(/Frederick K\.?C\.? Price/);
    expect(acc.lesson.toLowerCase()).toMatch(/consent of the church/);
  });
});

describe('the builder’s road (module 8) — frameworks tested against the Word (DR-0140)', () => {
  const road = ECON_MODULES.find((m) => m.id === 'econ8-test-build-multiply');
  it('exists, teaches test-before-build, and points at the live Client Growth engine', () => {
    expect(road).toBeTruthy();
    expect(road.anchor.ref).toMatch(/Proverbs 24:27/);
    expect(road.anchor.ref).toMatch(/Luke 14:28/);
    const blob = `${road.bigIdea} ${road.lesson} ${road.levels.senior}`.toLowerCase();
    expect(blob).toMatch(/waiting list|discussion group|needs analysis/);
    expect(blob).toMatch(/count the cost/);
    expect(road.inApp).toMatch(/Client Growth/);
  });
  it('names the 7-11-4 rule as an attributed HEURISTIC — never Scripture or verified research', () => {
    const blob = `${road.lesson} ${road.levels.senior} ${JSON.stringify(road.quiz)}`;
    expect(blob).toMatch(/7-11-4/);
    expect(blob.toLowerCase()).toMatch(/heuristic|rule of thumb/);
    expect(blob).toMatch(/Priestley/);
    expect(blob.toLowerCase()).toMatch(/not (settled science|scripture)|never .*(scripture|verified research)/);
  });
  it('corrects the over-reach: identity in Christ, the brand is a good NAME stewarded', () => {
    const blob = `${road.lesson} ${road.levels.senior}`;
    expect(blob).toMatch(/Proverbs 22:1/);
    expect(blob).toMatch(/Proverbs 27:2|another man praise thee/);
    expect(blob.toLowerCase()).toMatch(/identity is (settled )?in christ|identity stays in christ/);
  });
  it('keeps the governing guards: James 4 ("if the Lord will"), soul-first, serve-not-extract', () => {
    const blob = `${road.bigIdea} ${road.lesson} ${road.levels.senior}`;
    expect(blob).toMatch(/If the Lord will/);
    expect(blob.toLowerCase()).toMatch(/soul (still comes|first)/);
    expect(blob.toLowerCase()).toMatch(/serve|scattereth/);
  });
  it('carries NO fabricated source URLs — attribution rides honestly in prose (sandbox cannot live-verify URLs)', () => {
    expect(econSources().filter((s) => s.moduleId === 'econ8-test-build-multiply')).toHaveLength(0);
    expect(road.lesson).toMatch(/Daniel Priestley/);
  });
  it('every KJV fragment quoted in the module is VERBATIM from the shipped KJV (proven-to-catch)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const kjv = (file) => JSON.parse(fs.readFileSync(path.resolve(__dirname, `../../public/bible/kjv/${file}.json`), 'utf8'));
    const verse = (file, ch, v) => kjv(file).chapters[ch - 1][v - 1];
    const blob = `${road.bigIdea} ${road.lesson} ${road.levels.senior} ${road.levels.child} ${road.anchor.theme}`;
    const fragments = [
      [verse('Proverbs', 24, 27), /Prepare thy work without, and make it fit for thyself in the field; and afterwards build thine house/],
      [verse('Proverbs', 22, 29), /Seest thou a man diligent in his business\? he shall stand before kings/],
      [verse('Galatians', 6, 9), /in due season we shall reap, if we faint not/],
      [verse('1Corinthians', 14, 8), /if the trumpet give an uncertain sound, who shall prepare himself to the battle\?/],
      [verse('Proverbs', 27, 2), /Let another man praise thee, and not thine own mouth/],
      [verse('James', 4, 15), /If the Lord will/],
      [verse('Ecclesiastes', 11, 6), /In the morning sow thy seed, and in the evening withhold not thine hand/],
      [verse('Proverbs', 13, 20), /He that walketh with wise men shall be wise/],
    ];
    for (const [shipped, quoted] of fragments) {
      expect(blob, `quoted in module: ${quoted}`).toMatch(quoted);
      expect(shipped, `verbatim in shipped KJV: ${quoted}`).toMatch(quoted);
    }
  });
});

describe('verification discipline (sources)', () => {
  it('every documented source carries a publisher, a url, and an as-of date', () => {
    const sources = econSources();
    expect(sources.length).toBeGreaterThanOrEqual(6);
    for (const s of sources) {
      expect(s.publisher, `${s.moduleId} source publisher`).toBeTruthy();
      expect(s.url, `${s.moduleId} source url`).toMatch(/^https?:\/\//);
      expect(s.asOf, `${s.moduleId} source asOf`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('the barriers and Greenwood modules are sourced (not asserted from memory)', () => {
    const byModule = (id) => econSources().filter((s) => s.moduleId === id);
    expect(byModule('econ5-the-real-barriers').length).toBeGreaterThanOrEqual(3);
    expect(byModule('econ3-circulation').length).toBeGreaterThanOrEqual(2);
    expect(byModule('econ7-build-institutions').length).toBeGreaterThan(0);
  });
});

describe('shared machinery + registration', () => {
  it('builds a schedule, a progress summary, and a curriculum markdown', () => {
    const sched = buildEconSchedule('2026-08-01');
    expect(sched.length).toBe(ECON_MODULES.length);
    expect(econProgressSummary({}).total).toBe(ECON_MODULES.length);
    expect(exportEconCurriculumMarkdown('2026-08-01')).toContain(ECON_META.title);
  });
  it('resolves a cohort (ships proposed until the Governor confirms)', () => {
    expect(ECON_CONFIRMED_COHORT.confirmed).toBe(false);
    expect(resolveEconCohort(null).confirmed).toBe(false);
    expect(ECON_PROPOSED_COHORT_START).toBeNull();
  });
  it('is registered as a real corpus course', () => {
    const keys = defaultCourses().map((c) => c.key);
    expect(keys).toContain('kingdom-economics');
  });
  it('the tutor meta holds truth-both-ways, the documented barriers, and accountability', () => {
    const p = ECON_TUTOR_META.posture.toLowerCase();
    expect(p).toMatch(/documented fact|never .*allegation/);
    expect(p).toMatch(/myth/);
    expect(p).toMatch(/restitution|zacchaeus|no one gets away/);
  });
});
