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
// THE BRIGHT LINE THIS FILE EXISTS TO PROTECT. We never edit the WORDING of a
// quotation to fit house style, and never substitute "Yahweh" into a verse that
// says "God". The rule governs OUR voice.
//
// CORRECTED 2026-09-19, and the correction is the reason this comment is long.
// The first version of this file told the reader that the King James text
// capitalises the adversary's name, citing Job 1:6 and Matthew 4:10. That was
// written from memory and never checked, and it is FALSE of the text this app
// actually serves: app/public/bible/kjv reads `satan` in Job 1:6, Matthew 4:10,
// Luke 22:31, Zechariah 3:1 and Revelation 12:9. Not an ingest accident either
// -- it is Darrell's own directive (PR #1397), recorded in
// scripts/kjv-name-case-corrections.mjs, which draws the line explicitly: that
// script restores LORD/Lord/GOD case where our corpus mis-renders the NAME, and
// states that the adversary-name lowercasing is separate, deliberate, and
// stands. So the honest statement to a reader is not that we leave his capital
// alone -- it is that our Bible text carries his name lower case ON PURPOSE,
// and a reader will meet it that way inside the verses too. Told plainly on the
// page, and pinned against the corpus in the test so this claim can never drift
// from the text again (DR-0076 section 8: a citation is a claim you consulted
// the source).
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
  headline: 'Inside a quotation, the words are never changed.',
  body: 'Every verse here is fetched from the text itself. We never edit the wording to match the way we write, and we never substitute "Yahweh" into a verse that says "God" -- so when our sentence and a quotation differ on a page, the quotation is right and untouched. One thing IS deliberate and you should know it rather than wonder: the Bible text this app serves carries the adversary’s name in lower case, by Darrell’s own directive, so you will meet it that way inside the verses too and not only in our own sentences. Everything else in a quotation stands exactly as the text has it, including "God" and "the LORD."',
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
