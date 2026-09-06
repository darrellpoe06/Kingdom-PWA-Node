// =============================================================================
// legal-documents — the four legal shelves, as a real engine (DR-0329)
// =============================================================================
// Darrell 2026-09-06, looking at the Legal tab on his phone: "I need a section
// that I can upload legal documents for each of these categories."
//
// WHAT WAS THERE. The four category boxes on Books -> Legal were four hardcoded
// <ul> lists — orientation copy painted over nothing. No row, no file, no
// upload. That is the P15 failure class the reality-trace rule exists to catch:
// a surface whose value is trust, showing values that trace to no real state.
//
// WHAT THIS IS. The pure, node-testable core behind four REAL shelves. It owns
// the category taxonomy (the same four scopes LEGAL-PRIVACY-BOUNDARY.md names,
// with each category's own bullet list promoted from decoration into the
// document-type vocabulary the picker offers), the document shape, and every
// bound a file must clear before it is allowed near the vault.
//
// ── TWO WAYS TO SHELVE A DOCUMENT, ON PURPOSE ──
// LEGAL-PRIVACY-BOUNDARY.md binds documents as "pointers only, not file
// content" — a deliberate 2026-05-18 choice. Darrell's direction above asks for
// real upload. Both are honored rather than one overwriting the other:
//
//   FILE    — the bytes ride to the private `legal-documents` bucket and the
//             row carries `storagePath`. Requires a session (a file needs a
//             vault; localStorage is not one — a 10 MB PDF as a data URL would
//             blow the quota and take unrelated state down with it).
//   POINTER — the original model: no bytes, `whereFiled` says where the paper
//             actually is ("counsel's office", "fire safe, top shelf"). Always
//             available, signed in or out, on any device.
//
// A shelf that refuses a pointer when the user is offline would be a worse
// system than the placeholder it replaces.
//
// ── PRIVILEGED IS MANDATORY, AND UNSET IS NOT A VALUE ──
// The privileged flag is the single mechanical guarantee behind the export
// tool: strip privileged=true and what is left is safe to hand a non-counsel
// party. A default that saves silently produces rows nobody ever decided, and
// a wrong `false` waives privilege irrecoverably. So `privileged` starts NULL
// and validateDocument REFUSES a null — the form cannot save an undecided
// document. `true` is the recommended answer, never the automatic one.
//
// PURE BY DESIGN: no browser APIs, no storage, no network. Persistence lives in
// legal-documents-store.js and the courier in legal-documents-sync.js, so this
// engine is testable in node and the honesty rules above are PROVEN-TO-CATCH
// (DR-0076 §3) rather than asserted.
// =============================================================================

// ---------------------------------------------------------------------------
// The four scopes. `id` matches the `scope` values in LEGAL-PRIVACY-BOUNDARY.md
// so a matter and its documents can never drift onto different vocabularies.
// `docTypes` are that category's own bullets — the list that used to be static
// copy on the surface is now the picker's options, which is what makes the
// bullets true instead of decorative.
// ---------------------------------------------------------------------------
export const LEGAL_CATEGORIES = [
  {
    id: 'personal',
    label: 'Personal / family',
    blurb: 'Wills, directives, and the family-law record — the papers a household must be able to find on the worst day of its year.',
    docTypes: [
      'Will',
      'Trust instrument',
      'Estate plan',
      'Power of attorney — financial',
      'Power of attorney — healthcare',
      'Healthcare directive / DNR',
      'Beneficiary designation',
      'Family law — custody',
      'Family law — divorce',
      'Family law — adoption',
      'Family law — guardianship',
      'Immigration matter',
    ],
  },
  {
    id: 'real-estate',
    label: 'Real estate',
    blurb: 'What a door is worth is a legal question before it is a financial one — title, tenancy, assessment, and the disputes that follow.',
    docTypes: [
      'Title document / chain of title',
      'Encumbrance, easement, or lien',
      'Tenant dispute',
      'Eviction filing',
      'Property-tax appeal',
      'Code-enforcement action',
      'HOA dispute',
      'Boundary dispute',
      'Insurance claim dispute',
      'Contractor dispute',
    ],
  },
  {
    id: 'business',
    label: 'Business',
    blurb: 'Every entity carries paper it must produce on demand — formation, contracts, worker classification, and what it owns.',
    docTypes: [
      'LLC formation / articles',
      'Operating agreement',
      'Annual report / registered agent',
      'Contract — vendor',
      'Contract — contractor',
      'Contract — employment',
      'NDA',
      'Lease (as landlord or tenant)',
      '1099 / W-2 dispute',
      'IP — trademark',
      'IP — copyright',
      'IP — trade secret / infringement',
      'Commercial litigation',
      'Bankruptcy / restructuring',
      'M&A document',
    ],
  },
  {
    id: 'tax-regulatory',
    label: 'Tax & regulatory',
    blurb: 'A government letter with a response deadline is the one document class where losing the paper is the same as losing the matter.',
    docTypes: [
      'IRS notice (CP2000, CP14, audit)',
      'State tax notice or appeal',
      'Sales / use tax matter',
      'Payroll tax matter (941, state UI)',
      '1099 / W-9 compliance',
      'Professional licensing',
      'HUD / fair-housing',
      'OSHA / safety',
      'Government contracting / bid protest',
      'Regulator action',
    ],
  },
];

