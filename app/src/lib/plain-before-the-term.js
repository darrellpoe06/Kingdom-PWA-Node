// =============================================================================
// THE PLAIN MEANING COMES FIRST (DR-0521)
// =============================================================================
// Darrell 2026-09-19, reading L175 on his phone, hit a word and stopped:
//
//   "What is an assay?"   and then   "Typo?"
//
// It was not a typo. An assay is a metal-shop test: you heat a sample to find
// out what it actually is, and the assayer's purpose is to establish the
// content, never to destroy the material — which is exactly why 1 Peter 1:7
// reaches for fire and gold. The lesson even SAID that. It said it two
// sentences after he had already met the word cold and had to ask.
//
// That is his own rule from the same evening, failing on our own text:
//
//   "we need to use terms they already understand so words that are to big or
//    not usually used will not be understood unless we ALSO USE THEM IN
//    CONTEXT and also use words that are in the current vocabulary"
//
// Using a hard word in context is right. Using it and explaining it afterwards
// is not the same thing, because a reader who stopped at the word never reached
// the explanation. THE PLAIN MEANING COMES FIRST, or at the latest in the same
// breath — never in the next paragraph.
//
// HOW THIS IS CHECKED, and why it is a list rather than a cleverness. There is
// no reliable way to detect "a gloss" in free prose, and a gate that guesses is
// a gate that lies (DR-0076 §3). So each hard term carries its own PLAIN CUES:
// the everyday phrases that would actually teach it. A lesson using the term
// must carry at least one of its cues, and the cue must appear BEFORE or within
// the same sentence as the term's first use. That is mechanical, it cannot pass
// by accident, and adding a term costs one line.
//
// ADDING A TERM IS NORMAL. Weakening a term's cues so an existing lesson passes
// is the thing this file exists to prevent — the fix is to write the plain
// meaning into the lesson, which takes one clause.
//
// WRITE A TERM'S CUES FROM REAL PROSE, NOT FROM IMAGINATION. Both times a cue
// has had to be widened, the cause was the same: the cue was invented in the
// abstract ("a measure", "something the lender can take") and the actual
// teaching said it differently ("the dry measure the grain was poured into",
// "the thing the lender gets to take if they cannot pay"). Seed a new term's
// cues by writing the explanation first and lifting the phrases out of it.
//
// A CUE MAY BE BROADENED; A CUE MAY NOT BE HOLLOWED OUT. Those are different
// edits and the difference is the whole integrity of this file. `collateral`
// first listed the cue "something the lender can take", and prose reading "the
// thing the lender gets to take if they cannot pay" failed it — identical
// teaching, an over-specific matcher. Broadening to "lender can take" recognises
// the same gloss. What is forbidden is adding a cue that is not itself a plain
// explanation, in order to make an unexplained use pass.
//
// TWO WORDS WERE TAKEN BACK OFF THIS LIST after the first measurement, and the
// reason belongs here rather than in a commit nobody re-reads. `tribute` fired
// 150 times and `pledge` 22, almost all of them the ordinary modern senses —
// paying tribute to someone, pledging to do a thing. Both are words a reader
// already owns. A check that fires on correct content is a check that will pass
// on wrong content, so they came off. The list holds words a reader genuinely
// does not have, which is what Darrell was pointing at.

