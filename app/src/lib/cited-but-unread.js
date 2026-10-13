// =============================================================================
// cited-but-unread — a citation is a CLAIM, and this is its receipt
// =============================================================================
// Darrell 2026-08-11, after catching it live: "if you reviewed the Ways and
// documentation... did you?" — then, structurally: "How can we make sure what
// is required reading for context actually gets read by claude?"
//
// WHAT ACTUALLY HAPPENED (the incident this exists to prevent recurring):
// building the Your Data surface, the agent wrote
// `DATA-AS-EMPOWERMENT-NOT-EXTRACTION` into a file header without ever opening
// that document. It had the GIST from CLAUDE.md's summary, and this repo's
// house style puts foundation-doc names in every header, so a plausible
// citation was easy to produce. It was decoration signalling alignment rather
// than evidence of it.
//
// The cost was not cosmetic. Reading the document later changed the design: the
// sync table was about to ship INSTANCE-scoped, which would have exposed one
// family member's delete-authorisation to another. The unearned citation would
// have been sitting in the header the whole time, making unreviewed work look
// reviewed. That is worse than no citation at all — it spends trust that was
// never earned, and it is invisible in review precisely because it looks right.
//
// WHY A GATE AND NOT A RULE (DR-0250 machinery over memory, DR-0239): a rule
// saying "read before you cite" is exactly the kind of instruction that
// survives until context compacts. The transcript already records every file
// the session opened, so the claim is checkable. Check it.
//
// FAIL-OPEN AND NARROW ON PURPOSE: this only ever fires on FOUNDATION docs
// (docs/00-foundations/**) and Decision Records, because those are the ones
// CLAUDE.md makes required reading. It does not police ordinary source-file
// mentions, and anything it cannot parse passes. A guard that cries wolf gets
// disabled, and a disabled guard protects nothing.
//
// THE POINTER IS NOT A CITATION (2026-10-09, caught live). Shipping a lesson,
// the reply reported the ledger's own `**Next ID:** DR-0835` as the evidence
// that the claim had landed — and this guard blocked it as cited-but-unread. It
// was right that nothing had been read and wrong about what the number was: the
// Next ID names the next UNCLAIMED record, so no file exists for it yet and
// none can be read. The check was firing on a true statement.
//
// A guard that fires on correct work spends the same trust the original
// incident spent, only from the other side. So the caller passes the ledger
// pointer, and the fix is exactly one rule, no wider:
//
//   an id AT OR ABOVE the ledger's `Next ID` is unclaimed by definition, so it
//   cannot be required reading. It passes. Everything below is policed as
//   before, unchanged.
//
// WHAT THIS DELIBERATELY DOES NOT DO. The first attempt went further: treat an
// id BELOW the pointer with no file as a wrong or invented number. Measured
// against the real ledger that is false, and it would have blocked correct
// work on 57 ids —
//   - DR-0017 to DR-0049 are the PRE-FILE-CONVENTION era: real binding
//     decisions recorded in docs/99-session-notes/**, never as their own files
//     (docs/reviews/REVIEWS.md:263 confirms the range);
//   - others, DR-0655 among them, are claimed by branches still in flight;
//   - the rest are numbers abandoned mid-claim.
// All are legitimately citable, so "no file" proves nothing about a number
// below the pointer. The narrow rule above is the whole change.
//
// Supply no pointer and the behaviour is identical to before, because a caller
// that cannot name the ledger must never quietly relax the gate.
// =============================================================================

// SCREAMING-KEBAB .md names are the foundation-doc idiom in this repo
// (THE-WAY.md, EXCELLENCE-STANDARD.md, ...). Requiring 2+ segments and 8+ chars
// keeps ordinary words and short filenames out.
const FOUNDATION_DOC_RE = /\b([A-Z][A-Z0-9]*(?:-[A-Z0-9]+){1,}\.md)\b/g;
// Decision records: DR-0238, DR-0076 ...
const DR_RE = /\bDR-(\d{4})\b/g;

const MIN_NAME_LEN = 8;

/** Names a doc is "read" under: the bare filename, any path ending in it. */
const mentionsPath = (haystack, name) =>
  haystack.includes(name) || haystack.includes(name.replace(/\.md$/, ''));

/**
 * @param {object} opts
 * @param {string} opts.claimText   the reply / diff / commit text making citations
 * @param {string[]} opts.readPaths every path the session demonstrably opened
 *                                  (Read tool file_path, plus shell commands)
 * @param {string[]} [opts.shellText] raw shell commands run this session
 * @param {string|number} [opts.nextDrId] the ledger's `Next ID` pointer. An id
 *                                   at or above it is unclaimed by definition,
 *                                   so it cannot be required reading. Omit it
 *                                   and every cited id is policed as before.
 * @returns {{ok: boolean, unread: string[], cited: string[]}}
 */
