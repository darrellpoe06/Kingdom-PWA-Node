// =============================================================================
// choir-songbook — cross-reference the choir's songs so the right one for
// Sunday is a few taps away (Darrell 2026-06-24: "the easiest way possible").
// =============================================================================
// PURE functions only (no Supabase, no React) so every rule below is unit-
// tested and reused by the component + the Service↔Choir planner alike. The
// Supabase I/O lives in choir-songbook-sync.js; the UI in ChoirSongbook.jsx.
//
// THE MODEL (faithful to the real data — Verification Doctrine / Reality-trace):
// choir_songs (0011) is the weekly SET-LIST — one row per (title, service_date).
// A "song" in the Songbook is a DERIVED grouping of those rows by normalized
// title. Everything shown — last-sung, times-used, the scripture/theme union —
// is COMPUTED from the real rows, never painted. The cross-reference fields
// (themes / key / arrangement / soloist / sermon_ref) ride on those rows (0041).
//
// NO FABRICATION: themes are the director's real, editable tags. suggestThemes()
// may surface CANDIDATE themes from text already present (title/notes/scripture)
// for the director to accept — it never invents a theme and the app never
// auto-writes a suggestion. Scripture matching reads the existing scripture_ref
// field; it normalizes, it does not invent references. (There is no shared
// extraction module on main to import yet — the content-engine lane can adopt
// these same exported helpers rather than fork them.)
// =============================================================================

// --- Title identity ----------------------------------------------------------

// The grouping/loves key for a song: lowercase, punctuation + filler stripped so
// "Total Praise", "total praise!", and "Total  Praise" are one song. Stable so a
// love (keyed by this) survives the song being re-scheduled onto a new date.
export function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')   // drop punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Scripture normalization + overlap ---------------------------------------
// Reads the existing scripture_ref text (e.g. "Psalm 100", "John 3:16-18",
// "1 Cor 13; Ps 23") and normalizes to canonical {book, chapter} tokens so two
// songs/sermons can be matched on shared scripture. Does NOT invent references.

const BOOK_ALIASES = {
  genesis: 'genesis', gen: 'genesis', exodus: 'exodus', ex: 'exodus', exod: 'exodus',
  leviticus: 'leviticus', lev: 'leviticus', numbers: 'numbers', num: 'numbers',
  deuteronomy: 'deuteronomy', deut: 'deuteronomy', dt: 'deuteronomy',
  joshua: 'joshua', josh: 'joshua', judges: 'judges', judg: 'judges', ruth: 'ruth',
  '1samuel': '1samuel', '1sam': '1samuel', '2samuel': '2samuel', '2sam': '2samuel',
  '1kings': '1kings', '1kgs': '1kings', '2kings': '2kings', '2kgs': '2kings',
  '1chronicles': '1chronicles', '1chron': '1chronicles', '1chr': '1chronicles',
  '2chronicles': '2chronicles', '2chron': '2chronicles', '2chr': '2chronicles',
  ezra: 'ezra', nehemiah: 'nehemiah', neh: 'nehemiah', esther: 'esther',
  job: 'job', psalm: 'psalms', psalms: 'psalms', ps: 'psalms', psa: 'psalms', pss: 'psalms',
  proverbs: 'proverbs', prov: 'proverbs', prv: 'proverbs',
  ecclesiastes: 'ecclesiastes', eccl: 'ecclesiastes', ecc: 'ecclesiastes',
  song: 'songofsolomon', songofsolomon: 'songofsolomon', songofsongs: 'songofsolomon', sos: 'songofsolomon',
  isaiah: 'isaiah', isa: 'isaiah', jeremiah: 'jeremiah', jer: 'jeremiah',
  lamentations: 'lamentations', lam: 'lamentations', ezekiel: 'ezekiel', ezek: 'ezekiel',
  daniel: 'daniel', dan: 'daniel', hosea: 'hosea', hos: 'hosea', joel: 'joel',
  amos: 'amos', obadiah: 'obadiah', obad: 'obadiah', jonah: 'jonah', micah: 'micah', mic: 'micah',
  nahum: 'nahum', habakkuk: 'habakkuk', hab: 'habakkuk', zephaniah: 'zephaniah', zeph: 'zephaniah',
  haggai: 'haggai', hag: 'haggai', zechariah: 'zechariah', zech: 'zechariah',
  malachi: 'malachi', mal: 'malachi',
  matthew: 'matthew', matt: 'matthew', mt: 'matthew', mark: 'mark', mk: 'mark',
  luke: 'luke', lk: 'luke', john: 'john', jn: 'john',
  acts: 'acts', romans: 'romans', rom: 'romans',
  '1corinthians': '1corinthians', '1cor': '1corinthians', '1co': '1corinthians',
  '2corinthians': '2corinthians', '2cor': '2corinthians', '2co': '2corinthians',
  galatians: 'galatians', gal: 'galatians', ephesians: 'ephesians', eph: 'ephesians',
  philippians: 'philippians', phil: 'philippians', php: 'philippians',
  colossians: 'colossians', col: 'colossians',
  '1thessalonians': '1thessalonians', '1thess': '1thessalonians', '1th': '1thessalonians',
  '2thessalonians': '2thessalonians', '2thess': '2thessalonians', '2th': '2thessalonians',
  '1timothy': '1timothy', '1tim': '1timothy', '2timothy': '2timothy', '2tim': '2timothy',
  titus: 'titus', philemon: 'philemon', phlm: 'philemon', hebrews: 'hebrews', heb: 'hebrews',
  james: 'james', jas: 'james',
  '1peter': '1peter', '1pet': '1peter', '1pt': '1peter', '2peter': '2peter', '2pet': '2peter', '2pt': '2peter',
  '1john': '1john', '1jn': '1john', '2john': '2john', '2jn': '2john', '3john': '3john', '3jn': '3john',
  jude: 'jude', revelation: 'revelation', rev: 'revelation', revelations: 'revelation',
};

