// =============================================================================
// reviewer-mode — the steward's "see it as a user" review lens (DR-0076 gates)
// =============================================================================
// Three layers, each proven-to-catch:
//   1. PURE — the flag helpers narrow-only, fail-soft, and round-trip.
//   2. RENDER — the real banner mounts in jsdom and its Exit actually fires.
//   3. WIRING — the shell source is pinned at every load-bearing point: the
//      role derivations narrow, and EVERY write path to the steward's real
//      data (local blob, cloud snapshot, saved profile, tier grant) is
//      suppressed while the flag is on. Deleting any one wiring point fails
//      this suite — the EMPTY_WORLD-clobber hazard stays closed by a gate,
//      not a claim.
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  REVIEWER_MODE_KEY, isReviewerModeOn, enterReviewerMode, exitReviewerMode,
  ReviewerModeBanner,
} from '../lib/reviewer-mode.jsx';
import { previewAction } from '../lib/admin-console.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

const fakeStorage = (initial = {}) => {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
};

// --- 1. pure flag behavior ----------------------------------------------------

describe('isReviewerModeOn — fail-soft, narrow-only flag read', () => {
  it('is OFF by default and ON only for the exact flag value', () => {
    expect(isReviewerModeOn(fakeStorage())).toBe(false);
    expect(isReviewerModeOn(fakeStorage({ [REVIEWER_MODE_KEY]: '1' }))).toBe(true);
    expect(isReviewerModeOn(fakeStorage({ [REVIEWER_MODE_KEY]: 'yes' }))).toBe(false);
  });
  it('fails soft (OFF) with no storage or a throwing storage', () => {
    expect(isReviewerModeOn(null)).toBe(false);
    expect(isReviewerModeOn({ getItem: () => { throw new Error('blocked'); } })).toBe(false);
  });
});

