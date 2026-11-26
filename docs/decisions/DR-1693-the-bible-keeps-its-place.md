# DR-1693: The Bible keeps its place

**Date:** 2026-11-26
**Status:** Accepted
**Tier:** B (every reader of the in-app Bible; no schema; one new device-local key)
**Type:** fix
**Area:** `app/src/lib/bible-place.js` (new), `app/src/components/BibleReader.jsx`; `app/src/__tests__/the-bible-keeps-its-place.test.jsx` (new), two Bible test files reset the key between cases
**Sent in by:** Darrell, 2026-11-26 (screenshot of Church > Scripture): "the Bible should stay at the last location that it was at, that you were using it. So that way you don't have to go back and then jump back to where you were already at. It should keep its locations."
**Pairs with:** DR-1671 (the Read place survives the landing), `lib/learn-resume.js` (the device-local place pattern)
**Narrative:** `docs/99-session-notes/2026-11-26-the-bible-keeps-its-place.md`

## Context

One reader, `BibleReader.jsx`, sits behind every door into the Bible: the Church Scripture tab, the bottom-bar Bible button, and the Institute, Love Corner and Kids "Scripture" tiles. It held book, chapter and verse in React state only. The edition was already remembered per device (`poetech.bible.edition`).

## What was measured

In Chromium at 412 px (vite dev, the test-stub Supabase): read John 3 to verse 16, then reload. The page opened at Genesis 1, verse 1. The code shows the same for a tab switch, because the reader unmounts and its state is lost. After this change the same journey, with a real in-app switch to Ministries and back (same document), lands on John 3:16 centred and marked, and so does a reload.

## Decision

1. **One remembered place per device** (`poetech.bible.place`): book, chapter, verse and a timestamp. No text. It is kept only if it names a real book, chapter and verse, and it fails soft on bad JSON or blocked storage.
2. **Opening order:** a deliberate jump first (the lesson timeline link that names a book, `lib/bible-timeline-link.js`), then the saved place, then Genesis 1. Whatever opens becomes the place. Jumps inside the reader (a typed reference, a cross-reference, a theme anchor) also become the place.
3. **The verse in the middle of the screen is the place.** A landing centres the verse by measurement, so a landing reads back as the same verse whatever the header height. For 1.5 s after a landing a scroll is the page settling and is not saved; the reader's own touch, pointer, wheel or key ends that at once (the DR-1671 guard).
4. **The reader is told:** "Picked up where you left off: John 3:16" with **Books** (the list in one tap) and **Start at Genesis 1** (forgets the place). "All 66 books" is still one tap at all times.

## Impact

- Lesson verse chips still open the Word in place and never navigate (DR-0201), so today the timeline link is the only lesson link into the reader. A future "read in context" link would use the same jump path.
- The place is per device, like the edition and highlights; it is not synced to an account.

## Verification

- `the-bible-keeps-its-place.test.jsx`, 14 cases: remount, reload (storage), bad JSON, an unknown book, throwing storage, the jump overriding the saved place, Start at Genesis 1, and the scroll follow with the settle guard.
- Proven to catch (run 2026-11-26): with the restore removed, 8 cases fail. With the settle guard removed, the scroll case fails.
- Screenshot proof at 412 px: reading John 3:16, on Ministries, back on Scripture, after reload (session note).

`re-review: 2026-12-10` (on Darrell's phone, confirm that the bottom-bar Bible and the Scripture tab both reopen at the last verse read).
