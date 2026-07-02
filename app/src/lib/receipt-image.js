// =============================================================================
// receipt-image — read a photo's EXIF, then STRIP it before the image is stored
// =============================================================================
// The photo/OCR capture front door onto the receipt-enrichment pipeline
// ([[receipt-itemize]]). Before a receipt photo becomes proof attached to a
// record, two things happen here, in this order, deterministically:
//
//   1. READ the useful metadata OUT of the original bytes — the capture
//      timestamp (EXIF DateTimeOriginal), which sharpens date-matching to the
//      bank line, and whether GPS coordinates are present.
//   2. STRIP all of it by re-encoding through a <canvas> (compressImageFile,
//      lib/image.js) — a canvas re-encode carries NO EXIF, so the STORED proof
//      image has no embedded timestamp and, crucially, NO GPS location. On a
//      family-sensitive receipt photo that location is exactly what must not
//      ride along into a shared/synced store (DATA-AS-EMPOWERMENT-NOT-EXTRACTION).
//
// So the record keeps the *facts it needs* (when the photo was taken) while the
// image bytes it stores are privacy-clean. GPS is detected-and-dropped by
// default — its presence is flagged for honesty, the coordinates are not stored.
//
// PURE + DETERMINISTIC for the parsing half (no I/O). The strip half uses the
// existing canvas compressor. No new dependency. The EXIF reader is a minimal,
// self-contained TIFF/IFD walker (DateTimeOriginal + GPS only) — enough for a
// receipt, not a general EXIF library.
// =============================================================================

import { compressImageFile } from './image.js';

// --- minimal EXIF (TIFF/IFD) reader ----------------------------------------
// A JPEG carries EXIF in an APP1 segment (marker 0xFFE1) whose payload starts
// with "Exif\0\0" then a TIFF header. We locate that TIFF block, then walk IFD0
// for the ExifIFD pointer (0x8769 -> DateTimeOriginal 0x9003) and the GPS IFD
// pointer (0x8825). Only the two fields a receipt needs are decoded.

const EXIF_TAG_DATETIME_ORIGINAL = 0x9003;
const EXIF_TAG_DATETIME = 0x0132;      // fallback (DateTime) if Original absent
const TAG_EXIF_IFD_POINTER = 0x8769;
const TAG_GPS_IFD_POINTER = 0x8825;

// Locate the TIFF header start inside a JPEG ArrayBuffer. Returns the byte
// offset of the TIFF header (just after "Exif\0\0"), or -1 if there's no APP1
// EXIF segment (a canvas-stripped / PNG / screenshot image — the common clean
// case). Scans APPn segments only; never reads scan data.
export function findTiffStart(buf) {
  const dv = new DataView(buf);
  if (dv.byteLength < 4 || dv.getUint16(0) !== 0xffd8) return -1; // not a JPEG (no SOI)
  let off = 2;
  while (off + 4 <= dv.byteLength) {
    if (dv.getUint8(off) !== 0xff) break;
    const marker = dv.getUint8(off + 1);
    if (marker === 0xd9 || marker === 0xda) break; // EOI / start-of-scan
    const size = dv.getUint16(off + 2);
    if (size < 2) break;
    if (marker === 0xe1) {
      // APP1 — check for "Exif\0\0"
      const p = off + 4;
      if (p + 6 <= dv.byteLength
        && dv.getUint8(p) === 0x45 && dv.getUint8(p + 1) === 0x78
        && dv.getUint8(p + 2) === 0x69 && dv.getUint8(p + 3) === 0x66
        && dv.getUint8(p + 4) === 0x00 && dv.getUint8(p + 5) === 0x00) {
        return p + 6; // TIFF header start
      }
    }
    off += 2 + size;
  }
  return -1;
}

