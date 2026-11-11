# DR-1421: The record is in the reader's name, with who they are beneath it

**Date:** 2026-11-10
**Status:** Accepted
**Tier:** B (a visible change to the learner record; reads the household roster its own wall already allows; no schema)
**Type:** feature
**Area:** `app/src/lib/learner-identity.js`, `app/src/lib/learner-household.js`, `app/src/components/LearnersPanel.jsx`, `app/src/lib/use-learner-records.js`
**Sent in by:** Darrell, 2026-11-10, his son's record headed "14472209779@phone.poetech.us · CHILD · MASTERED" with 0 lessons read: say "the name of the reader in their record... use all subpoints for who they are... name as the main focus like Big Picture in our default mode"; "The name of the reader"; "In their name"; "Also sub-info for the user to identify themselves"; "Also parents etc... households... vs individuals etc."
**Pairs with:** DR-0825 (a number you know is shown as the person you know), DR-0754, DR-1416, DR-0060 (the walls decide who reads what)

## Context

A record was headed by the address its reader signs in with. For a phone sign-in that is eleven digits and a domain, which names no one. The same head carried a "Mastered" badge taken from the exam average alone, on a record with no lesson read.

## What was measured

- **Read from the code:** the record's label is written as `session.user.email` on every save, so a phone-door reader's label is always the synthetic address.
- **What the app already holds, and was not using here:** the household roster (`list_instance_members`: each member's display name, role and written relationship), the household's own name, and the viewer's contacts (DR-0825).

## Impact

A parent could not tell at a glance whose record was open, and a child's record read "Mastered" without a lesson read.

## Decision

- **The name is the heading,** first and largest, under "The record of". It is the name on the reader's own record, else the name their household holds for them, else the name the viewer's own contacts give that number, else the phone number written so a person can read it, with a line saying how a name gets there. Never invented.
- **Beneath it, who they are,** each line a row the household already holds: the relationship a steward wrote ("Son"), their standing (a parent or guardian holds the account; a child is under one), the household by name and how many are in it, or that the account stands alone; then the level they read at, how they sign in, where the name came from, and when they were last active.
- **A reader on their own record** is told it is theirs and how they sign in, so they can recognise it.
- **A reader the roster does not list** gets no household line. Unknown is not "none".
- **New records carry the reader's own name** when their account has one.
- **An exam average is named as one:** the badge reads "Exam average 90% or more". "Mastered" is kept for DR-1416.
- **The drop-down** names each reader the same way.

## Verification

`the-record-is-in-the-readers-name.test.jsx`, 13 cases, **proven to catch:** a phone-door address is never the heading when a name is known; with no name it is the readable number, never the raw address; a child shows relationship, guardian and household; one person alone is an individual account; a reader not on the roster gets no household line; the badge never says Mastered on a record with no lesson read. The 22 existing record tests pass, one updated for the badge.

## Not done, and why

- **A reader cannot yet type their own name here.** It means a write to their account; the roster and contacts cover a household today. `re-review: 2026-11-17`.
- **Which roster names exist on the live household is not known;** the sandbox cannot read it. If the roster holds no name for a reader, the record says so and shows the number. `re-review: 2026-11-12`.
- **Who the roster wall lets read it** was taken from the code's own comment (owner and admin), not tested against the database here. `re-review: 2026-11-12`.
