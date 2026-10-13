// =============================================================================
// scripture-reading — one press of play reads a Scripture section start to
// finish: the teaching at EVERY depth, then the verses with their commentary
// =============================================================================
// Darrell 2026-08-13, after the reader was fixed to stop speaking the buttons:
//   "I want users to be able to get the whole lesson from pushing play once...
//    beginning to end."
//   "Verses plus the 'Whosoever — the…' commentary... not the other
//    translations, only KJV and ESV if possible..."
//   "Also each version all the way to deep for each section... understand..."
//
// WHAT THE SCREEN DOES vs WHAT THE EAR NEEDS. The Scripture tab renders ONE
// depth at a time — `resolveDepth(theme, tier)` picks Essential *or* Standard
// *or* Deep, because a reader chooses how far to go and the page respects it.
// A listener cannot tap between tiers mid-sentence, and "each version all the
// way to deep" is the instruction: the spoken reading carries the whole ladder,
// light to deep, in one pass. Reading is not browsing.
//
// ESV — MEASURED, AND THE ANSWER IS NO (not a technical limit). `scriptures.js`
// is explicit: *"Other translations — REFERENCE only (copyright). readOnline()
// links to where a reader opens a copyrighted translation; the text is never
// copied here."* The corpus on disk is `public/bible/kjv` and nothing else, and
// `OtherTranslations` renders outbound BibleGateway LINKS, not text. So there is
// no ESV to read aloud, and putting one here would mean reproducing a
// copyrighted translation the platform has deliberately refused to reproduce.
// KJV is public domain (1611) and is what gets spoken. Darrell's own "if
// possible" is answered: not possible without a licence.
//
// Pure and data-only — no DOM, no window, no framework — so the whole reading
// can be asserted in a plain unit test (DR-0076), which is the only way to know
// a listener will actually hear the deep tier.
// =============================================================================
import { DEPTH_TIERS } from './scripture-teaching.js';
import { toSpokenForm } from './speech-text.js';

const line = (s) => String(s == null ? '' : s).trim();

// A reference is SPOKEN, not printed: "2 Timothy 1:7" must reach the voice as
// "2nd Timothy 1:7" or the engine says "two Timothy" (speech-text.js). The
// written page is never touched — only the string handed to the reader.
export function spokenRef(ref) {
  const r = line(ref);
  return r ? toSpokenForm(r) : '';
}

/**
 * Every AUTHORED depth of a theme, light → deep, deduplicated.
 *
 * Deliberately NOT resolveDepth(): that helper exists to guarantee a reader
 * always sees something, so it falls back down the ladder — ask a
 * standard-only theme for `deep` and you get the standard text back. Reading
 * the ladder through it would speak the same paragraph up to three times in a
 * row, which sounds like a broken machine. This reads only what was actually
 * written, and drops an exact repeat.
 */
export function depthLadder(theme) {
  const depths = (theme && theme.depths && typeof theme.depths === 'object') ? theme.depths : {};
  const out = [];
  const seen = new Set();
  for (const tier of DEPTH_TIERS) {
    const text = line(depths[tier.id]);
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue; // an author who pasted the same text twice
    seen.add(key);
    out.push({ tierId: tier.id, label: tier.label, text });
  }
  // A theme with no authored depth at all still says something rather than
  // skipping the teaching entirely and reading only verses.
  if (out.length === 0 && theme && line(theme.blurb)) {
    out.push({ tierId: 'essential', label: 'Essential', text: line(theme.blurb) });
  }
  return out;
}

/**
 * One verse as it should SOUND: the reference, the KJV text, then the
 * commentary that sits under it on the page (`gloss` — Darrell's "Whosoever —
 * the…" line). The role chip, the Backs chips, the highlight control and the
 * other-translations links are all furniture and are not spoken.
 */
// The edition is NAMED out loud so the listener knows which Bible they heard.
// 2026-09-06: the WEB (public domain, on disk) is the second readable edition;
// a verse carries `text` + `edition` from versesForTheme, and the reading speaks
// exactly what the page shows. Anything without an edition is the KJV.
const EDITION_SPOKEN = { kjv: 'King James Version', web: 'World English Bible' };

