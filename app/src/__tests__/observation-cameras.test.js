// Observation camera registry — proven-to-catch (DR-0076). These lock the
// three honesty properties the Cameras section rests on:
//   1. URL classification tells the truth about what a browser can render
//      (rtsp never plays; http-on-https is blocked, not silently broken)
//   2. the registry helpers stay pure and shape-stable
//   3. camera METADATA survives snapshot-sync's stripPhotoBytes (rides the
//      family snapshot) while photo BYTES still get stripped — paint over
//      either side of that split and a case here fails.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createElement } from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import {
  CAMERA_BRANDS, brandLabel, classifyStreamUrl, mixedContentBlocked,
  makeCamera, camerasOf, upsertCamera, removeCamera, streamStatus, pickLiveView,
} from '../lib/observation-cameras.js';
import { stripPhotoBytes } from '../lib/snapshot-sync.js';
import { ChurchObservation } from '../components/ChurchObservation.jsx';

describe('CAMERA_BRANDS', () => {
  it('offers wyze / generic-rtsp / ip-http / other, each with a setup hint', () => {
    expect(CAMERA_BRANDS.map((b) => b.id)).toEqual(['wyze', 'generic-rtsp', 'ip-http', 'other']);
    for (const b of CAMERA_BRANDS) expect(b.hint.length).toBeGreaterThan(10);
  });
  it('the Wyze hint names the RTSP firmware and the NAS bridge (no painted "live")', () => {
    const wyze = CAMERA_BRANDS.find((b) => b.id === 'wyze');
    expect(wyze.hint).toMatch(/RTSP firmware/);
    expect(wyze.hint).toMatch(/NAS restream bridge/);
  });
  it('brandLabel resolves ids and falls back for unknowns', () => {
    expect(brandLabel('wyze')).toBe('Wyze');
    expect(brandLabel('nope')).toBe('Camera');
  });
});

describe('classifyStreamUrl — the honesty table', () => {
  const table = [
    ['rtsp://user:pass@192.168.1.50/live', 'rtsp'],
    ['RTSP://192.168.1.50/live', 'rtsp'],
    ['rtsps://cam.local/stream', 'rtsp'],
    ['https://nas.local/cam1/index.m3u8', 'hls'],
    ['https://nas.local/cam1/index.m3u8?token=abc', 'hls'],
    ['http://192.168.1.50/snapshot.jpg', 'mjpeg-or-snapshot'],
    ['https://cam.local/img/current.jpeg', 'mjpeg-or-snapshot'],
    ['http://192.168.1.50:8080/video.mjpg', 'mjpeg-or-snapshot'],
    ['http://192.168.1.50/mjpeg/1', 'mjpeg-or-snapshot'],
    ['http://cam.local/cgi-bin/snapshot.cgi?chn=0', 'mjpeg-or-snapshot'],
    ['http://192.168.1.50/video.cgi', 'mjpeg-or-snapshot'],
    ['http://192.168.1.50/', 'http-page'],
    ['https://cam.local/admin/settings', 'http-page'],
    ['ftp://cam.local/stream', 'unknown'],
    ['not a url', 'unknown'],
    ['', 'unknown'],
    ['   ', 'unknown'],
    [null, 'unknown'],
    [undefined, 'unknown'],
  ];
  it.each(table)('%s -> %s', (url, expected) => {
    expect(classifyStreamUrl(url)).toBe(expected);
  });
});

describe('mixedContentBlocked — http on the https app is named, not silent', () => {
  it('blocks http:// URLs on an https page', () => {
    expect(mixedContentBlocked('http://192.168.1.50/snapshot.jpg', 'https:')).toBe(true);
  });
  it('does not block https URLs, http pages, or rtsp (which never plays anyway)', () => {
    expect(mixedContentBlocked('https://cam.local/snapshot.jpg', 'https:')).toBe(false);
    expect(mixedContentBlocked('http://192.168.1.50/snapshot.jpg', 'http:')).toBe(false);
    expect(mixedContentBlocked('rtsp://192.168.1.50/live', 'https:')).toBe(false);
    expect(mixedContentBlocked('', 'https:')).toBe(false);
    expect(mixedContentBlocked(null, 'https:')).toBe(false);
  });
});

describe('makeCamera — pure record shaping', () => {
  it('trims fields and keeps the passed-in id and timestamp (no Date inside)', () => {
    const cam = makeCamera({
      id: ' cam-1 ', name: '  Foyer door ', brand: 'wyze',
      streamUrl: ' rtsp://192.168.1.50/live ', snapshotUrl: '', location: ' NE corner ',
      notes: 'aim at door', addedAt: '2026-07-05T00:00:00.000Z',
    });
    expect(cam).toEqual({
      id: 'cam-1', name: 'Foyer door', brand: 'wyze',
      streamUrl: 'rtsp://192.168.1.50/live', snapshotUrl: '', location: 'NE corner',
      notes: 'aim at door', addedAt: '2026-07-05T00:00:00.000Z',
    });
  });
  it('normalizes unknown brands to other and tolerates missing fields', () => {
    expect(makeCamera({ id: 'c', name: 'x', brand: 'acme' }).brand).toBe('other');
    expect(makeCamera().streamUrl).toBe('');
  });
});

