# DR-1076: The records say where they live, and the paper is the tick

**Date:** 2026-10-16
**Status:** accepted
**Tier:** B (the Legal tab's content and Help; no schema change, no money moves)
**Type:** word
**Area:**
- `app/src/lib/make-it-official.js` (new — the steps, and their state derived from the shelf)
- `app/src/components/Legal.jsx` (the steps panel, the tab's registered summary, the not-ours list, the encryption claim corrected)
- `app/src/lib/legal-documents.js` (seven Business-shelf document types, added and never renamed)
- `app/src/lib/ip-portfolio.js` (`NOT_OURS`, `REGISTER_AMENDED`; "Love Corner" removed from the marks)
- `app/src/lib/help-content.js` (`books:legal` rewritten; `books:taxes`, `church:my-record`, `church:giving-book`, `databack` written; the roadmap's *Where your records live*)
- `app/src/lib/surface-help.js`, `app/src/lib/help-freshness.json` (Legal under the freshness gate)
- `docs/00-foundations/_root/IP-REGISTER.md` (amendment), `README.md` (the false "private" claim)
- `docs/99-session-notes/2026-10-16-research-review-what-is-proprietary-and-how-to-make-it-official.md` (§9, §10)
- Tests: `make-it-official.test.jsx` (new), `ip-register-render.test.jsx`, `help-content.test.js`

**Grounds:** Darrell, 2026-10-16, in sequence:
- *"what should be proprietary and how to get that official so we can include people and companies... My wife is interested in taking care of this asap."*
- *"How does Christina get information about the IP information... where is the documentation etc... why isn't it obvious how can we make sure users know where to look for documentation of their records etc... Opportunities and constraints.... solutions after evaluating the DRs and Ways."*
- *"We have years of records and experiences that we would like to integrate into our technical support with reality... we want to see how we can use our own needs to help support our communities and also gain in the process."*
- *"we want to be able to keep delivering solutions to the users at scale and at a budget we can sustain based on the prices."*
- *"We are in the same family and need our records to be in sync with what we are doing and also some users will not want that... we want all opinions to be able to be used without any issues."*

**Principles:** DR-0065 (the app is the primary artifact); DR-0061 / P15 (a surface is a live view of real state); DR-0076 (no claim without evidence; §3 proven-to-catch); DR-0329 (the legal shelves); DR-0086 (the Help freshness gate); DR-1060 (The Love Corner's emblem since 1946); DR-0174 (the church's own door)

## Context

The September work decided what PoeTech should protect and in what order. It
lived in four repository documents. The person asked to drive it had no screen
to look at, and the screen that existed was wrong in three ways:

| What a reader met | What was true |
|---|---|
| Legal Help: "Legal and reserve set-asides, kept separate." | The tab holds four things: fenced accounts, four document shelves, the IP register, and now the steps |
| IP register "as of 2026-09-06", with "Love Corner" as a PoeTech mark | The Love Corner is the church's name and emblem since 1946 (DR-1060). A Schedule A carrying it would have swept another body's name into PoeTech's title |
| Legal headline: at-rest encryption "built in" | Not built; the same screen said so lower down |

And four record surfaces (Your Data, Church → My Record, Church → Giving Book,
Books → Taxes) had no Help at all. Nothing listed where records live.

## Decision

1. **The paper is the tick.** The steps that make PoeTech's work officially
   owned live on Books → Legal. A step reads done only when a document of its
   named type sits on the viewer's Business shelf, dated on or after
   2026-09-19 (the day the reinstatement runbook set the order). Nobody ticks a
   box. Older paper is history, not proof: a 2018 annual report must not read
   as "registered agent chosen." The entity's status is still never painted;
   step 1 is "go and read it."
2. **Every record surface says what it holds and who can see it**, and the
   Help roadmap carries one section, *Where your records live*, whose every
   stop taps to its screen. The roadmap test already refuses a stop that points
   at a view that does not exist; its mirror of the nav now includes the
   surfaces that were missing.
3. **Legal is under the freshness gate.** The tab renders its summary from
   `surface-help.js`; changing that summary without reconciling Help fails the
   build.
4. **Names that belong to the people we serve are recorded as not ours**, in
   the repository register and on screen: The Love Corner (the Church of the
   Living God), Moore Divahs (Shay's business), TLC Therapy Solutions
   (Christina's practice). PoeTech owns the software and the service and
   licenses it to them.

## What was measured

| | |
|---|---|
| `help-freshness.json` before | 3 topics; none was Legal |
| `HELP` keys for the four record surfaces before | none |
| Register rows | 25 → 24 (7 marks, 8 works, 9 methods); 0 of 24 are assets |
| 0180 read policy | `USING (created_by = auth.uid())`: each shelf is its owner's alone |
| Mutation check | Removing the date rule in `proofFor` fails `make-it-official.test.jsx` |

## Impact

Christina, or anyone helping, can now open Books → Legal and see the order of
work, who owns each step, and which steps already have their paper. Help can
answer "where is my X" for every record surface. A reader is no longer told the
church's name is PoeTech's, or that encryption exists that does not.

What this does not do (DR-0329: say what is not built):


- **Family shelves sync only by the filer's choice.** Darrell asked for exactly
  that, with the condition that people who do not want it are never made to.
  It is its own decision, DR-1077 (migration 0299): an opt-in, per-document
  share to the household, private by default, modelled on the church shelf's
  `shared_with_office` toggle, with its own database smoke because it widens
  who can read privileged paper. The steps panel reads the viewer's shelf plus
  whatever the household chose to share.
- **Lived records as support.** This change is the first piece of it: the Help
  a person meets is now written from what each surface actually does, and the
  steps are derived from the real paper. Ari answering "where is my X" from the
  records map is the natural next step; it is not built here.
- **The cost evaluation** (research review §10) recommends and measures; it
  moves no money and changes no infrastructure. Closing the hosted Supabase
  mirror and re-billing Claude are Darrell's calls.
- **Not legal advice.** Counsel drafts every paper the steps name.

## Verification

- `make-it-official.test.jsx` (9): every evidence type is a real Business-picker option; an empty shelf has 0 done and three steps ready; the wrong type, the wrong shelf and pre-plan paper prove nothing; a later step waits and then moves; the panel's headline is derived. Mutation: removing the date rule in `proofFor` fails the suite.
- `ip-register-render.test.jsx` (11): 0 of 24; seven marks; the not-ours list on screen; no status painted.
- `help-content.test.js`: the nav mirror carries the five surfaces that were missing; every roadmap stop resolves to a real view.
- `help-freshness --check`: PASS, Legal included.
- `legibility-guard --check`: PASS. `eslint`: clean.

**re-review:** 2026-10-30, with the research review, or the day the first step's paper is shelved.
