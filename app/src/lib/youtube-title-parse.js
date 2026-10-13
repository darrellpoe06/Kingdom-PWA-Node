// youtube-title-parse — dependency-free parsing of @thelovecorner video titles
// into message records (Darrell 2026-06-14). Shared by the in-app sermon
// importer and the local yt-dlp backfill script (scripts/choir-youtube-backfill.mjs),
// so the parsing rule has ONE source of truth. No imports → safe in Node + browser.
//
// Real title shapes observed on the channel:
//   '6 -10 - 2026 Bishop E. Gwin  "LET GO AND LET GOD HELP YOU"'        -> Sunday
//   '6 -3 - 2026 Bishop Lloyd Gwin Wednesday Bible Study  "THANK YOU..."' -> Wednesday
//   '5 - 6 - 26 Bishop Lloyd E. Gwin Wednesday Bible Study "NEED ANSWERS..."'

// Decode the HTML entities YouTube leaves in titles (&quot; &amp; &#39; …) so a
// service card never prints '&QUOT;' literally (the 2026-07-10 Choir sighting —
// harvested titles arrive entity-encoded, sometimes uppercased). Decodes one
// level (&amp; last, so double-encoded text unescapes one honest step). Pure,
// dependency-free, case-insensitive; safe on null.
import { classifyServiceType } from './service-day.js'; // pure sibling util (still Node + browser safe)

export function decodeHtmlEntities(text) {
  if (text == null || typeof text !== 'string') return text ?? null;
  return text
    .replace(/&(?:quot|#0*34);/gi, '"')
    .replace(/&(?:apos|#0*39);/gi, "'")
    .replace(/&(?:lt|#0*60);/gi, '<')
    .replace(/&(?:gt|#0*62);/gi, '>')
    .replace(/&(?:nbsp|#0*160);/gi, ' ')
    .replace(/&(?:amp|#0*38);/gi, '&');
}

export function parseServiceTitle(rawTitle) {
  const title = decodeHtmlEntities(String(rawTitle || ''));
  // Dash, slash, or DOT separators anywhere (e.g. '6 -10 - 2026', '3/5/2025',
  // '1- 7 -26', 'Bible Study 11.8.2023', '10.25.23 Pastor James Harding').
  // The dot form is real on the channel — 128 of the 675 undated titles carried
  // one and the old [-/] class rejected every single one (2026-08-04 audit).
  let dm = title.match(/(\d{1,2})\s*[-/.]\s*(\d{1,2})\s*[-/.]\s*(\d{2,4})/);
  // Fallback: space-separated date at the START of the title ('3 26 25 Bishop...').
  if (!dm) dm = title.match(/^\s*(\d{1,2})\s+(\d{1,2})\s+(\d{2,4})\b/);
  // Last fallback: a space-separated triple ANYWHERE ('Wednesday Bible Study
  // 11 29 23 I'm On The Lord Side'). Mid-title digits are riskier (scripture
  // references are numbers too), so the year is constrained to the channel's
  // real era — 2-digit 10–39 or 4-digit 20xx — and month/day still validate.
  if (!dm) dm = title.match(/\b(\d{1,2})\s+(\d{1,2})\s+(20\d{2}|[123]\d)\b/);
  let serviceDate = null;
  if (dm) {
    const mo = Number(dm[1]);
    const day = Number(dm[2]);
    let yr = Number(dm[3]);
    if (yr < 100) yr += 2000;
    if (mo >= 1 && mo <= 12 && day >= 1 && day <= 31) {
      const pad = (n) => String(n).padStart(2, '0');
      serviceDate = `${yr}-${pad(mo)}-${pad(day)}`;
    }
  }
  // Classify the stream: Sunday / Wednesday, or a conference / funeral for the
  // off-day streams (title wins, then weekday) — one rule, in service-day.js.
  const serviceType = classifyServiceType(title, serviceDate);
  // Double/smart quotes only. An apostrophe is PART of a message title
  // ("YOU CAN'T…", "I'LL…"), not a delimiter — the old single-quote class
  // truncated real titles to 'YOU CAN' and 'I' in the shipped 0013 rows.
  const qm = title.match(/[“"]\s*([^“”"]+?)\s*[”"]/);
  const messageTitle = qm ? qm[1].trim() : null;
  const sm = title.match(/Bishop[^"“]*?Gwin/i);
  const speaker = sm ? sm[0].replace(/\s+/g, ' ').trim() : null;
  return { serviceDate, serviceType, title: messageTitle, speaker };
}

// Pull the 11-char YouTube id from a watch/youtu.be/embed URL (or return null).
export function extractYoutubeId(url) {
  if (!url || typeof url !== 'string') return null;
  let m;
  if ((m = url.match(/[?&]v=([\w-]{11})/))) return m[1];
  if ((m = url.match(/youtu\.be\/([\w-]{11})/))) return m[1];
  if ((m = url.match(/\/embed\/([\w-]{11})/))) return m[1];
  if ((m = url.match(/^([\w-]{11})$/))) return m[1];
  return null;
}
