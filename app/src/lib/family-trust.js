// =============================================================================
// family-trust — the LEGACY PROVISIONS system (the business system, not a lesson)
// =============================================================================
// Darrell 2026-09-02 named three provisions he made sure to include in the family
// trust, and asked for them as a WORKING SYSTEM in the app — prepopulated for our
// family, teaching our children, and adoptable by any other family here:
//
//   1. THE FAMILY CONSTITUTION the trust POINTS AT — a private document holding
//      our values, mission, standards and expectations around wealth, business,
//      investing and legacy. "If you pass down money without passing down
//      principles, there's a good chance the wealth disappears by the second or
//      even third generation."
//   2. THE SPENDTHRIFT PROVISION — the wall. The threat to generational wealth
//      is often not taxes; it is lawsuits, creditors, a bad business decision,
//      divorce, or the wrong marriage. Because the assets remain owned by the
//      TRUST and not by the beneficiary individually, the provision helps keep
//      them out of a beneficiary's creditors' reach and, in certain divorce
//      situations, out of the divisible marital estate.
//   3. FORCED INCOME PRODUCTION — beneficiaries do not merely take
//      distributions; they learn to produce, build, invest and contribute value
//      back into the trust.
//
// WHAT THIS MODULE IS. Pure data + pure functions. No React, no IO, no network.
// The AUTHORED half (the constitution articles, the provision records, the
// production policy) is version-controlled content — the 0052-recipes / Road-to-
// 150 template precedent, so the canonical family document can never be lost and
// ships to every device on deploy. The COMPUTED half reads a family's real
// LEDGER ENTRIES (contributions, distributions, attestations, exemptions) and
// reports standing.
//
// THE HONESTY RULES THIS FILE ENFORCES (DR-0076, and they are gated in
// family-trust.test.js by feeding the failing case and requiring the failure):
//   • An empty ledger reports 'no-record'. It NEVER reports zero produced, and
//     it never reports a passing standing. Absent is not zero.
//   • A check whose inputs are missing reports 'unknown', never 'pass'.
//   • A distribution review NEVER returns 'clear' on unknown — unknown holds
//     for a human. The gate fails safe toward the governor, not toward the money.
//   • A spendthrift item nobody has answered reads 'unreviewed', never
//     'protected'. Assumed protection is the exact lie this provision cannot
//     afford.
//
// NOT LEGAL ADVICE. Trust law is state-specific; the limits are carried in the
// data (TRUST_PROVISIONS[].limits) so every surface renders them with the
// provision instead of burying them. A licensed estate attorney in your own
// state drafts and executes the instrument.
//
// SCRIPTURE: every quoted fragment below is VERBATIM from the repository's
// public-domain KJV (app/public/bible/kjv/*.json), re-pinned in the test so an
// edit cannot drift it. Quotations keep "God" / "the LORD" exactly as written
// (DR-0076 bright line); our own authored voice says Yahweh.
// =============================================================================

