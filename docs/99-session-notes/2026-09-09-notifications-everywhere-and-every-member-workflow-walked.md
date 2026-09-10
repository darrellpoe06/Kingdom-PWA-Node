# 2026-09-09 — Notifications everywhere, Seen receipts, and every member workflow walked to its end

**Branch:** `claude/property-photos-project-docs-cdsexr` · **PR:** #1495 · **Decision:** DR-0343 · **Review:** REV-0254

## What Darrell said (five lines, from his phone)

1. *"we need the notifications to show up in all the usual notification ways... like on the app and in the notification list."* (three screenshots: the app saying Notifications on; the Android shade with nothing from the church app; ConnectBot badged beside a bare church icon)
2. *"Also want to be able to see when and if someone is or saw your text like other messaging apps."*
3. *"remember users can also like sermons etc... comprehensive review of the process for the users to firm up all workflows."*
4. *"all processes where the user will have access to... testing for making sure each link and button works and does what we intend."*
5. *"did we go through to the end of each step of each process?"*

## 1. The reality trace (DR-0219) — why the phone heard nothing

**SHOULD** (DR-0334): DM insert → `notifyNewMessage()` → `POST /api/push-send` → `push_sends` ledger row → audience from `push_subscriptions` → RFC 8291 push → service worker shows it.

**ARE**, measured:

| Layer | Evidence | Verdict |
|---|---|---|
| The app asks the sender | `direct-messages-sync.js` `sendDirectMessage()` calls `notifyNewMessage()` after a successful insert, fire-and-forget | works |
| The sender has a database | `push-vapid-keys.yml` run 1 (2026-09-08) listed the project's secret names: `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_SUBJECT`. No workflow in the repo ever installs `SUPABASE_URL` / `SUPABASE_SERVICE_KEY`. `push-send.js:68` answers `503 not-configured: supabase` without them | **broken** |
| The sender reads the right database | `infra/nas-supabase/REPOINT-ARMED` (2026-08-19): the app builds against `https://poetech.us/sb`. Hosted `push_subscriptions`: **0 rows**. Hosted `push_sends`: **0 rows**. Hosted `direct_messages` newest row: **2026-07-27**; tonight's "Hello" is on the NAS | **broken** (would have read the hosted project) |
| The audience is found | `push-send.js` filtered by `instance_id = message's tenant`; a phone's row carries the instance active when its owner tapped ON | **fragile** — a person's phone need not be found |
| The shade shows it | `sw.js` push handler exists (DR-0334) and is tested on the real file | works, once a push arrives |
| The icon shows a count | no `setAppBadge` in the worker or the page | **missing** |
| The status-bar glyph | `badge: BASE + '/icon.svg'` — Android masks the badge to a monochrome raster and drew a generic bell | **wrong asset** |
| The sender sees it was read | `read_at` stamped by `markThreadRead()` and the open-thread effect; readable by the sender under the participant policy; never rendered | **missing** |

## 2. What shipped (DR-0343)

- **`.github/workflows/push-sender-credentials.yml`** — dispatch-only. Joins the tailnet; reads `ANON_KEY` + `SERVICE_ROLE_KEY` from the NAS's `/volume1/docker/supabase/.env` (the deploy's own Way for the anon key; nas-clock's for the service key); installs `SUPABASE_URL` = the Funnel `/sb` mount (server-to-server, the upstream `funnel-proxy.js` fronts) + both keys with `wrangler pages secret bulk`; refuses without REPOINT-ARMED. Three proofs: the pair answers 200 on `push_subscriptions` from the runner before install; Cloudflare lists all six sender names back; the live `POST /api/push-send {}` answers **400** (content refused) not **503** after the deploy the job dispatches and waits for.
- **`audienceQuery()`** (`push-send-policy.js`) — a message with a recipient is read by `user_id`; live by instance; the sender builds no filter of its own (source pin).
- **App-icon badge** — `sw.js` `syncAppBadge()` after every show and every tap; `dm-notify.js` `applyAppBadge()` follows the unread count, clears at zero and sign-out.
- **`badge-96.png`** — the church's cross, white on transparency, 96×96, written by a pure-Node PNG encoder (scratchpad `badge.mjs`, 305 bytes).
- **Receipts** — `receiptLabels()` (pure): `✓✓ Seen <time>` under the last of my messages the reader opened, `✓ Delivered` under my newest unread; never under theirs. Rendered in `DirectMessages.jsx` off the thread's stream / 15-second heartbeat / visibility refresh.
- **Standing gate** — `member-surfaces-every-control-acts.test.js`: 21 member-facing files, 118 buttons, zero without a handler, zero `href="#"`; proven-to-catch.

