// isLikelyImageFile — the picker gate behind the Feedback and Receipts photo
// intakes (DR-0121 item 9, proven-to-catch). The 2026-07-07 "couldn't upload
// an image" class: Android camera/Files picks can hand the browser a real
// photo with an EMPTY (or application/octet-stream) MIME type, and the old
// strict `/^image\//` test rejected it before the decoder ever saw it. Pinned:
// MIME wins when present, the extension rescues an absent/opaque MIME, and
// non-images stay out.
import { describe, it, expect } from 'vitest';
import { isLikelyImageFile } from '../lib/image.js';

const F = (name, type) => ({ name, type });

describe('isLikelyImageFile', () => {
  it('accepts a real MIME-typed image regardless of extension', () => {
    expect(isLikelyImageFile(F('shot.png', 'image/png'))).toBe(true);
    expect(isLikelyImageFile(F('weird.bin', 'image/jpeg'))).toBe(true);
  });

  it('rescues a blank-MIME photo by extension — the Android pick that used to be rejected', () => {
    expect(isLikelyImageFile(F('6532.jpg', ''))).toBe(true);
    expect(isLikelyImageFile(F('IMG_0001.HEIC', ''))).toBe(true);
    expect(isLikelyImageFile(F('capture.webp', 'application/octet-stream'))).toBe(true);
  });

  it('still rejects non-images', () => {
    expect(isLikelyImageFile(F('doc.pdf', 'application/pdf'))).toBe(false);
    expect(isLikelyImageFile(F('notes.txt', ''))).toBe(false);
    expect(isLikelyImageFile(F('report.pdf', 'application/octet-stream'))).toBe(false);
    expect(isLikelyImageFile(null)).toBe(false);
  });

  it('a named non-image MIME is trusted over an image-looking extension', () => {
    // A .jpg that declares itself a PDF is not decodable as an image; the
    // declared type wins so the decoder is not fed garbage.
    expect(isLikelyImageFile(F('really-a.pdf.jpg', 'application/pdf'))).toBe(false);
  });
});
