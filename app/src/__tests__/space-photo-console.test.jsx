// @vitest-environment jsdom
// =============================================================================
// A picture is opened, and removing one takes two taps (DR-1059)
// =============================================================================
// Darrell, 2026-10-15, on Observation → Church Spaces: "the images need to be
// able to be like Poe Properties Apps pictures console... We need a better
// flow... pictures can be deleted easily not doing what we expected."
//
// TWO FAULTS, and both readings of that sentence land on the same cure, so no
// guess was needed:
//
//   1. Every thumbnail carried a bare 16px "×" gated on
//      `window.confirm('Remove this photo?')`. This repo already learned that
//      these dialogs are unreliable in the INSTALLED standalone app —
//      no-prompt-guard exists because window.prompt() silently no-ops there and
//      a button Darrell pushed "did nothing". A suppressed confirm returns
//      falsy, the handler returns, and the delete neither deletes nor explains.
//      And where the dialog DOES appear, a fingernail-sized × on a 48px thumb
//      is a destructive control one stray tap away.
//   2. There was no console, only a strip: a thumbnail did nothing when tapped,
//      and the cover was whichever file happened to be picked first, forever.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import SpacePhotoConsole from '../components/SpacePhotoConsole.jsx';
import {
  photosOf, coverOf, addPhotos, removePhoto, setCover, movePhoto, positionOf, removeConfirmText,
} from '../lib/space-photos.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const OBS = readFileSync(join(HERE, '..', 'components', 'ChurchObservation.jsx'), 'utf8');

const space = (n = 3) => ({
  id: 'sp-main',
  name: 'Main Worship Area',
  photos: Array.from({ length: n }, (_, i) => ({ id: `p${i}`, src: `data:image/png;base64,x${i}`, at: '2026-10-15T23:00:00Z' })),
});

let container; let root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  global.IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

describe('the browser dialog is gone from the destructive paths', () => {
  it('PROVEN-TO-CATCH: neither the photo nor the space delete gates on window.confirm', () => {
    // The two exact lines that shipped.
    expect(OBS.includes("window.confirm('Remove this photo?')"), 'the photo delete is back on a dialog').toBe(false);
    expect(OBS.includes("window.confirm('Delete this space from the board?')"), 'the space delete is back on a dialog').toBe(false);
    // WHOLE FILE, comments stripped. Scoping this to the two lines I had
    // edited would have missed the camera removal entirely — which is exactly
    // what happened: this assertion found a FOURTH window.confirm on this one
    // surface that I had not read. A check scoped to its author's edits can
    // only confirm what its author already knew.
    const code = OBS.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
    expect(code.includes('window.confirm'), 'a browser dialog is back in this surface').toBe(false);
    expect(OBS).toMatch(/Remove it/);        // the camera's inline second tap
  });

  it('the one-tap × is gone from the thumbnails', () => {
    expect(OBS.includes('aria-label="Remove photo"'), 'the bare × delete badge is back').toBe(false);
    expect(OBS).toMatch(/<SpacePhotoConsole/);
  });

  it('the space delete asks inline, naming the space and its photo count', () => {
    expect(OBS).toMatch(/Delete for good/);
    expect(OBS).toMatch(/Keep it/);
    expect(OBS).toMatch(/\{space\.name\}/);
  });
});

describe('removing a photo takes two taps, and the first one destroys nothing', () => {
  const render = (n, onRemovePhoto) => act(() => root.render(createElement(SpacePhotoConsole, {
    space: space(n), onSetCover: () => {}, onMove: () => {}, onRemovePhoto,
  })));
  const byLabel = (re) => [...document.querySelectorAll('button')]
    .find((b) => re.test(b.getAttribute('aria-label') || b.textContent || ''));
  const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

  it('a thumbnail OPENS the picture — the gesture that used to do nothing', () => {
    render(3, () => {});
    const thumb = byLabel(/Open photo 2 of 3/);
    expect(thumb, 'the thumbnails are not openable').toBeTruthy();
    click(thumb);
    expect(document.body.textContent).toMatch(/Photo 2 of 3/);
  });

  it('the FIRST Remove tap only asks — nothing is removed', () => {
    const onRemovePhoto = vi.fn();
    render(3, onRemovePhoto);
    click(byLabel(/Open photo 1 of 3/));
    click(byLabel(/^Remove$/));
    expect(onRemovePhoto, 'one tap removed a photo').not.toHaveBeenCalled();
    // And it says what it is about to do, truthfully for this store.
    expect(document.body.textContent).toMatch(/for good/);
    expect(document.body.textContent).toMatch(/no copy to restore/);
  });

  it('"Keep it" cancels and removes nothing', () => {
    const onRemovePhoto = vi.fn();
    render(3, onRemovePhoto);
    click(byLabel(/Open photo 1 of 3/));
    click(byLabel(/^Remove$/));
    click(byLabel(/Keep it/));
    expect(onRemovePhoto).not.toHaveBeenCalled();
  });

  it('only the SECOND tap removes, and it names the photo it removed', () => {
    const onRemovePhoto = vi.fn();
    render(3, onRemovePhoto);
    click(byLabel(/Open photo 2 of 3/));
    click(byLabel(/^Remove$/));
    click(byLabel(/Remove for good/));
    expect(onRemovePhoto).toHaveBeenCalledWith('sp-main', 'p1');
  });

  it('the cover cannot be re-set to itself, and the ends do not wrap', () => {
    render(3, () => {});
    click(byLabel(/Open photo 1 of 3/));
    expect(byLabel(/Is the cover/).disabled, 'the cover offers to become the cover').toBe(true);
    expect(byLabel(/Move this photo one place earlier/).disabled).toBe(true);
    expect(byLabel(/Move this photo one place later/).disabled).toBe(false);
  });
});

