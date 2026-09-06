---
id: DR-0333
title: The COLG sermon-intake Way — every bg@ email becomes a lesson the day it lands, and a second pass when the sermon reaches YouTube
date: 2026-09-06
status: accepted
supersedes: []
superseded-by: null
tier: n/a
entities: [colg, poetech]
grounds: [WORD-FIRST, VERIFICATION-DOCTRINE, TRUST-BUT-VERIFY, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, STANDING-CONSENT, REVIEW-OUR-WAYS, EXCELLENCE-STANDARD, DECISION-RECORDS]
source: 2026-09-06 — Darrell: "Also BG sent his lesson today like every Sunday look at those emailed attachments to produce his lesson from his sermon today... then do another when the sermon is on YouTube also... later in the same day every time darrellpoe06@gmail.com or mrspoe06@gmail.com gets emails from bg@thechurchofthelivingGod.com.... add to our Ways and documentation..."
---

## Context

Sermons from The Church Of The Living God have been reaching this platform by
hand, one at a time, whenever Darrell happened to paste one in. L119 (Equipped
to Win) is the worked example and it cost a whole session, most of it spent
discovering that this sandbox cannot reach YouTube and that the channel sync had
gone stale — work that will be repeated every week until the intake is a
standing Way instead of an errand.

Darrell declared the standing rule on 2026-09-06. This DR records it, and — per
the Reality-Trace rule — records **what the source actually is**, because four
things about it are not what a reasonable person would assume, and each one
would break an intake built on the assumption.

### What the source actually is (measured, not assumed)

Read from the live mailbox on 2026-09-06: 201 threads from
`bg@thechurchofthelivinggod.com`, with the most recent thirty inspected in
detail and the 2026-09-02 message opened in full.

