# MODULE NECESSITY REVIEW — Which Modules the Rebuild Should Actually Tackle

**Status:** Layer 3 foundation (reference). Read-only analysis. Scopes the zero-feature-loss modular rebuild against *real* user feedback.
**Author:** Claude Code (read-only pass), 2026-06-23.
**Question (Darrell):** *"Can we review the feedback to see if modules are good for the app and only certain ones are necessary for me — unless there is an outstanding question about the build."*

**Answer in one line:** Yes — the feedback says a **small core** carries almost all the real weight. Rebuild that core first; carry the rest intact; defer a handful; flag two for pruning. **And there IS an outstanding build question that gates the start (§5).**

---

## How this was decided (evidence basis, not opinion)

Three grounded inputs, none re-derived here:

1. **The 40 real feedback rows** in the cloud `feedback` table (Supabase `mjjlevhdufpaplypnqrv`), already pulled, de-identified, and clustered into 20 concerns in [`docs/99-session-notes/2026-06-23-feedback-triage-prioritization.md`](docs/99-session-notes/2026-06-23-feedback-triage-prioritization.md) (branch `fix/feedback-triage-concerns`; seeds in `app/src/lib/concerns.js`).
2. **The module + feature inventory** with build/verify status in [`docs/00-foundations/FEATURE-WORKFLOW-REGISTER.md`](docs/00-foundations/FEATURE-WORKFLOW-REGISTER.md) (58 CONFIRMED / 4 BROKEN / ~22 UNKNOWN).
3. **The one named external beta voice** in [`docs/99-session-notes/2026-06-02-freddie-taylor-user-feedback.md`](docs/99-session-notes/2026-06-02-freddie-taylor-user-feedback.md) — desktop-install + pricing discoverability + "let me load my own data."

**Verdict scale:**
- **CORE** — Darrell + family use it now; the value of the app depends on it. Rebuild **first**, zero feature loss tolerated.
- **KEEP** — used or clearly valued; carry forward intact, rebuild after the core set.
- **DEFER** — built but low/no active use, blocked on external infra, or aspirational. Carry as-is; rebuild last or on demand.
- **PRUNE-CANDIDATE** — no feedback, unclear usage, no test. Flag for Darrell to decide whether to drop.

