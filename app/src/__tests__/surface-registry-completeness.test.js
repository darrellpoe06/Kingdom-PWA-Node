// surface-registry-completeness — every top-level nav VIEW must be a REGISTERED
// module (Darrell 2026-07-04: "TV Time module? Or not a module... if you forgot
// then we need another something to remind").
//
// This closes the REVERSE of surface-mount-integrity. That test proves every
// REGISTERED surface is mounted in the shell (no dead ends). This one proves the
// other direction: every top-level route the shell accepts (`VALID`) is either a
// registered surface in surfaces.js (a real module — its own component + lazy
// loader + boundary wrap) OR one of a FROZEN allow-list of known container /
// not-yet-extracted inline views. So a future feature jammed straight into the
// monolith (a `view === 'foo'` branch + nav entry, no surfaces.js entry) can no
// longer ship as a non-module in silence — this goes red and names it.
//
// Proven-to-catch (DR-0076): the checker is pure and the test feeds it a
// fabricated unregistered view to prove it flags one.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SURFACES } from '../surfaces.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const shellSrc = readFileSync(join(SRC, 'poe-financial-mvp-v28.jsx'), 'utf8');

// The top-level routes the shell accepts, parsed from its VALID allow-list.
export function parseValidViews(src) {
  const m = src.match(/const VALID = \[([^\]]+)\]/);
  if (!m) throw new Error('surface-registry-completeness: VALID not found in the shell');
  return m[1].split(',').map((s) => s.trim().replace(/['"`]/g, '')).filter(Boolean);
}

// FROZEN allow-list — the top-level views that legitimately are NOT their own
// registered module today: the home overview, the container views that hold sub-
// surfaces (books/church), and the inline surfaces still awaiting extraction
// (inbound/projects). A view leaves this list by BECOMING a registered surface
// (then it's caught by registration, not the allow-list). Adding to this list is
// a deliberate, reviewable act — the reminder is that you must choose.
// 'tlc' is a CONTAINER (like books/church): it holds three views of one office
// (Practice / Intake / Assistant) that are themselves already mounted surfaces —
// it composes them, it is not its own module.
export const NON_MODULE_VIEWS = new Set(['overview', 'books', 'inbound', 'projects', 'church', 'tlc']);

// Pure checker: which accepted views are neither a registered top-level surface
// nor an allowed non-module view. Non-empty => a feature that skipped being a
// module (or a new container that must be explicitly allow-listed).
export function unregisteredViews(validViews, surfaces, allow) {
  const registered = new Set((surfaces || []).filter((s) => s.nav === 'top').map((s) => s.view));
  return (validViews || []).filter((v) => !registered.has(v) && !allow.has(v));
}

describe('every top-level nav view is a registered module (or an allow-listed container)', () => {
  it('no accepted route skipped being a surfaces.js module', () => {
    const missing = unregisteredViews(parseValidViews(shellSrc), SURFACES, NON_MODULE_VIEWS);
    expect(missing, `these views are routable but NOT registered modules — add them to surfaces.js (or, if genuinely a container, to NON_MODULE_VIEWS with a reason): ${missing.join(', ')}`).toEqual([]);
  });

  it('TV Time is a registered module (the surface that prompted this guard)', () => {
    expect(SURFACES.some((s) => s.view === 'tvtime' && s.nav === 'top')).toBe(true);
    expect(NON_MODULE_VIEWS.has('tvtime')).toBe(false);
  });

  it('CATCHES a feature jammed inline without registration (proven-to-catch)', () => {
    const fakeValid = ['overview', 'tvtime', 'ghost-inline-feature'];
    expect(unregisteredViews(fakeValid, SURFACES, NON_MODULE_VIEWS)).toEqual(['ghost-inline-feature']);
  });
});