// Parse a scripture_ref string into canonical { book, chapter|null, display }
// tokens. Splits on ; , / and " and ". Tolerant: an unrecognized book is dropped
// (we never guess) rather than mis-matched.
export function parseScriptureRefs(ref) {
  const raw = String(ref || '').trim();
  if (!raw) return [];
  const parts = raw.split(/\s*(?:;|,|\/|\band\b)\s*/i).map((p) => p.trim()).filter(Boolean);
  const out = [];
  for (const part of parts) {
    // Leading book may carry a number prefix: "1 Cor", "2 John".
    const m = part.match(/^((?:[1-3]\s*)?[A-Za-z.]+(?:\s+of\s+[A-Za-z]+)?)\s*(\d+)?/);
    if (!m) continue;
    const bookKey = m[1].toLowerCase().replace(/\./g, '').replace(/\s+/g, '');
    const book = BOOK_ALIASES[bookKey];
    if (!book) continue;
    const chapter = m[2] ? Number(m[2]) : null;
    out.push({ book, chapter, display: part });
  }
  return out;
}

// Two scripture_ref strings overlap when they share a book; a shared chapter is a
// stronger hit. Returns { hit, book, chapter } describing the best shared ref, or
// { hit:false }.
export function scriptureOverlap(refA, refB) {
  const a = parseScriptureRefs(refA);
  const b = parseScriptureRefs(refB);
  let best = null;
  for (const x of a) {
    for (const y of b) {
      if (x.book !== y.book) continue;
      const sameChapter = x.chapter != null && x.chapter === y.chapter;
      if (!best || (sameChapter && !best.chapter)) {
        best = { hit: true, book: x.book, chapter: sameChapter ? x.chapter : null, display: x.display };
      }
    }
  }
  return best || { hit: false };
}

// --- Theme derivation (candidate suggestions — never auto-written) -----------

