# 2026-10-15 — The Heritage redesign: plan, inventory, and the approval gate

**Status:** PROPOSED. No application code changes in this note's PR. Darrell asked for the plan, the affected-surface map and the first design before any code moves; this is that delivery.
**Mockup:** `docs/99-session-notes/2026-10-15-visual-redesign-mockup.html` (home and Big Picture, desktop and phone, with the measured palette). Published privately at https://claude.ai/artifact/TDi4kG2Ai9sFwr1EKuhByb.
**Decision record:** DR-1044 (proposed).
**Brief:** Darrell 2026-10-15, with a reference image: *"THIS IS A VISUAL REDESIGN ONLY... Think of this as completely renovating a beautiful home without removing any of its rooms, belongings, or functionality."*

---

## 1. What exists today (characterized, not assumed)

Measured on the built app (`?demo=family-of-4`) in Chromium at 1440×900 and 390×844; screenshots attached to the session, not committed.

**Shell.** One file, `app/src/poe-financial-mvp-v28.jsx`, 5,302 lines, frozen at exactly its budget (`scripts/monolith-budget.json`): any net line added fails CI. Header is a sticky block (`:4129`): wordmark "PoeTech" / tagline `PoeTech · Life, Soul & Money` (`:4150-4156`), the comfort row (`:4158`: account, tier, Subscribe, Install, Help, bell, text size A..A44, voice, six theme swatches, build stamp), then `TopNavRow` (`:4247`) holding a horizontally scrolling tab strip of **34 top-level sections** (`:4250-4374`), then the Books / Church / TLC / Create second rows (`:4376-4408`). There is **no sidebar** at any width. The bottom bar is `ChromeDock` (`components/ChromeDock.jsx`): Feedback, Give, network, Top, the reader, folded into "More" under 640 px; inside a lesson it is the one-row reader bar (DR-0716, DR-0744).

**Signed-in home.** `view=overview` → `Home` (`components/BigPictureDashboard.jsx:66`): the Big Picture dashboard by default, or the **Life Hub** (`components/LifeHub.jsx`) when the reader has opted in (`lib/home-view-prefs.js`, DR-0464). The Life Hub already holds, from real records, the six tiles the reference image shows (`lib/life-hub.js:57`: Big Picture · Books · Messages · Real Estate · Projects · TLC), Today's Focus and My Goals (`lib/daily-focus.js`), and eight Quick Actions (`lib/life-hub.js:72`). The reference image is Christina's home view wearing the new finish.

**Color.** No semantic tokens. The cream palette is ~18,000 Tailwind arbitrary-hex classes (`text-[#5A5751]` ×5,189, `[#1A1815]` ×4,766, `[#B85838]` ×3,992, `[#E8E4DC]` ×2,203, `[#5A6E3D]` ×1,537, `[#FAF8F4]` ×1,157). Each of the five other themes is a `[data-theme]` block in `app/src/lib/theme-css.js` that remaps those literal classes with `!important`. Theme choice is a device preference (`poe-theme-pref`), published through one store (DR-0524, DR-0878).

**Type.** `"Fraunces", serif` is named 1,934 times and `"DM Sans"` on the root, loaded by a Google Fonts `<link>` at `:3557`. The CSP (`app/public/_headers`) is `font-src 'self' data:`, so that link is **blocked in production**: the app has been rendering the device's fallback serif and sans the whole time. The one self-hosted face is Playfair for the Poe Properties door (DR-0994).

**Guards that police a restyle** (all in `scripts/`): `contrast-guard` (AA 4.5 on every theme, hover fills, selected state, midnight token coverage), `legibility-guard` (+ baseline; any new dark-on-dark fails), `large-print-guard` (no px font sizes in `app/src`), `consistency-guard` (chrome icons only from `UiIcon`, no emoji), `ui-standards-guard` (focus rings, 36 px floor), `fab-overlap-guard`, `table-a11y-guard`, `feedback-area-guard` (every nav id needs a feedback area; **ids cannot change**), `monolith-budget-guard`, `module-boundary-guard`, and `chrome-layout-probe` (real-browser measurement at phone / tablet / laptop, and at A44; chrome ≤ 460 px of the first viewport at 360 px, DR-0438).

