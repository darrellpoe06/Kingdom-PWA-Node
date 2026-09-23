// "All 7 checks pass" and "The voice studio was unreachable", one minute apart.
//
// Darrell, 2026-09-22, on the same screen: the Does-it-work panel green across
// every row at 6:35, and the read answering at 6:36 with *"The voice studio was
// unreachable — using the stand-in voice for now."* Then: **"Didn't work!!!!!!"**
// and **"Why does the health matter?!!! Can't we build it to work
// independently?"**
//
// Both statements were the app's, both were wrong, and the cause is one design
// mistake made twice.
//
// 1. THE PANEL PROBED THE WRONG ROUTE. It called `GET /health`, which takes no
//    authentication, and reported the studio good. The read calls `POST /speak`,
//    which the NAS-side forwarder gates on the family bridge bearer — a token in
//    localStorage that is PER-DEVICE BY DESIGN and never syncs. So a device that
//    was never provisioned answers the probe perfectly and is refused at the
//    door. The chain built to name the broken link had NO ROW for the link that
//    was broken.
//
// 2. "UNREACHABLE" WAS THE WRONG WORD. `synthesizeSpeech` returns a tagged
//    error — `voice-service-401`, `voice-service-timeout`, `no-voice-sample` —
//    and both call sites threw the tag away for one generic sentence. A 401 is a
//    credential refused by a studio that is running perfectly; calling that
//    unreachable sends a person to check their network for no reason. Same
//    wrong-reason defect as the female-voices copy corrected the same evening.
//
// 3. AND THE PROBE HAD A VOTE IT SHOULD NEVER HAVE HAD. The read path computed
//    `isVoiceServiceReady() && studioHealth !== 'down'` and refused to even
//    ATTEMPT when the probe said down. That is the worse direction: a health
//    check is a second system that can be wrong about the first, and when it is
//    wrong it silently withholds a working feature. DR-0440 says ready means
//    ANSWERING rather than configured; this takes the same rule one step
//    further — the only thing that proves /speak answers is calling /speak.
//
// The gate existed for a real reason: a dark studio made every read sit through
// the full timeout. That cost is now paid by SIZING the patience instead of
// skipping the call, which is why the timeout cases below matter as much as the
// attempt ones.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  voiceErrorReason, isVoiceAuthRefusal, speakTimeoutFor,
  SPEAK_TIMEOUT_MS, SPEAK_TIMEOUT_WHEN_DARK_MS,
} from '../lib/voice-service.js';
import { buildVoiceChecks, PASS, FAIL } from '../lib/voice-system-check.js';

const HOOK = readFileSync(resolve(__dirname, '../lib/use-read-aloud.js'), 'utf8');
const STUDIO = readFileSync(resolve(__dirname, '../components/VoiceStudio.jsx'), 'utf8');

describe('the failure is named, not flattened to "unreachable"', () => {
  it('REPRODUCES HIS CASE: a 401 is a refusal, never an unreachable studio', () => {
    const msg = voiceErrorReason('voice-service-401');
    expect(msg).toMatch(/refused this device/);
    expect(msg).toMatch(/it is running/);
    expect(msg).not.toMatch(/unreachable/);
  });

  it('403 reads the same way', () => {
    expect(voiceErrorReason('voice-service-403')).toMatch(/refused this device/);
  });

  it('and it explains WHY a device can be refused by a studio that answers', () => {
    expect(voiceErrorReason('voice-service-401')).toMatch(/per-device and never syncs/);
  });

  it('a timeout says the studio is up but slow, which is a different action', () => {
    const msg = voiceErrorReason('voice-service-timeout');
    expect(msg).toMatch(/too slowly/);
    expect(msg).toMatch(/It is up/);
  });

  it('a genuinely unreachable studio is the ONLY thing called unreachable', () => {
    expect(voiceErrorReason('voice-service-error')).toMatch(/could not be reached at all/);
    expect(voiceErrorReason('voice-service-no-response')).toMatch(/could not be reached at all/);
  });

  it('a missing sample is named as a missing sample', () => {
    expect(voiceErrorReason('no-voice-sample')).toMatch(/no voice sample on THIS device/);
  });

  it('an unknown tag is still reported rather than swallowed', () => {
    expect(voiceErrorReason('something-new')).toContain('something-new');
    expect(voiceErrorReason('')).toMatch(/did not name/);
  });

  it('auth refusal is distinguishable in code, not only in prose', () => {
    expect(isVoiceAuthRefusal('voice-service-401')).toBe(true);
    expect(isVoiceAuthRefusal('voice-service-403')).toBe(true);
    expect(isVoiceAuthRefusal('voice-service-timeout')).toBe(false);
    expect(isVoiceAuthRefusal('voice-service-500')).toBe(false);
  });

  it('both call sites use it — the tag is no longer discarded', () => {
    expect(HOOK).toMatch(/voiceErrorReason\(error\)/);
    expect(STUDIO).toMatch(/voiceErrorReason\(error\)/);
    expect(HOOK).not.toMatch(/Voice endpoint unreachable — using a stand-in voice/);
    expect(STUDIO).not.toMatch(/The voice studio was unreachable — using the stand-in voice for now/);
  });
});

