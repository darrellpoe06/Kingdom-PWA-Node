# The Eternal Covenant — All Judgment Committed unto the Son

**Date:** 2026-07-05
**Declared by:** Darrell — *"Yahweh gives judging the souls on earth over to His Son Jesus Christ. I want to make sure I'm abiding by that eternal covenant — and so do the Kingdom Believers. Comprehensive review and algorithm lists... inside the PoeTech App."*
**Layer:** 4 (working artifact — the repo memory of this review). The review itself lives **inside the app** (DR-0065: the app is the primary artifact): Church → Eternal Algorithms → The Godhead Study room → *Featured review*.
**Posture:** taught as the Word states it (DR-0098 — teach the Word, do not debate it); every verse fetched verbatim from the public-domain KJV artifact and test-verified (DR-0076 — no Scripture from memory).

---

## 1. The covenant as the Word states it

The Son states the covenant Himself:

> **KJV — John 5:22-23:** *"For the Father judgeth no man, but hath committed all judgment unto the Son: That all men should honour the Son, even as they honour the Father. He that honoureth not the Son honoureth not the Father which hath sent him."*

And the ground of His authority:

> **KJV — John 5:27:** *"And hath given him authority to execute judgment also, because he is the Son of man."*

The Word shows the order of the court:

- **The rescue leads.** *"I came not to judge the world, but to save the world"* (John 12:47) — the first advent opens the door before the session convenes.
- **The exemption is published by the Judge Himself.** *"He that heareth my word, and believeth on him that sent me, hath everlasting life, and shall not come into condemnation; but is passed from death unto life"* (John 5:24) — present tense, the verdict moving before the court date.
- **The standard is already on the table.** *"The word that I have spoken, the same shall judge him in the last day"* (John 12:48) — no sealed rubric, no ambush.
- **The day is appointed and the Judge is named.** *"He hath appointed a day, in the which he will judge the world in righteousness by that man whom he hath ordained; whereof he hath given assurance unto all men, in that he hath raised him from the dead"* (Acts 17:31); *"ordained of God to be the Judge of quick and dead"* (Acts 10:42; 2 Timothy 4:1). The resurrection is Heaven's public notice.
- **Believers appear too.** *"We must all appear before the judgment seat of Christ"* (2 Corinthians 5:10); *"every one of us shall give account of himself to God"* (Romans 14:12).
- **The saints are promised the bench under Him.** *"Do ye not know that the saints shall judge the world?... Know ye not that we shall judge angels?"* (1 Corinthians 6:2-3); *"I saw thrones, and they sat upon them, and judgment was given unto them"* (Revelation 20:4).
- **The Judge comes carrying the reward.** *"Behold, I come quickly; and my reward is with me, to give every man according as his work shall be"* (Revelation 22:12); a crown from *"the righteous judge"* for *"all them also that love his appearing"* (2 Timothy 4:8).

(ESV citations are linked in-app, never reproduced — SCRIPTURE-REFERENCE-STANDARD; the KJV text above is copied from the verified fetch artifact `app/src/lib/godhead-study-verses.json`, not from memory.)

## 2. Abiding by the covenant — the checklist for every Kingdom Believer

1. **Honour the Son even as the Father is honoured** — worship, speech, and how every soul is handled all route through His seat (John 5:22-23).
2. **Walk through the door the Judge Himself opened** — hear His Word, believe the Father who sent Him, live as one already passed from death unto life (John 5:24).
3. **Live toward His judgment seat** — labour to be accepted of Him; keep your OWN account current; your energy goes to your own docket, not your brother's case file (2 Corinthians 5:9-10; Romans 14:10-12).
4. **Vacate the seat on every other soul** — discern fruit as the Word commands, but hand every VERDICT to the one Lawgiver; judge nothing before the time (James 4:12; Romans 14:4; 1 Corinthians 4:5).
5. **Train for the bench under Him** — settle the smallest matters inside the Body now; judgment is GIVEN at His seat, on His terms, never seized ahead of Him (1 Corinthians 6:2-3; Revelation 20:4).
6. **Love His appearing** — the covenant turns the court date into the family's payday; the Judge arrives with the reward in His hand (Revelation 22:12; 2 Timothy 4:8).

