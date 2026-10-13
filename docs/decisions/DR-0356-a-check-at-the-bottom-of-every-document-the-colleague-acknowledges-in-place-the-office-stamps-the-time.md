# DR-0356 — A check at the bottom of every document: the colleague acknowledges in place, the office stamps the time

**Date:** 2026-09-10 · **Status:** accepted · **Tier:** B · **Area:** tlc · **Principles:** VERIFICATION-DOCTRINE, APP-IS-PRIMARY, TLC-FIREWALL, DATA-AS-EMPOWERMENT, DECISION-RECORDS

## Directive, in Darrell's words (2026-09-10)

- *"still don't have a check box at the bottom of the documents with time stamps for when they agreed... like a green check that they acknowledged!"*
- Same session, at the Form & documents editor: *"intake documents are making users erase the cell content that says what it is instead of having text outside of the cell so the date can be a calendar…"* then, seeing the editor for what it is: *"I think I like it maybe..."*

## What is true (SHOULD / ARE / GAP)

- **SHOULD:** at the bottom of the handbook and the two agreements, wherever a colleague reads them, a checkbox with the acknowledgment sentence, a signature, and afterwards a green check with the time they agreed and the time the office received it.
- **ARE:** the three acknowledgments were signed only inside the packet form's Agreements section, only while the packet was a draft or returned, by saving the whole packet (0187, stamped by 0194 at submit). Team → Documents showed the documents with no acknowledgment at all; an approved colleague could not re-acknowledge a revised document.
- **GAP:** no check at the bottom of a document; no way to acknowledge in place or after approval.
- **The editor, traced (the second quote):** the Form & documents editor's Label cell holds the question's wording ("Preferred Name", "Date of Birth"); read as a form it looks like an answer cell someone must erase. It is not: the answer cells are on the form itself, where a date is a calendar (`type="date"`), a choice a list, a yes/no two buttons. The live records confirm it: every date of birth and license expiration on file is an ISO date; no cell holds descriptive text. The fix is clarity, not structure.

## Decisions

1. **Migration 0199.** `tlc_onboarding_acknowledge(packet_id, key, signature, doc_version, attestation, agreed_at)`: the packet's own applicant (never the office) signs ONE document at any status; the record written is exactly the packet's acknowledgment record (agreed, signature, signedOn, signedAt, docVersion, attestation, agreedAt, signedAtServer), so the readout, the review and the export read it unchanged; the office's clock stamps it, the same signing keeps its first stamp, a different name or document version is stamped anew (0194's rule); only the three keys; a typed name and the checked sentence are required; every signing audited with the version and the stamp.
2. **The control.** `TlcDocumentAcknowledge` under each document: unsigned → the sentence checkbox, the typed full legal name, the e-sign consent line, one button; signed → a green check naming who, the moment checked on their device, the moment received by the office, the version; revised since → the green check stays for the version signed and the box returns for the new version. A person with no packet sees nothing (an acknowledgment is a colleague's own act on their own record).
3. **Where.** Team → Documents, under the handbook and both agreements, for a colleague with a packet at any status. The packet form's Agreements section keeps its own control; both write the same record.
4. **The editor says what it is.** Every question card in Form & documents reads "answered with a calendar / a short answer box / one choice from a list…", and a line under the Preview button says the office edits the questions here and never answers them.

## Proof

`0199-tlc-acknowledge-in-place-smoke.sql` in the tlc-office leg; `tlc-document-acknowledge-render.test.jsx` (6); the 0199 pins in `tlc-office-forms.test.js`.
