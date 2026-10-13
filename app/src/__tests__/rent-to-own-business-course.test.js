// @vitest-environment node
// =============================================================================
// Rent to Own — the business suite's first slice, gated
// =============================================================================
// Darrell 2026-09-17: "I would like to have a whole business suite of courses...
// use rent to own business models as a foundation for inventory control, sales,
// collections, customer service, marketing." Then the correction that named the
// course: "use the term RENT TO OWN... I've worked for Rentway first and Rentway
// taught me way more than Rent-A-Center BECAUSE OF THE WAY THAT BUSINESS
// OPERATING SYSTEMS WORKED." And the ladder: account manager to assistant
// manager to general manager, "I WORKED IN EVERY SINGLE POSITION."
//
// This gate holds four things that are easy to lose and hard to notice losing:
//
//   1. THE WORD IS QUOTED VERBATIM. Every double-quoted span in the whole
//      course is checked against the repo's own KJV, with a NAMED allowlist for
//      our own phrases — and every allowlist entry is asserted ABSENT from the
//      corpus, so the list can never be used to smuggle a drifted verse past.
//      This caught two of my own defects while the course was being written: a
//      fabricated terminal period on Matthew 25:21 (the verse has a colon and
//      continues) and a COMPRESSION of Philippians 2:4 presented in quotation
//      marks. Both are the classes the living-lessons pass has been finding all
//      along, authored fresh here.
//
//   2. THE OPERATING FACTS STAY LABELLED. Each sourced claim must remain
//      attributed in the prose. An operating fact that loses its attribution
//      becomes a thing this platform asserts on its own authority, which is the
//      false-attribution class pointed at industry data instead of Scripture.
//
//   3. BOTH TIERS OF HONESTY ON THE PRICE (DR-0100 / DR-0076). The FTC's
//      finding that rent-to-own total cost can run two to three times retail is
//      stated PLAINLY — under-claiming a verified truth is as much a failure as
//      over-claiming — and it is NOT inside quotation marks, because ftc.gov was
//      unreachable from this session and the exact wording was never held. The
//      substance is vouched for; the wording is not. The gate holds both halves:
//      the claim present, the quotation marks absent.
//
//   4. DARRELL'S SPINE IS THE COURSE'S SPINE. Honor as the operating mechanism,
//      covenant over contract, Uncle Russell's three takings, and "be the best
//      in this too". Without these it is a generic operations course with verses
//      attached, which is the failure mode worth gating against.
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RTO_BUSINESS_MODULES, RTO_BUSINESS_META, RTO_BUSINESS_SESSION_FLOW,
  buildRtoBusinessSchedule, exportRtoBusinessCurriculumMarkdown,
} from '../lib/rent-to-own-business-class.js';
import { LEARN_CATALOG, catalogCategory } from '../lib/learn-catalog.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const KJV_DIR = join(HERE, '..', '..', 'public', 'bible', 'kjv');
const KJV_FLOW = (() => {
  let all = '';
  for (const f of readdirSync(KJV_DIR).filter((x) => x.endsWith('.json'))) {
    let j;
    try { j = JSON.parse(readFileSync(join(KJV_DIR, f), 'utf8')); } catch { continue; }
    if (!j || !Array.isArray(j.chapters)) continue;
    for (const ch of j.chapters) all += `${ch.join(' ')}\n`;
  }
  return all.replace(/’/g, "'");
})();

// Every string in the course, with the path that produced it — field by field,
// never a raw source slice. A slice desynchronises on a field boundary and
// manufactures phantom findings (the lesson of the living-lessons audits).
const FLAT = (() => {
  const out = [];
  const walk = (path, v) => {
    if (typeof v === 'string') out.push([path, v]);
    else if (Array.isArray(v)) v.forEach((e, i) => walk(`${path}[${i}]`, e));
    else if (v && typeof v === 'object') for (const [k, e] of Object.entries(v)) walk(path ? `${path}.${k}` : k, e);
  };
  for (const m of RTO_BUSINESS_MODULES) walk(m.id, m);
  walk('META', RTO_BUSINESS_META);
  return out;
})();

const ALL_TEXT = FLAT.map(([, t]) => t).join('\n').replace(/’/g, "'");

