// @vitest-environment node
//
// legal-documents — the four legal shelves (DR-0329).
//
// PROVEN-TO-CATCH (DR-0076 §3). Every honesty rule this engine claims is tested
// by feeding it the case that would BREAK it and requiring the refusal. A shelf
// that only asserted the happy path would be theatre — and on this surface, of
// all of them, a wrong "saved" is worse than no shelf at all:
//
//   • An UNDECIDED privileged flag is refused. This is the whole mechanical
//     guarantee behind the privileged-stripped export: strip privileged=true
//     and what remains is safe to hand a non-counsel party. One undecided row
//     defeats that for the entire matter, so `null` is not a value.
//   • A record with NEITHER bytes NOR a location is refused — it names a
//     document nobody can produce.
//   • Counts are computed, never painted: an empty category reads 0 and is
//     still present, rather than vanishing.
//   • stripPrivileged REMOVES rows rather than blanking them — a blanked row
//     still tells the recipient a privileged document exists, which is itself
//     privileged information.
//   • The file bounds refuse before any byte is read.
import { describe, it, expect } from 'vitest';
import {
  ALLOWED_EXTENSIONS,
  CATEGORY_IDS,
  LEGAL_CATEGORIES,
  MAX_FILE_BYTES,
  categoryById,
  categoryCounts,
  documentShape,
  documentsInCategory,
  extensionOf,
  formatBytes,
  isPointer,
  newDocumentId,
  normalizeDocuments,
  sanitizeFileName,
  storagePathFor,
  stripPrivileged,
  validateDocument,
  validateFile,
} from '../lib/legal-documents.js';

const filed = (over = {}) => documentShape({
  category: 'personal',
  label: 'Will — 2024',
  privileged: true,
  storagePath: 'user-1/ld-1.pdf',
  ...over,
});

describe('the four categories', () => {
  it('matches the scopes LEGAL-PRIVACY-BOUNDARY names, so a matter and its documents cannot drift apart', () => {
    expect(CATEGORY_IDS).toEqual(['personal', 'real-estate', 'business', 'tax-regulatory']);
  });

  it('every category offers a real document vocabulary — the bullets are options, not decoration', () => {
    for (const c of LEGAL_CATEGORIES) {
      expect(c.docTypes.length).toBeGreaterThan(4);
      expect(c.blurb.length).toBeGreaterThan(20);
    }
    expect(categoryById('nope')).toBeNull();
  });
});

describe('validateDocument — the refusals', () => {
  it('REFUSES an undecided privileged flag (the export guarantee)', () => {
    const undecided = documentShape({ category: 'personal', label: 'Will', storagePath: 'u/1.pdf' });
    expect(undecided.privileged).toBeNull();          // starts undecided, on purpose
    const res = validateDocument(undecided);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('privilege-undecided');
  });

  it('accepts an explicit false — the rule is "decided", not "always privileged"', () => {
    expect(validateDocument(filed({ privileged: false })).ok).toBe(true);
  });

  it('REFUSES a record with neither bytes nor a location', () => {
    const nowhere = documentShape({ category: 'business', label: 'NDA', privileged: true });
    const res = validateDocument(nowhere);
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('nowhere');
  });

  it('ACCEPTS a pointer that says where the paper is — the offline path stays first-class', () => {
    const pointer = documentShape({
      category: 'business', label: 'Operating agreement', privileged: true, whereFiled: "counsel's office",
    });
    expect(isPointer(pointer)).toBe(true);
    expect(validateDocument(pointer).ok).toBe(true);
  });

  it('REFUSES an unnamed document and an uncategorised one', () => {
    expect(validateDocument(filed({ label: '   ' })).reason).toBe('no-label');
    expect(validateDocument({ ...filed(), category: 'made-up' }).reason).toBe('no-category');
  });
});

