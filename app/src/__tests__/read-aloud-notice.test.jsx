// @vitest-environment jsdom
// =============================================================================
// Read Aloud never fails silently — the last hop, which was missing
// =============================================================================
// Darrell 2026-09-20, on a Fire TV: "I can't hear the tts.... why not?"
//
// Everything was already built for this and one link was absent. tts.js runs a
// START WATCHDOG whose own comment reads "Truly silent after a retry — report
// it. Never a dead, silent button." It sets `failed`. use-read-aloud turns that
// into a notice. And TTSControl — the component behind the READ ALOUD button he
// pressed — never destructured `notice`, so every message was computed and
// thrown away. The guarantee held for its whole length and broke at the end.
//
// THE FIRE TV CASE, precisely: Silk exposes both speechSynthesis and
// SpeechSynthesisUtterance, so isTTSSupported() answers TRUE and the honest
// "this device can't read aloud" path never runs — but the device carries no
// voice engine, getVoices() stays empty, and the utterance makes no sound.
// Support was tested as an API surface rather than as a capability.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isTTSSupported } from '../lib/tts.js';

const repoRoot = resolve(__dirname, '../../..');
const read = (rel) => readFileSync(join(repoRoot, rel), 'utf8');

// ASSERT ON CODE, NOT ON PROSE. The first version of the checks below matched
// the raw file, and two of them failed the moment the fix's own comment QUOTED
// the wording being retired — the explanation of a change tripping the gate
// that guards it. A comment is documentation; only the executable text can
// make a promise to a user, so the strings are stripped of comments first.
const codeOf = (rel) => read(rel)
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .split('\n').map((l) => l.replace(/(^|\s)\/\/.*$/, '$1')).join('\n');