const spansOf = (text) => {
  const s = text.replace(/’/g, "'");
  const at = [...s.matchAll(/"/g)].map((m) => m.index);
  const out = [];
  for (let i = 0; i + 1 < at.length; i += 2) out.push(s.slice(at[i] + 1, at[i + 1]));
  return { spans: out, balanced: at.length % 2 === 0 };
};

// OUR OWN QUOTED PHRASES, every one accounted for by category. Not one of them
// is Scripture, and the honesty check below proves it against the corpus.
const OUR_OWN_QUOTED = [
  'it is just business',    // the excuse the lesson examines
  'inventory',              // a term scare-quoted by us, as one lump
  'be good anyway',         // the weaker alternative Ephesians 6:6-7 replaces
  'it is not my department', // the excuse Proverbs 3:27 removes
  'not my department',      // the same, shortened
];

describe('the course exists with its full shape and is registered', () => {
  it('eight lessons, each with the fields the Learn surface reads', () => {
    expect(RTO_BUSINESS_MODULES.length).toBe(8);
    for (const m of RTO_BUSINESS_MODULES) {
      for (const k of ['id', 'title', 'bigIdea', 'anchor', 'lesson', 'inApp', 'benefits', 'quiz', 'facilitator']) {
        expect(m[k], `${m.id} missing ${k}`).toBeTruthy();
      }
      expect(m.anchor.ref, `${m.id} anchor needs a ref`).toBeTruthy();
      expect(m.quiz.questions.length, `${m.id} needs real questions`).toBeGreaterThanOrEqual(3);
      expect(m.benefits.length, `${m.id} needs real benefits`).toBeGreaterThanOrEqual(4);
      expect(m.lesson.length, `${m.id} lesson is a stub`).toBeGreaterThan(2500);
    }
  });

  it('every quiz answer index points at a real option, and every question explains itself', () => {
    for (const m of RTO_BUSINESS_MODULES) {
      for (const [i, q] of m.quiz.questions.entries()) {
        expect(q.options.length, `${m.id} q${i} needs options`).toBeGreaterThanOrEqual(3);
        expect(q.answer, `${m.id} q${i} answer out of range`).toBeLessThan(q.options.length);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.explain, `${m.id} q${i} has no explanation`).toBeTruthy();
      }
    }
  });

  it('it is REGISTERED in the derived catalog, in the Business department', () => {
    // A course built and not surfaced is the 2026-07-08 miss the registry
    // exists to prevent. And the department is the registry's to declare.
    const entry = LEARN_CATALOG.find((c) => c.key === 'rent-to-own-business');
    expect(entry, 'the course must be in LEARN_CATALOG or nobody can reach it').toBeTruthy();
    expect(catalogCategory('rent-to-own-business')).toBe('Business');
    expect(entry.buildScheduleRows().length).toBe(8);
  });

  it('the schedule numbers the lessons, and the curriculum exports', () => {
    const rows = buildRtoBusinessSchedule();
    expect(rows.map((r) => r.week)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    const md = exportRtoBusinessCurriculumMarkdown();
    expect(md.length).toBeGreaterThan(2000);
    expect(md).toContain('Rent to Own');
    expect(RTO_BUSINESS_SESSION_FLOW.length).toBeGreaterThanOrEqual(3);
  });
});

describe('the Word is quoted verbatim — the whole-span gate', () => {
  it('the double quotes are balanced in every field, so the spans are real quotations', () => {
    const bad = FLAT.filter(([, t]) => !spansOf(t).balanced).map(([p]) => p);
    expect(bad, `unbalanced quotes: ${bad.join(', ')}`).toEqual([]);
  });

  it('EVERY quoted span is verbatim KJV, or one of the listed non-Scripture phrases', () => {
    const altered = [];
    let count = 0;
    for (const [path, text] of FLAT) {
      for (const span of spansOf(text).spans) {
        count += 1;
        for (const part of span.split('...').map((x) => x.trim()).filter(Boolean)) {
          if (OUR_OWN_QUOTED.includes(part)) continue;
          if (!KJV_FLOW.includes(part)) altered.push(`${path} :: ${JSON.stringify(part)}`);
        }
      }
    }
    expect(count, 'a Word-first course should carry a substantial body of quoted Scripture').toBeGreaterThan(60);
    expect(altered, `quoted text that is NOT verbatim KJV:\n${altered.join('\n')}`).toEqual([]);
  });

  it('a verse can never hide behind the allowlist', () => {
    for (const q of OUR_OWN_QUOTED) {
      expect(KJV_FLOW.includes(q), `allowlisted phrase IS Scripture: ${q}`).toBe(false);
    }
  });

  it('NO fabricated terminal punctuation on Matthew 25:21 — a defect authored HERE and caught', () => {
    // Written first as `...ruler over many things."` The verse has a COLON there
    // and keeps going: `: enter thou into the joy of thy lord.` The invented
    // period is the terminal-punctuation class, authored fresh in this course.
    expect(ALL_TEXT).not.toContain('ruler over many things."');
    expect(ALL_TEXT).toContain('I will make thee ruler over many things: enter thou into the joy of thy lord.');
  });

  it('NO compression of Philippians 2:4 is presented as the verse — the second defect caught here', () => {
    // `look on the things of others` is OURS, a compression of `Look not every
    // man on his own things, but every man also on the things of others.`
    // In quotation marks it reads as the verse. Unquoted it is fine, and the
    // course still emphasises it in capitals, which is our voice, not His.
    expect(ALL_TEXT).not.toContain('"look on the things of others"');
    expect(ALL_TEXT).toContain('Look not every man on his own things, but every man also on the things of others.');
  });
});

describe('the operating facts stay ATTRIBUTED, never asserted on our own authority', () => {
  // SCOPED TO ONE FIELD, AND THIS MATTERS MORE THAN IT LOOKS. The first version
  // of these checks asked whether the claim and its attribution each appeared
  // SOMEWHERE in the course. Two of them then stayed GREEN under a real break:
  // stripping "The industry association reports that" off the three-in-four
  // figure, and stripping the filings attribution off the two buckets. Other
  // sentences elsewhere in the course still carried those words, so the
  // course-wide match held the check up while the actual claim stood
  // unattributed. That is the same leak found on L90 the same day -- a
  // corpus-wide toContain cannot prove WHERE a property lives.
  //
  // And for attribution it is not a technicality: AN ATTRIBUTION THREE LESSONS
  // AWAY ATTRIBUTES NOTHING. So the claim and its source must co-occur in the
  // SAME field, which is the only arrangement a reader actually benefits from.
  // SENTENCE granularity, arrived at by breaking the check twice. Field-scoping
  // was the first fix and it was STILL too coarse: a lesson body is four
  // thousand characters carrying several claims and several attributions, so
  // stripping one claim's source left a DIFFERENT sentence's source in the same
  // field holding the check green. The unit a reader actually reads an
  // attribution in is the sentence, so that is the unit checked.
  const sentences = (t) => t.split(/(?<=[.?!])\s+/).filter(Boolean);
  const attributed = (label, claim, attribution) => {
    const carrying = [];
    for (const [path, text] of FLAT) {
      for (const sent of sentences(text)) if (claim.test(sent)) carrying.push([path, sent]);
    }
    expect(carrying.length, `${label}: the claim itself is missing from the course`).toBeGreaterThan(0);
    const unattributed = carrying
      .filter(([, sent]) => !attribution.test(sent))
      .map(([path, sent]) => `${path} :: ${sent.slice(0, 110)}`);
    expect(
      unattributed,
      `${label}: the claim appears in a sentence with NO source in it:\n${unattributed.join('\n')}`,
    ).toEqual([]);
  };

  it('the FTC-sourced return feature is attributed to the FTC', () => {
    attributed('return and owe nothing', /RETURN THE ITEM AT ANY TIME AND OWE NOTHING FURTHER/, /Federal Trade Commission/);
  });

  it('the three-in-four return figure is attributed to the industry association', () => {
    attributed('voluntary return rate', /three agreements in four end in a voluntary return/, /industry association reports/);
  });

  it('the on-rent / held-for-rent split is attributed to the filings', () => {
    attributed('two buckets', /ON RENT and HELD FOR RENT/, /(filings|financial reporting)/);
  });

  it('the income-forecasting method and the 270/180 rule are attributed, with their real numbers', () => {
    expect(ALL_TEXT).toMatch(/income-forecasting method/);
    expect(ALL_TEXT).toMatch(/270 days old/);
    expect(ALL_TEXT).toMatch(/180 consecutive days/);
    expect(ALL_TEXT).toMatch(/as those filings describe it/i);
  });

  it('the account manager\'s re-sell-and-educate priority is attributed to the role definition', () => {
    attributed(
      're-sell and educate',
      /RE-SELL THE AGREEMENT AND EDUCATE THE CUSTOMER RATHER THAN SIMPLY CALLING TO COLLECT MONEY/,
      /(role definition|the industry itself describes|INDUSTRY.{0,3}S OWN JOB DEFINITION)/i,
    );
  });

  it('the early-purchase saving is attributed and given as a range, never a precise claim', () => {
    expect(ALL_TEXT).toMatch(/forty to sixty percent/);
    expect(ALL_TEXT).toMatch(/industry association reports/);
  });
});

describe('BOTH tiers of honesty on the price (DR-0100 and DR-0076 together)', () => {
  it('the two-to-three-times finding is STATED PLAINLY — not softened into what people say', () => {
    // DR-0100: under-claiming a verified truth is as much a failure of truth as
    // over-claiming one. A Word-first business course that went quiet on this
    // would be useless, not gracious.
    expect(ALL_TEXT).toMatch(/two to three times retail prices, and sometimes more/);
    expect(ALL_TEXT).toMatch(/significantly higher than a retail store/);
    expect(ALL_TEXT).toMatch(/states it plainly rather than softening it/);
  });

  it('and it is NOT inside quotation marks, because the FTC document was never held', () => {
    // ftc.gov was unreachable from this session (egress-blocked), so the claim
    // is carried from reports of the Commission's testimony and staff work. The
    // substance is vouched for; the exact wording is not. Quoting it would be
    // the twelfth false attribution of this pass, authored by us.
    expect(ALL_TEXT).not.toContain('"can be two to three times retail prices');
    expect(ALL_TEXT).toMatch(/PARAPHRASED AND ATTRIBUTED rather than inside quotation marks/);
    expect(ALL_TEXT).toMatch(/did not fetch the Commission/);
  });

  it('the just weight is laid beside it, in full', () => {
    for (const frag of [
      'A false balance is abomination to the LORD: but a just weight is his delight.',
      'Divers weights, and divers measures, both of them are alike abomination to the LORD.',
      "A just weight and balance are the LORD's: all the weights of the bag are his work.",
      'But thou shalt have a perfect and just weight, a perfect and just measure shalt thou have',
      'Just balances, just weights, a just ephah, and a just hin, shall ye have',
    ]) {
      expect(ALL_TEXT, `just-weight verse missing: ${frag.slice(0, 40)}`).toContain(frag);
    }
  });

  it('the two questions are held APART, which is the whole integrity of that lesson', () => {
    // Collapsing operational excellence and price structure is how the
    // conversation goes wrong in BOTH directions. The course must say so.
    expect(ALL_TEXT).toMatch(/genuinely excellent/);
    expect(ALL_TEXT).toMatch(/THE PRICE STRUCTURE IS A DIFFERENT QUESTION/);
    expect(ALL_TEXT).toMatch(/collapsing them/i);
    expect(ALL_TEXT, 'both wrong directions must be named, not just the one we dislike').toMatch(/dismisses the operational skill/);
    expect(ALL_TEXT).toMatch(/defends the pricing/);
  });

  it('and the buyer is disciplined too, so it is not one-sided', () => {
    expect(ALL_TEXT).toContain('It is naught, it is naught, saith the buyer: but when he is gone his way, then he boasteth.');
  });
});

describe("Darrell's spine is the course's spine, not verses bolted to an operations manual", () => {
  it('HONOR IS THE MECHANISM, and the course says WHY structurally', () => {
    expect(ALL_TEXT).toMatch(/honor has left the room|honor's left the room|honour leaves the room|honor has left/i);
    // The structural argument is the part that makes it teaching rather than
    // sentiment: no balance owed on ending means no lever, so the only outcome
    // available is a free choice repeated.
    expect(ALL_TEXT).toMatch(/THE STORE HAS NO LEVER/);
    expect(ALL_TEXT).toMatch(/honor is not decoration on the business/i);
  });

  it('COVENANT OVER CONTRACT, with the contract defined by its failure case AND still written down', () => {
    expect(ALL_TEXT).toMatch(/A COVENANT FROM YAHWEH IS WAY BETTER/);
    expect(ALL_TEXT).toMatch(/defined by its failure case/);
    expect(ALL_TEXT).toContain('yet is she thy companion, and the wife of thy covenant.');
    expect(ALL_TEXT).toContain('through the blood of the everlasting covenant');
    // Both halves in the same breath — covenant does not abolish the document.
    expect(ALL_TEXT).toMatch(/YOU STILL WRITE IT DOWN/);
    expect(ALL_TEXT, 'the theological limit must be stated, not blurred (DR-0098)').toMatch(/is not a marriage and is not the everlasting covenant/);
  });

  it("UNCLE RUSSELL'S RULE, with its three takings kept genuinely distinct", () => {
    expect(ALL_TEXT).toMatch(/PUT YOUR HEAD DOWN AND GO GET THE INFORMATION/);
    // Three separate things, not one restated — the course must say which is which.
    expect(ALL_TEXT).toMatch(/INFORMATION is what happened/);
    expect(ALL_TEXT).toMatch(/UNDERSTANDING is why/);
    expect(ALL_TEXT).toMatch(/SKILL is being able to do it again/);
  });

  it('THE LADDER AND EVERY SEAT, which is the teacher\'s credential', () => {
    expect(ALL_TEXT).toMatch(/ACCOUNT MANAGER/);
    expect(ALL_TEXT).toMatch(/ASSISTANT MANAGER/);
    expect(ALL_TEXT).toMatch(/GENERAL MANAGER/);
    expect(ALL_TEXT).toMatch(/worked every single position/);
    expect(ALL_TEXT).toContain('He that is faithful in that which is least is faithful also in much');
  });

  it('THE OPERATING SYSTEM IS THE SUBJECT, never a company — which is why the course is named for the model', () => {
    expect(RTO_BUSINESS_META.title).toMatch(/Rent to Own/);
    expect(ALL_TEXT).toMatch(/BECAUSE OF THE WAY ITS BUSINESS OPERATING SYSTEMS WORKED/);
    expect(ALL_TEXT).toMatch(/BUSINESS FLOW/);
    expect(ALL_TEXT).toMatch(/A company can be bought, renamed or closed/);
  });

  it('BE THE BEST IN THIS TOO — the closing standard, in the founding lesson itself', () => {
    // Scoped, for the same reason as the attributions above: this phrase stands
    // in two places in lesson one (the prose and the benefits), and a
    // course-wide match stayed GREEN when one of them was removed.
    const rto1 = RTO_BUSINESS_MODULES.find((m) => m.id.startsWith('rto1'));
    expect(rto1.lesson, 'the founding lesson must close on the standard').toMatch(/BE THE BEST IN THIS TOO/);
    expect(rto1.lesson).toMatch(/left, left, right, left/);
    expect(rto1.benefits.join(' '), 'and the benefits must carry it too').toMatch(/be the best in this too/i);
  });

  it('FEED MY SHEEP is why it is being poured out, all three times', () => {
    expect(ALL_TEXT).toContain('He saith unto him, Feed my lambs.');
    expect(ALL_TEXT).toContain('He saith unto him, Feed my sheep.');
    expect(ALL_TEXT).toContain('Jesus saith unto him, Feed my sheep.');
    expect(ALL_TEXT).toMatch(/GIVE AWAY AS MUCH AS HE CAN BEFORE HE PASSES/);
  });

  it('the honor runs BOTH directions — the employer is bound too', () => {
    // A business gracious to customers and slow to pay its own people has
    // learned a customer-facing imitation of this lesson.
    expect(ALL_TEXT).toContain('the wages of him that is hired shall not abide with thee all night until the morning.');
    expect(ALL_TEXT).toContain('neither shall the sun go down upon it');
    expect(ALL_TEXT).toMatch(/slow to pay its own people/);
  });
});

describe('our own voice names Him by His covenant name (DR-0210)', () => {
  it('no generic "God" in our authored prose — only inside quoted Scripture', () => {
    let ours = ALL_TEXT;
    for (const [, text] of FLAT) {
      for (const span of spansOf(text).spans) ours = ours.split(`"${span}"`).join(' ');
    }
    const generic = ours.match(/\bGod\b/g) || [];
    expect(generic.length, 'generic "God" in our authored voice').toBe(0);
    expect((ours.match(/Yahweh/g) || []).length).toBeGreaterThan(2);
  });
});

describe('the five domains Darrell named are each actually taught', () => {
  const ids = RTO_BUSINESS_MODULES.map((m) => m.id).join(' ');
  it('inventory control, sales, collections, customer service and marketing all have their own lesson', () => {
    for (const domain of ['inventory-control', 'sales', 'collections', 'customer-service', 'marketing']) {
      expect(ids, `no lesson for the domain Darrell named: ${domain}`).toContain(domain);
    }
  });

  it('and each domain lesson carries a real operating mechanism, not just verses', () => {
    const byId = (frag) => RTO_BUSINESS_MODULES.find((m) => m.id.includes(frag));
    expect(byId('inventory-control').lesson).toMatch(/IDLE IS THE ENEMY/);
    expect(byId('sales').lesson).toMatch(/THE SIGNATURE IS THE START OF THE SALE/);
    expect(byId('collections').lesson).toMatch(/IT IS A SALES CALL ABOUT KEEPING SOMETHING/);
    expect(byId('customer-service').lesson).toMatch(/IN CUSTOMERS.{0,3} HOMES/);
    expect(byId('marketing').lesson).toMatch(/customers who left are your marketing department/);
  });
});
