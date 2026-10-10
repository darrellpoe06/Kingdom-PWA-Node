// =============================================================================
// heic — decode the pictures a phone actually takes
// =============================================================================
// Darrell, 2026-10-10, on the Add a picture panel with fourteen photographs
// refused in one go:
//
//   "Skipped 14: 6660.heic (the image could not be decoded on this device
//    (HEIC or an unsupported format?)), 6659.heic ... "
//   "I want to accept this type of images!!! Fix it!!!"
//
// WHAT WAS MEASURED. The picker was never the problem: isLikelyImageFile has
// accepted `.heic` and `.heif` by extension all along (image.js:42). The
// refusal came from the DECODER — compressImageFile hands the bytes to an
// <img> and waits, and an <img> on Android Chrome cannot decode HEIC. So the
// file was read, offered, accepted, and then dropped at the last step with a
// message that correctly guessed its own cause and could do nothing about it.
//
// HEIC IS THE DEFAULT ON EVERY RECENT iPHONE, and this is the move-out
// condition set for a unit — the photographs a deposit argument turns on.
// Fourteen of them went nowhere.
//
// THE DECODE IS REAL, AND IT IS PROVEN ON A REAL FILE. libheif (the reference
// implementation, compiled to WASM) decodes the bytes to RGBA and a canvas
// re-encodes that as JPEG, which every surface here already handles. The gate
// beside this file decodes an actual HEIC — written by libheif's own encoder,
// not a stub — and checks the pixels that come back.
//
// LAZY ON PURPOSE. The decoder is several megabytes; it is imported only when
// a HEIC is actually in front of us, so nobody who never touches one pays for
// it. Bundled from npm rather than fetched from a CDN, matching how
// onnxruntime-web and the phonemizer already ride here.
// =============================================================================

/**
 * ISO-BMFF brands that mean "there is a HEIF image in here". Sniffed from the
 * BYTES rather than trusted from the name, because the name is exactly what is
 * unreliable: Android hands the browser an empty or octet-stream MIME often
 * enough that image.js already has a comment about it, and a file picked from
 * a cloud provider can arrive with no extension at all.
 */
const BRANDS = ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'];

/** Is this byte array a HEIF/HEIC image? Reads the ftyp box, nothing else. */
export function looksHeicBytes(bytes) {
  const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (b.length < 12) return false;
  // bytes 4..8 are 'ftyp' on every ISO-BMFF file; 8..12 is the major brand.
  if (String.fromCharCode(b[4], b[5], b[6], b[7]) !== 'ftyp') return false;
  const major = String.fromCharCode(b[8], b[9], b[10], b[11]).toLowerCase();
  if (BRANDS.includes(major)) return true;
  // The major brand can be something else (mp42, iso8) while a COMPATIBLE
  // brand further in says heic. Scan the rest of the ftyp box in 4-byte steps.
  const size = (b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3];
  const end = Math.min(size > 0 ? size : 32, b.length);
  for (let i = 16; i + 4 <= end; i += 4) {
    const brand = String.fromCharCode(b[i], b[i + 1], b[i + 2], b[i + 3]).toLowerCase();
    if (BRANDS.includes(brand)) return true;
  }
  return false;
}

/** The cheap guess, by name and MIME, for deciding whether to read the bytes. */
export function looksHeicName(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  if (type === 'image/heic' || type === 'image/heif') return true;
  return /\.(heic|heif)$/i.test(String(file.name || ''));
}

// One decoder for the page. The WASM module costs real time to instantiate and
// nothing about it is per-file.
let heifPromise = null;
function libheif() {
  if (!heifPromise) {
    heifPromise = import('libheif-js/wasm-bundle').then((m) => m.default || m);
  }
  return heifPromise;
}

