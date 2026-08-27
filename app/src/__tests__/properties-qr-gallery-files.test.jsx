// =============================================================================
// The QR card, the gallery, and the document vault
// =============================================================================
// Darrell, 2026-08-27: "Have a person scan a qr code to apply for an open
// spot... also add a location for uploading documents and images like or other
// workflows" and "Have a place where each property has a pictures like
// MooreDivahs App kind of".
//
// The lines these tests hold are the ones that would leak somebody's home or
// their lease if they slipped: a printed code carries no token, a listing photo
// is the only kind a stranger can reach, and a document's audience is stated
// before it is saved.
// =============================================================================
import React, { act } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import {
  applyUrl, applyUrlDisplay, readApplyTarget, resolveScan, cardCaption, APPLY_PARAM,
} from '../modules/properties/apply-link.js';
import {
  GalleryTab, FilesTab, DoorsBoard, dataUrlBytes, PHOTO_KINDS, DOCUMENT_KINDS, MAX_DOCUMENT_BYTES,
} from '../modules/properties/DoorTabs.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let mounted = [];
afterEach(() => {
  mounted.forEach(({ root, host }) => { act(() => root.unmount()); host.remove(); });
  mounted = [];
});
function render(el) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  act(() => root.render(el));
  mounted.push({ root, host });
  return host;
}
const txt = (h) => h.textContent;
const buttons = (h) => [...h.querySelectorAll('button')];
const byText = (h, re) => buttons(h).find((b) => re.test(b.textContent));
const click = (n) => act(() => { n.dispatchEvent(new MouseEvent('click', { bubbles: true })); });

const ID = '0e79ae01-119f-4d8e-8502-1223de9b1c2b';

