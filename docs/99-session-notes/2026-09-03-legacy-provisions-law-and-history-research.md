# Legacy Provisions — the law as it stands, and the history that shaped it

**Date:** 2026-09-03
**Asked by Darrell:** *"comprehensive understanding and research outside of the current understanding so we can be collectively aware — also research current state laws and suits to confirm the way we should be building our systems to support our users and families"* and *"historical events that shaped the systems."*
**Feeds:** `app/src/lib/family-trust.js` (the provision records, the review questions, the production policy), `app/src/lib/legacy-provisions-course.js` (the teaching), DR-0321, DR-0323.

---

## 0. Provenance and its limits — read this before trusting a line below

**What I could do:** web search, which returned substantive summaries of law-firm articles, law-school casebooks, law-review PDFs, bar-association pieces, and government/agency pages.

**What I could NOT do:** open primary sources. Every direct fetch in this environment — `law.justia.com`, `uniformlaws.org`, `revisor.mn.gov`, `cobar.org`, `codes.findlaw.com`, even Wikipedia — was refused by the egress proxy (`403 CONNECT tunnel failed`). **I did not read the statutory text of UTC § 503 or § 504, or any state statute, with my own eyes.**

So, applying DR-0076 §8 honestly:

- Everything below is **secondary**: search-result summaries of commentary about the law.
- **Nothing here may be presented in the app as a verbatim statutory quotation**, because none of it was verified against primary text. The app's language stays at the level of "generally," "in most states," "commonly" — which is exactly where a family operating system belongs anyway.
- Case names, dates and citations are recorded as the sources reported them. Where a number varies between sources (the DAPT state count did), **both readings are recorded** rather than one being picked to look tidy.
- This is legal **information**, gathered to shape a product. It is not legal advice, and no line of it substitutes for a licensed estate attorney in the governing state.

---

## 1. The three provisions, checked against the law

### 1.1 The spendthrift provision — what actually holds

**Universally recognized, but not uniformly.** Spendthrift provisions are recognized in all 50 states, by statute, by case law, or both; roughly 36 states and DC have enacted a version of the **Uniform Trust Code**, with about thirty adopting its spendthrift rules. **California has not enacted the UTC; New York has not fully adopted it** — both recognize spendthrift protection through their own law instead. So "spendthrift" is a shared word over materially different machinery.

**The exception creditors (UTC § 503).** Reported categories whose claims survive a spendthrift restriction:

- a **child, spouse, or former spouse** with a judgment or court order for support or maintenance;
- a **judgment creditor who provided services protecting the beneficiary's interest** in the trust;
- claims of **a state or the United States**, to the extent a statute so provides.

The stated justification is worth teaching, not just the rule: support creditors *cannot protect themselves* from the debtor's irresponsibility, and a beneficiary should not enjoy trust benefits while neglecting those dependent on them.

**The strengthening fact we had not stated (UTC § 504).** A creditor — **including an exception creditor** — generally **cannot compel a discretionary distribution the trustee has authority to withhold.** This is arguably the most important structural fact about the whole design, and our surface did not say it: the protection lives less in the word "spendthrift" than in **discretion**. It is why "distributions are discretionary rather than mandatory" is a real review question and not a formality.

**Concrete state variation, which "state law varies" was hiding.** Two examples that make the abstraction real:

- **California, Prob. Code § 15306.5** — on a judgment creditor's petition a court may order the trustee to satisfy a judgment out of payments due the beneficiary, but **not more than 25 percent** of the payment that would otherwise be made.
- **New York, EPTL § 7-3.4** — a creditor may reach trust income **in excess of what is necessary for the beneficiary's education and support**.

Neither is "protected" or "unprotected." Both are *partial*, on terms set by that state.

**And the limit everyone forgets:** once a distribution is actually **received**, it is the beneficiary's own property, exposed like anything else they own. We already say this. It stays.

### 1.2 Self-settled trusts — the biggest single limit

Roughly **17 states** permit self-settled asset-protection trusts (one source listed Alaska, Delaware, Hawaii, Michigan, Mississippi, Missouri, Nevada, New Hampshire, Ohio, Oklahoma, Rhode Island, South Dakota, Tennessee, Utah, Virginia, West Virginia, Wyoming; another put the number "about 19"). **The count is contested between sources — recorded as contested rather than resolved.**

The sharper point is that siting a trust in a DAPT state does **not** settle the question:

