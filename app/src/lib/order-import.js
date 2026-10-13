// =============================================================================
// order-import — turn the church's EMAILED order of service into real segments.
//
// COLG sends the weekly order of service by email (the PROCLAIM doc from the
// church office). Today a steward re-types it into the Order of Service tab by
// hand; this parser makes it a paste: copy the email / document text, paste it
// into the tab, preview what was recognized, insert. Descriptive, never
// invented (DR-0076): every segment traces to a pasted line, unrecognized
// lines are surfaced as `skipped` — the preview shows both before anything is
// written, and the steward edits after insert like any other segment.
//
// Pure module (no Supabase, no DOM) so vitest locks the parsing the surface
// depends on. The output rows are seedDefaultOrder-shaped templates that the
// existing insert path (service-program.insertTemplateSegments) lands.
// =============================================================================

// Sector classification by keyword — mirrors the SECTORS taxonomy in
// service-program.js. First match wins; order matters (e.g. "Call to Worship"
// is pulpit, checked before the generic worship words).
const SECTOR_RULES = [
  { sector: 'pulpit', fixed: false, re: /\bcall to worship\b/i },
  { sector: 'pulpit', fixed: true, re: /\b(sermon|message|preach(?:ing)?|the word\b)/i },
  { sector: 'pulpit', fixed: false, re: /\b(scripture|reading|text|benediction)\b/i },
  { sector: 'pastoral', fixed: false, re: /\b(prayer|altar|invocation|intercess)/i },
  { sector: 'ushers', fixed: false, re: /\b(offering|tithes?|giving|collection|consecration of gifts)\b/i },
  { sector: 'hospitality', fixed: false, re: /\b(welcome|announcements?|greet(?:ing)?|visitors?|occasion|hospitality)\b/i },
  { sector: 'media', fixed: false, re: /\b(video|media|presentation|live\s?stream|slides?)\b/i },
  { sector: 'worship', fixed: false, re: /\b(praise|worship|selection|choir|song|hymn|musical|solo|anthem|psalmist)\b/i },
];

// Default planned minutes when the email doesn't say — same proportions as
// seedDefaultOrder (the sermon is the anchor; everything else is short).
const DEFAULT_MINUTES = { pulpitFixed: 35, worship: 10, other: 5 };

// Lines that are email plumbing, not run-of-show: greetings, signatures,
// contact blocks, tracking footers. Matched AFTER bullet stripping.
const NOISE_RES = [
  /^(praise\s+(the\s+lord|god)|ptl)\b/i,
  /^(dear|hello|hi|greetings|blessings|thanks?|thank you|god bless|amen)\b/i,
  /unsubscribe|update your profile|built with/i,
  /https?:\/\/|www\.|@.*\.(com|org|net)/i,
  /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/, // phone numbers
  /\b\d+\s+[NSEW]?\.?\s*\w+\s+(ave(nue)?|st(reet)?|blvd|road|rd|dr(ive)?)\b/i, // street address
  /^(senior\s+)?(bishop|pastor|rev(erend)?|elder|eldress|minister|sis(ter)?|bro(ther)?)\b[^,]*$/i, // signature name line
  /^(administration|the church of the living god)\b/i,
  /^champaign\b|^il\s+\d{5}/i,
];

// A scripture reference inside a line, e.g. "2 Kings 9:30-37", "Psalm 100:1-5".
const SCRIPTURE_RE = /\b([1-3]?\s?[A-Z][a-z]+\.?\s+\d{1,3}[:.]\d{1,3}(?:\s?[-–]\s?\d{1,3})?(?:\s?\((?:ESV|KJV|NIV|AMP|NKJV|NLT)\))?)/;