// term -> the plain phrasings that count as having taught it.
export const HARD_TERMS = {
  assay: ['heat a sample', 'find out what it actually is', 'metal shop', 'what a material is', 'test of what is there'],
  usury: ['old word for interest', 'charging extra for the use of money', 'rule about interest', 'interest'],
  surety: ['signing for somebody else', 'sign for someone else', 'promise to pay someone else', 'you owe it instead', 'on the hook for'],
  collateral: ['hold until the loan is paid', 'lender can take', 'lender gets to take', 'put up as security', 'put their land up as security', 'lender could take'],
  neuroplasticity: ['brain physically changes with use', 'brain rewires itself', 'brain rebuilds itself', 'brain changes with use'],
  subconscious: ['runs without you watching', 'while you are not watching', 'without being watched', 'part of your mind that runs'],
  amortisation: ['how a loan is paid down', 'schedule of payments', 'paid off over time'],
  escrow: ['money held by a third party', 'held by somebody in the middle', 'held until the deal closes'],
  reprobate: ['failed the test', 'did not pass', 'not approved'],
  adokimos: ['failed the test', 'did not pass', 'not approved'],
  kenosis: ['emptied himself', 'made himself of no reputation', 'laid it down', 'he emptied himself'],
  ephah: ['measure the grain', 'measured your grain', 'dry measure', 'basket', 'measure the customer', 'customer receives'],
  // Added 2026-09-19 with the Insurance and Risk course (DR-0522 sibling), each
  // one measured against the whole live corpus FIRST: all five were at zero
  // faults before the course landed, so they add no debt and no false fires.
  premium: ['regular payment you make so', 'regular payment made so', 'regular payment a household makes so'],
  deductible: ['part you pay yourself first', 'you pay the first'],
  indemnify: ['put it back the way it was', 'made whole and no further'],
  indemnity: ['put it back the way it was', 'made whole and no further'],
  actuarial: ['counting how often a loss happens', 'arithmetic of how often'],
  // THREE WORDS WERE MEASURED AND DELIBERATELY LEFT OFF, and the reasons belong
  // here rather than in a commit nobody re-reads. Each is a real candidate and
  // each would fire on correct content today, which this file forbids.
  //   liability   -- 26 genuine uses across 13 lessons, no matcher problem, and
  //                  a word a young reader really does not own. It is owed a
  //                  pass that AUTHORS the gloss at each site; it must never be
  //                  added by hollowing its cues. re-review: 2026-10-03.
  //   peril       -- fires at the word start of `perilously`, which is ordinary
  //                  English (ll66). It needs a matcher that understands
  //                  inflection, not a list entry. re-review: 2026-10-03.
  //   underwriting-- 2 of its 7 hits are a document TITLE, the FHA's 1938
  //                  Underwriting Manual (econ5). A title is not a term use, so
  //                  the same matcher work gates it. re-review: 2026-10-03.
};

const norm = (s) => String(s || '').replace(/\s+/g, ' ');
// Reader-facing prose only, with quotations stripped: the Word's own vocabulary
// is the Word's, and a KJV quotation is never a place we could have inserted a
// gloss. What we are checking is OUR writing around it.
export const oursOnly = (text) =>
  norm(text).replace(/"[^"]*"/g, ' ').replace(/\([1-3]?\s?[A-Za-z]+(?: of [A-Za-z]+)*\s+\d+:[\d\-,\s]+\)/g, ' ');

/** First use of a term at a word start, case-insensitively; -1 when unused. */
const firstUseAt = (lowerText, term) => {
  const m = new RegExp(`\\b${term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).exec(lowerText);
  return m ? m.index : -1;
};

// Where the term is first used in our own prose, and where the earliest cue
// lands. A cue in the SAME sentence counts as in time; anything later does not.
export function termFaults(text, terms = HARD_TERMS) {
  const ours = oursOnly(text);
  const lower = ours.toLowerCase();
  const out = [];
  for (const [term, cues] of Object.entries(terms)) {
    // A WORD-START boundary, and deliberately none at the end. Measured
    // 2026-09-19 while judging `liability` for this list: a bare indexOf found
    // the term inside `reliability` and `peril` inside `perilously`, which is a
    // check firing on correct content — the exact failure this file forbids.
    // The tail stays open so an inflection (`assayer`, `usurious`) still counts
    // as a use. A start boundary can only ever match LESS, so the recorded debt
    // cannot grow from this change, and it was re-measured to prove it.
    const at = firstUseAt(lower, term);
    if (at < 0) continue;
    // The end of the sentence the term appears in — a cue up to there is in time.
    const rest = ours.slice(at);
    const stop = rest.search(/[.!?]\s/);
    const deadline = at + (stop < 0 ? rest.length : stop + 1);
    const inTime = cues.some((c) => {
      const cueAt = lower.indexOf(c.toLowerCase());
      return cueAt >= 0 && cueAt < deadline;
    });
    if (!inTime) out.push(term);
  }
  return out;
}

// Every reader-facing field of a module, so a band cannot quietly go unchecked.
export const READER_FIELDS = ['lesson', 'bigIdea', 'inApp'];
export function moduleFaults(module, terms = HARD_TERMS) {
  const out = [];
  const fields = { ...Object.fromEntries(READER_FIELDS.map((f) => [f, module[f]])), ...(module.levels || {}) };
  for (const [field, text] of Object.entries(fields)) {
    if (typeof text !== 'string' || !text) continue;
    for (const term of termFaults(text, terms)) out.push(`${module.id}.${field}: ${term}`);
  }
  return out;
}

export function scanModules(modules, terms = HARD_TERMS) {
  const out = [];
  for (const m of (Array.isArray(modules) ? modules : [])) {
    if (m && m.id) out.push(...moduleFaults(m, terms));
  }
  return out;
}
