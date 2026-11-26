// @vitest-environment node
// =============================================================================
// Every course lesson is a lesson — the short-lesson debt, measured and ratcheted
// =============================================================================
// Darrell, 2026-11-26: we should have no short one-minute lessons; a lesson that
// short undermines the quality control of every lesson. The Eternal Algorithms
// courses were brought to full lessons first (eternal-algorithms-teaching.test.js
// holds them at 1,500 adult words). This file holds every OTHER course.
//
// THE MEASURE. The adult reading is what learn-presentation/integrity.js serves
// as the adult version: the lesson's own levels.standard, else its base
// `lesson`. Under SHORT_FLOOR words (about two minutes read aloud) a lesson is
// short. Some courses were authored with four bands and no adult reading at all;
// those measure 0 and are short too, which is the truth of what an adult meets.
//
// THE RATCHET (the discipline of living-lessons-adult-band-debt.test.js). Every
// short lesson measured on 2026-11-26 is listed below. The list may only shrink:
//   * a NEW short lesson fails the build outright;
//   * a listed lesson brought to full must leave the list in the same change;
//   * the count is asserted, so the debt can never drift out of sight.
// A lesson that leaves the list is authored as a full lesson (an adult reading
// of at least 1,500 words, the bar the Eternal lessons meet); the floor
// here only says where "short" ends, never what "full" is.
//
// ONE EXEMPTION, WITH ITS REASON. little-learners is written for children 6-10.
// Its adult version is the parents' companion, and the child reading follows the
// child window (about ten minutes, DR-1663's measured pace), not adult length.
//
// The decision lives in this header (shrink-only debt, DR-0418; gates proven to
// catch, DR-0076 §3).
import { describe, it, expect } from 'vitest';
import { learnInventory, versionTextOf } from '../lib/learn-presentation/integrity.js';

const SHORT_FLOOR = 400;
const EXEMPT_COURSES = new Set(['little-learners']);

