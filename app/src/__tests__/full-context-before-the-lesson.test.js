// A lesson states its own terms BEFORE the reader starts it.
//
// Darrell, 2026-09-22, reading issue 17's Stage 3 and finding the provenance
// limits only after he had already read the perspectives:
//
//   "We quote none of them verbatim from the recording... This is a gap in our
//    lessons... we need to be able to have full context before lessons....
//    opportunities and constraints?"
//
// The gap was structural, not a slip in one lesson. A World-Issues lesson knew
// exactly how much of itself was documented, how much was disputed, and how
// much was inference — the numbers were sitting in its own arrays — and it told
// the reader none of it. The only place its limits lived was `source.note`,
// which on issue 17 is ~2,400 characters of continuous prose rendered as one
// small grey paragraph. A limit a reader has to mine out is a limit that does
// not reach him.
//
// THE DISCIPLINE THESE CASES HOLD. The counts are COUNTED, every time the panel
// renders, from the same arrays the stages draw from — so the block can never
// drift from the lesson it describes, the way a hand-written "12 sources" would
// the first time a source was removed. What a count cannot know — that nobody
// watched the recording — is AUTHORED (`issue.limits`) and never guessed. And
// when a lesson has not authored its limits, the panel SAYS SO rather than
// letting the silence read as "there are none" (DR-0076 §8).

import { describe, it, expect } from 'vitest';
import { lessonContext, countShape } from '../lib/lesson-context.js';
import { normalizeIssue } from '../lib/discernment-track.js';
import { WORLD_ISSUES } from '../lib/world-issues-class.js';

const ISSUE17 = WORLD_ISSUES.find((x) => x.id === 'wi-biology-walked-back-and-the-word-on-the-worlds');

describe('the counts are measured from the lesson, not written about it', () => {
  it('countShape matches what is actually in the arrays', () => {
    const c = countShape(ISSUE17);
    expect(c.claims).toBe(ISSUE17.claims.length);
    expect(c.verifiable).toBe(ISSUE17.verifiable.length);
    expect(c.interpretation).toBe(ISSUE17.interpretation.length);
    expect(c.perspectives).toBe(ISSUE17.perspectives.length);
    expect(c.documented + c.partlyDocumented + c.disputed).toBe(ISSUE17.verifiable.length);
  });

  it('the source count is the real number of source entries, linked and unlinked', () => {
    const c = countShape(ISSUE17);
    const real = ISSUE17.verifiable.flatMap((v) => v.sources || []);
    expect(c.sources).toBe(real.length);
    expect(c.sourcesLinked + c.sourcesUnlinked).toBe(real.length);
    expect(c.sourcesLinked).toBe(real.filter((s) => s.url).length);
  });

  it('REPRODUCES THE DRIFT A HAND-WRITTEN BLOCK WOULD HAVE: remove a fact, the number moves', () => {
    // This is the whole argument for counting rather than authoring. A prose
    // line saying "eleven items" survives the deletion of an item; a count does
    // not, and the panel corrects itself with no one remembering to.
    const before = lessonContext(ISSUE17);
    const thinner = { ...ISSUE17, verifiable: ISSUE17.verifiable.slice(0, -1) };
    const after = lessonContext(thinner);
    expect(after.counts.verifiable).toBe(before.counts.verifiable - 1);
    expect(JSON.stringify(after.constraints)).not.toEqual(JSON.stringify(before.constraints));
  });

  it('counts singular and plural honestly, because "1 facts" teaches distrust', () => {
    const one = lessonContext({
      verifiable: [{ id: 'v1', status: 'documented', statement: 'x', sources: [{ title: 't', url: 'https://e.example' }] }],
      perspectives: [{ id: 'p1' }],
      interpretation: [{ id: 'n1' }],
    });
    const joined = JSON.stringify(one);
    expect(joined).toMatch(/1 fact is stated as DOCUMENTED/);
    expect(joined).toMatch(/1 dated source you can open yourself/);
    expect(joined).toMatch(/1 statement is marked as INFERENCE/);
    expect(joined).not.toMatch(/1 facts/);
    expect(joined).not.toMatch(/1 perspectives/);
  });
});