export const CATEGORY_IDS = LEGAL_CATEGORIES.map((c) => c.id);

export function categoryById(id) {
  return LEGAL_CATEGORIES.find((c) => c.id === id) || null;
}

export function isCategoryId(id) {
  return CATEGORY_IDS.includes(id);
}

// ---------------------------------------------------------------------------
// File bounds. A vault that accepts anything is a vault with an upload bug in
// it. These are checked BEFORE any byte is read, so a 400 MB video picked by
// mistake never reaches the network.
// ---------------------------------------------------------------------------
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB — a scanned deed, not a video

// Extension allow-list rather than a MIME allow-list, for the reason image.js
// already learned the hard way: Android pickers routinely hand the browser an
// EMPTY or application/octet-stream type for a real file, so a strict MIME test
// rejects the very document the user is standing there trying to file.
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'doc', 'docx', 'rtf', 'txt', 'md',
  'jpg', 'jpeg', 'png', 'heic', 'heif', 'webp', 'tif', 'tiff',
  'xls', 'xlsx', 'csv',
  'eml', 'msg',
  'zip',
];

export function extensionOf(name) {
  const raw = String(name || '');
  const dot = raw.lastIndexOf('.');
  if (dot < 0 || dot === raw.length - 1) return '';
  return raw.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

// A filename is user input that becomes a storage object key. Strip it to
// something a path can hold, bound its length, and never let it be empty.
export function sanitizeFileName(name) {
  const raw = String(name || '').trim();
  const ext = extensionOf(raw);
  const stem = (ext ? raw.slice(0, raw.length - ext.length - 1) : raw)
    .replace(/[^A-Za-z0-9._ -]+/g, '-')
    .replace(/[-\s]+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 60);
  const safeStem = stem || 'document';
  return ext ? `${safeStem}.${ext}` : safeStem;
}

// validateFile(file) -> { ok } | { ok:false, reason, message }
// `message` is written for the person holding the phone, not for a log.
export function validateFile(file) {
  if (!file) return { ok: false, reason: 'no-file', message: 'Pick a file first.' };
  const size = Number(file.size);
  if (Number.isFinite(size) && size <= 0) {
    return { ok: false, reason: 'empty', message: 'That file is empty — nothing was read from it.' };
  }
  if (Number.isFinite(size) && size > MAX_FILE_BYTES) {
    return {
      ok: false,
      reason: 'too-large',
      message: `That file is ${formatBytes(size)}. The shelf holds files up to ${formatBytes(MAX_FILE_BYTES)} — split a long scan, or file it as a pointer instead.`,
    };
  }
  const ext = extensionOf(file.name);
  if (!ext) {
    return { ok: false, reason: 'no-extension', message: 'That file has no extension, so its type cannot be established. Rename it and try again.' };
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      ok: false,
      reason: 'type-not-allowed',
      message: `.${ext} files are not accepted on the legal shelf. Accepted: ${ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(', ')}.`,
    };
  }
  return { ok: true };
}