// ---------------------------------------------------------------------------
// The printed card
// ---------------------------------------------------------------------------
describe('the QR a person scans at the property', () => {
  it('points at the Poe Properties door with the unit in the query', () => {
    const url = applyUrl(ID);
    expect(url).toBe(`https://poetech.us/properties/?${APPLY_PARAM}=${ID}`);
    expect(applyUrlDisplay(ID)).toBe(`poetech.us/properties/?${APPLY_PARAM}=${ID}`);
  });

  it('carries a unit id and NOTHING else — a printed code cannot be revoked', () => {
    const url = applyUrl(ID);
    expect(url).not.toMatch(/token|key|secret|sig=/i);
    expect(new URL(url).searchParams.size).toBe(1);
  });

  it('uses the canonical origin, since the phone scanning it has never been to a preview', () => {
    expect(applyUrl(ID).startsWith('https://poetech.us/')).toBe(true);
  });

  it('falls back to the front door rather than encoding nowhere', () => {
    expect(applyUrl(null)).toBe('https://poetech.us/properties/');
    expect(applyUrl('not-an-id')).toBe('https://poetech.us/properties/');
  });

  it('reads a well-formed target back out of a location', () => {
    expect(readApplyTarget(`?${APPLY_PARAM}=${ID}`)).toBe(ID);
    expect(readApplyTarget(`${APPLY_PARAM}=${ID}&x=1`)).toBe(ID);
  });

  it('refuses junk rather than querying with it', () => {
    expect(readApplyTarget('?apply=; drop table rentals')).toBeNull();
    expect(readApplyTarget('?apply=')).toBeNull();
    expect(readApplyTarget('')).toBeNull();
    expect(readApplyTarget(null)).toBeNull();
  });

  it('opens the application when the scanned unit is still on offer', () => {
    const r = resolveScan(ID, [{ id: ID, label: 'Champaign', unit: 'Apt 2' }]);
    expect(r.matched).toBe(true);
    expect(r.unit.unit).toBe('Apt 2');
  });

  it('a card left up after the unit was taken tells the truth instead', () => {
    // public_vacancies already excludes an occupied or unadvertised door, so it
    // simply is not in the list — the card degrades to a true statement.
    const r = resolveScan(ID, []);
    expect(r.matched).toBe(false);
    expect(r.unit).toBeNull();
    expect(r.reason).toMatch(/not available right now/);
  });

  it('says on the paper that no account is needed', () => {
    expect(cardCaption('Apt 2, Champaign')).toMatch(/Apply for Apt 2, Champaign|apply for Apt 2/i);
    expect(cardCaption('Apt 2')).toMatch(/no account needed/);
    expect(cardCaption('')).toMatch(/no account needed/);
  });

  it('renders a scannable code and a copyable link on the landlord\'s board', () => {
    const rentals = [{ id: ID, slug: 's', instance_id: 'i', address: '805 North Prospect Avenue', unit: 'Apt 2', city: 'Champaign' }];
    const host = render(<DoorsBoard rentals={rentals} tenancies={[]} canManage />);
    click(byText(host, /QR to apply/));
    expect(host.querySelector('svg')).toBeTruthy();          // qrcode.react renders an SVG
    expect(txt(host)).toContain(applyUrlDisplay(ID));
    expect(txt(host)).toMatch(/no account/i);
  });

  it('offers no QR on an occupied door — there is nothing to apply for', () => {
    const rentals = [{ id: ID, slug: 's', instance_id: 'i', address: '805 N Prospect' }];
    const tenancies = [{ id: 't', rental_ref: 's', status: 'active', tenant_name: 'Jordan Ellery' }];
    const host = render(<DoorsBoard rentals={rentals} tenancies={tenancies} canManage />);
    expect(byText(host, /QR to apply/)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// The gallery
// ---------------------------------------------------------------------------
describe('a property\'s pictures', () => {
  const door = { id: 'u1', instance_id: 'i1' };
  const rooms = [{ id: 'rm1', name: 'Kitchen', kind: 'kitchen', sort_order: 10 }];
  const photo = (over = {}) => ({
    id: 'p1', rental_ref: 'u1', kind: 'listing', caption: 'Front room',
    storage_path: 'data:image/jpeg;base64,AAAA', room_id: 'rm1', ...over,
  });

  it('says it is empty when it is', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage />);
    expect(txt(host)).toMatch(/No pictures on this property yet/);
  });

  it('shows each picture with its caption, kind and room', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[photo()]} canManage />);
    expect(host.querySelector('img').getAttribute('src')).toMatch(/^data:image\/jpeg/);
    expect(txt(host)).toContain('Front room');
    expect(txt(host)).toContain('Kitchen');
  });

  it('says a picture has no caption rather than showing a blank', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[photo({ caption: '' })]} canManage />);
    expect(txt(host)).toMatch(/No caption/);
  });

  it('warns that a LISTING shot is the only kind a stranger can see', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage />);
    expect(txt(host)).toMatch(/only kind a stranger can ever see/);
  });

  it('hides an archived picture without pretending it was deleted', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[photo({ archived_at: '2026-01-01' })]} canManage />);
    expect(txt(host)).toMatch(/Pictures \(0\)/);
  });

  it('archives on Remove — there is no DELETE grant behind it', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onPatch = vi.fn();
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[photo()]} canManage onPatch={onPatch} />);
    click(byText(host, /^Remove$/));
    expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/nothing is deleted/i));
    expect(onPatch).toHaveBeenCalledWith('p1', { archived_at: expect.any(String) });
    confirm.mockRestore();
  });

  it('edits the caption without touching the image', () => {
    const onPatch = vi.fn();
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[photo()]} canManage onPatch={onPatch} />);
    click(byText(host, /^Edit$/));
    // Scope to the card being edited — the "Add a picture" form has a caption
    // field too, and grabbing the first text input picks the wrong one.
    const input = byText(host, /^Save$/).closest('li').querySelector('input[type="text"]');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Front room, repainted');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    click(byText(host, /^Save$/));
    expect(onPatch).toHaveBeenCalledWith('p1', { caption: 'Front room, repainted' });
    expect(onPatch.mock.calls[0][1]).not.toHaveProperty('storage_path');
  });

  it('tells the editor the image itself never changes', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[photo()]} canManage />);
    click(byText(host, /^Edit$/));
    expect(txt(host)).toMatch(/picture itself never changes/);
  });

  it('offers no upload or controls to someone who cannot manage the door', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[photo()]} canManage={false} />);
    expect(txt(host)).toContain('Front room');
    expect(txt(host)).not.toMatch(/Add a picture/);
    expect(byText(host, /^Remove$/)).toBeUndefined();
  });

  it('will not save with no file chosen', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage />);
    expect(byText(host, /Add to the gallery/).disabled).toBe(true);
  });

  it('offers every photo kind the database accepts, and no other', () => {
    expect(PHOTO_KINDS).toContain('listing');
    expect(PHOTO_KINDS).toContain('move-out-condition');
    // The CHECK has no camera/stream/sensor kind, and neither does the picker.
    for (const k of PHOTO_KINDS) expect(k).not.toMatch(/camera|stream|sensor|audio/);
  });

  it('estimates a data URL\'s real cost', () => {
    expect(dataUrlBytes('data:image/jpeg;base64,' + 'A'.repeat(1000))).toBe(750);
    expect(dataUrlBytes('')).toBe(0);
    expect(dataUrlBytes('not-a-data-url')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// The documents
// ---------------------------------------------------------------------------
describe('the papers a door already has', () => {
  const door = { id: 'u1', instance_id: 'i1' };
  const tenancies = [{ id: 't1', tenant_name: 'Jordan Ellery', status: 'active' }];
  const doc = (over = {}) => ({
    id: 'd1', title: 'Signed lease 2026', kind: 'lease', note: '',
    storage_path: 'data:application/pdf;base64,AAAA', byte_size: 40960,
    effective_on: '2026-01-01', tenancy_id: 't1', ...over,
  });

  it('says it is empty when it is', () => {
    const host = render(<FilesTab door={door} tenancies={tenancies} documents={[]} canManage />);
    expect(txt(host)).toMatch(/No documents on this property yet/);
  });

  it('lists a document with its kind, date, size and whose it is', () => {
    const host = render(<FilesTab door={door} tenancies={tenancies} documents={[doc()]} canManage />);
    expect(txt(host)).toContain('Signed lease 2026');
    expect(txt(host)).toMatch(/lease · effective 2026-01-01 · 40KB · Jordan Ellery/);
  });

  it('marks a door-level paper as management-only', () => {
    const host = render(<FilesTab door={door} tenancies={tenancies} documents={[doc({ tenancy_id: null })]} canManage />);
    expect(txt(host)).toMatch(/the property/);
  });

  // The audience is the consequential choice, so the form states it in words
  // rather than leaving it to be inferred from a dropdown.
  it('says in the form who will be able to read it', () => {
    const host = render(<FilesTab door={door} tenancies={tenancies} documents={[]} canManage />);
    expect(txt(host)).toMatch(/only management sees it/i);
  });

  it('archives on Remove rather than deleting', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onPatch = vi.fn();
    const host = render(<FilesTab door={door} tenancies={tenancies} documents={[doc()]} canManage onPatch={onPatch} />);
    click(byText(host, /^Remove$/));
    expect(onPatch).toHaveBeenCalledWith('d1', { archived_at: expect.any(String) });
    confirm.mockRestore();
  });

  it('edits the description without replacing the file', () => {
    const onPatch = vi.fn();
    const host = render(<FilesTab door={door} tenancies={tenancies} documents={[doc()]} canManage onPatch={onPatch} />);
    click(byText(host, /^Edit$/));
    const input = byText(host, /^Save$/).closest('li').querySelector('input[type="text"]');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'Signed lease 2026 (countersigned)');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    click(byText(host, /^Save$/));
    expect(onPatch.mock.calls[0][1]).toEqual({ title: 'Signed lease 2026 (countersigned)' });
    expect(onPatch.mock.calls[0][1]).not.toHaveProperty('storage_path');
  });

  it('a tenant sees the papers but is offered no upload', () => {
    const host = render(<FilesTab door={door} tenancies={tenancies} documents={[doc()]} canManage={false} />);
    expect(txt(host)).toContain('Signed lease 2026');
    expect(txt(host)).not.toMatch(/Add a document/);
  });

  it('offers only the kinds the database accepts', () => {
    expect(DOCUMENT_KINDS).toContain('lease');
    expect(DOCUMENT_KINDS).toContain('permit');
    expect(DOCUMENT_KINDS).not.toContain('ssn');
  });

  it('states a size limit, because a document lives in the row itself', () => {
    expect(MAX_DOCUMENT_BYTES).toBe(3 * 1024 * 1024);
  });
});
