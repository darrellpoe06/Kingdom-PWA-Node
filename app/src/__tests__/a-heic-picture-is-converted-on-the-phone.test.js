// =============================================================================
// A HEIC PICTURE IS CONVERTED ON THE PHONE (DR-0916)
// =============================================================================
// Darrell, 2026-10-10, a screenshot of the PoeTech app on his Samsung: "Skipped
// 14: 6660.heic (the image could not be decoded on this device (HEIC or an
// unsupported format?))" ... "When is this fixed?!!!!!!!"
//
// jsdom has no image decoder, so this stands in a browser that behaves like
// Chrome on Android: it decodes JPEG and refuses HEIC. The converter is the
// real call shape of heic-to/csp, injected.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { compressImageFile, compressImageToFile, looksHeic, heicToJpeg } from '../lib/image.js';

// The first 12 bytes of a real iPhone HEIC: size, 'ftyp', major brand 'heic'.
const HEIC_HEAD = [0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63];
const heicFile = (name = '6660.heic', type = '') => new File([new Uint8Array([...HEIC_HEAD, 1, 2, 3])], name, { type });
const jpegFile = () => new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], 'porch.jpg', { type: 'image/jpeg' });

let RealImage; let createElement;
beforeEach(() => {
  RealImage = globalThis.Image;
  // A browser that decodes JPEG only (as Chrome on Android does with HEIC).
  globalThis.Image = class {
    constructor() { this.width = 4032; this.height = 3024; }
    set src(v) {
      this._src = v;
      setTimeout(() => (/^data:image\/jpeg/.test(v) ? this.onload() : this.onerror()), 0);
    }
    get src() { return this._src; }
  };
  createElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag) => (tag === 'canvas'
    ? { width: 0, height: 0, getContext: () => ({ drawImage: () => {} }), toDataURL: function td() { return `data:image/jpeg;base64,SHRUNK-${this.width}x${this.height}`; } }
    : createElement(tag)));
});
afterEach(() => { globalThis.Image = RealImage; vi.restoreAllMocks(); });

describe('what is a HEIC', () => {
  it('by its bytes, whatever the name or type says', async () => {
    expect(await looksHeic(heicFile('IMG_1.jpg', ''))).toBe(true);           // renamed, still HEIC inside
    expect(await looksHeic(heicFile('x', 'application/octet-stream'))).toBe(true);
    expect(await looksHeic(new File(['x'], 'a.HEIF', { type: '' }))).toBe(true); // by name when the bytes say nothing
    expect(await looksHeic(new File(['x'], 'a.png', { type: 'image/heic' }))).toBe(true);
    expect(await looksHeic(jpegFile())).toBe(false);
  });
});

describe('the picture is kept, not skipped', () => {
  it('PROVEN-TO-CATCH: a HEIC this device cannot decode is converted, then shrunk like any picture', async () => {
    const heic = vi.fn(async () => new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' }));
    const out = await compressImageFile(heicFile(), 1280, 0.7, { heic });
    expect(heic).toHaveBeenCalledTimes(1);
    expect(out).toBe('data:image/jpeg;base64,SHRUNK-1280x960');
  });

  it('the full picture and its thumbnail share one conversion', async () => {
    const heic = vi.fn(async () => new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' }));
    const f = heicFile();
    await compressImageFile(f, 1280, 0.7, { heic });
    await compressImageFile(f, 640, 0.75, { heic });
    expect(heic).toHaveBeenCalledTimes(1);
  });

  it('without the converter the old failure is exactly what happens (the bug, reproduced)', async () => {
    await expect(compressImageFile(heicFile(), 1280, 0.7, { heic: async () => { throw new Error('no converter'); } }))
      .rejects.toThrow('no converter');
  });

  it('a JPEG never loads the converter', async () => {
    const heic = vi.fn();
    expect(await compressImageFile(jpegFile(), 1280, 0.7, { heic })).toBe('data:image/jpeg;base64,SHRUNK-1280x960');
    expect(heic).not.toHaveBeenCalled();
  });

  it('a file that is not a picture at all still says it could not be decoded', async () => {
    const heic = vi.fn();
    await expect(compressImageFile(new File(['%PDF'], 'lease.pdf', { type: 'application/pdf' }), 1280, 0.7, { heic }))
      .rejects.toThrow(/could not be decoded on this device/);
    expect(heic).not.toHaveBeenCalled();
  });

  it('the bucket road (compressImageToFile) gets a .jpg File from a HEIC too', async () => {
    globalThis.fetch = vi.fn(async () => ({ blob: async () => new Blob(['j'], { type: 'image/jpeg' }) }));
    vi.doMock('heic-to/csp', () => ({ heicTo: async () => new Blob([new Uint8Array([0xff, 0xd8])], { type: 'image/jpeg' }) }));
    const f = await compressImageToFile(heicFile('6659.heic'));
    expect(f.name).toBe('6659.jpg');
    expect(f.type).toBe('image/jpeg');
    vi.doUnmock('heic-to/csp');
  });
});

describe('the converter is bounded and honest', () => {
  it('asks libheif for a JPEG of the file', async () => {
    const heicTo = vi.fn(async () => new Blob(['j'], { type: 'image/jpeg' }));
    const f = heicFile();
    await heicToJpeg(f, { load: async () => ({ heicTo }) });
    expect(heicTo).toHaveBeenCalledWith({ blob: f, type: 'image/jpeg', quality: 0.92 });
  });

  it('a conversion that hangs gives up and says so, never spins forever', async () => {
    await expect(heicToJpeg(heicFile(), { timeoutMs: 20, load: async () => ({ heicTo: () => new Promise(() => {}) }) }))
      .rejects.toThrow(/could not be converted on this device \(converting this HEIC picture took longer than 0 seconds\)/);
  });

  it('a decoder that fails to load says so in plain words', async () => {
    await expect(heicToJpeg(heicFile(), { load: async () => { throw new Error('chunk failed'); } }))
      .rejects.toThrow('this HEIC picture could not be converted on this device (chunk failed)');
  });
});
