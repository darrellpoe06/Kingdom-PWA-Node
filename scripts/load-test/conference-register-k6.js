// =============================================================================
// k6 load test — conference public registration at ~500-attendee scale
// =============================================================================
// Simulates the REAL path the congregation uses for the 77th National Assembly:
// an ANONYMOUS insert into conference_public_registrations via the Supabase REST
// (PostgREST) data API — exactly what app/src/lib/conference-register.js does
// from the browser (supabase.from(...).insert(row)). No auth, no email, no OTP.
//
// SCOPE (Darrell 2026-06-17): the Assembly is at most ~500 people (high estimate),
// and most pre-register over a window rather than in one burst. This test still
// drives a CONSERVATIVE peak well above a realistic 500-spread so it finds margin,
// not just the happy path.
//
// WHY THIS SHAPE: the registration path is anon-write by design (migration 0027),
// so the Supabase email rate limit does NOT gate it. The thing to actually prove
// is that a ~500-attendee load of anon REST inserts lands as real rows under RLS
// without 4xx/5xx, and that p95 latency stays sane. This script measures that — it
// does NOT estimate it (DR-0076: measure, don't claim).
//
// SAFE BY DESIGN:
//   - Runs against a STAGING / throwaway Supabase project, never production.
//     (Set SUPABASE_URL to a staging project. Rows are real; clean them after.)
//   - Requires migration 0027 to be APPLIED on the target project first, or every
//     insert 404s and the test proves nothing.
//   - Marks every row source='loadtest-k6' so seeded test rows are trivially
//     deletable:  DELETE FROM conference_public_registrations WHERE source='loadtest-k6';
//
// PREREQUISITES (Darrell provisions; never hardcode keys):
//   1. Install k6:  winget install k6  (or https://k6.io/docs/get-started/installation/)
//   2. Apply 0027 on the STAGING project (Studio SQL editor).
//   3. Export the staging URL + anon key (anon key is public-by-design + RLS-gated,
//      but still pass it via env, not the file):
//
//   PowerShell (paste-ready, folder-independent):
//     cd C:\Users\dpoe\Kingdom-PWA-Node
//     $env:SUPABASE_URL = "https://YOUR-STAGING-REF.supabase.co"
//     $env:SUPABASE_ANON_KEY = "YOUR_STAGING_ANON_KEY"
//     k6 run scripts/load-test/conference-register-k6.js
//
// READING THE RESULT:
//   - checks ......... should be 100% (every insert returned 201)
//   - http_req_failed  should be ~0%
//   - reg_insert_fail  custom counter — any non-zero is a real failure to triage
//   - http_req_duration p(95) — the latency budget; flag if it climbs past ~1s
// =============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const SUPABASE_URL = __ENV.SUPABASE_URL;
const ANON_KEY = __ENV.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error(
    'Set SUPABASE_URL and SUPABASE_ANON_KEY env vars (staging project). See the header of this file.'
  );
}

const insertFail = new Counter('reg_insert_fail');
const insertLatency = new Trend('reg_insert_latency_ms', true);

// Ramp sized for a ~500-attendee Assembly — a realistic "leader texts the link and
// people register over the service / over the pre-reg window" load, plus a short
// spike stage (250 VUs) that sits ABOVE any plausible 500-event concurrency so the
// test finds margin, not just the happy path.
export const options = {
  scenarios: {
    congregation_signup: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 40 },   // trickle in
        { duration: '2m', target: 120 },  // main rush (realistic 500-event peak)
        { duration: '1m', target: 250 },  // spike — well beyond a real 500 concurrency
        { duration: '1m', target: 0 },    // drain
      ],
      gracefulStop: '30s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],          // <1% errors
    http_req_duration: ['p(95)<1500'],       // p95 under 1.5s
    reg_insert_fail: ['count<10'],           // essentially zero hard failures
  },
};

const MEALS = ['Regular', 'Vegetarian', 'Vegan', 'Gluten-free', 'Other'];
const FIRST = ['Mary', 'James', 'Ruth', 'Samuel', 'Esther', 'John', 'Naomi', 'Caleb', 'Hannah', 'Paul'];
const LAST = ['Johnson', 'Williams', 'Brown', 'Davis', 'Carter', 'Mitchell', 'Robinson', 'Coleman'];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function () {
  const endpoint = `${SUPABASE_URL}/rest/v1/conference_public_registrations`;

  // Mirror buildRegistrationRow() in app/src/lib/conference-register.js. The
  // BEFORE-INSERT trigger forces instance_id to COLG, so we deliberately do NOT
  // send it (proving the public client cannot influence routing).
  const body = JSON.stringify({
    conference_name: '77th National Assembly',
    name: `${pick(FIRST)} ${pick(LAST)}`,
    email: null,
    phone: null,
    meal_type: pick(MEALS),
    dietary: null,
    days: null,
    party_size: 1 + Math.floor(Math.random() * 4),
    source: 'loadtest-k6', // tag so seeded rows are trivially deletable
    status: 'new',
  });

  const params = {
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    tags: { name: 'conf_register_insert' },
  };

  const res = http.post(endpoint, body, params);
  insertLatency.add(res.timings.duration);

  const ok = check(res, {
    'insert returned 201': (r) => r.status === 201,
  });
  if (!ok) {
    insertFail.add(1);
    // Surface the first few failures with the real PostgREST error for triage.
    if (__ITER < 5) console.error(`insert failed: status=${res.status} body=${res.body}`);
  }

  // Humans don't hammer — a brief think-time between a VU's submissions keeps the
  // mix realistic (one person rarely registers twice in the same second).
  sleep(Math.random() * 2 + 0.5);
}
