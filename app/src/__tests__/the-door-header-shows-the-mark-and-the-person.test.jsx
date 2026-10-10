// @vitest-environment jsdom
// =============================================================================
// The Poe Properties door header shows the MARK and the PERSON (DR-0896)
// =============================================================================
// Darrell, 2026-10-10, on the Poe Properties app:
//
//   "Picture and users account information like PoeTech... should allow a photo
//    to be represented by etc... make sense? Also the logo should be showing
//    inside the Header... and other low hanging fruit..."
//
// Two things the door was missing that every other PoeTech face already had.
//
// THE MARK. The door's brand bar was a text wordmark and nothing else, while
// the mark it installs on the phone's home screen — the 2026-08-28 "two P's"
// glyph with the properties-green ring — sat in public/ unused by the app
// itself. Nothing was drawn for this fix. `POE_PROPERTIES.brand.mark` points at
// the SAME file that is already an entry in `icons` of
// public/manifest-properties.webmanifest, and the first test below reads that
// manifest off disk to hold the two together: rename or mistype the asset and
// CI fails rather than a phone showing one glyph and the header another.
//
// THE PERSON. PoeTech's HeaderAuthButton has carried a person's picture and
// name in the header since 2026-09-09 (DR-0342) — "All apps users profile shows
// and has login or out under it... so it is looked at... or seen... And upload a
// photo spot" — and "for all apps" never reached this door. The chip here reads
// the SAME real row (`profiles.photo_thumb`, migration 0186) through the SAME
// loader and renders it with the SAME ProfileAvatar. The face is the upload
// spot: tapping it opens My profile.
//
// WHAT IS NOT PAINTED (P15 / DR-0061). There is no stand-in face anywhere. A
// person with a picture gets the picture; a person without one gets the initials
// of the name their account actually carries, plus a visible "+ photo"
// invitation, so the gap is SAID rather than faked; a stranger gets nothing at
// all. A profile read that fails degrades to the initials path, never a throw
// into the header.
//
// WHAT THIS DELIBERATELY DOES NOT CHANGE. HeaderAuthButton itself is not
// mounted here, because its Log out calls the global signOut() and would tear
// down this door's two-tier sign-out (leave this door / leave everywhere). The
// last test is the regression guard on that, and on the header's own sticky
// auto-hide chrome, which this change does not touch.
//
// Proven on the real component in jsdom, against a real manifest on disk.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// What the stubbed cloud answers. Set per test, read by the mock below.
const state = vi.hoisted(() => ({ session: null, profileRow: null, rowError: null }));

vi.mock('../lib/supabase.js', () => {
  // A query stub that answers any chain. `profiles` is the one table this test
  // cares about (loadMyProfile ends in .maybeSingle()); every other lib in the
  // door's chrome asks the client on mount and gets an empty, error-free answer.
  function queryStub(table) {
    const q = {};
    const self = () => q;
    for (const m of ['select', 'eq', 'neq', 'in', 'order', 'limit', 'range', 'gte', 'lte', 'is', 'not', 'upsert', 'insert', 'update', 'delete', 'match']) q[m] = self;
    q.maybeSingle = async () => (table === 'profiles'
      ? { data: state.profileRow, error: state.rowError }
      : { data: null, error: null });
    q.single = q.maybeSingle;
    q.then = (res) => Promise.resolve({ data: [], error: null }).then(res);
    return q;
  }
  const client = {
    auth: {
      getSession: async () => ({ data: { session: state.session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({}),
    },
    from: (table) => queryStub(table),
    rpc: async () => ({ data: null, error: null }),
  };
  return {
    supabase: client,
    default: client,
    onAuthChange: (cb) => { cb(state.session); return () => {}; },
    phoneLoginEmail: () => '',
    normalizePhone: (p) => String(p || '').replace(/\D+/g, ''),
    readPersistedSession: () => state.session,
    resolveInitialSession: (emit, io) => { emit(io.readStored ? io.readStored() : null); },
    signOut: async () => ({}),
  };
});
// The module under the chrome, and the profile editor, are not what this test is
// about — each has its own suite. The door's job here is to OPEN the editor.
vi.mock('../modules/properties/PropertiesApp.jsx', () => ({ default: () => createElement('div', { 'data-testid': 'properties-app' }, 'module') }));
vi.mock('../components/MyProfile.jsx', () => ({ default: ({ initialName }) => createElement('div', { 'data-testid': 'my-profile' }, `editor for ${initialName}`) }));

import PropertiesDoor from '../components/PropertiesDoor.jsx';
import { POE_PROPERTIES } from '../modules/properties/config.js';

// vitest runs from app/, the same base the other on-disk suites use.
const PUBLIC_DIR = join(process.cwd(), 'public');
const SESSION = { user: { id: 'u-marcus', email: 'marcus.webb@example.com' } };
const PHOTO = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
async function mount() {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => { root = createRoot(container); root.render(createElement(PropertiesDoor)); });
  await act(async () => { for (let i = 0; i < 6; i += 1) await Promise.resolve(); });
  return container;
}
const click = (el) => act(async () => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true })); });

