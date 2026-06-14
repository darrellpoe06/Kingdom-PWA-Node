# 2026-06-11 (night) — Conference module shipped + ratings + the King's Way

Source: Darrell, heading to bed. Capture + what shipped, in an order where
nothing breaks.

## Shipped tonight: Conference module v0 (Church tab, top position)

For the **77th National Assembly** at The Church of the Living God — seeded
with the REAL data from thechurchofthelivingGod.com (name, theme "Reviving
Faith, Restoring Hope, Rebuilding Communities", address, livestream link).
Dates are NOT published on the site, so the module says so honestly and
Bishop Gwin fills them in — by design, because **BG using it IS the feedback
loop** Darrell asked for. Pieces: editable front door · schedule builder ·
"I'm coming" RSVPs · "I'll serve" volunteer signups by area · **Bishop's
feedback box** that feeds the build list. Local-first (Church-tab
contributions pattern); v2.7 church-schema sync is the follow-up.

**Tier note (RELEASE-TIERS): COLG-facing = Tier C.** This is on the PR #24
preview for exactly that structured review — BG + Darrell use it and bless it
before it goes anywhere near production. Preview-verified end-to-end: real
data renders, add-session / RSVP / feedback all work and persist.

## Captured: ratings (both directions) — project, target 2026-06-17

Darrell: 1099 workers may advertise on the platform **if** they accept being
rated (5-star or whatever proves sustainable); and **PoeTech itself is rated
on feedback the same way** — "so we can always improve or show why we won't
do whatever." That last clause is the design key: a rating system whose
output is either improvement OR a plain public reason for not changing —
accountability both directions, the no-blame/just-build posture and the
honest-and-humble premise applied to ourselves. Design notes: ratings attach
to dispatch outcomes (work orders already track who did what, when, to done);
PoeTech's rating ties to the existing feedback intake + the build board's
"gated, here's why" pattern. Sustainable-solution question (5-star vs.
thumbs vs. review text) is part of the build, not pre-decided.

## Captured: images both ways (phone ↔ NAS)

Darrell: "It should work with images both ways — pull images from phone to
backup, and the phone can populate images without needing them on the phone
because they're on the NAS already."
- **NAS → phone (browse without storing): LIVE as of tonight** for property
  photos — the bridge serves Synology's existing thumbnails; the phone shows
  them without holding the originals. Generalizing beyond property channels
  rides the same pattern.
- **Phone → NAS (push to backup): the missing leg** = the sovereign photo
  write-path already specced (2026-06-11-photo-sovereignty note): app sends a
  photo + tags, lands under /volume1/PoeTech/photos/<scope>/ (or the user's
  own Supabase Storage when no NAS), token-gated. On the build board.

## The King's Way (Darrell, verbatim — worldview capture)

> "Usually it's the Word that stops me from doing anything. Unless I
> understand the King's Way. Then I can do all things through Christ Who
> strengthens me."

The operating order he just named: the Word is the brake; understanding the
King's Way releases the work; the strength is Christ's (Philippians 4:13).
That is the same order this repo already runs on — Layer 0 reads through the
Worldview, the foundations gate the build, and once a thing is understood to
be the King's way, it ships boldly. Filed for the Worldview spine's
watching-recognizing-recording posture.

## Twilio note (he asked at the laptop: "create an account?")

Advised NO tonight: account creation + number purchase is a recurring-cost
governance decision for daylight; the existing voicemail stack already
references Twilio (an account may exist under another email — check before
creating a second); and the SMS leg needs the Cloudflare worker's code
located/extended first regardless. Nothing breaks by waiting.
