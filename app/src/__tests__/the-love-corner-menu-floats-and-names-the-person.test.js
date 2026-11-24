// DR-1625 — the Love Corner's picture menu floats over the page, and the header
// names the person. Darrell 2026-11-24: "Big fonts block the picture drop down
// somehow... Inside the Love Corner App" and "Saying 6 instead of D for my name?"
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { headerName } from '../components/HeaderAuthButton.jsx';

const read = (p) => readFileSync(join(__dirname, '..', p), 'utf8');
const PHONE = { user: { email: '15636502416@phone.poetech.us' } };

describe('the header names the person at the Love Corner too', () => {
  it("his phone sign-in reads Darrell when the account's own name is handed in", () => {
    expect(headerName(null, PHONE, 'Darrell')).toBe('Darrell');
    expect(headerName(null, PHONE, 'Darrell')[0]).toBe('D');
  });

  it('PROVEN TO CATCH: without the name the fallback is the number, whose first characters are "(5"', () => {
    expect(headerName(null, PHONE).slice(0, 2)).toBe('(5');
  });

  it('the shell hands the Love Corner header the same name the PoeTech door gets', () => {
    expect(read('poe-financial-mvp-v28.jsx')).toContain('<LoveCornerHeader personName={accountDoor.personName} ');
    expect(read('components/shell/LoveCornerHeader.jsx')).toContain('headerName(profile, session, personName)');
  });
});

describe('the picture menu floats over the page at every text size', () => {
  it('the Love Corner menu is drawn floating, with the theme carried to its layer', () => {
    const menus = read('components/shell/LoveCornerMenus.jsx');
    expect(menus).toMatch(/look="lovecorner"\s+floating\s+theme=\{theme\}/);
    expect(read('components/shell/LoveCornerHeader.jsx')).toMatch(/anchorRef=\{avatarRef\}\s+theme=\{theme\}/);
  });

  it('floating, it is pinned inside the screen, scrolls, and sits above the bottom bar', () => {
    const rule = read('index.css')
      .split('\n')
      .find((l) => l.startsWith('.lch-menu.acct-menu-float{'));
    expect(rule).toBeTruthy();
    for (const part of ['left:auto!important', 'right:8px', 'width:auto!important', 'max-width:calc(100vw - 16px)', 'overflow-y:auto', 'z-index:80']) {
      expect(rule, part).toContain(part);
    }
  });
});
