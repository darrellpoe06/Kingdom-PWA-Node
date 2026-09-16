# DR-0444 — the notification landed on the welcome screen of the wrong door, and so did the feedback

- **status:** accepted
- **date:** 2026-09-16
- **reported by:** Darrell, three messages in one sitting —
  1. *"The messages notifications don't work fully... the open the app to the welcome instead of the text message... fix comprehensively"* (with two screenshots: the thread on `poetech.us/lovecorner/app/?view=church`, and `poetech.us/poetech-app/?tab=messages` sitting on **Big Picture** under the MVP welcome card)
  2. *"I text Christina from the Love Corner App and receive a text from the PoeTech App... I also need the message to be sent from and received from the group it belongs to originally... make sense?"*
  3. *"Feedback should work the same way..."*
- **extends:** DR-0334 (web push and an honest live signal), DR-0343 (notifications everywhere), DR-0258 (disjoint install scopes), DR-0296 (the one nav parser), DR-0060 (the gate is the guard), DR-0076 (verification doctrine), DR-0111 (do the work), DR-0219 (SHOULD / ARE / GAPS / CLOSE)

## SHOULD (the documented intent)

- `push-announce.js:28` — *"The app path a notification tap should land on, per topic."*
- `nav-history.js:26-38` — the shell's `getInitialView()` and `parseNav()` are ONE parser reading `?view=`, and the comment records what drift there last cost: *"reading only `?view=` is what sent every shared lesson link to the Worship tab instead of the lesson."*
- `PwaPrompts.jsx:26-42` (DR-0258) — PoeTech and The Love Corner are **two installable PWAs on one origin under DISJOINT scopes** (`/poetech-app/` vs `/lovecorner/`), each served by its own HTML with its own manifest.
- `direct-messages-sync.js:153-157` — *"The instance a DM rides: the contact's OWN space."*
- `feedback-sync.js:4-9` — feedback is written for the family to read; nothing documents which space a row belongs to.

## ARE (traced end to end, 2026-09-16)

`notifyNewMessage()` posted `url: LANDING.message`, and `LANDING.message` was the string **`/poetech-app/?tab=messages`**. Two independent defects in one literal:

| half of the literal | what it did |
|---|---|
| `?tab=` | **No parser in this app has ever read a `tab` param.** `getInitialView()` and `parseNav()` both read `view`. An unknown param falls through to `overview` — Big Picture, with the welcome card on it. That is defect 1, exactly as photographed. |
| `/poetech-app/` | Hard-coded. A church thread therefore handed a member the **family** door. That is defect 2, exactly as he described it. |

Two more gaps sat behind those:

- **The tap opened the list, not the message.** `DirectMessages`' `openWith` began `null` with no way to set it, so even a corrected landing put the reader in front of a contact list and made them find the person themselves.
- **The service worker could not even see the church window.** `notificationclick` matched open clients with `c.url.indexOf(BASE) !== -1`, `BASE` being `/poetech-app`. A phone standing in `/lovecorner/app/` matched nothing, so the tap opened a second window instead of focusing the app already open.

And the same defect class, one surface over, is what his third message named: **`uploadFeedback()` stamped every row with whatever `join_default_instance()` returned — `poe-family`** — so feedback given inside the Love Corner app was filed to the family space and the door it came from was recorded nowhere.

**One missing primitive under all four:** nothing in the app could answer *given a space, which door is its app* — or the same question backwards, *which door is this page*.

## GAPS → CLOSE

