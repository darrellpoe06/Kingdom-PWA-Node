// =============================================================================
// lesson-links — a link to the EXACT lesson, and the copy-paste block that
// carries it
// =============================================================================
// Darrell 2026-08-10, holding the 3rd-Dimension Witness beside the new Healthy
// Living series: "copy paste options for each section... etc... links to the
// exact lessons... etc?"
//
// What existed: the URL carried only `?view=church&sub=learn` — the Learn TAB.
// A person who wanted to hand someone ONE lesson ("read the sleep one") could
// send them to the tab and nothing further; the recipient landed on the course
// picker and had to hunt. And a section a member wanted to text to their sister
// had to be selected by hand, which on a phone means losing the citation, the
// verse, or both — the two things this app refuses to let drift.
//
// So both are built here, as ONE pure module: the canonical URL for a course +
// lesson, and the copy blocks that carry the same material with its citation
// and its verbatim Scripture attached. Pure and injectable — no window, no DOM,
// no framework — so the links can be built and asserted in a plain test.
//
// WHAT A COPY BLOCK MUST ALWAYS CARRY (the reason this is not a `select all`):
//   • the Scripture VERBATIM from the verified corpus, never re-typed;
//   • the expert, credential and work — honour to whom honour is due;
//   • the care note where the material is health material;
//   • the link back to the exact lesson, so a forwarded block can be checked
//     against the room it came from.
// =============================================================================

import { lessonShareText } from './lesson-format.js';

export const LEARN_LINK_PARAMS = { course: 'course', lesson: 'lesson' };

/**
 * The query string for one lesson (or a whole course when `lessonId` is
 * omitted). Kept in the same shape parseNav already reads — view + sub — with
 * two additional params the Learn tab consumes on open.
 */
export function lessonQuery({ courseKey, lessonId } = {}) {
  const key = String(courseKey || '').trim();
  if (!key) return '';
  const parts = ['view=church', 'sub=learn', `course=${encodeURIComponent(key)}`];
  const id = String(lessonId || '').trim();
  if (id) parts.push(`lesson=${encodeURIComponent(id)}`);
  return `?${parts.join('&')}`;
}

/**
 * The full shareable URL. `origin` and `path` are injected (defaulting to the
 * live location) so a test — and a server-side render — can build links with no
 * browser at all.
 */
export function lessonUrl({ courseKey, lessonId, origin, path } = {}) {
  const q = lessonQuery({ courseKey, lessonId });
  if (!q) return '';
  const o = origin !== undefined ? origin
    : (typeof window !== 'undefined' && window.location ? window.location.origin : '');
  const p = path !== undefined ? path
    : (typeof window !== 'undefined' && window.location ? window.location.pathname : '/');
  return `${o || ''}${p || '/'}${q}`;
}

/** Read a lesson deep-link back out of a query string. Tolerant; never throws. */
export function parseLessonLink(search) {
  const out = { courseKey: null, lessonId: null };
  try {
    const sp = new URLSearchParams(search || '');
    const c = (sp.get(LEARN_LINK_PARAMS.course) || '').trim();
    const l = (sp.get(LEARN_LINK_PARAMS.lesson) || '').trim();
    if (c) out.courseKey = c;
    if (l) out.lessonId = l;
  } catch (_) { /* malformed query -> nothing deep-linked */ }
  return out;
}

const line = (s) => String(s == null ? '' : s).trim();

/**
 * The copy-paste block for ONE witness section — the Word first, then the cited
 * claim, then the bridge, with every verse verbatim from the corpus.
 *
 * @param {object} source  a WITNESS_SOURCES entry
 * @param {object} opts
 * @param {Function} opts.verseFor  ref => verbatim text (the verified reader)
 * @param {string}  opts.url        the link back to the exact lesson
 * @param {string}  opts.care       the care note for health material
 */
