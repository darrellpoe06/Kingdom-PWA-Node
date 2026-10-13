// =============================================================================
// vault-import — "pull my passwords in": the exports people already have
// =============================================================================
// Pure. A CSV (or Bitwarden JSON) is read IN THE BROWSER, shaped into vault
// items, previewed, and only then encrypted and kept. The file never goes
// anywhere. Formats are recognised by their header row, never guessed by file
// name; an unrecognised header falls back to a generic mapping only when it
// carries a password column, otherwise the import says plainly it cannot read
// the file.
//
// Header rows, as the exporters write them (verified against each product's
// documented export; a column we do not list is kept in notes, never lost):
//   Chrome / Edge / Brave : name,url,username,password,note
//   Firefox               : url,username,password,httpRealm,formActionOrigin,guid,timeCreated,timeLastUsed,timePasswordChanged
//   Bitwarden (CSV)       : folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp
//   Bitwarden (JSON)      : { items: [{ type: 1, name, notes, login: { uris: [{ uri }], username, password, totp } }] }
//   1Password (CSV)       : Title,Url,Username,Password,Notes,OTPAuth (8.x export; older: title,website,username,password,notes)
//   LastPass              : url,username,password,totp,extra,name,grouping,fav
//   KeePass / KeePassXC   : "Group","Title","Username","Password","URL","Notes","TOTP",...
//   Dashlane              : username,username2,username3,title,password,note,url,category,otpSecret
// =============================================================================
import { normalizeItem, hostOf } from './vault-crypto.js';

/** RFC 4180-ish CSV: quotes, doubled quotes, newlines inside quotes, CRLF. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const s = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i += 1; } else { quoted = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((f) => f !== '')) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f !== '')) rows.push(row);
  return rows;
}

const norm = (h) => String(h || '').trim().toLowerCase().replace(/[\s_-]+/g, '');

// Each format: how to recognise its header, and which normalised header feeds which field.
export const FORMATS = Object.freeze([
  { id: 'bitwarden', label: 'Bitwarden', match: (h) => h.includes('loginusername') && h.includes('loginpassword'),
    map: { name: 'name', url: 'loginuri', username: 'loginusername', password: 'loginpassword', notes: 'notes', totp: 'logintotp', favorite: 'favorite' } },
  { id: 'lastpass', label: 'LastPass', match: (h) => h.includes('url') && h.includes('password') && h.includes('extra') && h.includes('grouping'),
    map: { name: 'name', url: 'url', username: 'username', password: 'password', notes: 'extra', totp: 'totp', favorite: 'fav' } },
  { id: 'dashlane', label: 'Dashlane', match: (h) => h.includes('title') && h.includes('password') && h.includes('otpsecret'),
    map: { name: 'title', url: 'url', username: 'username', password: 'password', notes: 'note', totp: 'otpsecret' } },
  { id: 'onepassword', label: '1Password', match: (h) => (h.includes('title') && h.includes('password') && (h.includes('url') || h.includes('website')) && !h.includes('group')),
    map: { name: 'title', url: ['url', 'website'], username: 'username', password: 'password', notes: 'notes', totp: 'otpauth' } },
  { id: 'keepass', label: 'KeePass', match: (h) => h.includes('group') && h.includes('title') && h.includes('password'),
    map: { name: 'title', url: 'url', username: 'username', password: 'password', notes: 'notes', totp: 'totp' } },
  { id: 'firefox', label: 'Firefox', match: (h) => h.includes('url') && h.includes('password') && h.includes('formactionorigin'),
    map: { name: null, url: 'url', username: 'username', password: 'password', notes: null, totp: null } },
  { id: 'chrome', label: 'Chrome / Edge / Brave', match: (h) => h.includes('name') && h.includes('url') && h.includes('username') && h.includes('password'),
    map: { name: 'name', url: 'url', username: 'username', password: 'password', notes: 'note' } },
  { id: 'generic', label: 'Generic CSV', match: (h) => h.includes('password'),
    map: { name: ['name', 'title', 'site'], url: ['url', 'website', 'uri', 'login_uri'], username: ['username', 'user', 'login', 'email'], password: 'password', notes: ['notes', 'note', 'extra'], totp: ['totp', 'otp', 'otpauth'] } },
]);

export function detectFormat(headerRow) {
  const h = (headerRow || []).map(norm);
  return FORMATS.find((f) => f.match(h)) || null;
}

function pickCol(headers, spec) {
  if (!spec) return -1;
  const names = Array.isArray(spec) ? spec : [spec];
  for (const n of names) {
    const i = headers.indexOf(norm(n));
    if (i !== -1) return i;
  }
  return -1;
}

/** Bitwarden's JSON export (its CSV drops folders/collections; JSON keeps everything). */
export function parseBitwardenJson(text) {
  let doc;
  try { doc = JSON.parse(text); } catch { return null; }
  if (!doc || !Array.isArray(doc.items)) return null;
  if (doc.encrypted) return { format: 'bitwarden-json', items: [], skipped: 0, error: 'This Bitwarden export is encrypted with a Bitwarden key. Export it unencrypted (JSON or CSV) and import that; delete the file afterward.' };
  const items = [];
  let skipped = 0;
  for (const it of doc.items) {
    if (!it || it.type !== 1 || !it.login) { skipped += 1; continue; }
    items.push(normalizeItem({
      name: it.name, url: (it.login.uris && it.login.uris[0] && it.login.uris[0].uri) || '',
      username: it.login.username, password: it.login.password, notes: it.notes, totp: it.login.totp, favorite: !!it.favorite,
    }));
  }
  return { format: 'bitwarden-json', label: 'Bitwarden (JSON)', items, skipped };
}