**Evidence tag (honest about what feedback can and can't decide):**
- **FEEDBACK-EVIDENCED** — real feedback rows point at this module (the count and theme are cited).
- **DARRELL'S-JUDGMENT** — no feedback rows, so feedback **cannot** decide it. The call is Darrell's lived knowledge of who uses what. Marked so we don't pretend data settled a question it can't.

> A note before the table: **silence is not the same as "unused."** Darrell never files feedback on his *own* operator tools (Study, Center, Governance) — that's why they show zero rows, not because they're idle. Feedback skews hard toward what's **broken**, not what's **loved**. High feedback often means "important AND currently broken." See the caveat in §4.

---

## 1. Per-module verdict table

Feedback counts are **substantive rows** mapped from the triage doc (noise/telemetry excluded). Cross-cutting concerns are attributed to the module the user actually felt the pain in.

| Module | Feedback (rows · theme) | Signal | Verdict | Basis |
|---|---|---|---|---|
| **Identity / Tenancy / Auth** (cross-cutting) | **7+1** · "not my data," wrong name at top, foreign accounts; can't sign in after update | **Highest-pain cluster in the whole table** | **CORE** | FEEDBACK-EVIDENCED |
| **Books / Finance** | 1 direct (tappable number→source) **+ bears the seed-bleed** | Free flagship; whole family's money; the trust cluster lands here | **CORE** | FEEDBACK-EVIDENCED |
| **Church** (home/giving/live/engagement) | ~3 · stale "next Sunday" date; "section doesn't feel finished"; + Choir below | COLG-first mission surface; family's own church | **CORE** | FEEDBACK-EVIDENCED |
| **Church · Choir** | 3 · Add discards entry (**data loss**), YouTube link broken, song-curation request | Christina is the choir director — active operator | **CORE** (family) | FEEDBACK-EVIDENCED |
| **Feedback / Concerns loop** | 3 · multi-image picker, telemetry pollution, screenshot-only rows | It's the improvement engine — and the loop **doesn't close on main yet** | **CORE** | FEEDBACK-EVIDENCED |
| **PWA / Deploy infra** (cross-cutting) | 2 · "Update now" never clears, stale app | Gates every other module; trust-eroding when wrong | **CORE** | FEEDBACK-EVIDENCED |
| **Real Estate / Rentals** | 1 · some property photos don't load | 11 real doors; family business | **CORE** | FEEDBACK-EVIDENCED |
| **Projects / Build** | 2 · CapEx tab broken, "need a historical record" | Darrell's management cockpit; **hosts the Concerns board** | **CORE** | FEEDBACK-EVIDENCED |
| **Conference / Venues** | 1 · all-ages class request | **July conference is real and imminent** — must stay live through it | **KEEP** (time-boxed CORE) | FEEDBACK-EVIDENCED |
| **Create / Workspace** | 1 · can't open docs; draft in Bishop's format | Real ask; low-effort fixable | **KEEP** | FEEDBACK-EVIDENCED |
| **Study** (Darrell's Yahweh study) | 0 (shares the Create open-docs row) | Darrell's personal high-value surface — *"his opinion IS wealth"* | **KEEP** | DARRELL'S-JUDGMENT |
| **Center / C2S** (steward seat) | 0 | Darrell's command seat; **composes existing surfaces** (low marginal rebuild cost) | **KEEP** | DARRELL'S-JUDGMENT |
| **Admin / Governance** | 0 | The operating spine (Governor review, decision queue); operator surface, so naturally silent | **KEEP** | DARRELL'S-JUDGMENT |
| **Inbound / Practice (TLC)** | 0 | Christina's MSW counseling practice — a real business, but no feedback this batch | **KEEP** | DARRELL'S-JUDGMENT |
| **Markets** | 1 · "shows data before the ticker is live/accurate" | Only **negative** signal in the set — surfaced as not-ready | **DEFER → PRUNE-CANDIDATE** | FEEDBACK-EVIDENCED |
| **Church · Observation / Cameras** | 1 · can't upload; cameras not viewable | **Blocked on the Wyze→NAS bridge** — can't meaningfully rebuild until it exists | **DEFER** | FEEDBACK-EVIDENCED (blocked) |
| **Learn** (courses) | 1 · (the all-ages conference class, counted under Conference) | Mostly aspirational; only the conference class has a near-term home | **DEFER** (except conference class) | DARRELL'S-JUDGMENT |
| **Video Wall (CapEx)** | 0 | Gated capital-project tracker for COLG facilities; not a daily surface | **DEFER** (carry gated) | DARRELL'S-JUDGMENT |
| **Cart / commerce scaffold** | 0 · no test, usage unclear (per register §2.3) | Nothing points at it; nobody reports it | **PRUNE-CANDIDATE** | DARRELL'S-JUDGMENT |
| **Community / marketing reach** | 2 · designer wants promotion reach; Freddie on pricing/desktop discoverability | Product signal, not a module to build now | **DEFER** (product signal) | FEEDBACK-EVIDENCED |

**Cross-cutting primitives** (multi-point auth, RLS/tenancy, voice input, text-size, TTS, photo lightbox, section error boundary, input sanitization, number-trace) and the **proven-to-catch quality gates** (contrast / overlap / tab-overflow / grant / tenancy / security-headers / workflow-conformance) are **CORE by necessity** — every module rides on them, and the gates *are* the sellable "prove-it" product. They are not optional and not a verdict call; they rebuild in Phase 0.

---

## 2. The honest headline: only a small core is "necessary for Darrell"

Darrell asked whether *only certain modules are necessary for him.* The feedback answers plainly: **yes.** Nineteen of the twenty real concerns land inside **eight surfaces**, and the single largest cluster (the seven "not my data" reports) is a **trust/identity** issue, not a feature module at all.

**The CORE set — what the family actually touches, where the pain actually is:**

1. Identity / Tenancy / Auth (the trust foundation)
2. Books / Finance (the free flagship)
3. Real Estate / Rentals (11 doors)
4. Church + Choir (mission + Christina)
5. Feedback → Concerns loop (the engine that closes the gap)
6. PWA / Deploy infra (so updates and sign-in just work)
7. Projects / Build (Darrell's cockpit)

Everything else is either **valued-but-quiet** (Study, Center, Admin, TLC — Darrell's own tools), **time-boxed** (Conference — real but seasonal), or **not-yet-earning-its-keep** (Markets, Cameras, most Learn courses, Cart). That is the scope discipline Darrell was asking for.

---

## 3. Recommended rebuild scope (core-first)

The rebuild is a hybrid shell/core + feature-modules-via-surface-registry design (DR-0078; see §5). Sequence:

### Phase 0 — Foundation (must precede *any* module rebuild)
- **Fix `origin/main`'s build** (PR #283) — *blocker;* main white-screens today (§5).
- **Land the rebuild blueprint** (DR-0078 / PR #266) — *blocker;* the rebuild has no ratified shape until it merges (§5).
- Rebuild the **cross-cutting primitives** + the **quality gates** (the safety net everything rides on).
- Fix the **seed-data bleed** (Tier-1 trust) and the **`db-migrate` token-trigger gap** (silently un-applied migrations) — both threaten the core directly.

### Phase 1 — CORE modules (rebuild first, zero feature loss)
Books/Finance · Real Estate/Rentals · Church (home/giving/live/engagement) · Choir · **close the Feedback→Concerns loop** (UI *and* the human-disposition back-half) · Projects/Build.

### Phase 2 — KEEP (carry intact, rebuild right after core)
Conference/Venues (must stay live through the July event — treat as time-boxed CORE) · Study · Create/Workspace · Center/C2S (cheap — composes existing) · Admin/Governance · Inbound/Practice (TLC).

### Phase 3 — DEFER (carry as-is; rebuild last or on demand)
Markets (**gate the inaccurate ticker behind a "not live yet" state** — honors the one negative report) · Observation/Cameras (unblock only after the Wyze→NAS bridge ships) · Video Wall (carry gated) · Learn courses other than the conference class.

### PRUNE-CANDIDATES (Darrell's call — don't auto-delete)
- **Cart / commerce scaffold** — no feedback, no test, unclear usage. Strongest prune candidate.
- **Markets** — if the live/accurate ticker isn't coming soon, the only honest options are *make it real* or *retire it;* shipping known-inaccurate data violates the Verification Doctrine.

*(Pruning a surface is a feature-loss decision — it gets a recorded reason + a `re-review:` date per DR-0075, never a silent drop.)*

---

## 4. The honest caveat — feedback is ONE signal

This whole call rests on **40 rows from ~4 instances** (the Poe family + a few beta users), skewed toward **what's broken**, captured **only when someone bothered to type.** That means:

- **Absence of feedback ≠ absence of use.** Study, Center, Admin, TLC show zero rows because Darrell doesn't file tickets on his own operator tools — not because they're idle. The DEFER/PRUNE line for *those* is **DARRELL'S-JUDGMENT**, not a feedback verdict.
- **High feedback can mean "important AND broken,"** not "loved." Church/Choir top the table partly because they're actively used *and* currently rough.
- **The negative case (Markets) is rare and therefore loud** — one "it's not accurate" is a strong gate signal precisely because almost no one complains about being shown bad data; they just leave.

**The missing input that would sharpen DEFER vs PRUNE: real per-surface usage telemetry** — which tabs open, by whom, how often. The app already has the surfaces to carry this (Loop Health, Governor Review) but **does not yet measure tab-level engagement.** Until it does, "nobody uses Markets/Cart" is an *inference,* not a *measurement.* **Flagged as a future input** — and it fits the Verification Doctrine: *measure, don't claim.* Building lightweight, opt-in, sovereign usage telemetry (per DATA-AS-EMPOWERMENT — never extractive) would let the next pass of this review be evidenced instead of judged.

---

## 5. Outstanding build question — the gate Darrell asked about

Darrell scoped this *"unless there is an outstanding question about the build."* **There is — two, and they gate the start, not the analysis:**

1. **`origin/main` does not build.** It's missing the `church-live.js` exports the monolith imports → white screen on render. The fix lives only in **un-merged PR #283**, which also finally adds the `npm run build` CI gate. **You cannot rebuild module-by-module on a base that white-screens.** *Merge #283 first.*
2. **The rebuild's own blueprint is held.** The hybrid modular architecture (shell/core + feature modules via a surface registry, with a conference-safe migration path) is **DR-0078 / held PR #266.** Until it lands, *"modular rebuild"* has **no ratified shape** — there's no agreed contract for what a "module" is in the new build. **This is the genuine outstanding build question; the per-module verdicts above are inputs to it, not a substitute for it.**

A third item is a *verification* gate, not a *decision* gate: **live n8n/NAS state is UNKNOWN from this (cloud) session.** It doesn't change which modules are necessary, but before any DEFER'd module is declared "carried intact," its live workflows must be confirmed from the NAS-capable session.

**Path forward:** the *prioritization is clear* (this doc + the triage doc settle the "what"). The **start is gated** on #283 (build) and DR-0078/#266 (shape). Land those two, run Phase 0, and the core-first sequence in §3 is ready to execute.

---

## 6. Religion AND Relationship / Phil 4:8 check

- **True:** every count is traced to the triage doc or the register; no feedback row is invented, and DARRELL'S-JUDGMENT rows are marked exactly because feedback *can't* decide them.
- **Just / Honorable:** the verdicts honor real congregant + family voice without copying any name into the bundle; the prune calls are flagged for Darrell, never executed.
- **Excellent:** it answers the actual question — *which modules are necessary for Darrell* — with a small honest core rather than "keep everything," and names the gate instead of papering over it.

---

*Read-only analysis. No app behavior changed, no feedback rows mutated, no module pruned. The per-module verdicts are inputs to the rebuild-scope decision (DR-0078); the start is gated on PR #283 and PR #266.*
</content>
</invoke>