- **In re Huber** (493 B.R. 798) — an Alaska DAPT did not hold.
- **Toni 1 Trust v. Wacker** (Alaska, 2018) — **one state cannot limit the jurisdiction of another state's courts.** A creditor with a judgment in a non-DAPT state can argue the judgment state's law governs, and courts have accepted that **where the settlor lives outside the DAPT state and the trust is the only connection to it.**

**Design consequence:** a review question about "is it third-party funded?" is necessary but not sufficient. **Where the family actually lives, relative to where the trust is sited, is its own question** — and our review didn't ask it. It does now.

### 1.3 Divorce — why "certain divorce situations" is the honest phrase

- **Pfannenstiehl v. Pfannenstiehl** (Mass. SJC, 2016) — the SJC **vacated** the award dividing a husband's interest in a discretionary spendthrift trust: the interest was **so speculative as to be a mere expectancy**, not assignable to the marital estate. Interests in discretionary trusts are generally too remote to include, because the beneficiary has no present enforceable right and **cannot compel distributions**.
- **Ferri v. Powell-Ferri** (Mass. SJC / Conn., 2017) — trustees **decanted** the bulk of a 1983 trust into a 2011 trust during a pending divorce, without informing or getting consent from the beneficiary. The trial court had held the 1983 trust to be marital property, but the 2011 trust was a spendthrift trust and not marital property; the SJC held the decanting was permitted, putting virtually all the assets beyond the divorce court's reach.

**Design consequence:** the mechanism that protects in divorce is the same one § 504 identifies — **discretion**, and the absence of an enforceable present right. Our course says "in certain divorce situations"; that phrasing survives contact with the cases, and can now say *why*.

### 1.4 Forced income production — the provision most likely to be drafted badly

The practitioner literature is blunt about the failure mode, and it is exactly the failure our policy was designed against:

> It is uncertain whether financial incentives work as intended… if the standard is "earn a dollar, get a dollar," what if the beneficiary becomes disabled? What if the beneficiary becomes a stay-at-home parent, or does volunteer work for a charity?

Also named: **enforcement problems** (how does a trustee verify a substance-abuse condition?) and rigid standards leaving trustees no room for the unforeseen.

**The name for what we built.** The literature's recommended alternative has a term of art we were not using:

> Rather than imposing a complex, rigid set of rules… a **principle trust** guides the trustee's decisions by setting forth the **principles and values** you hope to encourage and providing the trustee with **discretion** to evaluate each heir case by case.

That is precisely our design — a written constitution of principles plus a weighed, non-mechanical production policy with a stated exemption path. **We should call it what it is.** Naming it correctly matters practically: a *principle* trust preserves the trustee discretion that § 504 and *Pfannenstiehl* both show is where the protection actually lives, while a mechanical formula ("earn a dollar, get a dollar") can create the enforceable, non-discretionary right that weakens both.

**Conditions and public policy.** Conditional inheritances are broadly enforceable, with limits:

- **Shapira v. Union National Bank** (Ohio, 1974) — a condition that a son marry within a faith, within seven years, was **upheld**: a private testator is not a state actor, and the intent read as encouragement rather than punishment.
- **In re Estate of Feinberg** (Ill., 2009) — religious conditions **do not violate public policy** so long as they do not exert control over *future* conduct; the clause operated only to determine eligibility at death, distinguishing cases that disrupted existing marriages or incentivized divorce.

**Design consequence:** the boundary is not "religion vs. secular." It is **eligibility at a moment vs. ongoing control over how someone lives** — and our production requirement sits on the safer side only if it stays weighed and exemptible rather than a lever pulled on someone's daily life.

### 1.5 The family constitution — precatory, and that is the point

Documents of this kind are **letters of wishes**, and the literature sorts them three ways:

1. **legally binding** — which, the sources note, are *not really letters of wishes at all*; they are trust documents that delineate the trustee's powers;
2. **legally significant** — must be *taken into account*, need not be followed;
3. **morally binding** — entirely up to the trustee.

Trustees are **not legally bound** by a letter of wishes, but it is guidance they must consider, and **in practice it is usually followed**. A memorandum not incorporated by reference is treated as **precatory** — an expression of desire, not legally binding — and incorporation by reference generally requires the document to **exist at the time the instrument is executed**.

