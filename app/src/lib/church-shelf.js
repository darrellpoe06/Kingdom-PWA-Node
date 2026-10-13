// =============================================================================
// church-shelf — a person's own shelf of documents at their church (0209)
// =============================================================================
// Darrell 2026-09-11: "We also need a Love Corner documents upload and a
// process for analytics and services to be created based on the information."
//
// The pure half of that: what kinds of paper a church actually holds for a
// person, what makes a filing valid, and where the bytes go. No network, no
// React, no clock of its own — so the rules are provable without a database.
//
// TWO KINDS OF ROW, BOTH FIRST CLASS. A shelf entry is EITHER a file uploaded
// into the private bucket OR a pointer to where the paper physically lives
// ("the blue folder at home", "the office filing cabinet"). Most of what a
// church holds for a person is paper somebody already has; a system that only
// accepts uploads quietly tells that person their record does not exist. The
// table refuses a row that is neither (0209's has_something check) and so does
// validateChurchDocument() here — the client one gives a plain sentence, the
// server one is the wall.
//
// WHAT IS NOT HERE, ON PURPOSE: no giving statement, no pledge, no bank letter.
// The record refuses a giving amount by table constraint (0209); a shelf that
// accepted a giving statement as a "document" would walk straight around it.
// =============================================================================

export const CHURCH_DOC_KINDS = Object.freeze([
  { id: 'certificate', label: 'Certificate', means: 'Baptism, membership, marriage, dedication — the paper the church itself issued.' },
  { id: 'ministry', label: 'Ministry paperwork', means: 'A background check on file, a driver authorization, a ministry application or covenant.' },
  { id: 'training', label: 'Training or credential', means: 'A class completed, a certification, a license the church needs a copy of.' },
  { id: 'medical-release', label: 'Release or consent', means: 'A photo release, a youth trip consent, an emergency contact form.' },
  { id: 'identification', label: 'Identification', means: 'Only if the office actually asked for it. Never uploaded speculatively.' },
  { id: 'correspondence', label: 'Letter or correspondence', means: 'A transfer letter from another church, a reference, a note from the pastor.' },
  { id: 'other', label: 'Something else', means: 'Anything the church holds for you that the shelves above do not name.' },
]);

export const CHURCH_DOC_KIND_IDS = Object.freeze(CHURCH_DOC_KINDS.map((k) => k.id));

/**
 * Kinds a shelf REFUSES, and the reason a reader gets. A giving statement is
 * refused because the record is built so a church cannot learn what a person
 * gives — letting it arrive as an attachment would undo that in one upload.
 */
export const CHURCH_DOC_REFUSED = Object.freeze({
  giving: 'The church does not hold your giving statement here. What you give is between you and Yahweh; Givelify sends your own statement to you.',
});

export const MAX_CHURCH_FILE_BYTES = 25 * 1024 * 1024;

export const CHURCH_ALLOWED_TYPES = Object.freeze([
  'application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

export function churchDocKindLabel(id) {
  const k = CHURCH_DOC_KINDS.find((x) => x.id === id);
  return k ? k.label : 'Something else';
}

/** A slug a person would recognize, derived from the title they typed. */
export function churchDocumentSlug(title = '') {
  const base = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return base || 'document';
}

/** What is wrong with a filing about to be made. Empty array = nothing. */
export function validateChurchDocument(doc = {}) {
  const errors = [];
  const title = String(doc.title || '').trim();
  if (!title) errors.push('give the document a name you would recognize in a year');
  if (!CHURCH_DOC_KIND_IDS.includes(doc.kind)) errors.push('choose the shelf it belongs on');
  const hasFile = !!String(doc.storagePath || '').trim();
  const hasPaper = !!String(doc.paperLocation || '').trim();
  if (!hasFile && !hasPaper) {
    errors.push('either upload the file or say where the paper is — a record of neither names a document nobody can produce');
  }
  if (/giving statement|tithe statement|contribution statement/i.test(title)) {
    errors.push(CHURCH_DOC_REFUSED.giving);
  }
  return errors;
}

export function validateChurchFile(file) {
  if (!file) return { ok: false, message: 'No file chosen.' };
  if (Number(file.size) > MAX_CHURCH_FILE_BYTES) {
    return { ok: false, message: 'That file is over 25 MB. A PDF export or a phone photo is usually far smaller.' };
  }
  if (file.type && !CHURCH_ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, message: 'That kind of file is not accepted here. A PDF, a picture or a document works.' };
  }
  return { ok: true, message: '' };
}

/**
 * Where the bytes live: `<instance id>/<user id>/<slug>.<ext>`.
 * The SECOND folder is the access rule — 0209's storage policies read
 * foldername(name)[2] and compare it to auth.uid(), so this layout is not a
 * convention, it is the enforcement. Change it and the bucket locks you out.
 */
export function churchDocumentPath({ instanceId, userId, slug, fileName }) {
  const ext = String(fileName || '').includes('.')
    ? String(fileName).split('.').pop().toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin'
    : 'bin';
  return `${instanceId}/${userId}/${churchDocumentSlug(slug)}.${ext}`;
}

/** How the shelf stands: per kind, how many, and how many are actually files. */
export function churchShelfSummary(rows = []) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  const byKind = CHURCH_DOC_KINDS.map((k) => {
    const mine = list.filter((r) => r.kind === k.id);
    return { id: k.id, label: k.label, count: mine.length, files: mine.filter((r) => r.storagePath).length };
  }).filter((x) => x.count > 0);
  return {
    total: list.length,
    files: list.filter((r) => r.storagePath).length,
    pointers: list.filter((r) => !r.storagePath && r.paperLocation).length,
    shared: list.filter((r) => r.sharedWithOffice === true).length,
    byKind,
  };
}
