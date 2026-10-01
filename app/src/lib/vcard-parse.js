// =============================================================================
// vcard-parse — every contact in a phone's exported .vcf file, read exactly
// =============================================================================
// Darrell 2026-10-01: bring the contacts on the phone in his hand into the
// PoeTech App — all of them, or the ones he picks — so they are kept there and
// usable (text, call, email, invite), not stranded in the phone.
//
// Every phone and Google Contacts can share or export ALL contacts as one vCard
// file. This is the pure reader for that file. It handles what real exports
// contain, measured against the three vCard versions phones write:
//   * 2.1 (older Android, Outlook): QUOTED-PRINTABLE values, CHARSET params,
//     bare type words (TEL;CELL:...), lines folded with a leading space;
//   * 3.0 (iPhone, Google): TYPE=CELL params, item1.TEL groups, backslash
//     escapes (\, \; \n), folded lines (CRLF + one space or tab);
//   * 4.0: the same shapes with "tel:" URI values and PREF=1.
// It never invents a field: a contact with no name keeps an empty name, and a
// file that is not a vCard at all is reported as such, never read as "zero
// contacts" (DR-0076 rule 8: honest uncertainty, said plainly).
//
// Pure: no DOM, no network, no clock. Input is the file's text; output is plain
// data the import plan (contacts-import.js) can reason about.
// =============================================================================

/** Unfold continuation lines: CRLF/LF followed by a space or tab joins the line above. */
export function unfoldLines(text) {
  const s = String(text || '').replace(/\r\n?/g, '\n');
  return s.replace(/\n[ \t]/g, '').split('\n');
}

/** Decode a QUOTED-PRINTABLE value (vCard 2.1): =0D=0A newlines, =XX bytes, soft breaks. */
export function decodeQuotedPrintable(value) {
  const s = String(value || '').replace(/=\n/g, '');
  const bytes = [];
  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    if (ch === '=' && /^[0-9A-Fa-f]{2}$/.test(s.slice(i + 1, i + 3))) {
      bytes.push(parseInt(s.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      // A plain character; encode as UTF-8 so mixed values decode together.
      const enc = new TextEncoder().encode(ch);
      for (const b of enc) bytes.push(b);
    }
  }
  try { return new TextDecoder('utf-8', { fatal: false }).decode(Uint8Array.from(bytes)); } catch { return s; }
}

/** Undo vCard text escapes: \n newline, \, comma, \; semicolon, \\ backslash. */
export function unescapeText(value) {
  return String(value || '').replace(/\\([\\,;nN])/g, (_m, c) => (c === 'n' || c === 'N' ? '\n' : c));
}

/**
 * One content line -> { group, name, params: {KEY: [values]}, value }.
 * "item1.TEL;TYPE=CELL;PREF=1:+1 217 555 0142" -> group item1, name TEL.
 * Bare 2.1 words ("TEL;CELL;VOICE:") land under params.TYPE.
 */
export function parseLine(line) {
  const i = indexOfValueColon(line);
  if (i < 0) return null;
  const head = line.slice(0, i);
  const rawValue = line.slice(i + 1);
  const parts = head.split(';');
  let name = parts.shift() || '';
  let group = '';
  const dot = name.indexOf('.');
  if (dot > 0) { group = name.slice(0, dot); name = name.slice(dot + 1); }
  const params = {};
  for (const p of parts) {
    if (!p) continue;
    const eq = p.indexOf('=');
    const key = (eq >= 0 ? p.slice(0, eq) : 'TYPE').toUpperCase();
    const vals = (eq >= 0 ? p.slice(eq + 1) : p).split(',').map((v) => v.replace(/^"|"$/g, '').trim()).filter(Boolean);
    params[key] = (params[key] || []).concat(vals.map((v) => v.toUpperCase()));
  }
  let value = rawValue;
  if ((params.ENCODING || []).includes('QUOTED-PRINTABLE')) value = decodeQuotedPrintable(value);
  return { group, name: name.toUpperCase(), params, value };
}

// The first ':' outside a double-quoted parameter value separates name from value.
function indexOfValueColon(line) {
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') quoted = !quoted;
    else if (c === ':' && !quoted) return i;
  }
  return -1;
}

