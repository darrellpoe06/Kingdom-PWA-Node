# DR-0678: Each device its job. The laptop is the creating station, and the app knows which device it is on

- **Status:** accepted
- **Tier:** B (a new app surface and a boot-time mark; no schema, no transport, no money; every existing gate unchanged)
- **Type:** feature + data (device roles as data, read by the app and by the layout probe)
- **Date:** 2026-09-29
- **Scope:**
  - `infra/device-availability/device-roles.json` (new): a role for each device class (phone, tablet, laptop, TV, NAS, tower): its jobs, why, the app surfaces it is best for and why, and the order of the Create station's panels. `pipeline-nodes.json` points to it (`device_roles`) and says how node roles map to classes.
  - `app/src/lib/device-roles.js` (new): the device class, derived from what the browser measures (width, `any-pointer: fine`, touch points), with the user agent read only to recognise a TV (the existing TV test). It also orders panels, validates the roles file, maps Alt+digit shortcuts, and builds the handoff link. `app/src/lib/use-device-class.js` (new) re-measures live.
  - `app/src/main.jsx`: marks `<html data-device-class>` at boot, and calls `markTvDevice()`, which `tv-device.js` defined for exactly this and which nothing had ever called.
  - `app/src/components/CreatingStation.jsx` (new), mounted at the top of the existing Create view through `CreationWorkspace`'s new `station` prop. The station gathers the lesson entry, Your lessons, the lessons to decide, the Governor's queue, the towers, read-and-listen, and the handoff.
  - `app/src/lib/app-doors.js`: the boot-time deep-link read also keeps `?panel=` for `?view=create`, because nav-history drops unknown params within a tick.
  - `scripts/chrome-layout-probe.mjs`: `create` joins the sweep at every width, and a new DEVICE pass measures the station as a laptop, a desktop, a phone and a Fire TV. `--selftest-break` must trip it.
  - Tests: `device-roles.test.js`, `creating-station.test.jsx`.
- **Principles:** DR-0061 / DR-0065 (the app is the primary artifact; reality-trace); DR-0076 §1/§3/§4 (measured, proven-to-catch); DR-0239 dimension 4 (form factor MEASURED); DR-0657 / DR-0658 (the TV is known by its user agent; it signs in from the phone); DR-0672 (Your lessons); DR-0012 (live work wins the right tower).
- **Grounds:** Darrell, 2026-09-29, verbatim: *"Laptop for creating... we need to be able to use the devices appropriately"*

## Context

