#!/usr/bin/env node
// =============================================================================
// site-health-verdict — THE WITNESS MUST NOT BE A CONSTANT
// =============================================================================
// 2026-10-12, measured on the instrument itself.
//
// WHAT WAS MEASURED, not recalled:
//
//   last green site-health run ... 37952054170, 2026-10-09T15:28:55Z
//   every run since ............. 22 consecutive FAILURES, ~65 hours
//   reason on each .............. the same single line
//   incident issue #2057 ........ 29 comments, one cause
//   run-name: ................... absent, so all 1,553 runs share one title
//
// Live, run 38222589060 at 2026-10-12T08:17Z: `REASONS` held exactly one
// reason — NO PAGES FUNCTION IS RUNNING — with PAGES_CODE 200, BACKEND_CODE
// 200 and SERVED == MAIN == 6b9563b. The site is up and fresh; the Cloudflare
// Functions layer is dark, has been since 2026-10-09, and no code change
// reaches it.
//
// THE DEFECT IS NOT THE OUTAGE. IT IS THAT A NEW FAULT IS NOW INVISIBLE.
// A second fault arriving today would append one more clause to the same
// `fail_reasons` string inside an already-red run, producing the identical
// `failure` conclusion, the identical display title, and comment #30 on an
// issue nobody can read any more. The witness DR-0125 created — specifically
// because every other safeguard watched the pipeline and none watched the
// product — has emitted one unchanging value for two and a half days, and an
// unchanging value carries no information.
//
// site-health.yml:434 wrote the prediction itself, about a different probe:
// "A witness that cries wolf gets deleted." It is now happening to the witness.
//
// WHAT THIS DOES NOT DO: it does not turn red green. The site genuinely IS
// broken — every NAS-backed road is dark. Reporting that as healthy would be
// the DR-0973 decision-4 violation (unknown, or known-broken, must never read
// as pass) and would be far worse than the noise. The run keeps failing. The
// only thing that changes is that the run SAYS WHICH FAULT IT IS, so a new one
// is distinguishable at a glance from an old one nobody can fix from here.
//
// THE CARVE-OUT IS THE DANGEROUS PART, AND IT IS BUILT TO FAIL LOUD.
// A "known outage" registry is a suppression mechanism, and a stale entry in
// one is the exact failure class this week has been made of: `rentable_level`
// read but never written; a Gmail `-label:` that excluded nothing; DR-0610's
// budget that had been gone twelve days. So:
//
//   1. EVERY ENTRY EXPIRES. Past its `until` date the entry stops matching and
//      its reason reads NEW again. An expired carve-out restores the loud
//      behaviour rather than silently extending itself.
//   2. ANYTHING LEFT OVER READS NEW. Unknown is not pass (DR-0076 §8).
//   3. AN ENTRY IS EXCISED BY ITS HEAD *AND* ITS TAIL, NOT BY SPLITTING.
//      The first version of this file split `fail_reasons` on '; ' and the
//      first test — written against the VERBATIM reason rather than a tidy
//      paraphrase — failed on it immediately: the real reason contains
//      'text/html; charset=utf-8', so the split cut the known reason in half
//      and its second half matched nothing. The carve-out could not recognise
//      the one outage it was written for, and would have read NEW on every
//      run: the same constant, relabelled. A paraphrased fixture would have
//      passed and shipped broken.
//      So a known reason is removed from the text by locating its stable head
//      and its stable tail and cutting between them. If EITHER has drifted the
//      excision does not happen, the text stays residual, and the verdict is
//      NEW. Re-wording an add_fail therefore makes the witness louder, which
//      is the only safe direction for a change nobody remembered to make here.
//   3. THE CARVE IS NARROW — one signature, not a family. The /sb and SIGN-IN
//      reasons share #2057's root cause, and they are deliberately NOT carved:
//      a family locked out of sign-in must always read NEW and urgent.
import { pathToFileURL } from 'node:url';

/**
 * Outages that are MEASURED, RECORDED, and unreachable from this repository.
 * A reason matching one of these is still a failure — it is simply not news.
 *
 * `since`  — the first run that measured it, so the verdict can say "day N".
 * `until`  — when this carve-out DIES. Past it, the reason is loud again.
 * `issue`  — where the evidence already lives.
 */