// ---------------------------------------------------------------------------
// 1. THE FAMILY CONSTITUTION — prepopulated for the Poe family.
// ---------------------------------------------------------------------------
// A private document. It is not the trust and is not filed anywhere; the trust
// REFERENCES it, so the instrument moves assets while this moves the thinking.
// Another family adopts it by taking the shape and replacing every statement
// with their own convictions (adoptConstitution below) — the articles are ours,
// the FORM is what is being handed forward.
export const FAMILY_CONSTITUTION = {
  family: 'The Poe Family',
  subtitle: 'The principles that travel with the money',
  preamble:
    'We are stewards, not owners. What this family holds was entrusted to us by Yahweh for His purposes and for the generations after us, and it is handed forward with the way of thinking that produced it — because money handed down without principles handed down with it does not survive to the grandchildren. This document is referenced by our trust. It binds our conduct, informs our trustees, and is taught to every heir before they are handed anything.',
  articles: [
    {
      id: 'art1-soul-first',
      number: 1,
      title: 'The soul prospers first',
      statement:
        'Yahweh is the Source of everything this family holds, and the order is never negotiable: the soul first, then the finances. No decision about money is made in this house that we would not make with the Lamb of Yahweh standing in the room, because He is.',
      standards: [
        'Prayer precedes any decision above the household threshold set by the stewards.',
        'A deal that requires us to become someone we would not want our children to become is refused, whatever it pays.',
        'Prosperity is measured against the soul, not against the balance.',
      ],
      anchor: {
        ref: '3 John 1:2',
        quote: 'Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth.',
      },
    },
    {
      id: 'art2-whom-we-serve',
      number: 2,
      title: 'Whom this house serves',
      statement:
        'This family serves Yahweh — the Father; Jesus, the Lamb and Eternal Son; and the Holy Spirit — and the wealth of this house exists to serve that end. The mission is not accumulation. It is to be able to do what He asks, when He asks it, without having to ask anyone else for permission.',
      standards: [
        'The declaration is made openly, not privately assumed.',
        'Capacity to obey is a legitimate reason to build wealth; status is not.',
        'No holding is kept that we would refuse to release if He asked for it.',
      ],
      anchor: {
        ref: 'Joshua 24:15',
        quote: 'but as for me and my house, we will serve the LORD.',
      },
    },
    {
      id: 'art3-firstfruits',
      number: 3,
      title: 'The firstfruits come off the top',
      statement:
        'Giving is the first line of every increase, not the last line of what remains. It is taken from the top, before operating costs, before reinvestment, before ourselves — and it is taken as a matter of covenant, not of surplus.',
      standards: [
        'Giving is computed on gross increase and is paid before any distribution.',
        'A month that cannot give is a month that reports the shortfall honestly, never one that quietly skips it.',
        'Generosity is planned in the budget, not left to feeling.',
      ],
      anchor: {
        ref: 'Proverbs 3:9; Malachi 3:10',
        quote: 'Honour the LORD with thy substance, and with the firstfruits of all thine increase',
      },
    },
    {
      id: 'art4-own-and-produce',
      number: 4,
      title: 'We own and produce; we do not merely consume',
      statement:
        'This family buys what keeps serving after it is paid for, and builds what pays for itself. A holding is an assignment, not an achievement — anything we hold is expected to be put to work.',
      standards: [
        'Before a purchase: does this consume once, or does it keep producing?',
        'Every significant asset has a named steward and a stated purpose.',
        'Capital sitting idle is reported as idle, and a reason is given.',
      ],
      anchor: {
        ref: 'Matthew 25:27; Genesis 2:15',
        quote: 'Thou oughtest therefore to have put my money to the exchangers',
      },
    },
    {
      id: 'art5-debt',
      number: 5,
      title: 'Debt is not the first tool we reach for',
      statement:
        'We do not pledge what we cannot cover, we do not co-sign for what we do not control, and we count the cost in writing before we build. Leverage is a decision this family makes deliberately and rarely, never reflexively.',
      standards: [
        'The cost is counted in writing, with the downside case, before any commitment.',
        'No surety for another party’s debt without the stewards’ agreement on the record.',
        'A payoff date exists for every obligation the family carries.',
      ],
      anchor: {
        ref: 'Luke 14:28; Proverbs 22:26; Romans 13:8',
        quote: 'For which of you, intending to build a tower, sitteth not down first, and counteth the cost, whether he have sufficient to finish it?',
      },
    },
    {
      id: 'art6-books-we-can-see',
      number: 6,
      title: 'We keep books we can actually see',
      statement:
        'Nothing in this family is managed that is not measured. The real accounts, the real forecast, the real giving and the real buffer are kept current and are readable by the stewards and, read-only, by the heirs being formed.',
      standards: [
        'The books are current enough to be acted on, not merely reconciled once a year.',
        'An heir being formed reads the real numbers before they are given power over them.',
        'A number nobody can trace to a real record does not belong in a family report.',
      ],
      anchor: {
        ref: 'Proverbs 27:23',
        quote: 'Be thou diligent to know the state of thy flocks, and look well to thy herds.',
      },
    },
    {
      id: 'art7-counsel',
      number: 7,
      title: 'Counsel before commitment',
      statement:
        'Large decisions are made with counsel — the stewards together, and qualified outside counsel where the matter is legal, tax, or medical. Speed is never a reason to skip it, and confidence is not counsel.',
      standards: [
        'Legal instruments are drafted and executed by a licensed attorney in the governing state.',
        'A decision above the stewards’ threshold requires at least one outside voice on the record.',
        'A refusal to seek counsel is itself reported to the stewards.',
      ],
      anchor: {
        ref: 'Proverbs 11:14',
        quote: 'Where no counsel is, the people fall: but in the multitude of counsellors there is safety.',
      },
    },
    {
      id: 'art8-truth-in-the-record',
      number: 8,
      title: 'We tell the truth about our numbers',
      statement:
        'This family does not round toward the story it wants. A gap is reported as a gap, an unknown as an unknown, and a loss as a loss. Our records are trusted because they have been willing to say the unflattering thing.',
      standards: [
        'An estimate is labeled an estimate; an unverified figure is labeled unverified.',
        'Bad news travels first and fastest, to the stewards, in plain words.',
        'No report shows a number that cannot be traced to a real record.',
      ],
      anchor: {
        ref: 'Proverbs 12:22',
        quote: 'Lying lips are abomination to the LORD: but they that deal truly are his delight.',
      },
    },
    {
      id: 'art9-the-wall-and-the-season',
      number: 9,
      title: 'The wall is love with foresight, and the season ends',
      statement:
        'The protections around this inheritance are not a verdict on any heir. They guard what was entrusted from what an heir cannot yet see coming, for a season the stewards will name and end. An heir is the heir the whole time.',
      standards: [
        'Every constraint on an heir has a written path to release and a named milestone.',
        'Faithfulness in a small, real responsibility is what advances the season.',
        'The stewards state the appointed time rather than leaving it to be guessed.',
      ],
      anchor: {
        ref: 'Galatians 4:1-2; Luke 16:10',
        quote: 'the heir, as long as he is a child, differeth nothing from a servant, though he be lord of all',
      },
    },
    {
      id: 'art10-hand-it-forward',
      number: 10,
      title: 'We hand it forward — and we teach other houses',
      statement:
        'What we learned is not ours to hold. This family teaches its own children first, then teaches other families the same way — freely, without a toll booth in front of the thing a household cannot afford to skip.',
      standards: [
        'Every heir teaches at least one person younger than themselves what they were taught.',
        'What we build for our house is made available to other houses that ask.',
        'The aim is the grandchildren, not the children — a two-generation plan is one generation short.',
      ],
      anchor: {
        ref: 'Psalms 78:6; 2 Timothy 2:2; Proverbs 13:22',
        quote: 'who should arise and declare them to their children',
      },
    },
  ],
};

