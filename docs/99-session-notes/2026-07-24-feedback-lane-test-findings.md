# Findings from Darrell's live feedback-lane test (2026-07-24 evening)

1. **Width caps ("pages go half way"):** ThinkingSpace/Notes root carried
   max-w-3xl — half a desktop empty. FIXED this session (cap removed).
   Standing sweep: the consistency guard tracks 154 grandfathered width caps;
   the whole-page rule now has a governor mandate — ratchet them down,
   re-review with the leanness metric 2026-08-07.
2. **Header brand overlap ("the Name at the top is suspect"):** at desktop
   zoom the LOG OUT button renders interleaved with the POETECH · LIFE, SOUL
   & MONEY kicker ("P O E LOG OUT ."). Layout collision in the header
   cluster at narrow-zoom breakpoints. BUG captured — needs DOM observation
   to fix right (reality-trace); first item with the width-cap sweep.
3. **THE STRUCTURAL FINDING — he tested the feedback loop and it failed the
   test:** Darrell filed this via the in-app Feedback lane deliberately "to
   see how long it would take to get addressed — and Ari hasn't raised it
   once." Honest answer (DR-0100): NOTHING automatic reads feedback today.
   It lands in Supabase + a Synology chat ping + the triage board — then
   waits for a human. The event-activated Ari lane (DR-0234) shipped INERT
   with the app→lane dispatch seam as the dated remainder — his test is the
   exact evidence that seam is the platform's highest-value missing wire.
   Priority: the feedback→ari-review dispatch seam ships BEFORE the roles
   default-join fix in the next session's order? NO — tenancy exposure
   outranks loop latency: (1) default-join fix, (2) feedback→Ari seam, both
   next session, both already specified.
