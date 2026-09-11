// =============================================================================
// church-covenant — what the Love Corner's record of a person is, and is not
// =============================================================================
// The document a person signs once, in the app, at the bottom of their own
// intake (DR-0356's check, DR-0357's engine). It is the church-side statement
// of DATA-AS-EMPOWERMENT, and it carries one weight the household covenant does
// not: a church record is a record OF A CONGREGANT HELD BY THEIR CHURCH. The
// asymmetry is real — a person cannot easily walk away from their church the
// way they can from a vendor — so the promises here are narrower and the
// refusals are louder.
//
// Two things it says that no other covenant in this app has to say:
//   · WHAT YOU GIVE IS NOT IN HERE. Not the amount, not the total, not a
//     ranking. A church knowing what each person gives is the oldest way a
//     congregation gets quietly sorted, and this app refuses the capability
//     rather than promising restraint.
//   · A PRAYER REQUEST GOES WHERE YOU SAID AND NO FURTHER. The narrowest
//     audience is the default, and widening it is the person's act, not the
//     office's.
//
// And per DR-0329's honesty rule, what is NOT built is named as plainly as what
// is — including, as of 2026-09-11, that no decision authorizing any model to
// be trained on a congregant's record exists (DR-0357 records this explicitly),
// so the covenant promises the absence rather than describing a safeguard.
//
// Every word is editable by the church office through the forms engine; this is
// the ORIGINAL the code ships.
// =============================================================================

export const CHURCH_COVENANT = Object.freeze({
  title: 'What the church holds about you',
  preamble: 'This is the agreement between you and your church about the record this app keeps. It says what is in it, who can see it, what we will never do with it, and what we have not built. You are a member of a body, not a row in a database, and this document exists so that stays true.',
  sections: [
    {
      n: 1,
      title: 'The record is yours',
      text: 'Everything here you told us. You can read all of it, correct any answer, take a copy of the whole thing, and have it removed. You do not need a reason and nobody will ask you for one. Asking for it to be removed does not remove you from the church, and no one is told that you asked.',
    },
    {
      n: 2,
      title: 'Who can see it',
      text: 'The office, and the lead of a ministry you asked to serve in — that lead sees only that you offered and what you said about it, not the rest of your record. Nobody else. Being on staff does not open everyone’s record; access is given one seat at a time and can be taken back.',
    },
    {
      n: 3,
      title: 'What you give is not in here',
      items: [
        'This record holds no giving amount, no giving total, and no ranking of givers. The app refuses to store them at all, so there is nothing to leak and nothing to look up.',
        'Your own giving history is yours, on your own screen, and the office does not see it through this record.',
        'We ask about the rhythm you keep because the teaching on stewardship is part of what this church does. You may answer "I would rather not say", and that is a complete answer.',
      ],
    },
    {
      n: 4,
      title: 'What you asked prayer for',
      text: 'A prayer request goes exactly as far as you said and no further. The narrowest choice is the one already selected; widening it is something you do, not something the office does for you. If you leave it blank, nobody will ask you what is wrong.',
    },
    {
      n: 5,
      title: 'What we will never do',
      items: [
        'We do not sell this. Not to anyone, not ever, in any form.',
        'We do not send it to an employer, a lender, a landlord, an insurer or an advertiser.',
        'We do not use one person’s record to make a decision about another person.',
        'We do not use this record to decide who is welcome, who is counted, or who is spoken to. Attendance and standing are not a grade.',
        'We do not train anything on a congregant’s record. There is no decision permitting it, and until there is one — made in the open, with your word asked first — it does not happen.',
      ],
    },
    {
      n: 6,
      title: 'What the record does not hold',
      items: [
        'No account numbers, no routing numbers, no card numbers, no passwords. This app never touches a payment; it opens the church’s own giving page and stops.',
        'No medical record. What it holds about your health is logistics — who to call, what would make it easier for you to be here — and never a diagnosis.',
        'No child’s own answers. We count children and stop. A child’s record belongs to their guardian, and the children’s ministry contacts the guardian, never the child.',
      ],
    },
    {
      n: 7,
      title: 'What we have not built',
      text: 'Files kept for you sit in private storage only your account can open, and every open is logged. They are NOT encrypted with a key only you hold. This is a private shelf, not a safe deposit box. If a paper would be ruinous in the wrong hands, keep the paper and record where it is instead of uploading it.',
    },
    {
      n: 8,
      title: 'What the app owes you back',
      text: 'Anything this app tells you about yourself traces to something you actually entered, and you can open it. Where it does not know, it says so instead of filling the space. It will not show you a conclusion it cannot show you the reason for.',
    },
    {
      n: 9,
      title: 'Changing this',
      text: 'The church office can change every word of this document from inside the app. Each save is a new version with a note, and your signature records which version you signed. Changing the words does not un-sign what was already signed, and it does not apply backwards to what you agreed to.',
      after: 'By signing, you are saying you have read this and that the record we keep together is kept on these terms.',
    },
  ],
});

export default CHURCH_COVENANT;