**Binding design rules on record.** VISUAL-IDENTITY.md (gold leaf `#C9A227`, ivory, charcoal, deep sapphire are already core; no stock "Christian" photography; crown and lion are the marks). EXCELLENCE-STANDARD (nothing stripped for minimalism; consistent across the app). QUALITY-OF-LIFE (the default is the phone, every row read first at 360 px; DR-0838). DR-0099 (true red is the Blood of Jesus and marks nothing else). DR-0438 / DR-1011 (the words grow, the frame does not). DR-0716 / DR-0744 (one solid bottom bar; nothing floats over the Word). DR-0198 (`UiIcon`, never raw emoji, in chrome). DR-0726 (a restyled control updates its `feature-registry.json` locator, never drops it). DR-0994 (the precedent for a visual-only front-door redesign: presentation in one new file, palette as custom properties remapped for midnight, self-hosted OFL fonts, `hold` label until Darrell approves). RELEASE-TIERS: a brand lockup / tagline / default-home change is Tier C; a palette change inside the signed-in app is Tier B.

## 2. The full inventory that must survive

The complete map (34 sections, their gates, every second-row and in-page tab, with `file:line`) was swept this session; the parts the redesign touches are summarized here. The ids below are the contract: the redesign may regroup and restyle them and may not rename, merge or drop one.

**Top-level sections, in today's order:** overview (Big Picture) · books · inbound · rentals (Real Estate) · properties · projects · tlc / tlc-assistant / practice (by role) · opportunities (Dev/Ops) · about · ‖ · messages · notes · create · voice · scribe · library · recipes (Chef's Corner) · health (Road to 150) · games · tvtime · advocacy · databack (Your Data) · cameras · vault · study · church · markets · center · crm · relationships · inventory · moore (Moore Divahs) · forecast · cohorts (Academy) · admin.

**Second rows.** Books: entities, accounts, debts, owed, plan, transactions, imported, cart, k1099, taxes, calendar (default), legal. Church: home, ministries, pulpit, scripture, engagement, choir, bus, program, learn, conference, events, projects, my record, access, members, giving book (office role), harvest / video wall / devices / infra plan / observation (staff). TLC: Practice, Inquiries, Revenue, Client Growth, Learn, Intake, Assistant, Onboarding. Create: Workspace, Lesson entry, Your lessons, Lessons to decide, Governor's queue, Towers, Read and listen, Hand off.

**In-page tab rows (≈60).** Big Picture (Now → What needs you / Capacity, Money, Ahead, Big Picture), Books → Tx / Debts / Owed / Plan / 1099s, Real Estate per-property (Notes, Work, Photos, Property, Tenancy), Projects (11 tabs + 5 Governor-only), Practice, TLC Onboarding, Dev/Ops, About (9 sections with sub-rows), Messages (Direct, Groups, Voicemail), Voice, Library, Chef's Corner, Road to 150, Games, TV Time, Cameras, Vault, Study, Center, CRM, Relationships, Inventory, Moore Divahs, Forecast, Scribe, Academy, Admin (6), Inbound, and every Church sub-surface (Church home, Engagement, Choir ×9, The Word, Scripture, Bus Ministry ×9, Order of Service, Learn, Eternal Algorithms, Conference, Campus Rentals, Church Projects, Members, My Record, Access, Harvest, Video Wall, Devices).

**Accessibility controls, every one kept:** text size A / A+ / A++ / A+++ / A44 (`lib/text-size.js`), `ReadingVoiceControl`, `TTSControl` and the read-aloud dock slot, `ShowTheWordToggle`, `ComfortBarToggle`, the six themes, the header hideaway and its "Show header" way back (DR-0577), the focus ring, the TV rails and page chips.

**Not touched at all:** every `lib/*.js` calculation, every Supabase table, RLS policy and migration, auth (`lib/access-gate.js`), subscriptions and payments, messaging, push, the n8n/Python transports, the service worker, the native shell.

## 3. The design system (the palette in the mockup, measured)

Theme key `heritage`, label "Heritage · forest & gold". Values and AA measurements are in the mockup's section 1 and were produced with the repository's own luminance math. The reference image's colors were sampled and then adjusted only where a pairing failed AA.