// Curated worship-theme lexicon: a theme label -> keyword stems found in song /
// sermon text. Christ-centered, occasion-aware. Extend freely; it only ever
// SUGGESTS (the director accepts), so a near-miss costs nothing.
export const THEME_LEXICON = {
  praise: ['praise', 'hallelujah', 'alleluia', 'exalt', 'magnify'],
  worship: ['worship', 'adore', 'reverence', 'bow', 'holy holy'],
  thanksgiving: ['thank', 'grateful', 'gratitude', 'harvest', 'thanksgiving'],
  salvation: ['salvation', 'saved', 'redeem', 'redemption', 'ransom'],
  'the cross': ['cross', 'calvary', 'crucif', 'blood', 'lamb'],
  grace: ['grace', 'mercy', 'forgiv', 'unmerited'],
  faith: ['faith', 'believe', 'trust', 'assurance'],
  hope: ['hope', 'promise', 'awaiting'],
  love: ['love', 'beloved', 'charity'],
  joy: ['joy', 'rejoice', 'glad', 'celebrate'],
  peace: ['peace', 'calm', 'still', 'rest'],
  comfort: ['comfort', 'sorrow', 'mourn', 'weary', 'burden', 'heal', 'healing'],
  victory: ['victory', 'overcome', 'conquer', 'triumph', 'more than'],
  deliverance: ['deliver', 'freedom', 'free', 'chains', 'bondage', 'set free'],
  majesty: ['majesty', 'majestic', 'king', 'reign', 'throne', 'sovereign', 'lord of lords'],
  'holy spirit': ['holy spirit', 'spirit', 'pentecost', 'comforter', 'fire', 'wind'],
  prayer: ['pray', 'prayer', 'intercede', 'seek'],
  communion: ['communion', 'supper', 'remembrance', 'body and blood', 'table'],
  baptism: ['baptism', 'baptize', 'buried with', 'newness of life'],
  surrender: ['surrender', 'yield', 'consecrat', 'all to', 'i give'],
  christmas: ['christmas', 'born', 'bethlehem', 'manger', 'emmanuel', 'immanuel', 'advent', 'nativity', 'noel'],
  easter: ['easter', 'risen', 'resurrection', 'empty tomb', 'he rose', 'arose', 'alive'],
  'god is faithful': ['faithful', 'never fail', 'great is thy', 'forever', 'everlasting'],
  'the blood': ['blood', 'precious blood', 'washed'],
  testimony: ['testimony', 'testify', 'story', 'what god has done'],
};

// Suggest CANDIDATE themes from free text (song title+notes+scripture, or a
// sermon). Returns deduped theme labels whose keyword stems appear in the text.
// Caller treats these as "tap to add", never as truth.
export function suggestThemes(text, max = 6) {
  const hay = String(text || '').toLowerCase();
  if (!hay.trim()) return [];
  const hits = [];
  for (const [theme, stems] of Object.entries(THEME_LEXICON)) {
    if (stems.some((s) => hay.includes(s))) hits.push(theme);
  }
  return hits.slice(0, max);
}

// Parse a comma/line-separated theme field into a clean tag array (what the
// director's edit writes). Lowercased, deduped, trimmed, capped.
export function parseThemes(input) {
  const seen = new Set();
  const out = [];
  for (const t of String(input || '').split(/[,\n]/)) {
    const tag = t.trim().toLowerCase().replace(/\s+/g, ' ');
    if (tag && tag.length <= 40 && !seen.has(tag)) { seen.add(tag); out.push(tag); }
  }
  return out.slice(0, 12);
}

// --- Songbook: derive song entities from the real set-list rows ---------------

function firstNonNull(rows, pick) {
  for (const r of rows) { const v = pick(r); if (v != null && v !== '') return v; }
  return null;
}
function unionStrings(rows, pick) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const v = pick(r);
    const arr = Array.isArray(v) ? v : v != null && v !== '' ? [v] : [];
    for (const item of arr) {
      const key = String(item).trim();
      if (key && !seen.has(key.toLowerCase())) { seen.add(key.toLowerCase()); out.push(key); }
    }
  }
  return out;
}

