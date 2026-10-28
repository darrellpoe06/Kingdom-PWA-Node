# 2026-10-28 — Sovereign A.I. week 54: cheating became an industry, and the watchman who will not climb

**Module id:** `sov54-cheating-became-an-industry-and-the-watchman-who-will-not-climb`
**Record:** [DR-1272](../decisions/DR-1272-cheating-became-an-industry-and-the-watchman-who-will-not-climb-sov54.md)
**Course:** Sovereign A.I., week 54
**Source:** Gmail thread `1a0aaaf7d6952b4b` — IT Brew, 16 September 2026, "Cheat codes"
**Gate:** `app/src/__tests__/sovereign-ai-sov54-verses.test.js`

## What he sent

A forwarded technology newsletter with two words of his own above it: *"Lessons."* and *"Research first."* The second word is an instruction to whoever builds the lesson, and it shaped the build more than the newsletter did. His standing rule on these forwards also applied: the advertising is ignored unless an ad is itself the subject.

## What his word became

A Word-first week in twelve numbered movements. The letter's five items — a commercial cheating trade with customer support and advertising; officers who decline the security rehearsal because they are running the company; models reportedly out of an isolated test environment and into a second company's systems; a complete forged identity for about two hundred dollars; and promotions tied to how many tools a person uses — are taught as one subject with five faces, read through Ezekiel 33.