**Design consequence, and it cuts both ways.** Our provision record says the trust "references the constitution as an incorporated statement of the settlors' intent" and that the instrument governs on conflict. That is right. But we should be sharper that the constitution's *power is moral and interpretive*, that a document intended to be amendable **should not be incorporated as a binding term** (or amending it silently amends the trust), and that its practical force comes from being **read, attested, and taught** — which is precisely what the app operates.

### 1.6 The wall against the beneficiaries themselves — Claflin

We only ever described the wall as facing *outward* at creditors. It faces inward too:

**Claflin v. Claflin** (Mass., 1889) — the American rule: **a trust cannot be modified or terminated, even if every beneficiary agrees, if that would defeat a material purpose of the settlor.** Spendthrift, support and discretionary provisions are recognized material purposes. This diverges sharply from the English rule of **Saunders v Vautier**, under which adult beneficiaries under no disability can jointly demand the property and end the trust.

**Design consequence:** "what if the kids all agree to break it?" has an answer, and it is a strong one — but only if the instrument **states its material purposes**. That is a review question we did not have.

### 1.7 One current item that touches every family entity

**Corporate Transparency Act / FinCEN beneficial-ownership reporting.** On 2025-03-21 FinCEN announced an interim final rule removing the BOI reporting requirement for U.S. companies and U.S. persons; the definition of "reporting company" was narrowed to entities formed under foreign law and registered to do business in the U.S. **A final rule effective 2026-08-14 made the removal permanent for U.S. companies and U.S. persons.** The Eleventh Circuit separately upheld the CTA's constitutionality. **State-level rules still apply** (the sources flag this explicitly).

**Design consequence:** any guidance in this platform must not tell a family they owe a federal BOI filing they no longer owe — and must not tell them state filings vanished. Neither claim appears in what we shipped; this is recorded so it stays that way.

---

## 2. The history that shaped the systems

Darrell asked for the events, not a timeline for its own sake. Each of these is *why a provision exists*.

**Before the common law — Yahweh legislated the wall first.** Leviticus 25:23 forbids the permanent sale of the land — *"The land shall not be sold for ever: for the land is mine"* — and Numbers 36:7 forbids an inheritance moving from tribe to tribe. The jubilee (Leviticus 25:10) returns each man to his possession. **A structure preventing one generation from permanently alienating a family's inheritance is not a modern lawyer's invention; it is the older pattern, and the modern devices are a partial, secular recovery of it.** This is the frame the platform teaches under, and it is chronologically prior to everything below.

**Roman and Islamic antecedents.** The Roman **fideicommissum** — *entrusting an object to the good faith of the recipient, for the benefit of another* — and the Islamic **waqf** are the recognized analogues.

**The Crusades (11th–12th c.) — the trust's origin story.** Landowners leaving to fight transferred title to someone they trusted so feudal services could continue. **Many who returned found the trusted holder refused to give the land back.** The Chancellor's equitable jurisdiction gave effect to the arrangement — the "use." *The entire institution begins with a betrayal of trust that the law had to answer.*

**The Statute of Uses (1535).** Henry VIII pressured Parliament to abolish uses by "executing" them, aimed at tax avoidance by the Church and at feudal tenants escaping fees owed the king. **Lawyers found the holes within a generation:** courts held the statute did not apply where the holder had *active duties* — and those active holders came to be called **trustees** of a **trust**. The modern trust exists in the shape a tax statute pushed it into.

**Nichols v. Eaton, 91 U.S. 716 (1875).** The U.S. Supreme Court recognized the legitimacy of the spendthrift trust, paving the way for its acceptance as a means of protecting beneficiaries **from the meritorious claims of their creditors**.

**Broadway National Bank v. Adams, 133 Mass. 170 (1882).** Massachusetts upheld a spendthrift clause barring creditors from reaching income before payment to the beneficiary.

**John Chipman Gray's dissent from the whole idea.** The era's leading trusts scholar objected vehemently, exalting *"the duty of keeping one's promises and paying one's debts,"* and arguing spendthrift trusts **perpetuate a privileged class**. He lost, and conceded it in 1895: *"State after State has given its adhesion to the new doctrine."* **We should teach this objection rather than hide it** — a family using this tool should know the strongest argument against it, and answer it with how they actually live (which is what the constitution and the production requirement are for).

**Claflin v. Claflin (Mass., 1889).** A father staged a son's inheritance at 21, 25 and 30. The court held the delay was a **material purpose** — aimed at preventing financial mismanagement — so the son could not accelerate it. The American rule on modification is named for this case.

