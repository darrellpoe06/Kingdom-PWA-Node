// =============================================================================
// The collapsed header still says WHICH door this is, and the Messages tab
// says HOW MANY are waiting
// =============================================================================
// Darrell 2026-09-23, two Fold screenshots in one sitting:
//   * header tucked away on the church door — "I believe we can still say the
//     site's names when the header is hidden... still in the space available"
//   * the dock, every app with a count but PoeTech — the in-app half of that
//     is the Messages tab carrying the unread number (the launcher half is
//     lib/sw-door-scope.js, tested on its own).
// PROVEN-TO-CATCH: the name assertion fails without the siteName branch; the
// badge assertions fail if the tab draws a number it has not heard, or fails
// to draw the one it has.
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextSizeEscapeHatch } from '../components/TextSizeControl.jsx';
import { DmUnreadBadge } from '../components/shared.jsx';
import { DM_UNREAD_EVENT } from '../lib/notify-readiness.js';
import { DEFAULT_TEXT_SIZE } from '../lib/text-size.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const HERE = dirname(fileURLToPath(import.meta.url));

let container, root;
async function mount(component, props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(component, props));
  });
  return container;
}
beforeEach(() => { try { localStorage.setItem('poe-text-size', DEFAULT_TEXT_SIZE); } catch { /* jsdom */ } });
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = null; container = null;
});

describe('the collapsed header row names the door', () => {
  it('shows the site name beside the way back, when one is given', async () => {
    const el = await mount(TextSizeEscapeHatch, { collapsed: true, onShowHeader: () => {}, siteName: 'The Love Corner' });
    const name = el.querySelector('[data-testid="collapsed-site-name"]');
    expect(name, 'the name must render on the collapsed row').toBeTruthy();
    expect(name.textContent).toBe('The Love Corner');
    // The way back keeps rendering beside it — the name never displaces it.
    expect(el.querySelector('[data-testid="show-full-header"]')).toBeTruthy();
  });

  it('renders no empty name element when none is given (the row reads as before)', async () => {
    const el = await mount(TextSizeEscapeHatch, { collapsed: true, onShowHeader: () => {}, siteName: '   ' });
    expect(el.querySelector('[data-testid="collapsed-site-name"]')).toBeNull();
  });

  it('is absent when the header is not collapsed (the wordmark is on screen then)', async () => {
    const el = await mount(TextSizeEscapeHatch, { collapsed: false, siteName: 'PoeTech' });
    expect(el.querySelector('[data-testid="collapsed-site-name"]')).toBeNull();
  });

  it('the shell passes the same name the header wordmark shows', () => {
    const shell = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    // The row carries the header's own lockup (Darrell 2026-09-24): the same
    // name the header shows at tablet width, and the same tagline beneath it.
    expect(shell).toMatch(/<TextSizeEscapeHatch [^\n]*siteName=\{churchBrand \? 'The Love Corner' : 'Family Operating Systems'\}/);
    expect(shell).toMatch(/\{churchBrand \? 'The Love Corner' : 'Family Operating Systems'\}<\/span>/);
    expect(shell).toMatch(/<TextSizeEscapeHatch [^\n]*siteTagline=\{churchBrand \? 'The Church of the Living God' : 'PoeTech · Life, Soul & Money'\}/);
    expect(shell).toMatch(/\{churchBrand \? 'The Church of the Living God' : 'PoeTech · Life, Soul & Money'\}/);
  });

  it('carries the tagline under the name, and draws no empty tagline', async () => {
    const el = await mount(TextSizeEscapeHatch, { collapsed: true, onShowHeader: () => {}, siteName: 'Family Operating Systems', siteTagline: 'PoeTech · Life, Soul & Money' });
    expect(el.querySelector('[data-testid="collapsed-site-name"]').textContent).toBe('Family Operating Systems');
    expect(el.querySelector('[data-testid="collapsed-site-tagline"]').textContent).toBe('PoeTech · Life, Soul & Money');
    // The name wraps; it is never cut off mid-word (the 2026-07-06 rule).
    expect(el.querySelector('[data-testid="collapsed-site-name"]').className).not.toMatch(/truncate/);
    const bare = await mount(TextSizeEscapeHatch, { collapsed: true, onShowHeader: () => {}, siteName: 'PoeTech' });
    expect(bare.querySelector('[data-testid="collapsed-site-tagline"]')).toBeNull();
  });
});

describe('on a phone the text sizes are one dropdown in the corner', () => {
  // Darrell 2026-09-24: "can the text sizes fit in the top right corner of
  // smaller screen or a drop down with all options?" / "Keeping the screen
  // real-estate as clear as possible?"
  it('offers all five sizes in one dropdown, and choosing one sets the size', async () => {
    const el = await mount(TextSizeEscapeHatch, { collapsed: true, onShowHeader: () => {}, siteName: 'Family Operating Systems', siteTagline: 'PoeTech · Life, Soul & Money' });
    const sel = el.querySelector('[data-testid="text-size-compact"]');
    expect(sel, 'the compact dropdown renders on the collapsed row').toBeTruthy();
    expect([...sel.options].map((o) => o.textContent)).toEqual(['A', 'A+', 'A++', 'A+++', 'A44']);
    // Phones get the dropdown; the full button row is kept for 640 px and up.
    expect(sel.closest('.sm\\:hidden')).toBeTruthy();
    await act(async () => {
      sel.value = 'larger';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    });
    expect(localStorage.getItem('poe-text-size')).toBe('larger');
  });
});

describe('the Messages tab carries the unread count', () => {
  it('draws NOTHING until it has heard a real count', async () => {
    const el = await mount(DmUnreadBadge, {});
    expect(el.querySelector('[data-testid="dm-unread-badge"]')).toBeNull();
  });

  it('shows the count the app-wide watcher announced, and clears when it drops to zero', async () => {
    const el = await mount(DmUnreadBadge, {});
    await act(async () => {
      window.dispatchEvent(new CustomEvent(DM_UNREAD_EVENT, { detail: { prev: 0, next: 2, visible: true } }));
    });
    const badge = el.querySelector('[data-testid="dm-unread-badge"]');
    expect(badge).toBeTruthy();
    expect(badge.textContent).toBe('2');
    expect(badge.getAttribute('aria-label')).toBe('2 unread messages');
    await act(async () => {
      window.dispatchEvent(new CustomEvent(DM_UNREAD_EVENT, { detail: { prev: 2, next: 0, visible: true } }));
    });
    expect(el.querySelector('[data-testid="dm-unread-badge"]')).toBeNull();
  });

  it('caps the display at 99+ and ignores a malformed count', async () => {
    const el = await mount(DmUnreadBadge, {});
    await act(async () => {
      window.dispatchEvent(new CustomEvent(DM_UNREAD_EVENT, { detail: { next: 250 } }));
    });
    expect(el.querySelector('[data-testid="dm-unread-badge"]').textContent).toBe('99+');
    await act(async () => {
      window.dispatchEvent(new CustomEvent(DM_UNREAD_EVENT, { detail: { next: 'many' } }));
    });
    expect(el.querySelector('[data-testid="dm-unread-badge"]')).toBeNull();
  });

  it('is mounted on the Messages nav entry of the shell', () => {
    const shell = readFileSync(join(HERE, '..', 'poe-financial-mvp-v28.jsx'), 'utf8');
    expect(shell).toMatch(/\['messages', <><UiIcon name="chat" \/> Messages<DmUnreadBadge \/><\/>\]/);
  });
});