describe('the arithmetic (pure)', () => {
  it('setCover moves a photo to the front and nothing else moves', () => {
    const s = setCover(space(4), 'p2');
    expect(photosOf(s).map((p) => p.id)).toEqual(['p2', 'p0', 'p1', 'p3']);
    expect(coverOf(s).id).toBe('p2');
  });

  it('setCover on the cover, or on a photo that is not there, changes nothing', () => {
    const s = space(3);
    expect(setCover(s, 'p0')).toBe(s);
    expect(setCover(s, 'nope')).toBe(s);
  });

  it('movePhoto swaps one place, and REFUSES to wrap at either end', () => {
    expect(photosOf(movePhoto(space(3), 'p1', 'forward')).map((p) => p.id)).toEqual(['p1', 'p0', 'p2']);
    expect(photosOf(movePhoto(space(3), 'p1', 'back')).map((p) => p.id)).toEqual(['p0', 'p2', 'p1']);
    const s = space(3);
    expect(movePhoto(s, 'p0', 'forward'), 'the first photo wrapped to the end').toBe(s);
    expect(movePhoto(s, 'p2', 'back'), 'the last photo wrapped to the front').toBe(s);
    expect(movePhoto(s, 'p1', 'sideways')).toBe(s);
  });

  it('removePhoto takes exactly one, and a miss changes nothing', () => {
    expect(photosOf(removePhoto(space(3), 'p1')).map((p) => p.id)).toEqual(['p0', 'p2']);
    const s = space(3);
    expect(removePhoto(s, 'nope')).toBe(s);
  });

  it('a legacy single-photo record still displays, and is migrated on the first write', () => {
    // The first build stored `photo` as a bare string. Nothing a steward
    // uploaded may be orphaned by this change.
    const legacy = { id: 'sp-x', name: 'Room 1', photo: 'data:image/png;base64,old', updatedAt: '2026-01-01T00:00:00Z' };
    expect(photosOf(legacy)).toHaveLength(1);
    expect(photosOf(legacy)[0].src).toBe('data:image/png;base64,old');
    const after = addPhotos(legacy, ['data:image/png;base64,new'], '2026-10-15T23:00:00Z');
    expect(photosOf(after)).toHaveLength(2);
    // The legacy field MUST be dropped, or it keeps winning in photosOf.
    expect('photo' in after, 'the legacy photo field survived a write').toBe(false);
  });

  it('positionOf answers the console’s "3 of 12" and who the cover is', () => {
    expect(positionOf(space(12), 'p2')).toEqual({ index: 2, position: 3, total: 12, isCover: false });
    expect(positionOf(space(12), 'p0').isCover).toBe(true);
    expect(positionOf(space(3), 'nope')).toBe(null);
  });
});

describe('the confirm sentence is TRUE for this store', () => {
  it('it never promises a restore, because there is no second copy', () => {
    const text = removeConfirmText(space(3), 'p1');
    expect(text).toMatch(/no copy to restore/);
    // property-photo-edit.js can honestly say a photo "can be brought back" —
    // it moves to a Trash folder on the NAS. These are data URLs on one
    // device, so copying that sentence here would be a comfortable lie.
    expect(text).not.toMatch(/brought back|can be restored|Trash/i);
  });

  it('it names the space and which photo', () => {
    expect(removeConfirmText(space(3), 'p1')).toMatch(/photo 2 of 3 from Main Worship Area/);
  });

  it('removing the cover says what becomes the cover next', () => {
    expect(removeConfirmText(space(3), 'p0')).toMatch(/the cover photo/);
    expect(removeConfirmText(space(3), 'p0')).toMatch(/next picture becomes the cover/);
    // ...and does NOT say that when it is the only one left.
    expect(removeConfirmText(space(1), 'p0')).not.toMatch(/next picture/);
  });

  it('a photo already gone says so instead of pretending', () => {
    expect(removeConfirmText(space(3), 'nope')).toMatch(/no longer on this space/);
  });
});