describe('camerasOf / upsertCamera / removeCamera', () => {
  const a = { id: 'cam-a', name: 'A' };
  const b = { id: 'cam-b', name: 'B' };
  it('camerasOf normalizes older space records with no cameras key', () => {
    expect(camerasOf({ id: 'sp-1' })).toEqual([]);
    expect(camerasOf(null)).toEqual([]);
    expect(camerasOf({ cameras: [a] })).toEqual([a]);
  });
  it('upsert appends new ids and replaces existing ones in place', () => {
    const one = upsertCamera(undefined, a);
    expect(one).toEqual([a]);
    const two = upsertCamera(one, b);
    expect(two).toEqual([a, b]);
    const edited = upsertCamera(two, { id: 'cam-a', name: 'A2' });
    expect(edited.map((c) => c.name)).toEqual(['A2', 'B']);
    expect(upsertCamera(two, { name: 'no id' })).toEqual(two);
  });
  it('remove filters by id and tolerates a missing array', () => {
    expect(removeCamera([a, b], 'cam-a')).toEqual([b]);
    expect(removeCamera(undefined, 'cam-a')).toEqual([]);
  });
});

describe('streamStatus — the chip never over-claims', () => {
  it('rtsp is registered-awaiting-bridge, never "live"', () => {
    const s = streamStatus({ streamUrl: 'rtsp://192.168.1.50/live' }, 'https:');
    expect(s.kind).toBe('rtsp');
    expect(s.label).toMatch(/awaiting NAS bridge/);
    expect(s.label).not.toMatch(/live now/i);
  });
  it('http snapshot on the https app reads blocked, not viewable', () => {
    const s = streamStatus({ streamUrl: 'http://192.168.1.50/snapshot.jpg' }, 'https:');
    expect(s.kind).toBe('mixed-blocked');
    expect(s.label).toMatch(/blocked/);
  });
  it('the same snapshot over http (LAN) is viewable; hls names the Safari caveat', () => {
    expect(streamStatus({ streamUrl: 'http://192.168.1.50/snapshot.jpg' }, 'http:').kind).toBe('mjpeg-or-snapshot');
    expect(streamStatus({ streamUrl: 'https://nas.local/c.m3u8' }, 'https:').label).toMatch(/Safari/);
  });
  it('no URLs -> "No URL yet"; snapshot-only is named', () => {
    expect(streamStatus({}, 'https:').kind).toBe('none');
    expect(streamStatus({ snapshotUrl: 'https://cam.local/s.jpg' }, 'https:').kind).toBe('snapshot-only');
    expect(streamStatus({ snapshotUrl: 'http://cam.local/s.jpg' }, 'https:').kind).toBe('mixed-blocked');
  });
});

describe('pickLiveView — attempt only what can actually render', () => {
  it('img for snapshot/mjpeg, video for hls', () => {
    expect(pickLiveView({ streamUrl: 'https://cam.local/s.jpg' }, 'https:')).toEqual({ mode: 'img', url: 'https://cam.local/s.jpg' });
    expect(pickLiveView({ streamUrl: 'https://nas.local/c.m3u8' }, 'https:')).toEqual({ mode: 'video', url: 'https://nas.local/c.m3u8' });
  });
  it('a Wyze with rtsp stream + https snapshot shows the snapshot, not a fake stream', () => {
    const cam = { streamUrl: 'rtsp://192.168.1.50/live', snapshotUrl: 'https://nas.local/wyze1.jpg' };
    expect(pickLiveView(cam, 'https:')).toEqual({ mode: 'img', url: 'https://nas.local/wyze1.jpg' });
  });
  it('rtsp-only lands on the bridge state; http-on-https lands on blocked', () => {
    expect(pickLiveView({ streamUrl: 'rtsp://192.168.1.50/live' }, 'https:').mode).toBe('bridge');
    expect(pickLiveView({ streamUrl: 'http://192.168.1.50/s.jpg' }, 'https:').mode).toBe('blocked');
    expect(pickLiveView({ streamUrl: 'http://192.168.1.50/s.jpg' }, 'http:').mode).toBe('img');
  });
  it('camera web pages open direct; nothing registered is honest about it', () => {
    expect(pickLiveView({ streamUrl: 'http://192.168.1.50/' }, 'https:').mode).toBe('page');
    expect(pickLiveView({}, 'https:').mode).toBe('none');
  });
});

