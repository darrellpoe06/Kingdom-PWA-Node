// @vitest-environment node
// =============================================================================
// THE READER NAMES THE VOICE THAT SPOKE — not the one that was picked
// =============================================================================
// 2026-10-09. Every Cloudflare Pages Function on poetech.us stopped being
// invoked. The cloned-voice road (/voice, the GPU studio) went with them, and
// the reader fell back — exactly as voice-service.js has always documented it
// would. What it did NOT do was say so. The picker still read "My voice
// (Darrell) · AI" while a stand-in voice read the lesson aloud, and the first
// thing that noticed was Darrell's ear: "Switched to a female voice..."
//
// A surface that asserts a cloned voice while a different one is speaking is
// the same defect class as the health probe that read "UP" through the whole
// lockout: it reports the REQUEST and calls it the RESULT. So every successful
// synthesis now carries the engine that actually produced the audio, and these
// pin it:
//
//   'studio'     — the real cloned timbre, from the GPU studio behind /voice
//   'voice-lite' — Piper on the NAS: a real voice, but NOT the cloned one
//
// A caller can then say which voice spoke. Until the UI is wired to show it
// (see the DR's re-review), this is the layer that stops being able to lie.
// =============================================================================
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SRC = readFileSync(join(process.cwd(), 'src', 'lib', 'voice-service.js'), 'utf8');

/** Every `return { ... }` that hands back a playable object URL. */
function playableReturns(text) {
  return [...text.matchAll(/return \{[^}]*URL\.createObjectURL\(blob\)[^}]*\}/g)].map((m) => m[0]);
}

describe('every synthesis that produces audio names its engine', () => {
  it('finds the real synthesis returns in the service', () => {
    const rets = playableReturns(SRC);
    expect(rets.length).toBeGreaterThanOrEqual(2);
  });

  it('NO playable return is unlabelled — an unnamed voice is the bug', () => {
    const unlabelled = playableReturns(SRC).filter((r) => !/engine:\s*'[a-z-]+'/.test(r));
    expect(
      unlabelled,
      `these hand back audio without saying which engine made it:\n${unlabelled.join('\n')}`
    ).toEqual([]);
  });

  it('names the cloned studio voice distinctly from the NAS stand-in', () => {
    expect(SRC).toMatch(/engine:\s*'studio'/);
    expect(SRC).toMatch(/engine:\s*'voice-lite'/);
  });

  it('the two engines are not the same string, because they are not the same voice', () => {
    const names = [...SRC.matchAll(/engine:\s*'([a-z-]+)'/g)].map((m) => m[1]);
    expect(new Set(names).size).toBe(names.length);
  });
});

// PROVEN-TO-CATCH (DR-0076 section 3): a gate that cannot fail is a lie.
describe('PROVEN-TO-CATCH', () => {
  it('catches a playable return that forgot to name its engine', () => {
    const forgot = "    return { url: URL.createObjectURL(blob), blob };";
    expect(playableReturns(forgot)).toHaveLength(1);
    expect(playableReturns(forgot).filter((r) => !/engine:\s*'[a-z-]+'/.test(r))).toHaveLength(1);
  });

  it('accepts one that names it', () => {
    const named = "    return { url: URL.createObjectURL(blob), engine: 'studio' };";
    expect(playableReturns(named).filter((r) => !/engine:\s*'[a-z-]+'/.test(r))).toEqual([]);
  });

  it('would catch both engines being labelled the same, which hides the swap', () => {
    const same = "engine: 'studio' engine: 'studio'";
    const names = [...same.matchAll(/engine:\s*'([a-z-]+)'/g)].map((m) => m[1]);
    expect(new Set(names).size).not.toBe(names.length);
  });
});
