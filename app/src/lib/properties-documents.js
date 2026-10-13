// =============================================================================
// properties-documents — what an applicant is owed in writing (DR-0357)
// =============================================================================
// DR-0101 §7 requires that an application decision rest on documented,
// consistent criteria, that the reason be recorded, and that the whole thing be
// framed as the landlord's own policy verified with a licensed professional —
// never as legal advice from this app. The app already refuses a decision
// recorded against a protected-class term (modules/properties/intake.js
// screenDecisionReason). What was missing was the WRITING: the criteria the
// applicant may read before applying, and the commitment they are read under.
//
// These are the ORIGINALS the code ships. The landlord edits every word from
// inside the app through the forms engine, and each save is a version.
//
// WHAT IS DELIBERATELY BLANK: every threshold (income multiple, credit floor,
// how far back a record is looked at). Those are the landlord's business
// policy and are not this app's to invent — a fabricated threshold would be a
// number presented as decided policy, which DR-0076 forbids. They render as
// "the office fills this in" until the office fills them in.
// =============================================================================

/** The federal list. State and local law ADD to it; the office confirms its own with counsel. */
export const FEDERAL_PROTECTED_CLASSES = Object.freeze([
  'race', 'color', 'national origin', 'religion', 'sex', 'familial status', 'disability',
]);

export const FAIR_HOUSING_STATEMENT = Object.freeze({
  title: 'How we choose, and how we do not',
  preamble: 'Every adult who applies is judged by the same written criteria, in the order the applications arrive. This page says what those criteria are for, what they can never be, and what to do if you believe we got it wrong.',
  sections: [
    {
      n: 1,
      title: 'The same criteria for everyone',
      text: 'We apply one written set of criteria to every application. They are on the page beside this one. We do not keep a second, unwritten set, and we do not change them for one applicant and not another.',
    },
    {
      n: 2,
      title: 'What a decision can never rest on',
      text: 'Federal fair housing law forbids a housing decision made on any of these:',
      items: FEDERAL_PROTECTED_CLASSES.map((c) => `${c.charAt(0).toUpperCase()}${c.slice(1)}`),
      after: 'State and local law add to this list. This office confirms the list that governs it with a licensed professional and keeps this page current. Our own system refuses to record a decision whose stated reason names any of these.',
    },
    {
      n: 3,
      title: 'What we do write down',
      text: 'Every decision carries the criterion it actually rested on, the date, and who made it. That record is kept and cannot be edited after the fact. You may ask for the reason your application was declined, and we will give you the one on the record.',
    },
    {
      n: 4,
      title: 'If a report was used',
      text: 'If a consumer report (credit, background, rental history) is used in a decision about you, you have rights under the Fair Credit Reporting Act: to be told the report was used against you, to know what is in your file, to ask for your credit score, and to dispute information that is incomplete or inaccurate. The agency that reported it must correct what is wrong.',
      after: 'This page is this office’s own policy statement, not legal advice. Its wording is reviewed with a licensed professional before it governs a real decision.',
    },
  ],
});

/**
 * The criteria an applicant may read BEFORE applying. Thresholds are the
 * office's to fill — the app ships the structure and the honesty, never an
 * invented number.
 */
export const RENTAL_CRITERIA = Object.freeze({
  title: 'What we look at in an application',
  preamble: 'Read this before you apply. If something here is a problem for you, tell us when you apply rather than after — most of what looks disqualifying on paper has an explanation we can weigh, and we would rather have it in front of us.',
  sections: [
    {
      n: 1,
      title: 'Who has to apply',
      text: 'Every adult 18 or older who will live in the unit fills out their own application. One application does not cover a household.',
    },
    {
      n: 2,
      title: 'Income',
      text: 'We look at whether the household’s verifiable income supports the rent. Any lawful source of income counts — a job, contract work, a benefit, a voucher, support payments, a pension.',
      after: 'The office fills in the multiple it uses and what it accepts as verification.',
    },
    {
      n: 3,
      title: 'Rental history',
      text: 'We contact current and previous landlords. We are asking whether rent arrived, whether notice was given, and whether the unit was returned in reasonable condition.',
      after: 'The office fills in how far back it looks.',
    },
    {
      n: 4,
      title: 'The questions on the form',
      text: 'The application asks directly about eviction, judgment and conviction history. We ask everyone the same questions and we weigh the answer with its context and its age — the answer itself is not an automatic decline.',
      after: 'The office fills in what it treats as disqualifying and over what period.',
    },
    {
      n: 5,
      title: 'What we do not ask for here',
      items: [
        'No Social Security number is collected in this app. If screening requires one, a person asks you for it directly.',
        'No driver’s license number is stored here.',
        'Nothing about the protected characteristics on the fair housing page, from you or from anyone else.',
      ],
    },
    {
      n: 6,
      title: 'What happens next',
      text: 'You will get a decision with the criterion it rested on. If it is a no, you will be told why in the same words that are on our record. If a consumer report was part of it, you will be told that too.',
      after: 'This page states this office’s own criteria. It is reviewed with a licensed professional before it governs a real decision, and it is not legal advice.',
    },
  ],
});