describe('validateFile — bounds checked before a byte is read', () => {
  it('REFUSES a file over the cap, and says how big it actually was', () => {
    const res = validateFile({ name: 'scan.pdf', size: MAX_FILE_BYTES + 1 });
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('too-large');
    expect(res.message).toMatch(/26\.0 MB|25\.0 MB/);
  });

  it('REFUSES an executable dressed as a document, and an empty file', () => {
    expect(validateFile({ name: 'will.exe', size: 100 }).reason).toBe('type-not-allowed');
    expect(validateFile({ name: 'will.pdf', size: 0 }).reason).toBe('empty');
    expect(validateFile({ name: 'noext', size: 100 }).reason).toBe('no-extension');
  });

  it('ACCEPTS the formats a household actually scans with', () => {
    for (const ext of ['pdf', 'jpg', 'heic', 'docx', 'png']) {
      expect(ALLOWED_EXTENSIONS).toContain(ext);
      expect(validateFile({ name: `doc.${ext}`, size: 1024 }).ok).toBe(true);
    }
  });
});

describe('storage paths cannot escape their owner', () => {
  it('puts the owning user id first, which IS the storage RLS rule', () => {
    expect(storagePathFor({ userId: 'u-1', slug: 'ld-9', fileName: 'Will.PDF' })).toBe('u-1/ld-9.pdf');
  });

  it('strips traversal and separators out of a filename', () => {
    expect(sanitizeFileName('../../etc/passwd.pdf')).not.toMatch(/\.\.|\//);
    expect(sanitizeFileName('  my will (final).pdf ')).toMatch(/^[A-Za-z0-9._-]+\.pdf$/);
    expect(sanitizeFileName('....pdf')).toMatch(/\.pdf$/);
    expect(extensionOf('a.b.TIFF')).toBe('tiff');
  });

  it('refuses to build a path with no owner', () => {
    expect(storagePathFor({ userId: null, slug: 'ld-1', fileName: 'a.pdf' })).toBeNull();
  });
});

describe('counts are computed, never painted', () => {
  it('reports every category including the empty ones, and splits files from pointers', () => {
    const docs = [
      filed(),
      filed({ category: 'personal', privileged: false }),
      documentShape({ category: 'business', label: 'NDA', privileged: true, whereFiled: 'drawer' }),
    ];
    const counts = categoryCounts(docs);
    expect(Object.keys(counts).sort()).toEqual([...CATEGORY_IDS].sort());
    expect(counts.personal).toEqual({ total: 2, files: 2, pointers: 0, privileged: 1 });
    expect(counts.business).toEqual({ total: 1, files: 0, pointers: 1, privileged: 1 });
    // An empty category is PRESENT and zero — it does not disappear.
    expect(counts['real-estate'].total).toBe(0);
  });

  it('drops records with no real category rather than counting them somewhere', () => {
    expect(normalizeDocuments([{ category: 'bogus', label: 'x' }, null, filed()])).toHaveLength(1);
    expect(normalizeDocuments('not a list')).toEqual([]);
  });

  it('lists a category newest-first', () => {
    const older = filed({ label: 'older', createdAt: '2024-01-01T00:00:00.000Z' });
    const newer = filed({ label: 'newer', createdAt: '2026-01-01T00:00:00.000Z' });
    expect(documentsInCategory([older, newer], 'personal').map((d) => d.label)).toEqual(['newer', 'older']);
  });
});

describe('stripPrivileged — the export guarantee', () => {
  it('REMOVES privileged rows rather than blanking them', () => {
    const out = stripPrivileged([filed({ label: 'A' }), filed({ label: 'B', privileged: false })]);
    expect(out.map((d) => d.label)).toEqual(['B']);
  });

  it('also removes an UNDECIDED row — unknown is never treated as safe to share', () => {
    const undecided = documentShape({ category: 'personal', label: 'U', storagePath: 'u/1.pdf' });
    expect(stripPrivileged([undecided]).map((d) => d.label)).toEqual(['U']);
  });
});

describe('ids and formatting', () => {
  it('mints distinct ids', () => {
    expect(newDocumentId()).not.toBe(newDocumentId());
  });
  it('formats sizes, and reports an unknown size as an em dash rather than 0 B', () => {
    expect(formatBytes(null)).toBe('—');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0 MB');
  });
});
