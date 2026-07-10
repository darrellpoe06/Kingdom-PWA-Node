// =============================================================================
// captions.js — the sovereign caption spine (parse / build / sync / search).
// =============================================================================
// WHY THIS EXISTS (Darrell 2026-07-09): YouTube shows captions on our Sunday
// livestream because Google runs ASR server-side and paints them onto ITS player
// only. The moment the service is anywhere else — the in-room projection, the
// PoeTech app, the Presenter/NDI output, a Facebook re-post, a downloaded clip —
// those captions do not come along, because they were never IN the video we send.
// We want captions we OWN: live, perpetual, and historical, on every surface,
// independent of YouTube. This module is the dependency-free core every caption
// surface reads: it turns timed caption cues into WebVTT, parses WebVTT back into
// cues, finds the active line at a playhead time, and searches the text.
//
// SOVEREIGN + SOURCE-AGNOSTIC: a cue is just { start, end, text } in seconds. The
// cues can come from YouTube's timed auto-captions today (zero-GPU, already
// harvested) or from a Whisper pass on the church GPU box tomorrow (higher
// quality, fully sovereign). The `source` provenance travels with the track so a
// surface can show where its captions came from (DR-0076 provenance).
//
// HONESTY (DR-0076 verification doctrine): nothing here fabricates timing. A cue's
// times are the real segment boundaries from the caption source. When timing is
// absent we say so (an untimed transcript is NOT a caption track) rather than
// invent evenly-spaced fake cues.
//
// PURE + dependency-free: no imports -> safe in Node (the loader script), the
// browser (the display components), and tests. Mirrors transcript-harvest.js.
// =============================================================================

