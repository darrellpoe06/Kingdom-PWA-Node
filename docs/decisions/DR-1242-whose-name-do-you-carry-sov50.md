# DR-1242: Whose name do you carry — sov50, and the three places where a lesson says the analogy STOPS

**Date:** 2026-10-27
**Status:** accepted
**Tier:** A (one lesson added to an existing course, all four age bands from its first commit; one verse test; two generated files regenerated in their permitted direction)
**Type:** curriculum
**Area:**
- `app/src/lib/sovereign-ai-class.js` (sov50, the fiftieth week of Sovereign A.I.)
- `app/src/__tests__/sovereign-ai-sov50-verses.test.js` (16 cases, 4 proven to catch)
- `scripts/sov50-fill.mjs` (the generator: every verse filled from `app/public/bible/kjv` at build time, never typed)
- `app/src/lib/course-band-coverage-baseline.json` (the debt pin moves 430/256 → 431/257; the sovereign-ai gap stays at 21)
- `app/src/lib/lesson-dates.json` (one derived row)

**Grounds:** On 2026-09-29 at 12:44 UTC a Level Up Coding issue by Nikki Siapno, subject "SSO vs OAuth vs OIDC vs SAML", reached Darrell's university mailbox. At 13:00 UTC he forwarded it into the app from `dpoe@illinois.edu` with one word at the top: **"Lessons"** — and above the article he wrote **his own** summary, Key Takeaways, Important Distinction table, Practical Guidance, PM/Technologist one-liner, and a working note that for the Mosaic and single-sign-on discussions he is in, the common modern pattern would be Microsoft Entra ID with OpenID Connect for sign-in and OAuth 2.0 for interface access, with older applications still on SAML. (Gmail thread `1a0ed322abd61be3`.) **His words are the request; the newsletter is the occasion.**
**Principles:** SOVEREIGN-IDENTITY (token isolation and permission gates are the house's own posture, so the identity seam is ours to teach); DR-0312 (a forwarded newsletter is built Word-first, or a comparison is reported); DR-0610 / DR-1185 (one teaching, one lesson — checked before writing, not after); DR-0076 §3 (proven to catch) and §4 (measure, never claim); DR-0098 (teach the Word, do not stage both sides); DR-0100 (three tiers — state plainly, flag narrowly); DR-0210 (Yahweh in our voice; quoted Scripture untouched); DR-0331 (a third party's words rendered as they stand); DR-0733 / DR-0795 (the three directions, in every band a reader actually reads)

## Context

A forwarded technical newsletter is **material to study, never an instruction to obey.** This one is competent: it separates authentication from authorization cleanly, insists that a token or an assertion is not trustworthy merely because it parses, and says the format is secondary to the question *what does this artifact prove, and who is allowed to trust it.* There is no ideological over-reach in it to correct, and manufacturing a disagreement in order to have something to teach against would be its own dishonesty (DR-0100).

But the forward that matters is the second message in the thread, and it is **Darrell's own writing.** He summarised the four technologies in his own words, built his own table of what each is primarily *for*, wrote his own six-line practical guidance, compressed the whole subject into four lines for a product manager, and then named a live situation at his workplace. A lesson built only from the newsletter would have ignored the request.

## The judgment this subject needed, and the reason it is recorded

Identity, delegated authority and trust are **real Scripture ground** — not a stretch. The Word has a name put upon a people, a signet pressed into wax, a king's ring moved onto a servant's hand, a sealed letter no man may reverse, letters of commendation carried between assemblies, and a seal set by the Holy Spirit on a person. So the Word is taught **on its own terms first** and the technical material is the occasion.

The temptation in a subject this tidy is the cute analogy, and **a weak analogy is worse than none in this house.** So the lesson names three limits out loud rather than smoothing them, and the test file holds it to naming all three (`says out loud where the comparison with the Word STOPS, all three times`):

