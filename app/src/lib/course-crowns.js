// =============================================================================
// course-crowns — the Word under each crown a course earns (DR-1440)
// =============================================================================
// Darrell 2026-11-12, in substance: courses should earn crowns, the record
// should start with how many, and the crowns should rest on the Scriptures'
// own crown references. Every quotation below is KJV, verbatim from this
// repository's corpus (app/public/bible/kjv), pinned by
// __tests__/course-crowns.test.js; nothing is paraphrased and no word is
// changed inside a quotation (DR-0076, DR-0210).
//
// In our voice, plainly: a crown on this record is earned here, by reading and
// study. It is a picture the Word gives of what knowledge and understanding
// are worth; it is never a claim to the crowns the Lord alone gives (2 Timothy
// 4:8, James 1:12, 1 Peter 5:4), which no app awards.
// =============================================================================

export const CROWN_VERSES = Object.freeze({
  // A course completed: every lesson read and its exam passed.
  crown: Object.freeze({
    ref: 'Proverbs 14:18',
    book: 'Proverbs',
    chapter: 14,
    verses: [18],
    text: 'The simple inherit folly: but the prudent are crowned with knowledge.',
  }),
  // A course understood at 100%: wisdom and understanding, and the crown they bring.
  crownFull: Object.freeze({
    ref: 'Proverbs 4:7-9',
    book: 'Proverbs',
    chapter: 4,
    verses: [7, 8, 9],
    text: 'Wisdom is the principal thing; therefore get wisdom: and with all thy getting get understanding. Exalt her, and she shall promote thee: she shall bring thee to honour, when thou dost embrace her. She shall give to thine head an ornament of grace: a crown of glory shall she deliver to thee.',
  }),
  // Striving for the mastery, and the crown that does not pass.
  mastery: Object.freeze({
    ref: '1 Corinthians 9:25',
    book: '1Corinthians',
    chapter: 9,
    verses: [25],
    text: 'And every man that striveth for the mastery is temperate in all things. Now they do it to obtain a corruptible crown; but we an incorruptible.',
  }),
});