describe('every entry declares where it came from', () => {
  it('each line carries a basis of counted, authored or structural', () => {
    const { opportunities, constraints } = lessonContext(ISSUE17);
    for (const e of [...opportunities, ...constraints]) {
      expect(['counted', 'authored', 'structural']).toContain(e.basis);
      expect(e.text.length).toBeGreaterThan(20);
      expect(e.id).toBeTruthy();
    }
  });

  it('the authored limits come through verbatim and are marked as authored', () => {
    const { constraints } = lessonContext(ISSUE17);
    const authored = constraints.filter((k) => k.basis === 'authored');
    expect(authored).toHaveLength(ISSUE17.limits.length);
    for (const l of ISSUE17.limits) {
      expect(authored.find((a) => a.id === l.id)?.text).toBe(l.text);
    }
  });

  it('nothing authored is quietly invented when the lesson stated nothing', () => {
    const { constraints } = lessonContext({ ...ISSUE17, limits: [] });
    expect(constraints.filter((k) => k.basis === 'authored')).toHaveLength(0);
  });
});

describe('the silence is reported instead of reading as "no limits"', () => {
  it('a lesson with no authored limits says that plainly', () => {
    const { constraints } = lessonContext({ ...ISSUE17, limits: undefined });
    const unstated = constraints.find((k) => k.id === 'con-limits-unstated');
    expect(unstated).toBeTruthy();
    expect(unstated.text).toMatch(/has not stated its source limits separately/);
  });

  it('and a lesson that HAS stated them does not also carry the "unstated" line', () => {
    const { constraints } = lessonContext(ISSUE17);
    expect(constraints.find((k) => k.id === 'con-limits-unstated')).toBeUndefined();
  });

  it('the constraints side is never empty for any issue in the catalog', () => {
    // An empty constraints column would read as "this lesson has no limits",
    // which is never true of anything written by people about the world.
    for (const issue of WORLD_ISSUES) {
      const { constraints } = lessonContext(issue);
      expect(constraints.length, issue.id).toBeGreaterThan(0);
    }
  });

  it('the opportunities side is never empty either', () => {
    for (const issue of WORLD_ISSUES) {
      const { opportunities } = lessonContext(issue);
      expect(opportunities.length, issue.id).toBeGreaterThan(0);
    }
  });
});

describe('issue 17 in particular — the lesson that exposed the gap', () => {
  it('names all three of its real source limits', () => {
    const text = lessonContext(ISSUE17).constraints.map((k) => k.text).join(' ');
    expect(text).toMatch(/Nobody here has watched or heard this conversation/);
    expect(text).toMatch(/machine’s hearing/);
    expect(text).toMatch(/nothing here can be cited to a minute mark/);
  });

  it('states the unsettled portion as a number rather than a mood', () => {
    const text = lessonContext(ISSUE17).constraints.map((k) => k.text).join(' ');
    expect(text).toMatch(/2 are DISPUTED/);
    expect(text).toMatch(/1 is PARTLY DOCUMENTED/);
  });

  it('source.medium no longer says SUMMARY, because the transcript replaced it', () => {
    // The medium field stayed "video, received as a written SUMMARY" after the
    // captions landed, so the one-line summary of provenance disagreed with the
    // corrected note directly beneath it.
    expect(ISSUE17.source.medium).not.toMatch(/written SUMMARY/);
    expect(ISSUE17.source.medium).toMatch(/AUTO-GENERATED CAPTIONS/);
  });
});

describe('limits survive normalization, so the renderer sees what the author wrote', () => {
  it('normalizeIssue carries limits through', () => {
    expect(normalizeIssue(ISSUE17).limits).toHaveLength(3);
  });

  it('accepts a bare string as well as an object, and drops empties', () => {
    const norm = normalizeIssue({ limits: ['a plain sentence', { text: 'an object' }, { text: '' }, null] });
    expect(norm.limits.map((l) => l.text)).toEqual(['a plain sentence', 'an object']);
  });

  it('an issue with no limits normalizes to an empty array, never undefined', () => {
    expect(normalizeIssue({}).limits).toEqual([]);
  });
});

describe('the authored-limits debt may only shrink', () => {
  // Sixteen issues predate the `limits` field. Backfilling all of them tonight
  // would mean writing provenance limits for sources I have not re-checked,
  // which is the exact fabrication DR-0076 forbids — so they are RECORDED DEBT
  // instead, and each is visibly marked in the app by the "has not stated its
  // source limits" line until someone does the work. Same shape as the
  // services.json witness ratchet and the age-band LEGACY list.
  const WITHOUT = WORLD_ISSUES.filter((x) => !Array.isArray(x.limits) || x.limits.length === 0);

  it('is at 16 and never grows — a NEW issue authors its limits', () => {
    expect(WITHOUT.length).toBeLessThanOrEqual(16);
  });

  it('issue 17 is not in the debt', () => {
    expect(WITHOUT.map((x) => x.id)).not.toContain(ISSUE17.id);
  });
});