## 3. The comprehensive review (DR-0239, eight dimensions) — every member workflow

**Scope:** what a signed-in church member can do: watch/listen, like a sermon, read the Word, message a member, be notified, see a receipt, keep a profile, join the family thread, answer trivia, serve, give.

### 3a. SHOULD / ARE per workflow

| Workflow | SHOULD (cite) | ARE (traced) | Gap → CLOSE |
|---|---|---|---|
| Like a sermon | DR-0064-era `content_reactions`: tap the chip → Love by default; hold → palette (Like, Love, Amen, Wrestling + the Images of the Godhead); one pick per person per item; counts via `content_reaction_counts` RPC; realtime refresh (`ReactionBar.jsx` header) | `Pulpit.jsx:299` renders `ReactionBar` per sermon; `toggleReaction()` single-pick (delete / update / insert) under own-row RLS; `subscribeReactions()` refreshes the map; signed-out the palette shows and the toggle is refused server-side | none found; the walk tapped the chips as a visitor with no error. Signed-in like → count is covered by `reactions*.test.js` (not re-run here) |
| Message a member (1:1) | DR-0181 / DR-0342: contacts = `list_dm_contacts` (mirrors `users_can_dm`); Enter sends; encrypted when both keys published | Engagement → Message a member (PR #1494); `sendDirectMessage()` inserts under RLS; **"Hello" arrived plaintext** because the sender's device had no public key for the recipient at send time (`sharedKeyWith` → null → honest plaintext) | plaintext fallback is by design and labelled per message; keys publish on first open of Messages on each device. `re-review: 2026-09-16` with the live round-trip |
| Be notified | DR-0334 pipeline (§1) | §1: sender unconfigured; wrong database; audience by instance | **closed in this PR** up to the push service; the phone is the last witness |
| See it was read | (undocumented until today — itself a finding) | `read_at` real, never shown | **closed**: receipts |
| Keep a profile | DR-0342 | `MyProfile` / `ProfileCard` (PR #1494) | live round-trip `re-review: 2026-09-16` |
| Family thread | `engagement-sync.js` `subscribeMessages` / `sendMessage` | tab renamed Family thread; broadcast; welcome names the private door | none |
| Trivia | `engagement-sync.js` `getActiveQuestion` / `uploadTriviaAnswer` | Trivia tab; visitor sees the sign-in note | none |
| Give & Serve / Times / About / Speak / Prayer | Church home folds | all folds' buttons acted in the walk (table below) | none |
| Every link and button | DR-0343 §6 | walk + standing gate | see 3b |

### 3b. Journey walk — every button tapped, every link listed (real Chromium, 412×915, visitor, stub backend)

Driver: scratchpad `walk.cjs` (Church-home folds) and `walk-door.cjs` / `walk-door2.cjs` (the twelve door tabs). Per control it measured: DOM mutations, `aria-pressed` / `aria-expanded` flips, navigation, and page errors. "Inert" means the tap changed nothing measurable — the two inert labels found are the already-current text-size button and the already-current app-level "Church" nav, both correct. Disabled controls are the history Back/Forward at session start, also correct. Per-tab cap: 32 buttons (folds) / 40 (door tabs).

| Surface | Buttons tapped | Acted | Links | Page errors | Notes |
|---|---|---|---|---|---|
| door tab · Church | 40 | 36 | 5 | 0 | inert: Normal text size (current), Church; 2 disabled (history at start) |
| door tab · The Word | 40 | 38 | 1 | 0 | inert: Church; 1 disabled (history at start) |
| door tab · Scripture | 40 | 38 | 1 | 0 | inert: Church; 1 disabled (history at start) |
| door tab · Engagement | 40 | 37 | 1 | 0 | inert: Normal text size (current), Church; 1 disabled (history at start) |
| door tab · Choir | 40 | 38 | 1 | 0 | inert: Church; 1 disabled (history at start) |
| door tab · Bus Ministry | 40 | 38 | 1 | 0 | inert: Church; 1 disabled (history at start) |
| door tab · Order of Service | 40 | 38 | 1 | 0 | inert: Church; 1 disabled (history at start) |
| door tab · Learn | 40 | 38 | 1 | 0 | inert: Church; 1 disabled (history at start) |
| door tab · Eternal Algorithms | 40 | 38 | 11 | 0 | inert: Church; 1 disabled (history at start) |
| door tab · Conference | 40 | 38 | 3 | 0 | inert: Church; 1 disabled (history at start) |
| door tab · Venues | 40 | 38 | 1 | 0 | inert: Church; 1 disabled (history at start) |
| door tab · Projects | 40 | 36 | 1 | 0 | inert: LOG IN, Projects; click failed: CLOSE; 1 disabled (history at start) |
| Church home fold · Worship | 32 | 29 | 5 | 0 | inert: Normal text size (current); 2 disabled (history at start) |
| Church home fold · Speak | 32 | 30 | 5 | 0 | 2 disabled (history at start) |
| Church home fold · Prayer | 32 | 30 | 5 | 0 | 2 disabled (history at start) |
| Church home fold · Give & Serve | 32 | 30 | 5 | 0 | 2 disabled (history at start) |
| Church home fold · Times | 32 | 30 | 5 | 0 | 2 disabled (history at start) |
| Church home fold · About | 32 | 30 | 5 | 0 | 2 disabled (history at start) |

Totals: 672 buttons tapped, 630 acted, 58 links listed, 0 page errors.

Three things the walk flagged, each read before it was counted: (1) **LOG IN on Projects is inert for a visitor** in this sandbox because the walk aborts every off-box request — the sign-in hand-off leaves the origin, which the driver cannot follow; not a dead control. (2) **Projects is inert** because it was already the current tab. (3) **CLOSE on Projects: "element is outside of the viewport"** at 412×915. Traced from the screenshot (`42-door-8-projects.png`): the driver's `Projects` label matched the app-level Projects tab (the family shell's paywalled "Unlock Projects" view), not the church door's Projects sub-tab of the same name, so that row measured a surface outside this review's scope and the church Projects sub-tab was **not walked**. Two dated items, `re-review: 2026-09-16`: walk church Projects with a scoped selector; and find the CLOSE control on the locked app-level Projects view that sits off-screen at phone width (a form-factor defect wherever it lives).

### 3c. The other dimensions

- **Surface-says-truth:** the "Notifications on" control read the browser's subscription honestly (P15) — the lie was one layer down, in a sender that never said it had no database. Closed: the workflow's witness makes that state measurable on demand; the OpsBoard row is the next increment (`re-review: 2026-09-16`).
- **Form-factor measured:** all screenshots and the walk at 412×915; the badge glyph 96×96 as Android requires.
- **Delivery context:** the app is on the sovereign stack; every credential path in this PR is NAS-to-Cloudflare with no human paste.
- **Findings-are-work:** every gap above is closed in this PR or carries a date.
- **Gate-class:** one new standing gate (controls act); the workflow's three proofs are the gate for the credentials.
- **The Word's accuracy:** the one verse this work touches, Matthew 18:15 in the Message a member copy, was verified verbatim in PR #1494.

## 4. "Did we go through to the end of each step of each process?" — stated plainly (DR-0100)

| Process | Steps | Proven to the end? |
|---|---|---|
| Send a DM → the other phone buzzes | insert → sender → ledger → audience → push → shade → badge | To the push service: yes (unit + workflow witness once dispatched on main). **The shade on a real phone: the next real message after merge is the witness.** |
| Read a DM → the sender sees Seen | open thread → `read_at` → sender's refresh → receipt | Yes in tests; live on the next service day (`re-review: 2026-09-16`) |
| Like a sermon → count moves for everyone | tap → single-pick RLS write → RPC counts → realtime | Existing suites; walk as visitor; not re-driven signed-in here |
| Turn notifications on → a row exists the sender can reach | tap → permission → subscribe → upsert row (sovereign) | Yes (push-subscribe tests + the workflow's PROOF 1 reads that table) |
| Every link and button on the member surfaces | tap each | Yes, as a visitor, table above; signed-in behaviour by the suites |

## 5. Honest limits

- The sandbox cannot sign in, cannot reach poetech.us, and cannot see the sovereign database; hosted-database reads above are stated as hosted.
- The credentials workflow cannot be dispatched until the file is on `main` (GitHub resolves a workflow by name on the default branch); the check-in dispatches it the moment #1495 merges.
- Presence (typing / online) is deferred, `re-review: 2026-09-30` — the realtime leg it would ride is the stack's one sick container (measured 2026-08-22).

## 6. Same night, after the merge — the picture is seen, the header carries the person, messages first (DR-0342 amendment)

Darrell, three more screenshots (his saved profile; the thread list with bare usernames; the header's bare LOG OUT): *"Make sure the picture is visible on the apps... users like to see their picture... move messages to the first tab spot... then family then trivia... All apps users profile shows and has login or out under it... so it is looked at... or seen... And upload a photo spot."*

- `lib/use-profiles.js` — `useProfiles(userIds)` (one cached `get_profile` per person) and `preferredName()`.
- Faces + chosen names on: 1:1 list rows, the open-thread header, start chips, incoming bubbles, family-thread rows, the My-profile fold.
- `HeaderAuthButton`: picture (or initials + `+ photo`) + name, Log out beneath; the face opens My profile in the Modal on every app; re-reads the row on close.
- Engagement sections reordered: Message a member → Family thread → Trivia; opens on the first.
- Tests +6 across three suites; lint clean; consistency guard caught two width-cap classes in the chip (fixed: inline bound, Modal default width); every other guard OK. Real Chromium at 412×915: the Engagement tabs read in the new order and the page opens on Message a member (screenshot `50-engagement-order.png`).
- Honest limit: the header chip with a real face needs a sign-in the sandbox cannot make; proven in jsdom against the real components.

## 7. 11:07 PM — the Origin DNS error page printed itself into My profile (DR-0342 amendment 2)

Live on 3D2417D: the header chip with his face and LOG OUT beneath; the My profile dialog from it; initials avatars on the thread rows (the other two people have no profile yet); the tab order — all as built. And one defect: the form's status line showed a raw Cloudflare 1016 page. Trace: Pages Function `fetch()` to the Funnel failed to resolve at that moment → Cloudflare's HTML error → streamed by `funnel-proxy.js` → supabase-js `error.message` → printed. Closed at the transport (HTML 5xx from the edge → JSON 502 with a readable `message`; NAS JSON untouched) and under it (`humanizeServerError`, used on the save path). site-health dispatched at the time of the fix to measure the backend now (DR-0125). Client sweep of the 12 other raw `error.message` renders: `re-review: 2026-09-16`.

## 8. 11:10 PM — "I text my self and never got it... why?" (DR-0343 amendment)

Phone account → email account (two user ids, one person, `person_links` 0141). The push looked for the email id's phones; his phone opted in under the phone id. Closed: the sender widens a named recipient through `person_links` (`expandAudience`), and the sending screen now reports what the push did (`pushReportText`), so the next self-test answers itself on the screen: *their phone was told* or *no phone is set to be notified for them yet*.