<<<<<<< HEAD
// THE SAME FILE IS DECODED TWICE, AND THAT IS THE CALLER'S SHAPE, NOT A BUG
// TO ARGUE WITH. The picker compresses every photo twice — once for the image
// and once for its thumbnail (DoorTabs.jsx:1232) — so a naive HEIC path does
// the WASM decode twice per file. On fourteen twelve-megapixel photographs
// that is twenty-eight decodes, which on a phone is about a minute of a panel
// that looks frozen. Halved by remembering the LAST decode, because the two
// calls are back to back.
//
// EXACTLY ONE ENTRY, deliberately. A WeakMap keyed by File would look tidier
// and would be a memory disaster here: the picker holds all fourteen Files
// alive for the whole loop, so every decoded frame would be retained —
// 12MP x 4 bytes is ~48MB each, ~670MB for the batch. One entry means the
// second call hits and the previous frame is released the moment a new file
// arrives.
let lastKey = null;
let lastPixels = null;

const fileKey = (file) => (file
  ? `${file.name || ''}|${file.size || 0}|${file.lastModified || 0}`
  : null);

/** Only for tests, so one case cannot leak its stub or its frame into the next. */
export function _resetHeicDecoder() {
  heifPromise = null;
  lastKey = null;
  lastPixels = null;
}
=======
/** Only for tests, so one case cannot leak its stub into the next. */
export function _resetHeicDecoder() { heifPromise = null; }
>>>>>>> origin/main

/**
 * Decode HEIC bytes to raw pixels: { width, height, data } where data is RGBA.
 *
 * Pure of the DOM on purpose — no canvas, no Image, no window — so the gate can
 * run it against a real .heic file in Node and look at the pixels. The browser
 * half below is then only the part a browser must do.
 *
 * Throws with a sentence a person can act on. "No images found" is a real and
 * distinct outcome: a container that is structurally a HEIF but holds no image
 * item (an ffmpeg-made file does exactly this), and calling that "unsupported"
 * would send someone hunting the wrong problem.
 */
export async function decodeHeicToRgba(bytes, { loader = libheif } = {}) {
  const mod = await loader();
  const Decoder = mod && mod.HeifDecoder;
  if (typeof Decoder !== 'function') throw new Error('the HEIC decoder could not be loaded');
  const images = new Decoder().decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
  if (!images || !images.length) {
    throw new Error('that file is a HEIC container with no picture inside it');
  }
  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();
  if (!width || !height) throw new Error('that HEIC reported no size');
  const out = await new Promise((resolve, reject) => {
    try {
      image.display(
        { data: new Uint8ClampedArray(width * height * 4), width, height },
        (shown) => (shown ? resolve(shown) : reject(new Error('the HEIC could not be rendered'))),
      );
    } catch (e) { reject(e instanceof Error ? e : new Error(String(e))); }
  });
  return { width, height, data: out.data };
}

/**
 * A HEIC File to a JPEG data URL, bounded to maxWidth — the same thing
 * compressImageFile returns for every other format, so every caller downstream
 * is untouched and a HEIC becomes an ordinary picture the moment it is read.
 */
export async function heicFileToJpegDataUrl(file, maxWidth = 1280, quality = 0.7, io = {}) {
  const decode = io.decodeHeicToRgba || decodeHeicToRgba;
<<<<<<< HEAD
  const key = fileKey(file);
  let pixels = key && key === lastKey ? lastPixels : null;
  if (!pixels) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    pixels = await decode(bytes);
    // Replace, never accumulate — see the note on the one-entry cache above.
    lastKey = key;
    lastPixels = pixels;
  }
  const { width, height, data } = pixels;
=======
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { width, height, data } = await decode(bytes);
>>>>>>> origin/main

  const doc = io.document || (typeof document === 'undefined' ? null : document);
  if (!doc) throw new Error('no canvas to draw the HEIC on');

  // Draw at full size first: ImageData cannot be scaled as it is written, and
  // scaling the PIXELS by hand would be a worse resampler than the one the
  // browser already has.
  const full = doc.createElement('canvas');
  full.width = width;
  full.height = height;
  const fctx = full.getContext('2d');
  const image = new ImageData(new Uint8ClampedArray(data), width, height);
  fctx.putImageData(image, 0, 0);

  const ratio = width > maxWidth ? maxWidth / width : 1;
  if (ratio === 1) return full.toDataURL('image/jpeg', quality);

  const small = doc.createElement('canvas');
  small.width = Math.round(width * ratio);
  small.height = Math.round(height * ratio);
  small.getContext('2d').drawImage(full, 0, 0, small.width, small.height);
  return small.toDataURL('image/jpeg', quality);
}
