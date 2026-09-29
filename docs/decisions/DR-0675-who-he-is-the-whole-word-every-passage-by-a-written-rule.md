# DR-0675 — Who He Is: the Whole Word — every passage that tells Who He Is, by a written rule

- **Status:** accepted
- **Tier:** B (teaching content every age reads; a new curriculum and a new surface)
- **Type:** word
- **Date:** 2026-09-29
- **Scope:** `app/src/lib/who-he-is-rules.js` (the written rule), `scripts/who-he-is-generate.mjs` (the generator), `app/src/lib/who-he-is-data.json` (its committed output), `app/src/lib/who-he-is.js` (the one door every surface reads), `app/src/__tests__/who-he-is-data.test.js`. Then, in ordered PRs on the same record: the curriculum lessons by era, and the timeline surface with the links from L191, L194 and L196.
- **Principles:** WORD-FIRST, TEACH-THE-WORD-DO-NOT-DEBATE, VERIFICATION-DOCTRINE, SPOKEN-TEACHINGS-ARE-BUILD-INPUT, THE-APP-IS-THE-PRIMARY-ARTIFACT, DECISION-RECORDS
- **Grounds:** DR-0661 (L196, the lesson Darrell was reacting to); DR-0076 (every count measured, every verse fetched); DR-0098; DR-0210 (Yahweh in our voice); the History course and `made-in-time-course.js` for course shape; `biblical-timeline.js` for the line from before time to for ever.

## Darrell's words, verbatim

Reacting to L196 on 2026-09-29:

> "Since a number of these passages lie within scenes L194 had already counted, every occasion in the first five movements bears a designation. I
> We needed a lesson wide curriculum with all!!!!!!!!!!!!!!!!! No matter if He was there or not!!!!!! Clarity clarification of where when what how timeless timelines and Who He Is!!!!!!"

And before it:

> "Lesson with all outside of the 4 gospels, so we have all of them in our curriculum... Those verses tell about Him too. We just kept the rule the same all the way through."

## The gap he named

L196 labelled its 37 witnesses and 34 Old Testament passages "not complete counts", and marked its occasions with designations a reader has to decode ("its own scene", "inside the fifty-four", "the writer's own word"). He asked for a whole curriculum, not one lesson: every passage in the whole Word that tells Who He Is, whether or not He was in the scene, each one made plain: where, when on a line from before time to for ever, what it says of Him, how it was given, and Who He Is.

## The decision: a written rule, a generator, and data the counts come from

"All" is only honest if the rule is written down, run by a machine over the whole corpus, and checked for completeness. So the curriculum is not curated by taste. `who-he-is-rules.js` holds the rule; `who-he-is-generate.mjs` runs it over the KJV (`app/public/bible/kjv`) and the public-domain cross-references (`app/public/bible/xref`, openbible.info / Treasury of Scripture Knowledge); the output is committed; every number any surface shows is computed from that output at the moment it is shown.

### The inclusion rule (four ways in)

- **A. The books that say they are about Him.** Matthew (1:1), Mark (1:1), Luke (by Acts 1:1, "all that Jesus began both to do and teach"), John (20:31) and Revelation (1:1) say so in their own words. Every scene of those books is in, whether a title stands in the verse or not. This is how John 15 ("I am the true vine") and Matthew 5 to 7 come in, which a title search would miss.
- **B. His names and titles.** Everywhere else in the New Testament, a verse naming Him by a lexicon title brings in its passage: Jesus, Christ, the Lamb (the KJV capitalizes it only for Him), the Son of God, the Son of man, the Son (with a possessive, so the vocative "Son," spoken to men is left out), Messias, Emmanuel, the Holy One of God, and the Word in the five verses where it is His name (John 1:1, 1:14; 1 John 1:1, 5:7; Revelation 19:13). Three verses where "Jesus" is another man are excluded by name (Acts 7:45 and Hebrews 4:8 are Joshua; Colossians 4:11 is Justus). Two verses in Acts where "the Lord" is Him by the passage's own words are added by name (Acts 22:18; 23:11).
- **C. The Old Testament the New Testament quotes of Him.** Found by a stated method (a quotation formula, or strong shared wording ranked high in the cross-reference data, keeping only the best-matching Old Testament verse), then judged: does the New Testament apply those words to Him? The default is decided by rule (a fulfillment formula, or a title of His in the quoting verse or the one before); **100 of the 324 method-found pairs carry a written judgment** overriding the default, each with its reason (57 made "yes", 43 made "no": the tempter quoting Psalm 91, the commandments in Romans 13, shared-word matches that are not quotations). The method's limit is named: the KJV rendered the New Testament from Greek and the Old from Hebrew, so a real quotation can share almost no English words (Matthew 8:17 and Isaiah 53:4). Those are in a supplement, **each row naming the New Testament verse that makes the quotation** (Psalm 22:1 by Matthew 27:46; Isaiah 9:6-7 by Luke 1:32-33; Daniel 7:13-14 by Matthew 26:64; Isaiah 44:6 and 48:12 by Revelation 1:17, and others). Old Testament titles come in only where the New Testament gives Him the title: Immanuel (Matthew 1:23) and Messiah (John 1:41).
- **D. The Old Testament the New Testament says pictured Him or held Him.** The serpent lifted up (John 3:14), the Rock that was Christ (1 Corinthians 10:4), the manna (John 6:32), the passover (1 Corinthians 5:7), Jonas (Matthew 12:40), Melchisedec (Hebrews 7:3), Jacob's ladder (John 1:51), Isaiah's vision of His glory (John 12:41), Adam the figure (Romans 5:14), the day of atonement (Hebrews 9:12; 13:12). Each row cites the verse that says so.

