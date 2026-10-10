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
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createRoot } from 'react-dom/client';
import {
  applyUrl, applyUrlDisplay, readApplyTarget, resolveScan, cardCaption, APPLY_PARAM,
} from '../modules/properties/apply-link.js';
import {
  GalleryTab, FilesTab, DoorsBoard, dataUrlBytes, PHOTO_KINDS, DOCUMENT_KINDS, MAX_DOCUMENT_BYTES,
  RECORD_KINDS, ADVERTISING_KINDS, isAdvertising, takenAtIso,
} from '../modules/properties/DoorTabs.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// jsdom cannot DECODE an image, so the real compressImageFile refuses every
// file here and nothing would ever reach the queue. The decode itself is
// proven against a genuine .heic in a-heic-photo-is-a-photo.test.js; what the
// save cases below exercise is what happens to a picture AFTER it is queued,
// which is where Darrell's "didn't take them" lives. isLikelyImageFile stays
// real, so the picker's own gate is still the one under test.
vi.mock('../lib/image.js', async (orig) => ({
  ...(await orig()),
  compressImageFile: async () => 'data:image/jpeg;base64,/9j/4AAQSkZJRg==',
}));

// The board's QR / Advertise / Start-a-tenancy controls live in the LIST view.
// The default became grid on 2026-08-28 (Darrell: "I like the grid look as the
// default"), so pin the view this suite is actually exercising rather than
// inheriting whichever is current.
beforeEach(() => {
  try { localStorage.setItem('poe-properties-view', 'list'); } catch { /* ignore */ }
});

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

  // RECORDS VS ADVERTISING (DR-0906). Darrell, 2026-10-10, over a move-out
  // condition set: "just don't want it to be advertised!!!", "Records vs
  // advertising!!!" and "Or workorders... etc... pictures for advertising are
  // different..."
  //
  // THIS CASE USED TO ASSERT THE DEFECT. It rendered the panel and expected
  // the listing warning to be ON SCREEN — which passed only because the form
  // OPENED on 'listing', the single kind a stranger can see, for a panel whose
  // ordinary use is documenting damage and work orders. The warning was not a
  // warning; it was the standing state. Named here rather than quietly
  // adjusted.
  it('opens on a RECORD, never on advertising', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage />);
    const kind = host.querySelector('[data-testid="photo-kind"]');
    expect(kind, 'no kind picker').toBeTruthy();
    expect(RECORD_KINDS).toContain(kind.value);
    expect(isAdvertising(kind.value)).toBe(false);
    // And nothing shouts about advertising when nobody chose it.
    expect(host.querySelector('[data-testid="advertising-warning"]')).toBeNull();
  });

  // A PICTURE IS NOT GONE UNTIL IT IS SAVED (DR-0907). Darrell, 2026-10-10,
  // after the HEIC fix let fourteen move-out photographs in at last: "Would
  // let me upload however didn't take them".
  //
  // The old submit() fired every insert WITHOUT awaiting and then cleared the
  // queue regardless, so anything that failed vanished from the screen with
  // nothing to retry and no copy of the file — while the thumbnails
  // disappearing made it look saved.
  describe('saving the queue', () => {
    const queue = async (host, names) => {
      // Put files through the real picker so the queue is built the way the
      // app builds it, not hand-assembled.
      const input = host.querySelector('input[type="file"]');
      expect(input, 'no file input').toBeTruthy();
      const files = names.map((n) => new File([new Uint8Array([1, 2, 3])], n, { type: 'image/jpeg' }));
      Object.defineProperty(input, 'files', { value: files, configurable: true });
      await act(async () => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
        for (let i = 0; i < 8; i += 1) await Promise.resolve();
      });
    };

    it('PROVEN-TO-CATCH: a picture that did NOT save stays in the queue', async () => {
      const seen = [];
      // The second one fails, the way one insert out of fourteen would.
      const onAdd = async (row) => {
        seen.push(row.caption);
        return seen.length === 2 ? { ok: false, reason: 'write-failed' } : { ok: true };
      };
      const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage onAdd={onAdd} />);
      await queue(host, ['a.jpg', 'b.jpg', 'c.jpg']);
      expect(host.querySelectorAll('li img').length, 'the picker did not queue three').toBe(3);

      const add = host.querySelector('[data-testid="add-to-gallery"]');
      await act(async () => {
        add.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        for (let i = 0; i < 24; i += 1) await Promise.resolve();
      });

      // All three were attempted, ONE AT A TIME.
      expect(seen).toHaveLength(3);
      // The failed one is still on screen; the two that saved are gone.
      expect(host.querySelectorAll('li img').length, 'the failed picture was discarded').toBe(1);
      // THE FINALIZE LIST (DR-0908), which Darrell asked for by name: a panel
      // that STAYS and names every file, not a six-second toast that fourteen
      // saves overwrite.
      const rep = host.querySelector('[data-testid="upload-report"]');
      expect(rep, 'no finalize list after the run').toBeTruthy();
      expect(rep.textContent).toMatch(/2 of 3/);
      expect(rep.textContent).toMatch(/Some did not save/);
      // It says WHERE the saved ones went — the prechosen kind.
      expect(rep.textContent).toMatch(/move in condition|as /);
      const lost = host.querySelector('[data-testid="upload-report-lost"]');
      expect(lost.textContent).toMatch(/b\.jpg — NOT saved \(write-failed\)/);
      expect(lost.textContent).toMatch(/still in the list above/);
      const savedList = host.querySelector('[data-testid="upload-report-saved"]');
      expect(savedList.textContent).toMatch(/a\.jpg — saved/);
      expect(savedList.textContent).toMatch(/c\.jpg — saved/);
    });

    it('when every picture saves, the queue empties and nothing is claimed lost', async () => {
      const onAdd = async () => ({ ok: true });
      const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage onAdd={onAdd} />);
      await queue(host, ['a.jpg', 'b.jpg']);
      const add = host.querySelector('[data-testid="add-to-gallery"]');
      await act(async () => {
        add.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        for (let i = 0; i < 24; i += 1) await Promise.resolve();
      });
      expect(host.querySelectorAll('li img').length).toBe(0);
      expect(host.querySelector('[data-testid="upload-report-lost"]')).toBeNull();
      // And it still SAYS what it did, and where.
      const rep = host.querySelector('[data-testid="upload-report"]');
      expect(rep.textContent).toMatch(/2 of 2/);
    });

    it('an onAdd that answers nothing is treated as saved, as every caller before this did', async () => {
      const onAdd = async () => undefined;
      const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage onAdd={onAdd} />);
      await queue(host, ['a.jpg']);
      const add = host.querySelector('[data-testid="add-to-gallery"]');
      await act(async () => {
        add.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        for (let i = 0; i < 16; i += 1) await Promise.resolve();
      });
      // A false "lost" would be its own lie.
      expect(host.querySelectorAll('li img').length).toBe(0);
      expect(host.querySelector('[data-testid="upload-report-lost"]')).toBeNull();
    });

    it('an onAdd that THROWS keeps the picture rather than losing it', async () => {
      const onAdd = async () => { throw new Error('network gone'); };
      const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage onAdd={onAdd} />);
      await queue(host, ['a.jpg']);
      const add = host.querySelector('[data-testid="add-to-gallery"]');
      await act(async () => {
        add.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        for (let i = 0; i < 16; i += 1) await Promise.resolve();
      });
      expect(host.querySelectorAll('li img').length, 'a thrown error lost the picture').toBe(1);
      expect(host.querySelector('[data-testid="upload-report-lost"]').textContent).toMatch(/network gone/);
    });
  });

  // SHOW ME THE SET I AM WORKING ON (DR-0908). Darrell, 2026-10-10: "Maybe
  // choosing a move out conditions should show those images etc..."
  describe('looking by kind', () => {
    const mixed = [
      photo({ id: 'p1', kind: 'move-out-condition', caption: 'bathroom as left' }),
      photo({ id: 'p2', kind: 'move-out-condition', caption: 'kitchen as left' }),
      photo({ id: 'p3', kind: 'listing', caption: 'front room, advertised' }),
    ];

    it('PROVEN-TO-CATCH: picking a kind shows only that kind', () => {
      const host = render(<GalleryTab door={door} rooms={rooms} photos={mixed} canManage />);
      const strip = host.querySelector('[data-testid="gallery-kinds"]');
      expect(strip, 'no way to look by kind').toBeTruthy();
      const moveOut = [...strip.querySelectorAll('button')]
        .find((b) => /move out condition/i.test(b.textContent));
      expect(moveOut, 'move-out is not offered').toBeTruthy();
      expect(moveOut.textContent).toMatch(/\(2\)/);
      act(() => { moveOut.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      const body = txt(host);
      expect(body).toContain('bathroom as left');
      expect(body).toContain('kitchen as left');
      expect(body, 'a listing shot leaked into the move-out view').not.toContain('front room, advertised');
    });

    it('every kind is the default, and comes back', () => {
      const host = render(<GalleryTab door={door} rooms={rooms} photos={mixed} canManage />);
      expect(txt(host)).toContain('front room, advertised');
      const strip = host.querySelector('[data-testid="gallery-kinds"]');
      const moveOut = [...strip.querySelectorAll('button')].find((b) => /move out condition/i.test(b.textContent));
      act(() => { moveOut.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      expect(txt(host)).not.toContain('front room, advertised');
      const all = host.querySelector('[data-testid="gallery-kind-all"]');
      act(() => { all.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      expect(txt(host)).toContain('front room, advertised');
    });

    // SUPERSEDED THE SAME DAY, and named rather than quietly changed. This
    // case asserted that the strip is HIDDEN when a door has one kind — a
    // reasonable call ("an answer that can only be 'all of them' is not a
    // question worth asking") that Darrell then overruled in one line: "All
    // options show their images". The strip is how a person SEES which kinds
    // a door holds, so hiding it hides the answer.
    it('the strip is offered whenever there are pictures, even with one kind', () => {
      const one = [photo({ id: 'p1', kind: 'move-out-condition' })];
      const host = render(<GalleryTab door={door} rooms={rooms} photos={one} canManage />);
      const strip = host.querySelector('[data-testid="gallery-kinds"]');
      expect(strip, 'the only kind at this door was not offered').toBeTruthy();
      expect(strip.textContent).toMatch(/move out condition \(1\)/);
    });

    it('the kind being ADDED is always offered, even with none of it yet', () => {
      // Picking a kind must never lead to a strip that has forgotten it.
      const host = render(<GalleryTab door={door} rooms={rooms} photos={mixed} canManage />);
      const kind = host.querySelector('[data-testid="photo-kind"]');
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
        setter.set.call(kind, 'damage');
        kind.dispatchEvent(new Event('change', { bubbles: true }));
      });
      const strip = host.querySelector('[data-testid="gallery-kinds"]');
      expect(strip.textContent).toMatch(/damage \(0\)/);
      expect(txt(host)).toMatch(/No damage pictures at this door yet/);
    });

    it('choosing what to ADD also points the view at it', () => {
      const host = render(<GalleryTab door={door} rooms={rooms} photos={mixed} canManage />);
      const kind = host.querySelector('[data-testid="photo-kind"]');
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
        setter.set.call(kind, 'move-out-condition');
        kind.dispatchEvent(new Event('change', { bubbles: true }));
      });
      expect(txt(host)).not.toContain('front room, advertised');
    });
  });

  // THE DAY THEY WERE TAKEN (DR-0908). Darrell, 2026-10-10: "allow me to
  // enter the correct dates for photos... they will sort my move out dates".
  describe('dating a set', () => {
    it('PROVEN-TO-CATCH: a typed day reaches taken_at, which is what sorts them', async () => {
      const rows = [];
      const onAdd = async (row) => { rows.push(row); return { ok: true }; };
      const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage onAdd={onAdd} />);
      // The CHOSEN input, not the camera one. A photo captured in the app
      // this second stamps its own takenAt and should; the whole point of a
      // typed date is the set chosen from the phone, which has none.
      const input = host.querySelector('input[type="file"][multiple]');
      expect(input, 'no choose-from-phone input').toBeTruthy();
      Object.defineProperty(input, 'files', {
        value: [new File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' })], configurable: true,
      });
      await act(async () => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
        for (let i = 0; i < 8; i += 1) await Promise.resolve();
      });
      const day = host.querySelector('[data-testid="photo-taken-on"]');
      expect(day, 'no way to say when they were taken').toBeTruthy();
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        setter.set.call(day, '2026-09-28T16:20');
        day.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await act(async () => {
        host.querySelector('[data-testid="add-to-gallery"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        for (let i = 0; i < 20; i += 1) await Promise.resolve();
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].taken_at, 'the typed day never reached the row').toBeTruthy();
      // The DAY AND THE TIME both survive the round trip into the record.
      const back = new Date(rows[0].taken_at);
      expect(back.getFullYear()).toBe(2026);
      expect(back.getMonth() + 1).toBe(9);
      expect(back.getDate()).toBe(28);
      expect(back.getHours()).toBe(16);
      expect(back.getMinutes()).toBe(20);
    });

    // SUPERSEDED BY DARRELL THE SAME DAY, named rather than quietly changed.
    // This asserted that the field starts BLANK so a record says "unknown"
    // rather than guessing. He then asked for the opposite default: "Calendar
    // to choose those dates and times... or it defaults to today". Today is
    // right for the common case — he photographs a unit and files it the same
    // afternoon — and "Unknown" is still one tap away, so the honest answer
    // remains reachable instead of being the only one.
    it('it DEFAULTS to today, and the default is what gets written', async () => {
      const rows = [];
      const onAdd = async (row) => { rows.push(row); return { ok: true }; };
      const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage onAdd={onAdd} />);
      // The CHOSEN input, not the camera one. A photo captured in the app
      // this second stamps its own takenAt and should; the whole point of a
      // typed date is the set chosen from the phone, which has none.
      const input = host.querySelector('input[type="file"][multiple]');
      expect(input, 'no choose-from-phone input').toBeTruthy();
      Object.defineProperty(input, 'files', {
        value: [new File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' })], configurable: true,
      });
      await act(async () => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
        for (let i = 0; i < 8; i += 1) await Promise.resolve();
      });
      await act(async () => {
        host.querySelector('[data-testid="add-to-gallery"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        for (let i = 0; i < 20; i += 1) await Promise.resolve();
      });
      expect(rows[0].taken_at, 'the default day never reached the row').toBeTruthy();
      const d = new Date(rows[0].taken_at);
      const today = new Date();
      expect(d.getDate()).toBe(today.getDate());
      expect(d.getMonth()).toBe(today.getMonth());
    });

    it('and "Unknown" clears it, so a set from a day he cannot recall is not dated a lie', async () => {
      const rows = [];
      const onAdd = async (row) => { rows.push(row); return { ok: true }; };
      const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage onAdd={onAdd} />);
      const input = host.querySelector('input[type="file"][multiple]');
      Object.defineProperty(input, 'files', {
        value: [new File([new Uint8Array([1])], 'a.jpg', { type: 'image/jpeg' })], configurable: true,
      });
      await act(async () => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
        for (let i = 0; i < 8; i += 1) await Promise.resolve();
      });
      const clear = host.querySelector('[data-testid="photo-taken-clear"]');
      expect(clear, 'no way to say the day is unknown').toBeTruthy();
      act(() => { clear.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      await act(async () => {
        host.querySelector('[data-testid="add-to-gallery"]').dispatchEvent(new MouseEvent('click', { bubbles: true }));
        for (let i = 0; i < 20; i += 1) await Promise.resolve();
      });
      // "Unknown" is a truthful answer; a guessed day is a false one.
      expect(rows[0].taken_at).toBeNull();
    });

    it('a bare day is stored at noon, so it never slides backwards in a western zone', () => {
      // Champaign is UTC-5: parsed as UTC midnight, every dated photograph
      // would render as the day before on his own screen.
      expect(takenAtIso('2026-09-28')).toMatch(/^2026-09-28T\d{2}/);
      expect(new Date(takenAtIso('2026-09-28')).getDate()).toBe(28);
    });

    it('a typo writes nothing at all', () => {
      for (const bad of ['', '28/09/2026', '2026-13-45', 'yesterday', null]) {
        expect(takenAtIso(bad), `${bad} should not become an instant`).toBeNull();
      }
    });
  });

  // TWO DATES, TWO RULES (DR-0943). Darrell, 2026-10-10: "always put the
  // uploaded dates... and the other option is default however editable...
  // however the upload dat never is".
  describe('the editor, on the two dates', () => {
    const open = (host) => {
      const b = [...host.querySelectorAll('button')].find((x) => /^edit$/i.test((x.textContent || '').trim()));
      expect(b, `no Edit control. Saw: ${[...host.querySelectorAll('button')].map((x) => x.textContent.trim()).join(' | ')}`).toBeTruthy();
      act(() => { b.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
    };

    it('PROVEN-TO-CATCH: the TAKEN date is editable', () => {
      const host = render(<GalleryTab door={door} rooms={rooms} photos={[photo({ taken_at: null })]} canManage />);
      open(host);
      expect(host.querySelector('[data-testid="photo-edit-taken"]'), 'the taken date cannot be corrected').toBeTruthy();
    });

    it('the UPLOAD date is SHOWN and is never an input', () => {
      const when = '2026-10-01T15:00:00.000Z';
      const host = render(<GalleryTab door={door} rooms={rooms} photos={[photo({ uploaded_at: when })]} canManage />);
      open(host);
      const line = host.querySelector('[data-testid="photo-uploaded-at"]');
      expect(line, 'the upload date is not shown at all').toBeTruthy();
      expect(line.textContent).toMatch(/that never changes/);
      // Shown as text. Nothing in the editor offers it for typing.
      expect(line.querySelector('input')).toBeNull();
      const inputs = [...host.querySelectorAll('input')].map((i) => i.getAttribute('data-testid') || '');
      expect(inputs).not.toContain('photo-uploaded-at');
    });

    it('clearing the taken date sends NULL, not an empty string', () => {
      const saves = [];
      const host = render(
        <GalleryTab door={door} rooms={rooms} canManage
          photos={[photo({ taken_at: '2026-09-28T17:00:00.000Z' })]}
          onPatch={(id, patch) => saves.push(patch)} />,
      );
      open(host);
      const day = host.querySelector('[data-testid="photo-edit-taken"]');
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        setter.set.call(day, '');
        day.dispatchEvent(new Event('change', { bubbles: true }));
      });
      const save = host.querySelector('[data-testid="photo-edit-save"]');
      act(() => { save.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      expect(saves).toHaveLength(1);
      // An empty string into a timestamptz is an error, not a clearing.
      expect(saves[0].taken_at).toBeNull();
    });

    it('a corrected date is sent as an instant', () => {
      const saves = [];
      const host = render(
        <GalleryTab door={door} rooms={rooms} canManage
          photos={[photo({ taken_at: null })]}
          onPatch={(id, patch) => saves.push(patch)} />,
      );
      open(host);
      const day = host.querySelector('[data-testid="photo-edit-taken"]');
      act(() => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
        setter.set.call(day, '2026-09-28T16:20');
        day.dispatchEvent(new Event('change', { bubbles: true }));
      });
      act(() => { host.querySelector('[data-testid="photo-edit-save"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      expect(saves).toHaveLength(1);
      const back = new Date(saves[0].taken_at);
      expect(back.getDate()).toBe(28);
      expect(back.getHours()).toBe(16);
    });
  });

  it('a work order, damage and a move-out set are all RECORDS', () => {
    for (const k of ['work-order-before', 'work-order-after', 'damage', 'move-out-condition', 'turn', 'inspection']) {
      expect(RECORD_KINDS, `${k} must be a record`).toContain(k);
      expect(isAdvertising(k)).toBe(false);
    }
    // Exactly one kind is advertising, and it is named.
    expect([...ADVERTISING_KINDS]).toEqual(['listing']);
  });

  it('PROVEN-TO-CATCH: choosing advertising SAYS it is advertising', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage />);
    const kind = host.querySelector('[data-testid="photo-kind"]');
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value');
      setter.set.call(kind, 'listing');
      kind.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const warn = host.querySelector('[data-testid="advertising-warning"]');
    expect(warn, 'picking listing said nothing').toBeTruthy();
    expect(warn.textContent).toMatch(/This is advertising, not a record/);
    expect(warn.textContent).toMatch(/only kind a stranger can ever see/);
  });

  it('the two purposes are separate GROUPS in the picker, not one flat list', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage />);
    const groups = [...host.querySelectorAll('[data-testid="photo-kind"] optgroup')].map((g) => g.label);
    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatch(/record/i);
    expect(groups[1]).toMatch(/stranger can see/i);
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

  it('lets a 1099 worker who may ADD file pictures without handing him the landlord\'s controls (0185)', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[photo(), photo({ id: 'p2', caption: 'Bath' })]} canManage={false} canAdd />);
    expect(txt(host)).toMatch(/Add a picture/);
    expect(txt(host)).toMatch(/Take a photo/);
    expect(byText(host, /^Remove$/)).toBeUndefined();
    expect(byText(host, /^Cover$/)).toBeUndefined();
    expect(byText(host, /^Edit$/)).toBeUndefined();
  });

  it('opens the camera directly on a phone, and still takes a whole batch from storage', () => {
    const host = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage />);
    const inputs = [...host.querySelectorAll('input[type="file"]')];
    const camera = inputs.find((i) => i.getAttribute('capture') === 'environment');
    const files = inputs.find((i) => i.hasAttribute('multiple'));
    expect(camera).toBeTruthy();
    expect(camera.getAttribute('accept')).toBe('image/*');
    expect(camera.hasAttribute('multiple')).toBe(false);   // a camera returns one shot
    expect(files).toBeTruthy();
    expect(files.hasAttribute('capture')).toBe(false);
  });

  it('offers to SPEAK a caption where the browser can hear, and stays type-only where it cannot', () => {
    const typeOnly = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage />);
    expect(byText(typeOnly, /^Speak$/)).toBeUndefined();
    expect(typeOnly.querySelector('input[aria-label="the caption for the set"]')).toBeTruthy();

    // A browser with speech recognition — the one shared dictation primitive.
    class FakeSR { start() {} stop() {} }
    window.SpeechRecognition = FakeSR;
    try {
      const canHear = render(<GalleryTab door={door} rooms={rooms} photos={[]} canManage />);
      const speak = byText(canHear, /^Speak$/);
      expect(speak).toBeTruthy();
      expect(speak.getAttribute('aria-label')).toMatch(/Speak the caption for the set/);
    } finally {
      delete window.SpeechRecognition;
    }
  });

  it('draws the thumbnail in the grid and fetches the full image only when a picture is opened', async () => {
    const loadImage = vi.fn(async () => 'data:image/jpeg;base64,FULLFULL');
    const host = render(<GalleryTab
      door={door} rooms={rooms} canManage loadImage={loadImage}
      photos={[photo({ storage_path: undefined, thumb_path: 'data:image/jpeg;base64,THUMB' })]}
    />);
    const img = host.querySelector('li img');
    expect(img.getAttribute('src')).toBe('data:image/jpeg;base64,THUMB');
    expect(loadImage).not.toHaveBeenCalled();
    click(img.closest('button'));
    await act(async () => { await Promise.resolve(); });
    expect(loadImage).toHaveBeenCalledWith('p1');
    // The lightbox is up and, once the bytes land, shows the full image.
    await act(async () => { await Promise.resolve(); });
    const srcs = [...host.querySelectorAll('img')].map((i) => i.getAttribute('src'));
    expect(srcs).toContain('data:image/jpeg;base64,FULLFULL');
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