// The load-bearing sync property: the camera REGISTRY rides the family
// snapshot while photo BYTES stay device-local. stripPhotoBytes drops keys
// literally named `photos` and data: URL strings — `cameras` must survive.
describe('snapshot-sync integration — cameras survive stripPhotoBytes', () => {
  const B64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRg';
  const space = {
    id: 'sp-foyer', name: 'Foyer', note: 'watch the door',
    photos: [{ id: 'ph1', src: B64, at: '2026-07-05T00:00:00.000Z' }],
    cameras: [makeCamera({
      id: 'cam-1', name: 'Foyer door', brand: 'wyze',
      streamUrl: 'rtsp://user:pass@192.168.1.50/live',
      snapshotUrl: 'http://192.168.1.50/snapshot.jpg',
      location: 'NE ceiling', notes: '', addedAt: '2026-07-05T00:00:00.000Z',
    })],
  };
  const out = stripPhotoBytes({ churchObservation: { spaces: [space] } });
  const stripped = out.churchObservation.spaces[0];

  it('the cameras array survives intact — name, brand, both URLs, location', () => {
    expect(stripped.cameras).toHaveLength(1);
    expect(stripped.cameras[0]).toEqual(space.cameras[0]);
  });
  it('the photo bytes are still stripped from the same space record', () => {
    expect(stripped.photos).toBeUndefined();
    expect(JSON.stringify(out).includes('base64')).toBe(false);
  });
});

// The surface itself (Reality-Trace P16: observe the real render, don't assume).
// jsdom mount of the real ChurchObservation with real props — the same two
// props the monolith passes (observation + updateChurchObservation).
describe('ChurchObservation render — the Cameras section is live, not painted', () => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  let container, root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  const wyzeCam = makeCamera({
    id: 'cam-1', name: 'Foyer door', brand: 'wyze',
    streamUrl: 'rtsp://192.168.1.50/live', location: 'NE ceiling',
    addedAt: '2026-07-05T00:00:00.000Z',
  });
  const observation = {
    spaces: [
      { id: 'sp-main', name: 'Main Worship Area', capacity: 600, photos: [], note: '', updatedAt: '', cameras: [wyzeCam] },
      { id: 'sp-foyer', name: 'Foyer', photos: [], note: '', updatedAt: '' },
    ],
  };
  const mount = (props = {}) => act(() =>
    root.render(createElement(ChurchObservation, { observation, updateChurchObservation: () => {}, ...props })));
  const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  const setValue = (el, value) => act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  it('lists a registered camera with the honest RTSP chip and the header count', () => {
    mount();
    expect(container.textContent).toMatch(/Foyer door/);
    expect(container.textContent).toMatch(/Wyze · NE ceiling/);
    expect(container.textContent).toMatch(/RTSP · registered — awaiting NAS bridge/);
    expect(container.textContent).toMatch(/1 camera\b/);
    // The one quiet privacy line about credentialed URLs.
    expect(container.textContent).toMatch(/stream URLs may embed credentials/i);
    // The photos behavior is untouched: the add-photos control still renders.
    expect(container.textContent).toMatch(/Add photos/);
  });

  it('View on an RTSP camera shows the bridge state + copy affordance, never a fake player', () => {
    mount();
    click([...container.querySelectorAll('button')].find((b) => b.textContent === 'View'));
    expect(container.textContent).toMatch(/RTSP cannot play in a browser; live view arrives with the NAS restream bridge/);
    expect([...container.querySelectorAll('button')].some((b) => /Copy RTSP URL/.test(b.textContent))).toBe(true);
    expect(container.querySelector('video')).toBeFalsy();
    // Open direct exists and is a real link to the registered URL.
    const direct = [...container.querySelectorAll('a')].find((a) => /Open direct/.test(a.textContent));
    expect(direct.getAttribute('href')).toBe('rtsp://192.168.1.50/live');
    expect(direct.getAttribute('rel')).toMatch(/noopener/);
  });

  it('adding a camera writes a real record through updateChurchObservation (the snapshot rail)', () => {
    const writes = [];
    mount({ updateChurchObservation: (u) => writes.push(u) });
    // Open the add form on the Foyer tile (sp-foyer has no cameras yet).
    const addBtns = [...container.querySelectorAll('button')].filter((b) => b.textContent === '+ Add camera');
    expect(addBtns.length).toBe(2); // one per space tile
    click(addBtns[1]);
    setValue(container.querySelector('#cam-sp-foyer-new-name'), 'Foyer cam 2');
    setValue(container.querySelector('#cam-sp-foyer-new-stream'), 'http://192.168.1.51/snapshot.jpg');
    click([...container.querySelectorAll('button')].find((b) => b.textContent === 'Add camera'));
    expect(writes.length).toBe(1);
    const foyer = writes[0].spaces.find((s) => s.id === 'sp-foyer');
    expect(foyer.cameras).toHaveLength(1);
    expect(foyer.cameras[0]).toMatchObject({ name: 'Foyer cam 2', brand: 'wyze', streamUrl: 'http://192.168.1.51/snapshot.jpg' });
    expect(foyer.cameras[0].id).toMatch(/^cam-/);
    expect(foyer.cameras[0].addedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    // The already-registered camera on the other space is untouched.
    expect(writes[0].spaces.find((s) => s.id === 'sp-main').cameras).toEqual([wyzeCam]);
  });
});
