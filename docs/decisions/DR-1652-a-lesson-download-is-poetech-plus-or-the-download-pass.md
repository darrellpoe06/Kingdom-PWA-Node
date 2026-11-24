# DR-1652: A lesson download is PoeTech+ or the Download Pass

**Date:** 2026-11-24
**Status:** Accepted
**Tier:** C (real money: a new paid product; reader-facing on both doors; no schema)
**Type:** product
**Area:** `app/src/lib/lesson-download-access.js` (new), `app/src/components/DownloadAccess.jsx` (new), `app/src/components/LessonDownloads.jsx`, `app/src/components/ChurchLearn.jsx`, `app/src/components/DownloadNeedsAccount.jsx`, `app/src/lib/lesson-share.js`, `app/src/poe-financial-mvp-v28.jsx`, `app/src/__tests__/lesson-downloads-are-paid.test.jsx` (new), `app/src/__tests__/lesson-downloads.test.jsx`, `app/src/__tests__/lesson-share-public-route.test.jsx`, `app/src/__tests__/lesson-share-note.test.js`
**Sent in by:** Darrell, 2026-11-24: "Don't allow any lesson to be downloaded... we will now be charging a fee or if they have a subscription they can... make sense?"
**Pairs with:** DR-0698 (downloads need an account), DR-0722 (download one, a course, or every lesson), DR-1428 (PoeTech+ and the free levels), DR-1432 (the PoeTech+ checkout), DR-1448 / DR-1449 (one-off purchases reach the buyer), DR-0536 (sell the accompaniment, never the content)

## Context

Since DR-0698, any signed-in account could take any lesson away: the offline download (one lesson, a course, every lesson), Copy lesson (the full text), and the curriculum export (Copy markdown, Download .md, Print). Nothing was paid. The PoeTech+ subscription (DR-1432) and the one-off checkout (DR-1448/1449) already exist and already write the buyer's rows (`member_subscriptions`, `book_entitlements`).

## Decision

1. **Taking a lesson away is paid.** The offline download, Copy lesson and the curriculum export open only for a person who holds **PoeTech+ (or any higher tier)** or the one-time **Download Pass**.
2. **Reading and the reading voice stay free for everyone**, signed in or not, at every level. No one is ever kept from a lesson, so DR-0536 and DR-1428 hold unchanged. What is sold is the offline copy, not the content. Copy link and Share stay free.
3. **The Download Pass is a one-off product on the existing road.** It uses catalog id `learn-download-pass`, checkout `kind: 'book'`, and the webhook writes the buyer's `book_entitlements` row. No new table, endpoint or processor. **Its price lives only in `STRIPE_CATALOG`** (Darrell's custody). Until that entry exists, the server answers "not for sale" and the app shows no buy button for it.
4. **One answer for every door.** A provider at the top of Learn decides once, and every download door reads that answer. A family member's grant counts through the tier as before.
5. **Fail closed, say why.** With no provider, or with a database read that did not answer, the door stays shut and says the check failed, never "unpaid". A free account with neither sees one line saying downloading is part of PoeTech+ or the Download Pass. It is offered only what the server says is really for sale, plus "I already paid: check again", which really re-reads.

## Impact

- **The family coloring sheet and coloring book are not lessons** and stay signed-in-only, unpaid.
- **What this does not stop:** lesson bodies ship in the app bundle and show on screen, so a determined person can still save the page from the browser. This gate closes the app's own ways of taking a lesson away. Serving lesson bodies from the server behind RLS would be a separate, larger build. `re-review: 2026-12-22`
- **Downloads already saved on a device stay** where they are. This gate stops new downloads only.
- **Until Darrell adds the pass to `STRIPE_CATALOG`,** the only way through is PoeTech+, when its checkout is open. With neither open, the prompt says "Checkout opens soon. Nothing is charged until it does."

## Outcome

- `lesson-downloads-are-paid.test.jsx` (17): the access rule for every tier; what is for sale comes from the server, never assumed; the pass request carries no price; the prompt's words are tested with its buttons, including Buy, which really starts that checkout, and check again, which really re-reads; a failed read fails closed.
- Proven to catch: with the gate line removed from the download door, `lesson-downloads.test.jsx` fails ("expected … to be null").
- **After merge:** open Learn signed in on a free account and confirm the purchase prompt at a lesson's Download. Then add `"learn-download-pass": <cents>` to `STRIPE_CATALOG` in the Cloudflare Pages env and confirm "Buy the Download Pass" appears.
