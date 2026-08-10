// @vitest-environment node
// =============================================================================
// Who may pass the door, and whose app they are in (DR-0290)
// =============================================================================
// Two reports from Darrell, 2026-08-10, minutes apart:
//   "why would anyone need to login to see the lessons?
//    https://poetech.us/poetech-app/?view=church&sub=learn&course=world-issues
//    &lesson=wi-law-of-assumption"
//   "This should be an advantage for PoeTech App... easy for promotion to
//    potential students users and businesses."
//   "whenever I'm in learn... from PoeTech App... I end up in the Love Corner
//    App... still an issue."
//
// Both are the same question asked from opposite sides — WHO is at the door and
// HOW did they arrive — and both were answered by looking at the wrong thing:
// the gate looked at whether the app was INSTALLED, and the brand looked at
// which TAB was open.
//
// This file holds the two rules as pure predicates so the security half stays
// directly testable: the church opens to a stranger, the private app does not,
// and the brand follows the door a person came through rather than the tab they
// tapped.
import { describe, it, expect } from 'vitest';
import { isPublicChurchRoute } from '../lib/access-gate.js';
import { isChurchDoorContext } from '../lib/church-own-door.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// The shell's rule, mirrored here so it is asserted rather than described:
//   wearsChurchBrand = churchDoorOnly || (!signedIn && publicChurchRoute)
const wearsChurchBrand = ({ search = '', standalone = false, signedIn = false }) =>
  isChurchDoorContext(search, { standalone }) || (!signedIn && isPublicChurchRoute(search));

describe('the lessons open for anyone — the link IS the promotion', () => {
  it('the exact link Darrell sent opens with no login', () => {
    expect(isPublicChurchRoute('?view=church&sub=learn&course=world-issues&lesson=wi-law-of-assumption')).toBe(true);
  });

  it('it opens in an ORDINARY browser tab, not only an installed app', () => {
    // The old rule: the church was public only when the app was already
    // installed (standalone) — so the very people a link is meant to reach
    // were the only ones it did not work for.
    const search = '?view=church&sub=learn';
    expect(isChurchDoorContext(search, { standalone: false })).toBe(false);
    expect(isPublicChurchRoute(search)).toBe(true);
  });
});

describe('the private app stays private', () => {
  it('no PoeTech route is opened by the church rule', () => {
    for (const q of ['', '?view=overview', '?view=books&sub=transactions', '?view=admin', '?view=crm', '?view=projects', '?view=markets', '?view=center']) {
      expect(isPublicChurchRoute(q)).toBe(false);
    }
  });
});

describe('whose app am I in — the brand follows the DOOR, not the tab', () => {
  it('THE REPORT: a signed-in steward inside PoeTech who opens Learn stays in PoeTech', () => {
    expect(wearsChurchBrand({ search: '?view=church&sub=learn', signedIn: true, standalone: false })).toBe(false);
  });

  it('a member who came through the church’s own door wears the church (DR-0174 kept)', () => {
    expect(wearsChurchBrand({ search: '?view=church&lovecorner=1', signedIn: false })).toBe(true);
    expect(wearsChurchBrand({ search: '?lovecorner=1', signedIn: true })).toBe(true);
  });

  it('the installed Love Corner app still wears the church', () => {
    expect(wearsChurchBrand({ search: '?view=church', standalone: true, signedIn: true })).toBe(true);
  });

  it('a stranger opening a shared lesson link wears the church — they came for it', () => {
    expect(wearsChurchBrand({ search: '?view=church&sub=learn&lesson=wi-law-of-assumption', signedIn: false })).toBe(true);
  });

  it('PROVEN-TO-CATCH: the old rule (any ?view=church wears the church) fails the steward case', () => {
    const oldRule = (search) => new URLSearchParams(search).get('view') === 'church';
    expect(oldRule('?view=church&sub=learn')).toBe(true);          // what shipped
    expect(wearsChurchBrand({ search: '?view=church&sub=learn', signedIn: true })).toBe(false); // what is right
  });

  it('a signed-in steward on any PoeTech tab is never re-branded', () => {
    for (const q of ['?view=overview', '?view=books', '?view=projects']) {
      expect(wearsChurchBrand({ search: q, signedIn: true })).toBe(false);
    }
  });
});


// ===========================================================================
// NO FIGHT TO ENTER — source-pinned, because a modal is what a fight looks like
// ===========================================================================
// Darrell 2026-08-10, after the door was opened: "Most people will love the
// content... not a fight to enter a space... make sure it's just a link that
// anyone can see instantly... no fight!!!!????!!!!"
//
// Opening the gate is not enough on its own: the shell has two FULL-SCREEN
// modal dialogs for a visitor with no profile — the scenario picker and "Who's
// using this device?" — and either one would slam into a stranger's face the
// moment they tapped a texted lesson link. That is the fight, one layer past
// the wall. These conditions are pinned in the source so a future edit cannot
// quietly re-introduce it.
describe('a shared link opens instantly — no modal stands in the way', () => {
  const shell = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', 'poe-financial-mvp-v28.jsx'), 'utf8');

  it('the shell derives the public visitor (signed-out, on a church link)', () => {
    expect(shell).toMatch(/const publicVisitor = !authSession && churchBrandRoute;/);
  });

  it('the scenario / first-time picker never opens for them', () => {
    const line = shell.split('\n').find((l) => l.includes('isPickerMode || isFirstTimeLanding'));
    expect(line, 'the picker condition must exist').toBeTruthy();
    expect(line).toContain('!publicVisitor');
  });

  it('the "Who\u2019s using this device?" profile modal never opens for them', () => {
    const line = shell.split('\n').find((l) => l.includes("aria-labelledby=\"profile-picker-h\"") || l.includes('!currentProfile && !isAnyDemoMode'));
    expect(line, 'the profile-modal condition must exist').toBeTruthy();
    expect(line).toContain('!publicVisitor');
  });

  it('and both still guard everyone else exactly as before', () => {
    // The conditions keep their original churchDoorOnly guard — this change
    // ADDS an exclusion, it does not replace the ones already there.
    const picker = shell.split('\n').find((l) => l.includes('isPickerMode || isFirstTimeLanding'));
    const profile = shell.split('\n').find((l) => l.includes('!currentProfile && !isAnyDemoMode'));
    expect(picker).toContain('!churchDoorOnly');
    expect(profile).toContain('!churchDoorOnly');
    expect(profile).toContain("view !== 'admin'");
  });
});
