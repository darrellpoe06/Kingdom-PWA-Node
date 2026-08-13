---
id: DR-0295
title: Statements land where the card lives, the statement's own header is the missing data, and a bank's layout is learned once — never re-guessed, never reused when it changes
date: 2026-08-12
status: accepted
supersedes: []
superseded-by: null
amends: []
tier: A
entities: [books, family, tlc]
grounds: [VERIFICATION-DOCTRINE, APP-IS-PRIMARY, DATA-AS-EMPOWERMENT, REALITY-TRACE, PERPETUAL-IMPROVEMENT, MACHINERY-OVER-MEMORY]
source: 2026-08-11 session — Darrell, across several turns: "How do we add the credit card debits... after can it show how many paid on time and late and what is left and what should be added for payoff faster... Debts shows snowball not all payments and paid and left to pay based on the uploaded statements from credit card companies"; "uploader for the credit card statements"; "parcer to process all data and use it to our users advantage... at least give them the best business plays for their situations"; "Automatically creates an account and vendor for perpetual use for any user the format should be the same for the same banks eventually we would have all of them... imported data would be easier to parce"; and finally "focus on the books and the import of the credit cards!!!!!!!!!!!!"
---

## Context

Darrell's complaint was exact: **Debts shows the snowball PLAN — a projection of
what to pay next — while the imported statements hold the lived RECORD** of what
was actually paid, when, and whether it landed before the due date. The plan was
visible and the record was not.

Traced before building (DR-0219). What existed: `debt-payments.js` gives
per-month rates, a payoff date, and a real APR derived from the interest lines
the card itself posted. A full import pipeline existed too — CSV, OFX,
spreadsheet, bulk, dedupe, reconciliation.

Two measured facts decided the shape of the work:

1. **No due date is stored anywhere.** No `due_date`, `dueDay`, `past due` or
   `on-time` in any debt lib or in the debts table. "How many did I pay on time"
   was not merely unbuilt — it was **not computable from any data we held**, and
   no amount of UI would have produced it.
2. **`BooksTransactions.jsx` had three file inputs; `Debts.jsx` had ZERO.** The
   import path was real and lived on the wrong tab. A person came to Debts to
   deal with a card, found nothing to hand a statement to, and reasonably
   concluded the app could not read statements at all.

## The decisions

**1. Absent must read as absent, especially about credit history.**
`paymentHistory` takes `dueDay` as an input and returns `known: false` when it is
missing. Totals stay real and are still shown; `onTime`/`late` come back **null,
never 0**. A fabricated "0 late" on somebody's credit record is worse than a
blank.

**2. The statement's own header is the missing data.** `parseStatementSummary`
reads new balance, minimum due, **payment due date**, closing date and APR — the
due date being precisely the field that unlocks everything else. Every field is
independently optional, `found` lists what was actually read, and an unreadable
statement yields nulls rather than guesses.

**3. The issuer is the authority on what is owed.** A statement balance wins over
our arithmetic, and the **drift is reported rather than hidden** — a drift is
usually a missing import, which is worth seeing.

**4. Advice must never promise a payoff that cannot happen.** `payoffWith`
amortises at the card's real rate and refuses when the payment is below the
monthly interest (`reason: 'below-interest'`) — that balance grows forever, and a
payoff date there would be the worst claim this surface could make. `bestPlays`
ranks that alarm ABOVE any rate optimisation, puts a dated 0%-promo cliff above a
rate sort, plays lateness back only when it was measured, and returns nothing
when there is nothing to say.

**5. Upload where the card lives, reusing the proven path.**
`DebtStatementUpload` mounts on Debts and calls the same
`statementFileToCsv → parseDelimitedToRows → planAccountImport` pipeline the
Transactions tab uses. Not a second importer.

**6. The card gets a home automatically — and never a duplicate.**
`provisionFromStatement` creates the account and vendor when the card has never
been seen and **reuses** the existing account when it has. A duplicate silently
splits one card's history in two, which is worse than an unrouted import a person
can see and fix.

**7. A bank's layout is learned once, keyed on the HEADER — and re-learned when
it changes.** `bank-formats.js` fingerprints on the header cells (the bank's own
choice, stable across months) rather than the filename (which people rename, and
which two banks both call "statement (3).csv"). **The load-bearing case is
`changed`:** a remembered format is a cached assumption, and banks alter their
exports without telling anyone. Silently applying a stale column map would shift
every field by one and import a year of wrong numbers with total confidence — the
same failure class as DR-0295. A header that no longer matches is re-derived,
never reused.

**8. Nothing is written until the person presses Import.** `rememberFormat` and
the import callback both live in `commit()`, never in the file reader, and a test
pins that separation.

## Honest remainder

The Debts tab's scope — *"Get EVERY card + line of credit onto this tab"*
(Darrell, 2026-07-20) — exists **only as a code comment at `Debts.jsx:235`**. It
is a real, attributed, dated decision that never reached the Ways or this ledger,
which is why it could be absent from every review. Recorded here so it is
findable; its own DR remains owed. Undocumented intent is itself a finding
(DR-0219).

The `&amp;` visible in stored descriptions ("ZWICKER &amp; ASSOCI") is
double-encoded **in the data**, meaning something HTML-escaped at import time. A
format registry is the right place to normalise that once instead of letting it
leak into every downstream report. Not fixed here; named so it is not lost.
