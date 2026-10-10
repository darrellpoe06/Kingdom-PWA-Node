// =============================================================================
// image — client-side photo compression (no upload, no server)
// =============================================================================
// Shared by the maintenance log and the room photo galleries. Compresses a
// File to a JPEG data URL bounded to maxWidth, so photos persist in the
// device-local rental record (and ride sync as data URLs) without a blob
// store. A typical phone photo lands ~80-250 KB after this.
function decodeToDataUrl(blob, maxWidth, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      // Reject with real Errors (an Image error event has no .message, so
      // callers' `(e && e.message)` used to render "unknown error" — the
      // 2026-07-07 "couldn't upload an image" report class).
      img.onerror = () => reject(new Error('the image could not be decoded on this device (HEIC or an unsupported format?)'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('the file could not be read from storage'));
    reader.readAsDataURL(blob);
  });
}

// HEIC / HEIF (DR-0916). Darrell 2026-10-10, a screenshot of the PoeTech app on
// his Samsung: "Skipped 14: 6660.heic (the image could not be decoded on this
// device ...)" and "When is this fixed?!!!!!!!". iPhones and many Samsungs
// shoot HEIC; Safari decodes it, Chrome on Android does not. So the device's
// own decoder goes first (free, and right on an iPhone), and only a file whose
// BYTES say HEIC is converted here: libheif (heic-to, the CSP build — a wasm
// decoder in a blob: worker, both allowed by our CSP) loaded on demand, so
// nobody downloads it until they pick a HEIC picture. The converted JPEG then
// takes the ordinary road: shrunk, stamped, stored.
const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1'];
export const HEIC_CONVERT_TIMEOUT_MS = 60000;
// The first bytes of a file. Blob.arrayBuffer() is missing on some older
// WebViews, so FileReader is the fallback.
function readHead(blob) {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('the file could not be read from storage'));
    r.readAsArrayBuffer(blob);
  });
}
export async function looksHeic(file) {
  if (!file) return false;
  const type = String(file.type || '').toLowerCase();
  if (type === 'image/heic' || type === 'image/heif' || type === 'image/heic-sequence' || type === 'image/heif-sequence') return true;
  try {
    // ISO-BMFF: bytes 4..7 'ftyp', 8..11 the major brand.
    const head = new Uint8Array(await readHead(file.slice(0, 12)));
    const ascii = String.fromCharCode(...head);
    if (ascii.slice(4, 8) === 'ftyp' && HEIC_BRANDS.includes(ascii.slice(8, 12))) return true;
  } catch { /* unreadable head: fall back to the name */ }
  return /\.(heic|heif)$/i.test(file.name || '');
}

/** Convert a HEIC file to a JPEG Blob on this device, bounded in time. */
export async function heicToJpeg(file, { timeoutMs = HEIC_CONVERT_TIMEOUT_MS, load = () => import('heic-to/csp') } = {}) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`converting this HEIC picture took longer than ${Math.round(timeoutMs / 1000)} seconds`)), timeoutMs);
  });
  try {
    const { heicTo } = await Promise.race([load(), timeout]);
    return await Promise.race([heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 }), timeout]);
  } catch (e) {
    throw new Error(`this HEIC picture could not be converted on this device (${(e && e.message) || 'unknown error'})`, { cause: e });
  } finally {
    clearTimeout(timer);
  }
}

// One conversion per picked file: the gallery asks for the full picture and
// its thumbnail from the same File, and a HEIC is converted once for both.
const converted = new WeakMap();

export async function compressImageFile(file, maxWidth = 1280, quality = 0.7, { heic = heicToJpeg } = {}) {
  try {
    return await decodeToDataUrl(file, maxWidth, quality);
  } catch (native) {
    if (!(await looksHeic(file))) throw native;
    let jpeg = converted.get(file);
    if (!jpeg) {
      jpeg = heic(file);
      converted.set(file, jpeg);
      jpeg.catch(() => converted.delete(file));   // a failed try is not remembered
    }
    return decodeToDataUrl(await jpeg, maxWidth, quality);
  }
}

// isLikelyImageFile — the PICKER gate, deliberately looser than a strict MIME
// check. Android camera/Files picks sometimes hand the browser a file with an
// EMPTY (or application/octet-stream) type; a `/^image\//` test then rejects a
// real photo as "not an image" — the exact "couldn't upload an image" failure
// Darrell hit (2026-07-07). Accept by MIME when present, by extension when the
// MIME is absent/opaque, and let the decoder be the real judge (its failure is
// caught and messaged by every caller).
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|heic|heif|bmp|avif)$/i;
export function isLikelyImageFile(file) {
  if (!file) return false;
  const type = (file.type || '').toLowerCase();
  if (type.startsWith('image/')) return true;
  if (type && type !== 'application/octet-stream') return false;
  return IMAGE_EXT.test(file.name || '');
}

// Read ANY file (PDF, doc, txt) to a data URL, unchanged — the non-image path for
// uploads that ride in a row as a data URL (Christina 2026-07-04 team-doc uploads).
// The caller size-caps first (choir-sync classifyUpload); this just reads.
export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// compressImageToFile — the BLOB-STORE sibling of compressImageFile.
// Same bounded re-encode, but it yields a real File for a bucket upload rather
// than a data URL for a row. Written 2026-08-31 after the showcase audit found
// the gallery serving its ORIGINALS: 10.6 MB and 7.3 MB for two cards in a
// two-up grid rendered at ~180 CSS px, ~30 MB for twelve thumbnails. The
// sovereign stack has no imgproxy (infra/nas-supabase/docker-compose.yml runs
// no image-transform service), so a /render/image transform URL would break
// the moment the blobs land there — bounding the bytes AT UPLOAD is the fix
// that is true on both backends. 1600px keeps a piece crisp full-screen.
export async function compressImageToFile(file, maxWidth = 1600, quality = 0.8) {
  const dataUrl = await compressImageFile(file, maxWidth, quality);
  const blob = await (await fetch(dataUrl)).blob();
  const base = String(file?.name || 'image').replace(/\.[^.]+$/, '') || 'image';
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' });
}
