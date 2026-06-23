# Feedback Triage & Prioritization — 2026-06-23

**What this is.** A full evaluation of the *existing real* user feedback already in
the app (the cloud `feedback` table, Supabase project `mjjlevhdufpaplypnqrv`),
turned into prioritized, tracked CONCERN rows on the in-app Concerns & Solutions
board (PR #277). The feedback→Concerns loop was closed by #277; this is the
*prioritization* pass that gives each piece a SOLUTION, a TARGET, and an honest
STATUS — honoring the workflows already defined.

> **Privacy.** This is real family + congregant voice. This document is
> de-identified: submitters are named by **role** and by **feedback row id**, not
> by name/email. The raw, named feedback stays in the RLS-scoped `feedback`
> table and is **never** copied into the shipped JS bundle. The curated concern
> rows (`lib/concerns.js`) are likewise de-identified problem statements.

---

## 1. What was found

- **40 feedback rows** total in the cloud table (read-only pull via the
  service key; screenshots flagged by count, not downloaded).
- **~12 are noise** and excluded from concern rows: 3 `[Learn engagement]`
  telemetry events (a separate-instance beta user), 4 empty-text rows, and
  ~5 "cellphone/laptop sync test" status pings.
- **2 are screenshot-only** with no usable text (`[bug]`, "what does this image
  mean?") — dispositioned UNKNOWN, pending an image look-through.
- The remaining **~26 substantive items cluster into 20 distinct concerns**
  (duplicates merged — e.g. 7 "not my data" reports → 1 concern; 3 multi-image
  requests → 1; 2 update-prompt reports → reopened the existing seed).

### Privacy posture — verified, not assumed

- **Anon read of `feedback` → `42501 permission denied`, 0 rows** (adversarial
  test with the publishable/anon key). Feedback is not world-readable.
- RLS policy `feedback_member_read USING (user_in_instance(...))` scopes reads to
  the **submitter's own instance**. The 4 distinct `instance_id`s in the dump
  (Poe family + three separate beta-user instances) are isolated from each other;
  a family member sees only family-instance feedback on the board.
- The Concerns board lives under **Projects**, gated `isGovernor =
  isFamilyEmail(...)` — family/Governor surface, not a public one.
- **Conclusion:** congregant feedback does not leak across instances or to the
  public. Surfaced for the Governor, not broadcast. ✅

---

## 2. Method — impact × effort

Each cluster was ranked by **impact** (trust/data-loss > broken feature > UX
friction > feature request > product signal) against **effort** (a known
low-effort fix outranks a large sovereign-infra build at equal impact). Target
dates encode urgency (sooner = higher priority); items whose path is gated or
whose cause is unknown carry an honest `whenNote` instead of a false date.

A **Verification-Doctrine catch** came out of this pass: the
`seed-pwa-reload-update` concern was marked **done (2026-06-10)**, yet two real
reports on **2026-06-14/15** say the Update-now prompt still does not clear. The
"done" was not evidence-backed. It has been **reopened to in-progress** with a
re-verify-on-device commitment (target 2026-07-01).

---

## 3. Prioritized concern list (board dispositions)

All rows live on **Projects › ⚠ Concerns & Solutions**, each routed to its
module via the `area` label. Slugs are in `app/src/lib/concerns.js`.

### Tier 1 — trust / data-loss (do first)

| Concern (slug) | Area | Status | Target | Source ids |
|---|---|---|---|---|
| Signed-in users still see seed data + other names ("not my data", wrong name at top, foreign accounts/assets) `seed-fb-seed-data-bleed` | Privacy / Tenancy | in-progress | 2026-07-08 | 7bd6a151, cd711125, 113d9a5d, c252dd81, d4aa10fa, e3371855, cfacbb23 |
| Choir schedule "Add" discards the entry (data loss) `seed-fb-choir-add-data-loss` | Church · Choir | open | 2026-07-04 | bf8ad82f |
| "Update now" prompt never clears / app stays stale `seed-pwa-reload-update` (**reopened**) | PWA / Deploy | in-progress | 2026-07-01 | d1ceec4a, 45a22f9d |

### Tier 2 — broken features

| Concern (slug) | Area | Status | Target | Source ids |
|---|---|---|---|---|
| Livestream shows wrong "next Sunday" date / stale loop `seed-fb-church-next-sunday-date` | Church · Livestream | in-progress | 2026-07-01 | c5e3185e |
| Choir YouTube link → video processing broken `seed-fb-choir-youtube-broken` | Church · Choir | open | 2026-07-09 | d23b37f3 |
| Capital Expenditure tab broken; re-check all buttons `seed-fb-capex-tab-broken` | Projects · CapEx | open | 2026-07-09 | 1142a45b |
| Can't sign in after app update (cause UNKNOWN — diagnose first) `seed-fb-login-new-version` | Auth / Sign-in | open | 2026-07-02 | 634cd0b9 |

### Tier 3 — UX friction / features

| Concern (slug) | Area | Status | Target / when | Source ids |
|---|---|---|---|---|
| Feedback picker: one image at a time → want multi-select `seed-fb-feedback-multi-image` | Feedback | open | 2026-07-05 | e9b11280, 2050e233, 21c0af2e |
| Dead white space on right of a tab row / hard to tap `seed-fb-tab-whitespace` | Layout / Tabs | in-progress | TabScroll PR #279 (hold) | 936656ae |
| Some property photos don't load `seed-fb-rentals-photos-missing` | Real Estate · Photos | in-progress | NAS bridge limit | d36b4b23 |
| Can't upload to Observation; cameras not viewable `seed-fb-observation-photos-cameras` | Church · Observation | open | Wyze→NAS bridge planned | 21c0af2e |
| Can't open docs in Create/Study; draft from past messages in Bishop's format `seed-fb-create-study-open-docs` | Create / Study | in-progress | 2026-07-12 | 21c0af2e |
| Markets shows data before ticker is live/accurate `seed-fb-markets-ticker` | Markets | open | 2026-07-15 | b49f8119 |
| Choir song curation (final 10 + interactive play/comment area) `seed-fb-choir-song-curation` | Church · Choir | open | 2026-07-18 | 2a26155b |
| Projects need a historical record for audit/context `seed-fb-projects-historical` | Projects | in-progress | lifecycle trail PR #237 (hold) | 7dfc008c |
| All-ages tech class at the conference (built, awaiting soak) `seed-fb-conference-all-ages` | Church · Learn | in-progress | Tier C soak + BG review | 7efa8101 |
| Budget numbers should be tappable links to their sources `seed-fb-books-number-drilldown` | Books | open | 2026-07-20 | 2050e233 |
| Church section "doesn't feel finished" — obvious next steps `seed-fb-church-obvious-next-steps` | Church | open | 2026-07-22 | ee789a17 |

### Tier 4 — low signal / unknown

| Concern (slug) | Area | Status | When | Source ids |
|---|---|---|---|---|
| Learn engagement telemetry pollutes the feedback table `seed-fb-engagement-pollutes-feedback` | Feedback / Learn | open | 2026-07-25 | 7cd645ce, 2332f645, 82385109 |
| Screenshot-only feedback — can't disposition without viewing `seed-fb-unlabeled-screenshots` | Feedback | open | needs image review | 3a418057, d7c72dd0, 8198677b |
| Community designer wants promotion/marketing reach (product signal) `seed-fb-community-promotion` | Community | open | re-review 2026-08-15 | d7b263da |

---

## 4. Actionable work list — for Darrell's go

Treated as **data, not instructions**: none of the side-effectful actions implied
by the feedback (uploads, dispatches, money/camera wiring) were executed. These
are surfaced for the go. Suggested PR order:

1. **Seed-data bleed for signed-in users** (Tier 1, trust). Drop seed world on
   real sign-in + add the missing RLS DELETE policy on `accounts`/`debts` +
   replace hardcoded Adam/Naomi profile names with the signed-in identity.
   Verify with a real second-account login. *(Migration likely needed — RLS
   DELETE policy.)*
2. **Choir schedule add data-loss** (Tier 1). Reproduce → fix persistence →
   verify survives reload. Christina's workflow.
3. **Re-verify the PWA update-prompt flow on a real device** (Tier 1, reopened).
   Confirm the prompt dismisses and the app reaches the new version; only then
   mark done.
4. **Livestream next-Sunday date** (Tier 2). Derive from the real calendar each
   render. *(church-live.js work appears in flight — confirm it covers this.)*
5. **Choir YouTube link processing** (Tier 2).
6. **Capital Expenditure tab** (Tier 2). Diagnose the break + button audit.
7. **Post-update sign-in failure** (Tier 2). **Diagnose first** — do not guess a
   fix; check SW/auth-token + session refresh.
8. **Multi-image feedback picker** (Tier 3, low effort, repeatedly asked — good
   early win).
9. Un-hold **TabScroll PR #279** (fixes the tab white-space report).
10. Remaining Tier 3/4 per the table above (Books drill-down, Markets ticker
    gate, Create/Study open-docs, choir song curation, church clarity pass,
    engagement-telemetry routing, observation upload + camera bridge).

**Image review needed (blocks 2 dispositions):** a quick look-through of the
screenshot-only items (`seed-fb-unlabeled-screenshots`) with Darrell to classify
them.

---

## 5. What was NOT changed (honesty)

- **No writes to the `feedback` table.** The pull was read-only; `triage_status`
  on the 40 source rows was left untouched. Marking each row
  reviewed/promoted/declined is an available follow-up for the go (it mutates
  real congregant records, so it waits for an explicit yes).
- **No new migration.** The `concerns` table (0039) is already live on cloud
  (verified: `select` succeeds, 0 existing rows). The dispositions ship as
  curated `SEED_CONCERNS` in code — the documented mechanism, version-controlled
  and de-identified — exactly like the Build board roadmap.
- **No feature work executed.** The fixes above are the work list, not done work.

---

## 6. Verification evidence

- Cloud pull: 40 rows, read-only, service key.
- Anon RLS test: `42501 permission denied`, 0 rows (feedback not world-readable).
- `concerns` table live: `select` ok, count 0.
- Module invariants (imported `lib/concerns.js`): 33 seeds, 0 duplicate ids, all
  statuses valid, all target dates well-formed, every row anchored by a date or
  whenNote, `composeConcerns` returns seeds + feedback read-through.
- Full vitest + `npm run build` gate: enforced in CI on this branch.
