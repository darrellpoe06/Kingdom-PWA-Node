// @vitest-environment jsdom
// =============================================================================
// A family member adds a photo to an address, and takes one off it (DR-0758)
// =============================================================================
// Christina 2026-10-06, relayed by Darrell: "I would like to be able to delete
// and add photos to the different addresses in Real Estate."
//
// What these pin:
//   * the pure core — what counts as a photo, where it goes, what the strip
//     shows once photos are added and others taken off, and a plain sentence for
//     EVERY refusal (no silent failure, no blank);
//   * the two controls on the real surface — the Add control sends each pick and
//     says what happened per file, and Remove CONFIRMS by name first;
//   * DR-0691 — the confirm copy promises "Cancel keeps the photo exactly where
//     it is", so a test presses Cancel and checks it stayed. PROVEN-TO-CATCH:
//     making the button ignore the answer fails this file (verified by hand on
//     2026-10-06 before it was written down).
//   * the truth of the removal — the words say "moved to Trash" / "the chat
//     message and the original were not touched", which is what the NAS does
//     (infra/nas-property-photos/photo_server.py: os.replace into <dest>/.trash/,
//     and an id appended to <dest>/.hidden.json). The surface says the truth.
// =============================================================================
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  validatePhotoPick, destinationFor, applyPropertyPhotoEdits, removeConfirmMessage,
  photoFailureMessage, removalDoneMessage, addDoneMessage, propertyUploadsUrl,
  PROPERTY_PHOTO_REMOVE_PATH, PROPERTY_UPLOADS_PATH,
  fetchPropertyUploads, sendPropertyPhoto, removePropertyPhoto, __setPhotoEditFetcher,
} from '../lib/property-photo-edit.js';
import PropertyPhotoActions, { PhotoRemoveButton } from '../components/PropertyPhotoActions.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const mounted = [];
function mount(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => { root.render(el); });
  mounted.push({ host, root });
  return host;
}
function unmountAll() {
  while (mounted.length) {
    const { host, root } = mounted.pop();
    act(() => { root.unmount(); });
    host.remove();
  }
}
const settle = async (ms = 0) => { await act(async () => { await new Promise((r) => setTimeout(r, ms)); }); };
const click = (el) => act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
const file = (name, type, size) => ({ name, type, size });

beforeEach(() => {
  unmountAll();
  __setPhotoEditFetcher(null);
  try { localStorage.setItem('poetech-chat-bridge-token', 'family-key'); } catch { /* private mode */ }
});

// --- the road is the EXISTING sovereign one ----------------------------------
describe('the address road is the sovereign photo server, never a second road', () => {
  it('both new paths sit under /nas-photos, never /n8n', () => {
    expect(PROPERTY_UPLOADS_PATH).toBe('/nas-photos/property-uploads');
    expect(PROPERTY_PHOTO_REMOVE_PATH).toBe('/nas-photos/property-photo-remove');
    for (const p of [PROPERTY_UPLOADS_PATH, PROPERTY_PHOTO_REMOVE_PATH]) {
      expect(p).not.toContain('/n8n');
      expect(p).not.toContain('webhook');
    }
  });

  it('encodes the address folder so a stray name cannot be injected', () => {
    expect(propertyUploadsUrl('1508HH', { limit: 50 })).toBe('/nas-photos/property-uploads?dest=1508HH&limit=50');
    expect(propertyUploadsUrl('a&b')).toContain('dest=a%26b');
  });

  it('the destination is the property’s own channel folder, and junk is refused', () => {
    expect(destinationFor('1508HH')).toBe('1508HH');
    expect(destinationFor('805NProspect')).toBe('805NProspect');
    expect(destinationFor('../secrets')).toBe('');
    expect(destinationFor('has space')).toBe('');
    expect(destinationFor('')).toBe('');
    expect(destinationFor(null)).toBe('');
  });
});

