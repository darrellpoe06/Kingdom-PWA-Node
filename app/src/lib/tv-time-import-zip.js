// =============================================================================
// tv-time-import-zip — one-tap migration from a real TV Time GDPR export
// =============================================================================
// Darrell 2026-07-04, with Christina (mrspoe06) blocked on the real file:
// "There is no where to import the file. There is a place that says restore from
// a back up file but even then because it comes in as a zip file... it is not
// letting it [load] in the app."
//
// TV Time's GDPR self-service export is NOT a single JSON backup — it is a .zip
// of ~55 CSVs (verified against Christina's actual export, DR-0076). The old
// restore only accepted a JSON blob, so the zip had nowhere to go. This turns the
// REAL export into her list: the shows she follows + the episodes she's watched +
// ratings, mapped into our TV Time store's own {shows, custom} shape so the
// existing importTvJson merges it (normalize() sanitizes — a bad file can't
// corrupt her list). "Your data is yours" (DATA-AS-EMPOWERMENT), for real.
//
// The migration-relevant CSVs (schemas read from the real file):
//   followed_tv_show.csv    tv_show_id,created_at,...,tv_show_name,user_id,active,...
//   user_tv_show_data.csv   user_id,tv_show_id,is_followed,is_favorited,nb_episodes_seen,tv_show_name
//   seen_episode_source.csv user_id,episode_id,source,...,tv_show_name,episode_season_number,episode_number
//   tv_show_rate.csv        user_id,tv_show_id,rating,...,tv_show_name
//
// PURE halves (parseCsv, gdprRowsToTvState) are unit-tested against fixtures that
// mirror the real headers. The zip read (unzipEntries) is a thin, fail-soft shell
// over the browser-native DecompressionStream('deflate-raw') — no external dep,
// no CDN (CSP-safe). Also present in Node 18+, so the smoke path is testable.
// =============================================================================

// A stable id for an imported show, slugged from its name (TV Time's numeric
// tv_show_id is its own; ours resolves by title via the catalog). Prefixed so an
// imported entry never collides with a catalog-id keyed show.
export function importedShowId(name) {
  const slug = String(name || '').trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
  return slug ? `tvt-${slug}` : '';
}

// --- CSV -------------------------------------------------------------------
// A correct-enough RFC-4180 parser: handles quoted fields, embedded commas,
// escaped "" quotes, and \r\n / \n rows. Returns array of header-keyed objects.
export function parseCsv(text) {
  const s = String(text == null ? '' : text);
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else { field += c; }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); field = ''; rows.push(row); row = [];
    } else if (c === '\r') {
      // swallow — the \n that follows ends the row
    } else {
      field += c;
    }
  }
  // trailing field / row (file without a final newline)
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0].map((h) => String(h).trim());
  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (cells.length === 1 && cells[0] === '') continue; // blank line
    const obj = {};
    for (let c = 0; c < header.length; c++) obj[header[c]] = cells[c] === undefined ? '' : cells[c];
    out.push(obj);
  }
  return out;
}

// --- Mapping (PURE) --------------------------------------------------------
// Turn the parsed CSV row-sets into our TV Time store shape { shows, custom }.
// `files` is { filename: rows[] } (already parsed). Robust to missing files.
export function gdprRowsToTvState(files) {
  const f = files && typeof files === 'object' ? files : {};
  const followed = Array.isArray(f['followed_tv_show.csv']) ? f['followed_tv_show.csv'] : [];
  const showData = Array.isArray(f['user_tv_show_data.csv']) ? f['user_tv_show_data.csv'] : [];
  const seen = Array.isArray(f['seen_episode_source.csv']) ? f['seen_episode_source.csv'] : [];
  const rates = Array.isArray(f['tv_show_rate.csv']) ? f['tv_show_rate.csv'] : [];

  // Per-show accumulation keyed by name (TV Time's tv_show_id is internal; names
  // are what our catalog resolves against, and every relevant CSV carries the name).
  const byName = new Map();
  const ensure = (name) => {
    const nm = String(name || '').trim();
    if (!nm) return null;
    if (!byName.has(nm)) byName.set(nm, { name: nm, favorited: false, rating: 0, watched: {}, seasons: new Map() });
    return byName.get(nm);
  };

  // 1) Shows she follows (active === '1' means currently followed, not archived).
  for (const r of followed) {
    if (String(r.active).trim() === '0') continue;
    ensure(r.tv_show_name);
  }
  // 2) Favorited flag (and surface any followed show the follow file missed).
  for (const r of showData) {
    if (String(r.is_followed).trim() !== '1' && String(r.is_favorited).trim() !== '1') continue;
    const rec = ensure(r.tv_show_name);
    if (rec && String(r.is_favorited).trim() === '1') rec.favorited = true;
  }
  // 3) Ratings (TV Time uses a 0-10 love scale; fold to our 0-5 stars, honest).
  for (const r of rates) {
    const rec = ensure(r.tv_show_name);
    if (!rec) continue;
    const raw = Number(r.rating);
    if (Number.isFinite(raw) && raw > 0) {
      const stars = raw > 5 ? Math.round(raw / 2) : Math.round(raw);
      rec.rating = Math.max(0, Math.min(5, stars));
    }
  }
  // 4) Watched episodes — the checkmarks. Each row is one episode she marked seen.
  for (const r of seen) {
    const rec = ensure(r.tv_show_name);
    if (!rec) continue;
    const season = Number(r.episode_season_number);
    const number = Number(r.episode_number);
    if (!Number.isFinite(season) || !Number.isFinite(number) || season < 0 || number < 0) continue;
    rec.watched[`${season}x${number}`] = true;
    if (!rec.seasons.has(season)) rec.seasons.set(season, new Set());
    rec.seasons.get(season).add(number);
  }

  // Assemble the store shape. custom[id] = display metadata; shows[id] = progress.
  const shows = {};
  const custom = {};
  for (const rec of byName.values()) {
    const id = importedShowId(rec.name);
    if (!id) continue;
    const watchedCount = Object.keys(rec.watched).length;
    // Synthesize seasons from the episodes she actually watched, so the checkoff
    // grid renders her real progress immediately (a fuller list can refresh from
    // the catalog when she opens the show).
    const seasons = [...rec.seasons.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([season, nums]) => ({
        season,
        episodes: [...nums].sort((a, b) => a - b).map((n) => ({ number: n, name: `Episode ${n}`, airdate: '' })),
      }));
    custom[id] = {
      id, kind: 'show', title: rec.name, genre: 'Show', poster: '', year: '', network: '', seasons,
    };
    shows[id] = {
      status: watchedCount > 0 ? 'watching' : 'want',
      rating: rec.rating,
      comments: [],
      watched: rec.watched,
    };
  }
  return { shows, custom };
}

