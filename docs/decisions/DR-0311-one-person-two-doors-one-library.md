# DR-0311 — one person, two doors, one library

- **status:** accepted
- **date:** 2026-08-20
- **declared by:** Darrell — *"under my darrellpoe06@gmail.com user account that has admin as well??"*, *"how can I see all our family data if I'm not connected to the darrellpoe06@gmail.com admin account?"*, *"since we already have my email address why don't we already have it connected to the account?"* (in-session, 2026-08-20); executed as directed work per DR-0111
- **extends:** 0140 (phone door gains family/admin standing), DR-0060 (RLS is the data gate), DR-0076 (assertions over claims), DR-0307 §2 (accounts copy as-is, no identity merging in flight)

## The measured ground

The census receipt (nas-health run 32417595488) is the whole basis — not memory:

- **gmail identity** `f13843f2-742b-4f8a-82af-7ecfbdc536ec` (darrellpoe06@gmail.com): ~22,400 attributed rows (record_events 18,040; transactions 1,926; usage_events 2,084; feedback 127; study_entries 45; eternal_algorithms 23; projects 19) and the seats only it holds: poe-family owner, **colg owner, moore-divahs admin**.
- **phone door** `c2a6c39a-ae99-4ff7-83c6-b927e2e7f1cc` (15636502416@phone.poetech.us): 110 remappable rows (board_tasks 17, usage_events 80, feedback 8, market_watchlist 4, family_snapshots 1) plus door-class singles (user_credentials, dm_public_keys, member_presence, instance_members).

GoTrue cannot hold two password credentials (a 6-digit PIN and a full password) on one auth.users row, so **two rows is structurally required** — the design flaw would be pretending otherwise.

## Decision

1. **Neither row is deleted, ever.** The ensemble's delete-the-gmail-row proposal was refused on the measured record: that row alone carries the colg/moore seats and 15 months of attribution. Nothing in this cure deletes anything.
2. **The database learns the fact once:** `person_links(primary_user, door_user)` — seeded gmail ↔ phone, `door_user` unique, SELECT visible only to the person, and **no app write policies at all** (links are written by migration as postgres only; self-linking is structurally impossible).
3. **`same_person(uuid)`** — STABLE SECURITY DEFINER — replaces `owner = auth.uid()` on the **pure owner-scoped libraries only**: study_entries + study_spaces (0070), eternal_algorithms (0071), tv_watch (0072), and the owner **branch** of tv_share_select (0074, circle logic untouched). **game_saves is explicitly excluded** — 0077 scopes it by `user_role_in_instance(instance_id)`, not by owner; the final ground-truth read caught it on the staged list and removed it.
4. **Attribution remaps to the primary identity** (the five census columns, phone → gmail), asserted with **floor + exhaustion**, never strict equality: gmail-side per-column counts must be ≥ the census sums, and zero phone-attributed rows may remain. Strict "exactly 110" was rejected openly — usage_events grows live; equality would jam the replay frontier on honest growth. Actual counts are NOTICE'd so the replay log is the receipt.
5. **Door-class rows stay on the door** (user_credentials, dm_public_keys, member_presence, instance_members) — each door keeps its own key and its own seat.
6. **The surface tells the truth** (DR-0100): a linked door's AuthBanner shows "linked to <primary> — one library, both doors" instead of an Add-email form that can only fail "already registered" against himself (measured 2026-08-20).

## Proof

- Migration `0141-account-unification-person-links.sql` (self-asserting: floor + exhaustion raise EXCEPTION on shortfall).
- `app/src/__tests__/dr0311-account-unification.test.js` — proven-to-catch text gates: no write policy on person_links, game_saves untouched, no DELETE anywhere in 0141, door-class tables untouched, the seed pins both measured UUIDs.
- On-box: nas-health's DR-0311 proof block runs the RLS query AS the phone door (SET ROLE authenticated + jwt claims) and as a non-linked control, printing the counts — the same_person proof the ensemble locked on.

## Ways note (DR-0108)

The relay demanded the survivor UUID and the exact remap path before endorsing; the census instrument caught its own first error (a hosted-era UUID hardcoded from memory counted zero everywhere) and was corrected to resolve both UUIDs live by email. The receipt now precedes the migration in the record, which is the right order.
