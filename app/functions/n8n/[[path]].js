// /n8n/* is CLOSED (2026-11-19, DR-1607). It answers 410 Gone and forwards
// nothing.
//
// This route used to strip its prefix and forward ANY path to the Funnel ROOT,
// which is the legacy NAS n8n. So /n8n/setup, /n8n/signin, /n8n/rest/* and
// /n8n/form/* reached the n8n editor, its REST API, its first-run owner setup
// and its form endpoints from the public internet. That is the same class as
// Drupal's leftover core/install.php (SA-CORE-2026-017, 2026-11-18): an
// installer surface still reachable after install. n8n form/webhook handling
// itself carried an unauthenticated takeover in 2026 (CVE-2026-21858).
//
// Nothing in the app calls this route: every family-facing flow moved to
// sovereign Python (DR-0617, "No n8n!!!"), and a repo-wide search on
// 2026-11-19 found zero /n8n/webhook/* callers in app/src. The file stays so
// the route answers a clear, signed 410 instead of falling through to the SPA,
// and so the legacy path cannot be reused by accident.
import { ROAD_HEADER, ROAD_VALUE } from '../_lib/funnel-proxy.js';

export async function onRequest() {
  return new Response(
    JSON.stringify({
      error: 'the /n8n road is closed',
      code: 'road-closed',
      detail: 'n8n is retired; every feature is served by its own sovereign road (DR-0617, DR-1607)',
    }),
    { status: 410, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', [ROAD_HEADER]: ROAD_VALUE } }
  );
}
