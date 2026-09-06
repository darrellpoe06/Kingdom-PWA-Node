// @vitest-environment node
//
// ip-register — the schedule of intellectual property.
//
// PROVEN-TO-CATCH (DR-0076 §3). This register exists to answer "is this an
// asset yet?", and the only failure mode that matters is a comfortable YES. So
// every honesty rule is tested by feeding it the case that would BREAK it and
// requiring the refusal. A register that only asserted the happy path would be
// worse than no register, because it would be believed:
//
//   • A publicly-disclosed method claiming TRADE-SECRET protection is refused.
//     This is the 2026-09-06 finding as a gate: the repo is public, so those
//     methods are outside trade-secret reach and no row may say otherwise.
//   • An AI-GENERATED work claiming COPYRIGHT protection is refused. Overstating
//     authorship can invalidate the very registration it was meant to secure.
//   • UNDECIDED authorship and UNDECIDED disclosure are refused. Neither gets a
//     default, because a default produces rows nobody ever decided.
//   • "planned" is NOT protection — a plan must never score as a right.
//   • The five tests are COMPUTED. A well-documented, unassigned, unlicensed
//     work scores low no matter how much work went into it.
import { describe, it, expect } from 'vitest';
import {
  ASSET_TESTS,
  AUTHORSHIP,
  IP_LANES,
  LANE_IDS,
  TEST_IDS,
  assetShape,
  assetsInLane,
  authorshipById,
  forfeitedByDisclosure,
  isLaneId,
  isProtected,
  laneById,
  laneCounts,
  newAssetId,
  normalizeAssets,
  portfolioScore,
  scoreAsset,
  unregistrableByAuthorship,
  validateAsset,
} from '../lib/ip-register.js';

// A fully-converted asset: owned, assigned, fixed, registered, licensed.
const realAsset = () => assetShape({
  name: 'PoeTech (house mark)',
  lane: 'trademark',
  owner: 'PoeTech LLC',
  assigned: true,
  fixedOn: '2026-09-06',
  authorship: 'human',
  publiclyDisclosed: true,
  protection: 'registered',
  licensed: true,
});

describe('the four lanes', () => {
  it('records which protections survive AI generation and which survive publication', () => {
    expect(laneById('trademark').survivesGeneration).toBe(true);
    expect(laneById('trademark').survivesDisclosure).toBe(true);
    // The two that make trade secret the forfeited lane here.
    expect(laneById('trade-secret').survivesGeneration).toBe(true);
    expect(laneById('trade-secret').survivesDisclosure).toBe(false);
    // Copyright turns on authorship; patent turns on both.
    expect(laneById('copyright').survivesGeneration).toBe(false);
    expect(laneById('patent').survivesDisclosure).toBe(false);
  });

  it('exposes exactly four lanes and rejects an unknown one', () => {
    expect(IP_LANES).toHaveLength(4);
    expect(LANE_IDS).toEqual(['trademark', 'copyright', 'trade-secret', 'patent']);
    expect(isLaneId('common-law')).toBe(false);
    expect(laneById('nope')).toBeNull();
  });
});