/** Split structured values on unescaped ';' and unescape each part. */
function structured(value) {
  const out = [];
  let cur = '';
  for (let i = 0; i < value.length; i += 1) {
    const c = value[i];
    if (c === '\\' && i + 1 < value.length) { cur += c + value[i + 1]; i += 1; continue; }
    if (c === ';') { out.push(unescapeText(cur)); cur = ''; continue; }
    cur += c;
  }
  out.push(unescapeText(cur));
  return out;
}

const cleanPhone = (v) => unescapeText(String(v || '').replace(/^tel:/i, '')).trim();
const cleanEmail = (v) => unescapeText(String(v || '').replace(/^mailto:/i, '')).trim().toLowerCase();

/** The N parts (family;given;additional;prefix;suffix) as one spoken name. */
export function nameFromN(value) {
  const [family = '', given = '', additional = '', prefix = '', suffix = ''] = structured(value);
  return [prefix, given, additional, family, suffix].map((s) => s.trim()).filter(Boolean).join(' ');
}

/** The ADR parts (box;extended;street;city;region;postal;country) as one line. */
export function addressFromAdr(value) {
  return structured(value).map((s) => s.trim()).filter(Boolean).join(', ');
}

/** The contacts in one vCard block (the lines between BEGIN:VCARD and END:VCARD). */
function contactFromLines(lines) {
  const c = { name: '', phones: [], emails: [], addresses: [], org: '', note: '', version: '' };
  let fromN = '';
  for (const raw of lines) {
    const p = parseLine(raw);
    if (!p) continue;
    switch (p.name) {
      case 'VERSION': c.version = p.value.trim(); break;
      case 'FN': if (!c.name) c.name = unescapeText(p.value).trim(); break;
      case 'N': if (!fromN) fromN = nameFromN(p.value); break;
      case 'TEL': { const v = cleanPhone(p.value); if (v && !c.phones.includes(v)) c.phones.push(v); break; }
      case 'EMAIL': { const v = cleanEmail(p.value); if (v && !c.emails.includes(v)) c.emails.push(v); break; }
      case 'ADR': { const v = addressFromAdr(p.value); if (v && !c.addresses.includes(v)) c.addresses.push(v); break; }
      case 'ORG': if (!c.org) c.org = structured(p.value).map((s) => s.trim()).filter(Boolean).join(', '); break;
      case 'NOTE': if (!c.note) c.note = unescapeText(p.value).trim(); break;
      default: break;
    }
  }
  if (!c.name) c.name = fromN;
  return c;
}

/**
 * Read a whole .vcf export.
 * @returns {{ contacts: Array, cards: number, skipped: number, errors: string[] }}
 *   contacts — every card that carries at least a name, a phone or an email;
 *   skipped  — cards with none of those (nothing to keep);
 *   errors   — plain-English problems, e.g. a file that is not a vCard at all.
 */
export function parseVCardFile(text) {
  const lines = unfoldLines(text);
  const out = { contacts: [], cards: 0, skipped: 0, errors: [] };
  let block = null;
  let openBlocks = 0;
  for (const line of lines) {
    const t = line.trim();
    if (/^BEGIN:VCARD$/i.test(t)) { block = []; openBlocks += 1; continue; }
    if (/^END:VCARD$/i.test(t)) {
      if (block) {
        out.cards += 1;
        const c = contactFromLines(block);
        if (c.name || c.phones.length || c.emails.length) out.contacts.push(c); else out.skipped += 1;
      }
      block = null;
      continue;
    }
    if (block) block.push(line);
  }
  if (openBlocks === 0) out.errors.push('This file is not a contacts (.vcf) file: no BEGIN:VCARD was found.');
  else if (block) out.errors.push('The file ends in the middle of a contact (a BEGIN:VCARD with no END:VCARD); that contact was not read.');
  return out;
}
