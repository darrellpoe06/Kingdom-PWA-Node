# DR-0757 — The tax archive has a road from either door, and says so when it does not

**Date:** 2026-10-06
**Status:** Accepted
**Declared by:** Darrell

> "The upload of the taxes and the upload... should be able to see the documents either way... however it does not or didn't process the uploaded taxes Christina uploaded... why... fix it..." (Darrell, 2026-10-06.)

## Context

Christina uploaded a tax return through Books → Taxes, the screen built for exactly that (DR-0708; Darrell 2026-07-21: *"give a place to upload it inside PoeTech App for Christina instead of synology."*). It was never processed, and the documents were not visible. The question Darrell asked is *why*, so this record answers that first.

The app reaches the sovereign tax archive on the NAS through two calls, both of which build their URL **base-relative**:

- `app/src/lib/tax-archive.js` reads `` `${baseHref()}taxes/archive.json` `` (and `taxes/files/...` for each printable PDF).
- `app/src/lib/tax-upload.js` posts to `` `${baseHref()}taxes/upload` ``.

`baseHref()` resolves from `document.baseURI`.

## What was measured

Traced on `origin/main` at `edc633b3`, 2026-10-06:

| Fact | Where it is true |
| --- | --- |
| The web build is published at the **site root**, with `/poetech-app/*` rewritten onto it. | `app/vite.config.js` (the `BASE` comment) and `app/public/_redirects` |
| `index.html` carries **no `<base href>`**. | `app/index.html` — grep found none |
| So `document.baseURI` is `…/poetech-app/` through one door and `…/` through the other, and the same line of code asks for a different path at each. | the two facts above, together |
| A Function fronted `/poetech-app/taxes/*`. | `app/functions/poetech-app/taxes/[[path]].js` |
| **No Function fronted `/taxes/*` at the root.** | `find app/functions -path "*taxes*"` returned exactly one file |
| A path with no Function falls through to the single-page app, which answers **200 with HTML**. | `app/functions/_lib/funnel-proxy.js`'s own header, recording the identical 2026-07-30 incident: nine sovereign paths "silently fell through to the SPA" |
| `fetchTaxArchive` returned an **empty archive on any error**, including that HTML. | `tax-archive.js`, `catch { return { ...EMPTY }; }` |
| The screen then rendered "**No returns indexed yet** — Upload a return above". | `BooksTaxes.jsx`, the `docs.length === 0` block |
| `/nas-photos` — the same class of NAS road — has had a **root-level** Function all along. | `app/functions/nas-photos/[[path]].js` |

**So the answer to "why".** Through the root door the upload POST went to `/taxes/upload`, where nothing was listening; the PDF never left the browser, never reached the NAS, and `tax_ingest.py` never ran — a return uploaded and never processed. The read failed the same way at `/taxes/archive.json`, and because the failure was swallowed into an empty archive, the screen told her nothing was there and invited her to upload again. One door had a road; the other had a silent floor.

**Why the gate did not catch it.** `client-path-parity.test.js` exists for precisely this failure, but its extractor recorded a base-relative call at **one** base: `out.add('/poetech-app/' + …)`, with the comment "because the app's base scope is /poetech-app/ (manifest-pinned)". That assumption was false the moment the build began answering at the root as well, so the root road was never checked.

## Impact

- **An upload from either door reaches the NAS**, so a return Christina sends is stored and ingested.
- **The documents are visible either way**, which is what was asked for.
- **A read that cannot reach the NAS says so** instead of claiming the archive is empty. The two are different problems and a family member is no longer told to re-upload a return that was never the issue.
- **The gate now covers every door**, so the next base-relative feature cannot ship with a road from only one.

## Decision

1. **`app/functions/taxes/[[path]].js`** — the same three-line route over `makeFunnelProxy({ upstreamPrefix: '/taxes', label: 'taxes' })` at the site root, matching what `/nas-photos` has always had. The scoped route stays; both forward to the same upstream, so one NAS answers either door. Nothing about who may read changes: the NAS still requires the family key.
2. **A base-relative client call is checked at EVERY door the app answers at.** `client-path-parity.test.js` gains `APP_BASES = ['/poetech-app/', '/']` and records each call once per base.
3. **`fetchTaxArchive` reports why it is empty.** A new `ARCHIVE_REASON` distinguishes `ok`, `no-road` (something answered but not JSON — the SPA shell), `unreachable` (the far end did not answer) and `none`. A 200 whose body is not JSON, or whose JSON has no `documents` array, is a missing road, not an archive.
4. **The screen says which it is.** When the read did not succeed, `BooksTaxes` shows a bordered notice before any how-to: the index could not be reached, nothing below is a statement about what has been filed, and an upload from this screen would not arrive either. The "No returns indexed yet" invitation now renders only when the NAS genuinely answered with an empty list.

## Verification

- **Proven to catch (DR-0076 §3).** With the new root Function moved aside — the exact state Christina met — the parity gate fails and names the three dead roads: `/taxes/archive.json`, `/taxes/files`, `/taxes/upload`, each reported as "silently falls to the SPA and serves its fallback". Restoring the file returns it to green. Both runs were executed, not predicted.
- **`app/src/__tests__/tax-archive-road.test.js`, 9 tests passing:** a Function exists at both doors; both carry `upstreamPrefix: '/taxes'`; the root route's import of the shared factory resolves on disk; HTML-instead-of-JSON reads as `no-road`; JSON without a `documents` array reads as `no-road`; a rejected fetch and a non-ok response read as `unreachable`; a real answer reads as `ok` with its documents; **and a NAS that genuinely holds nothing reads as `ok` with an empty list**, so the honest-empty case is not mistaken for a fault.
- **`client-path-parity.test.js`, 3 tests passing**, with its extractor pin extended to assert the root door of a base-relative call and its scanner pin extended to `/taxes/archive.json` and `/taxes/upload`, so a green run cannot mean the scanner stopped looking.
- **Lint clean** on every file touched.
- **Not verified here, and named:** that the NAS Caddy/Funnel answers `/taxes/*` for traffic arriving through the new root proxy. The proxy forwards to the identical upstream as the proven scoped route, so the hop beyond Cloudflare is unchanged, but this sandbox has no route to the NAS to observe it end to end.

## Re-review

**re-review: 2026-10-13.** Confirm on the live site, from the root door, that the archive lists the returns and that an upload from that door is stored and ingested. If Christina's earlier upload never left her browser, it must be uploaded again; check with her whether the PDF is still on her device.