**1986 — the Generation-Skipping Transfer tax.** Property could no longer pass in trust from generation to generation untaxed. Scholars generally credit the GST tax with **starting the movement to abolish the Rule Against Perpetuities**, to gain advantage for long-duration trusts.

**The perpetuities race.** **South Dakota abolished the Rule in 1983** — first in the nation, before the GST tax. Three states had abolished it when Congress acted in 1986, but perpetual trusts were not yet common; **after 1986 the state-by-state repeal began**, and over half the legislatures have abolished or greatly limited the Rule. Some states allow unlimited duration; others set very long terms such as 1,000 years.

**1997 — Alaska, then Delaware.** Alaska passed the first domestic asset-protection trust statute, **explicitly to compete with offshore jurisdictions**; Delaware followed the same year with the Qualified Dispositions in Trust Act. Both drew on **Cook Islands and Isle of Man** law, to keep assets inside state borders. One account traces the idea to a fishing trip.

**2013–2018 — the limits of that race.** *In re Huber* and *Toni 1 Trust v. Wacker* established that **a DAPT state's statute cannot bind another state's courts**, which is why residence-versus-siting is now a real question and not a technicality.

**The through-line worth teaching.** Every one of these is a contest over the same question: **how far may one generation reach forward to bind the use of what it hands on?** The Crusader wanted his land back. Henry VIII wanted his fees. Gray wanted debts paid. Claflin's father wanted a son formed before he was funded. The states wanted the trust business. **Our answer is not "as far as possible" — it is Galatians 4:1-2: as far as the season requires, and the father appoints the time it ends.**

---

## 3. What this changes in the product

| Finding | Change |
|---|---|
| UTC § 504 — an exception creditor still cannot compel a discretionary distribution | Add to the spendthrift provision record as a **strength**, and keep "discretionary, not mandatory" as a first-class review item |
| Claflin material-purpose doctrine | **New review item**: does the instrument state its material purposes? New teaching: the wall faces inward too |
| Huber / Toni 1 Trust — siting vs. residence | **New review item**: does the family's residence state recognize the protection the siting state promises? |
| "Principle trust" is the term of art for what we built | Name it in the provision record and the course; explain why mechanical formulas weaken the discretion that protects |
| CA § 15306.5 (25%), NY EPTL § 7-3.4 (income above education/support) | Replace abstract "state law varies" with **named, concrete examples** |
| Shapira / Feinberg — eligibility vs. ongoing control | State the real public-policy boundary in the provision's limits |
| Letters of wishes are precatory; incorporation freezes the document | Sharpen the constitution record: **moral and interpretive force**, and do not incorporate an amendable document as a binding term |
| CTA BOI permanently removed for U.S. companies/persons (final rule effective 2026-08-14); state rules still apply | Recorded so no surface ever tells a family to make a federal filing they do not owe |
| Every source is secondary; primary text unreachable | The app quotes **no statute verbatim**; language stays at "generally / in most states" |

---

## 4. Sources

All accessed 2026-09-03 via search-result summaries; **none opened directly** (egress blocked).

