# DR-1356 — Sat where they sat: the oldest forward-deployed pattern, and the video we never saw (pm15)

**Status:** accepted
**Tier:** B
**Date:** 2026-11-06
**Scope:** pm15 · Project Management: Count the Cost · Gmail thread `1a1643591fce3702`
**Relations:** DR-1349, DR-1326, DR-0190, DR-0100, DR-1317, DR-1316, DR-1266, DR-0719, DR-0734, DR-0733/DR-0795, DR-0530, DR-0098, DR-0076, DR-0210, DR-0127/DR-0282, DR-0609, DR-1123, DR-1339, DR-1343, DR-1347

**Intake:** Gmail thread `1a1643591fce3702`, forwarded **2026-10-22 15:23:09 UTC**, subject `FW: What is a forward-deployed engineer?`, from McKinsey & Company `publishing@email.mckinsey.com`. His typed words above the forwarded header, exactly: **"Lesson and research…"** — TWO instructions, not a label. Both are answered: the teaching, and a research pass whose findings are stated in the reader's own text.

---

**Narrative:** [`docs/99-session-notes/2026-11-06-pm15-sat-where-they-sat-the-oldest-forward-deployed-pattern.md`](../99-session-notes/2026-11-06-pm15-sat-where-they-sat-the-oldest-forward-deployed-pattern.md) — the refused-road log, the full tier table, the repository-wide passage measurement, the neighbour-gate diagnosis and the verbatim reader audit live there, per DR-1339.

## Context

**The send is a PROMOTION FOR A VIDEO, not an article.** No article body exists anywhere in it: two teaser paragraphs, three headshots, three names, one link to a video Explainer, then subscription furniture. **We never saw the video**, and the publisher's own page was refused by this session's egress, so there was no road to its substance. Every reader place therefore says what the item was and says we did not watch it; no view is attributed to Holger Hürtgen, Martin Harrysson or Nick Robson beyond the two sentences the email literally prints. **WHO TAUGHT: nobody** — a forwarded promotion is not a recording.

What the send DOES contain is genuinely useful, so it is quoted rather than paraphrased as ours: the publication prints **its own scepticism about its own cover story** — the term may be a buzzword for a service consulting firms have offered for years — and records that the three speakers' views on the FDE/consultant line "suggest the role is still evolving," i.e. they do not agree.

The advertising furniture was **ignored**, per the standing rule; nothing in it touches the subject. One line of it earned a place as a measured fact rather than a complaint: the message states that opening it or clicking a link is agreement to cookies and web tracking.

## What was measured

**Two references the repository had NEVER opened**, counted across `app/src` and `docs/decisions` excluding `app/public/bible/xref/`: **Ezekiel 3:15 — 0 files. Exodus 18:14 — 0 files.** The spine of this lesson and the hinge of its Jethro reading were both untouched ground. Also thin: Job 2:13 (6), Job 42:7 (5), Nehemiah 2:15 (4), 1 Thessalonians 2:9 (6), John 10:13 (7). Heavily used and kept anyway per DR-1317: Proverbs 18:13 (68), Proverbs 24:3-4 (41), John 1:14 (30).

**Duplicate check:** "sat where they sat" — 0 hits anywhere outside the corpus. Jethro appears in pm11 (DR-0609) on **delegation** — the layers, the escalation rule, character before skill. This lesson's landing is earlier and narrower: **he WATCHED a whole working day and opened with a question**, which is Exodus 18:14, the verse pm11 never used. The reader's text says so without naming a record. Proverbs 24:3-4 and the Resources were used by **pm14 (DR-1349)** to refuse a borrowed measure; here they land on the other side, as what the one who is PRESENT supplies that no credential hands over, and the senior band says so.

**Placement verified, not assumed:** pm14 is on main at `3bae4cac1`, so this is pm15 at index 14.

## Impact

The newsletter sells nearness as a 2026 invention for the age of A.I. Without this lesson the course had no worked case of the pattern's actual age, and no test for counsel that costs the adviser nothing. It also had no example of a source we only half have — the honest handling of a trailer.