describe('enter/exit — round-trip, and both reload so the boot path re-runs', () => {
  it('enter sets the flag and reloads; exit clears it and reloads', () => {
    const storage = fakeStorage();
    const reload = vi.fn();
    enterReviewerMode(storage, reload);
    expect(isReviewerModeOn(storage)).toBe(true);
    exitReviewerMode(storage, reload);
    expect(isReviewerModeOn(storage)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(2);
  });
  it('a blocked storage still reloads (never a stuck half-state)', () => {
    const reload = vi.fn();
    enterReviewerMode(null, reload);
    exitReviewerMode(null, reload);
    expect(reload).toHaveBeenCalledTimes(2);
  });
});

// --- 2. the real banner, mounted ------------------------------------------------

describe('ReviewerModeBanner — the only way back is real', () => {
  beforeEach(() => { document.body.innerHTML = ''; });

  it('renders the lens label + the honest no-writes line, and Exit fires', async () => {
    const onExit = vi.fn();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => { root.render(createElement(ReviewerModeBanner, { onExit })); });
    expect(host.textContent).toContain('Reviewer mode');
    expect(host.textContent).toContain('untouched');
    const btn = [...host.querySelectorAll('button')].find((b) => /exit reviewer mode/i.test(b.textContent));
    expect(btn, 'the Exit button must exist').toBeTruthy();
    await act(async () => { btn.click(); });
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});

// --- 3. shell + admin-console wiring (source-pinned, proven-to-catch) ----------

// Every load-bearing wiring point in the shell. Each string is the exact code
// this feature added; if a refactor removes or reshapes one, this list is the
// review checklist for what the replacement must still guarantee.
const SHELL_WIRING = [
  // the lens flag exists and is read once per boot
  'const reviewerMode = isReviewerModeOn();',
  // role derivations NARROW (family / staff / study / Governor / owner)
  'const isFamilyMember = !reviewerMode && isFamilyEmail(authSession?.user?.email);',
  'const isChurchStaff = !reviewerMode && (isFamilyMember || isChurchStaffEmail(authSession?.user?.email));',
  'const isStudyCircle = !reviewerMode && isStudyCircleEmail(authSession?.user?.email);',
  'const isGov = !!authSession && !reviewerMode && isFamilyEmail(',
  // the family-PII Imported gate treats a reviewer like a demo/outside state
  'isAnyDemoMode: isAnyDemoMode || reviewerMode',
  // boot data is the public user sample, never this device's saved steward blob
  "(isPublicHost() || reviewerMode) ? DEMO_DATA_FAMILY_OF_4",
  'if (isPublicHost() || reviewerMode) {',
  // signed-in hydration: a reviewer is a fresh user — EMPTY_WORLD, never SEED
  'if (reviewerMode) { setData(EMPTY_WORLD); setAuthHydrated(true); return; }',
  // profile: self-serve, state only; saved device profile never read or written
  "if (reviewerMode) { setCurrentProfile('self'); return; }",
  "if (!reviewerMode) { if (p) localStorage.setItem('poe-current-profile'",
  // WRITE SUPPRESSION — the clobber hazard: local blob save + snapshot push
  'if (isAnyDemoMode || reviewerMode) return; // Demo + picker + reviewer never write',
  // cloud snapshot pull (the steward's real world must not leak into the lens)
  'if (!authSession || isAnyDemoMode || reviewerMode || snapshotPulledRef.current) return;',
  // the family tier grant stays off (a reviewer sits at the user's real tier)
  'if (!authSession || isAnyDemoMode || reviewerMode) return;',
  // table syncs stay off (DR-0241 faithfulness): without this the steward's
  // real cloud rows merge into the "fresh user" preview
  'if (reviewerMode) {\n      setShowVerifyBalances(false);\n      return;\n    }',
  // the pinned banner renders whenever the lens is on
  '{reviewerMode && <ReviewerModeBanner />}',
];

describe('shell wiring — every narrowing + suppression point is present', () => {
  const shell = readFileSync(join(SRC, 'poe-financial-mvp-v28.jsx'), 'utf8');

  it.each(SHELL_WIRING.map((w) => [w]))('shell contains: %s', (fragment) => {
    expect(shell.includes(fragment), `missing wiring: ${fragment}`).toBe(true);
  });

  it('the Admin entry (tab + console gate) is closed to a reviewer AND to a signed-in guest on the home host, both sites', () => {
    // DR-0241: on a private host the open (no-session) state keeps the entry,
    // but a signed-in non-steward — an invited guest on the house WiFi — never
    // gets Admin. The gate must carry the !authSession term at both sites.
    const gate = '!reviewerMode && (isFamilyMember || (!isPublicHost() && !authSession))';
    const count = shell.split(gate).length - 1;
    expect(count, 'nav tab AND AdminConsole isGovernor must both carry the gate').toBeGreaterThanOrEqual(2);
    // The old host-only form must be gone (it granted Admin UI to any signed-in
    // user on the LAN).
    expect(shell.includes('(isFamilyMember || !isPublicHost())')).toBe(false);
  });

  it('proven-to-catch: the same checks FAIL on a shell without the wiring', () => {
    const unwired = shell.split('reviewerMode').join('___');
    for (const fragment of SHELL_WIRING) {
      expect(unwired.includes(fragment)).toBe(false);
    }
  });
});

describe('admin console wiring — the steward can enter, preview-then-execute', () => {
  it('the review-as-user action exists with honest preview copy', () => {
    const spec = previewAction('review-as-user');
    expect(spec).toBeTruthy();
    expect(spec.label).toBe('Review as a user');
    expect(spec.danger).toBe(false);
    const preview = spec.preview.join(' ');
    expect(preview).toContain('reloads once');
    expect(preview).toContain('cloud snapshot');
    // Honest boundary (DR-0076): deliberate submissions are real, and we say so.
    expect(preview).toContain('still lands in your own account');
  });

  it('AdminConsole renders the action and wires it to enterReviewerMode', () => {
    const src = readFileSync(join(SRC, 'components', 'AdminConsole.jsx'), 'utf8');
    expect(src.includes('actionId="review-as-user"')).toBe(true);
    expect(src.includes('enterReviewerMode')).toBe(true);
  });
});