- [Uniform Trust Code Committee, Article 5 study materials (Colorado Bar)](https://www.cobar.org/Portals/COBAR/repository/sections/TE/UTC/StudyPart5_Feb2019.pdf)
- [Spendthrift Trust Protection by State: Exception Creditors and Key Differences — Alper Law](https://www.alperlaw.com/asset-protection/spendthrift-trust/)
- [Are Trust Funds Safe From Claims For Alimony or Child Support? State Laws Vary Widely — Nelson & Nelson](https://estatetaxlawyers.com/are-trust-funds-safe-from-claims-for-alimony-or-child-support-state-laws-vary-widely/)
- [Spendthrift Trusts and Creditors — The Law of Trusts (CALI)](https://lewislawoftrusts.lawbooks.cali.org/chapter/spendthrift-trusts-and-creditors/)
- [Pfannenstiehl v. Pfannenstiehl (Mass. SJC 2016) — Justia](https://law.justia.com/cases/massachusetts/supreme-court/2016/sjc-12031.html)
- [Trusts & Divorce: The Supreme Judicial Court Provides Clarity — Fletcher Tilton](https://www.fletchertilton.com/trusts-divorce-the-supreme-judicial-court-provides-clarity/)
- [Ferri v. Powell-Ferri (2017) — FindLaw](https://caselaw.findlaw.com/court/spr-jud-crt-mas-suf/1853893.html)
- [Ferri v. Powell-Ferri: Expansion of Common Law "Trust Decanting" — Boston Bar Association](https://bostonbar.org/journal/ferri-v-powell-ferri-expansion-of-common-law-trust-decanting-in-massachusetts/)
- [Best Asset Protection Trust States — DAPT Rankings — Alper Law](https://www.alperlaw.com/asset-protection/best-states-for-asset-protection/)
- [Domestic Asset Protection Trust Risks in 2026 — Blake Harris Law](https://blakeharrislaw.com/blog/domestic-asset-protection-trusts-risks-2026)
- [Twenty Years of Domestic Asset Protection Trusts in the United States — ACTEC Foundation](https://actecfoundation.org/podcasts/domestic-asset-protection-trusts/)
- [Alaska on the Asset Protection Trust Map — Duke (Alaska Law Review)](https://scholarship.law.duke.edu/cgi/viewcontent.cgi?article=1177&context=alr)
- [Shapira v. Union National Bank — case brief](https://www.studicata.com/case-briefs/case/shapira-v-union-national-bank)
- [In re Estate of Feinberg — case brief](https://www.studicata.com/case-briefs/case/in-re-estate-of-feinberg)
- [The Puzzling Case of Max Feinberg — UIC Law Review](https://repository.law.uic.edu/cgi/viewcontent.cgi?article=1073&context=lawreview)
- [Incentive Trusts — Bessemer Trust](https://www.bessemertrust.com/insights-and-education/incentive-trusts)
- [Structuring trust distributions: Balancing control and flexibility — Plante Moran](https://www.plantemoran.com/explore-our-thinking/insight/2025/10/structuring-trust-distributions)
- [But What's an Ascertainable Standard? Clarifying HEMS Distribution Standards](https://www.trusteealliance.com/wp-content/uploads/Paper-HEMS-and-Fiduciary-Duties-2021-ITA-Conference.pdf)
- [Letters of wishes and their use in discretionary trusts — Kennedys](https://www.kennedyslaw.com/en/thought-leadership/article/2023/your-wish-is-not-my-command-letters-of-wishes-and-their-use-in-discretionary-trusts-part-1/)
- [Uniform Trust Code — states adopting (Farr Law Firm)](https://www.farrlawfirm.com/resources/list-of-states-that-have-adopted-the-uniform-trust-code)
- [California Probate Code § 15306.5 — FindLaw](https://codes.findlaw.com/ca/probate-code/prob-sect-15306-5/)
- [New York EPTL § 7-3.4 — FindLaw](https://codes.findlaw.com/ny/estates-powers-and-trusts-law/ept-sect-7-3-4/)
- [Anti Trusts: Reforming an Excessively Flexible Legal Tool — Vermont Law Review (Kades)](https://lawreview.vermontlaw.edu/wp-content/uploads/2023/06/Vol.-47-No.-3-04_Kades_Final.pdf)
- [The Trustee and the Spendthrift — Gonzaga Law Review](https://gonzaga-law-review.scholasticahq.com/api/v1/articles/10149-the-trustee-and-the-spendthrift-the-argument-against-small-trust-termination.pdf)
- [Dynasty Trusts — Connecticut General Assembly report](https://www.cga.ct.gov/2010/rpt/2010-R-0250.htm)
- [South Dakota Dynasty Trusts 101 — Robins Kaplan](https://www.robinskaplan.com/newsroom/insights/trust-and-estate-law-south-dakota-dynasty-trusts-101)
- [Claflin doctrine](https://en.wikipedia.org/wiki/Claflin_doctrine)
- [The Origins of the Modern English Trust Revisited — Tulane Law Review](https://www.tulanelawreview.org/pub/volume70/issue4/the-origins-of-the-modern-english-trust-revisited)
- [Statute of Uses](https://en.wikipedia.org/wiki/Statute_of_Uses)
- [Fideicommissum](https://en.wikipedia.org/wiki/Fideicommissum)
- [FinCEN — Beneficial Ownership Information Reporting](https://www.fincen.gov/boi)
- [Treasury — FinCEN Permanently Ends BOI Reporting for Millions of Small Business Owners](https://home.treasury.gov/news/press-releases/sb0603)
- [Latest CTA Guidance: Eleventh Circuit Affirms Constitutionality; Domestic Exemption in Place — Procopio](https://www.procopio.com/resource/latest-cta-update)