// --- what counts as a photo ---------------------------------------------------
describe('what this address will take', () => {
  it('takes a phone photo', () => {
    expect(validatePhotoPick(file('20240123_144917.jpg', 'image/jpeg', 2_400_000)).ok).toBe(true);
    expect(validatePhotoPick(file('IMG_3832.HEIC', '', 3_000_000)).ok).toBe(true);
  });

  it('says in plain words why it will not take something else — never a blank', () => {
    const none = validatePhotoPick(null);
    expect(none.ok).toBe(false);
    expect(none.error).toMatch(/Choose a photo/);

    const empty = validatePhotoPick(file('nothing.jpg', 'image/jpeg', 0));
    expect(empty.ok).toBe(false);
    expect(empty.error).toContain('nothing.jpg');
    expect(empty.error).toMatch(/empty/);

    const pdf = validatePhotoPick(file('lease.pdf', 'application/pdf', 900));
    expect(pdf.ok).toBe(false);
    expect(pdf.error).toContain('lease.pdf');
    expect(pdf.error).toMatch(/pictures only/i);

    const huge = validatePhotoPick(file('movie.jpg', 'image/jpeg', 200 * 1024 * 1024));
    expect(huge.ok).toBe(false);
    expect(huge.error).toMatch(/larger than/);
    for (const r of [none, empty, pdf, huge]) expect(r.error.trim().length).toBeGreaterThan(20);
  });
});

// --- the strip after an add and a removal -------------------------------------
describe('the strip reflects both at once', () => {
  const archive = [
    { id: 'p1', thumb: 'data:image/jpeg;base64,a', date: '2024-01-01', name: 'a.jpg' },
    { id: 'p2', thumb: 'data:image/jpeg;base64,b', date: '2024-02-01', name: 'b.jpg' },
  ];

  it('drops an archive photo the family took off this address', () => {
    const out = applyPropertyPhotoEdits({ archive, added: [], hidden: ['p1'] });
    expect(out.archive.map((p) => p.id)).toEqual(['p2']);
  });

  it('brings in the photos added to this address', () => {
    const added = [{ id: 'kitchen-abc.jpg', thumb: 'data:image/jpeg;base64,c', date: '2026-10-06' }];
    const out = applyPropertyPhotoEdits({ archive, added, hidden: [] });
    expect(out.archive).toHaveLength(2);
    expect(out.added.map((p) => p.id)).toEqual(['kitchen-abc.jpg']);
  });

  it('never shows a tile with no picture in it', () => {
    const out = applyPropertyPhotoEdits({ archive, added: [{ id: 'x.jpg', thumb: null }], hidden: [] });
    expect(out.added).toEqual([]);
  });

  it('matches a hidden id whatever its type, and survives empty input', () => {
    expect(applyPropertyPhotoEdits({ archive: [{ id: 7, thumb: 't' }], hidden: [7] }).archive).toEqual([]);
    expect(applyPropertyPhotoEdits()).toEqual({ archive: [], added: [] });
  });
});

// --- the confirm words --------------------------------------------------------
describe('the confirm names the photo and says which removal this is', () => {
  it('an added photo moves to Trash, and says so', () => {
    const m = removeConfirmMessage({ id: 'kitchen-abc.jpg', kind: 'added', name: 'kitchen.jpg', date: '2026-10-06' },
      { addressLabel: '1508 Holly Hill, Danville, IL' });
    expect(m).toContain('kitchen.jpg');
    expect(m).toContain('1508 Holly Hill, Danville, IL');
    expect(m).toMatch(/Trash/);
    expect(m).toMatch(/not erased/);
    expect(m).toContain('Cancel keeps the photo exactly where it is.');
  });

  it('an archive photo is taken off the address only — the chat post and the original stay', () => {
    const m = removeConfirmMessage({ id: 'p1', kind: 'archive', name: 'a.jpg', date: '2024-01-01' },
      { addressLabel: '1508 Holly Hill' });
    expect(m).toContain('a.jpg');
    expect(m).toMatch(/Synology Chat/);
    expect(m).toMatch(/NOT deleted/);
    expect(m).toContain('Cancel keeps the photo exactly where it is.');
  });

  it('still names something when the photo carries no name', () => {
    expect(removeConfirmMessage({ id: 'p9', kind: 'archive' })).toContain('p9');
    expect(removeConfirmMessage(null)).toContain('this photo');
  });
});

