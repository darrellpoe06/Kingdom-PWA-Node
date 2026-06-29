// =============================================================================
// surface-digest — turn the CURRENT screen into a grounded "digest" to talk about
// =============================================================================
// The "talk about this" engine (lib/talk-about.js) explains a surface from a
// DIGEST: a small, structured snapshot of what is really on the screen — its
// title, its real numbers, and the standouts. This module BUILDS that digest, and
// it does so honestly (DR-0076): it never guesses numbers out of arbitrary text.
//
// TWO HONEST SOURCES, in order:
//   1. data-talk markers — a surface OPTS IN by tagging its real metrics, so the
//      digest carries exactly the figures the surface chose to expose, with their
//      real labels/deltas/status. This is the high-quality "talk about your
//      numbers" path. A surface joins it by adding attributes (perpetual
//      improvement, DR-0075):
//        data-talk-fact="Cash today"  data-talk-value="$12,400"
//        data-talk-delta="+3%"        data-talk-status="below par"   (delta/status optional)
//        data-talk-item="Rent due"    data-talk-note="Jul 1"          (a standout/list row)
//        data-talk-title="Forecast"                                   (optional title override)
//   2. authored help — when a surface has no markers, the digest falls back to the
//      surface's "?" help entry (lib/help-content.js), so "talk about this" can
//      still explain WHAT the tab/tool is. This ties the two together: ask Ari to
//      talk about a screen and, absent live numbers, he tells you what it is for.
//
// If a surface has neither, the digest is an HONEST empty: "I can read this
// screen, but I do not have a summary for it yet" — never an invented one.
//
// Pure DOM-reading helpers (extractFacts/extractItems/readTitle) take any element
// with querySelectorAll, so they unit-test against a jsdom fragment with no app.
// =============================================================================

// Turn a lib/help-content entry into a "help" digest (the EXPLAIN-what-this-is
// path). Pure transform — no registry import; the caller resolves the entry.
export function digestFromHelp(entry) {
  if (!entry) return null;
  return {
    title: entry.title || 'this screen',
    kind: 'help',
    lead: entry.tag || '',
    help: {
      what: entry.what || '',
      why: entry.why || '',
      how: Array.isArray(entry.how) ? entry.how : [],
    },
  };
}

// Pull real, surface-declared facts out of the DOM: every [data-talk-fact].
export function extractFacts(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return [];
  return Array.from(root.querySelectorAll('[data-talk-fact]'))
    .map((el) => {
      const label = (el.getAttribute('data-talk-fact') || '').trim();
      const attrVal = el.getAttribute('data-talk-value');
      const value = (attrVal != null ? attrVal : (el.textContent || '')).trim();
      const delta = (el.getAttribute('data-talk-delta') || '').trim();
      const status = (el.getAttribute('data-talk-status') || '').trim();
      const f = { label, value };
      if (delta) f.delta = delta;
      if (status) f.status = status;
      return f;
    })
    .filter((f) => f.label && f.value !== '');
}

// Pull surface-declared standouts/list rows: every [data-talk-item].
export function extractItems(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return [];
  return Array.from(root.querySelectorAll('[data-talk-item]'))
    .map((el) => {
      const label = (el.getAttribute('data-talk-item') || el.textContent || '').trim();
      const note = (el.getAttribute('data-talk-note') || '').trim();
      const it = { label };
      if (note) it.note = note;
      return it;
    })
    .filter((it) => it.label);
}

// Best-effort screen title: an explicit data-talk-title, else the first heading.
export function readTitle(root) {
  if (!root || typeof root.querySelector !== 'function') return '';
  const explicit = root.querySelector('[data-talk-title]');
  if (explicit) {
    return (explicit.getAttribute('data-talk-title') || explicit.textContent || '').trim().slice(0, 80);
  }
  const h = root.querySelector('h1, h2');
  return h ? (h.textContent || '').trim().slice(0, 80) : '';
}

/**
 * Build the digest for the current surface.
 * @param {{ root?: Element, helpEntry?: object|null, title?: string }} args
 *   root      - the DOM subtree to read (typically <main>)
 *   helpEntry - the surface's lib/help-content entry, if any (the "?" content)
 *   title     - an explicit title override
 * @returns {object} a digest for lib/talk-about narrateDigest/talkAboutSurface
 */
export function buildSurfaceDigest({ root, helpEntry, title } = {}) {
  const facts = extractFacts(root);
  const items = extractItems(root);
  const help = helpEntry || null;
  const resolvedTitle = (title && String(title).trim())
    || (help && help.title)
    || readTitle(root)
    || 'this screen';

  // Real on-screen numbers -> a data digest (carry the help one-liner as lead).
  if (facts.length || items.length) {
    const d = { title: resolvedTitle, kind: 'dashboard', facts, items };
    if (help && help.tag) d.lead = help.tag;
    return d;
  }

  // No markers, but we have authored help -> explain what the surface IS.
  if (help) return digestFromHelp(help);

  // Nothing to ground on -> honest empty.
  return { title: resolvedTitle, kind: 'generic', facts: [], items: [], empty: true };
}
