# 2026-07-09 — One input surface, acting in place; the Door algorithm captured

**Layer 4 working note · session `claude/poetech-course-content-review-s3931b` · governs: DR-0131, REV-0023**

## What Darrell asked and said (verbatim anchors)

1. *"What happened when I input or spoke this into the input inside the PoeTech App?"* (after speaking the situational-analysis / Door teaching into the church tab's second widget)
2. *"I also don't like how the input shifts fast to another page on the app surface this needs to open inplace and not move fast from that location because humans can get dizzy."*
3. *"Also only have one input surface from PoeTech on any and all tabs relevant to receive input so Ari can transcribe and enter the information for the user filling up their responses on any page they want also feedback should be deciphered and also updated from these exchanges."*
4. The standing rule (repeated): Ways + documentation + opportunities/constraints + Ari's responsibilities and reports, all in the app, no static data, combine what makes sense.

## The trace (the honest answer)

Two inputs were stacked on the church tab. The one he used held its log in React memory only ("local-only until v2.7 sync wires up") and its Send was a raw `mailto:` with `target="_self"` — the whole surface navigated into the mail client (the dizzying shift), "✓ sent" recorded only the tap, and no governed stream ever received the teaching. The master box directly above it already routed to real streams, including the PoeTech build-directive relay to the NAS thought-inbox.

## What shipped (DR-0131)

One surface (`OneVoiceInput`, retitled "Yahweh Hears You · Speak · Type · Link"); the duplicate widget and the parallel `InputCenter.jsx` deleted; submit acts in place with the email-office hand-off as an explicit secondary `_blank` link; a render gate asserts one surface + no in-place mailto; the teaching itself captured as `gh-door-christ` ("The Door") with verbatim verses, auto-joining the derived Gospels processing course; the declared purpose woven into the course meta; Ari gains the `one-voice` duty.

## Opportunities and constraints

Routed in DR-0131: every-tab rollout of the one primitive (`re-review: 2026-07-22`); Ari transcribe-and-fill under Tier-C brakes (`re-review: 2026-07-22`); spoken-input streams into the Perpetual Report (`re-review: 2026-07-22`). Constraints held: nothing to migrate from the never-persisted log; mailto inherently hands off on mobile — primary path stays in-app.
