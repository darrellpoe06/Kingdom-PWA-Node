# ENTRANCE-REVIEW — every customer entrance is reviewed before customers walk in

**Binding rule, declared by Darrell 2026-07-07:**

> "Can we review all import spots for usability, comprehensively and other
> UIUX potential issues before she has customers enter this app and this is a
> Way and document the results each time for recording purposes?"

**Before any business door (or any surface) takes real customers, every
entrance and input spot on it is reviewed for usability — comprehensively,
observed on the running build, and the results are RECORDED every time.**
Layer 3 foundation; recorded as DR-0118. The first run (the Moore Divahs
door, same day as this declaration) is REV-0013 in `docs/reviews/REVIEWS.md`.

## When it runs (the triggers)

1. **Before first customers** — a new business door never takes its first
   real customer without a completed entrance review on record.
2. **After any material entrance change** — new form, new auth path, new
   tab, new install flow on a live door → the review re-runs on the changed
   spots before the change is called done.
3. **It rides the factory** — CLIENT-BUSINESS-FACTORY step 6 (the branded
   door) is not complete until this review is recorded; it sits beside the
   Tier C front-door sign-off (RELEASE-TIERS) and the live user-view pass
   (DR-0104), it does not replace them.

## What it reviews (the entrance checklist)

Every **entry spot** (how a customer arrives) and every **input spot** (where
a customer types or taps), walked one by one:

- **Arrival:** the share link / QR entry page, install-to-home-screen, the
  in-app-browser path (IG/FB/TikTok webviews) with its hint, load behavior.
- **Failure honesty:** nothing may hang silently — every fetch settles to
  real content or an honest named state within a deadline (the 2026-07-07
  door-hang standard: `public-rpc` deadline + DoorAuth timeout). "Loading…"
  forever is a finding, always.
- **Auth:** User login / Admin login visible signed-out; signed-in states
  honest; the customer-view lens tells the truth.
- **Every form:** labels (aria + visible), the RIGHT mobile keyboard
  (`inputMode`/`type`), autofill (`autoComplete`), multi-line where the ask
  is a sentence, visible sending/success/error states with human copy,
  consent language present where contact info is captured.
- **Tap targets:** interactive elements on the money path at ~44px effective
  height; nothing under ~36px anywhere a customer must tap (small visual ≠
  small hitbox — pad the button, keep the dot). The audience standard is
  COMMUNITY-FIRST: elderly, tech-novice hands are the design case.
- **Comfort:** theme swatches + text-size steps work on the door; largest
  text size breaks no layout; both light and dark themes pass contrast (the
  contrast gate is the floor, the review looks at real screenshots).
- **Empty states:** honest and warm — never a blank section, never painted
  data (SEED-DATA-AS-ASPIRATION governs tone; DR-0076 governs truth).
- **Copy:** the business owner's own policies at the point of order; no
  internal jargon; the owner's private values (sign-in email) never render.

## How it observes (DR-0076 — no claims without evidence)

The review is run against the RUNNING build, not the source alone: a real
browser pass (Playwright on the built app, mobile viewport, light + dark) or
the live site, with a DOM audit for tap-target sizes, duplicate labels, and
input attributes, plus screenshots kept with the record. Static code review
supplements; it never substitutes for observation.

## The record (every time, no exceptions)

Each run appends a **REV record** to `docs/reviews/REVIEWS.md` (`Type:
ui-ux`, `Surface: entrance — <business/door>`) listing what was walked, what
was found, what shipped as a fix in the same session, and what was parked
with a why + `re-review:` date (DR-0075 — never a silent drop). Large runs
also leave a dated Layer 4 session note. The in-app Quality panel reads the
same registry, so the review is visible where the work lives.

Pairs with: DR-0104 (live user-view review), RELEASE-TIERS (Tier C front
door), VERIFICATION-DOCTRINE (evidence), ANXIETY-CLARITY-PRINCIPLE (every
surface answers what/when/why/how), COMMUNITY-FIRST-MISSION (whose hands),
CLIENT-BUSINESS-FACTORY (step 6), WAYS-REVIEW (DR-0108).