## 3. The covenant's algorithm list (in covenant order)

New cluster in the Godhead Study catalog (`app/src/lib/godhead-study.js`), each a deterministic IF/THEN the Word itself states, each dealing automatically into the Generations game deck:

| # | id | Name | Refs |
|---|----|------|------|
| 1 | `gh-judgment-committed-to-son` | All Judgment Committed unto the Son (the eternal covenant of the court) | John 5:22-23; John 5:26-27 |
| 2 | `gh-hear-believe-no-condemnation` | Hear and Believe → No Condemnation (the Judge published the exemption) | John 5:24 |
| 3 | `gh-word-judges-last-day` | The Word Judges at the Last Day (the standard is already published) | John 12:47-48 |
| 4 | `gh-appointed-day-ordained-judge` | A Day Appointed, a Judge Ordained (the resurrection is the assurance) | Acts 17:31; Acts 10:42; 2 Timothy 4:1 |
| 5 | `gh-judgment-seat-of-christ` | The Judgment Seat of Christ (every one gives account of himself) | 2 Corinthians 5:9-10; Romans 14:10-12 |
| 6 | `gh-vacate-the-seat` | One Lawgiver — Vacate the Seat (who art thou that judgest another?) | James 4:12; Romans 14:4; 1 Corinthians 4:5 |
| 7 | `gh-saints-judge-with-him` | The Saints Shall Judge the World (Kingdom Believers in training for the bench) | 1 Corinthians 6:2-3; Revelation 20:4 |
| 8 | `gh-judge-comes-with-reward` | The Judge Comes With the Reward in His Hand (love His appearing) | Revelation 22:12; 2 Timothy 4:8 |

Existing entries the covenant leans on (already in the catalog): `gh-wheat-and-tares` (you are not the reaper), `gh-sheep-and-goats` (the separating is His), `gh-measure-measured` (judge not), `gh-appointed-then-judgment` (once to die, then the judgment), `gh-angels-left-their-estate` (rebellion already sentenced), `gh-nothing-unclean` (the City's gate condition).

## 4. Where it lives in the app

- **The review:** Church → Eternal Algorithms → **The Godhead Study** room → *Featured review — The Eternal Covenant*, with the declared word, the taught summary, the abiding checklist (every anchor rendered verbatim KJV), and the eight algorithms walked in order. Data model: `JUDGMENT_COVENANT_REVIEW` + `covenantAlgorithms()` in `app/src/lib/godhead-study.js`; surface: `CovenantReview` in `app/src/components/EternalAlgorithmsStudy.jsx`.
- **The algorithm list:** the eight entries render in their canon sections and under their books (John, Acts, 2 Timothy, 2 Corinthians, Romans, James, 1 Corinthians, Revelation), and deal into the Generations game via `godheadToGameCards()` — the Word travels with the play.

## 5. Verification receipts (DR-0076)

- `node scripts/fetch-godhead-verses.mjs` → **OK — 213 refs fetched verbatim** (KJV, public domain) into `godhead-study-verses.json`; every new ref resolved (the script hard-fails on any unresolvable ref).
- Every quoted fragment in the new entries was programmatically checked against the fetched verbatim text — **16/16 refs matched** (one typographic-apostrophe glyph difference only, words identical).
- Test suite: `godhead-study.test.js` extended (covenant order resolves; every abiding anchor has verbatim text; covenant entries deal into the game; John 5:22-23 + Acts 17:31 spot-checked verbatim) and `eternal-algorithms-study-render.test.jsx` extended (the review renders on the REAL mounted surface; the declared word, the abiding checklist, and the verbatim covenant verse all observed on the rendered DOM).
- Full app verify: `eslint` clean; **all vitest tests passing** at time of commit.

## 6. Release tier

Tier B (new feature on an existing public study surface; soaks on the branch's preview before merge). No real money flow, no tenancy, no COLG-facing identity change.
