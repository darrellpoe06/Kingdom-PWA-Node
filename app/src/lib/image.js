// =============================================================================
// image — client-side photo compression (no upload, no server)
// =============================================================================
// Shared by the maintenance log and the room photo galleries. Compresses a
// File to a JPEG data URL bounded to maxWidth, so photos persist in the
// device-local rental record (and ride sync as data URLs) without a blob
// store. A typical phone photo lands ~80-250 KB after this.
export function compressImageFile(file, maxWidth = 1280, quality = 0.7) {
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
    reader.readAsDataURL(file);
  });
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
