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
  'const isChurchStaff = !reviewerMode && (isFamilyMember || isChurchStaffEmail(',
  'const isStudyCircle = !reviewerMode && isStudyCircleEmail(authSession?.user?.email);',
  // the ONE authority derivation every Governor surface now reads (DR-1106:
  // the database role decides, not the email allowlist). The narrowing moved
  // INSIDE the rule (lib/family-standing.js governsHere returns false in the
  // lens, for the role as well as the address) — the shell's duty is to hand
  // it `reviewerMode`, which is what this entry pins.
  'const isGov = governsHere({ signedIn: !!authSession, reviewerMode, allowlisted: isFamilyMember, role: instanceRoleState.role });',
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
  'if (reviewerMode) { setShowVerifyBalances(false); return; }',
  // the pinned banner renders whenever the lens is on
  '{reviewerMode && <ReviewerModeBanner />}',
];

describe('shell wiring — every narrowing + suppression point is present', () => {
  const shell = readFileSync(join(SRC, 'poe-financial-mvp-v28.jsx'), 'utf8');

  it.each(SHELL_WIRING.map((w) => [w]))('shell contains: %s', (fragment) => {
    expect(shell.includes(fragment), `missing wiring: ${fragment}`).toBe(true);
  });

  it('EVERY role derivation still OPENS with the reviewer narrowing, however it grows', () => {
    // The pins above hold the shape of each line. This holds the PROPERTY they
    // exist for, which is the thing that must survive a rewrite: whatever else
    // a role predicate learns to read, `!reviewerMode &&` comes first, so the
    // whole expression is false in the lens.
    //
    // It earned its place on 2026-09-12: isChurchStaff gained a third way in
    // (the office-granted see:church-staff capability, DR-0367) and the exact
    // string pin fired — correctly. The narrowing was intact; the spelling was
    // not. A pin that can only say "this line changed" cannot tell those apart.
    for (const name of ['isFamilyMember', 'isChurchStaff', 'isStudyCircle']) {
      const m = shell.match(new RegExp(`const ${name} = ([^;]*);`));
      expect(m, `${name} is gone`).toBeTruthy();
      expect(m[1].startsWith('!reviewerMode &&'), `${name} no longer narrows for a reviewer: ${m[1]}`).toBe(true);
    }
    // The authority derivation narrows too. It is no longer spelled with
    // isFamilyEmail (DR-1106 moved it to the database role) and the narrowing
    // now lives inside governsHere, so what the shell must still do is HAND IT
    // the lens — checked here, with the rule's own behavior in
    // family-standing.test.js ("the reviewer lens is senior to BOTH").
    const gov = shell.match(/const isGov = governsHere\(([^;]*)\);/);
    expect(gov, 'isGov is gone').toBeTruthy();
    expect(gov[1]).toContain('reviewerMode');
    expect(gov[1]).toContain('signedIn: !!authSession');
    // and nothing else in the shell may derive authority around it.
    expect(/const isGov = (?!governsHere)/.test(shell), 'isGov must come from the rule').toBe(false);
  });

  it('the reviewer strip rides EVERY shell return path — the app shell AND the TLC door takeover (Exit is never hidable, DR-0104)', () => {
    // The ?tlc=1 door returns early, ~500 lines before the app shell's banner
    // mount. Without its own mount, a steward who navigates to /tlc/ while the
    // lens is on loses the only way back (caught 2026-08-05, REV-0239). Two
    // sites, both pinned by count.
    const count = shell.split('{reviewerMode && <ReviewerModeBanner />}').length - 1;
    expect(count, 'banner must mount in the app shell AND the TLC door early return').toBeGreaterThanOrEqual(2);
  });

  it('dev affordances are steward/demo-only — a real signed-in user never sees a tier bypass or a seed reset (REV-0239)', () => {
    // The tier wall is real money ($39/$89/$149/$249): the preview switcher,
    // the UpgradePrompt "Dev preview — switch tier" row, and the footer
    // "Reset to seed data" are steward/demo controls, never a user's.
    expect(shell.includes('{!churchDoorOnly && (isFamilyMember || isAnyDemoMode) && <TierSwitcher')).toBe(true);
    expect(shell.includes('{!churchDoorOnly && <TierSwitcher'), 'ungated TierSwitcher must stay gone').toBe(false);
    const gatedPrompts = shell.split('setUserTier={(isFamilyMember || isAnyDemoMode) ? setUserTier : null}').length - 1;
    expect(gatedPrompts, 'all three UpgradePrompt sites pass setUserTier only to stewards/demo').toBeGreaterThanOrEqual(3);
    expect(/UpgradePrompt[^\n]*setUserTier=\{setUserTier\}/.test(shell), 'no UpgradePrompt may receive the raw setter').toBe(false);
    // DR-0713 narrowed the footer seed reset further, to demo mode only: it sat
    // under the family's REAL ledger (Darrell's screenshot 2026-09-30).
    expect(shell.includes('{isAnyDemoMode && (<button type="button" onClick={resetToSeed}')).toBe(true);
  });

  it('the Admin entry (tab + console gate) is closed to a reviewer AND to a signed-in guest on the home host, both sites', () => {
    // DR-0241: on a private host the open (no-session) state keeps the entry,
    // but a signed-in non-steward — an invited guest on the house WiFi — never
    // gets Admin. The gate must carry the !authSession term at both sites.
    // DR-1106 swapped the steward term for the role-derived one at both sites:
    // the shell reads its own `isGovernorHere`, nav-items reads the
    // `isGovernor` it is handed. Same gate, two spellings, so each file is
    // checked for its own — and the shell must actually PASS the role-derived
    // flag, or nav-items would quietly fall back to the allowlist default.
    const navItems = readFileSync(join(SRC, 'lib', 'nav-items.jsx'), 'utf8');
    expect(shell.includes('!reviewerMode && (isGov || (!isPublicHost() && !authSession))'),
      'the AdminConsole gate must carry the reviewer + signed-in-guest terms').toBe(true);
    expect(navItems.includes('!reviewerMode && (isGovernor || (!isPublicHost() && !authSession))'),
      'the Admin nav tab must carry the same gate').toBe(true);
    expect(/navItems\(\{[^)]*isGovernor: isGov/.test(shell),
      'the shell must hand nav-items the role-derived flag, not the allowlist default').toBe(true);
    // The old host-only form must be gone (it granted Admin UI to any signed-in
    // user on the LAN).
    expect(shell.includes('(isFamilyMember || !isPublicHost())')).toBe(false);
    expect(navItems.includes('(isFamilyMember || !isPublicHost())')).toBe(false);
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
