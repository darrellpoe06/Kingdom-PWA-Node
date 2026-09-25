// @vitest-environment node
// =============================================================================
// The in-app lesson door (DR-0608) and pm11, the lesson it was asked beside
// (DR-0609)
// =============================================================================
// Darrell, 2026-09-24: "How can I currently use the PoeTech App to get a
// lesson or courses created like we currently do just make you source it from
// the intake inside the app?" — and, in the same hour: "I want a rigorous
// process before transitioning to a new way of processing."
//
// So the door is built and PINNED, and the reader of the door ships STAGED
// (a disabled Routine the Governor arms) with the transition written in
// DR-0608. What this file holds:
//   1. the router offers 📖 Lesson on both built-in surfaces, reads the same
//      first-word marker the inbox door reads, and dispatches it as its own
//      action (never a silent fallback);
//   2. the Speak box relays it to the sovereign inbox tagged 'lesson' and
//      says so on the surface, failure included (source pins);
//   3. pm11 is in the Project Management course with the Word's cases first,
//      every quoted span verbatim (the course gate), and the two additions
//      Darrell spoke: inspection in two registers, and His will on earth.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DESTINATIONS, RULES_FOR_TEST, suggestDestination, destinationsFor, planDispatch } from '../lib/one-voice-routing.js';
import { SURFACES } from '../lib/one-voice-surfaces.js';
import { PROJECT_MANAGEMENT_MODULES, PROJECT_MANAGEMENT_META } from '../lib/project-management-course.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, '..', 'components', 'OneVoiceInput.jsx'), 'utf8');

describe('the Lesson door on the router (DR-0608)', () => {
  it('is a destination on BOTH built-in surfaces, visible as a chip', () => {
    expect(DESTINATIONS.some((d) => d.key === 'lesson')).toBe(true);
    expect(destinationsFor('church').map((d) => d.key)).toContain('lesson');
    expect(destinationsFor('notes').map((d) => d.key)).toContain('lesson');
  });

  it('reads the same marker the inbox door reads: the word Lesson FIRST', () => {
    expect(suggestDestination('Lesson. Didn\'t Jesus tell Pilate He was from eternity?', 'prayer')).toBe('lesson');
    expect(suggestDestination('lesson: the keys of hell and death', 'private')).toBe('lesson');
    expect(suggestDestination('  Lesson — two hours became six', 'prayer')).toBe('lesson');
    // Not the marker: the word elsewhere in a sentence stays with the surface default.
    expect(suggestDestination('I learned a lesson today about patience', 'private')).toBe('private');
    expect(suggestDestination('please pray for the lesson tonight', 'prayer')).toBe('prayer');
  });

  it('the rule is the first rule, so no other keyword steals a marked lesson', () => {
    expect(RULES_FOR_TEST[0].key).toBe('lesson');
    // A marked lesson that mentions the app still goes to the lesson door.
    expect(suggestDestination('Lesson. how the app should build governance systems', 'private')).toBe('lesson');
  });

  it('dispatches as its own action with its own confirmation, never a fallback', () => {
    const plan = planDispatch('lesson', { lesson: true, note: true });
    expect(plan).toEqual({ action: 'lesson', confirmationKey: 'lesson', savesPrivateNote: false });
    // PROVEN-TO-CATCH: with no relay available it falls back honestly to a note.
    expect(planDispatch('lesson', { note: true }).action).toBe('fallback-note');
  });

  it('both surfaces carry the confirmation and the honest failure line', () => {
    for (const k of ['church', 'notes']) {
      // DR-0630: the intake line is the Governor's; a member is told the truth
      // (kept, reviewed before a lesson is published) — lessons-for-situation.test.jsx.
      expect(SURFACES[k].confirmations.lessonGovernor).toMatch(/Learn intake/);
      expect(SURFACES[k].confirmations.lesson).toMatch(/reviewed before it is published/);
      expect(SURFACES[k].confirmations.lessonFailed).toMatch(/\{reason\}/);
    }
  });

  it('the Speak box relays it to the sovereign inbox tagged lesson and says failure on the surface (source pins)', () => {
    expect(SRC).toMatch(/import \{ relayThought \} from '\.\.\/lib\/agent-inbox-sync\.js'/);
    expect(SRC).toMatch(/case 'lesson':/);
    expect(SRC).toMatch(/relayThought\(\{ body: t, tags: \['lesson', \.\.\.lessonNameTags\(nameOk, lessonName\)\], source: cfg\.sourceTag \}\)/); // DR-0639: the name choice rides the same insert
    expect(SRC).toMatch(/lessonFailed/);
    expect(SRC).toMatch(/lesson: true,/);
  });
});

describe('pm11 — how the organization learns, prioritizes and decides (DR-0609)', () => {
  const m = PROJECT_MANAGEMENT_MODULES.find((x) => x.id.startsWith('pm11-'));
  const all = () => [m.bigIdea, m.inApp, m.anchor.theme, ...m.benefits, m.levels.teen, m.levels.senior].join(' ');

  it('is the eleventh lesson and the week count follows', () => {
    expect(m, 'pm11 must be in the course').toBeTruthy();
    expect(PROJECT_MANAGEMENT_MODULES.length).toBe(11);
    expect(PROJECT_MANAGEMENT_META.weeks).toBe(11);
  });

  it('the Word’s cases come first: Jethro, Joseph, Issachar, the apostles — before the industry’s name', () => {
    const big = m.bigIdea;
    const jethro = big.indexOf('Exodus 18:18');
    const industry = big.indexOf('decision intelligence');
    expect(jethro).toBeGreaterThan(-1);
    expect(industry).toBeGreaterThan(jethro);
    expect(all()).toContain('every great matter they shall bring unto thee, but every small matter they shall judge');
    expect(all()).toContain('had understanding of the times, to know what Israel ought to do');
    expect(all()).toContain('It is not reason that we should leave the word of God, and serve tables');
  });

  it('carries his purpose sentence and his information sentence, rendered', () => {
    expect(m.bigIdea).toContain('repeatable governance systems that help organizations recognize patterns, surface risks, and make better decisions without depending on one person');
    expect(m.bigIdea).toMatch(/not drowning in tasks; they are drowning in information/);
  });

  it('carries the addition he spoke: prudence, inspection in two registers, and His will on earth', () => {
    expect(all()).toContain('Consider your ways');
    expect(all()).toContain('Ye have sown much, and bring in little');
    expect(all()).toContain('by their fruits ye shall know them');
    expect(all()).toContain('Thy will be done in earth, as it is in heaven');
    expect(all()).toContain('If ye love me, keep my commandments');
    expect(all()).toContain('the prudent man looketh well to his going');
    expect(m.levels.senior).toMatch(/Quantitative:/);
    expect(m.levels.senior).toMatch(/Qualitative:/);
  });

  it('the hands-on step ends in the app, on the governance surface that carries the purpose', () => {
    expect(m.inApp).toMatch(/OpsBoard/);
    expect(m.inApp).toMatch(/who else could run this page if you were gone/);
  });
});
