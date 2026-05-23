# Root Docs Coexistence Plan — Positions and Inquiry vs. Open Investigations

**Date:** 2026-05-23 · **Issued by:** Cowork → Darrell · **Purpose:** answer Open Question B from the Counseling handoff doc — what happens with the two near-namesake foundation docs?

---

## Recommendation (TL;DR)

**Keep both. Distinguish their registers. Cross-link them explicitly. Make Positions-and-Inquiry the senior doc; treat Open-Investigations as its lab-notebook companion.**

The two docs are not redundant — they're working at different epistemic registers on overlapping material. Positions-and-Inquiry is the *output register* (matured stated positions with scriptural basis and confidence levels). Open-Investigations is the *substrate register* (sparks preserved verbatim, layered structure that protects the seed from being treated as the verdict). Both serve real needs that the other cannot.

The required follow-up work is small: explicit cross-references in both directions, and a graduation marker on the Open-Investigations sections that have already matured into Positions.

**Confidence: high** that both should stay. **Moderate** on the specific cross-reference language proposed below — Darrell may want to tighten or restructure the framing.

---

## What each doc actually is — full comparison

| Aspect | `THE-ROOT-POSITIONS-AND-INQUIRY.md` (existing, 2026-05-17, 22.9KB) | `THE-ROOT-OPEN-INVESTIGATIONS.md` (new from PDF, ~17KB) |
|---|---|---|
| **Status header** | "IN-PROGRESS INQUIRY WITH STATED POSITIONS" — "not settled, finished doctrine — but neither is it a refusal to take positions" | "UNRATIFIED INVESTIGATION" — "captures theology that is actively being worked out — not settled doctrine" |
| **Method** | 4-layer per position: Our Position → Scriptural Basis → Confidence → Competing Views | 5-layer per investigation: Spark → Plumb Line → Faithful Inference → Open Questions → Multitude of Counsellors |
| **Posture** | Position-taking. Refuses false neutrality. Bereans as the explicit model. | Position-deferring. Holds the spark separately so it isn't prematurely promoted to verdict. |
| **What it preserves uniquely** | Confidence levels per claim. Competing views handled fairly with how-tightly-each-ties-to-text. The historical-cultural critique (Southern Baptist Convention founding, Williams/Diop/Obenga, secular scholarship on suppressed records). The "On the Seen and the Unseen" governing note (rejects materialist default). Explicit canon dependence — names `THE-CANON.md` as a forthcoming prerequisite for some claims. | **The architect's spark in raw, verbatim form** — the originating thought as seed, before it became conclusion. The Multitude-of-Counsellors layer (Heiser / Darby / Price named explicitly; the principle that "credentials are not the test, and dismissal is not the test"). |
| **Topics covered** | 3 stated positions: (1) higher-than-angels-through-suffering, (2) divine council + Genesis 6 sons-of-God reading, (3) fallen operate from unseen realm + Nephilim-spirits-as-demons question (canon-dependent). | 2 investigations: (1) suffering / two roads / destiny of redeemed humanity, (2) divine council + power asymmetry. |
| **Overlap** | Positions 1, 2, 3 mostly cover the same ground as Investigations 1 + 2 | Investigations 1 + 2 mostly cover the same ground as Positions 1, 2, 3 |

---

## The key insight

**Positions-and-Inquiry is the further-developed, more rigorous version. Open-Investigations preserves something the other doesn't have — the originating spark in the architect's own words.**

That asymmetry is meaningful. Positions-and-Inquiry holds the *matured* output that future docs should cite. Open-Investigations holds the *substrate* the matured output came from — preserved so that a future reader (or a future Darrell, two years from now) can see what the seed was vs. what it became.

This is methodologically valuable. A position stated cleanly can be cited; a position whose seed is also preserved can be *audited* — the working can be checked back to its origin. That's the same Berean discipline Positions-and-Inquiry already invokes, applied at one level deeper: not just "show your scriptural work," but also "show what the originating thought was, before the work was done."

---

## Option analysis

### Option A — Keep both, distinguish registers, cross-link (RECOMMENDED)

**What it looks like:**
- `THE-ROOT-POSITIONS-AND-INQUIRY.md` stays as the **senior doc**. It is the citable, position-taking version. Other foundation docs and task cards reference *this* one when they need to anchor on a position.
- `THE-ROOT-OPEN-INVESTIGATIONS.md` stays as the **lab-notebook companion**. It preserves the verbatim sparks, the layered work-in-public structure, and hosts *newer* sparks that haven't yet matured into stated positions.
- The two cross-reference each other explicitly. Each Open-Investigations section that has already graduated into a Positions-and-Inquiry stated position carries a "GRADUATED → see Position N in `THE-ROOT-POSITIONS-AND-INQUIRY.md`" marker. Each Positions-and-Inquiry position that originated in Open-Investigations carries a "Spark and full working preserved in `THE-ROOT-OPEN-INVESTIGATIONS.md` Investigation N" marker.
- Both docs are referenced from `THE-ROOT.md`'s "See also" footer (per the parallel reconciliation notes).
- Future workflow: new sparks land in Open-Investigations; when they mature, they graduate into Positions-and-Inquiry while leaving the spark + multitude-of-counsellors trail in Open-Investigations.

