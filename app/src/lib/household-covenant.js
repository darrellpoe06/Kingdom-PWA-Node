// =============================================================================
// household-covenant — what the household's record is, and what it is not
// =============================================================================
// The document a household signs once, in the app, at the bottom of its own
// intake (DR-0356's check, DR-0357's engine). It is the family-side statement
// of DATA-AS-EMPOWERMENT: the record is theirs, the app owes them plain
// answers, and the things the app does NOT do are named as plainly as the
// things it does — because a promise the system cannot keep is worse than no
// promise (DR-0329's honesty rule: say what is not built).
//
// Every word here is editable by the household's own owner/admin through the
// forms engine; this is the ORIGINAL the code ships.
// =============================================================================

export const HOUSEHOLD_COVENANT = Object.freeze({
  title: 'Household Covenant',
  preamble: 'This is the agreement between this household and the app it keeps its life in. It says what the record holds, who may see it, what we will never do with it, and what we have not built yet.',
  sections: [
    {
      n: 1,
      title: 'The record is yours',
      text: 'Everything in this household’s record was put there by this household. You can read all of it, correct any cell of it, export the whole of it as a plain file, and remove it. Removing it removes the files with it. No one has to ask us for permission to do any of that, and we do not ask why.',
    },
    {
      n: 2,
      title: 'Who can see it',
      text: 'The people in this household who have been given a seat, and no one else. Access is decided by the household’s owner, one person at a time, and a seat can be taken back. Being a member of the household does not by itself open every record: what a child may see is the guardian’s decision, made per child, and the things that ACT — spending, security — stay closed regardless.',
    },
    {
      n: 3,
      title: 'What we will never do',
      items: [
        'We do not sell this data. Not to anyone, not ever, in any form.',
        'We do not send it to an insurer, an employer, a landlord, a lender or an advertiser.',
        'We do not use one household’s record to make a decision about another household.',
        'We do not train anything outside this household on this household’s record without the household saying so, in words, first.',
      ],
    },
    {
      n: 4,
      title: 'What the record does not hold',
      items: [
        'No account numbers, no routing numbers, no card numbers, no passwords. The name of a bank is a fact; its numbers are not ours to keep.',
        'No medical record. This is not a clinical system and does not become one. What it holds about health is logistics and habits — a carrier, an emergency contact, how often you move on purpose.',
        'No child’s own answers. A child’s record lives on the Family Roster under a guardian, and nothing here opens a stream of a child’s own data.',
      ],
    },
    {
      n: 5,
      title: 'What we have not built',
      text: 'Files you upload are held in private storage that only your account can open, and every open is logged. They are NOT encrypted with a key only you hold. This is a private shelf, not a safe deposit box. If a document would be ruinous in the wrong hands, keep the paper and record a pointer to where it is instead of uploading it.',
    },
    {
      n: 6,
      title: 'What the app owes you back',
      text: 'Every number this app shows you traces to a real row you can open. Where it does not know something, it says so rather than filling the space. When it draws a conclusion about your household, it shows the rows the conclusion came from. If it cannot do that, it does not show the conclusion.',
    },
    {
      n: 7,
      title: 'Changing this',
      text: 'This household’s owner can change every word of this document from inside the app. Each save is a new version with a note, and a signature records which version was signed. Changing the words does not un-sign what was already signed.',
      after: 'By signing, you are saying you have read this and that the record we keep together is kept on these terms.',
    },
  ],
});

export default HOUSEHOLD_COVENANT;