beforeEach(() => { state.session = null; state.profileRow = null; state.rowError = null; });
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  container?.remove();
  root = null;
  try { window.localStorage.clear(); } catch { /* noop */ }
});

describe('the logo shows inside the header', () => {
  // PROVEN-TO-CATCH (DR-0076 §3): this does not assert "a mark exists" — it
  // asserts the header's mark IS the installed mark. Point brand.mark at a file
  // the manifest does not install, or at nothing on disk, and this fails.
  it('brand.mark is a real file AND an icon the door\'s own manifest installs', () => {
    const mark = POE_PROPERTIES.brand.mark;
    expect(mark, 'the door config names a mark').toBeTruthy();
    expect(mark.startsWith('/'), 'the mark is an absolute served path').toBe(true);

    expect(existsSync(join(PUBLIC_DIR, mark.slice(1))), `${mark} exists in app/public`).toBe(true);

    const manifest = JSON.parse(readFileSync(join(PUBLIC_DIR, 'manifest-properties.webmanifest'), 'utf8'));
    const installed = (manifest.icons || []).map((i) => i.src);
    expect(installed, 'the header mark is one of the icons the manifest installs').toContain(mark);
  });

  it('the header renders that mark beside the wordmark, decoratively', async () => {
    const el = await mount();
    const header = el.querySelector('[data-testid="properties-door-header"]');
    const mark = header.querySelector('[data-testid="properties-door-mark"]');
    expect(mark, 'the mark is inside the header, not elsewhere on the page').toBeTruthy();
    expect(mark.getAttribute('src')).toBe(POE_PROPERTIES.brand.mark);
    // It duplicates the wordmark sitting next to it, so it must not be read out.
    expect(mark.getAttribute('alt')).toBe('');
    expect(mark.getAttribute('aria-hidden')).toBe('true');
    // A fixed box: the sticky bar's height cannot jump while the glyph loads.
    expect(mark.getAttribute('width')).toBe('28');
    expect(mark.getAttribute('height')).toBe('28');
    expect(el.querySelector('h1').textContent).toBe('Poe Properties');
  });

  it('the mark lives in the bar that never hides, so the hideaway keeps it', async () => {
    const el = await mount();
    const chevron = el.querySelector('[data-testid="properties-door-hideaway"]');
    await click(chevron);
    expect(chevron.getAttribute('aria-expanded')).toBe('false');
    expect(el.querySelector('[data-testid="properties-door-comfort"]'), 'the top space tucked away').toBeNull();
    expect(el.querySelector('[data-testid="properties-door-mark"]'), 'the mark stayed').toBeTruthy();
  });
});