export function formatBytes(bytes) {
  // ABSENT IS NOT ZERO (DR-0076). Number(null) is 0, so a plain coercion here
  // renders an unknown size as a confident "0 B" — a painted number on a
  // pointer record, which has no size at all. Caught by its own test.
  if (bytes == null || bytes === '') return '—';
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// The storage path. Folder 1 is the OWNING USER's id, which is the whole
// storage RLS policy in migration 0169: `(storage.foldername(name))[1] =
// auth.uid()::text`. Nothing about the path reveals what the document is —
// the label never leaves the table.
// ---------------------------------------------------------------------------
export function storagePathFor({ userId, slug, fileName }) {
  if (!userId || !slug) return null;
  const ext = extensionOf(fileName);
  return ext ? `${userId}/${slug}.${ext}` : `${userId}/${slug}`;
}

export function newDocumentId() {
  return `ld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// The record. `privileged` is intentionally NOT defaulted here — see the header.
// ---------------------------------------------------------------------------
export function documentShape({
  id,
  category,
  docType = '',
  label = '',
  dateOf = null,
  privileged = null,
  whereFiled = '',
  note = '',
  fileName = '',
  fileSize = null,
  storagePath = null,
  createdAt = null,
} = {}) {
  return {
    id: id || newDocumentId(),
    category: isCategoryId(category) ? category : null,
    docType: String(docType || '').trim(),
    label: String(label || '').trim(),
    dateOf: dateOf || null,
    privileged: privileged === true ? true : privileged === false ? false : null,
    whereFiled: String(whereFiled || '').trim(),
    note: String(note || '').trim(),
    fileName: String(fileName || '').trim(),
    fileSize: Number.isFinite(Number(fileSize)) && Number(fileSize) >= 0 ? Number(fileSize) : null,
    storagePath: storagePath || null,
    createdAt: createdAt || new Date().toISOString(),
  };
}

// A record with no bytes is a POINTER — the original LEGAL-PRIVACY-BOUNDARY
// model, still first-class.
export function isPointer(doc) {
  return !doc?.storagePath;
}

// validateDocument(doc) -> { ok } | { ok:false, reason, message }
// The four refusals here are the honesty rules, and each has a test that feeds
// it the breaking case.
export function validateDocument(doc) {
  if (!doc || !isCategoryId(doc.category)) {
    return { ok: false, reason: 'no-category', message: 'Every document belongs to one of the four legal categories.' };
  }
  if (!String(doc.label || '').trim()) {
    return { ok: false, reason: 'no-label', message: 'Give the document a name you will recognize a year from now.' };
  }
  // Mandatory, and unset is not a value.
  if (doc.privileged !== true && doc.privileged !== false) {
    return {
      ok: false,
      reason: 'privilege-undecided',
      message: 'Mark this document privileged or not privileged. The export tool strips privileged documents mechanically — it can only do that if every document has been decided.',
    };
  }
  // A record that carries neither bytes nor a location is not a record of
  // anything: it names a document nobody can produce.
  if (isPointer(doc) && !String(doc.whereFiled || '').trim()) {
    return {
      ok: false,
      reason: 'nowhere',
      message: 'No file was attached, so say where the document actually is (counsel’s office, the fire safe, a drawer) — otherwise this row points at nothing.',
    };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Reading the shelves.
// ---------------------------------------------------------------------------
export function normalizeDocuments(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((d) => d && isCategoryId(d.category)).map((d) => documentShape(d));
}

// Newest first — the document a user wants is nearly always the last one filed.
export function documentsInCategory(list, categoryId) {
  return normalizeDocuments(list)
    .filter((d) => d.category === categoryId)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

// Per-category counts for the shelf headers. Always returns all four keys, so a
// category with nothing in it reads 0 rather than disappearing.
export function categoryCounts(list) {
  const docs = normalizeDocuments(list);
  const out = {};
  for (const c of LEGAL_CATEGORIES) {
    const mine = docs.filter((d) => d.category === c.id);
    out[c.id] = {
      total: mine.length,
      files: mine.filter((d) => !isPointer(d)).length,
      pointers: mine.filter((d) => isPointer(d)).length,
      privileged: mine.filter((d) => d.privileged === true).length,
    };
  }
  return out;
}

// The export-tool guarantee, as a function the tool and its test both call.
// Privileged rows are REMOVED, not blanked — a blanked row still tells the
// recipient one exists, which is itself privileged information.
export function stripPrivileged(list) {
  return normalizeDocuments(list).filter((d) => d.privileged !== true);
}