**Pros:**
- Preserves the unique value of each doc — the matured-output register *and* the spark-and-substrate register.
- Honors the documentation history — neither doc loses authored content.
- Future-proof: gives a clear home for new sparks (Open-Investigations) and a clear home for matured positions (Positions-and-Inquiry).
- The "graduation" mechanism mirrors the Positions-and-Inquiry doc's own promise: *"As positions here are tested, grounded, and confirmed, they may graduate into fully ratified Root documents."* This adds one prior step — investigations → positions → root — instead of collapsing the two intermediate stages.

**Cons:**
- Two documents to maintain on related material — more reading required for someone trying to understand the full picture on, e.g., Position 2 / Investigation 2 (the divine council).
- The graduation markers add light overhead — if a section in Open-Investigations changes after it graduated, the corresponding Positions-and-Inquiry section needs updating too. (Mitigation: the markers make this visible, not invisible.)

**My read on the cons:** they're real but small. The benefit of preserving the spark + multitude-of-counsellors substrate outweighs the maintenance overhead, especially because both docs already exist and the work of materializing them is done. The only marginal work is the cross-reference markers.

### Option B — Merge into Positions-and-Inquiry; archive Open-Investigations

**What it looks like:**
- For each of Open-Investigations' two Investigations, move its Spark and Multitude-of-Counsellors sections into the corresponding Position inside Positions-and-Inquiry as new subsections (e.g., "### The Spark Behind This Position" and "### The Multitude of Counsellors on This Position").
- Archive `THE-ROOT-OPEN-INVESTIGATIONS.md` (move to `docs/_archive/` per the project's archival pattern).
- Update `THE-ROOT.md`'s footer to reference only `THE-ROOT-POSITIONS-AND-INQUIRY.md`.
- Update the new `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md` to remove the reference to `THE-ROOT-OPEN-INVESTIGATIONS.md` (currently it references `THE-ROOT-POSITIONS-AND-INQUIRY.md` and that stays).

**Pros:**
- Consolidates everything on this material into one doc.
- Easier to maintain — one source of truth.
- The Worldview doc's existing references stay valid (it already cites `THE-ROOT-POSITIONS-AND-INQUIRY.md`).

**Cons:**
- **Loses the methodological distinction.** Positions-and-Inquiry's status header is "IN-PROGRESS INQUIRY WITH STATED POSITIONS." It explicitly refuses to host *un*matured material. Folding Open-Investigations' sparks in would change its character: the doc would now hold both matured positions *and* raw sparks, with the line between them less crisp.
- **Loses the obvious home for newer sparks.** If a new spark surfaces tomorrow on, say, "what does the cloud of witnesses see?" (Hebrews 12), there's no longer a place to capture it at spark-level. It would either (a) prematurely become a stated position in Positions-and-Inquiry, or (b) get lost as a chat-conversation note.
- **Loses the "Multitude of Counsellors" layer's distinctive purpose.** That layer in Open-Investigations is not just a list of who-said-what — it names the explicit discernment principle ("credentials are not the test, and dismissal is not the test") and applies it concretely (Heiser / Darby / Price). Positions-and-Inquiry already has the historical-cultural critique (SBC, Williams, Diop, Obenga), but the Multitude-of-Counsellors layer is a *different framing* — the discipline of weighing other voices on a per-claim basis. Folding it into Positions-and-Inquiry blurs this.
- Archiving loses author work that does not need to be lost.

### Option C — Rename one to signal the relationship (e.g., LAB-NOTES, WORKING-INQUIRY)

**What it looks like:**
- Rename `THE-ROOT-OPEN-INVESTIGATIONS.md` to something like `THE-ROOT-LAB-NOTES.md` or `THE-ROOT-WORKING-NOTES.md` to make the methodological-substrate role explicit in the filename.
- Otherwise same as Option A — keep both, cross-link, distinguish.

**Pros:**
- The filename itself signals the role — a future reader sees `THE-ROOT-LAB-NOTES.md` and immediately knows it's not the senior doc.
- Reduces the "near-namesake" confusion that prompted this whole question.

**Cons:**
- Loses the canonical PDF filename, which Darrell explicitly named in his upload instructions. The PDF was *titled* "THE ROOT — OPEN INVESTIGATIONS" — renaming is a small but real divergence from the source material.
- "Lab notes" or "working notes" undersells the document. The PDF's "Open Investigations" framing already captures the methodological register reasonably well; the layered structure does the rest of the work.
- Renaming this late in the night risks downstream broken references — the Worldview doc would need updating, and so would any other doc that cites Open-Investigations.

**My read:** Option C is plausible but adds friction. If Darrell strongly prefers a more disambiguating filename, this is the path; if the cross-reference framing in Option A is enough disambiguation, Option A is cleaner.

---

## What I recommend, concretely

**Option A. Specifically:**

1. **No file renames.** Both docs keep their current names.
2. **Add a `## Relationship to `THE-ROOT-POSITIONS-AND-INQUIRY.md`` section** near the top of `THE-ROOT-OPEN-INVESTIGATIONS.md`, naming the senior-companion structure: this is the lab-notebook substrate, Positions-and-Inquiry is the matured-output senior doc, sparks here graduate into stated positions there.
3. **Add a matching `## Relationship to `THE-ROOT-OPEN-INVESTIGATIONS.md`` section** near the top of `THE-ROOT-POSITIONS-AND-INQUIRY.md`, naming the inverse: the originating sparks for these positions are preserved in `THE-ROOT-OPEN-INVESTIGATIONS.md`.
4. **Add a graduation marker** to each of the two Investigations in Open-Investigations, naming the Position(s) in Positions-and-Inquiry they have graduated into:
   - Investigation 1 (suffering / two roads / destiny) → graduated into Position 1 in Positions-and-Inquiry.
   - Investigation 2 (divine council & power asymmetry) → graduated, but split: the divine-council piece graduated into Position 2; the power-asymmetry / Nephilim / canon-dependent piece graduated into Position 3.
5. **Update `THE-ROOT.md`'s "See also" footer** to reference both docs (per the parallel reconciliation notes).
6. **Update `THE-HOLY-SPIRIT-INTEGRATION-WORLDVIEW.md`** to reference both docs in its "See also" footer (it currently only mentions `THE-ROOT-POSITIONS-AND-INQUIRY.md`).
7. **Future workflow doc:** capture the spark → position → root graduation pipeline in a small process note (could be a one-paragraph addition to `THE-ROOT.md` or `THE-WAY.md`, or a new tiny doc), so the working pattern is explicit and not just folklore.

All of this is a single follow-up card. The actual edits are small (header sections + graduation markers + footer updates); the analysis above is the load-bearing work.

---

## What I'd want Darrell to verify before any of this is implemented

- That the **register distinction** I'm naming (Positions-and-Inquiry = output register; Open-Investigations = substrate register) matches how he'd describe the relationship. If he sees them as functioning differently from how I've characterized them, the whole recommendation needs rethinking.
- That the **graduation mechanism** is the right framing. It assumes sparks → positions is a one-way flow. If Darrell expects positions in Positions-and-Inquiry to ever be *demoted* back into sparks for fresh investigation (e.g., if a position gets challenged and needs to be reopened), that's a feature the graduation framing doesn't model and would need adding.
- That keeping both is genuinely worth the maintenance overhead. The cleanest argument for keeping both is that the spark + multitude-of-counsellors substrate has real audit value that consolidation would lose; if Darrell doesn't see that as load-bearing, Option B (merge) is the simpler path.

---

## Quick sanity check — does either doc contradict the other?

I read both in full. **No substantive contradictions.** The two docs cover overlapping material with consistent claims:

- Both treat the divine council as real (Psalm 82) and the Genesis 6 "sons of God" as divine beings.
- Both hold redeemed humanity's exaltation through suffering as the path (not around it).
- Both reject "replacement" framing in favor of "higher order."
- Both name the symmetry-of-judgment guardrail.
- Both name the discernment principle that credentials and dismissal are not the test.
- Both flag the dimensional language as metaphor, not literal cosmology.
- Both flag the precise mechanism of how-the-fallen-operate as held loosely.

The places where Positions-and-Inquiry says **more** than Open-Investigations:
- The "On the Seen and the Unseen" governing note (rejects materialist default explicitly).
- The Southern Baptist Convention / slavery historical critique with the 1995 apology date.
- The Williams / Diop / Obenga / UNESCO secular-scholarship corroboration.
- The explicit canon dependence — `THE-CANON.md` named as forthcoming.
- The Nephilim-spirits-as-demons claim explicitly named as canon-dependent (from 1 Enoch).
- The Position 3 framing (fallen operate from unseen realm) as a distinct position separate from Position 2 (divine council).

The places where Open-Investigations says **more** than Positions-and-Inquiry:
- The architect's spark in verbatim form, preserved for both investigations.
- The Multitude of Counsellors layer with Heiser / Darby / Price named.
- The discipline of *why-this-stays-unratified* as its own section.

These are complementary, not conflicting. The "more" on each side does different methodological work.

---

*Cross-references:* [`2026-05-23-ROOT-md-reconciliation-notes.md`](./2026-05-23-ROOT-md-reconciliation-notes.md) (Open Question A — `THE-ROOT.md` body and footer), [`2026-05-23-handoff-counseling-card.md`](./2026-05-23-handoff-counseling-card.md) (the handoff that raised these questions).
