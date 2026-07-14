# COLG broadcast review — Christina's critiques (mix + choir walk-in)

**Recorded:** 2026-07-14 · **Reviewer:** Christina Poe · **Relayed by:** Darrell
(voice note, 2026-07-14) · **Capture rule:** sent build-input is always captured
(CLAUDE.md — "Spoken Teachings Are Build Input").

Christina reviewed the live online broadcast of a Sunday service the way a viewer
meets it at home — the DR-0104 "review the live production push" posture applied to
a weekly service. Her notes are two kinds: an **audio mix** correction the
front-of-house operator sets on the Yamaha TF5, and a **video cue** convention the
switch operator runs on the online-broadcast program. Both are recurring team
standards, so they are captured as a structured, addressed-to-the-station record —
not as a one-off wall-install note.

## Where it lives (reality-trace — DR-0061 / P15 / DR-0076)

| Piece | Real backing |
|---|---|
| Data (single source) | `app/src/lib/broadcast-adjustments.js` — pure data: the review, the two audio items, the choir walk-in cue. |
| Surface | `app/src/components/ChurchVideoWall.jsx` → **Broadcast review** section tab (staff-gated `isChurchStaff`, where the booth as-built already lives). |
| Proven-to-catch | `app/src/__tests__/broadcast-adjustments.test.js` — flip any directive to its opposite and a case fails. |
| Station map | `app/src/lib/led-wall-golive.js` `BOOTH_AS_BUILT` (verified on site 2026-07-05): audio = Yamaha TF5; online broadcast = right CUDA tower (OBS / ATEM). |

## Audio mix — Yamaha TF5 (front-of-house), relative targets

1. **Saxophone DOWN.** It is too hot on the broadcast; it competes with the lead and
   the choir. Target: the sax supports, it does not lead. Set on the broadcast/monitor
   bus, not only the room.
2. **Choir UP — to sit just a little BELOW the lead singer.** Right now the choir is
   *way* lower than the lead (buried). The target is **relative**: lead still on top,
   choir full and present right under it — not level with the lead, and not the distant
   level it is at now. Dialed by ear, service to service — not a fixed fader number.

## Video cue — the choir walk-in: hold, then reveal

**Station:** the online-broadcast program (right CUDA tower — OBS / ATEM), the switch
operator. The "fire / holding graphic" here is a full-frame **program scene** on the
online path — *not* a lower-third, and *not* the LED-wall NovaStar Freeze (a separate
surface, see `led-wall-golive.js`).

**Principle:** viewers at home should never see the choir walking in and getting set.
Hold the full-frame holding graphic over the whole entrance; reveal the choir on the
program **only** once they are fully in place and ready — so the first time viewers see
the choir, it looks like they were always set and ready to go.

1. **Before the walk-in:** come up on the full-frame holding graphic (the "fire" /
   motion background scene).
2. **During the walk-in:** HOLD it full-frame. Do NOT cut to the choir — no wide shot,
   no IMAG of the entrance.
3. **Watch the stage** off-program (preview / room monitor), not the broadcast, to know
   when the choir is all in place.
4. **Only when the choir is fully set:** cut the choir onto the program and take the
   holding graphic down — the reveal shows them already in place.

**Guard:** the reveal is gated on the choir being set, observed off-program — **never on
a timer.** If in doubt, hold the graphic longer; an extra beat on the graphic always
beats catching the choir not ready. Same "decently and in order" posture the broadcast
course teaches for switching (1 Corinthians 14:40).

## Honest status (DR-0076)

Every item is `status: 'requested'` — the reviewer's directive, captured. Nothing here
claims the mix has been reset or the cue has been run; those become true when an operator
sets them and a reviewer signs off, and the history line records who/when.
