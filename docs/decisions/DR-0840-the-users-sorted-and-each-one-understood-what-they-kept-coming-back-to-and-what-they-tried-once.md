# DR-0840 — The users sorted, and each one understood: what they kept coming back to and what they tried once

- **Status:** accepted
- **Tier:** A (a sort over rows the governor already sees and an on-demand read of a function that already exists; the server's gate is unchanged)
- **Type:** feature
- **Date:** 2026-10-09
- **Scope:** `app/src/lib/user-usage-profile.js` (new, pure: `KEPT_AT`, `SIGNUP_SORTS`, `usageProfile`, `usageLine`, `sortSignupsBy`), `app/src/components/AccessUsageMetrics.jsx` (the Sort control on Platform Signups; the Usage fold per row, `UsageFold`; the signups row's Add to a space offers the Poe Properties placements), `app/src/__tests__/signups-sorted-and-understood.test.jsx` (4).
- **Principles:** DR-0145 (per-person usage is the steward's to read, only for a member of a space they steward; the DB guard is the authority), DR-0819 (use is measured as opens, not claimed), DR-0076 (a refusal from the server is said as what it is; counts are the rows'), DR-0825 (a contact's name sorts as that name), DR-0839 (what they are there).
- **Grounds:** Darrell, 2026-10-09, Platform Signups open: *"Want to be able to sort users... comprehensively understand our users... what they couldn't stop using vs..."* and, on the row's space picker: *"Want to add 1099 and other options and apps to add people to... make sense?"*

## Context

The signups list was newest-first only, and understanding a person meant opening the Admin roster, finding them, and reading the Inspect panel's usage list, which the roster only shows for members of the governor's spaces. `user_usage_metrics` (0145) already answers per person: each view name, how many opens in the window, when last; its gate is that the caller stewards one of the person's spaces. Nothing on the signups list asked it.

## What was measured

- `sortSignups` sorted by `created_at` only; the surface had no sort control.
- `user_usage_metrics(target_user, days_in)` returns `(name, views, last_at)` top 20, `kind = 'view'`; the gate raises for a person in none of the caller's spaces, which `fetchUserUsage` turns into `null`.
- `MemberInspect.jsx` 59 reads it for roster members; the signups list did not.

## Impact

- Unresolved: thirty accounts in one order, and "who could not stop using what" answered only by opening thirty panels somewhere else.
- The call obligates: six sorts that read the same view the row shows; a profile per person from the server's own rows, with "kept coming back to" meaning opened three times or more in thirty days and "tried once" meaning exactly once; and the server's refusal said plainly rather than shown as an empty profile.

## Decision

1. **Sort:** newest first, last active first, name, space, returned first, never returned first. The name sort uses the name the row shows (own name, else the contact's, else the address); the space sort uses the badge.
2. **Usage, per row, on demand:** the fold reads the person's last thirty days and says in one line the opens, the views, what they kept coming back to (with counts) and what they tried once; chips below, the kept ones marked. A null answer reads *Their usage is theirs alone until they are in a space you steward.*
3. **The row's Add to a space offers what they are there:** on the Poe Properties space, tenant, household, 1099 worker or manager, written as the invite the door claims from (DR-0839's `placePerson`); elsewhere member, viewer, admin as before.

## Verification

- `signups-sorted-and-understood.test.jsx`: the profile (kept at three or more, once at exactly one, the last touch, a blank name dropped, the line; the empty window; the null refusal); the six sorts over three rows with known dates, and an unknown key falling back to newest; the rendered list reordered by the control (name, last active, space); the Usage fold opening one person's kept and once views from the mocked server and closing, and a person the server refuses reading as theirs alone.
- The signups suite (6) still green; eslint clean at zero warnings.
- `re-review: 2026-10-16`: whether "kept coming back to" should be measured in days active rather than opens (the RPC would need a per-day count), judged against what the governor actually asks of the fold that week.