// Group active set-list rows by normalized title into Songbook entities. Each
// entity carries the cross-reference union + computed history. `loves` is the
// tally map (titleKey -> { count, mine }) from tallyLoves(); `today` is an ISO
// date so "last sung / next scheduled" split correctly.
export function buildSongbook(songs, { loves, today } = {}) {
  const todayIso = today || '';
  const lovesMap = loves || new Map();
  const groups = new Map();
  for (const s of songs || []) {
    if (s.status === 'archived') continue;
    const key = normalizeTitle(s.title);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }
  const out = [];
  for (const [titleKey, rowsRaw] of groups) {
    // newest first by service_date (nulls — undated library entries — last).
    const rows = rowsRaw.slice().sort((a, b) => String(b.serviceDate || '').localeCompare(String(a.serviceDate || '')));
    const dates = rows.map((r) => r.serviceDate).filter(Boolean);
    const past = dates.filter((d) => !todayIso || d <= todayIso);
    const future = dates.filter((d) => todayIso && d > todayIso);
    const love = lovesMap.get(titleKey) || { count: 0, mine: false };
    out.push({
      titleKey,
      title: rows[0].title,
      rowIds: rows.map((r) => r.id),
      latestId: rows[0].id,
      youtubeUrl: firstNonNull(rows, (r) => r.youtubeUrl),
      startSeconds: firstNonNull(rows, (r) => r.startSeconds),
      lyrics: firstNonNull(rows, (r) => r.lyrics),
      notes: firstNonNull(rows, (r) => r.notes),
      scriptureRefs: unionStrings(rows, (r) => r.scriptureRef),
      themes: unionStrings(rows, (r) => r.themes),
      keys: unionStrings(rows, (r) => r.songKey),
      arrangements: unionStrings(rows, (r) => r.arrangement),
      soloists: unionStrings(rows, (r) => r.soloist),
      sermonRefs: unionStrings(rows, (r) => r.sermonRef),
      serviceDates: dates.slice().sort(),
      timesUsed: new Set(dates).size,
      lastSung: past.length ? past.sort()[past.length - 1] : null,
      nextScheduled: future.length ? future.sort()[0] : null,
      lovesCount: love.count,
      lovedByMe: !!love.mine,
    });
  }
  // Default order: most-loved first, then most recently sung, then title.
  out.sort((a, b) =>
    (b.lovesCount - a.lovesCount) ||
    String(b.lastSung || '').localeCompare(String(a.lastSung || '')) ||
    String(a.title).localeCompare(String(b.title)));
  return out;
}

// titleKey -> { count, mine } for the love hearts. Mirrors tallyVotes.
export function tallyLoves(loves) {
  const map = new Map();
  for (const l of loves || []) {
    const cur = map.get(l.titleKey) || { count: 0, mine: false };
    cur.count += 1;
    if (l.mine) cur.mine = true;
    map.set(l.titleKey, cur);
  }
  return map;
}

// Every theme tag across the songbook, sorted, for the filter chips.
export function allThemes(songbook) {
  const seen = new Set();
  for (const s of songbook || []) for (const t of s.themes || []) seen.add(t);
  return Array.from(seen).sort();
}

// --- Search + filter (easiest-use: type a theme or a verse) ------------------

// Full-text match across title / scripture / themes / notes (corpusPrep-style),
// PLUS a scripture-aware hit so typing "Psalm 100" also finds "Ps 100:1". Empty
// query returns the whole songbook unchanged.
export function searchSongbook(songbook, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return songbook || [];
  const qRefs = parseScriptureRefs(q);
  return (songbook || []).filter((s) => {
    const hay = [s.title, s.notes, (s.scriptureRefs || []).join(' '), (s.themes || []).join(' ')]
      .filter(Boolean).join(' ').toLowerCase();
    if (hay.includes(q)) return true;
    if (qRefs.length) return (s.scriptureRefs || []).some((r) => scriptureOverlap(r, q).hit);
    return false;
  });
}

// Songs carrying a given theme tag (chip filter).
export function filterByTheme(songbook, theme) {
  const t = String(theme || '').trim().toLowerCase();
  if (!t) return songbook || [];
  return (songbook || []).filter((s) => (s.themes || []).some((x) => x.toLowerCase() === t));
}

// --- Suggestion engine: "what should the choir sing for this message?" -------