// ---------------------------------------------------------------------------
// 2. THE THREE PROVISIONS — what each one does, what it does NOT do, and what
//    this app actually operates for it.
// ---------------------------------------------------------------------------
export const TRUST_PROVISIONS = [
  {
    id: 'constitution-reference',
    number: 1,
    name: 'The family constitution reference',
    oneLine:
      'The trust references a private family constitution carrying our values, mission, standards and expectations around wealth, business, investing and legacy.',
    answers:
      'The inheritance lost because the next generation received the balance and never received the thinking that produced it.',
    mechanism:
      'The instrument moves assets; the referenced constitution moves principles. A trustee or heir who never met the founder can read both and meet the family’s mind, not only its balance sheet.',
    mustSay: [
      'The trust names the constitution as an incorporated statement of the settlors’ intent and purposes.',
      'The constitution is private — not filed, not public, and not itself operative as a dispositive term.',
      'The trustee is directed to read it when exercising discretion, with the instrument governing where the two ever conflict.',
      'An amendment procedure exists for the constitution that does not require amending the trust.',
    ],
    limits: [
      'A referenced statement of intent guides discretion; it does not by itself create enforceable distribution rights.',
      'Where the constitution and the instrument conflict, the instrument governs — so keep the two from drifting.',
      'Its force is moral and interpretive. A document like this is a letter of wishes: the trustee must take it into account and in practice usually follows it, but is not legally bound by it. A version that truly BINDS is no longer a letter of wishes — it is a trust term.',
      'Do not incorporate an amendable document as a binding term. Incorporation by reference generally requires the document to exist when the instrument is executed — so incorporating it freezes it, and quietly amending it would amount to amending the trust.',
    ],
    appOperates: [
      'The full constitution, article by article, with the Scripture each stands on.',
      'Per-heir attestation: who has read which article, and what is still unattested.',
      'Export, so another family can adopt the form and write their own articles.',
    ],
    anchor: {
      ref: 'Habakkuk 2:2',
      quote: 'Write the vision, and make it plain upon tables, that he may run that readeth it.',
    },
  },
  {
    id: 'spendthrift',
    number: 2,
    name: 'The spendthrift provision',
    oneLine:
      'Trust assets remain owned by the trust, not by the beneficiary individually, and a beneficiary cannot assign or pledge their interest — which helps protect the assets from their creditors and, in certain divorce situations, from division.',
    answers:
      'The inheritance lost through a PERSON: a lawsuit, creditors after a business failure, a ruinous deal, a divorce, the wrong marriage.',
    mechanism:
      'A creditor generally reaches what a debtor owns. A beneficiary holds a right to receive under the trust’s terms, not title to the property, and cannot transfer that right — so there is far less for a claimant to attach. The deeper protection is DISCRETION: under the Uniform Trust Code’s discretionary-trust rule, a creditor — even one of the exception creditors below — generally cannot compel a distribution the trustee has authority to withhold. That is also why a discretionary interest is commonly treated in divorce as a mere expectancy rather than a divisible asset (Pfannenstiehl v. Pfannenstiehl, Mass. 2016). A mandatory or formula-driven right is far weaker than a discretionary one.',
    mustSay: [
      'Neither voluntary nor involuntary transfer of a beneficial interest is permitted, and no interest is subject to the claims of creditors before receipt.',
      'Distributions are discretionary in the trustee’s judgment rather than mandatory on a fixed schedule.',
      'The governing state is named, and the trust is funded by a third party rather than self-settled.',
      'The instrument STATES ITS MATERIAL PURPOSES. Under the American rule (Claflin v. Claflin, Mass. 1889) a trust cannot be modified or terminated even if every beneficiary agrees, where that would defeat a material purpose — but a purpose the document never states is a purpose a court must guess at.',
      'The trustee may make distributions for a beneficiary’s benefit directly to a provider rather than into the beneficiary’s hands.',
    ],
    limits: [
      'Generally strong for a trust someone ELSE funded for you; weak or void for a self-settled trust — one you fund for yourself.',
      'Child support and certain government claims commonly pierce spendthrift protection.',
      'Once a distribution is actually received it is the beneficiary’s own property and is exposed like anything else they own.',
      'State law varies substantially, and not as an on/off switch. California caps what a judgment creditor may reach at 25% of a payment otherwise due the beneficiary (Prob. Code § 15306.5); New York lets a creditor reach trust income beyond what is needed for the beneficiary’s education and support (EPTL § 7-3.4). Neither state is simply "protected" or "unprotected."',
      'Siting a trust in a favorable state does not settle the question. A court in the family’s own state may apply its own law — one state cannot limit another state’s courts (Toni 1 Trust v. Wacker, Alaska 2018; In re Huber). Where the family LIVES matters as much as where the trust sits.',
    ],
    appOperates: [
      'A standing exposure review: the real questions for this house, answered on the record.',
      'Honest status — protected only where the record says so; unreviewed is shown as unreviewed.',
      'Staleness: a review older than the family’s chosen interval is flagged rather than trusted.',
    ],
    anchor: {
      ref: 'Numbers 36:7; Leviticus 25:23',
      quote: 'So shall not the inheritance of the children of Israel remove from tribe to tribe',
    },
  },
  {
    id: 'forced-income-production',
    number: 3,
    name: 'Forced income production',
    oneLine:
      'Beneficiaries do not merely take distributions — they learn to produce, build, invest, and contribute value back into the trust.',
    answers:
      'The heir formed into a consumer of the very thing they were handed to steward, by years of receiving without producing.',
    mechanism:
      'Recorded production is a condition the trustee WEIGHS before discretionary distributions, so the requirement is operative rather than aspirational. This is the shape practitioners call a PRINCIPLE TRUST — the settlor sets down the principles and values to be encouraged and leaves the trustee discretion to judge each heir case by case — rather than a mechanical incentive formula. The distinction is not cosmetic: a rigid "earn a dollar, get a dollar" rule creates the kind of enforceable, non-discretionary right that weakens the very discretion the spendthrift protection depends on, and it breaks on the first heir who is disabled, studying, raising small children, or serving without pay.',
    mustSay: [
      'Production is defined broadly and in writing — earned income, a business built, capital genuinely at work, labor given to a family asset, a skill developed to a standard, service that creates real value.',
      'The trustee weighs recorded production over a stated period when exercising discretion.',
      'Incapacity is handled explicitly: illness, full-time study, and the care of small children do not forfeit standing.',
      'Health, education, maintenance and support needs are not withheld as a penalty for a production shortfall.',
    ],
    limits: [
      'A hard mechanical trigger can produce cruel results in a real family; the requirement is weighed, with a stated exemption path.',
      'A requirement nobody records is not a requirement — the ledger is the provision, not the paragraph.',
      'Conditions on an inheritance are broadly enforceable, but the line runs between deciding ELIGIBILITY at a moment and exerting ongoing control over how someone lives (Shapira v. Union National Bank, Ohio 1974; In re Estate of Feinberg, Ill. 2009). A weighed production standard with a stated exemption path sits on the safe side of that line; a lever pulled on a beneficiary’s daily conduct does not.',
      'Verification is a real problem, not a paperwork one. A condition a trustee cannot actually observe invites disputes — count what a record can show.',
    ],
    appOperates: [
      'A real production ledger: contributions and distributions recorded as dated entries.',
      'Standing computed from those entries — never assumed, and reported as no-record when nothing is entered.',
      'A distribution review that holds for a human on a shortfall and on unknown alike.',
    ],
    anchor: {
      ref: 'Matthew 25:27; Luke 19:13',
      quote: 'Occupy till I come.',
    },
  },
];

