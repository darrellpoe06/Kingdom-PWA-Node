// =============================================================================
// business-registry — a client's branded door as a DATA row (cf-registry)
// =============================================================================
// CLIENT-BUSINESS-FACTORY machinery (DR-0114): "a new client's door = a
// registry row, not a new component." This is the row shape; ?biz=<slug>
// resolves here (BusinessDoor.jsx), and Moore Divahs is the FIRST row —
// ?moore=1 stays as her legacy alias forever (printed QRs never break).
//
// PURE data + resolution only (no React/IO). The row carries everything the
// door engine needs to serve a different business: brand, policies, tabs,
// the instance slugs its RPC seams use, capture attribution, share URL, and
// manifest. Interior sections become per-row config as client #2's real
// needs land (build for the client that exists — never speculative flags).
// =============================================================================
import { MOORE_BRAND, MOORE_POLICIES } from './moore-divahs.js';
import { DOOR_TABS, MOORE_SHARE_URL, DOOR_SOURCE } from './moore-door.js';

export const BUSINESS_REGISTRY = {
  'moore-divahs': {
    slug: 'moore-divahs',
    brand: MOORE_BRAND,                  // label / tagline / accent (no email — #675: sign-in only, never rendered)
    policies: MOORE_POLICIES,
    tabs: DOOR_TABS,
    // Steward gates + steward-owned content (role check, showcase, messages).
    instanceSlug: 'moore-divahs',
    // Legacy home of her class/order rows (the cf-instance re-point rides a
    // later data increment; until then the door reads where the data IS).
    doorDataInstanceSlug: 'poe-family',
    capturePipeline: 'moore-orders',
    captureInstanceSlug: 'poe-family',
    captureSource: DOOR_SOURCE,
    shareUrl: MOORE_SHARE_URL,
    manifest: '/manifest-moore.webmanifest',
    legacyParam: 'moore',                // ?moore=1 keeps opening her door
  },
};

export function getBusiness(slug) {
  return BUSINESS_REGISTRY[slug] || null;
}

// ?biz=<slug> first; then any row's legacy param (?moore=1). null = no door.
export function resolveBusinessSlug(params) {
  const biz = params.get('biz');
  if (biz && BUSINESS_REGISTRY[biz]) return biz;
  for (const b of Object.values(BUSINESS_REGISTRY)) {
    if (b.legacyParam && params.get(b.legacyParam) === '1') return b.slug;
  }
  return null;
}
