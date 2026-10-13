// =============================================================================
// The audio session is claimed INSIDE the tap — or background listening is dead
// =============================================================================
// Darrell 2026-08-13: "I cant listen to a lesson in the background yet...
// timeline?" and, from the phone: "if the top tab is moved the reader stops."
//
// WHY IT WAS BROKEN, and why it was invisible.
//
// `lib/background-audio.js` holds one silent looping <audio> element while the
// reader reads. A mobile browser freezes a backgrounded page unless it is
// playing media, and speechSynthesis is not media — that silent element is the
// only thing that makes the page an audio session, and it is what earns the
// lock-screen controls.
//
// It was built, instantiated, and started. `read()` even claimed it correctly,
// BEFORE its own awaits, with a comment saying exactly why:
//   "Claim the audio session INSIDE the user's tap — after an await the gesture
//    is spent and the browser refuses to start it."
//
// And the CALLER defeated it. Both play paths in TTSControl reveal collapsed
// content and `await settled(...)` — up to ten double-requestAnimationFrame
// waits — BEFORE they ever call read(). By then the tap is spent, the browser
// declines to start the silent element, no audio session exists, and switching
// tabs freezes the page mid-sentence.
//
// That is the same shape as the aria-haspopup bug (DR-0299): the rule was
// written, correct, and in the right file — and the call site did not honour
// it. A rule that depends on every caller remembering is a comment, not a
// mechanism.
//
// This pins ORDER, which is the whole property. It is a source-order check on
// purpose: the failure is "an await happened first", and no amount of mocking
// reproduces a spent user-gesture in jsdom — a render test here would pass
// while the real browser refused, which is precisely the theatre DR-0301
// recorded.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const TTS = readFileSync(join(HERE, '..', 'components', 'TTSControl.jsx'), 'utf8');
const HOOK = readFileSync(join(HERE, '..', 'lib', 'use-read-aloud.js'), 'utf8');

// COMMENTS ARE NOT CODE. The first draft of this file compared raw source
// offsets and reported read() as broken — because the word "await" appears in
// the COMMENT that explains why the claim must come first. A guard that
// measures prose instead of statements is the same theatre it exists to
// prevent, so comments are stripped before any position is taken.
const stripComments = (src) => String(src)
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1');

// The body of a NAMED function, comments removed, ending where the next
// top-level declaration begins.
//
// The first draft anchored on a line of code instead, and that was wrong twice
// over: the chosen line appears in `readablePageText` AND in the "Talk about
// this" handler, so the check silently measured a helper with no awaits and
// would have passed while the real play path stayed broken. Anchoring on the
// declaration is unambiguous by construction.
const fnBody = (src, decl) => {
  const clean = stripComments(src);
  const i = clean.indexOf(decl);
  if (i < 0) return '';
  const rest = clean.slice(i + decl.length);
  const end = rest.search(/\n {2}const \w+ = (?:async |useCallback|\()/);
  return end < 0 ? rest : rest.slice(0, end);
};

describe('the hook exposes a claim the caller can make synchronously', () => {
  it('claimAudio exists and is not async', () => {
    expect(HOOK).toMatch(/const claimAudio = useCallback\(\(title\) => \{/);
    expect(HOOK, 'an async claim would be spent before it ran').not.toMatch(/claimAudio = useCallback\(async/);
  });

  it('it starts the session, names it, and wires the OS controls', () => {
    const body = fnBody(HOOK, 'const claimAudio = useCallback');
    expect(body).toContain('session.start()');
    expect(body).toContain('session.describe(');
    expect(body).toContain('session.onControl(');
    expect(body).toContain("session.setState('playing')");
  });

  it('a failure to claim degrades the read, never breaks it', () => {
    const body = fnBody(HOOK, 'const claimAudio = useCallback');
    expect(body).toContain('catch');
  });

  it('the hook RETURNS it — not merely defines it', () => {
    // This assertion started life as /claimAudio[\s\S]*?return \{/, which only
    // proved the name appeared somewhere before some return. It passed while
    // claimAudio was absent from the returned object, so the call site got
    // `undefined` and threw on every press — the reader suite caught what this
    // did not. It now reads the returned object itself.
    const ret = HOOK.slice(HOOK.lastIndexOf('  return {'));
    expect(ret, 'claimAudio is defined but never handed to the caller').toMatch(/^\s*claimAudio,\s*$/m);
  });
});

describe('BOTH play paths claim BEFORE their first await', () => {
  // The two reading entry points. Each reveals + settles before it speaks, so
  // each must claim first or background listening dies on that path.
  const paths = [
    { name: 'page read (no registered target)', decl: 'const start = async () => {' },
    { name: 'target read (a lesson or section)', decl: 'const readTargetNow = async (t,' },
  ];

  for (const p of paths) {
    it(`${p.name}: claimAudio precedes the first await`, () => {
      const body = fnBody(TTS, p.decl);
      expect(body, `${p.decl} not found — the handler was renamed`).not.toBe('');
      const claim = body.indexOf('claimAudio(');
      const firstAwait = body.indexOf('await ');
      expect(claim, `${p.name} never claims the audio session`).toBeGreaterThanOrEqual(0);
      expect(firstAwait, 'this path should await — if it stopped, re-check this test').toBeGreaterThanOrEqual(0);
      expect(
        claim,
        `${p.name} claims AFTER an await — the tap is spent and the browser will refuse`,
      ).toBeLessThan(firstAwait);
    });
  }

  it('each body really is the handler, not a lookalike helper', () => {
    // The guard on the guard: a body that does not reveal-and-settle is not a
    // play path, and measuring it would prove nothing.
    for (const p of paths) {
      expect(fnBody(TTS, p.decl), `${p.name} does not reveal+settle`).toMatch(/settled\(/);
    }
  });

  it('the caller uses the hook’s claim rather than reaching past it', () => {
    expect(TTS).toMatch(/setRate, claimAudio,/);
  });
});

describe('read() still claims too — belt and braces', () => {
  it('read claims before its own awaits, for any caller that never claimed', () => {
    const body = fnBody(HOOK, 'const read = useCallback(async (text');
    const claim = body.indexOf('claimAudio(');
    const firstAwait = body.indexOf('await ');
    expect(claim).toBeGreaterThanOrEqual(0);
    expect(claim, 'read() must not regress to claiming after an await').toBeLessThan(firstAwait);
  });

  it('start() is idempotent, so claiming twice is safe', () => {
    const bg = readFileSync(join(HERE, '..', 'lib', 'background-audio.js'), 'utf8');
    expect(bg, 'the double claim relies on this being stated').toMatch(/begin \(or keep\)/i);
  });
});