1. **The email body is EMPTY.** The `plaintextBody` of the 2026-09-02 message is
   BG's signature block and nothing else — "PRAISE GOD!!!", a name, a phone
   number, an address. **Every word of the sermon is inside a `.docx`
   attachment** (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`),
   whose filename mirrors the subject:
   `09-02-2026  - PROCLAIM - EQUIPPED TO WIN- JEREMIAH 31.1-4 NKJV.docx`.
   An intake that reads the body gets a signature and concludes there was no
   sermon.
2. **Darrell and Mrs. Poe are on Cc, never To.** The messages are addressed to
   `tricia50712@gmail.com` and `boldenterence@yahoo.com`; the Poe addresses sit
   in `ccRecipients` alongside the church staff. **A Gmail filter keyed on `to:`
   matches nothing.** The trigger must key on the SENDER.
3. **The cadence is WEDNESDAY, and it carries the preceding SUNDAY's sermon.**
   Darrell said "every Sunday", and Sunday is right about the *preaching*; the
   *email* is Wednesday, mid-morning Central. The older subjects state the
   relationship outright — the 03-25 email reads "PROCLAIM SCRIPTURES AND POINTS
   FROM 03-22-2026 SERMON", 03-04 → 03-01, 02-18 → 02-15, 01-28 → 01-25,
   01-07 → 01-04. Recent subjects have dropped the "FROM <date>" clause and
   carry a single date, and some Wednesday sends carry that day's Bible Study
   instead. So the Way is keyed on **the email arriving**, never on a weekday.
4. **BG is the SENDER, not always the preacher.** Senior Bishop Lloyd E. Gwin
   sends every one, but the subject line names who actually preached — Pastor
   Ken McCray (03-18, 07-01, 08-05, 01-14, 02-18), Pastor Aaron Forman /
   Foreman (02-04, 12-17). Attribution must follow the subject line, or DR-0190
   is breached by crediting the wrong servant of Yahweh.

### Two further facts the intake must carry

- **The subjects and documents contain typos** — `SERMOIN`, `THROUGBH`, `FIUX`,
  `WSERMON`, `YOIU`, `DON,T`, `GLOT`, `DISTRCT`. Rendered for meaning per
  DR-0331 wherever we restate them; never mocked, never reproduced as though
  the error were the point.
- **The source will sometimes violate our typographic theology.** The 2026-08-19
  subject reads "NOT TODAY SATAN, NOT TODAY!" with the adversary's name
  capitalised. Layer 0 is explicit that the rule is senior to the source: the
  conflict is surfaced and the violation is **not copied through**. This is the
  standing, recurring instance of that rule, and it will recur.

## Decision

**Every email from `bg@thechurchofthelivinggod.com` reaching
`darrellpoe06@gmail.com` or `mrspoe06@gmail.com` is BUILD INPUT, and it becomes
a Living Lesson the same day it lands — without being asked.** And when the same
sermon reaches YouTube, it gets a **second, separate pass**.

### PASS ONE — the email, the day it arrives

1. **Trigger on the sender, same day.** Not on a weekday, not on the `to:` line.
   Any message from that address to either Poe address opens the intake.
2. **Read the ATTACHMENT, not the body.** The `.docx` is the sermon. An empty
   body is the normal case and is never evidence that nothing was sent.
3. **Attribute from the subject line.** The preacher named in the subject is the
   preacher credited — Bishop Gwin, Pastor McCray, Pastor Forman, whoever it
   says. BG is credited as the sender of the notes where that is what he was.
4. **Occasion, never reproduction.** The message is the OCCASION. It is credited
   by name and date and is **not reproduced**: the lesson is our own prose
   taught from the Scriptures the message opened (the L119 and L129 pattern).
5. **Fetch every verse; never carry the source's translation on trust.** The
   subjects cite NKJV, NIV, KJV and EEB. Our quotations come verbatim from the
   in-repo corpus (KJV, or the WEB where chosen), fetched at authoring time,
   never from memory and never retyped out of the document. The translation the
   church cited is recorded as a fact about the source, not used as our text.
6. **Private people stay out.** Services announce trivia winners, birthdays,
   sick lists and giving by name. **Those are private individuals and never
   enter a lesson.** (Established on L119; the gate there checks the real
   property — an honorific followed by a name — rather than banning a keyword,
   because a keyword ban cannot tell "the names are omitted" from "here are the
   names".)
7. **Ship it through the normal lane the same session** — a verse-verification
   suite proven-to-catch, lint, the full suite, a real build, PR, gates,
   auto-merge. Then tell Darrell what the word became and where it lives.

### PASS TWO — the YouTube recording, when it exists

The video is a **different source with different content**, not a duplicate: the
document carries the PROCLAIM points, the recording carries the preaching — the
asides, the corrections, the illustrations, the room. So it earns its own pass,
and the two passes may produce either an enriched revision of the first lesson
or a second lesson, whichever the material actually warrants. It must never
silently overwrite pass one, and it must never be skipped merely because a
lesson on that sermon already exists.

**Known access constraint, recorded so the next session does not rediscover it
(DR-0108):** this cloud sandbox **cannot reach YouTube** — the egress proxy
answers 403 to CONNECT, and `transcript-backfill.yml` on a GitHub runner is
documented non-working because YouTube hard-blocks runner IPs. The living route
is the **NAS transcript trickle on the residential IP**, which drains gaps for
videos already in `choir_sermons`. Therefore pass two depends on the channel
sync having pulled the video in. **A stale `choir_sermons` sync silently
disables pass two**, which is precisely how the L119 video became invisible to
the app; that staleness is itself a defect to raise, not a reason to skip.

### What this does NOT do

It does not authorise publishing anything COLG-facing without the normal tier
gate; it does not authorise reproducing the church's documents; and it does not
make the agent the judge of doctrine — where the source and the Word appear to
diverge, or where placement is ambiguous, the material is captured faithfully
and the question is surfaced. But it is **never dropped silently**. A sermon
that arrives and produces nothing breaks the covenant this Way records.

## Consequences

- The weekly rediscovery cost goes away; the intake is a Way, not an errand.
- The four measured facts above are now written down, so the next session does
  not build an intake on the body, the `to:` line, a weekday, or the assumption
  that BG preached it.
- The typographic-theology conflict has a standing, named instance.
- **Carried, unresolved:** the `choir_sermons` channel sync was last measured
  stale on 2026-09-03 (newest row 2026-08-30). Pass two is not reliable until
  that is fixed. `re-review: 2026-09-13`.
- **Not yet automated.** This DR establishes the WAY and its verified source
  shape. The trigger is presently the agent acting on the standing rule when a
  session sees the mailbox. Wiring it to fire without a session — a Routine that
  polls the sender and opens the intake — is the buildable next step and is
  tracked here rather than assumed done. `re-review: 2026-09-13`.

## Grounds

Layer 0 "Spoken Teachings Are Build Input" (a word spoken into this channel is
built, not filed) extended to the words Darrell RECEIVES from his church and
hands to the platform; DR-0089 standing consent; DR-0111 do the work, do not
re-ask; DR-0076 verification and no verse from memory; DR-0190 attribute, never
assert on our own authority; DR-0331 render for meaning; DR-0108 account for the
whole team's reach and record the access map; Layer 0 typographic theology and
its "When Source Text Conflicts With These Rules" clause.