describe('the notice reaches the screen', () => {
  const control = read('app/src/components/TTSControl.jsx');

  it('TTSControl takes `notice` from the hook', () => {
    // Break: delete `notice,` from the destructure and this fails — which is
    // exactly the state the component shipped in until today.
    expect(control, 'TTSControl does not destructure notice').toMatch(/\n\s*notice,\n/);
  });

  it('and RENDERS it, rather than only holding it', () => {
    expect(control).toMatch(/data-testid="read-aloud-notice"/);
    expect(control).toMatch(/\{notice && \(/);
    // Assert the PAIRING without pinning how far apart they sit — the first
    // version of this test measured 200 characters and broke the moment a
    // comment was added between them, which is a proximity check masquerading
    // as an accessibility one. What matters is that THIS element announces.
    // Located by the element's own id, not by the first `{notice && (` in
    // the file: since DR-0576 a waiting notice also draws a small mark on the
    // pill and on the speaker button, each behind its own `{notice && (`,
    // and the first of those is a button, not the notice. The element that
    // must announce is the one carrying the testid.
    const at = control.indexOf('data-testid="read-aloud-notice"');
    const open = control.slice(control.lastIndexOf('<div', at), control.indexOf('>', at));
    expect(open, 'the notice element does not announce itself').toMatch(/role="status"/);
    expect(open).toMatch(/data-testid="read-aloud-notice"/);
  });

  it('the hook really exports it, so the wiring is end to end', () => {
    expect(read('app/src/lib/use-read-aloud.js')).toMatch(/currentItem, notice,/);
  });
});

describe('a device with no voices is told the truth, not given useless advice', () => {
  it('the zero-voice branch names the real cause, and the right one', () => {
    const hook = codeOf('app/src/lib/use-read-aloud.js');
    expect(hook).toMatch(/no voice of its own/);
    // CORRECTED within the hour. The first version said "open the lesson on a
    // phone or tablet" — defeatist and, worse, WRONG: the app already carries
    // a device-independent answer in the System-voice cloud read, which
    // synthesizes server-side and plays through an <audio> element on any
    // device with a speaker. A device with no local voice is not the end of
    // the story; an unconfigured voice service is why it stayed silent.
    expect(hook, 'the old defeatist message is back').not.toMatch(/open the lesson on a phone or tablet/);
    expect(hook).toMatch(/has not answered yet/);
    expect(hook).toMatch(/reads aloud HERE, on this screen/);
    // AND IT NO LONGER CLAIMS THE SERVICE IS "not switched on". That wording
    // was a CONFIGURATION verdict, and configuration stopped being a variable
    // when /voice became a same-origin route. Saying a service is switched off
    // when the true state is "it did not answer" sends the reader's steward to
    // flip a switch that does not exist.
    expect(hook, 'a configuration verdict is back in the notice').not.toMatch(/is not switched on yet/);
  });

  it('it branches on the PROBE, not on configuration — three real states', () => {
    // This used to require the notice to branch on isVoiceServiceReady(), and
    // that requirement became a trap: /voice is same-origin, so the config
    // check answers true on every device, one arm of the ternary could never
    // render, and the arm that COULD told a reader the studio "did not answer"
    // on a night it had simply never been started. The remedies are genuinely
    // different — arm the studio, chase why it stopped, or wait for the probe
    // — so the studio is asked and all three states are spelled out.
    const hook = codeOf('app/src/lib/use-read-aloud.js');
    expect(hook, 'the notice still reads a config flag').toMatch(/studioHealth === 'down'/);
    expect(hook).toMatch(/studioHealth === 'up'/);
    expect(hook).toMatch(/did not answer/);
    // PROVEN-TO-CATCH the exact bug being fixed: a stale closure. studioHealth
    // is now READ inside the speak callback, and sovereignVoiceReady collapses
    // 'up' and 'unknown' into one value, so without this dependency the notice
    // would show whichever state was true when the callback was last built.
    // Pinned on studioHealth BEING in the dependency array, not on which
    // name sits beside it. The first version matched the literal pair
    // `sovereignVoiceReady, studioHealth,` and went red the moment
    // `attemptStudio` was added between them (2026-09-22, when the health
    // probe was demoted from a gate on the ATTEMPT to a display signal) — a
    // test holding formatting rather than the behaviour it exists to hold.
    const depsLine = (hook.match(/\}, \[voiceId, personalVoices,[^\]]*\]\);/) || [''])[0];
    expect(depsLine, 'the speak callback dependency array was not found').not.toBe('');
    expect(depsLine, 'studioHealth is read in the callback but is not a dependency').toMatch(/\bstudioHealth\b/);
  });

  it('the device-independent path really does run BEFORE the device one', () => {
    // The whole correction rests on this ordering: if the cloud read came
    // second it could never rescue a device with no voices, because the device
    // path returns first. Pinned so a refactor cannot quietly invert it.
    const hook = read('app/src/lib/use-read-aloud.js');
    const cloud = hook.indexOf('allowBuiltIn: true');
    const device = hook.indexOf("if (!tts.supported) { setNotice(");
    expect(cloud, 'the System-voice cloud read is gone').toBeGreaterThan(0);
    expect(cloud, 'the cloud read no longer precedes the device path').toBeLessThan(device);
  });

  it('it returns instead of speaking into the void', () => {
    const hook = codeOf('app/src/lib/use-read-aloud.js');
    const at = hook.indexOf('no voice of its own');
    expect(at, 'the zero-voice notice is gone').toBeGreaterThan(0);
    const branch = hook.slice(at, at + 700);
    expect(branch, 'the empty-voice path must stop, not fall through to speak()').toMatch(/\);\s*\n\s*return;/);
  });

  it('isTTSSupported still answers the question it actually asks', () => {
    // It is an API-surface test and is CORRECT as one — the zero-voice case is
    // a different question and is answered where the voices are known. Pinned
    // so nobody "fixes" this into a capability test and breaks the cold-start
    // path (DR-0138), where the list is briefly empty on a device that speaks.
    expect(isTTSSupported({ speechSynthesis: {}, SpeechSynthesisUtterance: function U() {} })).toBe(true);
    expect(isTTSSupported({})).toBe(false);
    expect(isTTSSupported(undefined)).toBe(false);
  });
});

describe('the engine still promises what it promised', () => {
  it('the start watchdog reports a silent tap', () => {
    const tts = read('app/src/lib/tts.js');
    expect(tts).toMatch(/Never a dead, silent button/);
    expect(tts).toMatch(/this\.failed = true/);
  });

  it('and the hook converts that into something a person can read', () => {
    expect(read('app/src/lib/use-read-aloud.js')).toMatch(/if \(tts\.failed\) setNotice\(/);
  });
});
