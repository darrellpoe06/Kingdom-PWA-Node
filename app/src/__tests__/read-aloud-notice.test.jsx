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
    const el = control.slice(control.indexOf('{notice && ('));
    const open = el.slice(0, el.indexOf('>'));
    expect(open, 'the notice element does not announce itself').toMatch(/role="status"/);
    expect(open).toMatch(/data-testid="read-aloud-notice"/);
  });

  it('the hook really exports it, so the wiring is end to end', () => {
    expect(read('app/src/lib/use-read-aloud.js')).toMatch(/currentItem, notice,/);
  });
});

describe('a device with no voices is told the truth, not given useless advice', () => {
  it('the zero-voice branch names the real cause', () => {
    const hook = read('app/src/lib/use-read-aloud.js');
    expect(hook).toMatch(/no voice installed/);
    // "Press play once more" cannot install a speech engine. The advice given
    // must be advice that can actually work.
    expect(hook).toMatch(/open the lesson on a phone or tablet/);
  });

  it('it returns instead of speaking into the void', () => {
    const hook = read('app/src/lib/use-read-aloud.js');
    const branch = hook.slice(hook.indexOf('no voice installed') - 900, hook.indexOf('no voice installed') + 400);
    expect(branch, 'the empty-voice path must stop, not fall through to speak()').toMatch(/setNotice\([\s\S]*?\);\s*\n\s*return;/);
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