// How well a song fits a target (a sermon, or a free-text theme/occasion).
// `target` is { scriptureRef, themes } — themes may be derived. Returns
// { score, reasons[] } where reasons EXPLAIN the match (trust: show the basis).
export function scoreSong(song, target) {
  const reasons = [];
  let score = 0;

  // Scripture overlap — the strongest signal.
  if (target.scriptureRef) {
    for (const r of song.scriptureRefs || []) {
      const ov = scriptureOverlap(r, target.scriptureRef);
      if (ov.hit) {
        score += ov.chapter ? 5 : 3;
        reasons.push(ov.chapter ? `Shares ${r}` : `Same book (${r})`);
        break;
      }
    }
  }

  // Theme overlap — medium signal.
  const tThemes = new Set((target.themes || []).map((t) => String(t).toLowerCase()));
  if (tThemes.size) {
    const shared = (song.themes || []).filter((t) => tThemes.has(String(t).toLowerCase()));
    if (shared.length) {
      score += 2 * shared.length;
      reasons.push(`Theme: ${shared.slice(0, 3).join(', ')}`);
    }
  }

  // Most-loved nudge — among equally-fitting songs, surface the ones the body
  // already loves (a small tiebreak, never a substitute for fit).
  if (song.lovesCount > 0 && score > 0) {
    score += Math.min(song.lovesCount, 3) * 0.25;
  }

  return { score, reasons };
}

// Rank the songbook for an upcoming sermon. The sermon's themes are DERIVED from
// its title/notes/scripture (suggestThemes) since sermons carry no theme tags —
// honest: matches are labelled by their basis. Returns scored entries (score>0)
// newest-fit first, each with { song, score, reasons }.
export function suggestSongsForSermon(songbook, sermon, { limit = 8 } = {}) {
  if (!sermon) return [];
  const target = {
    scriptureRef: sermon.scriptureRef || '',
    themes: suggestThemes(`${sermon.title || ''} ${sermon.notes || ''} ${sermon.scriptureRef || ''}`),
  };
  return rankAgainst(songbook, target, limit);
}

// Rank the songbook for a free-text theme/occasion the director types (e.g.
// "thanksgiving", "communion sunday", "Psalm 23"). Treats the text as both a
// theme source and a possible scripture.
export function suggestSongsForText(songbook, text, { limit = 8 } = {}) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  const target = {
    scriptureRef: parseScriptureRefs(raw).length ? raw : '',
    themes: suggestThemes(raw).length ? suggestThemes(raw) : [raw.toLowerCase()],
  };
  return rankAgainst(songbook, target, limit);
}

function rankAgainst(songbook, target, limit) {
  const scored = [];
  for (const song of songbook || []) {
    const { score, reasons } = scoreSong(song, target);
    if (score > 0) scored.push({ song, score, reasons });
  }
  scored.sort((a, b) =>
    (b.score - a.score) ||
    String(b.song.lastSung || '').localeCompare(String(a.song.lastSung || '')));
  return limit ? scored.slice(0, limit) : scored;
}

// Sermons that cross-reference a song (shared scripture/derived theme), so the
// Songbook can show "fits these messages". Ranked best-fit first.
export function crossRefSermons(song, sermons, { limit = 4 } = {}) {
  const scored = [];
  for (const sermon of sermons || []) {
    const target = {
      scriptureRef: sermon.scriptureRef || '',
      themes: suggestThemes(`${sermon.title || ''} ${sermon.notes || ''} ${sermon.scriptureRef || ''}`),
    };
    const { score, reasons } = scoreSong(song, target);
    if (score > 0) scored.push({ sermon, score, reasons });
  }
  scored.sort((a, b) => (b.score - a.score) || String(b.sermon.serviceDate || '').localeCompare(String(a.sermon.serviceDate || '')));
  return limit ? scored.slice(0, limit) : scored;
}

// --- Display helpers ---------------------------------------------------------

// "Last sung 3 weeks ago" / "Sung this week" / "New — not sung yet". Pure so the
// label is testable and never drifts from the data.
export function lastSungLabel(song, today) {
  if (!song || !song.lastSung) return 'New — not sung yet';
  const t = today || '';
  if (!t) return `Last sung ${song.lastSung}`;
  const days = Math.floor((Date.parse(t + 'T00:00:00') - Date.parse(song.lastSung + 'T00:00:00')) / 86400000);
  if (days < 0) return 'Scheduled ahead';
  if (days <= 6) return 'Sung this week';
  if (days <= 13) return 'Sung last week';
  const weeks = Math.round(days / 7);
  if (weeks < 9) return `Last sung ${weeks} weeks ago`;
  const months = Math.round(days / 30);
  if (months < 18) return `Last sung ${months} months ago`;
  return `Last sung ${Math.round(days / 365)}+ years ago`;
}