const words = (t) =>
  String(t || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

// The recorded debt (2026-11-26). Shrink-only.
const SHORT_DEBT = [
  'broadcast/bc8-pov-sops',
  'broadcast/bc9-excellence-as-worship',
  'infrastructure/inf1-what-is-sovereign',
  'infrastructure/inf2-the-nas',
  'infrastructure/inf3-storage-raid',
  'infrastructure/inf4-network-gateway',
  'infrastructure/inf5-remote-access',
  'infrastructure/inf6-local-ai',
  'infrastructure/inf7-gpu-vram-farm',
  'infrastructure/inf8-church-stack',
  'infrastructure/inf9-keeping-it-alive',
  'infrastructure/inf10-build-right-raise-builders',
  'sovereign-ai/sov1-generator-in-the-garage',
  'sovereign-ai/sov2-what-a-model-costs-to-run',
  'sovereign-ai/sov3-model-tier-landscape',
  'sovereign-ai/sov4-honest-ceiling',
  'sovereign-ai/sov5-how-skos-runs-it',
  'sovereign-ai/sov6-vendor-vs-local-tradeoffs',
  'sovereign-ai/sov7-five-opportunities',
  'sovereign-ai/sov8-build-sovereign-hand-it-on',
  'ai-legal-blueprint/aib1-the-one-rule',
  'ai-legal-blueprint/aib2-do-not-share-list',
  'ai-legal-blueprint/aib3-how-the-machine-remembers',
  'ai-legal-blueprint/aib4-the-law-plain',
  'ai-legal-blueprint/aib5-real-world-scenarios',
  'who-he-is/whohe4-the-kings-and-the-psalms',
  'who-he-is/whohe6-he-comes-in-the-flesh',
  'who-he-is/whohe7-his-ministry-every-scene',
  'who-he-is/whohe8-the-cross',
  'who-he-is/whohe9-he-is-risen-and-he-goes-up',
  'who-he-is/whohe10-his-witnesses-in-acts',
  'who-he-is/whohe11-the-letters-who-he-is-to-the-churches',
  'who-he-is/whohe12-the-revelation-of-jesus-christ',
  'who-he-is/whohe13-he-comes-again',
  'who-he-is/whohe14-for-ever',
  'sound-board/snd1-the-board-and-the-signal-chain',
  'church-offices/co1-names-and-numbers',
  'church-offices/co2-deacon',
  'church-offices/co3-elder',
  'church-offices/co4-bishop-overseer',
  'church-offices/co5-pastor-shepherd',
  'church-offices/co6-fivefold-and-body',
  'church-offices/co7-our-house-now',
  'word-out/wo1-one-upload-everywhere',
  'word-out/wo2-find-and-share',
  'word-out/wo3-retire-the-old-site',
  'word-out/wo4-when-it-looks-stale',
  'word-out/wo5-ask-for-what-you-want',
  'project-management/pm1-count-the-cost',
  'project-management/pm2-who-should-work',
  'project-management/pm3-the-skill-is-given-and-named',
  'project-management/pm4-what-we-do-not-need-to-do',
  'project-management/pm5-timeline-and-milestones',
  'project-management/pm6-the-counsellors-you-secure',
  'project-management/pm7-the-watchman-and-the-risk',
  'project-management/pm8-the-plumbline',
  'project-management/pm9-the-change-you-put-down',
  'project-management/pm10-the-record-that-outlives-it',
  'project-management/pm11-how-the-organization-learns-prioritizes-and-decides',
  'project-management/pm12-titles-and-fruits-capability-shown-in-outcomes',
  'project-management/pm13-selected-designed-procured-built-and-steered',
  'software-project-management/spm1-requirements-are-a-vow',
  'software-project-management/spm2-the-order-is-the-work',
  'software-project-management/spm3-the-honest-unknown',
  'software-project-management/spm4-incident-problem-change',
  'software-project-management/spm5-no-silent-change',
  'software-project-management/spm6-green-is-not-deployed',
  'software-project-management/spm7-a-gate-that-always-passes',
  'software-project-management/spm8-debt-named-and-dated',
  'software-project-management/spm9-the-retrospective-that-is-not-a-blame-meeting',
  'software-project-management/spm10-handover-and-the-runbook',
  'software-project-management/spm11-unsupported-cannot-be-patched',
  'software-project-management/spm12-the-button-you-turn-on',
  'datasystems/dsi4-how-modules-connect',
  'datasystems/dsi10-running-a-service',
  'datasystems/dsi12-voice-and-help',
  'handed-forward/succ1-mission-not-map',
  'handed-forward/succ2-read-before-you-rule',
  'handed-forward/succ3-new-builder-new-work',
  'handed-forward/succ4-cross-what-we-could-not',
  'handed-forward/succ5-double-portion-hand-it-forward',
  'property-principle/prop1-the-land-is-his-and-it-was-given-by-name',
  'property-principle/prop2-the-landmark-is-a-moral-object',
  'legacy-provisions/legacy1-why-it-vanishes',
  'legacy-provisions/legacy5-heir-under-governors',
  'legacy-provisions/legacy6-hand-it-forward',
  'kingdom-economics/econ1-soul-first',
  'kingdom-economics/econ2-ownership-vs-consumption',
  'kingdom-economics/econ3-circulation',
  'kingdom-economics/econ4-group-economics',
  'prophetic-voices/pv-price',
  'prophetic-voices/pv-diop',
  'prophetic-voices/pv-obenga',
  'prophetic-voices/pv-williams',
  'prophetic-voices/pv-inventions',
];

function measure() {
  const short = [];
  for (const c of learnInventory()) {
    if (EXEMPT_COURSES.has(c.key)) continue;
    for (const l of c.lessons) if (words(versionTextOf(l, 'adult')) < SHORT_FLOOR) short.push(`${c.key}/${l.id}`);
  }
  return short;
}

describe('every course lesson is a lesson (DR-0418 discipline)', () => {
  const short = measure();

  it('no short lesson exists outside the recorded debt', () => {
    const recorded = new Set(SHORT_DEBT);
    expect(short.filter((id) => !recorded.has(id))).toEqual([]);
  });

  it('a lesson brought to full has left the list', () => {
    const now = new Set(short);
    expect(SHORT_DEBT.filter((id) => !now.has(id))).toEqual([]);
  });

  it('records the real, current number so the claim is never taken on trust', () => {
    expect(short.length).toBe(SHORT_DEBT.length);
    expect(new Set(SHORT_DEBT).size).toBe(SHORT_DEBT.length);
  });

  it('PROVEN-TO-CATCH: a lesson cut to a stub measures short', () => {
    const c = learnInventory().find((x) => x.key === 'eternal-torah');
    const l = c.lessons[0];
    const stub = { ...l, lesson: String(l.lesson).split(/\s+/).slice(0, 120).join(' '), levels: { ...(l.levels || {}), standard: '' } };
    expect(words(versionTextOf(l, 'adult'))).toBeGreaterThanOrEqual(SHORT_FLOOR);
    expect(words(versionTextOf(stub, 'adult'))).toBeLessThan(SHORT_FLOOR);
  });
});