// --- Text normalization ------------------------------------------------------
// Auto-captions arrive with ">>" speaker carets and [Music]/[Applause] tags.
// A caption LINE should read clean; we strip the carets and bracket tags but keep
// the words exactly as spoken (we never rewrite the speaker's words).
export function cleanCueText(text) {
  return String(text == null ? '' : text)
    .replace(/>>/g, ' ')          // caption speaker carets
    .replace(/\r/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Timestamp formatting ----------------------------------------------------
// Clamp to a non-negative finite number of seconds; null/NaN/Infinity -> 0.
function safeSeconds(s) {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

// WebVTT cue timestamp: always HH:MM:SS.mmm (the WebVTT spec's canonical form).
export function vttTimestamp(seconds) {
  const total = safeSeconds(seconds);
  const ms = Math.round((total - Math.floor(total)) * 1000);
  // Rounding can push ms to 1000; carry it into the seconds.
  let whole = Math.floor(total);
  let millis = ms;
  if (millis >= 1000) { whole += 1; millis -= 1000; }
  const hh = Math.floor(whole / 3600);
  const mm = Math.floor((whole % 3600) / 60);
  const ss = whole % 60;
  const p2 = (n) => String(n).padStart(2, '0');
  const p3 = (n) => String(n).padStart(3, '0');
  return `${p2(hh)}:${p2(mm)}:${p2(ss)}.${p3(millis)}`;
}

// Human clock for a follow-along panel: M:SS, or H:MM:SS past an hour.
export function formatClock(seconds) {
  const whole = Math.floor(safeSeconds(seconds));
  const hh = Math.floor(whole / 3600);
  const mm = Math.floor((whole % 3600) / 60);
  const ss = whole % 60;
  const p2 = (n) => String(n).padStart(2, '0');
  return hh > 0 ? `${hh}:${p2(mm)}:${p2(ss)}` : `${mm}:${p2(ss)}`;
}

// --- Cue construction from timed segments ------------------------------------
// youtube-transcript-api (and Whisper) hand back segments as
// { text, start, duration }. Turn them into normalized { start, end, text }
// cues: sorted by start, cleaned text, empty cues dropped, and each cue's end
// clamped so it never runs past the next cue's start (overlapping captions
// double-render). A missing duration falls back to a short readable hold.
const DEFAULT_HOLD_SEC = 4; // used only when a segment truly has no duration

export function cuesFromSegments(segments) {
  const list = Array.isArray(segments) ? segments : [];
  const raw = [];
  for (const seg of list) {
    if (!seg) continue;
    const text = cleanCueText(seg.text);
    if (!text) continue;
    const start = safeSeconds(seg.start != null ? seg.start : seg.offset);
    const durRaw = seg.duration != null ? seg.duration : seg.dur;
    const dur = durRaw != null && Number.isFinite(Number(durRaw)) && Number(durRaw) > 0
      ? Number(durRaw)
      : DEFAULT_HOLD_SEC;
    raw.push({ start, end: start + dur, text });
  }
  raw.sort((a, b) => a.start - b.start || a.end - b.end);
  // Clamp each end to the next start so cues don't overlap.
  for (let i = 0; i < raw.length - 1; i++) {
    if (raw[i].end > raw[i + 1].start) raw[i].end = raw[i + 1].start;
    if (raw[i].end < raw[i].start) raw[i].end = raw[i].start; // never negative
  }
  return raw;
}

// --- WebVTT build ------------------------------------------------------------
// Serialize cues to a valid WebVTT document. Cues with empty text are skipped.
// A cue whose end <= start gets a minimal 0.001s span so the file stays valid.
export function buildVtt(cues) {
  const list = Array.isArray(cues) ? cues : [];
  const lines = ['WEBVTT', ''];
  let n = 0;
  for (const cue of list) {
    if (!cue) continue;
    const text = cleanCueText(cue.text);
    if (!text) continue;
    const start = safeSeconds(cue.start);
    let end = safeSeconds(cue.end);
    if (end <= start) end = start + 0.001;
    n += 1;
    lines.push(String(n));
    lines.push(`${vttTimestamp(start)} --> ${vttTimestamp(end)}`);
    lines.push(text);
    lines.push('');
  }
  return lines.join('\n');
}

// --- WebVTT parse ------------------------------------------------------------
// Parse a WebVTT document back into { start, end, text } cues. Tolerant of the
// optional numeric cue id line, of CRLF, of a NOTE block, and of both '.' and
// (illegal but common) ',' millisecond separators. Cue setting tokens after the
// timestamp (align:, position:) are ignored. Returns [] for anything unparseable.
const TS = '(\\d{1,2}):(\\d{2}):(\\d{2})[.,](\\d{1,3})';
const SHORT_TS = '(\\d{1,2}):(\\d{2})[.,](\\d{1,3})'; // MM:SS.mmm (no hours)
const CUE_LINE_RE = new RegExp(`^(?:${TS}|${SHORT_TS})\\s*-->\\s*(?:${TS}|${SHORT_TS})`);

function tsToSeconds(h, m, s, ms) {
  const hh = h != null ? parseInt(h, 10) : 0;
  const mm = parseInt(m, 10);
  const ss = parseInt(s, 10);
  const millis = parseInt(String(ms).padEnd(3, '0').slice(0, 3), 10);
  return hh * 3600 + mm * 60 + ss + millis / 1000;
}

// Pull the two timestamps out of a cue-timing line, supporting HH:MM:SS.mmm and
// MM:SS.mmm on either side.
function parseTiming(line) {
  const full = new RegExp(`(?:${TS}|${SHORT_TS})\\s*-->\\s*(?:${TS}|${SHORT_TS})`);
  const m = line.match(full);
  if (!m) return null;
  // Groups 1-4 = HH:MM:SS.mmm start, 5-7 = MM:SS.mmm start,
  //        8-11 = HH:MM:SS.mmm end,   12-14 = MM:SS.mmm end.
  const start = m[1] != null
    ? tsToSeconds(m[1], m[2], m[3], m[4])
    : tsToSeconds(null, m[5], m[6], m[7]);
  const end = m[8] != null
    ? tsToSeconds(m[8], m[9], m[10], m[11])
    : tsToSeconds(null, m[12], m[13], m[14]);
  return { start, end };
}

export function parseVtt(text) {
  const src = String(text == null ? '' : text).replace(/\r\n?/g, '\n');
  if (!src.trim()) return [];
  const blocks = src.split(/\n{2,}/);
  const cues = [];
  for (const block of blocks) {
    const rawLines = block.split('\n').map((l) => l.trim()).filter((l) => l.length);
    if (!rawLines.length) continue;
    if (/^WEBVTT/.test(rawLines[0])) continue;   // header block
    if (/^NOTE\b/.test(rawLines[0])) continue;    // comment block
    // Find the timing line (it may be preceded by a numeric/id line).
    let idx = rawLines.findIndex((l) => CUE_LINE_RE.test(l));
    if (idx === -1) continue;
    const timing = parseTiming(rawLines[idx]);
    if (!timing) continue;
    const textLines = rawLines.slice(idx + 1);
    const cueText = cleanCueText(textLines.join(' '));
    if (!cueText) continue;
    cues.push({ start: timing.start, end: timing.end, text: cueText });
  }
  cues.sort((a, b) => a.start - b.start);
  return cues;
}

// --- Playback sync -----------------------------------------------------------
// activeCueIndex(cues, t) -> index of the cue whose [start, end) contains t, or
// -1 when none is active (before the first cue, in a gap, or after the last).
// Binary search: a 90-minute service is thousands of cues and this runs on every
// timeupdate tick, so it must be O(log n), not a linear scan.
export function activeCueIndex(cues, t) {
  const list = Array.isArray(cues) ? cues : [];
  const time = Number(t);
  if (!list.length || !Number.isFinite(time)) return -1;
  let lo = 0;
  let hi = list.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    const cue = list[mid];
    if (time < cue.start) {
      hi = mid - 1;
    } else if (time >= cue.end) {
      lo = mid + 1;
    } else {
      ans = mid;
      break;
    }
  }
  return ans;
}

export function activeCue(cues, t) {
  const i = activeCueIndex(cues, t);
  return i === -1 ? null : cues[i];
}

// --- Search ------------------------------------------------------------------
// Case-insensitive substring search across cue text. Returns matches with their
// cue index and start time so a surface can render a jump-to list ("search the
// sermon, tap a line, the video seeks there").
export function searchCues(cues, query) {
  const list = Array.isArray(cues) ? cues : [];
  const q = String(query == null ? '' : query).trim().toLowerCase();
  if (q.length < 2) return [];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (c && c.text && c.text.toLowerCase().includes(q)) {
      out.push({ index: i, start: c.start, end: c.end, text: c.text });
    }
  }
  return out;
}

// --- Coverage / provenance ---------------------------------------------------
// A caption track is "real" (renderable) only when it has at least one timed cue.
// An untimed transcript (plain text, no cues) is explicitly NOT a caption track —
// it can be read, but it cannot follow the video. This distinction is what the
// captions-coverage report counts: a video is "captioned" only when hasCaptions
// is true, never merely because a transcript blob exists.
export function hasCaptions(cues) {
  return Array.isArray(cues) && cues.some((c) => c && c.text && safeSeconds(c.end) > safeSeconds(c.start));
}

// Known provenance labels for a track (shown to the user as "Captions: <source>").
// ONE vocabulary across the whole stack: these keys are the SAME values the
// video_transcripts.source column already stores (migration 0058's CHECK enum),
// so a row's provenance flows DB -> lib -> UI without a translation table
// (consistency standard, DR-0079). 'youtube-asr' is fast/zero-GPU; 'whisper-nas'
// is the sovereign, higher-quality track from the church GPU box; 'manual' is a
// human-corrected caption.
export const CAPTION_SOURCES = {
  'youtube-asr': 'YouTube auto-captions',
  'whisper-nas': 'Whisper (sovereign, church GPU)',
  manual: 'Human-corrected',
  unknown: 'Unknown source',
};

export function captionSourceLabel(source) {
  const key = String(source == null ? '' : source).trim();
  return CAPTION_SOURCES[key] || CAPTION_SOURCES.unknown;
}

// A one-call summary of a track for a coverage row / report cell.
export function captionSummary({ vtt, cues, source } = {}) {
  const parsed = Array.isArray(cues) ? cues : parseVtt(vtt);
  const captioned = hasCaptions(parsed);
  return {
    captioned,
    cueCount: captioned ? parsed.length : 0,
    durationSec: captioned ? Math.max(...parsed.map((c) => safeSeconds(c.end))) : 0,
    source: source || 'unknown',
    sourceLabel: captionSourceLabel(source),
  };
}
