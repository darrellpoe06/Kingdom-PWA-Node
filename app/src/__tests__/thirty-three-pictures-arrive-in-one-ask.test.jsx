// @vitest-environment jsdom
// =============================================================================
// THIRTY-THREE PICTURES ARRIVE IN ONE ASK, AND A TAP LEAVES NO FRAME (DR-1454)
// =============================================================================
// Darrell, 2026-11-12, on work order #13 (33 pictures) from the Teams tab:
// "The color keeps changing to another color without me doing anything...
// I'm populating slowly... information..."
//
// Two things were true. Every tile asked for its own thumbnail, one request
// each, three at a time, so the grid filled one square at a time over 33
// round trips. And the row's toggle painted its orange focus frame on a TAP
// (focus:, not focus-visible:), which stayed around the whole card until the
// next tap landed somewhere else — a color that changed on its own.
//
// PROVEN TO CATCH: drop the warm-up from PictureStrip and "one ask" fails;
// let warmThumbs skip the pending registration and "a tile that comes on
// screen meanwhile" fails with a second ask; put `focus:outline` back on the
// toggle and the ring case fails.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { createElement, act } from 'react';
import { createRoot } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import SharpPicture, { warmThumbs, thumbOnce, _forgetSharpened } from '../modules/properties/SharpPicture.jsx';
import { PictureStrip } from '../components/WorkOrderPictures.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const here = dirname(fileURLToPath(import.meta.url));
const T = (id) => `data:image/jpeg;base64,T${id}`;
const ids33 = Array.from({ length: 33 }, (_, i) => `p${i + 1}`);

let container;
let root;
async function flush() {
  for (let i = 0; i < 8; i += 1)
    await act(async () => {
      await Promise.resolve();
    });
}
async function mount(el) {
  container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    root = createRoot(container);
    root.render(el);
  });
  await flush();
}
beforeEach(() => {
  _forgetSharpened();
  delete globalThis.IntersectionObserver;
});
afterEach(() => {
  if (root) act(() => root.unmount());
  if (container) container.remove();
  root = container = null;
  _forgetSharpened();
});

describe('warmThumbs: a set of ids, one ask per batch', () => {
  it('asks in chunks of the batch size and seeds the cache every tile reads', async () => {
    const asks = [];
    const loadMany = async (ids) => {
      asks.push(ids);
      return Object.fromEntries(ids.map((id) => [id, T(id)]));
    };
    const got = await warmThumbs(ids33, loadMany, 12);
    expect(asks.map((a) => a.length)).toEqual([12, 12, 9]);
    expect(Object.keys(got).length).toBe(33);
    const perTile = vi.fn(async (id) => T(id));
    expect(await thumbOnce('p7', perTile)).toBe(T('p7'));
    expect(perTile).not.toHaveBeenCalled();
  });
  it('a tile that asks while the batch is in flight waits for it instead of asking again; an unanswered id reads as no thumbnail', async () => {
    let release;
    const loadMany = vi.fn(
      () =>
        new Promise((r) => {
          release = r;
        })
    );
    const warming = warmThumbs(['a', 'b'], loadMany, 12);
    const perTile = vi.fn(async (id) => T(id));
    const waiting = thumbOnce('a', perTile);
    await Promise.resolve();
    release({ a: T('a') }); // b is not answered: it has no thumbnail
    await warming;
    expect(await waiting).toBe(T('a'));
    expect(perTile).not.toHaveBeenCalled();
    expect(await thumbOnce('b', perTile)).toBeNull();
    expect(perTile).not.toHaveBeenCalled();
    expect(loadMany).toHaveBeenCalledTimes(1);
    expect(await warmThumbs(['a', 'b'], loadMany, 12)).toEqual({});
    expect(loadMany).toHaveBeenCalledTimes(1);
    expect(await warmThumbs(['z'], null)).toEqual({});
  });
});

describe('PictureStrip: the strip warms every thumbnail in one ask', () => {
  it('calls loadThumbs once with all the ids; the per-tile loader is never needed; every tile draws', async () => {
    const photos = ids33.map((id) => ({ id, caption: `Qualitative ${id}` }));
    const many = vi.fn(async (ids) => Object.fromEntries(ids.map((id) => [id, T(id)])));
    const one = vi.fn(async (id) => T(id));
    await mount(createElement(PictureStrip, { photos, loadThumb: one, loadThumbs: many, label: 'On this note' }));
    await flush();
    expect(many).toHaveBeenCalledTimes(3);
    expect(many.mock.calls.flatMap((c) => c[0]).sort()).toEqual([...ids33].sort());
    expect(one).not.toHaveBeenCalled();
    expect(container.querySelectorAll('[data-testid="sharp-picture"]').length).toBe(33);
    expect(container.querySelectorAll('[data-testid="sharp-picture-waiting"]').length).toBe(0);
  });
  it('without a batch loader the strip still draws through the per-tile loader (the older road)', async () => {
    const one = vi.fn(async (id) => T(id));
    await mount(createElement(PictureStrip, { photos: [{ id: 'q1' }, { id: 'q2' }], loadThumb: one }));
    await flush();
    expect(one).toHaveBeenCalledTimes(2);
    expect(container.querySelectorAll('[data-testid="sharp-picture"]').length).toBe(2);
  });
  it('a single tile still holds its place and asks once', async () => {
    const one = vi.fn(async (id) => T(id));
    await mount(createElement(SharpPicture, { photo: { id: 'r1' }, loadThumb: one, alt: 'Fan' }));
    await flush();
    expect(one).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-testid="sharp-picture"]').getAttribute('src')).toBe(T('r1'));
  });
});

describe('the row toggle: a ring for the keyboard, no frame after a tap', () => {
  it('the toggle uses focus-visible and never the plain focus ring', () => {
    const src = readFileSync(join(here, '..', 'components', 'WorkOrderTriage.jsx'), 'utf8');
    const toggle = src.split('\n').find((l) => l.includes('onClick={onToggle}') && l.includes('aria-expanded'));
    expect(toggle).toBeTruthy();
    expect(toggle).toContain('${TAP_RING}');
    expect(toggle).not.toContain('${FOCUS_RING}');
    const ring = src.split('\n').find((l) => l.startsWith('const TAP_RING'));
    expect(ring).toContain('focus-visible:outline');
    expect(ring).toContain('focus:outline-none');
  });
});