export function checkCitedButUnread({
  claimText, readPaths = [], shellText = [], knownDocs = [], nextDrId = null,
} = {}) {
  const text = typeof claimText === 'string' ? claimText : '';
  if (!text) return { ok: true, unread: [], missing: [], cited: [] };

  // PRECISION OVER PATTERN. The first version of this matched SCREAMING-KEBAB
  // ending in `.md` — and MISSED THE REAL INCIDENT, because the header actually
  // read "(DATA-AS-EMPOWERMENT-NOT-EXTRACTION)" with no extension. Loosening the
  // regex to bare kebab would then swallow CLAUDE.md's terminology bindings
  // (NOTICE-TEST-CAPTURE-REDIRECT, WORD-FIRST) and cry wolf.
  //
  // So the caller passes the ACTUAL filenames in docs/00-foundations/**. A name
  // counts as a citation only if it is a real document, with or without its
  // extension. Self-maintaining: add a foundation doc and it is covered.
  const known = (Array.isArray(knownDocs) ? knownDocs : [])
    .filter((d) => typeof d === 'string' && d.endsWith('.md'));

  const evidence = [
    ...(Array.isArray(readPaths) ? readPaths : []),
    ...(Array.isArray(shellText) ? shellText : []),
  ].filter((s) => typeof s === 'string').join('\n');

  const cited = new Set();

  // Real foundation docs, cited with or without the .md extension.
  for (const doc of known) {
    const stem = doc.replace(/\.md$/, '');
    if (stem.length < MIN_NAME_LEN) continue;
    const re = new RegExp(`\\b${stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\.md)?\\b`);
    if (re.test(text)) cited.add(doc);
  }

  // Fallback when no list is supplied: an explicit .md is the only safe signal.
  if (known.length === 0) {
    for (const m of text.matchAll(FOUNDATION_DOC_RE)) {
      const name = m[1];
      if (name.length < MIN_NAME_LEN) continue;
      cited.add(name);
    }
  }
  for (const m of text.matchAll(DR_RE)) cited.add(`DR-${m[1]}`);

  // The ledger pointer, when the caller could read it. An id at or above it has
  // no record yet by definition, so no read of it was ever possible.
  const pointer = Number.parseInt(String(nextDrId ?? '').match(/\d{4}/)?.[0] ?? '', 10);

  const unread = [];
  for (const name of cited) {
    // A DR is satisfied by any read whose path carries its number.
    if (mentionsPath(evidence, name)) continue;

    const dr = name.match(/^DR-(\d{4})$/);
    if (dr && Number.isFinite(pointer) && Number.parseInt(dr[1], 10) >= pointer) continue;

    unread.push(name);
  }

  return { ok: unread.length === 0, unread: unread.sort(), cited: Array.from(cited).sort() };
}

/**
 * Pull the paths this session demonstrably opened out of a Claude Code JSONL
 * transcript. Reads are the Read tool's `file_path`; shell reads (cat, sed,
 * head, grep) count too, since that is how large docs get sampled here.
 *
 * Tolerant by design — an unparseable line is skipped, never fatal.
 */
export function readEvidenceFromTranscript(lines) {
  const paths = [];
  const shell = [];
  for (const line of Array.isArray(lines) ? lines : []) {
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }
    const msg = ev && (ev.message || ev);
    const content = msg && msg.content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (!part || part.type !== 'tool_use' || !part.input) continue;
      if (typeof part.input.file_path === 'string') paths.push(part.input.file_path);
      if (typeof part.input.command === 'string') shell.push(part.input.command);
      if (typeof part.input.pattern === 'string' && typeof part.input.path === 'string') {
        shell.push(`${part.input.pattern} ${part.input.path}`);
      }
    }
  }
  return { paths, shell };
}

/** The message the hook shows. Names what to do, not just what is wrong. */
export function citedButUnreadReason(unread) {
  return [
    'cited-but-unread (DR-0076 §8 / DR-0250) — your reply cites required reading',
    'this session never opened:',
    ...unread.map((u) => `  - ${u}`),
    '',
    'A citation is a CLAIM that you consulted the source. Citing a summary you',
    'already had, in the house style, makes unreviewed work look reviewed — and',
    'that is invisible in review precisely because it looks right.',
    '',
    'Read them now and correct anything they change, or drop the citation and say',
    'plainly what you did rely on.',
  ].join('\n');
}
