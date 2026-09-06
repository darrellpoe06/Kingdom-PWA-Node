# COLG Sermon Intake — the Way a sermon becomes a lesson

**Status:** binding Way. Decision record: **DR-0333** (2026-09-06).
**Declared by Darrell, 2026-09-06:** *"BG sent his lesson today... look at those emailed attachments to produce his lesson from his sermon today... then do another when the sermon is on YouTube also... later in the same day every time darrellpoe06@gmail.com or mrspoe06@gmail.com gets emails from bg@thechurchofthelivingGod.com."*

A sermon from The Church Of The Living God that arrives and produces nothing is a broken covenant, not a missed chore. This document is the operating procedure; DR-0333 holds the reasoning and the evidence.

---

## The trigger

**Any email from `bg@thechurchofthelivinggod.com` reaching `darrellpoe06@gmail.com` or `mrspoe06@gmail.com`.** Same day. No one has to ask.

```
from:bg@thechurchofthelivinggod.com
```

**Key on the SENDER, never on the recipient and never on a weekday.** Both reasons are measured facts, not preferences — see the next section.

---

## What the source actually is (measured 2026-09-06 against 201 live threads)

Four things about these emails are not what a reasonable intake would assume. Each one, assumed wrong, breaks the pipeline silently.

| # | The assumption that fails | The reality |
|---|---|---|
| 1 | The sermon is in the email body | **The body is EMPTY** — BG's signature block and nothing more. Every word is in a **`.docx` attachment** (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`) whose filename mirrors the subject. A body-reading intake concludes no sermon was sent. |
| 2 | Filter on `to:` the Poe addresses | **Darrell and Mrs. Poe are on `Cc`, never `To`.** The messages are addressed to two other members. A `to:` filter matches **nothing**. |
| 3 | It arrives Sunday | **It arrives Wednesday**, mid-morning Central, **carrying the preceding Sunday's sermon.** The older subjects state it outright — 03-25 → *"FROM 03-22-2026 SERMON"*, 03-04 → 03-01, 02-18 → 02-15, 01-28 → 01-25. Recent subjects dropped the clause and some Wednesday sends carry that day's Bible Study instead. **So the Way keys on the email arriving, never on a weekday.** |
| 4 | BG preached it | **BG is the SENDER.** Senior Bishop Lloyd E. Gwin sends every one, but the **subject line names who preached** — Pastor Ken McCray and Pastor Aaron Forman appear on many weeks. Attribution follows the subject, or DR-0190 is breached by crediting the wrong servant of Yahweh. |

---

## PASS ONE — the email, the day it lands

1. **Open the attachment.** The `.docx` is the sermon. An empty body is the normal case, never evidence that nothing came.
2. **Attribute from the subject line.** Credit the preacher it names, by name and date. Credit BG as the sender of the notes where that is what he was.
3. **Occasion, never reproduction.** The message is the **occasion**. It is credited and **not reproduced** — the lesson is our own prose taught from the Scriptures the message opened. (Worked examples: L119 *Equipped to Win*, L129 *You Have a Destiny*.)
4. **Fetch every verse.** The subjects cite NKJV, NIV, KJV and EEB. **Our quotations come verbatim from the in-repo corpus** (`app/public/bible/kjv/`, or the WEB where chosen), fetched at authoring time — never from memory, never retyped out of the document, never carried on the source's translation. Record the translation the church cited as a fact *about the source*; do not use it as our text.
   *Watch the cross-verse trap:* the corpus joins verses with a newline, so a quotation spanning a verse boundary is not a substring of it and must be split on an ellipsis. This class has bitten L112, L113, L114 and L129 (eight times in one lesson).
5. **Private people stay out.** Services announce trivia winners, birthdays, sick lists and giving **by name**. Those are private individuals and never enter a lesson. The gate checks the real property — a congregational honorific followed by a name — because a keyword ban cannot tell *"the names are omitted"* from *"here are the names."*
6. **Typographic theology is senior to the source.** The 2026-08-19 subject reads *"NOT TODAY SATAN, NOT TODAY!"* with the adversary's name capitalised. **The violation is surfaced and never copied through.** This will recur; it is the standing instance of Layer 0's "When Source Text Conflicts With These Rules."
7. **Render for meaning (DR-0331).** The subjects and documents carry typos — `SERMOIN`, `THROUGBH`, `FIUX`, `WSERMON`, `YOIU`, `DON,T`, `GLOT`. Where we restate them, we render for meaning. Never mocked; never reproduced as though the error were the point. **Quoted Scripture is untouched, always.**
8. **Ship it the same session** through the normal lane: a verse-verification suite **proven-to-catch**, lint, the full suite, a real build, PR, gates, auto-merge.
9. **Tell Darrell what the word became** — where it lives, what it is named, how it plays.

---

## PASS TWO — the YouTube recording, when it exists

**The video is a different source, not a duplicate.** The document carries the PROCLAIM points; the recording carries the preaching — the asides, the corrections, the illustrations, the room. It earns its own pass.

- It may produce an **enriched revision** of the pass-one lesson **or a second lesson**, whichever the material warrants.
- It must **never silently overwrite** pass one.
- It must **never be skipped** merely because a lesson on that sermon already exists.

### Access map — do not rediscover this (DR-0108)

| Channel | State |
|---|---|
| This cloud sandbox → YouTube | **Blocked.** The egress proxy answers 403 to CONNECT. Report the blocked host; never route around it. |
| `transcript-backfill.yml` (GitHub runner) | **Documented non-working** — YouTube hard-blocks runner IPs; proven red across 50 attempts (run #5, 2026-07-11). Firing it posts a false red. |
| **NAS transcript trickle (residential IP)** | **The living route.** But it only drains gaps for videos already in `choir_sermons`. |
| `choir_sermons` channel sync | **Measured stale 2026-09-03** (newest row 2026-08-30). |

**Therefore: a stale `choir_sermons` sync silently disables pass two.** That is exactly how the L119 video became invisible to the app. The staleness is a defect to raise, not a reason to skip the pass. `re-review: 2026-09-13`.

---

## What this Way does not do

- It does not authorise publishing anything COLG-facing without the normal tier gate (RELEASE-TIERS).
- It does not authorise reproducing the church's documents.
- It does not make the agent a judge of doctrine. Where the source and the Word appear to diverge, or where placement is ambiguous, the material is **captured faithfully and the question is surfaced** — but it is never dropped silently.

---

## Not yet automated

The trigger is presently the agent acting on this standing rule when a session sees the mailbox. **Wiring it to fire without a session** — a Routine polling the sender that opens the intake on arrival — is the buildable next step, tracked in DR-0333 rather than assumed done. `re-review: 2026-09-13`.

**Pairs with:** DR-0333 (the decision), DR-0190 (attribute, never assert), DR-0076 (verify; no verse from memory), DR-0331 (render for meaning), DR-0108 (account for the whole team's reach), Layer 0 "Spoken Teachings Are Build Input" and the typographic-theology conflict clause.