export function witnessCopyBlock(source, { verseFor = () => '', url = '', care = '' } = {}) {
  if (!source) return '';
  const s = source.source || {};
  const who = [s.expert, s.credential].filter(Boolean).join(', ');
  const out = [
    line(source.topic),
    '',
    line(source.summary),
    '',
    `Source: ${[who, s.work].filter(Boolean).join(' — ')}`,
    '',
  ];
  for (const p of source.pairs || []) {
    const refs = (p.refs || []).join(' · ');
    out.push(`— ${refs}`);
    for (const r of p.refs || []) {
      const text = line(verseFor(r));
      // A verse the verified corpus does not hold is NAMED, never invented and
      // never quietly dropped: the reader is told where to read it instead.
      out.push(text ? `“${text}” (${r}, KJV)` : `${r} — read it in your Bible.`);
    }
    if (p.claim) out.push(`3rd dimension${p.cite ? ` (at ${p.cite})` : ''}: ${p.claim}`);
    if (p.bridge) out.push(`The intertwine: ${p.bridge}`);
    out.push('');
  }
  if (care) out.push(line(care), '');
  if (url) out.push(url);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * The copy-paste block for ONE Learn lesson: its Word-first big idea, the body
 * at the reader's own level, and the link back to it.
 */
export function lessonCopyBlock(module, { url = '', level = 'standard' } = {}) {
  if (!module) return '';
  const body = (module.levels && module.levels[level]) || module.lesson || '';
  // Shared text carries the same numbered-section structure as the screen
  // (Darrell 2026-08-25: "the text when sharing needs the same clean up so
  // there are breaks in the flow of words") — breaks only, never a changed word.
  const out = [
    line(module.title),
    '',
    lessonShareText(line(module.bigIdea)),
    '',
    lessonShareText(line(body)),
  ];
  if (module.anchor && module.anchor.ref) out.push('', `Anchor — ${module.anchor.ref}`);
  if (url) out.push('', url);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * Put text on the clipboard. Resolves true/false rather than throwing, so a
 * caller can show an honest "copied" / "couldn't copy" without a try/catch —
 * and an environment with no clipboard (an older phone browser, a locked-down
 * webview) reports false instead of pretending.
 */
export async function copyText(text, nav = (typeof navigator !== 'undefined' ? navigator : null)) {
  const s = String(text == null ? '' : text);
  if (!s || !nav || !nav.clipboard || typeof nav.clipboard.writeText !== 'function') return false;
  try { await nav.clipboard.writeText(s); return true; } catch (_) { return false; }
}

// =============================================================================
// SHARE — hand the lesson straight to whatever they already use
// =============================================================================
// Darrell 2026-08-10: "can we just share right from the lessons? not have to
// copy a link... users can but not necessary... share and it will open whatever
// they usually do."
//
// Copy-a-link is a THREE-step ask on a phone: tap copy, leave the app, find the
// thread, paste. The device already knows how this person shares — Messages,
// WhatsApp, mail, the church group — so the app should hand the link to the
// operating system and let it offer them. The copy control stays for anyone who
// wants the raw link, exactly as Darrell said; it stops being the only way.

/** Does this device offer a real share sheet? */
export function canShare(nav = (typeof navigator !== 'undefined' ? navigator : null)) {
  return !!(nav && typeof nav.share === 'function');
}

/**
 * What gets handed to the share sheet for one lesson. Title and text are short
 * on purpose: most targets show the URL as a card, and a long body gets
 * truncated mid-sentence by the receiving app — which, on a Scripture-carrying
 * platform, is exactly the drift this codebase refuses (a half-quoted verse is
 * worse than none). The full text still travels by "Copy lesson".
 */
export function lessonSharePayload(module, { url = '', courseTitle = '' } = {}) {
  const m = module || {};
  const title = String(m.title || courseTitle || 'A lesson worth reading').trim();
  const idea = String(m.bigIdea || '').trim();
  const from = String(courseTitle || '').trim();
  const text = [idea, from && `— ${from}, The Love Corner`].filter(Boolean).join('\n');
  return { title, text: text || title, url: String(url || '') };
}

/**
 * What gets handed to the share sheet for a WHOLE COURSE.
 *
 * Darrell 2026-08-10: "I want to also share the whole course... etc."
 *
 * Sharing one lesson hands someone a single sitting; sharing the course hands
 * them the series and lets them start wherever they like. The lesson COUNT
 * rides along because it is the honest measure of what is on offer -- and it is
 * counted by the caller from the live schedule, never typed here (DR-0121). A
 * course with no countable lessons simply says nothing about size rather than
 * printing a zero.
 */
export function courseSharePayload(meta, { url = '', lessonCount = 0, unitPlural = 'lessons' } = {}) {
  const m = meta || {};
  const title = String(m.title || 'A course worth reading').trim();
  const blurb = String(m.blurb || m.subtitle || m.summary || '').trim();
  const n = Number(lessonCount) || 0;
  const size = n > 0 ? `${n} ${unitPlural}, free to read` : 'Free to read';
  const text = [blurb, `${size} \u2014 The Love Corner`].filter(Boolean).join('\n');
  return { title, text, url: String(url || '') };
}

// =============================================================================
// SECTION SHARE — one part of a lesson, as the invitation itself
// =============================================================================
// Darrell 2026-08-15, reading L-series on the tablet: "we need a button to copy
// or share any section as the text... an intro to that lesson for each
// section... usually that prompts the interest of the two people... a specific
// idea or way of merging understanding so the Word is clear to them."
//
// The whole-lesson share hands someone the door; THIS hands them the sentence
// that made you think of them. The section's own text travels as the body —
// specific enough to start the conversation — and the link back to the exact
// lesson rides under it so the two of them land on the same page.

/**
 * The full copy text for ONE SECTION: the section named, its lesson named, the
 * section's text verbatim as rendered, and the link back to the exact lesson.
 */
export function sectionShareText(module, { label = '', text = '', url = '' } = {}) {
  const m = module || {};
  const head = [line(label), line(m.title) && `from ${line(m.title)}`].filter(Boolean).join(' — ');
  const out = [head, '', line(text)];
  if (url) out.push('', `Read the whole lesson: ${url}`);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

/**
 * What the share sheet gets for one section. The section text IS the message
 * body (the invitation), with the course named and the exact-lesson link.
 */
export function sectionSharePayload(module, { label = '', text = '', url = '', courseTitle = '' } = {}) {
  const m = module || {};
  const title = [line(label) || 'A word worth sharing', line(m.title)].filter(Boolean).join(' — ');
  const from = line(courseTitle);
  const body = [line(text), from && `— ${from}, The Love Corner`].filter(Boolean).join('\n');
  return { title, text: body || title, url: String(url || '') };
}

/**
 * Offer the share sheet, falling back to the clipboard where there is none
 * (desktop Firefox, most non-secure contexts, older webviews).
 *
 * Returns WHAT ACTUALLY HAPPENED so the button can say it truthfully (DR-0076):
 *   'shared'    — handed to the OS sheet
 *   'dismissed' — the sheet opened and the person backed out; NOT a failure,
 *                 so the caller must not flash an error at them
 *   'copied'    — no sheet on this device, the link went to the clipboard
 *   'failed'    — neither path worked; the caller must say so plainly
 */
export async function shareLink(payload, nav = (typeof navigator !== 'undefined' ? navigator : null)) {
  const p = payload || {};
  const url = String(p.url || '');
  if (canShare(nav)) {
    try {
      await nav.share({ title: p.title || '', text: p.text || '', url });
      return 'shared';
    } catch (err) {
      // A cancelled sheet throws AbortError. Treating that as an error is the
      // classic bug: the user deliberately backed out and gets shouted at.
      if (err && (err.name === 'AbortError' || err.name === 'NotAllowedError')) return 'dismissed';
      // Anything else (a target that refuses the payload, a webview that lies
      // about having share) falls through to the clipboard rather than dead-end.
    }
  }
  return (await copyText(url || p.text || '', nav)) ? 'copied' : 'failed';
}
