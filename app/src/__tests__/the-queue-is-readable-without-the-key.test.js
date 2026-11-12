// =============================================================================
// the-queue-is-readable-without-the-key — the lesson lane's second road (DR-1431)
// =============================================================================
// MEASURED, and the reason this file exists. inbox-lessons-waiting.yml is the
// FIRST step of Darrell's hourly lesson intake. Runs #500-#505 — six
// consecutive firings of the PRIORITY lane — all died at the same step, the
// tailnet join, because the runner's Tailscale key expired on 2026-11-04 and
// again by 2026-11-10. For six firings nothing could read a queue sitting on a
// machine that was up the whole time, and the only remedy on offer was a value
// only Darrell can mint, waited on while his teachings sat unread.
//
// The write half already existed and was already enabled: lesson-queue-census.py
// counts the waiting rows on the NAS every services-sync cycle and patches ONE
// row into agent_inbox. Its own registry entry said "NOT YET PROVEN (P66)",
// because the only road out of the house was the same expired key — a witness
// nobody could read. Migration 0320 turns that row outward as
// public.lesson_queue_receipt(), and scripts/served-lesson-queue.py asks it
// over the public road the app itself uses.
//
// WHAT IS PINNED, AND WHY EACH LINE. The lane must keep BOTH roads, in this
// order (the NAS first — only it can name the individual rows); the job must
// still FAIL when neither road read the queue, because both read steps are
// `continue-on-error` now and that is exactly how a lane starts reporting
// success for work it did not do; and the receipt must never be able to carry a
// body, an id, a created_by or a host name out of the house. Each of the last
// three is proven by looking at the migration's own SELECT list, not by trusting
// its comment.
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const repo = join(__dirname, '..', '..', '..');
const wf = readFileSync(join(repo, '.github', 'workflows', 'inbox-lessons-waiting.yml'), 'utf8');
const mig = readFileSync(join(repo, 'infra', 'supabase', 'migrations-auto', '0320-the-house-says-which-teachings-wait.sql'), 'utf8');
const reader = readFileSync(join(repo, 'scripts', 'served-lesson-queue.py'), 'utf8');
const census = readFileSync(join(repo, 'infra', 'nas-loops', 'lesson-queue-census.py'), 'utf8');

/** Collapse whitespace, so a check about a VERDICT does not fail when a formatter rewraps it. */
const flat = (s) => String(s).replace(/\s+/g, ' ');

describe('the lesson lane reads its queue without the runner key', () => {
  it('PROVEN TO CATCH: the second road is wired, so a dead tailnet key no longer ends the lane', () => {
    expect(wf, 'the served road is missing — a dead key is a hard stop again').toContain('scripts/served-lesson-queue.py');
    expect(existsSync(join(repo, 'scripts', 'served-lesson-queue.py'))).toBe(true);
    // The join must be allowed to fail, or the job dies before either road.
    const joinBlock = wf.slice(wf.indexOf('Join the tailnet'), wf.indexOf('Verify the tailnet'));
    expect(joinBlock, 'the join must be continue-on-error for the second road to be reachable').toMatch(/continue-on-error:\s*true/);
  });

  it('the NAS is asked FIRST, because only it can name the individual rows', () => {
    const nas = wf.indexOf('scripts/live-sql.sh');
    const served = wf.indexOf('scripts/served-lesson-queue.py');
    expect(nas).toBeGreaterThan(-1);
    expect(served).toBeGreaterThan(-1);
    expect(nas, 'the served census must be the FALLBACK, never the first ask').toBeLessThan(served);
    // And it runs only when the first road did not answer.
    expect(wf).toMatch(/id:\s*served[\s\S]{0,200}?if:\s*steps\.waiting\.outputs\.read\s*!=\s*'ok'/);
  });

  it('PROVEN TO CATCH: a run where NEITHER road read the queue still fails', () => {
    // Both read steps are continue-on-error, so without this gate the job would
    // close green with "UNKNOWN" in its own log — a green that means nothing.
    const gate = wf.slice(wf.indexOf('A queue that was never read fails this run'));
    expect(gate, 'the closing gate is gone: an unread queue could pass as success').toBeTruthy();
    expect(gate).toMatch(/exit 1/);
    expect(gate).toMatch(/steps\.waiting\.outputs\.read/);
    expect(gate).toMatch(/steps\.served\.outputs\.read/);
    // It must pass only on an 'ok' from one of them, never on their absence.
    expect(gate).toMatch(/"\$\{NAS_READ:-\}"\s*=\s*"ok"\s*\]\s*\|\|\s*\[\s*"\$\{SERVED_READ:-\}"\s*=\s*"ok"/);
  });

  it('the run log names WHICH road answered, and prefers the NAS count', () => {
    const log = wf.slice(wf.indexOf('Record the run (rolling log'));
    expect(log).toMatch(/NAS_READ/);
    expect(log).toMatch(/SERVED_READ/);
    expect(log, 'a reader must never have to guess which question was answered').toMatch(/ROAD=/);
    // The rows detail belongs to the NAS road alone: the census carries no ids.
    expect(log).toMatch(/\[\s*"\$\{NAS_READ:-\}"\s*=\s*"ok"\s*\][\s\S]{0,120}waiting-rows\.txt/);
  });
});