describe('the studio is TRIED, not asked about', () => {
  it('the attempt no longer consults the probe', () => {
    expect(HOOK).toMatch(/const attemptStudio = readyOverride !== undefined \? readyOverride : mayAttemptStudio\(\);/);
    expect(HOOK).toMatch(/if \(voice && attemptStudio\) \{/);
  });

  it('REPRODUCES THE DEFECT: the old condition refused to try when the probe said down', () => {
    // `isVoiceServiceReady() && studioHealth !== 'down'` — a probe of one route
    // vetoing a call to another.
    const old = (ready, health) => ready && health !== 'down';
    expect(old(true, 'down')).toBe(false); // would have worked; never attempted
    expect(old(true, 'up')).toBe(true);
  });

  it('the display signal still listens to the probe, because saying "answering" when it is not would be the lie DR-0440 forbids', () => {
    expect(HOOK).toMatch(/const sovereignVoiceReady = readyOverride !== undefined \? readyOverride : \(isVoiceServiceReady\(\) && studioHealth !== 'down'\);/);
  });

  it('a dark studio is tried on a SHORT clock rather than skipped', () => {
    expect(speakTimeoutFor('down')).toBe(SPEAK_TIMEOUT_WHEN_DARK_MS);
    expect(speakTimeoutFor('down')).toBeLessThan(SPEAK_TIMEOUT_MS);
    expect(speakTimeoutFor('down')).toBeGreaterThan(0);
  });

  it('a studio last seen answering keeps the full generation window', () => {
    expect(speakTimeoutFor('up')).toBe(SPEAK_TIMEOUT_MS);
    expect(speakTimeoutFor('unknown')).toBe(SPEAK_TIMEOUT_MS);
  });

  it('and the read actually passes that sized timeout through', () => {
    expect(HOOK).toMatch(/timeoutMs: speakTimeoutFor\(studioHealth\)/);
  });
});

describe('the chain no longer omits the link that breaks', () => {
  const base = {
    signedIn: true, enrolKey: 'darrell', instanceId: 'i1', reviewerMode: false,
    recorderSupported: true, sampleOnDevice: true, consentRow: true, studioHealth: 'up',
  };

  it('REPRODUCES HIS SCREEN: every other row passes while the read is refused', () => {
    const rows = buildVoiceChecks({ ...base, bridgeKey: false });
    const key = rows.find((r) => r.id === 'bridge-key');
    expect(key.state).toBe(FAIL);
    // Everything else was green — which is exactly why "All 7 checks pass" and
    // "unreachable" could appear a minute apart.
    expect(rows.filter((r) => r.id !== 'bridge-key').every((r) => r.state === PASS)).toBe(true);
  });

  it('passes once the device holds the key', () => {
    expect(buildVoiceChecks({ ...base, bridgeKey: true }).find((r) => r.id === 'bridge-key').state).toBe(PASS);
  });

  it('the row explains the per-device trap rather than just failing', () => {
    const key = buildVoiceChecks({ ...base, bridgeKey: false }).find((r) => r.id === 'bridge-key');
    expect(key.detail).toMatch(/never syncs between devices/);
    // DR-0574: the fix is no longer a chore for a person — the device asks
    // the family for the key itself, and the row says what came back.
    expect(key.fix).toMatch(/asks the family for the key itself|published it yet/);
    expect(key.where).toMatch(/voice_forwarder\.py/);
  });

  it('the studio row stops implying a read will succeed', () => {
    const studio = buildVoiceChecks({ ...base, bridgeKey: false }).find((r) => r.id === 'studio');
    expect(studio.detail).toMatch(/not the same as a read succeeding/);
  });

  it('the panel feeds the real device state in', () => {
    expect(STUDIO).toMatch(/bridgeKey: hasBridgeToken\(\)/);
  });
});
