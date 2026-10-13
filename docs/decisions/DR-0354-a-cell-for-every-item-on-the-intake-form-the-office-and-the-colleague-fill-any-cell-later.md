# DR-0354 — A cell for every item on the intake form: the office and the colleague fill any cell, later

**Date:** 2026-09-10 · **Status:** accepted · **Tier:** B · **Area:** tlc · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, TLC-FIREWALL, DATA-AS-EMPOWERMENT, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-10)

- *"at least create a place for all items on the intake form even if Christina needs to add the data later or even have users add their own data... we need the cells to accommodate the data... make sense?"*

## What is true (SHOULD / ARE / GAP)

- **SHOULD:** every item on the intake form has a place in the record, and the office or the colleague can fill it at any time — not only the colleague, not only before submit.
- **ARE:** the packet already had a place for every item (`emptyPacket`, the office's live sections, DR-0352), and a prefilled invite (DR-0353) held answers for the five colleagues already on the old form. But a cell could be filled only by the colleague, only through the packet form, and only while the packet was a draft or returned; nobody could see or fill what an invite held before it was opened.
- **GAP:** no way to add the data later; no way for the office to fill what it knows; no way for a colleague to correct their own record after approval.

## Decisions

1. **Migration 0198.** `tlc_onboarding_patch(packet_id, patch, note)`: the office (owner/admin) or the colleague themself merges named cells into a packet at **any** status; the audit row records who (`self` | `office`), which cells, and the note. `tlc_onboarding_invite_read(invite_id)` and `tlc_onboarding_invite_patch(invite_id, patch, note)`: the office reads and fills the cells of a not-yet-opened prefilled invite (the read returns only that banking is on file, never the numbers; a patch is refused once the invite is opened). `tlc_onboarding_list()` says which invites are prefilled, with the name and license it holds.
2. **The walls never move.** `tlc_onboarding_patch_guard` refuses a patch that carries `acknowledgments`, `documents`, a password key, or a banking key, and more than 80 cells. Signatures and signed documents stay the colleague's to make in the packet; banking stays behind the wall.
3. **One editor, three doors.** `TlcRecordEditor` renders every cell of the office's live form (short answer, paragraph, choose one, choose any, yes/no, date, the week) section by section, sends only the cells that changed, with an optional note, and names what it does not fill. It is mounted on a packet under Onboarding · Packets (**Fill or correct the cells**), on a prefilled invite under Onboarding · Invite (**Answers on file**), and on Team as **My record** for a colleague with a packet at any status.
4. **The field inputs are one source.** `TlcFieldInputs.jsx` holds the inputs the packet form and the editor both render; the pure middle is `lib/tlc-record-cells.js` (which cells, the value a cell holds, the patch that carries only what changed and never a refused key, the honest count).

## Proof

`0198-tlc-cells-smoke.sql` in the tlc-office leg (the office fills an invite; the claimed packet carries the cell; an opened invite refuses; the office and the colleague patch a packet; a member and a stranger cannot; a signature and the documents are refused; an approved colleague still updates their own cell; every write audited); `tlc-record-cells.test.js` (8), `tlc-record-editor-render.test.jsx` (4), `tlc-onboarding-render.test.jsx` (+2), `tlc-office-forms.test.js` (the 0198 pins).
