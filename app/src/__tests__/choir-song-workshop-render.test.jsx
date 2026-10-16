// =============================================================================
// ChoirSongWorkshop — live render proof (Verification Doctrine: observe the real
// surface, not just the pure logic). Mounts the ACTUAL component in jsdom, lets
// its subscribe effects run, and reads the DOM it produces. Network-free: the
// supabase client is mocked (no session, empty tables), so no real auth/cloud
// call happens. Proves the surface mounts (no white screen), shows the empty
// state + both add modes, and that the list-paste preview is wired live.
// =============================================================================
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/supabase.js', () => {
  const query = {
    select: () => query,
    order: () => Promise.resolve({ data: [], error: null }),
    then: (res) => Promise.resolve({ data: [], error: null }).then(res),
  };
  const supabase = {
    auth: { getSession: () => Promise.resolve({ data: { session: null } }) },
    from: () => query,
    channel: () => ({ on: () => ({ subscribe: () => ({}) }) }),
    removeChannel: () => {},
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
  return { default: supabase, supabase };
});

import ChoirSongWorkshop from '../components/ChoirSongWorkshop.jsx';

let container, root;
async function mount(props) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(ChoirSongWorkshop, props));
  });
}

beforeEach(() => { try { localStorage.clear(); } catch { /* noop */ } });
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
});

describe('ChoirSongWorkshop renders the collaborative song pool', () => {
  it('empty state: invites the first song and offers both add modes — no white screen', async () => {
    await mount({ access: { canSee: true, canEdit: false } });
    const text = container.textContent;
    expect(text).toMatch(/No songs yet/i);
    expect(text).toMatch(/Add a song/i);
    expect(text).toMatch(/Paste a list/i);
    // A non-director sees that the director chooses finals.
    expect(text).toMatch(/director chooses the finals/i);
  });

  it('a director sees the "you choose the finals" framing', async () => {
    await mount({ access: { canSee: true, canEdit: true } });
    expect(container.textContent).toMatch(/you choose the finals/i);
  });

  it('"Paste a list" opens a textarea and previews the live parsed count', async () => {
    await mount({ access: { canSee: true, canEdit: false } });
    const listBtn = [...container.querySelectorAll('button')].find((b) => /Paste a list/i.test(b.textContent));
    await act(async () => { listBtn.click(); });
    const ta = container.querySelector('textarea');
    expect(ta).toBeTruthy();
    const setVal = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    await act(async () => {
      setVal.call(ta, 'Total Praise - https://youtu.be/aaaaaaaaaaa\nWay Maker');
      ta.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    expect(container.textContent).toMatch(/2 songs detected/i);
  });

  // DR-1061. Darrell: "Does pasting a link with a list of songs add them to the
  // app like the others that work comprehensively?" — it did not, and the box
  // said "1 song detected" while one bogus row went in. This is that case,
  // proven on the real surface rather than only in the classifier.
  it('a pasted LIST link is not counted as a song, and Add is refused until it is read', async () => {
    await mount({ access: { canSee: true, canEdit: true } });
    const listBtn = [...container.querySelectorAll('button')].find((b) => /Paste a list/i.test(b.textContent));
    await act(async () => { listBtn.click(); });
    const ta = container.querySelector('textarea');
    const setVal = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    await act(async () => {
      setVal.call(ta, 'https://docs.google.com/spreadsheets/d/1pyARuAxQr_y75P1acl-RaKoDYjXgjeg5IIDyD4fmakA/edit');
      ta.dispatchEvent(new window.Event('input', { bubbles: true }));
    });
    const text = container.textContent;
    expect(text, 'a link to a list is still being counted as a song').not.toMatch(/1 song detected/i);
    expect(text).toMatch(/a link to a list, not a song/i);
    expect(text).toMatch(/Google Sheet/i);
    // The add button cannot fire while the box holds an address rather than songs.
    const add = [...container.querySelectorAll('button')].find((b) => /Add .*to pool/i.test(b.textContent));
    expect(add.disabled, 'the bogus one-row insert is still reachable').toBe(true);
    // ...and the offer to go and read it is right there.
    expect([...container.querySelectorAll('button')].some((b) => /Read the list/i.test(b.textContent))).toBe(true);
  });

  it('the file road is offered beside the paste box, for when a site will not let us in', async () => {
    await mount({ access: { canSee: true, canEdit: true } });
    const listBtn = [...container.querySelectorAll('button')].find((b) => /Paste a list/i.test(b.textContent));
    await act(async () => { listBtn.click(); });
    expect(container.textContent).toMatch(/Upload a list/i);
    expect(container.textContent).toMatch(/Excel, CSV, a PDF, or a photo/i);
    const file = container.querySelector('input[type="file"]');
    expect(file).toBeTruthy();
    expect(file.getAttribute('accept')).toMatch(/xlsx/);
  });
});