export const provisionById = Object.fromEntries(TRUST_PROVISIONS.map((p) => [p.id, p]));

// ---------------------------------------------------------------------------
// 3. LEDGER SHAPES — the real records standing is computed from.
// ---------------------------------------------------------------------------
// 'spendthrift' rows are the review ANSWERS — house-level, not per-beneficiary —
// carried in the same ledger so they sync with everything else (0167).
export const ENTRY_KINDS = ['production', 'distribution', 'attestation', 'exemption', 'spendthrift'];

// The kinds a beneficiary's production standing is computed from. A spendthrift
// answer or an article attestation is a real record but says nothing about
// whether that person produced — counting it would manufacture a standing.
export const STANDING_KINDS = ['production', 'distribution', 'exemption'];

// What counts as production. Authored, deliberately broader than a paycheck —
// the provision fails a real family if it only recognizes W-2 income.
export const PRODUCTION_KINDS = [
  { id: 'earned', label: 'Earned income', note: 'Wages, contract work, or a draw from work actually performed.' },
  { id: 'business', label: 'A business built or run', note: 'Founded, operated, or materially grown — revenue is evidence, not the definition.' },
  { id: 'invested', label: 'Capital put to work', note: 'Capital genuinely deployed and at risk, not merely parked.' },
  { id: 'labor', label: 'Labor given to a family asset', note: 'Real work on a family property, business, or ministry asset.' },
  { id: 'skill', label: 'A skill developed to a standard', note: 'A credential, certification, or demonstrated competence someone else would pay for.' },
  { id: 'service', label: 'Service that created value', note: 'Work that produced value someone else would have had to pay for.' },
  { id: 'contribution', label: 'Value contributed back', note: 'Money, an asset, or work contributed back into the trust itself.' },
];
export const PRODUCTION_KIND_IDS = PRODUCTION_KINDS.map((k) => k.id);

// The family's chosen starting rule. AUTHORED CONFIG, not a measurement — the
// stewards change these numbers and the engine recomputes. Comparable to the
// Road-to-150 template: the canonical rule ships in version control so it cannot
// be lost, while every ENTRY it is applied to is real recorded data.
export const POE_PRODUCTION_POLICY = {
  id: 'poe-default',
  label: 'Produce before you take (the Poe family starting rule)',
  periodMonths: 12,
  minProductionEntries: 2,
  // Of what a beneficiary RECEIVES in the period, this share is expected back as
  // recorded contributed value. null disables the ratio check entirely.
  contributeBackRatio: 0.1,
  // Distributions at or under this figure are not weighed against production at
  // all (support, education, medical — never withheld as a penalty).
  reviewFloorAmount: 500,
  exemptionReasons: ['illness or injury', 'full-time study', 'care of young children', 'stewards’ written exemption'],
  note:
    'Weighed by the stewards, not mechanically enforced — a PRINCIPLE trust, not an incentive formula. Health, education, maintenance and support are never withheld as a penalty for a production shortfall.',
};

const MS_DAY = 86400000;

/** Parse an ISO-ish date to ms, or null. Never throws, never guesses. */
export function toTime(value) {
  if (value == null || value === '') return null;
  const t = Date.parse(value);
  return Number.isNaN(t) ? null : t;
}