1. **`app/src/lib/app-doors.js` (new, pure).** The five installable doors as data, each with the instance slugs whose app it is; `doorForInstanceSlug()`, `currentDoor(pathname, search)`, `messageLanding()`, `liveLanding()`. Every value is READ, never guessed: the paths are the MPA inputs in `vite.config.js` (and a test asserts each has a served `index.html` on disk); `colg` is the church slug seeded by migration 0012; `moore-divahs` is `business-registry.js`'s row; `tlc-therapy-solutions` and `poe-properties` were read from the live `instances` table this same day. An unmapped space resolves to the personal door — never to nothing.
2. **The landing is derived per announcement.** `notifyNewMessage()` takes the thread's `instanceSlug` and the sender's user id and lands on `<that space's door>?view=messages&dm=<sender>`; `announceLive()` lands on that space's own `?view=church`. `direct-messages-sync.js` reads the slug and display name from `instances` (one cached read; `instances_member_read` already grants it, so no migration and no new grant), and every failure path resolves to nulls — which lands on the personal door, exactly where it landed before.
3. **`?tab=` is honored as an alias for `?view=`, in both parsers.** Not a convenience: the notifications **already delivered** are sitting on phones with `?tab=` in them, and a tap on one has to work.
4. **The tap opens the thread.** The deep link is snapshotted synchronously at boot (the history seed drops `dm=` within a tick, and the Messages surface is lazy), then **consumed once** by the surface — so leaving Messages and coming back later never silently reopens it.
5. **The service worker routes by door.** The target is resolved to an absolute URL, a client **in the target's own door** is preferred, any other same-origin window is the fallback and is navigated to the target, and only with no window at all is one opened. `sw.js`'s door list and `app-doors.js`'s are compared in CI.
6. **The push names the house, and still never the message.** `messageAnnouncement()` adds `In <space>.` to the body. A space name is not message content, so DR-0334's privacy rule is untouched: still who and where, never what.
7. **Feedback is filed to the door it was given in.** `doorInstanceId()` resolves the standing door's instance by slug, and **the read IS the membership check** — `instances_member_read` only returns a member's own instances, so a non-member's read comes back empty and the row falls back to the default space. RLS decides, not a hand-written rule (DR-0060).

## Receipts (DR-0076: measured, and proven to catch)

41 new cases across four suites, every one of them shown to FAIL against the defect before it was fixed:

| mutation re-applied | what went red |
|---|---|
| landing back to `/poetech-app/?tab=messages` | 2 of `app-doors.test.js` |
| the sw's door preference disabled | `focuses the window that is already in the notification's own door` |
| the deep link ignored in `DirectMessages` | 2 of `messages-notification-deeplink.test.jsx` |
| the door dropped in `uploadFeedback` | `files feedback given in the Love Corner door to the CHURCH space` |

`messages-notification-deeplink.test.jsx` mounts the **real** Messages surface and reads the rendered text (DR-0076 §6, observe the surface): with a `dm=` link the thread and its message are on screen; without one the contact list is, unchanged.

## What is NOT fixed here, named rather than left silent

- **`faultAnnouncement()` has no sender yet** (nothing calls it), so it has no landing to correct. When DR-0400's drain is wired it must use `app-doors.js` — a fault on Moore's door belongs in Moore's door. **re-review: 2026-09-30.**
- **The offline fallback is still PoeTech's shell** for every door: `sw.js` falls back to `BASE + '/index.html'`, so a church member offline on `/lovecorner/app/` gets the family shell's cached page. Real but narrow (offline navigation only, and the app boots the same code either way). **re-review: 2026-10-07.**
- **The feedback row records its space, not its door**, because `instance_id` is the space and there is no door column. That is enough to answer "whose feedback is this"; it cannot distinguish two doors of one space. A `door` column is additive and wants the migration lane. **re-review: 2026-10-07.**
- **The welcome card** still says "Sample data is loaded" to a signed-in family member on Big Picture. It is not this defect — no tap lands there any more — but it is the screen he photographed. **re-review: 2026-09-23.**

## The standing rule

**A notification, a receipt, or any record that belongs to a space carries that space's door.** A landing path is never a literal; it is derived from the space the thing belongs to, through `app-doors.js`, and the same resolver answers the reverse question for anything a person files while standing in a door. Where a person's right to that space is in question, the RLS read is the check — never a hand-written rule beside it.
