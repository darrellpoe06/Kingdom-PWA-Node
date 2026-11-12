# DR-1447: One teaching, three ways to hold it: the book, the self-paced video course, the in-person workshop seat

**Date:** 2026-11-12
**Status:** Accepted (built and proven; the first live seat and the first video are the watched steps)
**Tier:** C (real money on two new checkout kinds; a schema)
**Type:** decision
**Area:** `lib/course-book-fitness.js`, `lib/learning-products.js`, `lib/lesson-video.js`, `lib/workshop-pricing.js`, `lib/workshops.js`, `lib/book-entitlements-cloud.js` (new); `functions/api/checkout.js`, `functions/api/stripe-webhook.js`; `components/LearningShelves.jsx`, `LessonVideo.jsx`, `Bookstore.jsx`; migration 0322
**Sent in by:** Darrell, 2026-11-12, in substance: we have a store; this book as a paid resource; a course with no teacher under paid PoeTech, a video of each section walking through it; an in-person paid workshop, its cost varied by location, the going rate for the area, the kind of knowledge, whatever works for demand. And: how many books can we make out of my courses?
**Pairs with:** DR-1428 (PoeTech+ opens the rigorous levels), DR-0536 (sell the accompaniment, never the content), DR-1432, DR-1437, DR-1438 (the firewall), DR-0051 book commerce, DR-0076

## Context
The Bookstore sold three hand-typed books; the Learn tab held 45 courses; the conference tables had sessions with no price; lessons had no video field.

## What was measured
- **The curriculum export overstates every course.** It carries facilitator notes, quiz and age rewrites: 2.55M words against 1.98M of the body a reader's book draws from. The answer is measured on the body only.
- **Books from the courses, on the live registry (45 courses): 10 titles, 30 volumes.** Five courses are a book on their own: Living Lessons (1.12M words, 15 volumes), Sovereign A.I. (332k, 5), World Issues (100k, 2), Made in Time (24k) and Healthy Living (23k). Five departments gather into one each: Real Estate (103k, 12 courses), Stock Market (36k), Kingdom Life & Stewardship (34k), Serve the House (33k), History (20k). Twelve chapter-sized courses stay with their department.
- **The ledger counted every book sale and `grant_book_entitlement` was called nowhere.** A buyer paid and was never handed the book. The seam read `metadata.productId`; the server wrote `metadata.product`.
- **The Acrobat share link could not be reached from this sandbox** (host outside the allowlist; the allow request was declined). That document is listed as awaiting its source, with no product painted over it.

## Impact
The store now derives a book, a course and a workshop from every registered course; a paid book reaches its buyer on every device; a seat can be sold at the event row's price; the Governor reads the measured book count and a seat price with its parts.

## Decision
- **Derived, never typed.** `learning-products.js` builds the three products from `LEARN_CATALOG`; a new course lands with all three the day it mounts.
- **The book** is priced by measured size (full $19.99, short $14.99, booklet $7.99); a chapter joins its department. A spiritual department's book is a format of what is read free, as Living Lessons already is.
- **The course** walks its sections (the Word's divisions for a long course, else lesson by lesson); each lesson may carry `video: { url }`, YouTube or the app's own same-origin file; coverage is measured; nothing paints a player where none is recorded. Access is DR-1428's: free for a spiritual department, PoeTech+ for the rigorous levels of a PoeTech subject.
- **The workshop seat** is recommended from four named parts (knowledge type's day rate, place tier, format, last fill, clamped) and charged at the `workshop_events` row's price, which the server reads itself; the Word's workshops are an offering at $0. The seat and the book are a person's: the buyer is verified, the webhook writes `workshop_registrations` and calls `grant_book_entitlement`, and the firewall admits `kind: workshop`.
- **The Governor opens an event from the store's own panel** (owner-scoped RLS on `workshop_events`, as `book_products`): title, place, tier, format, date, seats, the recommended price editable, a going-rate note. `re-review: 2026-11-26` (the first live seat watched; the first recorded walk-through; the Acrobat document once it reaches Drive or the repo).

## Verification
- **7 new suites, 49 green**, plus `payments-functions` 20, `the-poetech-plus-checkout` 23, `book-commerce` 21. Proven to catch: a client-said seat price never reaches Stripe; a guest book pays and nothing is stamped; a signed-in book POST with a bad token is refused; the webhook's grant call and seat upsert are asserted by URL and body; a short book counted twice in a compilation was caught by the placed-once check before this shipped.
- **Lint clean; every gate green**, the flow graph with the three new nodes placed.
