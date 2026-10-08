# 2026-10-07 — Every control on its camera, views you order while they stream, tabs, and the TLC lessons scroll

**Layer 4 working note.** Decisions: DR-0783 (the Cameras tab reshaped), DR-0784 (Steps / Scroll on every lesson surface). Pairs with DR-0776 to DR-0782 (the camera day).

## What Darrell said, 8:32 to 8:45 CDT

- *"Better functions more intuitive... why does a user need to scroll down there when each control for each camera should be with it.... also the Wall sucks!!!! My views should be able to have and reorder the view live while it is still actively streaming... review other wyze and camera brands for functions that make sense... not rigid"*
- *"Record should be with the camera you want to do that with"*
- *"Views should be able to drag whichever cameras they want to use... or see 4 with each other or 6... liberation of options.... optimized for the users"*
- *"We also work with tabs... the recordings should be on the recordings tab or something like that.... not below all cameras... scrolling down to see something that could be in the next tab is a real issue with these first builds... we should know better... also the scrolling function should be added to all lessons areas as an option... scrolling is only good when we read lessons"*
- *"Tlctherapysolutions App needs full scrolling for lessons according to the wife... Christina... fix it"*

## What was measured

- The Cameras page: a wall, 31 tiles, then a recorder list of all 31 cameras with their Record switches, then access and setup, all one scroll (his screenshots).
- The wall: one append-only list, one grid shape, no second wall.
- The TLC door's lessons: `PracticeLearn.jsx:687` renders `LessonFlowAudience` with no flow switch; the Steps / Scroll switch of DR-0749 lived only in the Learn guide (`ChurchLearn.jsx`).

## What changed

- `Cameras.jsx`: four tabs inside the tab (Live, Recordings, Who can see, Setup; remembered per device; a grant holder sees Live). Every tile carries Big, + View, Record with keep and the clip count (`TileRecord`, state lifted into `useRecording`), Garage, Why?. Views replace the wall: named, ordered by a drag handle (pointer events) or arrows while the players keep streaming (keyed, no restart), laid out Auto or 1 to 4 across, several at once, the old wall carried over as My view; Rename, Clear and Delete (both ask first).
- `cameras.js`: the views helpers (`loadViews` with the wall migration, `moveInView`, `viewCols`, `indexAtPoint`, and the rest).
- `LessonFlow.jsx`: the Steps / Scroll switch in the flow itself; `ChurchLearn.jsx` opts out because it renders its own.

## Verification

- Camera helpers 72, render 28 (tile Record PUTs the camera; the clip count opens the Recordings tab; + View adds; the arrow reorders with the same `<video>` elements and no new ticket; the layout select changes the columns; a second view; Remove; Clear asks first), UI standards green (destructive buttons ask), lint clean.
- Lesson flow: 4 new cases and the existing flow suites.

## For Darrell and Christina

Cameras: the top row is now Live · Recordings · Who can see · Setup. On Live, every camera has its own Record, + View and Big. Press + View on the cameras you want, then drag the ⠿ handle (or the arrows) to order them while they play, and pick how many across. TLC lessons: a Steps / Scroll pair sits above every lesson; Scroll shows the whole lesson at once and stays chosen on that device.

## Later — click a camera to make it the largest, click again to put it back (DR-0796)

Darrell, Firestick, a view open: *"Clicking inside the image of one camera makes it largest size... click again it goes to the previous position."* The live picture is now a button in a view and in the full-size window: the clicked camera is laid out alone (one column; in the window `fitGrid` for one tile, the bar naming it), the other tiles stay mounted and hidden so their streams keep running, and the second click puts every tile back where it was with no new ticket. Enter from a remote does the same. `cameras.test.js` 77 · `cameras-render.test.jsx` 30.

## Later — clips at the size you choose, and the stream health log (DR-0797, DR-0798)

Darrell: *"Pushing record only records to the nas... not to the cellphone correct... options to download based on size... smaller to large size files with their best resolutions"* — yes, Record is NAS-only (DR-0775); the ↓ beside every clip now opens Download with Original / Large 1080p / Medium 720p / Small 480p, each the best picture that fits, made once on the NAS by the container's ffmpeg (one worker, a 2 GB budget, orphans pruned; a hand-off race in the worker caught by the selftest and fixed under one lock).

*"Are there some type of logs we can use to make the cameras stream more continuous?... based on the information cameras provided can we make sure we optimize"* — the forwarder now samples go2rtc's `/api/streams` every 15 s and keeps an hour per camera (rate while watched, up%, drops only while watched, codecs), served at `/streams/health`, summarized in `/health`, written to `stream-health.json` for cams-diag; the one road the data decides today is the H.264 twin for a camera that sends only H.265, opened by a device whose `<video>` cannot decode it. The next optimization (Wyze `subtype=sd` for a starving camera) waits on a week of the log: `re-review 2026-10-14`.

- forwarder selftest green (sections 8k, 8l added) · `cameras.test.js` + `cameras-render.test.jsx` green.

## Later — the window did not stay live (DR-0799)

