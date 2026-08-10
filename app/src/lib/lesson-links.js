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
  const out = [
    line(module.title),
    '',
    line(module.bigIdea),
    '',
    line(body),
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