describe('validateAsset refuses the comfortable lie', () => {
  it('REFUSES trade-secret protection over publicly-disclosed material', () => {
    const leaked = assetShape({
      name: 'Deterministic gate suite',
      lane: 'trade-secret',
      authorship: 'mixed',
      publiclyDisclosed: true,
      protection: 'registered',
    });
    const res = validateAsset(leaked);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/publicly disclosed/i);
    expect(res.message).toMatch(/not recoverable/i);
  });

  it('ALLOWS the same disclosed method once it stops claiming protection', () => {
    const honest = assetShape({
      name: 'Deterministic gate suite',
      lane: 'trade-secret',
      authorship: 'mixed',
      publiclyDisclosed: true,
      protection: 'none',
    });
    expect(validateAsset(honest).ok).toBe(true);
  });

  it('ALLOWS trademark over publicly-disclosed material, because disclosure does not touch it', () => {
    const mark = assetShape({
      name: 'PoeTech',
      lane: 'trademark',
      authorship: 'human',
      publiclyDisclosed: true,
      protection: 'filed',
    });
    expect(validateAsset(mark).ok).toBe(true);
  });

  it('REFUSES copyright protection over AI-generated material', () => {
    const overclaimed = assetShape({
      name: 'Generated module scaffolding',
      lane: 'copyright',
      authorship: 'generated',
      publiclyDisclosed: true,
      protection: 'registered',
    });
    const res = validateAsset(overclaimed);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/not protectable/i);
  });

  it('ALLOWS copyright over human-directed, AI-expressed work — mixed is registrable with disclosure', () => {
    const mixed = assetShape({
      name: 'Foundation document set',
      lane: 'copyright',
      authorship: 'mixed',
      publiclyDisclosed: true,
      protection: 'filed',
    });
    expect(validateAsset(mixed).ok).toBe(true);
    expect(authorshipById('mixed').registrable).toBe(true);
    expect(authorshipById('generated').registrable).toBe(false);
  });

  it('REFUSES an asset whose authorship nobody decided', () => {
    const undecided = assetShape({ name: 'Something', lane: 'copyright', publiclyDisclosed: false });
    expect(undecided.authorship).toBeNull();
    const res = validateAsset(undecided);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/authorship is undecided/i);
  });

  it('REFUSES an asset whose disclosure status nobody decided', () => {
    const undecided = assetShape({ name: 'Something', lane: 'trade-secret', authorship: 'human' });
    expect(undecided.publiclyDisclosed).toBeNull();
    const res = validateAsset(undecided);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/public-disclosure status is undecided/i);
  });

  it('REFUSES an assignment with no entity to assign into', () => {
    const orphan = assetShape({
      name: 'Doctrinal corpus',
      lane: 'copyright',
      authorship: 'human',
      publiclyDisclosed: true,
      assigned: true,
      owner: null,
    });
    const res = validateAsset(orphan).message;
    expect(validateAsset(orphan).ok).toBe(false);
    expect(res).toMatch(/needs an owner/i);
  });

  it('REFUSES an unnamed asset — "the repo" is not a boundary', () => {
    expect(validateAsset(assetShape({ lane: 'copyright' })).ok).toBe(false);
    expect(validateAsset(assetShape({ name: 'x' })).ok).toBe(false);
    expect(validateAsset(null).ok).toBe(false);
  });
});

describe('a plan is not a right', () => {
  it('treats only filed and registered as protection', () => {
    expect(isProtected('none')).toBe(false);
    expect(isProtected('planned')).toBe(false);
    expect(isProtected('filed')).toBe(true);
    expect(isProtected('registered')).toBe(true);
  });

  it('does not let a PLANNED filing pass the excludable test', () => {
    const planned = assetShape({
      name: 'SKOS',
      lane: 'trademark',
      owner: 'PoeTech LLC',
      assigned: true,
      fixedOn: '2026-09-06',
      authorship: 'human',
      publiclyDisclosed: true,
      protection: 'planned',
    });
    expect(scoreAsset(planned).results.excludable).toBe(false);
    expect(scoreAsset(planned).bottleneck).toBe('excludable');
  });

  it('falls back to none rather than accepting an unknown status', () => {
    expect(assetShape({ name: 'x', protection: 'ironclad' }).protection).toBe('none');
  });
});

describe('the five tests are computed, never painted', () => {
  it('scores a fully-converted asset 5 of 5', () => {
    const s = scoreAsset(realAsset());
    expect(s.passedCount).toBe(5);
    expect(s.isAsset).toBe(true);
    expect(s.bottleneck).toBeNull();
    expect(ASSET_TESTS).toHaveLength(5);
    expect(TEST_IDS).toEqual(['owned', 'defined', 'excludable', 'transferable', 'monetised']);
  });

  it('scores PoeTech as it actually stands today — well documented, and not an asset', () => {
    // The real 2026-09-06 position: fixed and provenanced, no entity, no
    // assignment, no filing, no licence. Documentation is not ownership.
    const today = assetShape({
      name: 'Doctrinal corpus (CLAUDE.md rules, worldview spine, decision ledger)',
      lane: 'copyright',
      owner: null,
      assigned: false,
      fixedOn: '2026-09-06',
      authorship: 'human',
      publiclyDisclosed: true,
      protection: 'none',
      provenance: ['DR-0076', 'DR-0111', 'docs/decisions/INDEX.md'],
      licensed: false,
    });
    const s = scoreAsset(today);
    expect(validateAsset(today).ok).toBe(true);   // an honest row
    expect(s.results.defined).toBe(true);          // the one test it passes
    expect(s.results.owned).toBe(false);
    expect(s.results.excludable).toBe(false);
    expect(s.results.transferable).toBe(false);
    expect(s.results.monetised).toBe(false);
    expect(s.passedCount).toBe(1);
    expect(s.isAsset).toBe(false);
    expect(s.bottleneck).toBe('owned');            // the assignment is the next move
  });

  it('does not let a disclosed trade secret score as excludable even if a row claims a filing', () => {
    // Belt and braces: validateAsset refuses this row, and scoring refuses to
    // reward it even if one reaches the scorer from stored data.
    const leaked = { ...assetShape({
      name: 'Orchestration ladder',
      lane: 'trade-secret',
      owner: 'PoeTech LLC',
      assigned: true,
      fixedOn: '2026-09-06',
      authorship: 'mixed',
      publiclyDisclosed: true,
      licensed: true,
    }), protection: 'registered' };
    expect(scoreAsset(leaked).results.excludable).toBe(false);
    expect(scoreAsset(leaked).isAsset).toBe(false);
  });

  it('names ownership as the bottleneck before transferability, since you cannot transfer what you do not own', () => {
    const s = scoreAsset(assetShape({
      name: 'x', lane: 'trademark', fixedOn: '2026-09-06',
      authorship: 'human', publiclyDisclosed: true, protection: 'registered',
    }));
    expect(s.bottleneck).toBe('owned');
  });
});