describe('the receipt cannot carry a person’s words out of the house', () => {
  it('PROVEN TO CATCH: the migration never selects a body, an id or a created_by', () => {
    // The census row holds only counts, but this function reads the table that
    // holds every teaching, so its SELECT list is the thing to pin.
    const select = mig.slice(mig.indexOf('SELECT body, created_at INTO r'), mig.indexOf('LIMIT 1;') + 8);
    expect(select).toMatch(/FROM public\.agent_inbox/);
    // It selects the census row's own body (counts) and must return no part of
    // it verbatim: every returned field is rebuilt by name below.
    for (const forbidden of ['created_by', 'r.id', 'instance_id']) {
      expect(select, `the receipt must not read ${forbidden}`).not.toContain(forbidden);
    }
    const returned = mig.slice(mig.indexOf('RETURN jsonb_strip_nulls'));
    for (const forbidden of ["'host'", "'id'", "'created_by'", "'body'"]) {
      expect(returned, `${forbidden} must never leave the house`).not.toContain(forbidden);
    }
  });

  it('only rows the NAS itself wrote count, so a member’s lookalike cannot speak for the house', () => {
    expect(mig).toMatch(/tags @> '\["lesson-queue-census"\]'::jsonb/);
    expect(mig, 'without the source check any member row with that tag would be read as the census').toMatch(/AND source = 'nas-loops'/);
  });

  it('every road and shape name it will speak is one the repository already publishes', () => {
    // The census invents neither: both lists come from lesson-queue-census.py,
    // and a key invented anywhere upstream must be dropped rather than relayed
    // (the shape 0318 proved for service names).
    const roadsBlock = census.match(/^ROADS = \(([^)]*)\)/m);
    expect(roadsBlock, 'ROADS could not be read from the census — the parse is wrong, not the migration').toBeTruthy();
    const roads = roadsBlock[1].match(/"([a-z-]+)"/g).map((s) => s.replace(/"/g, ''));
    for (const r of roads) expect(mig, `by_road key ${r} is missing from the allowed list`).toContain(`'${r}'`);
    expect(mig, 'a road the census buckets as "other" must be sayable too').toContain("'other'");
    // Scoped to shape_of's own body: publish() also returns bare strings
    // ('patched', 'inserted') and those are not shapes the census ever speaks.
    const shapeFn = census.slice(census.indexOf('def shape_of('), census.indexOf('def census_of('));
    const shapes = [...shapeFn.matchAll(/return "([a-z-]+)"/g)].map((m) => m[1]);
    expect(shapes.length, 'shape_of returned nothing — the parse is wrong, not the migration').toBeGreaterThan(3);
    for (const s of shapes) expect(mig, `by_shape key ${s} is missing from the allowed list`).toContain(`'${s}'`);
    expect(mig).toMatch(/k = ANY\(k_roads\)/);
    expect(mig).toMatch(/k = ANY\(k_shapes\)/);
  });

  it('the public key’s role may call it and nothing more', () => {
    expect(mig).toMatch(/SECURITY DEFINER/);
    expect(mig).toMatch(/SET search_path = public/);
    expect(mig).toMatch(/REVOKE ALL ON FUNCTION public\.lesson_queue_receipt\(\) FROM PUBLIC/);
    expect(mig).toMatch(/GRANT EXECUTE ON FUNCTION public\.lesson_queue_receipt\(\) TO anon, authenticated/);
  });
});

describe('an unread queue is never reported as an empty one (DR-1186)', () => {
  it('PROVEN TO CATCH: a count out of range goes MISSING rather than becoming zero', () => {
    // Measured on this migration's own proof run: the first shape clamped into
    // [0, 100000], and a corrupt body carrying total -5 read back as total 0 —
    // a manufactured "nothing is waiting". The clamp is gone.
    expect(mig, 'a clamp on total would turn a corrupt body into an empty queue').not.toMatch(/'total'[\s\S]{0,120}GREATEST\(0/);
    expect(mig).toMatch(/\(b ->> 'total'\) ~ '\^\[0-9\]\{1,6\}\$'/);
    expect(mig).toMatch(/jsonb_strip_nulls/);
  });

  it('the reader has a separate refusal, and a separate sentence, for every way a count can be missing', () => {
    // Each of these must be its own exit code: unasked, unreachable, never
    // counted, no usable total, too stale to be current.
    for (const code of [10, 11, 12, 13, 14]) {
      expect(reader, `exit ${code} is not documented`).toMatch(new RegExp(`exit\\s+${code}\\b`));
    }
    // And none of them may report a number. Matched on COLLAPSED whitespace:
    // whether a return sits on one line or five is the formatter's call, and
    // this check is about the verdict. It broke once on a reformat that
    // changed no behaviour, which is a check coupled to the wrong thing.
    const flatReader = flat(reader);
    const refusals = flatReader.match(/return \( 1[0-4], "failed", "unknown"/g) || [];
    expect(refusals.length, 'a refusal that reports a count is a refusal that lies').toBeGreaterThanOrEqual(4);
    expect(flatReader, 'a refusal must never report zero').not.toMatch(/return \( 1[0-4], "failed", 0/);
  });

  it('a census too old to be current is unknown, not a stale number presented as today', () => {
    // The NAS clock is 15 min; past four cycles the loop is not running, and a
    // number from then is not an answer about now.
    expect(reader).toMatch(/SILENT_AFTER_MIN = CLOCK_MIN \* 4/);
    expect(reader).toMatch(/age > SILENT_AFTER_MIN/);
    // Matched on COLLAPSED whitespace, because the formatter decides whether a
    // return is one line or five and this check is about the verdict, not the
    // layout: it broke once on a reformat that changed no behaviour at all.
    const stale = flat(reader.slice(reader.indexOf('age > SILENT_AFTER_MIN')));
    expect(stale.slice(0, 700), 'a stale census must refuse with 14 and report no number').toMatch(/return \( 14, "failed", "unknown"/);
  });

  it('the exclusions travel WITH the count, so which question was answered is never assumed', () => {
    expect(mig).toMatch(/'excludes', v_excl/);
    expect(reader).toMatch(/Not counted as waiting/);
    expect(reader, 'a census that named no exclusions must say so, not imply the full list').toMatch(/did not say which tags it excluded/);
  });
});
