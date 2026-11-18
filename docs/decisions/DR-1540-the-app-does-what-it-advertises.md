# DR-1540: The app does what it advertises: text size on every screen, giving in the app, Ask Ari asks

**Date:** 2026-11-18
**Status:** Accepted
**Tier:** B (congregation-facing surfaces; no schema, no money moving, no new road)
**Type:** decision
**Area:** `app/src/components/shell/LoveCornerHeader.jsx` (the Aa button); `app/src/components/ChurchGiving.jsx` (`ChurchGivingChannels`); `app/src/components/ChurchHome.jsx` (Give & Serve); `app/src/components/kids/KidsZone.jsx` and `KidsAdventure.jsx` (the Ask Ari card)
**Sent in by:** Darrell, 2026-11-18: *"Text sizing needs to be somewhere on the screen? Not just in the reader"*; *"The giving sections should be populated with the links and QR codes... not linked to the site"*; *"How do they ask Ari? No options?! We're advertising it!"*; *"The Love Corner App needs all capability possible so it's easy for the congregation."*
**Pairs with:** DR-0147 (text sizes), DR-0136 / DR-1066 (the church's own giving channels), DR-1523 (Ari in the kids lesson), DR-0061 (a surface is a live control, not a picture)

## Context

Three places promised something the screen did not offer. The text sizes lived in Personalize and the reader; nothing on the church door said they existed. The Give & Serve panel told a parishioner that giving "runs on the church's own website" and sent them there, while the Give popup two taps away already carried Zelle, Cash App, Givelify and PayPal with QR codes. The Kids Zone card advertised "Ask Ari" with no way to ask.

## What was measured

- The header carried search, the bell and the account; no text-size control on the church door at Normal (the escape hatch appears only once the text is already big).
- `ChurchHome.jsx` Give & Serve: a paragraph and a `Give →` link to `c.links.give`; the channels existed only in `ChurchGivePanel`.
- `KidsZone.jsx`: the Ask Ari card was a `<div>` with a sentence; Ari answered only inside `AriChat` in the opened lesson.

## Impact

A reader finds the text sizes where they are reading, one tap from any screen. A parishioner gives from the panel named Give, by the church's own channels, without leaving the app. A child who is stuck types the question on the card that invites it and the lesson opens with Ari already answering.

## Decision

1. **An Aa button rides the Love Corner header beside search**, on every screen, and opens Personalize, where the five sizes live. Its glyph is fixed in px so it never grows with the text it controls.
2. **One component carries the church's giving channels** (`ChurchGivingChannels`): the Give popup and the Give & Serve panel render the same cards from the same resolution (the church's own profile rows first, COLG's slide constants only for COLG). No surface sends a parishioner to the website to learn how to give; no payment data passes through the app.
3. **The Ask Ari card is a form.** The question typed there opens this week's lesson with Ari answering it once; Ari still talks only about the lesson, and a grown-up can read everything.

## Verification

- `lovecorner-header-render.test.jsx` (+1): the button, its label, Personalize with the size group. `church-home-render.test.jsx` (+1): the panel shows at least three channel cards with QR codes and no send-off. `kids-ask-ari-card.test.jsx` (1): a typed question opens the lesson, `ask` is called once with it, the reply shows.
- Stills under `docs/design/love-corner-kids/phone/words-read/` (05–08).
- `re-review: 2026-12-02` — the site sync (announcements, events) that Darrell asked for in the same breath is its own record once the runner probe has read the site.