// Parse the TIFF block at `tiffStart` for DateTimeOriginal + GPS presence.
// Exported separately so it is unit-testable with a crafted TIFF buffer (no
// need to synthesize a whole JPEG). Returns { capturedAt, hasGps, gps }.
export function parseTiff(buf, tiffStart) {
  const dv = new DataView(buf);
  const bomOff = tiffStart;
  const bom = dv.getUint16(bomOff);
  let little;
  if (bom === 0x4949) little = true;        // 'II'
  else if (bom === 0x4d4d) little = false;  // 'MM'
  else return { capturedAt: null, hasGps: false, gps: null };
  const u16 = (o) => dv.getUint16(o, little);
  const u32 = (o) => dv.getUint32(o, little);

  const ifd0Off = tiffStart + u32(bomOff + 4);

  // Read one IFD; return { entries: Map(tag->{type,count,valueOff}), next }.
  function readIfd(ifdOff) {
    const entries = new Map();
    if (ifdOff + 2 > dv.byteLength) return entries;
    const n = u16(ifdOff);
    for (let i = 0; i < n; i++) {
      const e = ifdOff + 2 + i * 12;
      if (e + 12 > dv.byteLength) break;
      const tag = u16(e);
      const type = u16(e + 2);
      const count = u32(e + 4);
      entries.set(tag, { type, count, valueOff: e + 8 });
    }
    return entries;
  }

  // ASCII string value: 4-byte inline or an offset from the TIFF start.
  function asciiOf(entry) {
    if (!entry || entry.type !== 2) return null;
    const len = entry.count;
    const dataOff = len <= 4 ? entry.valueOff : tiffStart + u32(entry.valueOff);
    let s = '';
    for (let i = 0; i < len && dataOff + i < dv.byteLength; i++) {
      const c = dv.getUint8(dataOff + i);
      if (c === 0) break;
      s += String.fromCharCode(c);
    }
    return s || null;
  }

  const ifd0 = readIfd(ifd0Off);
  let capturedAt = null;
  let hasGps = false;

  // ExifIFD -> DateTimeOriginal
  const exifPtr = ifd0.get(TAG_EXIF_IFD_POINTER);
  if (exifPtr) {
    const exifIfd = readIfd(tiffStart + u32(exifPtr.valueOff));
    capturedAt = asciiOf(exifIfd.get(EXIF_TAG_DATETIME_ORIGINAL))
      || asciiOf(exifIfd.get(EXIF_TAG_DATETIME));
  }
  if (!capturedAt) capturedAt = asciiOf(ifd0.get(EXIF_TAG_DATETIME));

  // GPS IFD present (we detect-and-drop; coordinates are not stored)
  if (ifd0.has(TAG_GPS_IFD_POINTER)) hasGps = true;

  return { capturedAt: normalizeExifDate(capturedAt), hasGps, gps: null };
}

// EXIF dates are "YYYY:MM:DD HH:MM:SS" -> ISO "YYYY-MM-DDTHH:MM:SS". Returns
// { raw, iso, date } or null. `date` is the YYYY-MM-DD used for bank matching.
export function normalizeExifDate(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi, s] = m;
  return { raw, iso: `${y}-${mo}-${d}T${h}:${mi}:${s}`, date: `${y}-${mo}-${d}` };
}

// readExif(arrayBuffer) — the JPEG entry point. Returns
// { capturedAt: {raw,iso,date}|null, hasGps: bool, gps: null }. A clean image
// (no APP1 EXIF) returns all-empty — not an error.
export function readExif(arrayBuffer) {
  try {
    const start = findTiffStart(arrayBuffer);
    if (start < 0) return { capturedAt: null, hasGps: false, gps: null };
    return parseTiff(arrayBuffer, start);
  } catch (_) {
    return { capturedAt: null, hasGps: false, gps: null };
  }
}

// prepareReceiptImage(file) — the capture step: read the metadata, then produce
// the privacy-clean stored image. Returns:
//   { dataUrl, exif: { capturedAt, hasGps }, name, size, strippedExif: true }
// `dataUrl` is the canvas-re-encoded JPEG with NO EXIF (safe to store/sync).
// The original File bytes are never persisted. Fails soft: if EXIF read throws,
// the strip still happens (the clean image is what matters most).
export async function prepareReceiptImage(file, { maxWidth = 1600, quality = 0.72 } = {}) {
  let exif = { capturedAt: null, hasGps: false, gps: null };
  try {
    const buf = await file.arrayBuffer();
    exif = readExif(buf);
  } catch (_) { /* unreadable EXIF — proceed to strip anyway */ }
  const dataUrl = await compressImageFile(file, maxWidth, quality); // canvas => EXIF-free
  return {
    dataUrl,
    exif: { capturedAt: exif.capturedAt, hasGps: exif.hasGps },
    name: file.name || 'receipt.jpg',
    size: file.size || 0,
    strippedExif: true,
  };
}
