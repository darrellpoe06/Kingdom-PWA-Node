# 2026-09-14 — the two lessons built today, and the anchor-line revert

Darrell: *"Then add todays lessons in that format!!!!"* and *"So keep record of
them somewhere!!!!"* This is that record.

## The two lessons, both spoken by Darrell and built the same day

### L150 — The Tongue: Death and Life in a Little Member, and the Knowledge That Governs It
`id: ll151-the-tongue-death-and-life-in-a-little-member-and-the-knowledge-that-governs-it`
**Status: on `main`, live.**

Asked for as: *"Lesson on the tongue and what damage and success it can wield
for the human based on the biblical scriptures and Knowledge Of Yahweh? How to
use it and not to use it... why and why not... examples all of them
quantitative and qualitative... Impact and outcomes etc."*

Then built out from roughly fifteen further things he spoke while it was being
written — competence and comprehension, the believer who cannot be corrected,
the unseen way of a husband or wife, prediction and humility, the Proverbs
method, the spouse who will not read it, mocking in both directions, the absent
prerequisite, the body (menopause, sleep, hearing), sugar and intake,
strongholds, mockery as the cheap substitute for study, calling evil good,
re-examining our ways against The Way without making law, the fruit of the
Spirit as the only honest measure, endurance, the joy of Yahweh, patience
having her perfect work, and the close he insisted on: *"It's not about anyone
else!!! It's me... beam in my eye, speck in theirs."*

282 quoted spans, every one verbatim KJV. 30 benefits, 43 learner questions, 20
quiz, 2 parables.

### L151 — Crying Because of All the Dying: Slow, Vicious, But Yahweh
`id: ll152-crying-because-of-all-the-dying-slow-and-vicious-but-yahweh`
**Status: on branch `claude/church-donation-tracking-cqrc64`, PR #1579.**

Spoken as: *"Crying because of all the dying... slow and vicious... but
Yahweh!!!!!!"* and minutes later the sustaining half, *"Only strength is
Joy!!!!"*

Seven movements, each his phrase answered from the Word: the crying is marked
not corrected (Jeremiah 9:1, Ezekiel 9:4, John 11:35); the slow has a cause and
it is REJECTED knowledge (Hosea 4:6, Isaiah 57:1); two slownesses that are
opposites (Habakkuk 1:2 against 2 Peter 3:9); the vicious has an author and it
is not the Father (Ezekiel 18:32 / 33:11, Hebrews 2:14-15); the lament is given
work and guarded from contempt (Proverbs 24:11-12, Matthew 9:36); but Yahweh, in
three tenses (Psalms 73:26, Lamentations 3:22-23, Isaiah 25:8,
1 Corinthians 15:54-55, Revelation 21:4-5); and the only strength is joy
(Nehemiah 8:10 spoken to a weeping crowd, Hebrews 12:2 joy BEFORE endurance,
Habakkuk 3:17-18 every other support removed by name, Isaiah 61:3 the oil of joy
issued to mourners).

43 quoted spans, every one pulled from `public/bible/kjv` at generation time by
the script that wrote the module. 18 benefits, 18 learner questions, 16 quiz,
2 parables.

## The revert, and why it was needed

The paced step view printed the joined `anchor.ref` string — up to eighty
references separated by semicolons — as inert green text. Darrell called that
wall the problem. Reading DR-0391 **Decision 5** ("the anchor line is wired to
`WordInline`") I wired the JOINED string through it. Forty-one references became
forty-one tappable chips covering the teaching, and opened verses stacked as
full cards that squeezed the prose into a narrow column.

**DR-0391 Decision 1 is the rule that governs it:** *"THE RULE IS ABOUT RUNS,
NEVER ABOUT REFERENCES — which is exactly the line he drew with 'Only lists.' A
reference INSIDE A SENTENCE is the point."* Decision 5 is about references in a
LINE; `anchor.ref` is a RUN by construction. Both decisions were in front of me
and I applied the wrong one — then wrote a test that pinned the wrong behaviour
as if it were the contract.

Both blocks are now restored byte-for-byte from `18442875^` and the restore was
verified by diff, not asserted. The test pinning my change is deleted and
`learn-lesson-space.test.jsx` is restored from the same commit.

**What the lessons themselves need, unresolved and NOT guessed at:** citations
belong in the content in context — inside the sentences where the point is made
— and the joined run belongs nowhere in the reading view. That is a formatting
decision on the anchor field itself, and it is Darrell's to make rather than
mine to infer; I have now inferred it wrongly twice in one day.

## Everything else from today, untouched by the revert

Christina's sign-in (the signup 8-character minimum was blocking her existing
6-character password before any network call); the rentals partial-read guard
(absence stops deleting the only local copy of a door's rooms, lease and tenant
detail); the sovereign witness reporting ever-inserted / ever-deleted /
stats-reset and an `instances` mode; and the read-only device rescue script.
