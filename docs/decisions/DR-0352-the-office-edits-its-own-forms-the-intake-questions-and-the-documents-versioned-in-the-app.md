# DR-0352 — The office edits its own forms: the intake questions and the documents, versioned, in the app

**Date:** 2026-09-10 · **Status:** accepted · **Tier:** B · **Area:** tlc · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, REALITY-TRACE, TLC-FIREWALL, DATA-AS-EMPOWERMENT, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-10)

- *"where is the intake form so we can have staff update it?!!!!!!! everything needs to be able to be updated by staff!!!!!"* — on the live Onboarding tab, which listed Invite · Packets · Roster · Jobs · Applicants · Hiring report and nowhere the form itself.

## SHOULD / ARE / GAPS / CLOSE (DR-0219)

**SHOULD.** The intake packet is the office's own hiring form in the app (DR-0344); its questions, the three documents a colleague signs and the handbook are the office's to change — without a developer, without a deploy. **ARE.** The questions were `SECTIONS` in `lib/tlc-onboarding.js`, the agreements `lib/tlc-agreements.js`, the handbook `lib/tlc-handbook.js`: code. **GAP.** No surface edited them; a wording change was a pull request. **CLOSE.** This record.

## The assessment Darrell asked for, and the defaults taken

Missing information: whether the questions, the documents, or both (built: both, and the handbook); who counts as staff for editing (built: owner and admin write, every member reads); whether a new agreement version re-opens signatures already made (built: no — a signature pins the version it signed). Assumptions: the six floor answers and the three signatures stay required (the hire, the roster card and the signature record depend on them); a base question keeps its key and type (old packets must still read); new questions are the office's, with their own keys. Risks: an edited agreement is a legal text — the app records which text was signed, it cannot judge the wording, so a change note is required on every save; hiding a required base question would strand a colleague at submit — the editor refuses it. Decisions still open for Christina: every therapist as an editor, or owner/admin only (built: owner/admin); re-signing on a new agreement version (built: no); which code-only content moves next.

## Decisions

1. **One row per office document key, versioned.** Migration 0196 `tlc_office_documents` (`intake-form`, `policies`, `confidentiality`, `contractorAgreement`; one per office instance) holds the live jsonb body, its version, a note, who and when; `tlc_office_document_history` keeps every version whole, append-only. RLS: every member reads the live rows, owner/admin read the history, nobody writes by hand.
2. **Save is a function with a required note.** `tlc_office_document_save(key, body, note)` (owner/admin, through the office-only resolver of DR-0351): version+1, the history row, the audit row (`update`, on the allow-list). The note is the record of why.
3. **Read is one function for the two readers.** `tlc_office_documents_read()` serves a member of the office or a colleague with a packet in it (they fill the form and sign the documents); an empty object for anyone else, and the app falls back to the original.
4. **The original is the code, and it stays the floor.** `lib/tlc-office-forms.js` turns `SECTIONS` and the code documents into editable bodies, normalizes any saved body onto them (never less than the original, never a broken field), validates before save, and renders the live sections the packet form, the readout and the Team reader use. Editable: labels, help lines, required, hidden, the choices of a "choose one", the acknowledgment sentence, new questions per section (six kinds), every word of the three documents. Fixed: the six floor answers and the three signatures (required, never hidden), base keys and types, the choices of a base "choose any" (their ids are what the roster reads), sections and their order.
5. **The server enforces the office's required questions.** `tlc_onboarding_save` (redefined from 0194) reads the live intake form and refuses a submit missing a question the office marked required — beyond the floor, never a file, a signature or the availability grid.
6. **A signature pins the live text.** `documentVersion(key, live)` hashes the document as served; the readout shows the version signed. An edit after a signing never rewrites what was agreed.
7. **The surface.** Onboarding gains **Form & documents** (`TlcFormEditor`): four tabs with the version on each, the questions section by section, the documents word by word, "Save as a new version" with the note, "Reset to the original" (a new version, never a delete), "Discard my edits". Governance names the right: `onboarding:forms`, owner/admin.

## Amendment (2026-09-10, evening) — the form itself, to SEE

Darrell, looking at a copy of the old Google form: *"Where is the intake form, and why can't we see it?"* The editor showed the questions as editable rows; the packet showed them only to the invited colleague; Team's fold only described the form. **`TlcFormPreview`** renders the form as a colleague meets it — every section, every question numbered with its kind, help line, choices, required mark, the signature sentences and the direct-deposit fields — from the office's live definition: on **Team → Documents** under "Therapist Onboarding | Hiring Form" for every staff member, and beside the editor as "Preview the form as a colleague sees it". Pinned in `tlc-form-preview-render.test.jsx` (3).

## Proof

`0196-tlc-office-forms-smoke.sql` in the rls-isolation tlc-office leg (a save without a note refused; two saves = two versions kept whole; member/assistant cannot save; a row cannot be changed by hand; a member reads the rows and not the history; a packet holder reads the live form; a stranger reads nothing; a submit missing the office's required question is refused, with it lands; the audit row). `tlc-office-forms.test.js` (10), `tlc-form-editor-render.test.jsx` (2), onboarding suites re-pinned.

## Dated

`re-review: 2026-09-17` — Christina's answers to the three open decisions above; which code-only content moves to in-app editing next (lessons and courses, the Illinois rules, the door copy, the job templates); reordering questions and adding sections.