| Token | Hex | Use | Measured |
|---|---|---|---|
| forest | `#1F3A2E` | sidebar, phone header, brand, primary dark fill | white on it 12.33 |
| navy | `#1B2A4A` | selected section, links, "in progress" | white on it 14.22 |
| charcoal | `#2B2F2D` | contrast panels (quote card) | white on it 13.57 |
| ivory | `#F6F1E7` | page | ink 15.10 · muted 6.10 |
| paper | `#FFFDF9` | cards | ink 16.73 · muted 6.75 |
| cream | `#EDE5D5` | mat, tab tray | ink 13.57 |
| hairline | `#DED5C3` | borders | — |
| gold | `#C9A227` | primary button fill, rules, marks | ink on it 7.03; **as text on light it fails (2.1) and is never used that way** |
| gold-text | `#8A6510` | small gold labels on light | 5.23 paper · 4.72 ivory |
| terracotta | `#9E4A2A` | selected accent, overdue, badges | white on it 6.06 · on paper 5.96 |
| healthy | `#2F6B4F` | done, fresh, healthy | on ivory 5.59 |
| ink / muted | `#1A1D1B` / `#5E5A52` | text | above |

**Type.** Fraunces (display, the face the app already names everywhere) and DM Sans (body), both SIL OFL, **self-hosted** under `app/public/fonts/` with `@font-face` in `index.css`, licence files beside them, as DR-0994 did for Playfair. The blocked Google Fonts link is removed. Sizes stay in rem (large-print-guard); the frame stays in `--ts-fixed` (DR-1011).

**Shape and depth.** Cards 14 px radius on paper with one soft shadow; buttons 9-10 px; chips pill-shaped. The Snow and Glacier themes already carry radius and shadow this way, so this is the established mechanism, not a new one.

**Color theology.** True red marks nothing. Overdue is terracotta, incident is gold-text on a pale gold band, in-progress is navy, resolved is healthy green. The Scripture highlight palette (DR-0424) gets a `heritage` rule at the same measured strength as cream.

**Imagery.** The welcome banner's picture is the family's own Life Gallery photo when one has been chosen for it (`data.lifePhotos` is a real record with add / update / delete already shipped), and a painted gradient-and-ridgeline otherwise. No stock photography (VISUAL-IDENTITY), nothing fetched at runtime.

## 4. Architecture: how the look changes without the rooms moving