describe('the leak reports name what publication already cost', () => {
  const portfolio = [
    assetShape({ name: 'Gate suite', lane: 'trade-secret', authorship: 'mixed', publiclyDisclosed: true }),
    assetShape({ name: 'Module template', lane: 'trade-secret', authorship: 'mixed', publiclyDisclosed: true }),
    assetShape({ name: 'Tenant configs', lane: 'trade-secret', authorship: 'human', publiclyDisclosed: false }),
    assetShape({ name: 'PoeTech', lane: 'trademark', authorship: 'human', publiclyDisclosed: true }),
    assetShape({ name: 'Scaffolding', lane: 'copyright', authorship: 'generated', publiclyDisclosed: true }),
  ];

  it('lists exactly the disclosed items in disclosure-sensitive lanes', () => {
    const lost = forfeitedByDisclosure(portfolio).map((a) => a.name);
    expect(lost).toEqual(['Gate suite', 'Module template']);
    // The unpublished secret is still protectable, and the mark is untouched.
    expect(lost).not.toContain('Tenant configs');
    expect(lost).not.toContain('PoeTech');
  });

  it('lists what authorship puts out of copyright reach', () => {
    expect(unregistrableByAuthorship(portfolio).map((a) => a.name)).toEqual(['Scaffolding']);
  });

  it('counts by lane without vanishing an empty lane', () => {
    const counts = laneCounts(portfolio);
    expect(counts['trade-secret']).toBe(3);
    expect(counts.trademark).toBe(1);
    expect(counts.patent).toBe(0);          // present and zero, not missing
    expect(Object.keys(counts)).toHaveLength(4);
    expect(assetsInLane(portfolio, 'trademark')).toHaveLength(1);
  });

  it('rolls the portfolio up without claiming an asset it does not have', () => {
    const roll = portfolioScore(portfolio);
    expect(roll.count).toBe(5);
    expect(roll.fullAssets).toBe(0);
    expect(roll.byTest.owned).toBe(0);
    expect(roll.byTest.monetised).toBe(0);
  });

  it('survives junk input rather than throwing on a half-written register', () => {
    expect(forfeitedByDisclosure(null)).toEqual([]);
    expect(laneCounts(undefined).patent).toBe(0);
    expect(portfolioScore(null).count).toBe(0);
    expect(normalizeAssets([{ name: '' }, null, { name: 'Keep', lane: 'trademark' }])).toHaveLength(1);
  });
});

describe('identity and shape', () => {
  it('mints unique ids', () => {
    expect(new Set(Array.from({ length: 200 }, () => newAssetId())).size).toBe(200);
  });

  it('never defaults the two undecidable fields, and trims the rest', () => {
    const blank = assetShape();
    expect(blank.authorship).toBeNull();
    expect(blank.publiclyDisclosed).toBeNull();
    expect(blank.owner).toBeNull();
    expect(blank.assigned).toBe(false);
    expect(blank.licensed).toBe(false);
    expect(blank.protection).toBe('none');
    expect(assetShape({ name: '  PoeTech  ' }).name).toBe('PoeTech');
    expect(assetShape({ provenance: ['DR-0076', null, 'x'] }).provenance).toEqual(['DR-0076', 'x']);
  });

  it('offers three authorship values, two of which are registrable', () => {
    expect(AUTHORSHIP).toHaveLength(3);
    expect(AUTHORSHIP.filter((a) => a.registrable).map((a) => a.id)).toEqual(['human', 'mixed']);
  });
});
