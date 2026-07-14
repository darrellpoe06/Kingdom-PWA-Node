// =============================================================================
// proclaim-email — parse the metadata out of a COLG PROCLAIM email
// =============================================================================
// Bishop Gwin emails the weekly PROCLAIM every week (from bg@thechurchofthe
// livinggod.com, cc darrellpoe06@ + mrspoe06@ + staff). The BODY of the outline —
// his numbered points + the scriptures under each — is the attached .docx, which
// prep-outline.js already parses. THIS module parses the surrounding METADATA
// from the email subject and/or the attachment filename, which encode:
//
//   "06-17-2026 PROCLAIM SCRIPTURES AND POINTS - I'M SALTY! - MATTHEW 5.13-16 NIV
//    - CHILDREN'S DAY - PROFESSOR PETE AND PASTOR AARON FORMAN.docx"
//   "04-01-2026 PROCLAIM SCRIPTURES AND POINTS FROM 03-29-2026 SERMON - THE KING
//    IS STILL HERE! JOHN 12.12-13 NIV - PALM SUNDAY!"
//
// From that we recover the choir_sermons fields (service_date, title, scripture_
// ref, speaker) so the message row can be created; prep-outline.js fills its
// points + scriptures. DESCRIPTIVE only (DR-0076): every field traces to the real
// subject/filename text; anything not present returns null, never invented.
//
// NOTE the email system replaces apostrophes with periods ("DON.T", "I.M",
// "CHILDREN.S"); we restore letter.letter -> letter'letter WITHOUT touching a
// scripture "5.13" (digit.digit). Pure + unit-tested against BG's real subjects.
// =============================================================================

// Restore apostrophes the mail system flattened to periods, leaving ch.vs alone.
function restoreApostrophes(s) {
  return String(s || '').replace(/([A-Za-z])\.([A-Za-z])/g, "$1'$2");
}

// MM-DD-YYYY -> ISO date (YYYY-MM-DD), or null. Pure (no Date.now / timezone).
function toIsoDate(mm, dd, yyyy) {
  const m = Number(mm); const d = Number(dd); const y = Number(yyyy);
  if (!(m >= 1 && m <= 12) || !(d >= 1 && d <= 31) || !(y >= 2000 && y <= 2100)) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// A scripture ref written BG's way: "MATTHEW 5.13-16 NIV" / "1 JOHN 4.8 NIV" /
// "2 KINGS 4.18-20 NKJV". Book (opt leading numeral) + ch.vs(-vs) + a translation.
// Normalizes the chapter/verse '.' to ':' for the canonical ref shape.
const REF_RE = /\b([1-3]\s+)?([A-Z][A-Za-z]+(?:\s+of\s+[A-Z][A-Za-z]+)?)\s+(\d{1,3})\.(\d{1,3}(?:-\d{1,3})?)\s+(NIV|NKJV|KJV|ESV|NLT|AMP|NASB|NRSV|MSG|CEV)\b/;

export function parseProclaimSubject(input) {
  const raw = String(input || '').replace(/\.docx$/i, '').trim();
  const out = { serviceDate: null, title: null, scriptureRef: null, translation: null, speaker: null, occasion: null, raw };
  if (!raw) return out;

  // service_date: the PREACHED date. Prefer "FROM MM-DD-YYYY SERMON"; else the
  // leading email date "MM-DD-YYYY ...".
  const fromDate = raw.match(/FROM\s+(\d{1,2})-(\d{1,2})-(\d{4})\s+W?SERMO?I?N/i);
  const leadDate = raw.match(/^(\d{1,2})-(\d{1,2})-(\d{4})\b/);
  if (fromDate) out.serviceDate = toIsoDate(fromDate[1], fromDate[2], fromDate[3]);
  else if (leadDate) out.serviceDate = toIsoDate(leadDate[1], leadDate[2], leadDate[3]);

  // scripture_ref + translation (from the whole string; the ref is unambiguous).
  const ref = raw.match(REF_RE);
  if (ref) {
    const book = `${ref[1] ? ref[1].trim() + ' ' : ''}${ref[2]}`.trim();
    out.scriptureRef = `${book} ${ref[3]}:${ref[4]}`;
    out.translation = ref[5];
  }

  // speaker: a trailing "- <TITLE> <NAME>" where TITLE is a clergy honorific. BG
  // is the default when none is named (handled by the caller, not invented here).
  const sp = raw.match(/-\s*((?:SENIOR\s+)?(?:PASTOR|BISHOP|PROFESSOR|ELDER|MINISTER|REV(?:EREND)?|DEACON|EVANGELIST)\b[^-]*?)\s*!?\s*$/i);
  if (sp) out.speaker = restoreApostrophes(sp[1].replace(/\s+/g, ' ').trim());

  // occasion: a known church day, if named.
  const occ = raw.match(/\b(FATHER'?\.?S DAY|MOTHER'?\.?S DAY|PALM SUNDAY|CHILDREN'?\.?S DAY|RESURRECTION SUNDAY|EASTER|CHRISTMAS|WATCH NIGHT|PENTECOST|COMMUNION|HOMECOMING|ANNIVERSARY)\b/i);
  if (occ) out.occasion = restoreApostrophes(occ[1]);

  // title: the phrase after the PROCLAIM/SERMON separator, before the scripture
  // ref. Strip the leading "... PROCLAIM ... [FROM date SERMON] -" preamble.
  let body = raw
    .replace(/^.*?\bPROCLAIM\b(?:\s+SCRIPTURES\s+AND\s+POINTS)?(?:\s+FROM\s+\d{1,2}-\d{1,2}-\d{4}\s+W?SERMO?I?N)?\s*-?\s*/i, '')
    .trim();
  if (ref && ref.index != null) {
    // cut the title at the scripture ref if it sits inside `body`
    const idx = body.search(REF_RE);
    if (idx > 0) body = body.slice(0, idx);
  }
  // drop a trailing speaker/occasion tail from the title
  body = body.replace(/-\s*(?:(?:SENIOR\s+)?(?:PASTOR|BISHOP|PROFESSOR|ELDER|MINISTER|REV(?:EREND)?|DEACON|EVANGELIST)\b|FATHER|MOTHER|PALM|CHILDREN|RESURRECTION|EASTER|CHRISTMAS|WATCH|PENTECOST|COMMUNION|HOMECOMING|ANNIVERSARY).*$/i, '');
  body = body.replace(/[-\s]+$/, '').trim();
  if (body) out.title = restoreApostrophes(body);
  return out;
}

export default parseProclaimSubject;