// A human summary of what an import produced, for the confirmation line.
export function importSummary(state) {
  const shows = state && state.custom ? Object.keys(state.custom).length : 0;
  let episodes = 0;
  const s = state && state.shows ? state.shows : {};
  for (const v of Object.values(s)) episodes += v && v.watched ? Object.keys(v.watched).length : 0;
  return { shows, episodes };
}

// --- Zip read (thin, fail-soft, browser-native) ----------------------------
// Inflate a raw-DEFLATE byte range with the platform DecompressionStream. No
// external dependency, no network — CSP-safe. Returns '' on any failure so a
// weird entry degrades to "skipped", never a thrown import.
async function inflateRaw(bytes) {
  try {
    if (typeof DecompressionStream === 'undefined') return '';
    const ds = new DecompressionStream('deflate-raw');
    const stream = new Blob([bytes]).stream().pipeThrough(ds);
    const buf = await new Response(stream).arrayBuffer();
    return new TextDecoder('utf-8').decode(buf);
  } catch { return ''; }
}

const u16 = (dv, o) => dv.getUint16(o, true);
const u32 = (dv, o) => dv.getUint32(o, true);

// Extract named entries from a zip ArrayBuffer via the End-Of-Central-Directory
// record → central directory (authoritative sizes/offsets). Only `wanted` names
// are inflated (we need ~4 of 55 CSVs). Returns { filename: text }. Fail-soft.
export async function unzipEntries(arrayBuffer, wanted) {
  const want = wanted instanceof Set ? wanted : new Set(wanted || []);
  const out = {};
  try {
    const bytes = new Uint8Array(arrayBuffer);
    const dv = new DataView(arrayBuffer);
    // Find EOCD (signature 0x06054b50), scanning back from the end.
    let eocd = -1;
    for (let i = bytes.length - 22; i >= 0 && i >= bytes.length - 22 - 65536; i--) {
      if (u32(dv, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) return out;
    const cdCount = u16(dv, eocd + 10);
    let p = u32(dv, eocd + 16); // central-directory start offset
    for (let n = 0; n < cdCount; n++) {
      if (u32(dv, p) !== 0x02014b50) break; // central-dir header signature
      const method = u16(dv, p + 10);
      const compSize = u32(dv, p + 20);
      const nameLen = u16(dv, p + 28);
      const extraLen = u16(dv, p + 30);
      const commentLen = u16(dv, p + 32);
      const lhOffset = u32(dv, p + 42);
      const name = new TextDecoder('utf-8').decode(bytes.subarray(p + 46, p + 46 + nameLen));
      p += 46 + nameLen + extraLen + commentLen;
      if (!want.has(name)) continue;
      // Read the local header to skip its (possibly different) name/extra lengths.
      if (u32(dv, lhOffset) !== 0x04034b50) continue;
      const lhNameLen = u16(dv, lhOffset + 26);
      const lhExtraLen = u16(dv, lhOffset + 28);
      const dataStart = lhOffset + 30 + lhNameLen + lhExtraLen;
      const data = bytes.subarray(dataStart, dataStart + compSize);
      if (method === 0) out[name] = new TextDecoder('utf-8').decode(data);        // stored
      else if (method === 8) out[name] = await inflateRaw(data);                  // deflate
      // other methods: skip (leaves the entry absent — honest, not a crash)
    }
  } catch { /* fail-soft: return whatever we got */ }
  return out;
}

// The CSVs we actually read (of the ~55 in the export).
export const MIGRATION_CSVS = [
  'followed_tv_show.csv', 'user_tv_show_data.csv', 'seen_episode_source.csv', 'tv_show_rate.csv',
];

// The full pipeline: a TV Time export .zip ArrayBuffer -> our store blob + a
// summary. Returns { state, summary, ok }. ok=false when nothing usable was found
// (unknown zip / not a TV Time export) so the UI can say so honestly.
export async function importTvTimeZip(arrayBuffer) {
  const texts = await unzipEntries(arrayBuffer, new Set(MIGRATION_CSVS));
  const files = {};
  for (const name of MIGRATION_CSVS) files[name] = parseCsv(texts[name] || '');
  const state = gdprRowsToTvState(files);
  const summary = importSummary(state);
  return { state, summary, ok: summary.shows > 0 };
}

// Detect a zip by its local-file-header magic (PK\x03\x04) so the restore input
// can route a .zip to the migration path and a .json to the existing one.
export function looksLikeZip(arrayBuffer) {
  try {
    const b = new Uint8Array(arrayBuffer);
    return b.length > 4 && b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
  } catch { return false; }
}
