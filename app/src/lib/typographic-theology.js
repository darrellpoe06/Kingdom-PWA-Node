// =============================================================================
// typographic-theology — why this house writes His names the way it does
// =============================================================================
// Darrell 2026-09-19: "Still quoting however give an overall we capitalize etc
// for etc reasons..." And, the same evening, at law-tier intensity: "LORD
// Yahweh etc should never be lowercase no matter what!!!!!!" and "devil demon
// etc... always lowercase even if they start a sentence or whatever.... Yahweh
// and other Word... etc... are always capitalized including Him if talking
// about the King... follow the instructions..."
//
// The rule was already enforced by machine on both sides -- the adversary's
// names by adversary-is-never-capitalized.test.js since 2026-09-14, and His
// names by quoted-verse-is-the-verse.mjs since 2026-09-19. What was missing was
// the READER's side: a person meeting "satan" in lower case mid-sentence, or
// "the LORD" capitalised inside a quotation, has no way to know either is
// deliberate. A house rule a reader cannot see reads as a typo.
//
// ONE SOURCE, SO THE NOTE CANNOT LIE. The lists below are not a second copy of
// the rule written for display. They are THE lists, and the gates import them
// from here. That is the difference between a page that describes a rule and a
// page that cannot disagree with it: if someone adds a name to the rule, the
// reader's explanation gains it in the same commit, with no one remembering to
// update prose. Derived beats detected (the same reasoning as the surface-copy
// work): drift is not caught here, it is made impossible.
//
// THE BRIGHT LINE THIS FILE EXISTS TO PROTECT. None of it touches a quotation.
// The KJV capitalises the adversary’s name (Job 1:6, Matthew 4:10) and writes "God" and "the
// LORD" throughout, and every one of those is fetched verbatim and left exactly
// as written. We never edit the Word to fit house style. The rule governs OUR
// voice and stops at the quotation mark.
// =============================================================================

/**
 * Always capitalised, including every pronoun that refers to Him.
 * `why` is the reason a reader is owed, not a restatement of the rule.
 */
export const ALWAYS_CAPITALIZED = [
  { name: 'Yahweh', why: 'His covenant name. We prefer it over the generic "God" so a reader is never left guessing which god is meant -- other people name other gods.' },
  { name: 'Jesus', why: 'The Lamb of Yahweh (John 1:29) and the Eternal Son (John 3:16; Hebrews 1:8) -- co-eternal, by whom all things consist (Colossians 1:16-17).' },
  { name: 'the Holy Spirit', why: 'The Third Person, honoured evenly with the Father and the Son. He can be grieved (Ephesians 4:30), which is a thing said of a Person, never of a force.' },
  { name: 'the Father', why: 'The Most High. Every pronoun that points at Him is capitalised too -- He, His, Him, Himself.' },
  { name: 'the Son', why: 'Not a title of courtesy. The Son we worship.' },
  { name: 'the Word', why: 'Both the Living Word -- Christ as the Logos -- and the biblical Scriptures. The capital is a frame, not decoration: it marks Yahweh as the Author who framed the worlds before time began (Hebrews 11:3). Writing about Scripture in the lowercase register flattens Him into an ordinary detail.' },
];

/**
 * Never capitalised as proper names -- anywhere, including at the start of a
 * sentence, where ordinary English capitalisation would otherwise win.
 */
export const NEVER_CAPITALIZED = [
  'lucifer', 'satan', 'the devil', 'the dragon',
  'the adversary', 'the accuser', 'the deceiver', 'baal',
];

/** The one sentence that carries the whole reason for the list above. */
export const WHY_LOWERCASE = 'The adversary lost the right to that honour. A capital letter is a small honour and we do not pay it to him -- not even when he begins a sentence, which is the only place this rule ever looks like a mistake. One thing that is NOT an exception: an ordinary "The" that opens a sentence is just English, and the name after it stays lower case. So "The adversary tempted Him" is written correctly -- the capital belongs to the sentence, never to him.';

/**
 * The exception, stated as plainly as the rule, because a reader who spots
 * "Satan" capitalised inside a verse should know immediately that it is the
 * Word being left alone rather than the rule being broken.
 */
export const THE_EXCEPTION = {
  headline: 'Inside a quotation, the Word is left exactly as it is written.',
  body: 'The King James text capitalises the adversary’s name and writes "God" and "the LORD" throughout. Every quotation in this app is fetched from the text itself and never edited to match the way we write. So when the two disagree on a page, the quotation is right and untouched -- that is the rule working, not failing. We also never substitute "Yahweh" into a verse that says "God."',
};

/** Pronouns that take the capital when they point at Him. */
export const HIS_PRONOUNS = ['He', 'His', 'Him', 'Himself'];

/**
 * The lower-case forms the gates scan for in OUR voice -- only names with no
 * other sense in English. Deliberately short: 'god' is not here (Layer 0 itself
 * lowercases the false gods, and the KJV says "the god of this world"), nor
 * 'lord' (a parable's master is a lord). A check full of exemptions is a check
 * waiting to be wrong, so the strict list is the short one.
 */
export const HOLY_NAME_WORDS = [
  'yahweh', 'jesus', 'christ', 'messiah', 'godhead', 'holy spirit', 'holy ghost',
];
