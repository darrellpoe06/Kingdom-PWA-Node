// =============================================================================
// living-lessons-dates — the day each Living Lesson was added to the course
// =============================================================================
// Darrell 2026-09-24, on the lesson list: "There are dates in the lessons maybe
// we should capitalize on that somehow..." — after "There's no way to see the
// list in chronological order?!!!" and "They are numbered!!!!!!!!".
//
// WHERE EACH DATE COMES FROM (DR-0076: a real record, never a guess). No lesson
// object carries a date field, and the course's own lesson log (the comment on
// LIVING_LESSONS_META.weeks) names a day only for L153 onward. So each date
// here is the day the commit that FIRST carried the lesson's id landed in this
// repository (git author date, UTC), read from the full history of
// living-lessons-class.js on 2026-09-24. The short sha beside each line is that
// commit; `git show <sha>` proves it. Where the lesson log names a day that
// differs from the commit day (L153, L164, L189 — each off by one), the log's
// day is kept, because it is the day the course itself recorded.
//
// Measured when written: 191 of 191 lessons dated; in number order the dates
// never go backwards (L1 2026-06-24 ... L192 2026-09-24), so "by number" and
// "by date" agree. L79 does not exist (the id was never minted).
//
// A NEW LESSON JOINS AT BIRTH (DR-0621): living-lessons-order.test.jsx fails
// when a lesson in LIVING_LESSONS_MODULES has no line here, or when its date
// would put it before a lower-numbered lesson. Add the line with the lesson.
// =============================================================================

