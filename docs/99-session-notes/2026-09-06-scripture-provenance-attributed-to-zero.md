# 2026-09-06 — Scripture provenance: "attributed" and "kjv-drift" both paid down to zero

**Layer 4 working note.** Follows the same-day split of `unverified: 155` into `kjv-drift: 41` + `attributed: 82` (Darrell: *"Agreed... attribution not unverified!!!!!!!!"*, *"sure do it.... why do you need me?!!!"*, *"we want kjv and esv!!!!"*, *"we want users competent about the meaning of the message in any language... we want understanding!!!!!"*).

## Where it ended (measured, `node scripts/scripture-provenance-audit.mjs`)

| class | before | after | what it is |
|---|---|---|---|
| `kjv` | 11,209 | 11,313 | verbatim against the cited verse in the in-repo KJV |
| `kjv-case` | 348 | 346 | identical but for case; each needs an eye (unchanged scope, re-review 2026-09-12) |
| `kjv-drift` | 41 | **0** | OUR drift from the KJV — paid down |
| `attributed` | 82 | **0** | non-KJV words with NO declaration — paid down |
| `esv-labelled` | (unseen) | 13 | names its edition at the citation: `"..." (James 1:4, ESV)` |
| `paraphrase-declared` | (unseen) | 15 | our own words that SAY so: `(paraphrasing Ref)` / `(cf. Ref)` / `(Ref, paraphrased)` |

## What the 41 "ours" really were — the instrument first

29 of the 41 `kjv-drift` rows were **the audit's own defect**, not the lessons'. A JSON story body escapes its quotation marks as `\"`; the audit unescaped `\'` but not `\"`, so a verbatim verse arrived with a trailing backslash and was called drift. Three more instrument gaps found the same way: a literal `’` in the source is an apostrophe; a `//`-wrapped comment line is one sentence; and a citation carrying a qualifier — `(Ref, ESV)`, `(paraphrasing Ref)` — fell out of the regex entirely, so the four ESV-labelled quotations the file already had were never audited at all. Every one is now a proven-to-catch test in `scripture-provenance.test.js` ("the instrument sees what the file actually contains").

**Lesson (DR-0076 §3):** measure the instrument before the debt. The 155 was never 155.

## What the 82 "attributed" really were — authored, one by one

Read against the cited KJV, the 82 were three different things, and only one of them was ESV:

1. **ESV-worded, in the teleios lesson (L?, `ll` line 122–176)** — *perfect/mature* is the lesson's whole point, so the ESV rendering is load-bearing and stays. 13 citations now carry `, ESV`. Phil 3:12 is written out as the ESV has it (the old `not that I am already perfect... but I press on` stitched two clauses); `"perfected in love"` is 1 John 4:**18**, not 4:17.
2. **Our elisions and adaptations of the KJV** — `"walked in the garden"` (KJV *walking*), `"chosen in him"` (KJV *chosen us in him*), `"came that they might have life"` (KJV *I am come that*), `"God hath made of one blood all nations"` (KJV has no *God*: *hath made of one blood all nations of men*), `"seven times worse"`, `"for the hardness of your hearts"` (KJV *because of*), `"cast all your care"` (KJV *Casting all your care upon him*), `"strong holds; casting down"` (KJV closes a parenthesis at the verse break — now `strong holds... Casting down`), and ~40 more. Each restored to the verse's own words, ellipsis at a verse break, verified by the audit.
3. **Our own words wearing a citation** — child-level prayers (`"I cast this care on You, for You care for me" (1 Peter 5:7)`), confessions (`"God gave me power, love, and a sound mind"`), and summaries (`"the ladder is a Person" (John 1:51)`, `"The greatest servant is the king"`). CLAUDE.md: *"Do not paraphrase scripture without explicitly noting it as a paraphrase."* These are now declared — `(paraphrasing 1 Peter 5:7)` for a restatement, `(cf. John 1:51)` for our own line pointing at a verse. The words are unchanged; the claim is honest.

Two miscitations surfaced and fixed: `"with meekness and fear"` was cited to Proverbs 27:17 (it is 1 Peter 3:15); and my own bulk replacement of *Even as the Son of man* → *For even the Son of man* was right for Mark 10:45 and WRONG for Matthew 20:28 — the gate caught it on the re-measure and it was restored. That is the gate doing its job against me, which is the point.

## The honest limit (DR-0076 §8)

ESV text **cannot be verified from this sandbox**: every ESV source (BibleGateway, esv.org, bolls.life, bible-api) is blocked by the egress proxy, and the repo carries no ESV corpus by design (Crossway licence). The 13 `esv-labelled` quotations are labelled from the author's knowledge of the ESV and are consistent with the four the file already carried; they are **attributed, not verified**. The audit records them as their own class so this stays visible.

## Files

- `scripts/scripture-provenance-audit.mjs` — `\"`, `\u` and `//`-wrap normalisation; citation qualifiers; `esv-labelled` / `paraphrase-declared`; `openRefs` (v2 artifact).
- `app/src/__tests__/scripture-provenance.test.js` — ceilings 0/0/346; five instrument proofs; declared classes asserted as seen.
- `app/src/lib/living-lessons-class.js` — ~85 quotation edits, all listed in the commit.
- `app/src/lib/scripture-provenance.json` — refreshed.

## Open

- 346 `kjv-case` — re-review 2026-09-12 (each needs an eye; a mid-quote emphasis capital is not an opening letter).
- A runner-side ESV verification (GitHub runner has egress the sandbox does not) would turn *labelled* into *verified*; it needs an `ESV_API_KEY` (free, api.esv.org) — a value only Darrell holds. Tracked here; not built this session.
