# Learning Zone Discovery: current prototype against the approved mockup

Status 2026-11-26: **comparison only. No visual revision has been made.** The prototype is private, on
`preview/learn-discover`. No pull request, merge, deployment or homepage integration.

- Reference (original, unaltered): `reference/approved-mockup.png` (1024 x 1536)
- Prototype rendered at the mockup's own proportions (512 x 768 CSS px at 2x): `comparison/prototype-screen-1..5.jpg`
- Side by side: `comparison/cmp-0-whole-page.jpg` (whole page) and `cmp-1` to `cmp-5` (section by section)

## The finding that matters most: density

The mockup fits the whole experience on **one 768-pixel screen**. The prototype, at the same width, is
**2,460 CSS pixels long, 3.2 times the length**, and shows the first section and little else.

| | Mockup | Prototype |
|---|---|---|
| Welcome banner height (CSS px at 512 wide) | about 100 | 430 (56% of the screen) |
| Sections visible on the first screen | 8 (banner, search, topics, continue, word, series, courses, nav) | 2 (banner, search) |
| Whole page | 768 px | 2,460 px |

Most of the other differences follow from this. The mockup is a compact, dashboard-dense layout in
which every section is one short band; the prototype uses tall, roomy, scrolling rails.

## Section by section

### 1. Welcome banner and search (`cmp-1`)

| | Mockup | Prototype |
|---|---|---|
| Layout | Wide short banner: family on the left, the title block on the right | Photo fills the width; the title sits over the photo's lower part |
| Title | "The Word" in large gold serif, "Learning Zone" in gold script, tagline "Bible Truth for Everyday Life", an open Bible | Plain white Montserrat "Welcome to the Learning Zone", small gold eyebrow |
| Background | Deep red gradient with a soft glow and a sweeping curve | Flat near-black |
| Family | Four people: father, mother, two children, close crop, saturated | A three-generation family in a field; wide, face crops are loose |
| Search | One red frame with a glowing gold border; a white pill; a mic button; a gold "Search" button; a helper line | A dark pill with a placeholder that rotates through example questions; a separate full-width gold "Browse All Lessons" button under it |
| Placeholder | "What are you facing today?" | Rotating example questions (the heading you asked for is not there yet) |

### 2. Explore by Topic (`cmp-2`)

| | Mockup | Prototype |
|---|---|---|
| Layout | 5 x 2 grid of ten equal tiles, all visible at once, "View All Topics" link | One horizontal rail of twelve tall cards (150 x 190), about two and a half visible |
| Tile | Photo fills the tile; 1.5 px rounded gold border; centred white label at the bottom; no counts | Photo with a dark gradient panel at the bottom; label, then a gold lesson count; a dark-grey border (gold only when selected) |
| Count | None | Real lesson count (kept) |
| Categories shown | Ten (Faith, Mental & Emotional Wellness, Marriage, Parenting, Personal Growth, Money & Stewardship, Real Estate & Ownership, Career & Business, Understanding the Bible, Church & Ministry) | The twelve verified categories |
| Photos | Purpose-made: raised hands at sunset, a graduate, jars of coins with a sprout, a house exterior, a church building, a close-up Bible | Existing lesson covers: mostly adults in blue in bright interiors |

Names in the mockup map onto the twelve like this: Personal Growth to Purpose & Personal Growth;
Money & Stewardship to Money & Financial Stewardship; Real Estate & Ownership to Real Estate &
Homeownership; Career & Business to Business & Entrepreneurship; Understanding the Bible to Bible Study
& Scripture; Church & Ministry to Leadership & Ministry. **The mockup has no tile for History &
Understanding Our World or for Technology, AI & Innovation.** Both stay (you asked for all twelve).

### 3. Continue Learning and Today's Word (`cmp-3`)