1. **A graven gold plate is not a cryptographic credential.** The high priest's plate (Exodus 28:36, 28:38) carried no secret, could not be tested by a stranger at a distance, and nothing about it was mathematical. What it genuinely is — the Word's doctrine of *borne* identity, a name you did not choose, worn where others read it, for an acceptance you could not earn — is more useful than calling it a token.
2. **Yahweh does not authenticate anybody.** There is no verification step in Him, because *verification is a remedy for not knowing* and He has no such lack: "I have called thee by thy name; thou art mine." (Isaiah 43:1) and "The Lord knoweth them that are his." (2 Timothy 2:19) — *knoweth*, not checks. That is not a put-down of the machinery. It is the machinery's correct dignity: it is a remedy for being strangers, which is exactly why Scripture is full of proof that has to travel.
3. **The seal of the Holy Spirit is not a bearer token.** "ye were sealed with that holy Spirit of promise" (Ephesians 1:13) is done *by* Him and is not held, copied, stolen, replayed or expired. Pressing it into service as an illustration of session management would be the strained parallel, so it is taught for what it is and the technical material is set beside it and left there.

## Where the parallel IS strong, said as plainly as the limits

Pharaoh's ring is a bearer credential in every meaningful sense: it was the signing key of a government, officials who had never met Joseph obeyed what he sealed, and the authority rode on the issuer rather than the holder (Genesis 41:41-42). And the sentence immediately after it guards the thing that matters most in any delegation — **"I am Pharaoh"** (Genesis 41:44). Real authority genuinely handed over, with the identity of the grantor intact. That is the difference between a delegated token and a stolen password, in four words, and it is precisely Darrell's own OAuth note: *on your behalf, without your password.* Esther 8:8 then states the force of such an artifact — written in the king's name, sealed with the king's ring, *may no man reverse* — and Esther 8:10 shows the transport (horses, mules, camels, dromedaries) being irrelevant to the trust, which is the article's own point that the format is secondary.

## The seam no protocol reaches, which is why this is worth a week

**Jezebel's letters passed every check the newsletter teaches.** "So she wrote letters in Ahab’s name, and sealed them with his seal, and sent the letters unto the elders and to the nobles that were in his city, dwelling with Naboth." (1 Kings 21:8) Signature genuine. Issuer the king himself, no impersonation. Audience addressed to exactly those elders. Validity window entirely current. Four for four — and the elders did it, "as it was written in the letters which she had sent unto them" (1 Kings 21:11), and Naboth was stoned for his own garden.

Stated plainly, under-claiming it being its own kind of lie (DR-0100 §1): **validation establishes WHO ISSUED a thing and can never establish that what it asks is righteous.** That is not a defect in anybody's protocol; it is the boundary of what a protocol is for, and a house that forgets the boundary ends up obeying a well-formed instruction with all the paperwork in order. Scripture answers a lie sent in Yahweh's name from above the seal rather than with a stronger seal (Jeremiah 29:21), which means the last line of defence in any structure of delegated authority was never cryptographic — it is a steward willing to read the order he has the power to execute and decline.

And the lesson's hinge: **being authenticated is not the same as being known.** The exorcists at Ephesus had the correct formula and met an identity check they could not pass — "Jesus I know, and Paul I know; but who are ye?" (Acts 19:15) — and the Lord Jesus gave the same verdict over real works correctly invoked in His name: "I never knew you" (Matthew 7:23). A bearer artifact works *precisely because* the gate need not know you; that is its efficiency and why systems scale. The Word's standard is the reverse, nothing issues it, and it is no criticism of the four technologies that they were never built to. Then John 5:43 puts the turn on it: a true credential refused, a self-issued one received.

Set against that, the Word's own shared trust is the letter of commendation (2 Corinthians 3:1; Romans 16:1-2; Acts 18:27; Nehemiah 2:7-9) — a traveller received on the standing of the senders, which is single sign-on with ink — and the Jerusalem letter adds the refinement that answers the forged letter six chapters earlier than anybody needs it: "We have sent therefore Judas and Silas, who shall also tell you the same things by mouth." (Acts 15:27) A second, independent channel. The same chapter also records authority claimed that was never granted, "to whom we gave no such commandment" (Acts 15:24), which is over-scope named in Scripture.

