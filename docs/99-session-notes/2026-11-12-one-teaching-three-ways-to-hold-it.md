# 2026-11-12 — One teaching, three ways to hold it: the store's product line from every course

Narrative for **[DR-1448](../decisions/DR-1448-one-teaching-three-ways-to-hold-it.md)**.
Branch `ccr-9828ca3e-88puaw`.

## What Darrell asked

In substance: we have a store; this book as a paid resource; a course with no
teacher under paid PoeTech, with a video of each section walking through it;
an in-person paid workshop whose cost varies by location, the going rate for
the area, the kind of knowledge, whatever works for demand. Then an Adobe
Acrobat share link: "the course is the link". Then: how many books can we
make out of my courses, each appropriate for a book?

## What was already true (read before building)

- The store is the Bookstore inside Library, three hand-typed products, Stripe
  through Cloudflare Pages Functions, the firewall of DR-1438.
- A course already becomes a book (`book-corpus.js`, `bookFromCourse`), but
  only six courses were listed by hand.
- Lessons carried no video field. The conference tables had no price. There
  was no ticketing anywhere.
- The webhook wrote the ledger for a book sale and called
  `grant_book_entitlement` nowhere. Nobody was ever handed a book they paid for.

## The Acrobat link

acrobat.adobe.com is outside this environment's network allowlist. The request
to allow it was declined, and the document is in neither Drive nor Gmail. So
that source is listed in the app as awaiting, with the reason, and no product
is painted over it. The fastest road is to save the PDF into Google Drive
(the Drive connector is attached) or commit it to the repo; either makes it a
recipe the same way the courses are.

## The measurement behind the book count

The curriculum export per course carries the facilitator run of show, the quiz
and every age rewrite. Counting it gave 2.55M words across 45 courses. A
reader's book draws only the lesson body, big idea, benefits and try-it note
(what `lessonModuleToSource` consumes): 1.98M words. Every answer is on the
body.

Live result: 10 titles in 30 volumes. Five standalone (Living Lessons 1.12M
words in 15 volumes, Sovereign A.I. 332k in 5, World Issues 100k in 2, Made in
Time 24k, Healthy Living 23k); five department compilations (Real Estate 103k
across 12 courses, Stock Market 36k, Kingdom Life & Stewardship 34k, Serve the
House 33k, History 20k); twelve chapter-sized courses remain with their
department. The thresholds are the house's own policy, stated in the module so
they can be argued with.

## What shipped

- `course-book-fitness.js`: the measurement, the thresholds, compilations,
  every course placed once.
- `learning-products.js`: book, course and workshop derived from each registry
  entry; the awaiting-source list.
- `lesson-video.js` + `LessonVideo.jsx`: a lesson's `video` field resolved to
  YouTube or a same-origin file; section coverage measured; the player mounts
  above the lesson arc in ChurchLearn (two lines; budget raised to the
  measured size).
- `workshop-pricing.js`: knowledge type, place tier, format, demand; the Word's
  workshops at $0.
- Migration 0322: `workshop_events`, `workshop_registrations`,
  `workshop_seats_left()`; open rows readable by anyone, the house's members
  open and edit events (owner-scoped RLS), only the service role seats.
- `checkout.js`: `kind: workshop` priced from the row the server reads; a
  signed-in book buyer is verified and stamped so the webhook can grant.
- `stripe-webhook.js`: the firewall admits workshop; `bookEntitlementGrant`
  calls the grant function; `workshopRegistrationChange` upserts the seat.
- `book-entitlements-cloud.js`: the store reads the buyer's own rows, so a book
  is owned on every device.
- `LearningShelves.jsx`: the course shelf, the workshop shelf, the Governor's
  measured book count and seat-price calculator.

## Found on the way

- A short-book course was counted both as a title and inside its department's
  compilation. The placed-once check caught it before it shipped.
- Banking sits in Kingdom Life & Stewardship, a spiritual department by the
  registry's own declaration; its course is free and its workshop an offering.
  The first draft of the test assumed otherwise; the code was right.

## What is still open

- The first live seat and the first live book grant are the watched steps:
  they need Christina's Stripe key on the Pages project (DR-1436) and
  migration 0322 applied by the db lane. Nothing is a hand: the Governor opens
  an event from the store panel; the lanes carry the rest
  (`re-review: 2026-11-26`).
- No walk-through video exists yet; every section reads "0 of N recorded".

## Later the same morning: the sovereign storefront (DR-1449)

Darrell sent a Payhip storefront link ("make our store have this
capability"), then asked whether we need Payhip at all or can do it
sovereign. The answer built: a public `store` surface on our own door, the
server's open list instead of a build flag, one catalog entry shape for
fixed, pay-what-you-want and bundle pricing (mirrored between
`store-pricing.js` and `checkout.js`, conformance-tested), Stripe promotion
codes, and instant delivery on return from Stripe (`/api/deliver` says what
was bought; the device builds the EPUB). Neither payhip.com nor the Acrobat
document is reachable from the sandbox; both are filed as research items
for the NAS lane (`7b4128a5`, `e8294305`) on the COLG instance, where the
research section reads them.

Two measurement errors of my own this session, both recorded in DR-1136's
class: a guard piped through `tail` read as green while failing, and a
merge commit carrying conflict markers reached the branch before the guards
were re-run with their real exit codes. The endpoint register and the
format guard read only tracked files, so a new function must be added to
git before either regenerates.