describe('a person is represented by their photo', () => {
  it('a stranger gets no face at all — nothing is painted for someone signed out', async () => {
    const el = await mount();
    expect(el.querySelector('[data-testid="properties-door-account"]')).toBeNull();
    expect(el.querySelector('[data-testid="properties-door-mark"]'), 'the mark is not account-gated').toBeTruthy();
  });

  it('the real photo_thumb from the profiles row IS the picture in the header', async () => {
    state.session = SESSION;
    state.profileRow = { user_id: 'u-marcus', display_name: 'Marcus Webb', photo_thumb: PHOTO };
    const el = await mount();
    const chip = el.querySelector('[data-testid="properties-door-account"]');
    expect(chip, 'the account chip renders when signed in').toBeTruthy();
    const img = chip.querySelector('img');
    expect(img, 'the picture is an image, not initials').toBeTruthy();
    // The displayed picture is the stored row, byte for byte — not a copy, not
    // a cached boot value, not a stand-in.
    expect(img.getAttribute('src')).toBe(PHOTO);
    // The chosen profile name wins over the sign-in handle.
    expect(chip.textContent).toContain('Marcus Webb');
    expect(chip.textContent).not.toMatch(/\+ photo/);
    expect(chip.getAttribute('aria-label')).toMatch(/Marcus Webb — open my profile/);
  });

  it('no picture yet: real initials and a plain invitation, never a fake face', async () => {
    state.session = SESSION;
    state.profileRow = { user_id: 'u-marcus', display_name: 'Marcus Webb', photo_thumb: null };
    const el = await mount();
    const chip = el.querySelector('[data-testid="properties-door-account"]');
    expect(chip.querySelector('img'), 'no image is invented').toBeNull();
    expect(chip.textContent).toContain('MW');
    // The gap is SAID, and the label says what tapping will do about it.
    expect(chip.textContent).toMatch(/\+ photo/);
    expect(chip.getAttribute('aria-label')).toMatch(/add your picture/i);
    expect(chip.getAttribute('title')).toBe('Add your picture');
  });

  it('no profile row at all: the sign-in\'s own handle names the person', async () => {
    state.session = SESSION;
    state.profileRow = null;
    const el = await mount();
    const chip = el.querySelector('[data-testid="properties-door-account"]');
    // preferredName falls back to the email's local part, which is a real value
    // from the real session — so the chip is never "Member" while an account
    // with a known handle is signed in.
    expect(chip.textContent).toContain('marcus.webb');
    expect(chip.querySelector('img')).toBeNull();
  });

  it('a profile read that FAILS degrades to initials — it never throws into the header', async () => {
    state.session = SESSION;
    state.rowError = { message: 'network is gone' };
    const el = await mount();
    const chip = el.querySelector('[data-testid="properties-door-account"]');
    expect(chip, 'the header still rendered').toBeTruthy();
    expect(chip.querySelector('img')).toBeNull();
    expect(el.querySelector('h1').textContent).toBe('Poe Properties');
  });

  it('the face IS the upload spot — tapping it opens My profile', async () => {
    state.session = SESSION;
    state.profileRow = { user_id: 'u-marcus', display_name: 'Marcus Webb', photo_thumb: null };
    const el = await mount();
    const chip = el.querySelector('[data-testid="properties-door-account"]');
    expect(chip.getAttribute('aria-haspopup')).toBe('dialog');
    expect(chip.getAttribute('aria-expanded')).toBe('false');
    expect(document.querySelector('[data-testid="my-profile"]')).toBeNull();
    await click(chip);
    expect(chip.getAttribute('aria-expanded')).toBe('true');
    // Modal portals to <body>, so this is queried on the document.
    const editor = document.querySelector('[data-testid="my-profile"]');
    expect(editor, 'the profile editor opened over the page').toBeTruthy();
    expect(editor.textContent).toContain('Marcus Webb');
  });
});

describe('what this change did NOT touch', () => {
  it('the two-tier sign-out keeps its door semantics, and PoeTech\'s global one is not imported', async () => {
    state.session = SESSION;
    state.profileRow = { user_id: 'u-marcus', display_name: 'Marcus Webb', photo_thumb: PHOTO };
    const el = await mount();
    const texts = Array.from(el.querySelectorAll('button')).map((b) => b.textContent || '');
    // Leave THIS door, and leave everywhere, both still offered and distinct.
    expect(texts.some((t) => /Sign out of Poe Properties/.test(t))).toBe(true);
    expect(texts.some((t) => /^everywhere$/.test(t.trim()))).toBe(true);
    // HeaderAuthButton's bare "Log out" box is deliberately absent: it calls the
    // global signOut() and would collapse the two tiers into one.
    expect(texts.some((t) => /^Log out$/.test(t.trim()))).toBe(false);
    expect(el.textContent).not.toMatch(/Sign out of PoeTech/);
  });

  it('the header is still the sticky, auto-hiding, size-safe bar it was', async () => {
    state.session = SESSION;
    const el = await mount();
    const header = el.querySelector('[data-testid="properties-door-header"]');
    expect(header.className).toMatch(/sticky/);
    expect(header.className).toMatch(/ts-safe-sticky/);
    expect(header.className).toMatch(/transition-transform/);
    expect(header.className).toMatch(/translate-y-0/);
  });
});
