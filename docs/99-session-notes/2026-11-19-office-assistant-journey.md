# 2026-11-19 — The TLC Assistant journey, signed in (DR-1346)

**Asked:** build the deferred journey `office-assistant-answers` so it changes from `deferred` to `active`. Its date (2026-11-19) had passed, so `journey-coverage-guard` was red on `main`.

**Premise corrected:** the task said "takes a question and shows an answer, with any model or network call stubbed". The TLC Assistant (`app/src/modules/office-assistant/OfficeAssistant.jsx`) has no question-and-answer and no model call. It is the referral database, outreach and content workspace. So the journey walks what the surface actually does: it mounts for the signed-in tier, shows its daily report, and lists back an idea a person types in. There was no model call to stub.

**What a signed-in session needs (traced):** `poe-financial-mvp-v28.jsx` mounts `TlcAssistant` on `view=tlc-assistant` only when `isFamilyMember`, `tierMeets(userTier, 'business')` or an assistant account is true. `isFamilyMember` is a real-email allowlist, so the stand-in does not use it. Instead it takes the business tier through the real path for a non-family sign-in: `syncMemberTier` → `member_subscriptions` (`lib/poetech-plus.js`).

**What changed and why**

| File | Change |
|---|---|
| `scripts/e2e/app-journeys.mjs` | The signed-in stand-in: `STANDIN`, `mintStandinJwt` / `verifyStandinJwt` (HS256 with a throwaway secret that exists only in this file), `standinStorageKey`, `standinSession`, `standinAnswer` (the pure stub for `https://test-stub.supabase.co`, the origin ci.yml builds against), `t.signIn`. The journey `office-assistant-answers` closes the first-sign-in greetings (Arrivals, then the self-serve welcome) as a person would, then asserts the mount, the daily report, the operator's write controls and the saved idea listed back. It also adds `--break=signin`, `SIGNED_IN_JOURNEYS` and `expectedToFail()`. |
| `scripts/e2e/journeys.mjs` | The journey is now `active`, and its `why` and `reReview` are gone. |
| `.github/workflows/ci.yml` | One step that proves the fault is caught: `--break=signin` must fail exactly this journey. The comment is net-zero lines. |
| `scripts/workflow-budget.json`, `app/src/lib/workflow-register.json` | YAML ceiling 23273 → 23276, raised to the measured total with a reason. The register was regenerated. |
| `app/src/__tests__/app-journeys-standin.test.js` (new) | 8 tests. They prove the token check catches a foreign secret, a forged payload and garbage. They also pin that the business row goes only to the signed-in stand-in, never to the anon key, and that the CI step is present. |

**Proven to catch:** `--break=signin` withholds the stand-in, the gate shows its locked card and the Assistant never mounts. Only `office-assistant-answers` fails (exit 0, "6 other journey(s) unaffected"). `--break=taps` now catches it too.

**Gates run here:** all 7 app journeys passed. `--break=link`, `--break=taps` and `--break=signin` were each caught. `journey-coverage-guard` OK with 0 deferred. ESLint clean. Prettier clean. The guards-leg scripts pass, except `one-teaching-one-lesson-guard`, which fails before this change on this sandbox's Node 22 (a JSON import attribute). That failure is unrelated.

**Not verified:**
- Real sign-in, the real auth server and RLS. The stand-in proves only that the app mounts and works the surface for a business-tier session. door-journeys and the SQL smokes cover the real walls.
- The family-allowlist path to the Assistant. It is not walked, because walking it would need a real family email.
- Realtime. The websocket to the stub origin fails in the sandbox.

**Seen, not fixed:** signed in, the page logs `cannot add postgres_changes callbacks for realtime:office_records-tlc-stream after subscribe()` (also `feedback-stream`). It looks like a double subscribe on one channel name. `re-review: 2026-11-26`.