| | Mockup | Prototype |
|---|---|---|
| Arrangement | Side by side in one row: Continue Learning (left, about 60%), Today's Word (right) | Stacked: a rail of tall Continue cards, then a separate Today's Word block |
| Continue | One wide banner card: photo thumbnail left, a red panel with the lesson title, the course name beneath, a gold progress bar with "37% Complete", a round play button, a gold border | A rail of 16:9 photo cards with a thin red progress bar, the title below, the course in gold |
| Today's Word | A distinctive card: a gold header strip with a calendar icon and "Today's Word" in serif, a red body, a short thematic title ("A Heart That Trusts God"), the reference, an open Bible on the right | A dark card with the whole verse text in serif, the reference, a "Go deeper" link |

### 4. Featured Series (`cmp-4`)

| | Mockup | Prototype |
|---|---|---|
| Content | Five **series** (Overcoming Anxiety, Building a Stronger Marriage, Biblical Money Management, Identity & Purpose, Walking in God's Plan) | **Lessons** (the four records flagged "featured"), plus two collections below |
| Tile | Small cinematic thumbnail, gold border, a white centred title on the photo, a next-arrow button | Large 16:9 card with the title, original title and course underneath |
| Density | One row about 100 px tall | Cards about 260 px tall |

### 5. All Courses (`cmp-5`)

| | Mockup | Prototype |
|---|---|---|
| Content | Filter chips (All Courses, Bible, Life Skills, Business, Leadership, History, Youth) and six compact cards: photo thumbnail, title, lesson count, gold border | **Absent as a list.** Five small access tiles (All Courses, All Departments, My Learning, Study Tools, Downloads), then a red "Browse All Lessons" button |
| Counts | "338 lessons", "18 lessons", "12 lessons" | Not shown |

### 6. Header, tabs and bottom navigation (not compared)

The mockup includes the church app's own header ("The Love Corner... Where Love Lives"), its tab strip
(Home, The Word, Learn Studio, Institute, Ministries, Kids & Youth, More) and a bottom bar (Home,
Messages, Events, Learning, Institute, Ministries, Give, Read). Those belong to the app shell and to the
church homepage redesign. The prototype renders only the page content, so they are neither built nor
compared.

## Specific visual differences, ranked by how much they change the look

1. **Density**: described above. The largest single difference.
2. **Background**: the mockup sits on a deep red-to-black gradient with red panels; the prototype is flat near-black. This is most of the "rich red, black, white and gold" identity.
3. **Gold rounded borders**: every card and the search frame carries a 1.5 to 2 px gold outline with a slight glow; the prototype has almost none.
4. **Title block and hero art**: gold serif and script lettering with an open Bible, against a plain heading.
5. **Search frame**: framed, glowing, with a mic and a gold Search button; the prototype is a plain pill and has no button or helper text.
6. **Topic grid**: all tiles visible, equal, labelled on the photo; against a scrolling rail of taller cards with a text panel.
7. **Side by side Continue and Today's Word**, with Today's Word as a gold-and-red card.
8. **Series and course rows**: missing or different (series absent, courses absent).
9. **Photographs**: the mockup's pictures are close, saturated, expressive and purpose-made for each tile; the prototype's are the existing covers.
10. **Type**: the mockup uses a bold system sans for section headings (white, about 22 px at 512) and white labels on photos; the prototype uses Montserrat 800.
11. **Corner radius**: the mockup's tiles are about 10 to 12 px; the prototype's are 16 px on categories and 12 px on cards.

## Recommended design changes

Nothing below is built. Order is by impact.

1. **Rebuild the layout to the mockup's rhythm.** One compact band per section, 8 to 12 px between bands, so that the first screen holds banner, search, topics, continue and word, series and courses, as the mockup does. Move the two collections (Relationships, Newest) below the fold as compact rows; they stay.
2. **Banner.** A short wide banner (about 100 to 130 px on a phone, taller on tablet and desktop) in the mockup's arrangement: family left, title block right, on a red gradient. Title and tagline as live text (so it scales, translates and is readable by screen readers), with the family photograph and the Bible art as image layers.
3. **Search.** Reproduce the framed gold-and-red search with a white pill, the placeholder "What are you facing today?", a gold Search button, and the helper line. Keep the nine suggested questions as tappable chips that appear when the field is focused (so the mockup's clean look is kept). Keep the live results.
4. **Explore by Topic.** An equal-tile grid with gold rounded borders and labels on the photo. All twelve categories, as two rows that scroll sideways on a phone (about three and a half tiles in view) and a 6 x 2 grid on tablet and desktop; "View All Topics" opens the twelve. Lesson counts stay, as a small chip on the tile.
5. **Continue Learning + Today's Word as one row.** The most recent saved lesson as the mockup's wide banner card with a real progress bar, a real percentage and a play button; further saved lessons as a small rail beneath it only if there are any. Today's Word as the gold-and-red card.
6. **Featured Series.** A one-row cinematic strip. I recommend defining each series as a **curated collection of real lessons** (see limitation 3), with the lesson count shown on open.
7. **All Courses.** Real filter chips and six compact cards with each course's real cover and real lesson count, with a "View All Courses" link that opens Learn. All 51 courses already have a cover image.
8. **Browse All Lessons.** The mockup has no such button, and you require one. I would put a gold pill in the All Courses header and keep a full-width one at the bottom.
9. **Colour and themes.** Define the palette as variables (red, black, white, gold) so the mockup's look is the default and each existing theme can override them, instead of the current always-dark values.
10. **Type and corners.** White bold section headings, the mockup's smaller radii, 12 px minimum label text.

## Limitations that prevent the intended appearance today

1. **Photographs.** The mockup's tiles are purpose-made pictures, and the existing covers cannot imitate them. The mockup itself cannot supply them: each tile is only about 100 x 60 px inside a flattened image. **The minimum set of new pictures the mockup needs is about 18**: the banner family, twelve topic tiles (ten if the two additions stay on existing covers), five series thumbnails, plus the Continue thumbnail. That is fewer than the 54 I recommended earlier, and it is an overlap, not a replacement, of that list. Your six ChatGPT samples are best spent on the banner, Faith, Marriage, Parenting, Money and Real Estate.
2. **Banner lettering.** The title uses a gold serif and a script face. The app ships Montserrat and Fraunces, not a script. I can bundle a free open-licence script face, but I have not checked that this sandbox can fetch one. The fallback is to place the lettering in the banner picture you create, at a cost to scaling and accessibility.
3. **Series are an editorial decision, not data.** The five series in the mockup are not courses; the curriculum has no object with those names. Each would be a curated list of real lessons. I can draft the lists from the curriculum (for example Overcoming Anxiety from the stress and worry lessons), but you should approve them and their names.
4. **Some mockup numbers are illustrative.** The mockup shows 18 lessons for Torah & History (real: 21), 12 for "Leadership & Stewardship" (the nearest course, Management Is Stewardship, has 9) and 12 for The World Market (real: 10). The page will show the live counts, which will differ from the picture.
5. **Filter chips.** The mockup's chips (Bible, Life Skills, Business, Leadership, History, Youth) do not match the 13 real departments. I would show the real departments (or a grouping you approve).
6. **Today's Word.** The mockup shows a thematic title ("A Heart That Trusts God") that is not in the data. I would use the lesson's own promotional headline, with the verbatim King James text one tap away. Proverbs 3:5-6 is the anchor of some existing lessons, so that example is reproducible.
7. **Microphone.** The mic needs speech-to-text. The app has a voice-input component (`OneVoiceInput.jsx`), but I did not find how it transcribes, so I do not know if it is private or free. Browser speech recognition sends audio to the browser vendor and is uneven on iPhone. I will not add a mic until you decide.
8. **The shell.** The header, tab strip and bottom bar belong to the church homepage redesign, so the page cannot show the mockup's full-screen composition until it is integrated, which is not authorized.
9. **Contrast.** White labels on bright photographs need a light shadow or scrim to stay readable. You asked for no unnecessary dark overlays; I would use a short, soft scrim on the label strip only and measure contrast on every tile before finalising.
10. **Themes.** Learn Studio itself is always dark. I have not yet checked how the shell applies the user's selected theme (default, midnight, night, heritage) to a surface, so the theme behaviour of the new page is unverified.

## What is not affected

Functionality is unchanged: search over the full curriculum, the twelve categories, Continue Learning
from real saved places, Today's Word from the shipped text, the five routes into Learn, the preserved
curriculum, titles, promotional records (still in review status), photographs, and the regression
tests.

## Decisions needed from you

1. Approve the layout direction above (compact, mockup rhythm), or mark what to keep from the current roomy version.
2. Display names for the twelve tiles: the mockup's short names with the full name as the accessible label, or the full names.
3. Featured Series: I draft the five lessons lists for your approval?
4. All Courses chips: the 13 real departments, or a grouping.
5. Microphone: wait, or use the existing voice component after I verify how it transcribes.

---

# Update 2026-11-26: the redesigned page against the mockup

The comparison above is of the **first** prototype. Darrell approved the compact direction the same day and the page was rebuilt. Revised screenshots: `revised/`; revised side-by-sides at the mockup's own proportions: `comparison/rev-0-first-screen.jpg`, `rev-1-second-screen.jpg`, `rev-2` to `rev-5`.

## What now matches

| Mockup feature | Revised page |
|---|---|
| Short wide banner, family left, lettering right, red gradient | Done. Live text: "The Word" in Playfair Display, "Learning Zone" in Great Vibes (both open licence, bundled), the tagline, an open Bible illustration |
| Framed red search with gold glow, white pill, "What are you facing today?", gold Search button, helper line | Done, with the nine suggested questions as a scrolling row under it |
| Explore by Topic: equal photo tiles, gold rounded borders, label on the photo, View All Topics | Done: two sideways-scrolling rows on phones (five across from 480 px), 6 x 2 on wide screens, all **12** categories, a live count chip on each tile, short names with the full approved name as the accessible label and on the category page |
| Continue Learning and Today's Word side by side | Done from 480 px; stacked and compact below. Continue shows real saved progress with a play button; Today's Word has the gold header and red body |
| Featured Series, cinematic strip with next arrow | Done: five series, each opening its ordered lesson list (marked "Proposed lists" until approved) |
| All Courses: filter chips and compact photographic cards with lesson counts | Done with the **13 real departments** as chips and live counts |
| Dark red-black wash, gold accents | Done in the Night theme; the other 11 themes follow their own surface |
| Density | The first screen is now banner, search, topics, then Continue and Today's Word. The full page is 4,100 px at the mockup's width (it was 4,920 px) because the extra sections below the mockup's content remain |

## Remaining differences (and why)

1. **Photographs.** The mockup's tiles are purpose-made pictures; the revised page uses existing lesson covers. This is the largest remaining visual gap and waits on the six ChatGPT samples.
2. **Banner art.** The mockup's four-person family and illustrated Bible are one composed picture; the page uses an existing three-generation cover and a drawn open Bible.
3. **Microphone.** Not shown (decision pending; see `INVESTIGATIONS.md`).
4. **App shell.** Header, tab strip and bottom bar are the homepage redesign's, not built here.
5. **Ten tiles in the mockup, twelve here.** History & Understanding Our World and Technology, AI & Innovation are kept, as requested.
6. **Today's Word.** The mockup shows a thematic title and a reference. The page shows the lesson's own headline and the reference, with the verbatim King James text one tap away.
7. **Extras below the mockup's content:** Featured Lessons (kept separate from Featured Series), the Relationships and Newest collections, and the "Everything in the Learning Zone" row with a second Browse All Lessons button. These carry the functional requirements the mockup does not show.
8. **Counts.** The mockup's lesson counts are illustrative; the page shows live ones (for example Torah & History is 21, not 18).
9. **Tile count chips and the suggested-questions row** are additions; the mockup has neither.