export const KNOWN_OUTAGES = [
  {
    id: 'cf-pages-functions',
    issue: 2057,
    // The stable leading phrase of the add_fail at site-health.yml:354. The
    // middle of that reason interpolates a measured content-type, so matching
    // the whole string would match nothing.
    signature: 'NO PAGES FUNCTION IS RUNNING',
    // Its stable closing phrase, from the same line. Both are required: the
    // reason is excised from head to tail, so a re-wording of either end
    // stops the carve-out working and the witness goes loud.
    tail: 'and no code change reaches it',
    since: '2026-10-09T15:46:45Z',
    // EXPIRED, AND THE OUTAGE IT NAMES IS MEASURED OVER (2026-10-29, DR-1291).
    // cf-pages-diagnose run 40810753037, 2026-10-29T03:16Z, on the live custom
    // domain: /sb/auth/v1/health 200 signed pages-function (real GoTrue JSON),
    // /cams/health 200 signed (real go2rtc JSON), /nas-photos/healthz 200
    // signed. The Pages Function layer is UP. The entry stays, past its date
    // and matching nothing, as the record of what 2026-10-09 was; it is not
    // renewed, because renewing a carve-out for an outage that ended is how a
    // suppression list starts lying.
    until: '2026-10-26',
    what: 'every Cloudflare Pages Function stopped being invoked',
    reach: 'Cloudflare-side — no code change in this repository reaches it',
  },
  {
    // THE WORKER ROADS (DR-1158). #2285 taught the witness to look for the
    // poetech-roads Worker on its zone route (DR-1124), and the first look,
    // run 39507209827 at 2026-10-20T22:20Z, found the SPA shell where the
    // Worker's JSON 401 belongs: the Worker has never been deployed. Measured
    // why on the same night (cf-roads-worker run 39508087503, read-only
    // probe): the repository's Cloudflare token verifies "active" and sees
    // ZERO zones and ZERO Workers scripts — a Pages-only token. The deploy
    // needs Account > Workers Scripts:Edit and Zone > Workers Routes:Edit
    // for poetech.us, a token only Darrell can mint in his dashboard.
    //
    // Without this entry the same unchanged reading was written to #2057 as
    // "A FAULT NOT ALREADY ON RECORD" four times in eight hours (22:20,
    // 23:08, 01:32, 05:45) — the 29-comments-in-65-hours shape DR-0975 was
    // written to end. The run STILL FAILS; only the repetition stops.
    id: 'cf-roads-worker',
    issue: 2057,
    // The stable head and tail of the add_fail in site-health.yml (the
    // middle interpolates the measured code and content-type).
    signature: 'THE WORKER ROADS ARE DARK TOO',
    tail: "the wrangler zone route or the Worker's own deploy is the place to look",
    since: '2026-10-20T22:20:24Z',
    // 2026-10-29, DR-1291: MOVED FROM '2026-10-28' TO THE DATE OF THE DECISION
    // THAT GOVERNS THIS READING, not because it was noisy.
    //
    // The old date was sized on 2026-10-20 to "a week for the token to land".
    // The NEXT DAY, DR-1180 decided the token is asked for ONCE and then the
    // system stops asking, and set its own re-review at 2026-11-18 — four
    // weeks. The carve-out kept the death date of a premise that had been
    // replaced, so on 2026-10-29T00:00Z it expired into exactly the shape
    // DR-1180:39 predicted it would ("four notes in eight hours, the shape
    // DR-0975 ended"): 4 runs, each writing 🆕 "A FAULT NOT ALREADY ON RECORD"
    // to #2404 and ringing the family's phones at priority 5, about the one
    // thing Darrell had said to stop raising.
    //
    // DR-1180:71 expected this entry to be nearly dead code — "the only case
    // that can still produce it" being both doors dark. That was wrong, and the
    // reason is fixed in site-health.yml this same change: the Worker arm now
    // reads the first-door VERDICT instead of one proxy road's header. With
    // that fix this entry really is the both-doors safety net it was described
    // as, and its date should expire with the decision, not three weeks early.
    //
    // It still expires. 2026-11-18 is DR-1180's own re-review, where the
    // question becomes whether the Edge Guard is wanted at all; whichever way
    // that goes is a record, and this entry dies with it.
    until: '2026-11-18',
    what: 'the poetech-roads Worker is not deployed on its zone route (/edge/* answers the SPA shell)',
    reach: 'needs a Cloudflare token with Workers Scripts:Edit and Workers Routes:Edit for poetech.us, which only Darrell can mint; the repository token sees zero zones and zero scripts (cf-roads-worker run 39508087503)',
  },
];