Darrell, Firestick window, two cameras whose own clocks had stopped at 17:08:3x: *"Cameras in the window don't stay live... the seconds timers show they are not live.... why?!!!!! Fix it!!!!!!"* Measured: a tile reconnected only on `ended` or `error`, so a silent freeze held its last frame for ever, and a stall left the tile behind the live edge for good; the window played every camera in HD through the Funnel. Shipped: every live tile is tended every 2 s — six seconds without movement reconnects it (counted as a stall), a lag over 3 s jumps to the edge, a smaller one is run down at 1.08×; the NAS registers every Wyze camera's own SD substream as `<id>_sd` and grids open it while the camera made largest opens HD; a hidden tile gives its stream back and re-opens in place. Also: the download tiers gain Extra large (2.5K) and Ultra (4K) for cameras that record that large (*"4k for those types if possible"*). Forwarder selftest green; camera suites green.

## Later — watch in place, any camera from the app, and the streaming ways reviewed (DR-0804, DR-0805, DR-0806)

Darrell, a tablet: *"Could not open the clip: signal is aborted without reason"* → *"Users should be able to just watch a stream from a recording... no need to download... all options."* Watch and Download per tier; one kept ticket; a 15 s ticket bound with one retry and a plain message (DR-0804). *"Build the other options... so I can set up rstp... and all other options so I can verify they work"*, *"Ring... all pathways... Even Google login options"*, *"I really meant Google signin... I can't verify nest"* → the Add-a-camera form (RTSP/RTMP, ONVIF, HTTP, any line; probed on the spot; Test/Remove) and the Ring sign-in with its code; the Google sign-in said honestly (set the maker's password once); Nest not built (DR-0805). *"Review all options for streaming... make sure we have all best options available"* and *"ways that updates don't break the connections and if they do we fix them expedited"* → DR-0806 / REV-0256: the sources, roads and transports reviewed with the cams-diag numbers (23 of 31 resting on other subnets; 16 streams, 2.03 MB/s over the Funnel), and `camera-health.yml` as the camera road's witness after every deploy with `priority:cameras` on regression.

- forwarder selftest green (8m added) · camera suites green.

## Later still — "805 we have no video... however the wyze cam app works... why?!!!" (DR-0807)

Measured on the NAS at 23:28 UTC (cams-diag 37702488586): go2rtc panicked at 18:25:39 CDT and restarted a second later (every tile blank at once); the ten 805 cameras sit at `10.0.0.x` with no route from the NAS, so go2rtc's LAN-only `wyze:` source times out on discovery while the Wyze app rides Wyze's relay; the forwarder ran 13-hour-old code because services-sync was held by a cap equal to its own clock. Shipped: Wyze's `online` joins the wall's arithmetic (off at the camera vs on-but-unreachable vs unknown) and the tile's Why?; the cap is 120. Named for the next move: a tailnet node at 805 or a relay-capable bridge on the NAS.

## Later — the same car stops going by (DR-0808) and the Wyze bridge on the NAS (DR-0809)

Darrell: *"the livestream from the cameras keep looping the video the same car keeps going by... on the Window view"* → DR-0799's keeper seeked an unseekable chunked MP4; now MP4 catches up by rate only and reconnects past 12 s, HLS keeps the jump, each reconnection is its own address. Then: *"Build the bridge on the NAS so 805 works"* → docker-wyze-bridge 2.10.3 beside go2rtc (facts read from its source before pinning), relay mode, on demand, loopback only, the same kept sign-in; the forwarder routes a camera on another network or without DTLS onto the bridge's RTSP line by MAC, keeps the record root-only, hands it back when reachable; the owner can force a road from a tile's Why?; Setup reads `/health.bridge`. Selftest 8n; the first `cams-diag` after merge is the field proof.

## Later — a parable is never a record (DR-0811)

Darrell, reading L40 on a tablet: *"This is a story that had my family name in it and it's not actually true... if you didn't know me you would believe it... I want this to be explained so my actual life narrative or my testimony is what it actually is... not made up... balanced."* Measured: 104 parables, 0 testimonies; the page said only "Picture this"; one parable wore the Poe surname; four put words in his mouth; two true records of his teaching wore the parable label. Shipped: every story says in words what it is (`lib/story-truth.js`, one source for page, spoken flow and notes); the surname leaves; the four speak of "the teacher"; the two become testimonies; a gate forbids real names in parables. He then spoke his own accounts and gave consent in his own words: *He Has Covered Me* (Psalms 68:5) joins L165 and *A Life Full of Everything* (Romans 12:2; 3 John 1:2) joins L166, both verbatim-verified.

## Later — three lessons spoken in one sitting (DR-0812, DR-0813, DR-0814)

After his testimony, Darrell spoke three teachings and closed each with one word, Lesson. Built the same night as Living Lessons L216 *A Life Full of Everything* (Yahweh always good; His Will first; consistency; the mind filled; the soul first), L217 *The Holy Spirit Brings a Sound Mind, Not Confusion* (His clarity; the eyes of the heart; the counterfeit named by the Word; the Word the only source) and L218 *Do Not Switch Up on His Way* (He changes not; His Way a Person and a path; documented; no offense taken; let Him win so we win). Four bands each, every verse verbatim from the in-app KJV, every band sending the reader to someone, each with its own gate; the house band gates all green.
