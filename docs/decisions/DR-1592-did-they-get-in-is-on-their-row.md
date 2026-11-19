# DR-1592: Did they get in is on their row, and who needs help is at the top

**Date:** 2026-11-19
**Status:** Accepted
**Tier:** B (one governor-only read; the Signups screen gains a list, a search box and a line per row)
**Type:** feature
**Area:** `admin_person_sign_ins()` (0338), `app/src/lib/person-onboarding.js`, `app/src/components/AccessUsageMetrics.jsx` (Platform signups)
**Pairs with:** DR-1336 (0315, sign-ins on the record), DR-1591 (which app each visit was), DR-0829 (Add to a space), DR-0840 (Usage), DR-1075 (our probe), DR-0076, DR-0100

## Context

Darrell, 2026-11-19: "How do I know who signed up and if and when they got in?... how do we help people when they have onboarding issues?!!!!! We should be able to see these issues from our data logs etc!!!!!" And then: "Not wanting to lose functions just gain an easy-to-use one."

## What was measured (SHOULD / ARE / GAPS)

| SHOULD | ARE (before) | GAP |
| --- | --- | --- |
| each person's row says whether and when they got in | the row said "last active", the later of the sign-in stamp and the presence heartbeat | a failed try, a link never used, and the method were nowhere on the row |
| every attempt is visible to the governor | 0315 writes `login` / `failed-auth`, but `auth_events_recent` shows only instances the caller owns or administers | a person with no space writes rows with `instance_id` NULL, so the people most likely to be stuck were invisible |
| the stuck people are found without hunting | 31 rows, sorted, no filter | no list of who is stuck, and no search |

## Decision

1. **`admin_person_sign_ins()`** (0338), for the poe-family circle only. Per account it returns:
   - `auth.users.last_sign_in_at`, which covers every method;
   - the time a link or code was last emailed, from `recovery_sent_at` / `confirmation_sent_at`;
   - from `audit_log`, including rows with `instance_id` NULL: the last password success, the last failure, failures since the last success of any kind, and failures in 30 days;
   - GoTrue's own `auth.audit_log_entries` `login` rows (180 days) with their provider, read dynamically and fenced, so a missing or unreadable table is reported and does not fail the read;
   - every space with its role and join time;
   - unclaimed, unrevoked Poe Properties invitations addressed to this account.

   At the top level it also returns `invites_without_account`.
2. **Each row** gets a sign-in line, for example "Last got in yesterday by email", "3 failed tries since (last yesterday)" or "sign-in link sent 2d ago, not used". One note under the list says which methods are and are not recorded.
3. **Needs help**, at the top of Signups. It is built only from these rows, and each reason carries its time:
   - created an account and never came back (after a day);
   - failed tries with no success since (last 30 days);
   - a link emailed and not followed (after an hour, within 30 days);
   - got in but has no space;
   - an unclaimed Poe Properties invitation;
   - in a space whose app they have not opened, after a 3-day grace, counted from door tracking (DR-1591) or from being added;
   - was active, then quiet for 14 days;
   - an invitation to an address with no account.

   Our own probe is never listed. The help actions are the ones that already exist: Find in list (where Usage and the rest of the row live), Add to a space, Message (the existing DM landing), and Call, Text or Email at the address on record. No credential reset is invented: none exists that keeps verification, and building one is a separate decision.
4. **Search** over the name shown, the address and the phone digits, however they are typed.
5. **Mask emails** masks every new place an address appears and hides the call, text and email links.

Nothing is removed: the chips, sort, Mask emails, Refresh, Add to a space, Usage and the Endpoints & stores feed are unchanged and pinned by a test.

## What is and is not recorded

| method | success | failure |
| --- | --- | --- |
| email + password | yes (hook, and the auth stamp) | yes (hook) |
| phone + PIN | yes (hook: it is a password sign-in on `<digits>@phone.poetech.us`) | yes (hook) |
| Royalty Link (email code) | yes (auth stamp; the method from GoTrue's log where readable) | **no**: a wrong or expired code writes no row |
| Google | yes (auth stamp; the method from GoTrue's log where readable) | **no** |
| any try with an address that has no account | n/a | **no**: the hook needs a user; DR-1593 decides it |

## Verification

- `infra/supabase/tests/0338-person-sign-ins-smoke.sql` ran on PostgreSQL 16 after 0315 and 0338 were each applied twice, and printed PERSON SIGN-INS SMOKE: PASS.
- Proven to catch, twice:
  - with the reader limited to rows that have an instance, the person with no space loses their failures and the smoke fails;
  - with EXECUTE granted to anon, the smoke fails.
- `who-needs-help-getting-in.test.jsx`: 18 cases, at least one proven-to-catch case per rule, including the person whose only rows have no space, the probe never listed, the unreadable record that invents nobody, Mask hiding the new places, and every existing chip and button still rendering.
- **Not verified against the live database:** the sandbox has no route to the NAS. These are unknown until the first live read:
  - whether `auth.audit_log_entries` exists and can be read by the function's owner;
  - which provider names GoTrue writes for a Royalty Link sign-in.

  Either way the screen says what it found: the coverage note quotes the `gotrue_audit` status.

## Not done

The smoke runs as the `person-sign-ins` leg of `rls-isolation.yml` against the real database (rolled back), which is also the first live answer to whether GoTrue's log is readable: the smoke requires `gotrue_audit = read`, so an unreadable log turns that leg red rather than hiding. Church (`colg`) and space invitations other than Poe Properties are not read as open invitations. `re-review: 2026-11-26`.