// --- a sentence for EVERY refusal --------------------------------------------
describe('every refusal says what happened and what to do', () => {
  const cases = [
    [{ skipped: 'no-key' }, 'add', /family key/i],
    [{ skipped: 'bad-dest' }, 'add', /photo folder name/i],
    [{ skipped: 'network-error' }, 'add', /offline/i],
    [{ skipped: 'no-bytes' }, 'add', /could not be read/i],
    [{ skipped: 'no-id' }, 'remove', /no photo id/i],
    [{ skipped: 'bad-kind' }, 'remove', /which store/i],
    [{ skipped: 'no-fetch' }, 'add', /no way to reach/i],
    [{ skipped: 'upload-error', status: 401 }, 'add', /unauthorized/i],
    [{ skipped: 'upload-error', status: 403 }, 'add', /unauthorized/i],
    [{ skipped: 'upload-error', status: 413 }, 'add', /too large/i],
    [{ skipped: 'upload-error', status: 415 }, 'add', /JPEG, PNG or WebP/],
    [{ skipped: 'upload-error', status: 400, error: 'bad dataUrl' }, 'add', /malformed/i],
    [{ skipped: 'upload-error', status: 503 }, 'add', /did not answer/i],
    [{ skipped: 'upload-error', status: 500 }, 'add', /answered 500/],
    [{ skipped: 'remove-error', status: 404, error: 'not-found' }, 'remove', /no photo by that name/i],
    [{}, 'add', /could not be reached/i],
  ];

  it.each(cases)('%j -> a whole sentence', (res, action, pattern) => {
    const msg = photoFailureMessage(res, { action, name: 'kitchen.jpg' });
    expect(msg).toMatch(pattern);
    expect(msg.trim().length).toBeGreaterThan(25);
    expect(msg).not.toMatch(/undefined|null|\[object/);
  });

  // The whole point of rule 4 in the brief: when the NAS has not been redeployed,
  // the app SAYS the endpoint is missing — it does not fail quietly.
  it('a 404/405 on the removal says the NAS has not been updated yet, and names the fix', () => {
    for (const status of [404, 405]) {
      const msg = photoFailureMessage({ skipped: 'remove-error', status }, { action: 'remove', name: 'a.jpg' });
      expect(msg).toContain(String(status));
      expect(msg).toMatch(/older photo service|no removal endpoint/i);
      expect(msg).toContain('infra/nas-property-photos');
      expect(msg).toMatch(/adding photos already works/i);
      expect(msg).toContain('still on this address');
    }
  });

  it('an add refusal says the photo was not added; a removal refusal says it is still there', () => {
    expect(photoFailureMessage({ skipped: 'network-error' }, { action: 'add', name: 'a.jpg' })).toContain('was not added');
    expect(photoFailureMessage({ skipped: 'network-error' }, { action: 'remove', name: 'a.jpg' })).toContain('still on this address');
  });

  it('a success says which recoverable removal happened', () => {
    expect(removalDoneMessage({ ok: true, kind: 'added' }, { name: 'k.jpg' })).toMatch(/Trash/);
    expect(removalDoneMessage({ ok: true, kind: 'added' }, { name: 'k.jpg' })).toMatch(/not erased/);
    expect(removalDoneMessage({ ok: true, kind: 'archive' }, { name: 'a.jpg' })).toMatch(/not touched/);
    expect(addDoneMessage({ mode: 'original', reason: 'fits' }, { name: 'k.jpg' })).toMatch(/original picture, full size/);
    expect(addDoneMessage({ mode: 'reduced', reason: 'too-large' }, { name: 'k.jpg' })).toMatch(/reduced copy/);
    expect(addDoneMessage({ mode: 'reduced', reason: 'type-not-kept' }, { name: 'k.jpg' })).toMatch(/another kind/);
  });
});

// --- the calls themselves -----------------------------------------------------
describe('the calls carry the family key and come back as data, never a throw', () => {
  it('reads this address’s added photos and its hidden list', async () => {
    const seen = [];
    __setPhotoEditFetcher(async (url, opts) => {
      seen.push({ url, auth: opts.headers.authorization });
      return { ok: true, status: 200, json: async () => ({ photos: [{ id: 'k.jpg', thumb: 't' }], hidden: ['p1'], total: 1 }) };
    });
    const res = await fetchPropertyUploads('1508HH');
    expect(res.ok).toBe(true);
    expect(res.photos).toHaveLength(1);
    expect(res.hidden).toEqual(['p1']);
    expect(seen[0].url).toContain('/nas-photos/property-uploads?dest=1508HH');
    expect(seen[0].auth).toBe('Bearer family-key');
  });

  it('sends one photo to the address’s own folder on the existing upload road', async () => {
    let body = null;
    let url = null;
    __setPhotoEditFetcher(async (u, opts) => { url = u; body = JSON.parse(opts.body); return { ok: true, status: 200, json: async () => ({ ok: true, id: 'kitchen-abc.jpg' }) }; });
    const res = await sendPropertyPhoto({ dataUrl: 'data:image/jpeg;base64,x', dest: '1508HH', filename: 'kitchen shot.jpg' });
    expect(res.ok).toBe(true);
    expect(url).toBe('/nas-photos/upload');
    expect(body.dest).toBe('1508HH');
    expect(body.filename).toBe('kitchen_shot.jpg');   // sanitized before it leaves
  });

  it('asks the NAS to take a photo off this address, naming which store it came from', async () => {
    let body = null;
    let url = null;
    __setPhotoEditFetcher(async (u, opts) => { url = u; body = JSON.parse(opts.body); return { ok: true, status: 200, json: async () => ({ ok: true, where: '1508HH/.trash' }) }; });
    const res = await removePropertyPhoto({ dest: '1508HH', id: 'kitchen-abc.jpg', kind: 'added' });
    expect(res.ok).toBe(true);
    expect(url).toBe('/nas-photos/property-photo-remove');
    expect(body).toEqual({ dest: '1508HH', id: 'kitchen-abc.jpg', kind: 'added' });
  });

  it('refuses before the network when the pieces are not there', async () => {
    __setPhotoEditFetcher(async () => { throw new Error('should not be called'); });
    expect((await removePropertyPhoto({ dest: '../secrets', id: 'x', kind: 'added' })).skipped).toBe('bad-dest');
    expect((await removePropertyPhoto({ dest: '1508HH', id: '', kind: 'added' })).skipped).toBe('no-id');
    expect((await removePropertyPhoto({ dest: '1508HH', id: 'x', kind: 'erase' })).skipped).toBe('bad-kind');
    expect((await sendPropertyPhoto({ dataUrl: '', dest: '1508HH' })).skipped).toBe('no-bytes');
  });

  it('a device with no family key never sends, and says so', async () => {
    try { localStorage.removeItem('poetech-chat-bridge-token'); } catch { /* private mode */ }
    __setPhotoEditFetcher(async () => { throw new Error('should not be called'); });
    const res = await sendPropertyPhoto({ dataUrl: 'data:image/jpeg;base64,x', dest: '1508HH' });
    expect(res.skipped).toBe('no-key');
    expect(photoFailureMessage(res, { action: 'add' })).toMatch(/family key/i);
  });

  it('a network that throws comes back as a refusal, not an exception', async () => {
    __setPhotoEditFetcher(async () => { throw new Error('offline'); });
    expect((await sendPropertyPhoto({ dataUrl: 'd', dest: '1508HH' })).skipped).toBe('network-error');
    expect((await removePropertyPhoto({ dest: '1508HH', id: 'a', kind: 'archive' })).skipped).toBe('network-error');
    expect((await fetchPropertyUploads('1508HH')).skipped).toBe('network-error');
  });

  it('carries the NAS status through so the screen can name it', async () => {
    __setPhotoEditFetcher(async () => ({ ok: false, status: 404, json: async () => ({ ok: false }) }));
    const res = await removePropertyPhoto({ dest: '1508HH', id: 'a', kind: 'added' });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(404);
  });
});

// --- the controls on the screen ----------------------------------------------
describe('Add photos: every pick gets a real result line', () => {
  const drop = (host, files) => {
    const input = host.querySelector('[data-testid="property-photo-add-input"]');
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    act(() => { input.dispatchEvent(new Event('change', { bubbles: true })); });
  };

  it('sends each photo to this address and says what landed', async () => {
    const sent = [];
    const host = mount(createElement(PropertyPhotoActions, {
      dest: '1508HH', addressLabel: '1508 Holly Hill',
      deps: {
        send: async (req) => { sent.push(req); return { ok: true, id: 'x' }; },
        plan: () => ({ mode: 'original', reason: 'fits' }),
        toDataUrl: async () => 'data:image/jpeg;base64,x',
        compress: async () => 'data:image/jpeg;base64,small',
      },
    }));
    expect(host.querySelector('[data-testid="property-photo-add-button"]').textContent).toContain('1508 Holly Hill');
    drop(host, [file('a.jpg', 'image/jpeg', 1000), file('b.jpg', 'image/jpeg', 2000)]);
    await settle(10);
    expect(sent.map((s) => s.filename)).toEqual(['a.jpg', 'b.jpg']);
    expect(sent.every((s) => s.dest === '1508HH')).toBe(true);
    const lines = [...host.querySelectorAll('[data-testid="property-photo-add-results"] li')];
    expect(lines).toHaveLength(2);
    expect(lines[0].textContent).toMatch(/original picture, full size/);
  });

  it('a file that is not a photo is refused in words, and never sent', async () => {
    const sent = [];
    const host = mount(createElement(PropertyPhotoActions, {
      dest: '1508HH',
      deps: { send: async (r) => { sent.push(r); return { ok: true }; }, plan: () => ({ mode: 'reduced', reason: 'type-not-kept' }), toDataUrl: async () => 'd', compress: async () => 'd' },
    }));
    drop(host, [file('lease.pdf', 'application/pdf', 900)]);
    await settle(10);
    expect(sent).toEqual([]);
    const line = host.querySelector('[data-testid="property-photo-add-results"] li');
    expect(line.textContent).toContain('lease.pdf');
    expect(line.textContent).toMatch(/pictures only/i);
  });

  it('a NAS refusal is shown in plain words per file, not swallowed', async () => {
    const host = mount(createElement(PropertyPhotoActions, {
      dest: '1508HH',
      deps: {
        send: async () => ({ ok: false, skipped: 'upload-error', status: 413 }),
        plan: () => ({ mode: 'original', reason: 'fits' }), toDataUrl: async () => 'd', compress: async () => 'd',
      },
    }));
    drop(host, [file('big.jpg', 'image/jpeg', 9_000_000)]);
    await settle(10);
    const line = host.querySelector('[data-testid="property-photo-add-results"] li');
    expect(line.textContent).toMatch(/too large/i);
    expect(line.textContent).toContain('big.jpg');
  });

  it('tells the strip to reload only when something actually landed', async () => {
    const good = vi.fn();
    const hostA = mount(createElement(PropertyPhotoActions, {
      dest: '1508HH', onAdded: good,
      deps: { send: async () => ({ ok: true }), plan: () => ({ mode: 'original' }), toDataUrl: async () => 'd', compress: async () => 'd' },
    }));
    drop(hostA, [file('a.jpg', 'image/jpeg', 10)]);
    await settle(10);
    expect(good).toHaveBeenCalledWith(1);

    const bad = vi.fn();
    const hostB = mount(createElement(PropertyPhotoActions, {
      dest: '1508HH', onAdded: bad,
      deps: { send: async () => ({ ok: false, skipped: 'network-error' }), plan: () => ({ mode: 'original' }), toDataUrl: async () => 'd', compress: async () => 'd' },
    }));
    drop(hostB, [file('a.jpg', 'image/jpeg', 10)]);
    await settle(10);
    expect(bad).not.toHaveBeenCalled();
  });

  it('falls back to the reduced copy when the original cannot be read, and says which', async () => {
    const sent = [];
    const host = mount(createElement(PropertyPhotoActions, {
      dest: '1508HH',
      deps: {
        send: async (r) => { sent.push(r); return { ok: true }; },
        plan: () => ({ mode: 'original', reason: 'fits' }),
        toDataUrl: async () => { throw new Error('no reader'); },
        compress: async () => 'data:image/jpeg;base64,small',
      },
    }));
    drop(host, [file('a.jpg', 'image/jpeg', 10)]);
    await settle(10);
    expect(sent[0].dataUrl).toBe('data:image/jpeg;base64,small');
    expect(host.querySelector('[data-testid="property-photo-add-results"] li').textContent).toMatch(/reduced copy/);
  });
});

// --- DR-0691: the confirm copy and the behavior are tested together -----------
describe('Remove: it confirms by name, and Cancel really does keep the photo', () => {
  it('PRESSING CANCEL KEEPS IT — nothing is asked of the NAS, nothing is reported', async () => {
    const remove = vi.fn(async () => ({ ok: true }));
    const onRemoved = vi.fn();
    let asked = null;
    const host = mount(createElement(PhotoRemoveButton, {
      photo: { id: 'kitchen-abc.jpg', kind: 'added', name: 'kitchen.jpg', date: '2026-10-06' },
      dest: '1508HH', addressLabel: '1508 Holly Hill', onRemoved,
      deps: { confirm: (m) => { asked = m; return false; }, remove },
    }));
    click(host.querySelector('[data-testid="property-photo-remove-button"]'));
    await settle(10);

    // the words it showed promise exactly this
    expect(asked).toContain('kitchen.jpg');
    expect(asked).toContain('Cancel keeps the photo exactly where it is.');
    // and the behavior keeps the promise
    expect(remove).not.toHaveBeenCalled();
    expect(onRemoved).not.toHaveBeenCalled();
    expect(host.querySelector('[data-testid="property-photo-remove-said"]')).toBeNull();
    expect(host.querySelector('[data-testid="property-photo-remove-button"]').textContent).toBe('Remove');
  });

  it('pressing OK takes it off, and says which recoverable removal happened', async () => {
    const remove = vi.fn(async () => ({ ok: true, kind: 'added', where: '1508HH/.trash' }));
    const onRemoved = vi.fn();
    const host = mount(createElement(PhotoRemoveButton, {
      photo: { id: 'kitchen-abc.jpg', kind: 'added', name: 'kitchen.jpg' },
      dest: '1508HH', onRemoved, deps: { confirm: () => true, remove },
    }));
    click(host.querySelector('[data-testid="property-photo-remove-button"]'));
    await settle(10);
    expect(remove).toHaveBeenCalledWith({ dest: '1508HH', id: 'kitchen-abc.jpg', kind: 'added' });
    expect(onRemoved).toHaveBeenCalled();
    expect(host.querySelector('[data-testid="property-photo-remove-said"]').textContent).toMatch(/Trash/);
  });

  it('an archive photo is taken off the address, and the words say the original stayed', async () => {
    const remove = vi.fn(async () => ({ ok: true, kind: 'archive' }));
    const host = mount(createElement(PhotoRemoveButton, {
      photo: { id: 'p1', kind: 'archive', name: 'a.jpg' },
      dest: '1508HH', deps: { confirm: () => true, remove },
    }));
    click(host.querySelector('[data-testid="property-photo-remove-button"]'));
    await settle(10);
    expect(remove).toHaveBeenCalledWith({ dest: '1508HH', id: 'p1', kind: 'archive' });
    expect(host.querySelector('[data-testid="property-photo-remove-said"]').textContent).toMatch(/not touched/);
  });

  it('a NAS that has not been redeployed yet says so on the screen — never silently', async () => {
    const host = mount(createElement(PhotoRemoveButton, {
      photo: { id: 'p1', kind: 'archive', name: 'a.jpg' },
      dest: '1508HH',
      deps: { confirm: () => true, remove: async () => ({ ok: false, skipped: 'remove-error', status: 404 }) },
    }));
    click(host.querySelector('[data-testid="property-photo-remove-button"]'));
    await settle(10);
    const said = host.querySelector('[data-testid="property-photo-remove-said"]').textContent;
    expect(said).toContain('404');
    expect(said).toContain('infra/nas-property-photos');
    expect(said).toContain('still on this address');
  });

  it('names the photo in its own label so a screen reader knows which one', () => {
    const host = mount(createElement(PhotoRemoveButton, {
      photo: { id: 'p1', kind: 'archive', name: 'a.jpg' }, dest: '1508HH', addressLabel: '1508 Holly Hill',
      deps: { confirm: () => false, remove: async () => ({ ok: true }) },
    }));
    expect(host.querySelector('[data-testid="property-photo-remove-button"]').getAttribute('aria-label'))
      .toBe('Remove a.jpg from 1508 Holly Hill');
  });
});
