# 2026-11-26 — The Bible keeps its place (DR-1693)

Darrell, with a screenshot of Church > Scripture: "the Bible should stay at the last location that it was at, that you were using it. So that way you don't have to go back and then jump back to where you were already at. It should keep its locations."

## Reality trace

- **Surfaces.** One reader, `app/src/components/BibleReader.jsx`, mounted by `ScriptureLibrary.jsx` as its "The Word · Full Bible KJV" section (the default section). Every door into the Bible opens that same section: the Church sub-tab Scripture, the phone bottom-bar Bible (`lib/church-tabs.jsx` `church-bible` → `churchView: 'scripture'`), and the Institute, Love Corner, Kids and Teens Scripture tiles (`setChurchView('scripture')`). The Church sub-tab "The Word" is the pulpit (sermons), not the reader.
- **State before.** `book`, `chapter`, `focusVerse` were `useState('Genesis')`, `useState(1)`, `useState(null)`, so every mount started at Genesis 1. The edition was already kept per device (`poetech.bible.edition`, `lib/bible-kjv.js`). Nothing followed the scroll position; `focusVerse` coloured a verse but never scrolled to it.
- **Verse links.** `VerseChips` opens verses in place and deliberately never navigates (DR-0201). The only lesson link into the reader is the timeline link (`lib/bible-timeline-link.js`), a one-shot sessionStorage wish naming a book.

## Measured (Chromium, 412 x 915, vite dev with the test-stub Supabase)

| Step | Before | After |
| --- | --- | --- |
| Read John 3, scroll to verse 16 | John 3, v16 on screen | same, `poetech.bible.place` = John 3:16 |
| Switch to Ministries, back to Scripture (same document) | (reload measured) Genesis 1 | John 3, v16 centred and marked |
| Reload | Genesis 1, v1 | John 3, v16 centred and marked |

The first landing used `scrollIntoView({ block: 'center' })` and stopped short (v16 at 283 px, not centred on 457), so the read-back drifted to v18-v20. The landing now centres by measurement with `window.scrollBy`, and v16 sits at 423-492 px of 915, read back as v16.

Proof: `docs/design/bible/2026-11-26-the-bible-keeps-its-place.png` (reading, on Ministries, back on Scripture, after reload).

## Tests and the gate

`app/src/__tests__/the-bible-keeps-its-place.test.jsx`, 14 cases, all pass. With `openingPlace` ignoring the saved place, 8 fail. With the settle guard removed, the scroll case fails. `bible-reader-render` and `the-timeline-lives-in-the-bible` now clear the place key between cases, since each case there expects Genesis 1.