He records lessons on his phone and reads and listens on the Firestick. The NAS is becoming the home of the lessons (DR-0677), and the 4070 tower `tlcmediadpt` runs the AI (OpenClaw, #1838; the Ollama writers from the NAS builder, #1837). The laptop had no job in the app. The app knew one device class, the TV, and only on the sign-in dialog.

### Reality-trace (what was true before this change)

- **The device registry** (`infra/device-availability/pipeline-nodes.json`) is read by `app/src/lib/pipeline-availability.js`, its test, `scripts/pipeline-availability-probe.mjs` and `node-availability.yml`. It declares six nodes: `poetech` (nas), `tlcmediadpt` (gpu-worker, the LEFT 4070), `livestream-main-pc` (gpu-presenter, the RIGHT 4070, which feeds the wall), `tlc-tech-team` (workstation, role unconfirmed), `tlcrackstation` (unknown), and `kingdom-home` (workstation, a home box, not a pipeline dependency). **No laptop is recorded.**
- **Form-factor detection:** `lib/tv-device.js` (the AFT… Fire TV user-agent list, DR-0657) feeds `device-link.js`'s `isTvClass` and `tvClassFromWindow`. The one consumer is `AuthModal`, which puts the phone sign-in door first on a TV (DR-0658). `markTvDevice()` was written to mark the document and **was never called**. `use-read-aloud.js` handles the Fire TV's missing speech engine by behaviour, not by detecting the class.
- **Layout probes:** `scripts/chrome-layout-probe.mjs` measured 11 views at 360/768/1440/1920. The TV is covered by the reader pass at 1920x1080 and by `device-link-e2e.mjs` at 960x540. No probe asked what the app took a device to be.
- **Create** was the document and image canvas (`CreationWorkspace`). The lesson tools lived apart: the recorder inside `OneVoiceInput` (Thinking Space), Your lessons (`LessonInbox`), and the Governor's queues under Projects → Decisions.

## Decision

1. **Roles are data.** `device-roles.json` names what each class is for:
   - phone: record, listen, quick approve;
   - laptop or desktop: create, edit, compare, merge, review, govern;
   - TV or Firestick: read, listen, sign in from the phone;
   - NAS: the home of data and services;
   - tower: AI compute.

   A tablet class is added, because a measurement between phone and laptop needs an honest answer. The file carries no addresses or users, because it ships in the bundle.
2. **The class is measured.** A laptop needs a viewport of at least 1024 px **and** a fine pointer; neither is enough alone. A phone is narrower than 600 px, or a device with only a coarse pointer and a short side under 500 px. The TV uses the existing TV test and nothing else. When the browser cannot report the pointer, the result is neither a laptop nor a TV.
3. **Never blocked by device.** A class sets order and layout only. Every panel is rendered on every class. The surface registry, the access requirements, nav-history and the shell never read the class, and a test pins that. The Governor gates stay the same gates they are on Projects → Decisions.
4. **The Create station**, at the top of Create:
   - On a laptop: two columns, with Your lessons and the Governor's queue at full width, and Alt+1..9 / Alt+0 shortcuts with the legend shown.
   - On a phone: one column, with the recorder (the Lesson chip already chosen) first, then the decisions, then "continue on your laptop".
   - On a TV: read and listen first, large, in one column.
5. **Components are imported, never rewritten.** The station uses `OneVoiceInput` (through its `surfaceConfig` seam), `LessonInbox`, `MemberLessonQueue`, `GovernanceQueue`, `LessonReviewQueue` (#1841, DR-0672) and `TowerParity` (#1845, DR-0671). The last two were placeholders while their PRs were open; both are on main now and are mounted directly, as Projects → Decisions mounts them (the review queue in the Governor's decide panel; `TowerParity` with `signedIn` in the Towers panel). Their files and sources are pinned in `PINNED_FROM` and tested.
6. **The handoff is a link, not a device-link.** A link opens the station at one panel (`?view=create&panel=…`), shared from the phone or scanned from a QR on the laptop. The device-link mechanism (DR-0658) moves a **session** to a device that asks for one. A lesson waiting on review is not a session. The laptop, signed in as the same person, reads the same rows through RLS, so only *where to open* has to travel. The link carries no identity. When the laptop is not signed in, its door is the existing "Sign in with your phone", which is device-link. So the mechanism is reused where it fits, which is signing in, and not stretched to carry work.

## Impact

- **Phone:** Create opens with the recorder, then the lessons to decide, then a one-tap handoff to the laptop.
- **Laptop:** Create is a two-column creating station with keyboard jumps. Your lessons (compare, merge, publish once #1841 lands) sits at full width, and the Governor's queue is beside the work.
- **TV:** the document is now marked `data-device="tv"` and `data-device-class="tv"`, and Create leads with reading and listening.
- **NAS and towers:** named in the roles with their jobs; the app surfaces their state on the operations board.

This can be undone by reverting one commit.

## Measured (local, this change; CI re-measures)

- `chrome-layout-probe --sweep` exit 0: 48/48 chrome cases (create at 360/768/1440/1920 included), 7/7 lesson, 16 text-scale, 3 reader, and 4 device cases:
  - laptop 1440x900: derived laptop, 7 panels, "your-lessons" first, 2 column edges, grid 1376 of 1440 px;
  - desktop 1920x1080: laptop, 7 panels, 2 column edges, grid 1856 of 1920 px;
  - phone 390x844: phone, 7 panels, "record" first, 1 column edge, 366 of 390 px;
  - Fire TV 960x540: tv, 7 panels, "read-listen" first, 1 column edge, 912 of 960 px.
- `--selftest-break`: the device pass trips on the collapsed laptop grid ("SELFTEST-BREAK OK … 1 device").
- An earlier sweep in this memory-starved sandbox crashed its Chromium target on the lesson pass at 1440 px before reaching the end. The re-run passed cleanly. The crash is in the lesson pass, not this change, and CI's runner is the authority.

## Proven to catch

- The layout probe's `--selftest-break` trips the device pass on a collapsed laptop grid ("SELFTEST-BREAK OK … 1 device").
- `device-roles.test.js`: the validator refuses each kind of broken roles file (missing class, a role field that would block, a panel left out of an order, a fake view).
- `creating-station.test.jsx`, measured 2026-09-29 at the merge with main: removing the `<LessonReviewQueue />` mount from the decide panel fails 1 of 15 tests; putting it back makes all 15 pass. `TowerParity` is asserted mounted with `signedIn` and absent when signed out.

## Gaps, each with a why and a date

- **No laptop is named in the fleet.** The app does not need one, because it measures the screen. The fleet witness would, if the laptop ever carries pipeline work. Only Darrell can say which machine it is, or whether `kingdom-home` is it. **re-review: 2026-10-06.**
- **His laptop is named (2026-09-29):** Darrell's creating station is his Samsung laptop, recorded in `device-roles.json` `known_stations` as class laptop, tailnet not joined, with no address or username.
- **Closed at merge (2026-09-29):** the tower parity panel and #1841's `LessonReviewQueue` landed on main (#1845, #1841) and replace the placeholder panels; the ledger files were resolved with `resolve-ledger-conflicts`.
- **The station's lesson entry shares Thinking Space's device-local draft** (the same `notes` surface key). A lesson started in one place is still there in the other. That is continuity, and it is deliberate for now. **re-review: 2026-10-13.**
- **The landing view is unchanged by device.** A bare URL still opens the overview on every device. Changing the family's front door by device is a separate decision, and it is not taken here.