## Decision

**pm15 — "Sat where they sat: the oldest forward-deployed pattern, and the video we never saw"** lands in **Project Management: Count the Cost**, on pm11 (Jethro) and pm13 (steering). The Word is first and is the authority: Ezekiel sat where they sat seven days before a word came (Ezekiel 3:15-17); Nehemiah viewed the broken wall himself at night, told no man, and then said **we** and **us** (Nehemiah 2:11-17); Jethro watched a full day and asked before he judged (Exodus 18:13-18); Paul worked the same craft and would not be chargeable (Acts 18:3; 1 Thessalonians 2:9; 2 Thessalonians 3:8; 1 Corinthians 2:3). The ground is John 1:14 with Philippians 2:7 and Hebrews 4:15, carried with an explicit reverence guard in every adult place — nearness is Yahweh's way, **NOT** that an engineer is like Christ. The correction keeps presence from becoming flattery: Job's friends did the nearness perfectly (Job 2:13) and their speaking drew wrath (Job 42:7). The dividing line the Word draws is **ownership, not title** (John 10:12-13) — which is exactly what the three speakers could not settle. The buzzword question is answered from Ecclesiastes 1:9-10 and Jeremiah 6:16 and **no date is claimed**. Both stories are `kind: 'parable'` (DR-1123): the source was a promotion, so there is no person whose life it was to name.

## Verification

**47/47 green** in `project-management-pm15-verses.test.js`: 38 references re-read from `app/public/bible/kjv` at test time, **169 referenced spans verbatim, 0 faults**, `anchor.ref` exact in BOTH directions, three proven-to-catch cases. Forward-safety uses the DERIVED `PROJECT_MANAGEMENT_MODULES.length + 1`, never a literal. Library ratchet: pm15 lands WHOLE (5 versions, 8 components, adult 2,314 prose words), `waiting` unchanged, **baseline not re-frozen**. Band coverage regenerated by script: total 458→459, allFour 284→285, project-management {lessons: 15, allFour: 15}, adultOnly 0.

**Five gaps the gates found were fixed in the LESSON, not the matchers:** the youth band never stated the order the whole lesson turns on; the teen band's reverence guard had no closing line at all; and **the course-wide gate caught two real defects** — six of the send's own sentences were in quotation marks (this course reserves quotation marks for verbatim Scripture, which is the right rule), now carried word for word and set off by attribution instead, and the lesson **never named the industry's own term**, which left the course's whole thesis untaught in it. The four-band floor then caught the child band at **0.42** and the youth at **0.52** of the adult prose — **Jethro was missing from both bands entirely**, and authoring him in raised them to 0.56 and 0.65 while band differentiation IMPROVED (worst pair 0.20, child~youth 0.13→0.10). And the guards leg caught what no local run could: `lesson-dates.json` was derived BEFORE pm15 was committed, so its row read `working-tree`; re-derived, it names `67dd1fc3`. One matcher was loosened, and only after the lesson was shown to be right in all three places it named.

**A NEIGHBOUR'S GATE IS RED AND IT IS NOT THIS LESSON — it is reported, not edited.** `project-management-pm14-verses.test.js:198` appends the **literal `15`** in the case named *"PROVEN-TO-BE-FORWARD-SAFE: a pm15 landing does not break this gate"*, so a real pm15 makes the list `[1..15, 15]`. **That is DR-1316's defect class reproduced for the THIRD time** — pm13 appended a literal `14`, pm14 repaired it with the derived `length + 1`, and then hardcoded `15` in its own forward-safety case. The fix is one line, the same derived expression. Per the builder brief this session does not edit another lesson's gate; the Governor decides.

**Honest limit:** the video is **unwatched** and the filings **unread** — `www.palantir.com`, `www.sec.gov`, `sec.gov` and `www.mckinsey.com` all returned `getaddrinfo ENOTFOUND`, and the filings full-text host returned a proxy refusal. **No primary source was read.** No teaching rests on either. `re-review: 2026-12-06`.