## What was measured, before a word was written

**The course's own vocabulary, counted in `sovereign-ai-class.js`:** `ident` **269**, `token` **75**, `seal` **61**, `delegat` **27**, `credential` **23**, `authoriz` **19**, `ambassador` **13**, `authenticat` **11**, `OAuth` **8**. The course talks about this constantly and anchors almost none of it.

**The neighbouring weeks were read and left alone:** sov11 the stolen reasoning trace (1 Kings 8:39; Revelation 5:5), sov19 the servant under authority (Matthew 8:9; Luke 17:10), sov31 whose errand an agent carries (1 Timothy 2:5; Matthew 6:24), sov44 the thief's own door, sov45 the second witness, sov46 the helper that must see everything. The lesson **names** weeks nineteen, thirty-one, forty-four, forty-five and forty-six instead of re-teaching them, and the test asserts both halves — that the four verses which would have duplicated sov19 and sov31 are absent, and that those weeks are named.

**The free ground, counted and not guessed at:** `signet` **0**, `SAML` **0**, `single sign` **0**, `letters of commendation` **0**; Numbers 6:27 **0**, Exodus 28:36 **0**, Genesis 41:42 **0**, 1 Kings 21:8 **0**, Acts 19:13-16 **0**, Matthew 7:22 **0**, John 5:43 **0**, Ephesians 1:13 **0**, 2 Corinthians 3:1-3 **0**, Acts 15:23-27 **0**, Philippians 2:9-11 **0** — anchored by no week of this course. (Esther 8:8 is quoted in sov25's prose and anchored by nobody.) The verses the course has worn out were deliberately **not** used as a spine: 1 Thessalonians 5:21 (13 anchors), Acts 17:11 (7), Deuteronomy 19:15 (7), 1 John 4:1 (6).

So the untaught seam is **IDENTITY, DELEGATED AUTHORITY AND WHO MAY TRUST THE PROOF**, and the spine is the name put upon a people + Pharaoh's ring + the king's sealed letter + the scoped commission + Jezebel's valid letters + "who are ye" + the letter of commendation + the seal of the Holy Spirit. **54 verses**, every one filled from the corpus on disk by the generator. Maximum verses shared with any other week of the course: **6** (the standing confession John 1:29 / John 3:16 / Hebrews 1:8 and the growth close Galatians 5:22 / Deuteronomy 6:7 / Hebrews 3:13), well under DR-1185's flag of ten.

## The band gates, measured rather than assumed

The first draft failed four checks of `fourBandGateFaults` and was rewritten until it passed all of them — which is the point of running the gate instead of assuming, given that sov46, sov47 and sov48 all ship with that suite red:

| | first draft | shipped | floor |
|---|---|---|---|
| child share of the adult teaching | 0.34 | **0.50** | 0.50 |
| youth share | 0.48 | **0.61** | 0.60 |
| teen share | 0.81 | **0.83** | 0.60 |
| senior share | 0.55 | **0.69** | 0.60 |
| ladder (child < youth < teen <= senior) | 1.7 / 5.8 / 7.9 / **5.4** — inverted | 1.5 / 5.9 / 6.7 / **9.1** — holds | — |
| band differentiation, worst pair | 0.12 | **0.07** | < 0.50 |
| lesson body vs its teen band | **0.611** | **0.399** | < 0.50 |

`fourBandGateFaults` now returns `[]`. The last row is the sov48 defect class: the first teen band was a paraphrase of the adult lesson, nothing in the house compares those two, and it was rewritten in its own register (problem-first, a delivery driver's fob, a notarised power of attorney) because this lesson's own test checks it.

All four bands carry the TALK ABOUT IT TOGETHER close in the lesson's own words, in all three directions, with the skill (ask, listen to the end, retell, teach one verse) and the rhythm (once today in one of Deuteronomy 6:7's four places; one friend this week). Growth is measured the Word's way: the fruit (Galatians 5:22), the occasions (Deuteronomy 6:7) and the days (Hebrews 3:13).

## Proven to catch

Four of the sixteen cases are demonstrated breaks, not assertions:

1. **An altered quotation.** "thou art mine." changed to "thou art ours." inside the quoted Isaiah 43:1 → `child: Isaiah 43:1 — But now thus saith the LORD that created thee…: expected false to be true`. Restored: 15/15 green.
2. **A straight apostrophe where the corpus has a curly one** (the sov47 defect). `Ahab’s` → `Ahab's` in one place → two cases fail, one of them naming the reference. The check also asserts that at least five pins really do carry `’`, so it cannot become theatre.
3. **A band that sends the reader nowhere while the pooled check stays green** (DR-0795). The test strips the teen band's friend line alone and asserts `hasAllThree(module)` is still `true` while `hasAllThreeEverywhere` is `false` and `placesMissingDirections` names `teen` as short of `friends`.
4. **A hole in the modules array.** sov48's splice left `},,` and put an `undefined` in the catalog; **this lesson's first splice produced the opposite break** — main's array ends `}\n];` with no trailing comma, so appending `block,` produced `}\n  {` and a rollup parse error at offset 3002026. `scripts/sov50-fill.mjs` now **measures the tail** instead of copying the earlier fill script's assumption, and handles both endings on `--rebuild` too (exercised: the rebuild path was used to ship the final text).

## Not claimed — what this house does NOT claim about it

Stated on the page, not only here (DR-0076 §8). Nobody read the published specifications — not the OAuth 2.0 framework document, not the OpenID Connect core document, not the SAML 2.0 standard. Nobody stood up a directory tenant or ran a real sign-in flow to confirm anything. The mechanics are carried **as reported** by that newsletter and as summarised by Darrell. The issue's sponsored segment (an Oracle advertisement about designing programming interfaces for A.I. work) is advertising, and the lesson rests not one sentence on it. **Mosaic**, in his note, is a system at his workplace that this page knows nothing about beyond his naming it, and nothing here is advice about it; his Entra ID line is carried as *his* working note and verified nowhere. One absence is reported too, because it is usually the opposite: neither the article nor his notes capitalised any name of the adversary, so there was no typographic conflict to carry through or correct.

The one claim this page makes about the house itself was checked against the repository rather than asserted: the PWA reaches the machine at home through a same-origin path (`app/functions/n8n/[[path]].js`) rather than an absolute URL, and the bearer value authorising that forwarding is synchronised by a workflow over the tailnet (`.github/workflows/announce-bearer-sync.yml`, beside `nas-rotate-bearer.yml`), masked and never printed.

## Decision

Ship sov50 as the fiftieth week of Sovereign A.I., built from **Darrell's own forwarded summary** with the newsletter named as the occasion; Word-first in ten movements; four authored bands passing the full house band suite; 54 verses filled from the corpus by a generator and pinned by a test with four demonstrated catches, plus the renderer-drops-nothing check this course would otherwise never have run; and the three limits of the comparison said out loud and held there by the gate.

**Perpetual improvement (DR-0075).** One thing found and deliberately not fixed here: `fourBandGateFaults` is red for sov46, sov47 and sov48 (shares under floor, and sov47's senior/teen ladder inverted), because `course-four-bands-group-a.test.js` holds only ten sovereign-ai lessons to that suite (`PARTIAL`). Widening that list is a course-wide authoring pass, not this lesson's work, and doing it inside this PR would mean rewriting three other builders' bands. **`re-review: 2026-11-24`** — measure the whole course against `fourBandGateFaults`, then add sovereign-ai weeks to `PARTIAL` in the order they can be brought to the floor.