// Explicit minutes on a line: "(10 min)", "- 10 minutes", "10 mins", "10′".
const MINUTES_RE = /\(?\s*(\d{1,3})\s*(?:min(?:ute)?s?|′|')\s*\)?/i;

// A leading clock time ("11:00", "11:00 AM") — the first one seen becomes the
// suggested program start; per-line clocks are stripped from the title.
const CLOCK_RE = /^\(?\s*(\d{1,2}):(\d{2})\s*(am|pm)?\.?\s*\)?\s*[-–—·]?\s*/i;

function stripBullet(line) {
  // "1.", "1)", "I.", "IV)", "-", "•", "*", "◦" prefixes.
  return line
    .replace(/^\s*(?:\(?\d{1,2}[.)]|\(?[ivxIVX]{1,4}[.)]|[-–—•*◦▪])\s+/, '')
    .trim();
}

function isNoise(line) {
  return NOISE_RES.some((re) => re.test(line));
}

function classifySector(title) {
  for (const rule of SECTOR_RULES) {
    if (rule.re.test(title)) return { sector: rule.sector, fixed: rule.fixed };
  }
  return { sector: 'general', fixed: false };
}

function defaultMinutes(sector, fixed, title) {
  if (fixed) return DEFAULT_MINUTES.pulpitFixed;
  if (sector === 'worship' && /praise\s*(&|and)\s*worship/i.test(title)) return 20;
  if (sector === 'worship') return DEFAULT_MINUTES.worship;
  return DEFAULT_MINUTES.other;
}

// Trailing "— Person" / "by Person" → ownerName, when the remainder reads like
// a name or title (short, capitalized, no digits) and not a scripture ref.
function splitOwner(title) {
  const m = title.match(/^(.*?)(?:\s+[-–—]\s+|\s+by\s+)([A-Z][^,;:]*)$/);
  if (!m) return { title, ownerName: '' };
  const candidate = m[2].trim();
  if (SCRIPTURE_RE.test(candidate) || /\d/.test(candidate)) return { title, ownerName: '' };
  if (candidate.split(/\s+/).length > 5) return { title, ownerName: '' };
  return { title: m[1].trim(), ownerName: candidate };
}

/**
 * Parse the pasted text of the church's emailed order of service into
 * template segments (seedDefaultOrder shape, no ids / no DB).
 * Returns { segments, skipped, startTime } — skipped lines are surfaced so
 * nothing is silently dropped; startTime is the first clock time seen (or null).
 */
export function parseEmailOrder(text) {
  const segments = [];
  const skipped = [];
  let startTime = null;
  if (typeof text !== 'string' || !text.trim()) return { segments, skipped, startTime };

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const raw of lines) {
    let line = stripBullet(raw);
    if (!line) continue;

    // Peel off a leading clock time; the first one becomes the program start.
    const clock = line.match(CLOCK_RE);
    if (clock) {
      if (!startTime) {
        const ampm = (clock[3] || '').toLowerCase();
        let h = Number(clock[1]);
        if (ampm === 'pm' && h < 12) h += 12;
        if (ampm === 'am' && h === 12) h = 0;
        if (h <= 23) startTime = `${String(h).padStart(2, '0')}:${clock[2]}`;
      }
      line = line.replace(CLOCK_RE, '').trim();
      if (!line) continue;
    }

    if (isNoise(line)) { skipped.push(raw); continue; }

    // Minutes, scripture, owner peel off the line; what's left is the title.
    let plannedMinutes = null;
    const min = line.match(MINUTES_RE);
    if (min) { plannedMinutes = Number(min[1]); line = line.replace(MINUTES_RE, '').replace(/\s{2,}/g, ' ').trim(); }
    let scriptureRef = '';
    const scr = line.match(SCRIPTURE_RE);
    if (scr) { scriptureRef = scr[1].trim(); line = line.replace(scr[0], '').replace(/\s*[-–—·,]\s*$/, '').trim(); }
    const { title, ownerName } = splitOwner(line);
    const clean = title.replace(/[-–—·,:;]\s*$/, '').trim();

    // A line with no letters left (a stray date, "***", a page number) is not
    // a segment — surface it rather than inserting garbage.
    if (!/[A-Za-z]/.test(clean)) { skipped.push(raw); continue; }

    const { sector, fixed } = classifySector(clean);
    segments.push({
      title: clean,
      sector,
      ownerName,
      plannedMinutes: Number.isFinite(plannedMinutes) && plannedMinutes > 0 ? plannedMinutes : defaultMinutes(sector, fixed, clean),
      flexible: !fixed,
      sortOrder: (segments.length + 1) * 10,
      scriptureRef,
      sermonId: null,
      songIds: [],
      cues: {},
      notes: '',
    });
  }
  return { segments, skipped, startTime };
}