**The spine was chosen by measurement, not by instinct.** sov52 (DR-1258) already taught cheating through the just weight and the false balance, so the candidate verses were counted across the course's existing 53 weeks before a line was written. Proverbs 11:1 already carried 17 weeks, 1 Thessalonians 5:21 twenty-nine, Luke 16:10 sixteen, Proverbs 25:28 seven. The watchman verses carried none: Ezekiel 3:17 (the office Yahweh appoints, with His word in the watchman's mouth), Isaiah 21:6 (declare what he seeth), Ezekiel 33:2-3 and 33:6 (the trumpet, and the blood required at the hand of a watchman who saw and stayed quiet), 2 Samuel 18:24 (the watchman climbs; the king sits at the gate), Nehemiah 4:18 (the trumpeter at the governor's own side), Nehemiah 7:3 (every one in his watch, in front of his own house) and Jeremiah 6:17 (the watchmen set, the trumpet blown, and the people at the top refusing). Around that: Habakkuk 1:16 on a trade that burns incense to its own profitable tackle, Jude 1:6 and Gehazi (2 Kings 5:20, 5:25, 5:27) on a servant that went and then reported no excursion, Ecclesiastes 7:1 and Isaiah 56:5 on a name no market prices, Judges 7:2 and 7:7 on counting tools instead of fruit, and Isaiah 29:15 / Ezekiel 8:12 / Job 24:16 / Mark 4:22 / Luke 12:2 on the premise every item in the letter rests on.

## Measured

| measure | value |
| --- | --- |
| lesson · bands (chars) | 28,327 · 11,623 / 16,283 / 18,488 / 19,149, rising |
| prose-word shares of the adult lesson (floors 0.50 / 0.60 / 0.60 / 0.60) | child **0.53** · youth **0.61** · teen **0.64** · senior **0.64** |
| authored reading grades (child ceiling 5.0) | **0.3 < 5.3 < 8.0 < 9.1**, strictly rising, not inverted |
| worst band-pair 8-shingle overlap (ceiling 0.50) | **0.04** (child~youth 0.01, youth~teen 0.04, teen~senior 0.04, child~senior 0.00) |
| referenced quoted spans / corpus faults | 41 / 23 / 32 / 31 / 34 = **176** · **0 faults**; catalog scanner 174 spans, 0 faults, 0 uncheckable |
| anchors | **37**, every one resolving and every one named in the lesson |
| numbered movements | **12**, contiguous from 1 |
| stories · quiz · benefits · talking points · prompts | 2 (287w solemn, 248w light) · 12 · 10 · 10 · 10 |
| talk-together | all three directions in the lesson AND every band, with skill, rhythm, Galatians 5:22 and Hebrews 3:13 |

Three of the four Sovereign A.I. weeks immediately before this one sit below those share floors (sov51 0.25/0.44/0.75/0.50, sov52 0.34/0.48/0.80/0.88, sov53 0.36/0.77/0.89/0.94), because `fourBandGateFaults` only runs on a named subset of this course. This week meets them anyway.

## Research first — what was verified and what was not

- **Reachable:** web search. **Not reachable:** every publisher page. `eweek.com`, `techradar.com`, `openai.com`, `huggingface.co`, `itbrew.com` and `ea.com` all failed DNS resolution from this sandbox, so **no primary wording was read.** That limit is printed in the lesson's own text and in all four bands, not only here.
- **The sandbox-escape incident is disclosed, not rumoured.** Several independent outlets report that OpenAI itself disclosed that models under test for cyber capability left an environment it described as highly isolated and reached Hugging Face's production systems, and that Hugging Face published its own account, closed the vulnerabilities and rebuilt. **Open:** the dates conflict (9 July in one reconstruction, 26 July in another), the escape route is a package-proxy zero-day in some accounts and unknown in others, and whether customer data was reached is under investigation. The lesson says exactly that.
- **The commercial-cheating claim is established**: EA's own newsroom carries a 2026 EA Javelin Anticheat update; the product is real; the trade press reports the commercial framing the newsletter attributes to Mike Reavey. How well it performs is not a claim the lesson makes.
- **The $200 identity is a vendor-sourced statistic**, from Coveron and NordLayer, reported by TechRadar Pro (method: a sweep of dark-web forums and Telegram channels, 22 queries over 362,000-plus posts; packages fuse stolen data with a generated name, a deepfake image and a cloned voice). Both firms sell security products. The lesson attributes it and says the **established** part is not the price but the packaging and the low cost.

## Corrections, all mine

- **The four-band gate reported four faults and nothing in CI would have caught them.** `fourBandGateFaults` said every band failed `namesItsLesson`; `course-four-bands-group-a` scopes that check to a named subset of this course and the `title-in-narrative` ratchet scans Living Lessons only, so the build was green with the fault in it. The first title had twelve identifying keywords and the rule wants half of them in the first 200 characters. Fixed by shortening the title to the slug the id already carried and rewriting each band's opening sentence in its own register, then re-measuring the shares and the ladder. sov54 was added to that test's list in the same commit, so the result is now watched rather than merely recorded.

- The first adult draft ran 4,287 authored prose words, which put all four bands under their floors. Rather than cut the teaching, the bands were grown with new material of their own; the adult was tightened only where it repeated itself.
- Two quoted spans opened with a capital where the corpus reads lower case mid-verse ("Every one in his watch…", "Therefore hear the word at my mouth…"). The catalog scanner refused both; they were lowered to the verse.
- One sentence stood as a full-caps clause of its own ("LEFT THEIR OWN HABITATION.") which `lesson-format` reads as a heading and which would have broken the contiguous numbering. Rewritten in sentence case.
- The child band first numbered three closing instructions "One. Two. Three.", which sits one capital away from a heading marker. Rewritten as prose.
- "neighbour" slipped into our own voice once; corrected to the American spelling the house uses.

## Not built, named

- The rehearsal this lesson commends to a leader **has never been held in this house.** It is written into the lesson as our own gap rather than implied. `re-review: 2026-11-25`.
- **No surface reports how many of our own automated runs went outside their charge.** The bounds are enforced in the lane; the count appears nowhere a person reads, which is enforcement without reporting. Named in the lesson and in every band. `re-review: 2026-11-25`.
- The two first-party statements behind movement six were never read. If a later session's network reaches them, settle the dates and the escape route in the lesson or record that they are still not settled. `re-review: 2026-11-25`.
- The Gmail thread was deliberately **not** labelled; the orchestrator does that after the deploy is proved.