### The rule's edge, named and held for the Governor

Nineteen Old Testament passages widely read of Him are not reached by the rule, because no New Testament verse quotes, applies or names them: Genesis 3:15, Genesis 49:10 (Shiloh), Numbers 24:17, Job 19:25-27, Psalm 24:7-10, Proverbs 30:4, Jeremiah 23:5-6 and 33:15-16 (the Branch), Ezekiel 34:23-24, Daniel 3:25, Micah 5:4, Haggai 2:7, Zechariah 3:8, 6:12-13 and 14:4, Malachi 4:2, Genesis 18:1-2, Proverbs 8, and Isaiah 7:15-16. They are **not dropped**: they are listed in the data and on every surface with their nearest New Testament tie, counted separately. Promoting any of them is one line in `EDGE_TABLE` → `TYPE_TABLE` or `QUOTE_SUPPLEMENT`, with its reason. **re-review: 2026-10-13**, for Darrell's word on each.

### The unit, where, when, how, presence

- **The unit is the passage.** Gospel, Acts and Revelation books are cut into scenes by a stated test (a narrative opener that names a movement or a time; Revelation by the seer's own "And I saw" transitions; a piece shorter than three verses joins the scene it opens). Where the mechanical cut is plainly wrong, a written join or cut mends it, each with its reason (the parables of the vineyard, the prodigal son, the pounds; Stephen's speech; the transfiguration). Letters run from a title verse while the next verse still speaks of or to Him by pronoun. Old Testament passages are the quoted verses joined within three verses. **Parallel tellings are linked, not merged**: each Gospel's telling is its own entry, and its parallels are listed (shared five-word runs of the same words, at least 8 per cent of the shorter passage).
- **Where**: the places the passage itself names ("named in the passage", since a place named in speech may not be where the speaker stood); for a letter, to whom and that the letter does not say where it was written; for Revelation, "in the Spirit" on Patmos (1:9); for the prophets, the book's own opening verse; "The Word does not say" where it does not.
- **When**: fifteen eras in the Word's own order, before time (John 17:24) to for ever (Revelation 11:15), each with its marker verse. An entry *sits* where it happened or was spoken, and *points* to the eras its own words name (a letter written in the church age that speaks of the cross points to the cross). Where the Word gives no date, the entry says so (Job, Joel, Obadiah, Habakkuk, Malachi, and any psalm the quoting verse does not attribute).
- **How**: told as it happened, a letter, a vision, prophecy, a psalm, or a picture the New Testament names, with who spoke and to whom where the text names them. A psalm is David's only where the quoting New Testament verse says so.
- **Present**: *yes* (in the scene in person, seen or heard), *no*, or *pre-incarnate*, each with its basis. Eighteen passages carry a written presence judgment (He is not yet conceived in Luke 1:26-38; in His mother's womb in Luke 1:39-56; risen and not yet seen at the empty tomb; seen standing at the right hand by Stephen, Acts 7:56).

### Guards

A written row that matches nothing (a stale join, presence or quotation judgment) stops the generator. The data test proves: the committed file is what the rule makes, byte for byte; no verse sits in two entries; every verse of the five whole books is in; every New Testament verse with a lexicon title is in; every applied quotation, supplement, title verse and named picture is in; the edge is outside; every verse shown is the KJV verbatim, including every quotation inside the written reasons (the gate caught one of ours: "the son of David" where Matthew 21:9 reads "the Son of David"); every count adds up to the entries; the line runs in order. Each guard is shown to catch a planted fault.

## What the data says today (derived; the test recomputes it)

670 passages, 5,885 verses: 596 from the New Testament and 74 from the Old; 331 by rule A, 265 by B, 65 by C, 14 by D (a passage can carry C and D). He was there in 299 (yes), not in the scene in 367, and there before He came in the flesh in 4. By era where they sit: before time 1, creation 1, the patriarchs 3, Moses 13, the land 0, the kings and psalms 26, the prophets 31, His coming in the flesh 18, His ministry 209, the cross 42, He is risen 16, He goes up 3, the church 307. By what their words point to: before time 10, creation 7, the cross 134, He is risen 72, He comes again 49, for ever 89. The land and the judges holds none: no New Testament verse quotes or names a passage from Joshua, Judges or Ruth as His, and the record says so rather than filling it. Nineteen passages at the edge.

## Ordered PRs, each shippable on its own

1. **This one**: the rule, the generator, the committed data, the runtime module, the tests, this record. Ships alone: no surface reads it yet; the data and its proofs stand by themselves.
2. **The lessons by era**: a self-paced course, one lesson per era (small eras joined), Word-first numbered movements, four bands measured by the house's band gates, each lesson rendering every entry of its era with where, when, what, how and Who He Is, every verse verbatim and pinned.
3. **The timeline surface**: one navigable line of every entry from before time to for ever, filtered by present or not, how, book and era, each entry opening its passage and its lesson; the links from L191, L194 and L196, derived from those lessons' own references. L196's cryptic designations become plain where/when/what/how after the L194 recount (branch `claude/l194-recount-58`, DR-0672) lands, since that branch rewrites the same lines.

## Impact

Left as it was, "all" would stay a claim with two lists marked incomplete. Built, the curriculum says what "all" means in one paragraph, shows every passage it reaches, names every one it does not, and cannot drift: a change to the rule changes the data, and a change to the data without the rule fails the build.