/** Whole days between two instants, floored. Pure. */
function daysBetween(fromIso, now) {
  const a = Date.parse(fromIso);
  const b = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((b - a) / 86_400_000));
}

/** Has this carve-out expired? An unparseable or missing date counts as expired. */
export function carveIsLive(entry, now) {
  const end = Date.parse(`${entry.until}T23:59:59Z`);
  const t = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(end) || !Number.isFinite(t)) return false;
  return t <= end;
}

/**
 * Which fault is this run reporting — a new one, or the one already on record?
 *
 * Pure: no network, no env, no clock of its own. `now` is injected so the
 * expiry behaviour is pinned by tests against a chosen date rather than
 * against the day CI happens to run (which would be a time bomb in the lane).
 *
 * @param {string} reasonsText the probe's `fail_reasons`, pieces joined by '; '
 * @param {{now?: Date|string, known?: Array}} opts
 * @returns {{broken:boolean, anyNew:boolean, newPieces:string[],
 *            knownIds:string[], verdict:string, runName:string,
 *            days:?number, headline:string}}
 */
export function classifyReasons(reasonsText, { now = new Date(), known = KNOWN_OUTAGES } = {}) {
  const text = String(reasonsText ?? '').trim();
  if (!text) {
    return {
      broken: false,
      anyNew: false,
      newPieces: [],
      knownIds: [],
      verdict: 'UP',
      runName: 'UP · fresh',
      days: null,
      headline: 'the probe found nothing wrong.',
    };
  }

  const live = known.filter((k) => carveIsLive(k, now));

  // EXCISE each known reason head-to-tail, then judge what is left. Not a
  // split: the real reason contains an embedded '; ' and splitting cut it in
  // half (see note 3 in the header). A head without its tail is NOT excised,
  // so drift in either end leaves the text residual and the verdict NEW.
  let residual = text;
  const knownIds = [];
  for (const k of live) {
    if (!k.signature || !k.tail) continue;
    const i = residual.indexOf(k.signature);
    if (i < 0) continue;
    const j = residual.indexOf(k.tail, i + k.signature.length);
    if (j < 0) continue; // head present, tail drifted — stays residual, reads NEW
    residual = residual.slice(0, i) + residual.slice(j + k.tail.length);
    if (!knownIds.includes(k.id)) knownIds.push(k.id);
  }

  // Whatever the known reasons did not account for. Unknown is not pass.
  const newPieces = residual
    .split('; ')
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const anyNew = newPieces.length > 0;
  const oldest = knownIds
    .map((id) => live.find((k) => k.id === id))
    .filter(Boolean)
    .sort((a, b) => Date.parse(a.since) - Date.parse(b.since))[0];
  const days = oldest ? daysBetween(oldest.since, now) : null;

  if (anyNew) {
    // The dangerous case: a NEW fault arriving DURING a known outage. It must
    // read NEW, loudly, and must not be averaged in with the thing on record.
    const alongside = knownIds.length
      ? ` (alongside the known ${knownIds.join(', ')}, day ${days})`
      : '';
    return {
      broken: true,
      anyNew: true,
      newPieces,
      knownIds,
      verdict: 'NEW',
      runName: `NEW FAULT${knownIds.length ? ' + known outage' : ''} · ${short(newPieces[0])}`,
      days,
      headline: `a fault NOT already on record${alongside}: ${newPieces.join('; ')}`,
    };
  }

  const ref = oldest ? `#${oldest.issue}` : 'the record';
  return {
    broken: true,
    anyNew: false,
    newPieces: [],
    knownIds,
    verdict: 'KNOWN',
    runName: `still broken · known ${ref} · day ${days}`,
    days,
    headline: oldest
      ? `nothing new. ${oldest.what}, day ${days}, recorded on ${ref}. ${oldest.reach}.`
      : 'nothing new.',
  };
}

