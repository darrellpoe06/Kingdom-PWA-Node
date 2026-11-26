# Learning Zone discovery: investigations (2026-11-26)

Private prototype on `preview/learn-discover`. Nothing here is public, merged or deployed.

## 1. Banner typography (free, appropriately licensed script font)

**Done, and live text, not baked into the photograph.**

| | Role | Licence | Files | Size |
|---|---|---|---|---|
| Playfair Display ExtraBold (800) | "The Word", the gold serif | SIL Open Font License 1.1 (Copyright 2017 The Playfair Display Project Authors, Reserved Font Name "Playfair Display") | `playfair-display-latin-800-normal.woff2` | 23 KB |
| Great Vibes Regular | "Learning Zone", the script | SIL Open Font License 1.1 (Copyright 2010 The Great Vibes Pro Project Authors) | `great-vibes-latin-400-normal.woff2` | 43 KB |

- Fetched from the open-source `@fontsource/great-vibes` and `@fontsource/playfair-display` packages (version 5.3.0) into an isolated scratch folder; only the Latin web-font file and the licence text of each were kept. Both licence texts are bundled beside the fonts (`app/src/components/learn-discover/fonts/OFL-*.txt`).
- The OFL allows bundling and embedding with software at no cost. It forbids selling the font on its own and forbids a modified font keeping the reserved name; neither applies, because the files are unmodified.
- The lettering is HTML text styled with `font-family`. It scales with the screen, is read aloud by screen readers, can be edited in the code, and falls back to Georgia and a system cursive if the font fails to load.
- The fonts load only with the discovery page (a lazy chunk), not with the rest of the app. Cost: 66 KB, once, then cached.
- Not checked: how the lettering looks on a real iPhone or Android (the preview was rendered in Chromium). The shape of the letters is the same everywhere; only anti-aliasing differs.

## 2. Microphone (existing voice component: privacy, function, cost)

**Left off the discovery page, as instructed. Findings:**

| | Short dictation (`lib/voice-dictation.js`, used by `OneVoiceInput`) | Long recording (`VoiceLessonRecorder`, `ConversationRecorder`) |
|---|---|---|
| How it works | The browser's built-in Web Speech API (`SpeechRecognition` or `webkitSpeechRecognition`) | Records the audio, then the church's own Whisper machines transcribe it |
| Cost | None. No vendor account, no API key, nothing stored by the app | None per use (the church's own hardware) |
| **Privacy** | **The audio is processed by the browser maker's speech service** (Chrome sends it to Google, Safari to Apple), not by the church. The app keeps no audio, but the audio does leave the device. | Private: stays on the church's machines. |
| Function | Instant, live text as someone speaks; push-to-end (a pause no longer ends it), 5-minute cap, no duplicate words (DR-0685) | Not live: record, send, wait for the transcript. Needs a connection to the church's server. |
| Where it works | Chrome and Edge well; Safari with limits; **Firefox not at all**. The app only shows a mic where the browser supports it. | Wherever recording is allowed and the server is reachable |
| Fit for search | Functionally right (instant, free) | Wrong shape (not instant) |

Not verified: I did not test either path on a phone, and I did not read the server-side Whisper setup. **Decision for Darrell:** a search mic on the free browser engine means a spoken question's audio goes to Google or Apple. If that is acceptable for a question like "why am I always stressed?", it is one line to add. If it is not, there is no private instant option today.

## 3. Themes (compatibility, without overriding anyone's choice)

The app has **12 themes** (`lib/theme-css.js`): Heritage, The Love Corner (red and white), Night (red, black and gold), TLC, Anchor, Bedrock, Cream, Snow, Glacier, Sapphire, Rose, Midnight. The shell applies one with a `data-theme` attribute and injects `THEME_CSS`. **The church door's own default is Night**, which is the mockup's red, black and gold.

How the page behaves:
- Colours come from the shell's own tokens (`--lc-paper`, `--lc-ink`, `--lc-muted`, `--lc-line`, `--lc-gold-ink`). The page **reads** the theme and never writes it (a test checks that mounting writes no preference).
- The page has no background of its own in the ten light themes, so the shell's themed surface shows through (Heritage stays ivory, Glacier stays cool). Only Night and Midnight get the red-black wash.
- The red panels and gold borders are the brand accent and stay in every theme.
- The preview harness injects the real `THEME_CSS`, and doing so **found a real bug**: that CSS paints every `<input>` per theme with `!important` (Night makes inputs near-black), which turned my white search pill into a black box. Fixed with a more specific rule; a harness that did not load `THEME_CSS` would have missed it.

Measured contrast of the page's real text against its real background, all 12 themes (WCAG AA needs 4.5:1; large text 3:1), from `themes/contrast.json`:

| Text | Lowest across the 12 themes | Highest |
|---|---|---|
| Section headings, links, card titles | 13.2:1 (Night) | 17.8:1 |
| Card original title, course count | 7.1:1 | 10.2:1 |
| Gold lesson meta (small) | 5.3:1 (Bedrock) | 11.3:1 |
| Everything on the red panels (search help, tagline, Continue, Today's Word) | 6.5:1 | 6.5:1 |

Zero console errors in all 12. **Not verified:** inside the real shell wrapper (the harness reproduces `data-theme` plus `THEME_CSS`, which is the mechanism, but not every wrapper the shell adds), and Dynamic Type / system font size on a real device.

## 4. Trending Lessons: not included

No genuine, privacy-safe activity data exists for the Learn client to read. What exists is (a) each learner's own progress rows (`learner-records-sync.js`, their record only) and (b) engagement bands for the Governor in the Admin console. There is no per-lesson, aggregated count a member's page may read. `learn-presentation/presentation.js` already records the rule: popularity is never invented. So the page shows **Featured Lessons** (the four lessons the presentation records flag `featured`, in their own order), kept separate from **Featured Series**. If an aggregated, privacy-safe lesson count is built later, a Trending row can be added from it.

## 5. Navigation into the existing Learning Zone

Verified against the newest `main` just before the edit: no commit since my merge touched `ChurchLearn.jsx` or `learn-landing.js`, and no open branch touches either.

- **`ChurchLearn.jsx`: two lines changed** (the import, and `takeLearnAreaHint(DEEP_LINK_AREAS)`), plus `DEEP_LINK_AREAS` added to `lib/learn-landing.js`. Nothing in Learn Studio is edited.
- **Both looks work.** In the classic look the one-time area hint opens the area. In the new look (the default for every member) `lib/learn-discover-nav.js` presses Learn Studio's own controls (its All Courses button, its tool chips).
- 17 regression tests mount the real `ChurchLearn`. **Proven to catch:** with the two-line edit reverted, 5 of them fail.
- Unchanged and tested: Learn still opens on Latest with no hint (DR-1606); an unknown hint is ignored; the hint is taken once and never sticks; no theme, course, sort or level preference is written.
- **Browse All Lessons** is simply "open Learn" with no hint, so it lands exactly where Learn lands today and honours each device's saved look and saved course.
- Open question for the wiring step: a **course card** should open that course. The existing direct course link is `?course=<key>`; I have not wired it, because it changes the address bar. Today the card opens the course's first lesson.
