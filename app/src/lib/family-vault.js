// =============================================================================
// family-vault — the household's own shelf of documents (DR-0357)
// =============================================================================
// Darrell 2026-09-11: "We also need a PoeTech family documents upload."
//
// A row on this shelf is EITHER a file in the private `family-documents`
// bucket OR a pointer to where the paper actually lives. Both are first class
// (0180 decided this for the legal shelves and it is right here too): a family
// that keeps its deed in a fire safe should be able to record THAT without
// scanning it, and a scan is not more real than the paper.
//
// PRIVATE BY DEFAULT. A document belongs to whoever put it there until they
// share it with the household. This is not a technicality — a household member
// must not open another's will, custody file or medical letter because they
// live in the same house.
//
// WHAT THIS IS NOT: it is not encrypted with a key only the family holds.
// The bucket is private, every open is a short-lived signed URL, and the row
// says who may see it — but the operator of the database could read the bytes.
// The covenant says this in words. A private shelf, not a safe deposit box.
//
// Pure: no React, no network. The seam is family-vault-sync.js.
// =============================================================================

/** The shelves a household actually keeps — each with what belongs on it. */
export const VAULT_CATEGORIES = Object.freeze([
  { id: 'identity', label: 'Who we are', hint: 'Birth certificates, passports, Social Security cards, marriage licence.', sensitive: true },
  { id: 'home', label: 'The home', hint: 'Deed or lease, mortgage papers, survey, warranties, the closing packet.' },
  { id: 'money', label: 'The money', hint: 'Tax returns, statements worth keeping, loan papers, receipts that matter.' },
  { id: 'insurance', label: 'Insurance', hint: 'Policies and declaration pages: home, auto, life, health.' },
  { id: 'vehicle', label: 'Vehicles', hint: 'Titles, registrations, service history.' },
  { id: 'school', label: 'School', hint: 'Enrollment, transcripts, immunization forms the school asks for.' },
  { id: 'faith', label: 'Faith', hint: 'Membership, baptism, the covenants we have made.' },
  { id: 'health-admin', label: 'Health paperwork', hint: 'Cards, directives, the forms a front desk asks for. Not a medical record.', sensitive: true },
  { id: 'work', label: 'Work', hint: 'Contracts, licences, certifications, the 1099s we send or receive.' },
  { id: 'legacy', label: 'What outlasts us', hint: 'Will, trust, power of attorney, the letter for after.', sensitive: true },
  { id: 'other', label: 'Everything else', hint: 'The ones that do not fit a shelf yet.' },
]);

export const VAULT_CATEGORY_IDS = Object.freeze(VAULT_CATEGORIES.map((c) => c.id));

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const ALLOWED_TYPES = Object.freeze([
  'application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

export function categoryLabel(id) {
  const c = VAULT_CATEGORIES.find((x) => x.id === id);
  return c ? c.label : id;
}

/** A stable, readable id from a label: the-deed-on-maple, unique among `existing`. */
export function documentSlug(label, existing = []) {
  const base = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'document';
  let slug = base; let n = 2;
  while (existing.includes(slug)) { slug = `${base}-${n}`; n += 1; }
  return slug;
}

/** What is wrong with a document about to be filed. Empty = nothing. */
export function validateDocument(doc = {}) {
  const errors = [];
  if (!String(doc.label || '').trim()) errors.push('give the document a name you would recognize in a year');
  if (!VAULT_CATEGORY_IDS.includes(doc.category)) errors.push('choose the shelf it belongs on');
  const hasFile = !!String(doc.storagePath || '').trim();
  const hasPlace = !!String(doc.whereFiled || '').trim();
  if (!hasFile && !hasPlace) errors.push('either upload the file or say where the paper is — a record of neither names a document nobody can produce');
  if (doc.dateOf && !/^\d{4}-\d{2}-\d{2}$/.test(doc.dateOf)) errors.push('the date must be a real date');
  if (doc.expiresOn && !/^\d{4}-\d{2}-\d{2}$/.test(doc.expiresOn)) errors.push('the expiry must be a real date');
  return errors;
}

export function validateFile(file) {
  if (!file) return { ok: false, message: 'No file chosen.' };
  if (Number(file.size) > MAX_FILE_BYTES) return { ok: false, message: 'That file is over 25 MB. A PDF export or a phone photo is usually far smaller.' };
  if (file.type && !ALLOWED_TYPES.includes(file.type)) return { ok: false, message: 'That kind of file is not accepted here. A PDF, a picture or a document works.' };
  return { ok: true, message: '' };
}

/** The path a file takes in the bucket: `<owner user id>/<slug>.<ext>` — the first folder IS the access rule. */
export function documentPath({ userId, slug, fileName }) {
  const ext = String(fileName || '').includes('.') ? String(fileName).split('.').pop().toLowerCase().slice(0, 8) : 'bin';
  return `${userId}/${slug}.${ext}`;
}

const isoToday = () => new Date().toISOString().slice(0, 10);

/** Documents expiring within `days`, soonest first — the shelf's own reminder. */
export function expiringSoon(rows = [], days = 60, today = isoToday()) {
  const limit = new Date(`${today}T00:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + days);
  const end = limit.toISOString().slice(0, 10);
  return rows
    .filter((r) => r && r.expiresOn && r.expiresOn <= end)
    .sort((a, b) => String(a.expiresOn).localeCompare(String(b.expiresOn)));
}

/** How the shelf stands: per category, how many and how many are files. Honest counts only. */
export function shelfSummary(rows = []) {
  const byCategory = VAULT_CATEGORIES.map((c) => {
    const mine = rows.filter((r) => r && r.category === c.id);
    return { id: c.id, label: c.label, total: mine.length, files: mine.filter((r) => r.storagePath).length, pointers: mine.filter((r) => !r.storagePath).length };
  });
  return {
    total: rows.length,
    files: rows.filter((r) => r && r.storagePath).length,
    pointers: rows.filter((r) => r && !r.storagePath).length,
    shared: rows.filter((r) => r && r.sharedWithHousehold).length,
    empty: byCategory.filter((c) => c.total === 0).map((c) => c.label),
    byCategory,
  };
}
