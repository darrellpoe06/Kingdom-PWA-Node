// =============================================================================
// properties/staging — draft tenancies from the family's OWN records
// =============================================================================
// WHY THIS EXISTS (a fake boundary, caught and removed): the launch plan said
// entering the twelve doors' tenancies was "Darrell / Christina's hand." The
// DR-0108 challenge — run, not assumed — says otherwise: their records are
// reachable (Drive holds a real lease; Gmail is connected), so READING them and
// PROPOSING draft tenancies is channel-drivable work. Only the confirmation is
// theirs. Carrying the whole step as a human step was the boundary DR-0236 and
// the ari-guard exist to catch.
//
// THE LAW OF THIS FILE — PROPOSE, NEVER ASSERT (DR-0076):
//   · Every draft carries `provenance`: which record it was read from, and the
//     exact substring the value came from. A value with no source is not emitted.
//   · Anything the record does not say stays null and is NAMED as missing. The
//     extractor never fills a gap with a plausible guess — an invented lease
//     date on a real tenancy is worse than an empty field.
//   · `needsConfirmation` is true on every draft, always. Nothing here writes a
//     tenancy; the landlord's confirmation does, and that is the whole point.
//   · An image-only scan yields whatever the FILENAME honestly carries and says
//     plainly that the pages are unreadable — measured 2026-08-26 on the real
//     "Leonard Morris Lease 2022-23.pdf": 9 pages, zero extractable text.
//
// PURE: no I/O, no React. The caller supplies records; this decides what may be
// proposed from them.
// =============================================================================

/** A value the extractor is willing to stand behind: what it is, and from where. */
const found = (value, quote) => ({ value, quote: String(quote || '').trim().slice(0, 120) });

const MONTHS = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec';

/** "Leonard Morris Lease 2022-23.pdf" → name + term. The filename IS a record. */
export function fromFilename(filename = '') {
  const base = String(filename).replace(/\.[a-z0-9]+$/i, '').trim();
  const m = /^(.+?)\s+lease\s+(\d{4})\s*[-–]\s*(\d{2,4})$/i.exec(base);
  if (!m) return null;
  const [, name, startYear, endRaw] = m;
  const endYear = endRaw.length === 2 ? String(Number(startYear.slice(0, 2) + endRaw)) : endRaw;
  return {
    tenantName: found(name.trim(), base),
    leaseStart: found(`${startYear}-01-01`, base),
    leaseEnd: found(`${endYear}-12-31`, base),
    termIsYearOnly: true,   // the filename gives a YEAR, never a day — say so
  };
}

const RENT_RE = /(?:monthly\s+rent|rent(?:al)?\s+(?:amount|of)?)\D{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i;
const DEPOSIT_RE = /(?:security\s+)?deposit\D{0,20}\$?\s*([\d,]+(?:\.\d{2})?)/i;
const DATE_RE = new RegExp(`((?:${MONTHS})[a-z]*\\.?\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}\\/\\d{1,2}\\/\\d{2,4}|\\d{4}-\\d{2}-\\d{2})`, 'i');

/** Facts a TEXT lease actually states. Absent → null, never guessed. */
export function fromLeaseText(text = '') {
  const src = String(text || '');
  if (!src.trim()) return {};
  const out = {};
  const rent = RENT_RE.exec(src);
  if (rent) out.monthlyRent = found(Number(rent[1].replace(/,/g, '')), rent[0]);
  const dep = DEPOSIT_RE.exec(src);
  if (dep) out.deposit = found(Number(dep[1].replace(/,/g, '')), dep[0]);
  const term = /(?:term|beginning|commenc\w*)\D{0,40}/i.exec(src);
  if (term) {
    const d = DATE_RE.exec(src.slice(term.index, term.index + 200));
    if (d) out.leaseStart = found(d[1], d[0]);
  }
  // The TLD must not swallow a sentence-ending period: "…@example.com." would
  // otherwise be stored as an address nobody can reach (caught by the test).
  const email = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/.exec(src);
  if (email) out.tenantEmail = found(email[0].toLowerCase(), email[0]);
  const phone = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/.exec(src);
  if (phone) out.tenantPhone = found(phone[0], phone[0]);
  return out;
}

/** Every field a tenancy needs, so "what is still missing" is a real answer. */
export const TENANCY_FIELDS = Object.freeze([
  'tenantName', 'tenantEmail', 'tenantPhone', 'leaseStart', 'leaseEnd', 'monthlyRent', 'deposit',
]);

/**
 * One record in → one draft out. `record` is { id, title, text, kind }.
 * Returns { draft, provenance, missing, notes, needsConfirmation } — or null
 * when the record says nothing a tenancy could be built from (silence is a
 * legitimate answer; a draft with no tenant name is noise).
 */
export function stageFromRecord(record = {}) {
  const { id = '', title = '', text = '', kind = 'drive-file' } = record;
  const byName = fromFilename(title) || {};
  const byText = fromLeaseText(text);
  const fields = { ...byName, ...byText };            // stated text beats the filename
  delete fields.termIsYearOnly;

  if (!fields.tenantName) return null;

  const draft = {};
  const provenance = {};
  for (const key of TENANCY_FIELDS) {
    if (fields[key]) { draft[key] = fields[key].value; provenance[key] = { source: id || title, kind, quote: fields[key].quote }; }
    else draft[key] = null;
  }

  const notes = [];
  if (byName.termIsYearOnly && !byText.leaseStart) {
    notes.push('The lease dates come from the file NAME, which gives a year and not a day — confirm the real start and end.');
  }
  if (!String(text || '').trim()) {
    notes.push('This record is an image scan with no readable text, so only the file name could be read. Everything else is blank on purpose.');
  }

  return {
    draft,
    provenance,
    missing: TENANCY_FIELDS.filter((k) => draft[k] === null),
    notes,
    needsConfirmation: true,
  };
}

/** Stage a batch; records that say nothing are dropped, not padded. */
export function stageFromRecords(records = []) {
  return records.map(stageFromRecord).filter(Boolean);
}

/**
 * Turn a CONFIRMED draft into the tenancy row. Refuses an unconfirmed draft and
 * refuses a draft with no door chosen — the record can name a person, only the
 * landlord can say which door is theirs.
 */
export function tenancyRowFromDraft(staged, { instanceId, rentalRef, propertyLabel, unitLabel, confirmed } = {}) {
  if (!staged || staged.needsConfirmation !== false) return { ok: false, reason: 'not-confirmed' };
  if (!confirmed) return { ok: false, reason: 'not-confirmed' };
  if (!instanceId || !rentalRef) return { ok: false, reason: 'no-door' };
  const d = staged.draft || {};
  if (!d.tenantName) return { ok: false, reason: 'no-tenant' };
  return {
    ok: true,
    row: {
      instance_id: instanceId,
      rental_ref: rentalRef,
      property_label: propertyLabel || null,
      unit_label: unitLabel || null,
      tenant_name: d.tenantName,
      tenant_email: d.tenantEmail || null,
      tenant_phone: d.tenantPhone || null,
      lease_start: d.leaseStart || null,
      lease_end: d.leaseEnd || null,
      monthly_rent: Number(d.monthlyRent) || 0,
      deposit: Number(d.deposit) || 0,
      status: 'active',
    },
  };
}

/** Mark a draft confirmed by a human. The only way needsConfirmation goes false. */
export function confirmDraft(staged) {
  return staged ? { ...staged, needsConfirmation: false } : staged;
}