/**
 * Text of an export -> { format, label, items, skipped, error }.
 * `items` are clear records (normalized); nothing is written anywhere here.
 */
export function importText(text) {
  const s = String(text || '');
  if (/^\s*\{/.test(s)) {
    const bw = parseBitwardenJson(s);
    if (bw) return bw;
    return { format: null, items: [], skipped: 0, error: 'This JSON is not a Bitwarden export. Export a CSV from your password manager and import that.' };
  }
  const rows = parseCsv(s);
  if (rows.length < 2) return { format: null, items: [], skipped: 0, error: 'The file has a header but no rows, or is not a CSV.' };
  const fmt = detectFormat(rows[0]);
  if (!fmt) return { format: null, items: [], skipped: 0, error: `Could not recognise the columns (${rows[0].slice(0, 6).join(', ')}). The file needs at least a password column.` };
  const headers = rows[0].map(norm);
  const col = Object.fromEntries(Object.entries(fmt.map).map(([k, spec]) => [k, pickCol(headers, spec)]));
  const items = [];
  let skipped = 0;
  for (const r of rows.slice(1)) {
    const get = (k) => (col[k] >= 0 ? (r[col[k]] ?? '') : '');
    const password = get('password');
    const url = get('url');
    const name = get('name') || hostOf(url) || get('username');
    if (!password && !url && !get('username')) { skipped += 1; continue; }
    // Bitwarden's `type` column: only login rows (type 'login' or empty); cards/notes skipped.
    if (fmt.id === 'bitwarden') {
      const typeIdx = headers.indexOf('type');
      const type = typeIdx >= 0 ? norm(r[typeIdx]) : 'login';
      if (type && type !== 'login') { skipped += 1; continue; }
    }
    const fav = get('favorite');
    items.push(normalizeItem({ name, url, username: get('username'), password, notes: get('notes'), totp: get('totp'), favorite: fav === '1' || /^true$/i.test(fav) }));
  }
  return { format: fmt.id, label: fmt.label, items, skipped };
}

/** The identity an import dedupes on: the site's host plus the username (case-folded). */
export function dedupeKey(item) {
  const host = hostOf(item && item.url) || String((item && item.name) || '').trim().toLowerCase();
  return `${host}|${String((item && item.username) || '').trim().toLowerCase()}`;
}

/** Split incoming items into those new to the vault and those already present. */
export function planImport(existing, incoming) {
  const have = new Set((existing || []).map(dedupeKey));
  const added = [];
  const duplicates = [];
  const seen = new Set();
  for (const it of incoming || []) {
    const k = dedupeKey(it);
    if (have.has(k) || seen.has(k)) duplicates.push(it); else { seen.add(k); added.push(it); }
  }
  return { added, duplicates };
}

/** A plain CSV of the clear items (the person's own data back out — DATA-AS-EMPOWERMENT). */
export function toCsv(items) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = 'name,url,username,password,notes,totp';
  const lines = (items || []).map((it) => [it.name, it.url, it.username, it.password, it.notes, it.totp].map(esc).join(','));
  return [head, ...lines].join('\r\n') + '\r\n';
}
