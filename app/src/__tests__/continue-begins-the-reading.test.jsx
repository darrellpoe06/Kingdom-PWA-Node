// @vitest-environment jsdom
// =============================================================================
// CONTINUE BEGINS THE READING
// =============================================================================
// Darrell, 2026-10-10: "Clicking continue on lessons the big green tab doesn't
// just begin with the required reading... users have to click again!!!!!!!!!!!
// Why?"
//
// THE OBVIOUS FIX WAS THE WRONG ONE, and it was measured before anything was
// written. Continue ALREADY opens the reading in one tap: TutorPanel is the
// component that renders the lesson's reading and registers it as the page's
// primary reading, so "the guide" is a chrome label, not a door standing in
// front of it. Setting resumeOpenGuide=false — the change that suggests itself
// — would have UNMOUNTED the reading, leaving the lesson to register a DOOR
// (read-target.js:63, whose whole purpose is "its full reading is not mounted
// yet") and forcing a "Read this lesson" tap. It would have CREATED the extra
// tap he is complaining about, and killed DR-0631's saved-place landing on the
// way past (ChurchLearn.jsx reads `resumeOpenGuide && placeInProgress(saved)`).
//
// Measured difference between the two doors, on the real catalog:
//
//   tap               lesson space   reading mounted   saved place   pendingRead()
//   continue-latest   yes            yes               yes           null
//   Play              yes            yes               yes           {owner}
//
// One call. What does not "begin" is the reading ALOUD — and that is Darrell's
// own law, in capitals, three times: "Play Button reads the lesson!!!!!"
// (read-target.js:105). Continue means resume what I was doing.
//
// WHERE IT IS ARMED MATTERS, and this is the half a later reader will be
// tempted to "simplify". It is armed at the CALL SITES, never inside
// resumeNow, because resumeNow is also the single door for lib/learn-open.js,
// whose contract says it "never touches audio — it only opens, scrolls and
// marks", and whose live caller is the reader's own "Show the text" — pressed
// WHILE the reader is reading. Arming a read in there would restart the very
// reading that asked to be shown.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LEARN = readFileSync(join(HERE, '..', 'components', 'ChurchLearn.jsx'), 'utf8');
const TARGET = readFileSync(join(HERE, '..', 'lib', 'read-target.js'), 'utf8');
const OPEN = readFileSync(join(HERE, '..', 'lib', 'learn-open.js'), 'utf8');

describe('every Continue door asks the reading to begin', () => {
  it('PROVEN-TO-CATCH: no Continue is still wired straight to resumeNow', () => {
    // The whole defect in one string. Restoring any of the three turns this
    // red by name.
    expect(LEARN).not.toContain('onContinue={resumeNow}');
  });

  it('all three Continue doors go through the reading-armed handler', () => {
    // The offer under the picker, the one on the course card, and the sticky
    // chip — a reader who used the chip would otherwise still tap twice.
    const n = (LEARN.match(/onContinue=\{continueAndRead\}/g) || []).length;
    expect(n, 'expected the offer, the card and the chip').toBe(3);
  });

  it('the handler resumes AND requests the read, in that order', () => {
    const at = LEARN.indexOf('const continueAndRead =');
    expect(at).toBeGreaterThan(-1);
    const body = LEARN.slice(at, at + 260);
    expect(body).toContain('resumeNow(place)');
    expect(body).toContain('requestRead(place.lessonId)');
    expect(body.indexOf('resumeNow(place)')).toBeLessThan(body.indexOf('requestRead('));
  });

  it('a place with no lesson asks for nothing rather than throwing', () => {
    const at = LEARN.indexOf('const continueAndRead =');
    expect(LEARN.slice(at, at + 260)).toContain('place && place.lessonId');
  });
});

describe('the landing DR-0631 won is not traded away for it', () => {
  it('Continue still opens the guide, which IS the reading', () => {
    // resumeOpenGuide=true is what mounts the reading AND what gates the
    // saved-place landing. Both die together if it is flipped.
    expect(LEARN).toContain('setResumeOpenGuide(true)');
  });

  it('the landing still keys off that same flag', () => {
    expect(LEARN).toContain('resumeOpenGuide && placeInProgress(saved)');
  });
});

describe('the read is armed at the call site, never inside resumeNow', () => {
  it('resumeNow itself still touches no audio', () => {
    const at = LEARN.indexOf('const resumeNow = (place) => {');
    expect(at).toBeGreaterThan(-1);
    const body = LEARN.slice(at, LEARN.indexOf('};', at));
    expect(body, 'learn-open.js and "Show the text" come through here').not.toContain('requestRead');
  });

  it('because learn-open.js promises exactly that', () => {
    // If this contract ever changes, the reasoning above needs revisiting.
    expect(OPEN).toMatch(/never touches audio/i);
  });

  it('and the law being honoured is written down where it was declared', () => {
    expect(TARGET).toMatch(/Play Button reads the lesson/);
  });
});
