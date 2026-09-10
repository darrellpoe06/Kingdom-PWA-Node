# DR-0346 — The office governs itself from the TLC app: the hierarchy as data, and guarded seats

**Date:** 2026-09-10 · **Status:** accepted · **Tier:** B · **Area:** tlc · **Principles:** ROLE-CAPABILITY-MODEL, APP-IS-PRIMARY, VERIFICATION-DOCTRINE, TLC-FIREWALL, DATA-AS-EMPOWERMENT, DECISION-RECORDS

## Directives, in Darrell's words (2026-09-10)

*"Assistants and others need hierarchy for making sure we have appropriate governance and resources for our business."* Then, with a screenshot of the live Onboarding tab: *"Owners and managers etc need to be able to govern using the same app."*

## Finding (DR-0219)

The database already carried the seats (instance_members.role: owner, admin, member, assistant, viewer; the guarded `set_member_role`, `invite_to_instance`, `remove_instance_member`, `list_instance_members` of 0111 / 0130) and the door already gated on them (staff, `canManageTeam`). The office had no written hierarchy binding those roles to its own seats, no statement of what each seat governs or reaches, and no place inside the TLC app where the owner or manager could see the members and change a seat: that control lived only in the PoeTech Admin console.

## Decisions

1. **The hierarchy is data** (`lib/tlc-governance.js`): eight seats top down (Owner · Clinical Director; Operations Manager; Clinical Supervisor; Therapist; Therapist-in-training; Office Assistant; Reviewer; Client), each bound to its database role, naming who it reports to, what it governs, what it may do, and which of the twelve parts of the TLC app it reaches. Resources narrow down the chart: managers ⊇ staff ⊇ everyone; an assistant reaches the Assistant workspace and the public and training surfaces, never inquiries, revenue, packets or roles (0130's own line).
2. **Owners and managers govern from the same app.** A Governance area on Team for the office owner/admin (`TlcGovernance`): the chart, the who-reaches-what matrix, the live members of the office instance with a seat control that offers only what `grantableRoles` mirrors of the guarded function (an owner is untouchable; only an owner makes or unmakes an admin; no one edits their own seat), removal, and an invite by email with a seat through the DR-0187 handshake. The RPCs and RLS remain the enforcement; every change writes the audit log.
3. **The gates agree with the chart, and a test says so**: the door's staff and `canManageTeam` gates, Team's launch and governance areas, and Training's assign control are pinned to the same rule the chart states.

## Proven-to-catch (DR-0076 §3)

`tlc-governance.test.js` (4): eight seats, every reports-to above, chains of command; resources monotone down the chart with the assistant's exclusions; the chart's "may" mirrors `grantableRoles`; the door's, Team's and Training's gate strings. `tlc-onboarding-render.test.jsx` (+2): the real door, signed in as the office admin, shows Governance on Team with the chart, the matrix, the live members (owner untouchable, self not offered, a member's options exactly member/viewer/assistant), a seat change through the seam, and an invite with a seat that returns the claim link; a member has no Governance area.

## Honest limit

The live seat change and invite wait on a real sign-in; the seams are the ones the Admin console already uses live. `re-review: 2026-09-17` with the onboarding round trip: Christina confirms the seat titles and holders.
