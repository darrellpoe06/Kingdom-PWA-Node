# DR-0161 — Ari runs the gifts-and-placement process: a Myers-Briggs-type guided assessment that moves people into what helps communities

- **Status:** accepted
- **Tier:** B for the in-app assessment + derived matching (soaks on preview); **Tier C for anything outward** (sharing a person's profile with a serve-team lead, aggregated community views — consent-gated per DATA-EMPOWERMENT)
- **Scope:** the Dev/Ops Skills Analysis surface (`?view=opportunities` — "Your skills · what's working for people like you"), Ari's conversational intake (DR-0141), the community-role registries the matches derive from, `app/src/lib/ari-notes.js` (standing duty)
- **Date:** 2026-07-10
- **Principles:** COMMUNITY-FIRST (placement serves COLG and the overlooked first), THE-WAY / EXCELLENCE-STANDARD (gifts are for the Body), DR-0100 (speak established fact — personality instruments held honestly), NO-STATIC-DATA, DATA-EMPOWERMENT, GOVERN-EXECUTE-ADVISE

## Directive

Darrell, 2026-07-10, on the Skills Analysis screen: *"How can Ari help this Skills Analysis be a Myers-Briggs-type process — with all the various review or personality [instruments] however — for helping move people into what helps communities."* Plus the standing frame re-affirmed: documented, in the Ways, opportunities and constraints found, Ari's responsibilities and reports updated, in-app, no static data, combined and cleaned.

## Decision — the process, honestly framed

1. **Ari runs it as a conversation, not a form.** The existing profile form (name, skills tags, hours, tech comfort) becomes the FLOOR; Ari's guided intake (the DR-0141 input-manager pattern: real follow-up questions, hear before answering) walks a person through four dimensions and fills the same rows — spoken or typed, never homework.
2. **Four dimensions, each with an honest source:**
   - **Skills & experience** — what they can already do (the existing tags, drawn out by conversation).
   - **Working style** — a Myers-Briggs-TYPE dimensional profile (energy source, structure preference, people vs. things, initiating vs. supporting). Held per DR-0100: MBTI itself is proprietary and its predictive validity is contested — we run a dimensions-based style conversation and NEVER claim clinical validity; the label on the surface says "how you like to work," not a certified type.
   - **Gifts the Word names** — the Body's own placement instrument (Romans 12:6-8; 1 Corinthians 12:4-11, 27-31; Ephesians 4:11-12; 1 Peter 4:10-11, verses fetched verbatim per SCRIPTURE-REFERENCE-STANDARD): serving, teaching, exhortation, giving, leading, mercy, helps, administration. For the church half of placement this dimension is SENIOR to any secular instrument.
   - **Availability & burden** — hours, season of life, and the heart question: "what need in your community moves you?"
3. **Matches derive from REAL role registries — never a painted list.** Community placement reads the church's actual serve areas (choir, AV/broadcast devices, teaching, prayer, helps — the registries the Church tabs already carry) and the entrepreneurial-paths registry this surface already matches against. Every match cites why (which dimensions met which role's needs). A role registry that doesn't exist yet is a named gap Ari owns, not an invented option.
4. **The output moves people, with consent.** The person sees their profile and matches; SHARING with a serve-team lead or the Governor is an explicit tap (DATA-EMPOWERMENT: opt-in per stream, minors protected, no aggregation without per-study opt-in). Ari's reports show the aggregate honestly only from consented rows.
5. **Reviews feed it.** Post-placement, the person and the team lead can each record how the fit worked; the fit-review joins the profile as measured experience (the correction-pair pattern from DR-0144) — the process learns from real placements, not assumptions.

## Opportunities and constraints (routed)

- **Opportunity:** the COLG serve-team registry as the first real placement target (COMMUNITY-FIRST; pairs with the church-door plan). `re-review: 2026-07-24`.
- **Opportunity:** the gifts conversation doubles as a Learn course module (the Word's teaching on gifts, taught not debated — DR-0098). `re-review: 2026-08-07`.
- **Constraint (held):** no proprietary instrument's name or items are copied — the style dimensions are our own plain-language questions; "Myers-Briggs-type" describes the SHAPE of the process, never a claim of the trademarked instrument.
- **Constraint (held):** personality output NEVER gates a person out of serving — it recommends, the person and the church decide (the system is a mirror, never a judge — QUALITY-OF-LIFE rule).
- **Constraint (held):** the conversational intake needs the signed-in instance's rows; the cloud build agent seeds structure and derivations only (RLS boundary stated per DR-0076 §8).

## Supersedes / pairs

Pairs with DR-0141 (Ari the input manager — this is a flagship input), DR-0154 (the PM loop — placement is people-gap analysis), DR-0140 (the growth engine's demand-tested paths), COMMUNITY-FIRST-MISSION, DATA-AS-EMPOWERMENT. No supersession.