export function verseReadingText(verse) {
  const v = verse || {};
  const ref = spokenRef(v.ref);
  const text = line(v.text) || line(v.kjv);
  const edition = EDITION_SPOKEN[String(v.edition || 'kjv').toLowerCase()] || EDITION_SPOKEN.kjv;
  const gloss = line(v.gloss);
  if (!text && !gloss) return '';
  const parts = [];
  if (ref) parts.push(`${ref}.`);
  if (text) parts.push(`${text} ${edition}.`);
  if (gloss) parts.push(gloss);
  return parts.join(' ');
}

/**
 * The whole section, in the order a person would read it down the page:
 * title, blurb, the lens (His perspective / His heart / His love), the soul
 * aim, the teaching at EVERY authored depth, the level framing when one is
 * authored, the fairly-presented views, then every verse with its commentary.
 *
 * @param {object} theme  a THEMES entry
 * @param {object} opts
 * @param {Array}  opts.verses  the theme's verses WITH kjv text resolved
 *   (versesForTheme) — passed in rather than fetched, so this stays pure.
 * @param {string} opts.level   the experience level whose framing to include
 * (each verse may carry `text` + `edition` from versesForTheme; the reading
 * speaks that text and names that edition — KJV when absent)
 */
export function themeReadingText(theme, { verses = [], level = 'standard' } = {}) {
  if (!theme) return '';
  const out = [];
  const push = (s) => { const t = line(s); if (t) out.push(t); };

  push(theme.subtitle ? `${line(theme.title)} — ${line(theme.subtitle)}` : theme.title);
  push(theme.blurb);

  if (theme.lens) {
    push(theme.lens.perspective && `His perspective. ${line(theme.lens.perspective)}`);
    push(theme.lens.heart && `His heart. ${line(theme.lens.heart)}`);
    push(theme.lens.love && `His love. ${line(theme.lens.love)}`);
  }
  push(theme.soul && `For the soul. ${line(theme.soul)}`);

  // The whole ladder — this is "each version all the way to deep".
  for (const d of depthLadder(theme)) push(`${d.label}. ${d.text}`);

  const lvl = theme.levels && typeof theme.levels[level] === 'string' ? line(theme.levels[level]) : '';
  if (lvl && level !== 'standard') push(lvl);

  if (Array.isArray(theme.views) && theme.views.length) {
    push('The main biblical views, presented fairly, Word first.');
    for (const v of theme.views) push([line(v.name), line(v.summary)].filter(Boolean).join('. '));
    push(theme.textNote);
  }

  for (const v of verses || []) push(verseReadingText(v));

  return out.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * The reading target for the Scripture tab.
 *
 * `themes` is the list currently on screen (one theme, or all of them). The
 * reading is the FIRST of those; `next()` walks to the one after it, so a
 * single press of play carries the listener section after section to the end —
 * the hands-free contract read-target.js already defines and the paged surfaces
 * already use. Returns null when there is nothing to read, so the caller
 * registers nothing rather than an empty reading.
 */
export function scriptureReadingPlan(themes, { versesFor, level = 'standard', index = 0, edition = 'kjv' } = {}) {
  const list = Array.isArray(themes) ? themes.filter(Boolean) : [];
  if (!list.length || typeof versesFor !== 'function') return null;
  const i = Number.isInteger(index) && index >= 0 && index < list.length ? index : 0;
  const theme = list[i];
  let verses;
  try { verses = versesFor(theme.id, edition) || []; } catch (_) { verses = []; }
  const text = themeReadingText(theme, { verses, level });
  if (!text) return null;
  return {
    index: i,
    themeId: theme.id,
    label: list.length > 1 ? `${theme.title} and the sections after it` : theme.title,
    text,
    hasNext: i + 1 < list.length,
    nextIndex: i + 1 < list.length ? i + 1 : null,
  };
}
