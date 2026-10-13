// Same-origin reverse proxy for /taxes/* — THE SAME ROAD, FROM THE OTHER DOOR.
//
// Darrell 2026-10-06: "The upload of the taxes and the upload... should be able
// to see the documents either way... however it does not or didn't process the
// uploaded taxes Christina uploaded."
//
// WHY THIS FILE EXISTS. lib/tax-archive.js and lib/tax-upload.js build their URL
// BASE-RELATIVE (`${baseHref()}taxes/...`, from document.baseURI). The web build
// is published at the SITE ROOT with /poetech-app/* rewritten onto it
// (public/_redirects), and index.html carries no <base href> — so the very same
// app answers at TWO doors and baseURI differs between them:
//
//   opened at /poetech-app/  -> GET /poetech-app/taxes/archive.json  (a Function existed)
//   opened at the site root  -> GET /taxes/archive.json              (NOTHING existed)
//
// At the root door the request fell through to the SPA shell, which answers 200
// with HTML; fetchTaxArchive's JSON parse threw and it returned an EMPTY archive,
// so the screen showed no documents and said nothing was wrong. The upload POST
// to /taxes/upload fell through the same hole, so the PDF never reached the NAS
// and the ingest never ran — which is exactly a return uploaded and never
// processed. One door worked, the other was a silent floor.
//
// This is the same three-line route over the shared factory that /nas-photos has
// carried at the root all along; the asymmetry was the whole defect. Nothing
// about who may read changes: the NAS still holds the family key.
import { makeFunnelProxy } from '../_lib/funnel-proxy.js';
export const onRequest = makeFunnelProxy({ upstreamPrefix: '/taxes', label: 'taxes' });