/** A few words for the Actions list, which shows one line and no more. */
function short(piece, n = 60) {
  const s = String(piece).replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/**
 * Should this run write to the incident ledger?
 *
 * A NEW fault always writes — that is the whole point. A run that only
 * re-measures something already on record writes at most once a day, because
 * 29 comments in 65 hours is how a ledger stops being read (P53), and the
 * comment that matters then arrives as #30.
 *
 * @param {{anyNew:boolean, lastKnownAt?:?string, now?:Date|string, everyHours?:number}} o
 */
export function shouldWriteLedger({ anyNew, lastKnownAt = null, now = new Date(), everyHours = 24 } = {}) {
  if (anyNew) return { write: true, why: 'a new fault always goes on the record immediately.' };
  if (!lastKnownAt) return { write: true, why: 'nothing on record yet for this known outage.' };
  const last = Date.parse(lastKnownAt);
  const t = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(last) || !Number.isFinite(t)) {
    // Unknown is not pass: if the last write cannot be read, write.
    return { write: true, why: 'the last record could not be dated, so this one is written.' };
  }
  const hours = (t - last) / 3_600_000;
  if (hours >= everyHours) {
    return { write: true, why: `${Math.floor(hours)}h since the last note on this known outage.` };
  }
  return {
    write: false,
    why: `already noted ${Math.floor(hours)}h ago and nothing is new — not repeating it (the ledger stays readable).`,
  };
}

/**
 * Flatten a value to a single line for a `key=value` file.
 *
 * Exported so it is covered by the suite rather than only by a shell run: step
 * 4 of the probe interpolates served page BODY BYTES into its reason
 * ("body starts: $(head -c 120 ...)"), so a reason can carry newlines — and a
 * newline in `$GITHUB_OUTPUT` both corrupts the file and is exactly the shape
 * an injected `verdict=UP` line would take.
 */
export const oneLine = (v) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim();

/**
 * The marker a known-outage note carries, so the NEXT run can find its own
 * last one and decide whether a day has passed.
 *
 * The workflow writes it and greps for it, and a source pin in the suite keeps
 * this constant and that file from drifting apart. If they ever did, the
 * lookup would find nothing and every run would write again — loud, not
 * silent, which is the only acceptable direction for that mistake.
 */
export const KNOWN_MARKER = '<!-- site-health: known outage, still true -->';

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const arg = (name) => {
    const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
    return hit ? hit.slice(name.length + 3) : '';
  };
  const now = arg('now') ? new Date(arg('now')) : new Date();
  const result = classifyReasons(process.env.REASONS || arg('reasons'), { now });
  const ledger = shouldWriteLedger({
    anyNew: result.anyNew,
    lastKnownAt: arg('last-known-at') || null,
    now,
  });
  // key=value for $GITHUB_OUTPUT.
  //
  // EVERY VALUE IS FLATTENED TO ONE LINE, without exception. Step 4 of the
  // probe interpolates served page BODY BYTES into its reason
  // ("body starts: $(head -c 120 ...)"), so a reason can carry newlines — and
  // a newline in a key=value file both corrupts the output and is the shape an
  // injected `verdict=UP` line would take. Flattening here closes that whole
  // class rather than trusting any one producer upstream.
  const out = [
    ['verdict', result.verdict],
    ['any_new', result.anyNew],
    ['run_name', result.runName],
    ['days', result.days ?? ''],
    ['known_ids', result.knownIds.join(',')],
    ['write_ledger', ledger.write],
    ['headline', result.headline],
  ];
  for (const [k, v] of out) console.log(`${k}=${oneLine(v)}`);
  console.error(`site-health-verdict: ${result.verdict} — ${result.headline} (ledger: ${ledger.why})`);
}