1. **A seventh theme, not a rewrite of 18,000 class names.** `heritage` is a `[data-theme="heritage"]` block in `lib/theme-css.js` that remaps the six base literals the way the other themes do (`#FAF8F4`→ivory, `#1A1815` fill→forest, `#1A1815` text→ink, `#B85838`→terracotta, `#5A6E3D`→healthy, `#2A5A8E`→navy, `#E8E4DC`→hairline, `bg-white`→paper + radius + shadow, `.poe-selected`→navy, form controls→paper/ink/hairline). Every one of the 725 components inherits the finish on the first paint, and every existing theme keeps working because nothing they key on changes. Heritage becomes `THEMES[0]`, the first-run default; a device that already chose a theme keeps it (DR-0524 keeps Cream in the list).
2. **A small set of semantic tokens for the new chrome.** The sidebar, bottom navigation, hero and tile cards need colors the base six cannot express (gold fill, navy selection). They are added as literal classes with a remap in **every** theme block including midnight (the DR-0873 / DR-0713 pattern), so `contrast-guard` and `legibility-guard` keep policing them. No inline hex anywhere.
3. **New shell components in new files; the monolith shrinks.** `components/shell/SideNav.jsx` (≥1024 px), `components/shell/MobileNav.jsx` (the five-tab mode of `ChromeDock` outside the reader), `components/shell/SettingsPanel.jsx` (the comfort row's controls gathered in one place, still one tap away from the bottom bar and the header), `components/shell/HomeHero.jsx`. The 34-entry tab array moves from the monolith into `lib/nav-items.js` (same ids, same gates, same order; the `nav-history` parity test keeps it honest), which buys the monolith the lines these mounts cost. `feedback-area-guard` passes because ids are unchanged.
4. **The bottom bar stays the bottom bar.** Outside a lesson, `ChromeDock` renders Home · Big Picture · Books · Messages · More (same 44 px square-chip family, DR-0716). "More" holds every other section, grouped exactly as the sidebar is, plus Feedback, Give, network, Top, Controls and text size. Inside a lesson (`data-lesson-space="open"`) nothing changes: the one-row reader bar is measured law (DR-0744).
5. **The home is the Life Hub, restyled, with two cards added from real records.** Recent Messages reads the Messages threads through the one DM watcher (`lib/dm-notify.js`); Recent Activity reads the records log, Lessons Walked, Ledger Freshness and the build stamp. Nothing shows a number it did not read. The Big Picture dashboard remains one tap away and is the first restyled internal page.
6. **Shared primitives carry the rest.** `SectionTabs`, `TabScroll`, `MetricCell`, `Modal`, `SectionTitle`, the dock button constants and the `CARD` strings are restyled once; the per-section passes then adjust layout only (cards for property rows, status stripes on queue rows, grouped tab trays), never data or handlers.

## 5. What could be affected, and the guard for each

| Risk | Where | Guard |
|---|---|---|
| A control moves and its automated locator breaks | `lib/feature-registry.json` (174 entries) | DR-0726: locator updated in the same commit; registry test |
| A nav id or sub-tab id changes | `FEEDBACK_AREAS`, `nav-history.js` VALID list | `feedback-area-guard`, `nav-history.test.jsx`; the ids are frozen by this plan |
| A new color renders dark-on-dark in Midnight | every new hex class | remap in every theme block; `contrast-guard`, `legibility-guard` |
| Gold used as text on a light surface | anywhere | gold-text token only; measured table above |
| Header chrome grows past the 360 px budget | sticky header | the hero is page content, not chrome; `chrome-layout-probe` at 360 / 768 / 1024 / 1440 and at A44 |
| Monolith grows | `poe-financial-mvp-v28.jsx` | nav array extracted first; `monolith-budget-guard` |
| The reader's one-row bar changes | `ChromeDock` in a lesson | mode switch keyed on `data-lesson-space`; existing dock tests |
| A theme preference is reset | `poe-theme-pref` | Heritage is added, nothing removed; stored keys stay valid |
| Fonts fail to load | CSP `font-src 'self'` | self-hosted `@font-face`; `security-headers-guard` unchanged |
| A phone layout is only eyeballed | all | probe sweep, plus a Playwright before/after capture of every top-level view at two widths, attached to the PR |
| Something that existed is gone | all | an inventory test: every id in `lib/nav-items.js` and every second-row id renders a surface; the before/after capture set is diffed by view |

## 6. Phases (each a PR through the normal lane; Tier C pieces carry `hold` until Darrell lifts it)

| Phase | Scope | Visible change | Tier |
|---|---|---|---|
| 0 (this PR) | plan, mockup, DR-1044 proposed | none | — |
| 1 Foundation | self-host Fraunces + DM Sans; `heritage` theme block + registry + highlight rule; semantic token remaps; guard coverage extended to every theme | none until a device picks Heritage | B |
| 2 Shell | `lib/nav-items.js`; SideNav (desktop); five-tab `ChromeDock` mode + More; SettingsPanel; new tagline on the lockup; Heritage becomes the default | the whole app wears the finish | C (`hold`) |
| 3 Home | Life Hub as the signed-in home; hero; Recent Messages + Recent Activity from records; Big Picture restyled | home and Big Picture | C (`hold`) |
| 4 Sections | primitives; then Books / Finances, Real Estate + Properties, Projects, Church + Learn + lessons, Messages, then every remaining section in the inventory order | each section | B |
| 5 Proof | probe sweep, inventory test, before/after capture, live review on poetech.us (DR-0104) | — | — |

## 7. Decisions this plan asks Darrell to confirm (each with the default the build will take)

1. **Heritage becomes the first-run default; the five other themes stay as choices.** Default: yes.
2. **The tagline becomes `Life · Soul · Money · Family`** (today `PoeTech · Life, Soul & Money`); brand lockup, manifest and the Love Corner door unchanged. Default: yes, as written in the brief.
3. **The Life Hub becomes the signed-in home** (amends DR-0464's opt-in; the Big Picture dashboard stays one tap away). Default: yes.
4. **Overdue and alerts wear terracotta, never true red** (DR-0099). Default: yes.
5. **The search field in the reference image is omitted** until a real cross-record search exists to back it; a painted search box would be a hollow surface (DR-0061). Default: omit.
6. **Hero picture: the family's own Life Gallery photo or a painted gradient; no stock photography.** Default: as stated.

## 8. Verification plan (DR-0076)

Every phase PR carries: `npm run verify` (lint, 20 gates, full Vitest); `chrome-layout-probe` at 360 / 768 / 1024 / 1440 and A44 on home, Books, Church / Learn and Create; the before/after capture of all 34 top-level views at 1440 and 390 attached as a PR artifact; the inventory test green; and, after merge, a real deploy run whose head matches `main` and a `site-health` pass (DR-0107, DR-0125), followed by the live user-review pass (DR-0104).

`re-review: 2026-10-22` — if the plan is approved, Phase 1 and Phase 2 are expected merged by then; if it is not yet reviewed, the plan is brought back to Darrell with the mockup.
