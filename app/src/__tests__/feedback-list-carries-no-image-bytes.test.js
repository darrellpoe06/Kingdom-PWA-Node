// =============================================================================
// The feedback list never carries image bytes — the 2026-08-14 egress lockout
// =============================================================================
// On 2026-08-14 every account across all three apps (PoeTech, The Love Corner,
// MooreDivahs, TLC Therapy Solutions) was signed out and could not get back in.
// Supabase answered HTTP 402 on /auth/v1/token, /auth/v1/signup and every
// /rest/v1 path: "Service for this project is restricted due to the following
// violations: exceed_egress_quota."
//
// The spend was measured to `public.feedback`: 6.2 MB of base64 image data
// across 24 rows, pulled in full by `subscribeFeedback`'s `.select('*')` — with
// no limit — once per sign-in for EVERY signed-in user, and again on every
// realtime INSERT.
//
// These are the pins that keep it fixed. They are deliberately source-level for
// the query shape: the defect is not something the mapper's return value can
// show, because a `select('*')` and a narrow select produce the same objects in
// a test double. The thing that broke was WHAT WAS ASKED FOR over the wire, so
// that is what is asserted.
//
// PROVEN-TO-CATCH (DR-0076 §3): restoring `.select('*')` fails "names its
// columns"; deleting the `.limit(...)` fails "bounds the query"; putting
// `screenshot`/`screenshots` back in FEEDBACK_LIST_COLUMNS fails "no image
// column"; dropping either generated column from migration 0135 fails the
// two-places-agree case; and making `toPrototypeShape` ignore the derived
// columns fails the behavioural cases at the bottom.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SYNC_SRC = readFileSync(join(HERE, '../lib/feedback-sync.js'), 'utf8');
const MIGRATION = readFileSync(
  join(HERE, '../../../infra/supabase/migrations-auto/0135-feedback-screenshot-presence-without-the-bytes.sql'),
  'utf8',
);

/** The literal contents of the FEEDBACK_LIST_COLUMNS array, from source. */
function listColumns() {
  const m = SYNC_SRC.match(/const FEEDBACK_LIST_COLUMNS = \[([\s\S]*?)\]\.join/);
  if (!m) throw new Error('FEEDBACK_LIST_COLUMNS not found — did the constant get renamed?');
  return [...m[1].matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
}

/**
 * The body of subscribeFeedback's fetchOthers query, from source.
 *
 * Anchored on the `fetchOthers` declaration, NOT on the first
 * `.from('feedback')` in the file — `uploadFeedback` and
 * `fetchFeedbackImages` both hit the same table, and a loose anchor here
 * measured the wrong query on this test's first run.
 */
function listQuery() {
  const m = SYNC_SRC.match(/const fetchOthers = async \(\) => \{([\s\S]*?)\n {4}\};/);
  if (!m) throw new Error('fetchOthers was not found — did the list query move?');
  return m[1];
}

/** SQL with `--` comments removed, so prose is never measured as code. */
function sqlCode(src) {
  return src.split('\n').map((l) => l.replace(/--.*$/, '')).join('\n');
}

describe('the feedback list query', () => {
  it('names its columns instead of starring them', () => {
    const q = listQuery();
    expect(q).not.toMatch(/\.select\('\*'\)/);
    expect(q).toContain('FEEDBACK_LIST_COLUMNS');
  });

  it('bounds the query, so its cost cannot grow without limit', () => {
    expect(listQuery()).toMatch(/\.limit\(FEEDBACK_LIST_LIMIT\)/);
    const m = SYNC_SRC.match(/const FEEDBACK_LIST_LIMIT = (\d+)/);
    expect(m, 'FEEDBACK_LIST_LIMIT must be a literal number').toBeTruthy();
    expect(Number(m[1])).toBeGreaterThan(0);
  });

  it('asks for no image column — those are the 6.2 MB', () => {
    const cols = listColumns();
    expect(cols).not.toContain('screenshot');
    expect(cols).not.toContain('screenshots');
  });

  it('still asks for what the board actually renders', () => {
    const cols = listColumns();
    for (const needed of ['id', 'feedback_text', 'submitted_at', 'display_name', 'triage_status']) {
      expect(cols, `the board reads ${needed}`).toContain(needed);
    }
  });
});

// TWO PLACES THAT MUST AGREE.
//
// The derived columns are computed in the database and consumed by the client.
// A rename on either side leaves the badge silently reporting "no screenshot"
// for every row — the exact painted-answer failure the migration exists to
// avoid. This is the recurring house shape (a comment keeping two lists in
// agreement); derive the check from both sources instead.
describe('the derived presence columns', () => {
  it('exist in migration 0135 as generated columns', () => {
    for (const col of ['screenshot_count', 'has_screenshot']) {
      const re = new RegExp(`ADD COLUMN IF NOT EXISTS ${col}[\\s\\S]*?GENERATED ALWAYS AS`);
      expect(sqlCode(MIGRATION), `${col} must be generated, never hand-set`).toMatch(re);
    }
  });

  it('are STORED, so a read costs nothing to compute', () => {
    const stored = [...sqlCode(MIGRATION).matchAll(/GENERATED ALWAYS AS \([\s\S]*?\) STORED/g)];
    expect(stored).toHaveLength(2);
  });

  it('are exactly the derived columns the client asks for', () => {
    // sqlCode, because this file's header prose contains the literal phrase
    // "additive ADD COLUMN IF NOT EXISTS only" — which the first version of
    // this check read as a column named `only`.
    const declared = [...sqlCode(MIGRATION).matchAll(/ADD COLUMN IF NOT EXISTS ([a-z_]+)/g)]
      .map((m) => m[1])
      .sort();
    const asked = listColumns().filter((c) => declared.includes(c)).sort();
    expect(asked).toEqual(declared);
  });

  // Both of these were found by RUNNING the expressions against a temp table
  // in the real Postgres before shipping, not by reading them. Each produced a
  // wrong answer on its first draft.
  it('report false, never NULL, for a row with no image at all', () => {
    // `false OR NULL` is NULL in SQL. Without the COALESCE the common case
    // (95 of 119 rows) arrives at the client as null, and the badge is only
    // right because a fallback happens to compute the same answer.
    expect(sqlCode(MIGRATION)).toMatch(/COALESCE\([\s\S]*?false\s*\)\s*\) STORED/);
  });

  it('cannot disagree with each other: an empty array never shadows a legacy image', () => {
    // A row with `screenshot` set and `screenshots = []` reported
    // has_screenshot=true with screenshot_count=0 until the array branch was
    // required to be non-empty.
    expect(sqlCode(MIGRATION)).toMatch(
      /WHEN jsonb_typeof\(screenshots\) = 'array' AND jsonb_array_length\(screenshots\) > 0/,
    );
  });

  it('degrade to 0 rather than raising when screenshots is not an array', () => {
    // jsonb_array_length raises on a non-array. A generated column that raises
    // blocks the INSERT, which would turn a malformed payload into "feedback
    // cannot be submitted at all".
    expect(sqlCode(MIGRATION)).toMatch(/jsonb_typeof\(screenshots\) = 'array'/);
  });
});

