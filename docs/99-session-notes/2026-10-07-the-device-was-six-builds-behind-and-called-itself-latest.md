# 2026-10-07 — The device was six builds behind and called itself latest

**Layer 4 working note.** Decisions: DR-0781 (the live build names itself), DR-0782 (the live road chosen from the record). Pairs with DR-0776 to DR-0779 (the camera day).

## What Darrell saw

- 8:20 CDT: "BUILD 847EC24 · LATEST", "Snapshots every 5 s", a live view on HLS that "ended after 14 s (the NAS stops each live view at 0 s)". *"Snapshot every 5 seconds instead of continuously streaming?!"* *"It doesn't work!!!"* *"Tests are not working if you keep saying it works then doesn't when I try it!!!"*

## What was measured

- 847ec24 is the DR-0773 build (deploys 1489 and 1490, 06:54 and 08:01 UTC). Since then main deployed acad3221 (12:05 UTC), 793cb206 (12:21), 6b59aa3f (12:40) and 10b6419 (12:59). Every camera change of the day was in those four; his tablet ran none of them.
- `lib/freshness.js`: "Latest" = no waiting worker on the device. It never asked the server.
- `sw-door-scope.js:105` registers `/sw.js`; `_headers:48` forbids caching `/poetech-app/sw.js`. Not the same file.
- The shell is fetched network-first with `cache: 'no-store'` (`sw.js:192`), so a reload lands on the new build even when the worker path fails. Nothing triggered one.
- The NAS, by contrast, was current: forwarder c1f8df60 (the DR-0777 code), 31 streams (cams-diag 37625766143).

## What changed

- `vite.config.js` writes `dist/build.json`; `_headers` never caches it, nor `/sw.js`.
- `sw-update.js`: `watchLiveBuild` fetches the live build's name (no-store, cache-busting) on load, on visibility and every ten minutes; different = behind: event, `registration.update()`, one guarded reload after 8 s if no worker appears; a reload that does not stick is said as stuck. `freshness.js` flips the dot on the server's verdict; the dot's tap reloads when there is no worker to apply.
- `cameras.js` / `Cameras.jsx`: the live road chooser (Auto, MP4, HLS) with the measured record per road, the failed road swapped on reconnect, the record shown under the player.

## What is true about "tests pass but it doesn't work"

The tests prove the code. The outside witness proves the site serves main. Nothing proved the device ran it, and the device said it did. That gap is what DR-0781 closes: from the next deploy on, "Latest" is a comparison with the server, and a device behind brings itself forward.

## For Darrell

One more time by hand, because the fix cannot reach a device that is not asking: on the tablet, pull the page down to reload (or close the app fully and reopen). The header should read a build newer than 847EC24 within a few seconds; after that, no hand is needed again.