/** A finite number, or null. '' / null / undefined / NaN are ABSENT, not zero. */
export function toAmount(value) {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Normalize one raw ledger row. Unknown kinds are dropped by the callers. */
export function normalizeEntry(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const kind = ENTRY_KINDS.includes(raw.kind) ? raw.kind : null;
  if (!kind) return null;
  const beneficiary = String(raw.beneficiary || '').trim();
  // Every kind but a house-level spendthrift answer belongs to a person.
  if (!beneficiary && kind !== 'spendthrift') return null;
  return {
    id: String(raw.id || ''),
    kind,
    beneficiary,
    occurredAt: raw.occurredAt || raw.occurred_at || null,
    label: raw.label ? String(raw.label) : '',
    productionKind: PRODUCTION_KIND_IDS.includes(raw.productionKind) ? raw.productionKind : null,
    amount: toAmount(raw.amount),
    articleId: raw.articleId ? String(raw.articleId) : null,
    itemId: raw.itemId ? String(raw.itemId) : null,
    answer: raw.answer === 'yes' || raw.answer === 'no' ? raw.answer : null,
    reason: raw.reason ? String(raw.reason) : null,
    note: raw.note ? String(raw.note) : '',
  };
}

export function normalizeEntries(rows) {
  return (rows || []).map(normalizeEntry).filter(Boolean);
}

/**
 * Entries falling inside the policy period ending at asOf.
 * An entry with NO date cannot be placed in time — it is returned separately as
 * `undated` rather than silently counted or silently dropped.
 */
export function entriesInPeriod(entries, { asOf, periodMonths } = {}) {
  const end = toTime(asOf);
  const months = Number.isFinite(periodMonths) ? periodMonths : POE_PRODUCTION_POLICY.periodMonths;
  const list = normalizeEntries(entries);
  if (end == null) return { inPeriod: list, undated: [], windowed: false, start: null, end: null };
  const start = end - Math.round(months * 30.4375) * MS_DAY;
  const inPeriod = [];
  const undated = [];
  for (const e of list) {
    const t = toTime(e.occurredAt);
    if (t == null) { undated.push(e); continue; }
    if (t >= start && t <= end) inPeriod.push(e);
  }
  return { inPeriod, undated, windowed: true, start: new Date(start).toISOString().slice(0, 10), end: new Date(end).toISOString().slice(0, 10) };
}

// Sum amounts, reporting how many rows actually carried one. A total over rows
// where nothing was entered is null — not 0 — so an un-costed ledger can never
// masquerade as a zero-dollar one.
function sumAmounts(rows) {
  let total = 0;
  let valued = 0;
  for (const r of rows) if (r.amount != null) { total += r.amount; valued += 1; }
  return { total: valued ? total : null, valued, count: rows.length };
}

/**
 * One beneficiary's standing against the production policy.
 *
 * status:
 *   'exempt'    — an exemption entry covers the period.
 *   'no-record' — nothing recorded at all. NOT zero, NOT passing.
 *   'short'     — at least one check FAILED.
 *   'unverified'— no check failed, but at least one could not be evaluated.
 *   'meets'     — every check evaluated and passed.
 */
export function productionStanding(entries, { beneficiary, policy = POE_PRODUCTION_POLICY, asOf = null } = {}) {
  const who = String(beneficiary || '').trim();
  const { inPeriod, undated, windowed, start, end } = entriesInPeriod(entries, { asOf, periodMonths: policy.periodMonths });
  const mine = inPeriod.filter((e) => e.beneficiary === who && STANDING_KINDS.includes(e.kind));
  const myUndated = undated.filter((e) => e.beneficiary === who && STANDING_KINDS.includes(e.kind));

  const productions = mine.filter((e) => e.kind === 'production');
  const distributions = mine.filter((e) => e.kind === 'distribution');
  const exemptions = mine.filter((e) => e.kind === 'exemption');
  const contributions = productions.filter((e) => e.productionKind === 'contribution');

  const produced = sumAmounts(productions);
  const received = sumAmounts(distributions);
  const contributed = sumAmounts(contributions);

  const base = {
    beneficiary: who,
    policyId: policy.id,
    period: { months: policy.periodMonths, start, end, windowed },
    produced,
    received,
    contributed,
    undatedCount: myUndated.length,
    entries: mine,
  };

  if (exemptions.length) {
    return {
      ...base,
      status: 'exempt',
      checks: [],
      headline: `Exempt for this period — ${exemptions[0].reason || 'stewards’ exemption on record'}.`,
    };
  }

  if (!mine.length) {
    return {
      ...base,
      status: 'no-record',
      checks: [],
      headline: myUndated.length
        ? `No dated entries in this period. ${myUndated.length} undated ${myUndated.length === 1 ? 'entry' : 'entries'} could not be placed in time.`
        : 'No record yet for this period — nothing has been entered. This is not a zero and not a pass.',
    };
  }

  const checks = [];

  // Check 1 — recorded production in the period.
  checks.push({
    id: 'min-production',
    label: `At least ${policy.minProductionEntries} recorded production ${policy.minProductionEntries === 1 ? 'entry' : 'entries'} in the period`,
    result: productions.length >= policy.minProductionEntries ? 'pass' : 'fail',
    detail: `${productions.length} recorded.`,
  });

  // Check 2 — value contributed back, weighed against what was received.
  // Skipped entirely below the review floor (support/education/medical), and
  // reported 'unknown' — never 'pass' — when the amounts needed are absent.
  if (policy.contributeBackRatio == null) {
    checks.push({ id: 'contribute-back', label: 'Contribute-back ratio', result: 'n/a', detail: 'No ratio is set in this policy.' });
  } else if (received.total == null) {
    checks.push({
      id: 'contribute-back',
      label: `Contribute back at least ${Math.round(policy.contributeBackRatio * 100)}% of what was received`,
      result: distributions.length ? 'unknown' : 'n/a',
      detail: distributions.length
        ? `${distributions.length} distribution ${distributions.length === 1 ? 'entry carries' : 'entries carry'} no amount, so the ratio cannot be computed.`
        : 'Nothing was received in this period.',
    });
  } else if (received.total <= policy.reviewFloorAmount) {
    checks.push({
      id: 'contribute-back',
      label: `Contribute back at least ${Math.round(policy.contributeBackRatio * 100)}% of what was received`,
      result: 'n/a',
      detail: `Received is at or under the review floor (${policy.reviewFloorAmount}) — support-level distributions are not weighed.`,
    });
  } else if (contributed.total == null) {
    checks.push({
      id: 'contribute-back',
      label: `Contribute back at least ${Math.round(policy.contributeBackRatio * 100)}% of what was received`,
      result: 'unknown',
      detail: contributions.length
        ? 'Contributions are recorded but carry no amounts, so the ratio cannot be computed.'
        : 'No contributed value is recorded for this period.',
    });
  } else {
    const required = received.total * policy.contributeBackRatio;
    checks.push({
      id: 'contribute-back',
      label: `Contribute back at least ${Math.round(policy.contributeBackRatio * 100)}% of what was received`,
      result: contributed.total >= required ? 'pass' : 'fail',
      detail: `${contributed.total} contributed against ${required} required.`,
    });
  }

  // Check 3 — nothing was drawn without any production on record at all.
  checks.push({
    id: 'not-take-only',
    label: 'Did not draw from the trust with no production on record',
    result: distributions.length && !productions.length ? 'fail' : 'pass',
    detail: distributions.length && !productions.length
      ? `${distributions.length} distribution ${distributions.length === 1 ? 'entry' : 'entries'} with no production recorded.`
      : 'No take-only pattern in this period.',
  });

  const failed = checks.filter((c) => c.result === 'fail');
  const unknown = checks.filter((c) => c.result === 'unknown');
  const status = failed.length ? 'short' : unknown.length ? 'unverified' : 'meets';

  const headline = failed.length
    ? failed.map((c) => c.detail).join(' ')
    : unknown.length
      ? unknown.map((c) => c.detail).join(' ')
      : `Standing met: ${productions.length} production ${productions.length === 1 ? 'entry' : 'entries'} on record for this period.`;

  return { ...base, status, checks, headline };
}

/** Standing for a roster of beneficiaries, in the order given. */
export function standingsFor(beneficiaries, entries, opts = {}) {
  return (beneficiaries || []).map((b) => {
    const id = typeof b === 'string' ? b : b?.id;
    const name = typeof b === 'string' ? b : (b?.name || b?.id);
    return { id, name, ...productionStanding(entries, { ...opts, beneficiary: id }) };
  });
}

/**
 * The distribution gate. Never returns 'clear' on unknown or on no-record —
 * the review fails safe toward the stewards, not toward the money.
 */
export function distributionReview(standing, { amount = null, policy = POE_PRODUCTION_POLICY } = {}) {
  const requested = toAmount(amount);
  if (!standing || !standing.status) {
    return { decision: 'review', reason: 'No standing was computed — a steward reviews this by hand.' };
  }
  if (requested != null && requested <= policy.reviewFloorAmount) {
    return {
      decision: 'clear',
      reason: `At or under the review floor (${policy.reviewFloorAmount}) — support-level distributions are not weighed against production.`,
    };
  }
  switch (standing.status) {
    case 'exempt':
      return { decision: 'clear', reason: standing.headline };
    case 'meets':
      return { decision: 'clear', reason: standing.headline };
    case 'short':
      return { decision: 'hold', reason: `Production standing is short. ${standing.headline}` };
    case 'unverified':
      return { decision: 'review', reason: `Standing could not be verified. ${standing.headline}` };
    case 'no-record':
    default:
      return { decision: 'review', reason: `No production record for this period. ${standing.headline}` };
  }
}

// ---------------------------------------------------------------------------
// 4. CONSTITUTION ATTESTATION — who has actually read what.
// ---------------------------------------------------------------------------
/**
 * One person's attestation standing. An article with no attestation entry is
 * REPORTED AS MISSING; the surface never assumes a document was read.
 */
export function constitutionStanding(entries, { beneficiary, constitution = FAMILY_CONSTITUTION } = {}) {
  const who = String(beneficiary || '').trim();
  const articles = constitution?.articles || [];
  const ids = new Set(articles.map((a) => a.id));
  const attested = new Map();
  for (const e of normalizeEntries(entries)) {
    if (e.kind !== 'attestation' || e.beneficiary !== who) continue;
    if (!e.articleId || !ids.has(e.articleId)) continue;
    attested.set(e.articleId, e.occurredAt || null);
  }
  const missing = articles.filter((a) => !attested.has(a.id)).map((a) => a.id);
  const total = articles.length;
  const done = attested.size;
  return {
    beneficiary: who,
    total,
    attested: [...attested.keys()],
    attestedAt: Object.fromEntries(attested),
    missing,
    pct: total ? Math.round((done / total) * 100) : 0,
    complete: total > 0 && done === total,
  };
}

// ---------------------------------------------------------------------------
// 5. SPENDTHRIFT EXPOSURE REVIEW — the standing questions, answered on record.
// ---------------------------------------------------------------------------
// `protectedWhen` is the answer that indicates protection. An item nobody has
// answered is 'unreviewed' — never 'protected'.
export const SPENDTHRIFT_REVIEW_ITEMS = [
  { id: 'anti-alienation', question: 'Does the instrument forbid both voluntary and involuntary transfer of a beneficiary’s interest?', protectedWhen: 'yes', why: 'The anti-alienation language is the clause itself. Without it there is no spendthrift protection to argue about.' },
  { id: 'discretionary', question: 'Are distributions discretionary in the trustee’s judgment rather than mandatory on a fixed schedule?', protectedWhen: 'yes', why: 'A mandatory distribution right is far easier for a claimant to reach than a discretionary one.' },
  { id: 'third-party-funded', question: 'Was the trust funded by a third party rather than by the beneficiary themselves?', protectedWhen: 'yes', why: 'Self-settled spendthrift protection is weak or void in most states — this is the single biggest limit on the clause.' },
  { id: 'governing-state', question: 'Is the governing state named in the instrument, and has counsel there confirmed the clause holds under its law?', protectedWhen: 'yes', why: 'Spendthrift law is state-specific; an unnamed or unconfirmed governing law is an unmeasured assumption.' },
  { id: 'independent-trustee', question: 'Is there an independent trustee (or co-trustee) for discretionary distributions to a beneficiary?', protectedWhen: 'yes', why: 'A beneficiary who controls their own distributions looks a great deal like an owner to a court.' },
  { id: 'titling', question: 'Is every intended asset actually TITLED in the trust rather than merely listed on a schedule?', protectedWhen: 'yes', why: 'An unfunded trust protects nothing. This is the most common real-world failure.' },
  { id: 'direct-payment', question: 'May the trustee pay a provider directly instead of putting funds into the beneficiary’s hands?', protectedWhen: 'yes', why: 'Funds already received are the beneficiary’s own property and are exposed like anything else they own.' },
  { id: 'commingling', question: 'Are beneficiaries avoiding commingling trust distributions with joint marital accounts?', protectedWhen: 'yes', why: 'Commingling is how protected money becomes divisible money in a divorce.' },
  { id: 'exception-creditors', question: 'Has the family been told plainly which claimants can still pierce the clause in the governing state?', protectedWhen: 'yes', why: 'Child support and certain government claims commonly pierce. A family that has not been told will be shocked at the wrong moment.' },
  { id: 'counsel-review', question: 'Has a licensed estate attorney reviewed the instrument within the family’s chosen review interval?', protectedWhen: 'yes', why: 'Statutes and family circumstances both move. An unreviewed instrument silently ages out of its own assumptions.' },
  { id: 'material-purpose', question: 'Does the instrument STATE its material purposes — why the trust delays, protects, and restrains?', protectedWhen: 'yes', why: 'Under the American rule (Claflin v. Claflin, 1889) beneficiaries cannot agree among themselves to end a trust where that defeats a material purpose. The wall faces inward as well as outward — but only a purpose the document actually states is one a court can protect.' },
  { id: 'residence-vs-siting', question: 'Has counsel confirmed that the family’s RESIDENCE state respects the protection the trust’s siting state promises?', protectedWhen: 'yes', why: 'One state cannot limit another state’s courts. Where the settlor lives outside the favorable state and the trust is the only connection to it, courts have applied the home state’s law instead (Toni 1 Trust v. Wacker; In re Huber). Siting alone is not an answer.' },
];

/**
 * Fold the ledger's 'spendthrift' rows into the answers map the review reads.
 * Latest dated answer per item wins; an undated row loses to any dated one, so a
 * stale row can never overwrite a fresh review.
 */
export function spendthriftAnswersFrom(entries) {
  const out = {};
  const at = {};
  for (const e of normalizeEntries(entries)) {
    if (e.kind !== 'spendthrift' || !e.itemId || !e.answer) continue;
    const t = toTime(e.occurredAt);
    const prior = at[e.itemId];
    if (prior !== undefined && (prior != null) && (t == null || t <= prior)) continue;
    at[e.itemId] = t;
    out[e.itemId] = { answer: e.answer, reviewedAt: e.occurredAt || null, note: e.note || '' };
  }
  return out;
}

/**
 * Walk the review items against recorded answers.
 * answers: { [itemId]: { answer: 'yes'|'no'|null, reviewedAt, note } }
 * An item with no answer is 'unreviewed'. An answer older than
 * staleAfterMonths is 'stale' — reviewed once is not reviewed forever.
 */
export function spendthriftReview(answers = {}, { asOf = null, staleAfterMonths = 12, items = SPENDTHRIFT_REVIEW_ITEMS } = {}) {
  const now = toTime(asOf);
  const rows = items.map((item) => {
    const a = answers && answers[item.id];
    const answer = a && (a.answer === 'yes' || a.answer === 'no') ? a.answer : null;
    const reviewedAt = a?.reviewedAt || null;
    if (!answer) {
      return { ...item, answer: null, reviewedAt, status: 'unreviewed', detail: 'Not yet reviewed — this reads as unknown, never as protected.' };
    }
    const t = toTime(reviewedAt);
    const stale = now != null && t != null && (now - t) > Math.round(staleAfterMonths * 30.4375) * MS_DAY;
    if (answer !== item.protectedWhen) {
      return { ...item, answer, reviewedAt, status: 'exposed', detail: item.why };
    }
    return {
      ...item,
      answer,
      reviewedAt,
      status: stale ? 'stale' : 'protected',
      detail: stale ? `Answered ${reviewedAt}, older than the ${staleAfterMonths}-month review interval.` : (a?.note || 'Confirmed on the record.'),
    };
  });
  const tally = { protected: 0, exposed: 0, stale: 0, unreviewed: 0 };
  for (const r of rows) tally[r.status] += 1;
  return {
    items: rows,
    tally,
    total: rows.length,
    // The wall is only as good as its weakest confirmed link: any exposure, any
    // stale answer, or any unreviewed item means the posture is NOT confirmed.
    confirmed: tally.exposed === 0 && tally.stale === 0 && tally.unreviewed === 0,
    headline: tally.exposed
      ? `${tally.exposed} exposure${tally.exposed === 1 ? '' : 's'} on the record.`
      : tally.unreviewed || tally.stale
        ? `${tally.unreviewed} unreviewed, ${tally.stale} stale — the posture is not confirmed.`
        : 'Every item confirmed within the review interval.',
  };
}

// ---------------------------------------------------------------------------
// 6. WHOLE-SYSTEM SUMMARY + EXPORTS
// ---------------------------------------------------------------------------
export function trustSystemSummary({
  beneficiaries = [],
  entries = [],
  spendthriftAnswers = {},
  policy = POE_PRODUCTION_POLICY,
  constitution = FAMILY_CONSTITUTION,
  asOf = null,
} = {}) {
  const standings = standingsFor(beneficiaries, entries, { policy, asOf });
  const attestation = (beneficiaries || []).map((b) => {
    const id = typeof b === 'string' ? b : b?.id;
    const name = typeof b === 'string' ? b : (b?.name || b?.id);
    return { id, name, ...constitutionStanding(entries, { beneficiary: id, constitution }) };
  });
  const spendthrift = spendthriftReview(spendthriftAnswers, { asOf });
  return {
    asOf,
    provisions: TRUST_PROVISIONS.map((p) => p.id),
    constitution: {
      family: constitution.family,
      articles: constitution.articles.length,
      fullyAttested: attestation.filter((a) => a.complete).length,
      people: attestation,
    },
    spendthrift,
    production: {
      policyId: policy.id,
      standings,
      needingReview: standings.filter((s) => s.status !== 'meets' && s.status !== 'exempt').map((s) => s.id),
    },
  };
}

/** The constitution as markdown — the export another family starts from. */
export function exportConstitutionMarkdown(constitution = FAMILY_CONSTITUTION) {
  const lines = [];
  lines.push(`# ${constitution.family} — Family Constitution`);
  if (constitution.subtitle) lines.push('', `_${constitution.subtitle}_`);
  lines.push('', constitution.preamble, '');
  for (const a of constitution.articles) {
    lines.push(`## Article ${a.number} — ${a.title}`, '', a.statement, '');
    if (a.standards?.length) {
      lines.push('**The standard:**', '');
      for (const s of a.standards) lines.push(`- ${s}`);
      lines.push('');
    }
    if (a.anchor?.ref) {
      lines.push(`**KJV — ${a.anchor.ref}:** *"${a.anchor.quote}"*`, '');
    }
  }
  lines.push('---', '');
  lines.push('_A private document referenced by the family trust. It is not the trust and is not legal advice; where the two ever conflict, the instrument governs. Adopt this form freely for your own house — replace every article with your own convictions._');
  return lines.join('\n');
}

/** The three provisions as markdown — what to take to the attorney. */
export function exportProvisionsMarkdown(provisions = TRUST_PROVISIONS) {
  const lines = ['# The Three Provisions', ''];
  for (const p of provisions) {
    lines.push(`## ${p.number}. ${p.name}`, '', p.oneLine, '', `**Answers:** ${p.answers}`, '', `**How it works:** ${p.mechanism}`, '');
    lines.push('**What the instrument must say:**', '');
    for (const m of p.mustSay) lines.push(`- ${m}`);
    lines.push('', '**Honest limits:**', '');
    for (const l of p.limits) lines.push(`- ${l}`);
    lines.push('', '**What the app operates:**', '');
    for (const a of p.appOperates) lines.push(`- ${a}`);
    if (p.anchor?.ref) lines.push('', `**KJV — ${p.anchor.ref}:** *"${p.anchor.quote}"*`);
    lines.push('');
  }
  lines.push('---', '', '_Teaching, not legal advice. Trust law is state-specific; a licensed estate attorney in your own state drafts and executes the instrument._');
  return lines.join('\n');
}

/**
 * Adopt the FORM for another family: same articles, same anchors, their name —
 * every statement kept as a starting frame they are expected to rewrite. Marked
 * `adopted` so a surface can say plainly that these are not yet their own words.
 */
export function adoptConstitution(familyName, constitution = FAMILY_CONSTITUTION) {
  const family = String(familyName || '').trim();
  return {
    ...constitution,
    family: family || constitution.family,
    adopted: true,
    adoptedFrom: constitution.family,
    articles: constitution.articles.map((a) => ({ ...a, standards: [...(a.standards || [])], ownWords: false })),
  };
}