describe('fetchFeedbackImages', () => {
  it('reads one row by id and asks only for the image columns', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { id: 'f1', screenshot: null, screenshots: ['a', 'b'] },
      error: null,
    });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));
    vi.doMock('../lib/supabase.js', () => ({ default: { from } }));

    const { fetchFeedbackImages } = await import('../lib/feedback-sync.js?images-ok');
    const out = await fetchFeedbackImages('f1');

    expect(out.screenshots).toEqual(['a', 'b']);
    expect(from).toHaveBeenCalledWith('feedback');
    expect(eq).toHaveBeenCalledWith('id', 'f1');
    // One row, and never `*` — this path is the ONLY one allowed to move bytes.
    const asked = select.mock.calls[0][0];
    expect(asked).not.toContain('*');
    expect(asked).toContain('screenshot');
    vi.doUnmock('../lib/supabase.js');
  });

  it('returns an empty set rather than throwing when the read fails', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'nope' } });
    const from = vi.fn(() => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }));
    vi.doMock('../lib/supabase.js', () => ({ default: { from } }));

    const { fetchFeedbackImages } = await import('../lib/feedback-sync.js?images-fail');
    await expect(fetchFeedbackImages('f1')).resolves.toEqual({ screenshots: [] });
    vi.doUnmock('../lib/supabase.js');
  });

  it('does not call out at all without an id', async () => {
    const from = vi.fn();
    vi.doMock('../lib/supabase.js', () => ({ default: { from } }));
    const { fetchFeedbackImages } = await import('../lib/feedback-sync.js?images-noid');
    await expect(fetchFeedbackImages(null)).resolves.toEqual({ screenshots: [] });
    expect(from).not.toHaveBeenCalled();
    vi.doUnmock('../lib/supabase.js');
  });
});

// The mapper has to serve BOTH row shapes: the blob-free list row, and the
// same row re-read with its images. Getting this wrong is what would make the
// badge lie.
describe('presence survives a row that carries no bytes', () => {
  it('trusts the derived columns when they are present', () => {
    // Exercised through the source contract rather than the unexported mapper:
    // the fallback must not be reached when has_screenshot is a real boolean.
    expect(SYNC_SRC).toMatch(/typeof row\.has_screenshot === 'boolean'/);
    expect(SYNC_SRC).toMatch(/Number\.isFinite\(row\.screenshot_count\)/);
  });

  it('still computes presence from the bytes when the derived columns are absent', () => {
    // Rows fetched by fetchFeedbackImages, and any locally-shaped row, have no
    // derived columns — the old computation has to remain as the fallback.
    expect(SYNC_SRC).toMatch(/Array\.isArray\(row\.screenshots\) && row\.screenshots\.length > 0/);
  });
});