export const LIVING_LESSONS_ADDED = {
  'll1-the-perfect-yahweh-expects': '2026-06-24', // commit 7f596121
  'll2-the-energy-you-were-given': '2026-07-04', // commit 55baab53
  'll3-bodybuilding-christ': '2026-07-04', // commit 55baab53
  'll4-dying-to-live': '2026-07-04', // commit 55baab53
  'll5-take-no-thought-for-tomorrow': '2026-07-04', // commit 55baab53
  'll6-think-on-these-things': '2026-07-04', // commit 55baab53
  'll7-let-peace-be-the-umpire': '2026-07-04', // commit 55baab53
  'll8-not-by-might-a-new-body-coming': '2026-07-04', // commit 55baab53
  'll9-the-lord-looks-on-the-heart': '2026-07-04', // commit 55baab53
  'll10-strength-and-honour-are-her-clothing': '2026-07-04', // commit 55baab53
  'll11-fearfully-and-wonderfully-made': '2026-07-04', // commit 55baab53
  'll12-if-one-member-suffers': '2026-07-04', // commit 55baab53
  'll13-a-sound-mind': '2026-07-04', // commit 55baab53
  'll14-ten-healed-one-whole': '2026-07-10', // commit 7db70d49
  'll15-seasoned-with-salt': '2026-07-10', // commit daad4f35
  'll16-rule-your-spirit-repair-the-bond': '2026-07-10', // commit e44893aa
  'll17-taste-and-see': '2026-07-10', // commit 29a1f3cc
  'll18-the-flinch-comes-first': '2026-07-11', // commit 2252af2b
  'll19-not-ignorant-of-his-devices': '2026-07-11', // commit 95b8c832
  'll20-the-ladder-and-the-door': '2026-07-11', // commit 3d352116
  'll21-hidden-vs-known': '2026-07-11', // commit 8257346b
  'll22-goshen-and-the-watch': '2026-07-11', // commit 3646568b
  'll23-the-blessed-hope': '2026-07-11', // commit 6d59fea5
  'll24-yahweh-is-the-only-way': '2026-07-11', // commit 121d780a
  'll25-the-threshold-and-the-two-patterns': '2026-07-11', // commit 30b9088b
  'll26-how-the-king-knows-his-kings': '2026-07-11', // commit afbd29fe
  'll27-the-god-who-documents-his-grief': '2026-07-11', // commit de3135b9
  'll28-prove-all-things': '2026-07-15', // commit 3be8ae33
  'll29-the-unseen-realm-and-the-nations': '2026-07-15', // commit 0b196808
  'll30-the-whole-story-yahweh-and-humanity': '2026-07-15', // commit 0b196808
  'll31-the-best-way-preferred-accepted-natural-against': '2026-07-15', // commit fb1f9da3
  'll32-salt-light-and-anchor-the-church-in-the-city': '2026-07-17', // commit c7f0c9ad
  'll33-from-good-intentions-to-lasting-impact': '2026-07-17', // commit c7f0c9ad
  'll34-the-tower-the-race-and-the-sovereign': '2026-07-17', // commit f9d33f84
  'll35-sovereign-and-small': '2026-07-17', // commit 2cbc6cef
  'll36-fruit-root-and-the-empty-house': '2026-07-18', // commit fda344a9
  'll37-one-blood-truth-over-the-debate': '2026-07-18', // commit 5a5088f3
  'll38-become-the-message-tactics-to-essence': '2026-07-18', // commit 5a5088f3
  'll39-roots-lead-to-the-king-hidden-jerusalem': '2026-07-18', // commit 75daa247
  'll40-the-thread-did-not-snap-remnant': '2026-07-18', // commit 7dbbb45b
  'll41-truth-with-a-capital-t': '2026-07-18', // commit 80329836
  'll42-keep-the-adversary-out-of-the-music': '2026-07-19', // commit 5fadff85
  'll43-the-war-is-for-the-mind': '2026-07-19', // commit 1b361be1
  'll44-safe-to-speak-psychological-safety': '2026-07-20', // commit e31a45be
  'll45-give-honour-where-it-is-due-recognition-and-equity': '2026-07-20', // commit 2da82b2b
  'll46-ye-fathers-provoke-to-good-works': '2026-07-20', // commit 3d428728
  'll47-navigating-the-age-faith-critical-thinking-identity': '2026-07-21', // commit f7610642
  'll48-world-class-as-unto-the-lord-work-ownership-resilience': '2026-07-21', // commit 682140f2
  'll49-mastery-without-manipulation-lifes-task-envy-sober-mind': '2026-07-21', // commit 137a6b77
  'll50-the-mind-of-christ-thinking-yahwehs-thoughts-proven-in-works': '2026-07-21', // commit 44c61190
  'll51-the-mind-of-christ-situationally-how-scripture-addresses-each-person': '2026-07-21', // commit 64e58c0a
  'll52-how-a-lie-gets-wired-in-neuroplasticity-memory-and-the-mind-of-christ': '2026-07-21', // commit 4e34c13e
  'll53-the-emotional-cycles-of-brain-and-body-stewarding-feeling-by-the-renewed-mind': '2026-07-21', // commit 4e34c13e
  'll54-the-same-word-different-soil-the-parable-of-the-sower': '2026-07-21', // commit bc4feeb8
  'll55-the-connector-not-the-expert-the-body-that-works-together': '2026-07-21', // commit bc4feeb8
  'll56-the-person-of-the-holy-spirit-seek-the-deliverer-not-deliverance': '2026-07-21', // commit bc4feeb8
  'll57-power-to-tread-the-authority-he-gave-and-the-better-joy': '2026-07-25', // commit 297dbf03
  'll58-the-wind-you-can-hear-perceiving-the-holy-spirit': '2026-07-27', // commit 76c25222
  'll59-not-by-measure-all-of-him-from-day-one': '2026-07-27', // commit a2bd4628
  'll60-fearfully-and-wonderfully-maintained-thyroid-hair-temple': '2026-07-27', // commit b8235da2
  'll61-the-audit-fruit-not-photographs-accountable-shepherds': '2026-07-27', // commit fda0a5d1
  'll62-the-age-of-counterfeits-meekness-over-manipulation': '2026-07-27', // commit b20f5208
  'll63-the-family-in-the-field-offense-defense-why-yahweh-allows': '2026-07-28', // commit 8c0c98bb
  'll64-as-thy-soul-prospereth-spirit-soul-and-the-will': '2026-07-29', // commit 1ef7b8d8
  'll65-processed-for-righteousness-works-words-and-the-verdict': '2026-07-29', // commit 88784b3f
  'll66-watch-and-pray-the-secret-place-and-the-predators-within': '2026-07-29', // commit 88784b3f
  'll67-made-in-his-image-we-make-why-ai-is-not-a-soul': '2026-07-29', // commit 88784b3f
  'll68-out-of-the-way-consecration-and-the-broken-bread': '2026-07-30', // commit 11c404e5
  'll69-faithful-over-a-few-things-stewardship-and-increase': '2026-07-30', // commit 2af2e4f1
  'll70-the-bridegrooms-answer-only-the-father-names-the-day': '2026-07-31', // commit 355c7009
  'll71-the-two-gates-and-the-father-of-the-fatherless': '2026-08-04', // commit 1d041725
  'll72-the-berean-foundation': '2026-08-04', // commit ae759c3a
  'll73-the-house-of-el-and-the-only-saviour': '2026-08-10', // commit f9aea556
  'll74-church-hurt-the-counterfeit-comfort-and-the-blood': '2026-08-11', // commit 9be0cfa9
  'll75-the-greater-yeshua': '2026-08-11', // commit e882d3cd
  'll76-the-sky-the-speculation-and-the-test-that-works': '2026-08-11', // commit e882d3cd
  'll77-the-king-over-the-children-of-pride': '2026-08-14', // commit ee27ff39
  'll78-the-snare-of-the-fear-of-man': '2026-08-15', // commit 8abbde4a
  'll80-the-four-warnings-of-a-hardening-heart': '2026-08-18', // commit 51ae4738
  'll81-tongues-weighed-word-first': '2026-08-18', // commit 51ae4738
  'll82-love-fulfils-the-law-wake-up-and-get-dressed': '2026-08-20', // commit 0015c6cb
  'll83-keep-thy-heart-the-conditions-of-growth': '2026-08-21', // commit 3535fd29
  'll84-blessed-and-highly-favored-before-during-after-time': '2026-08-24', // commit 506b5ab7
  'll85-the-kings-code-sheep-hear-goats-of-the-world-lost': '2026-08-24', // commit ed765c1a
  'll86-luke-research-meets-inspiration-son-of-man-for-all': '2026-08-25', // commit 26ea2781
  'll87-two-ways-two-wisdoms-how-the-word-makes-whole': '2026-08-25', // commit 26ea2781
  'll88-four-soils-heart-conditions-and-the-kings-eternal-program': '2026-08-25', // commit 26ea2781
  'll89-the-most-hated-verse-wilful-sin-the-one-sacrifice-the-advocate': '2026-08-25', // commit bb8bf3f6
  'll90-no-respecter-of-persons-the-image-the-unrighteous-decree-and-the-judge': '2026-08-28', // commit ad166541
  'll91-the-authors-own-code-searched-out-to-guard-his-image': '2026-08-28', // commit c3fd982b
  'll92-yahweh-standardized-love-obedience-deeds-thoughts-and-the-temple-kingdom': '2026-08-28', // commit dd1a4aba
  'll93-come-let-us-reason-truth-in-any-language-the-mind-rewired-real': '2026-08-28', // commit dd1a4aba
  'll94-lord-of-hosts-the-two-ways-sealed-in-time-and-the-mind-of-christ': '2026-08-28', // commit 2008be39
  'll95-know-the-state-of-thy-flocks-best-buy-and-the-fickle-rally': '2026-08-28', // commit 2bc949a4
  'll96-doers-of-the-word-competence-by-doing-and-the-minds-tactics-daily': '2026-08-28', // commit 12d8e9aa
  'll97-a-just-weight-for-work-money-and-words-faithful-service-and-verifying-every-claim': '2026-08-29', // commit 7fa34e4d
  'll98-the-just-judge-equal-justice-and-a-just-weight-for-the-numbers': '2026-08-29', // commit c7ca9949
  'll99-watch-and-be-ready-no-date-setting-and-a-sober-word-on-ai-and-prophecy': '2026-08-29', // commit ecbd18e9
  'll100-guard-the-little-ones-children-the-millstone-and-mastery-over-the-tools': '2026-08-29', // commit adff1f64
  'll101-the-real-champion-action-not-theory-die-once-live-forever-and-the-mind-of-christ': '2026-08-29', // commit 069a9e29
  'll102-bold-as-a-lion-boldness-from-righteousness-not-bravado-no-fear': '2026-08-29', // commit 6718521e
  'll103-his-kings-reigning-under-the-king-of-kings-two-paths-wealth-and-souls': '2026-08-30', // commit b29f3e5f
  'll104-study-your-ways-how-yahweh-weighs-love-the-deterministic-standard-two-ways-and-the-word': '2026-08-30', // commit c2d6cf2b
  'll105-doing-the-word-rewires-you-daily-intake-the-deep-heart-and-experiential-over-theoretical': '2026-08-30', // commit 3d6bd991
  'll106-wise-as-serpents-harmless-as-doves-know-the-enemy-deny-the-flesh-and-the-one-way': '2026-08-30', // commit 10455ce9
  'll107-what-the-word-gives-love-truth-light-knowledge-and-how-we-receive-it-vs-the-enemy': '2026-08-30', // commit b755da4b
  'll108-why-we-name-him-low-the-typography-of-a-defeated-enemy': '2026-08-30', // commit a25314f5
  'll109-how-we-know-yahwehs-love-taste-see-hear-touch-experienced-at-every-age': '2026-08-30', // commit 90185250
  'll110-wolf-vs-lion-the-enemys-two-tactics-and-the-one-shepherd': '2026-08-30', // commit 90185250
  'll111-the-just-weight-yahwehs-unchanging-measure-vs-the-worlds-shifting-standard': '2026-08-30', // commit b54481af
  'll112-foxes-wolves-and-bears-the-enemys-graded-beasts-and-how-yahwehs-servants-win': '2026-08-31', // commit b5c5bed5
  'll113-the-spirit-is-willing-but-the-flesh-is-weak-telling-them-apart-ruling-your-spirit-and-yahwehs-long-work': '2026-08-31', // commit d44e29ab
  'll114-what-makes-having-you-better-covenant-not-contract-and-the-value-a-paycheck-cannot-cover': '2026-09-02', // commit 3783bb3c
  'll115-meek-and-quiet-strength-the-ornament-of-great-price-and-why-jael-is-not-the-blueprint': '2026-09-02', // commit 125a3071
  'll116-the-thirty-day-experiment-action-produces-information-and-the-grace-that-met-a-pretender': '2026-09-02', // commit 996b1327
  'll117-no-two-children-grow-up-in-the-same-house-why-siblings-differ-and-the-one-parent-who-is-the-same': '2026-09-03', // commit a8b75a2d
  'll118-ninety-seven-percent-testing-a-viral-number-against-the-word-and-the-real-research': '2026-09-03', // commit 22281c41
  'll119-abstention-if-i-am-an-option-do-not-pick-me-and-the-choosing-settled-before-there-was-a-list': '2026-09-03', // commit 014c708f
  'll120-it-is-written-keep-the-policy-in-your-pocket-advocacy-from-the-written-word-and-a-just-weight': '2026-09-03', // commit 014c708f
  'll121-know-your-own-post-her-provision-her-guard-and-the-beam-in-the-pointing-eye': '2026-09-03', // commit 9b64fb06
  'll122-does-she-feel-like-your-favorite-person-preferring-one-another-and-the-first-works': '2026-09-03', // commit 9b64fb06
  'll123-would-you-sign-that-contract-the-answer-the-qualification-and-the-manner-that-forfeited-it': '2026-09-03', // commit 9b64fb06
  'll124-equipped-to-win-the-hour-you-are-losing-the-word-again-and-the-man-who-did-not-want-the-job': '2026-09-03', // commit 56f99703
  'll125-rules-of-engagement-the-warfare-the-word-authorizes-the-open-doors-it-closes-and-where-it-stops': '2026-09-05', // commit f1a15d1c
  'll126-feelings-are-fruit-not-root-belief-the-renewed-mind-and-declarations-bounded-by-his-word': '2026-09-05', // commit f1a15d1c
  'll127-the-firsts-what-yahweh-did-in-each-century-that-had-never-been-done-before': '2026-09-05', // commit 0e68ae7f
  'll128-the-prudent-man-studies-systematic-analysis-the-ways-that-protect-and-seeing-him-while-blind': '2026-09-06', // commit aba958bf
  'll129-you-have-a-destiny-the-giver-the-window-covenant-authority-the-heart-of-flesh-and-the-me-that-has-to-die': '2026-09-06', // commit 3397d8d3
  'll130-three-days-and-three-nights-what-he-did-in-the-place-of-the-dead-and-why-the-devil-is-defeated-but-not-destroyed': '2026-09-07', // commit 28b555f2
  'll131-joy-is-not-happiness-three-days-one-strength-and-the-word-as-the-code-that-runs-each-of-them': '2026-09-08', // commit 1afc4e54
  'll132-the-whole-salvation-plan-inside-genesis-alone-and-the-godhead-at-war-with-the-enemies-from-the-first-pages': '2026-09-08', // commit 9c730847
  'll133-how-to-see-the-whole-torah-at-once-the-twelve-patterns-and-the-two-questions-that-opened-them': '2026-09-08', // commit 508c299b
  'll134-divers-weights-when-the-question-keeps-moving-the-record-that-stands-and-the-better-assignment': '2026-09-08', // commit bc0435dc
  'll135-they-called-every-one-of-them-george-the-name-they-took-the-porter-at-the-door-and-the-wage-yahweh-legislated': '2026-09-08', // commit b9ff84f4
  'll136-touched-with-the-feeling-the-high-priest-who-felt-the-whole-weight-and-why-his-judgment-never-needed-your-experience-to-be-true': '2026-09-08', // commit 5c904eba
  'll137-look-and-live-the-serpent-on-the-pole-the-son-lifted-up-and-why-believing-him-over-the-liar-is-the-whole-cure': '2026-09-09', // commit 71dff750
  'll138-exercised-senses-why-perception-is-grown-not-withheld-the-tests-that-train-the-eye-and-what-comes-after-your-ways-align-with-the-word': '2026-09-09', // commit 71dff750
  'll139-the-sceptre-of-judah-who-judah-is-why-judah-still-matters-until-the-end-and-who-shiloh-is': '2026-09-09', // commit b5454738
  'll140-the-people-of-judah-and-the-people-of-the-way-who-they-are-where-they-are-and-whom-to-listen-to': '2026-09-09', // commit e3748c5f
  'll141-separate-and-connect-working-through-issues-studying-to-be-approved-tempted-versus-tried-and-how-we-handle-each-other-and-enemies': '2026-09-12', // commit 768cb81b
  'll142-it-is-written-again-the-clause-that-gets-left-out-and-the-name-that-gets-put-on-it': '2026-09-12', // commit 26811402
  'll143-yahwehs-will-be-done-on-earth-the-guaranteed-outcome-the-release-and-the-system-we-can-build': '2026-09-12', // commit 09db5dd6
  'll144-a-false-balance-capable-hands-and-the-capital-they-were-never-given': '2026-09-13', // commit 5baa97ff
  'll145-i-will-not-go-out-free-the-bondservant-the-price-and-the-ear-at-the-door': '2026-09-13', // commit e18e1b86
  'll146-he-said-it-first-what-it-sounds-like-when-yahweh-tells-you-how-he-feels': '2026-09-13', // commit 520e866d
  'll147-the-due-he-is-owed-every-place-the-word-shows-jesus-worshipped-and-the-one-thing-that-never-happens': '2026-09-13', // commit ed99b30c
  'll148-remember-is-a-verb-what-the-word-says-about-his-knowing-his-withholding-and-the-sea': '2026-09-13', // commit ed99b30c
  'll149-cultural-competency-the-same-word-in-three-mouths-and-the-man-nobody-believed': '2026-09-13', // commit ce533569
  'll150-how-can-the-son-not-know-what-the-father-knows': '2026-09-14', // commit e081996c
  'll151-the-tongue-death-and-life-in-a-little-member-and-the-knowledge-that-governs-it': '2026-09-14', // commit 84f3669e
  'll152-crying-because-of-all-the-dying-slow-and-vicious-but-yahweh': '2026-09-14', // commit 7a9c7dd2
  'll153-precept-upon-precept-the-voice-that-programs-the-world': '2026-09-15', // log (commit 2026-09-14) 0fda3068
  'll154-why-do-we-have-to-pay-for-our-fathers-sins-we-dont-and-it-needs-what-we-do-here': '2026-09-15', // commit bd1ae54f
  'll155-yahweh-his-name-and-why-this-house-says-it': '2026-09-15', // commit bdca9645
  'll156-teach-yourself-anything-qualitative-and-quantitative-analysis-loving-yahweh-while-you-do-it': '2026-09-15', // commit bdca9645
  'll157-what-is-love-in-depth-and-in-range-action-based-word-first': '2026-09-15', // commit bdca9645
  'll158-how-the-worlds-were-made-the-whole-process-for-a-child-word-based-on-the-word': '2026-09-15', // commit 019c6241
  'll159-we-are-all-children-of-yahweh-no-matter-how-old-for-ever-children-to-him': '2026-09-15', // commit 019c6241
  'll160-pride-is-not-worth-him-and-is-ego-pride-or-something-else': '2026-09-15', // commit 019c6241
  'll161-one-source-of-truth-his-voice-in-his-word-be-still-be-engrafted-build-each-other': '2026-09-15', // commit 019c6241
  'll162-do-not-take-a-death-so-personal-that-you-undermine-your-way-home-let-him-be-him': '2026-09-15', // commit 019c6241
  'll163-the-build-we-are-going-for-and-why-according-to-the-word-a-school-yahweh-first': '2026-09-15', // commit c6e15073
  'll164-our-voice-builds-as-his-voice-created-rigorous-questions-to-the-one-perfect-truth-becoming-like-our-father': '2026-09-15', // log (commit 2026-09-16) b91cab53
  'll165-i-always-had-love-gratitude-measured-against-a-real-lack-and-suffering-with-him-before-reigning-with-him': '2026-09-17', // commit 7d318655
  'll166-life-is-disrespectful-so-think-on-these-things-self-against-the-servant-king-and-the-one-who-bought-you-twice': '2026-09-17', // commit 6bd5254b
  'll167-be-a-g-about-it-execute-the-fourteen-love-verbs-high-or-low-because-it-is-not-about-how-you-feel': '2026-09-17', // commit f4f833f8
  'll168-the-king-through-the-warriors-lens-before-the-foundation-the-third-dimension-he-spoke-and-the-name-written-on-his-thigh': '2026-09-17', // commit 57033d99
  'll169-pour-it-out-every-seat-worked-feed-my-sheep-and-be-the-best-in-this-too': '2026-09-17', // commit 1ead3c1d
  'll170-through-the-eyes-of-the-people-closest-to-him-and-the-history-pulled-out': '2026-09-17', // commit d6a08532
  'll171-trend-it-against-the-shoreline-points-setpoints-and-the-trends-of-our-lives': '2026-09-17', // commit c8acc097
  'll172-the-spirit-of-your-mind-dust-breath-and-the-one-who-inhabits-eternity': '2026-09-18', // commit f1140012
  'll173-humility-is-the-strength-no-shame-and-feelings-that-arrive-late': '2026-09-18', // commit d3471662
  'll174-the-levels-of-disrespect-and-the-gap-between-what-he-means-and-what-we-say': '2026-09-18', // commit b303dfaa
  'll175-true-love-starts-with-an-act-and-a-sound-mind-and-feelings-come-after-the-test': '2026-09-18', // commit d24fa9fc
  'll176-faith-is-the-substance-and-the-evidence-and-he-made-me-then-died-for-me': '2026-09-18', // commit 327b12d0
  'll177-two-minds-and-the-one-you-feed-is-the-one-that-runs-you': '2026-09-18', // commit 327b12d0
  'll178-terms-change-not-the-need-a-renamed-problem-is-not-a-fixed-one': '2026-09-18', // commit 86fc391c
  'll179-heartfelt-the-heart-is-the-deep-mind-and-what-heartfelt-actually-claims': '2026-09-19', // commit 58f4ce79
  'll180-he-giveth-thee-power-to-get-wealth': '2026-09-19', // commit 7970c275
  'll181-run-it-through-the-word-the-two-minds-and-the-song-she-could-not-sing': '2026-09-19', // commit 78390433
  'll182-two-witnesses-jesus-counted-them-himself': '2026-09-19', // commit 78390433
  'll183-realign-my-eyes-your-type-was-trained': '2026-09-19', // commit 78390433
  'll184-he-sings-yahweh-over-you-jesus-in-the-midst-of-you': '2026-09-19', // commit 78390433
  'll185-knowledge-was-never-the-savior': '2026-09-19', // commit ad862bc1
  'll186-glory-to-glory-one-letter-holds-both-sides': '2026-09-19', // commit 5d82a772
  'll187-the-unreasonable-standard-and-the-honest-error-log': '2026-09-19', // commit 5d82a772
  'll188-the-acceptable-year-and-the-whole-counsel': '2026-09-19', // commit 5d82a772
  'll189-follow-the-leader-the-shepherd-of-our-souls': '2026-09-19', // log (commit 2026-09-20) 26662721
  'll190-were-the-parables-real-the-one-who-made-the-ages-told-them': '2026-09-23', // commit 2a5a9bf9
  'll191-who-he-said-he-was-every-hearer-every-situation-and-the-keys-of-hell-and-of-death': '2026-09-24', // commit 0c8ebcbd
  'll192-two-hours-became-six-the-pattern-the-yea-the-inspection-and-the-faithful-man': '2026-09-24', // commit 806b6c63
  'll193-how-yahweh-keeps-his-word-the-promise-the-test-and-the-open-record': '2026-09-24', // added with the lesson (DR-0643)
};
