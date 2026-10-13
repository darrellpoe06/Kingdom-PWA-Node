# DR-0353 — Colleagues already on the form: a prefilled invite, claimed by email at sign-in

**Date:** 2026-09-10 · **Status:** accepted · **Tier:** B · **Area:** tlc · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, TLC-FIREWALL, DATA-AS-EMPOWERMENT, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-10)

- *"Add our users into the app so they can log in and already have access to their information... make sense?"* / *"from TLC Therapy Solutions intake form"*

## What is true

Five colleagues answered the office's Google hiring form between 2025-09 and 2026-05. None has an account in the app. Their answers — and their direct-deposit numbers, and in one row a CAQH password in plain text — sit in the responses sheet. DR-0344's rule stands: none of that enters the repository.

## Decisions

1. **The mechanism ships in code; the people's answers go straight into the live database, once.** Migration 0197 lets an onboarding invite carry a `prefill` (the packet body as answered) and, apart, `prefill_banking`, with a `source`. A prefill can never carry a password or a bank number in the packet body (a table constraint and the minting function both refuse it).
2. **Sign in, and the packet is there.** `tlc_onboarding_claim()`: a colleague who signs in with the invited email, with no packet bound yet, gets their packet started from the prefill — the banking numbers go behind the wall (`tlc_onboarding_banking`) and are wiped from the invite in the same step; the audit row says the packet was prefilled and from where. The link still works (`tlc_onboarding_open` starts the same way); a second claim returns the same packet. The app's `myPacketStatus()` claims when it finds nothing bound, so the door's Team tab shows the colleague their own information on first sign-in.
3. **Signatures are never prefilled.** The form's "Yes" under each acknowledgment is not an electronic signature of the versioned text; each colleague signs the three documents in the app, then submits; the office approves as before, which publishes the roster card and makes them staff.
4. **The office can do this itself from now on.** `tlc_onboarding_invite_prefilled(email, note, prefill, banking, source)` (owner/admin) is the app's own way to bring a colleague on with what the office already knows.
5. **Not imported.** Drive links (resume, W-9, license, I-9, headshot) — the app never links out; the colleague uploads them in the packet. The CAQH password — never; that cell should be deleted from the sheet.

## The import

After 0197 is live: five prefilled invites on the TLC instance, minted from the responses sheet, invited by Christina's account, source "hiring form responses 2025-09 … 2026-05". Recorded here by count only.

## Proof

`0197-tlc-prefilled-invite-smoke.sql` in the tlc-office leg; `tlc-onboarding-claim.test.js` (4); `tlc-office-forms.test.js` (the migration pins).
