// =============================================================================
// porch-hero — the front door's big picture can be the real porch, live
// =============================================================================
// Darrell, 2026-10-21, with a screenshot of "805 porch floodlight cam east":
// "If a tenant or owner has access to the cameras make the big image have the
// option to open with the porch Floodlight cam... instead of the hero image
// make it a hero stream of the porch... make sense?"
//
// Then, the reason it matters more than convenience: "The camera stream shows
// how access works... If a potential tenant uses the app they will be able to
// see the level of services that were provided by us." And: "Also... tenants
// and 1099 workers... so it promotes."
//
// So the big picture on the Poe Properties front door does two jobs. For a
// person whose device already holds a camera credential — the owner's family
// key or a door's grant — it can BE their porch, live, on the option they
// press. For everyone else, including the applicant who has no credential at
// all, it says in words how camera access actually works here and who gets it,
// because that is the level of service being promoted.
//
// WHAT THIS FILE WILL NOT DO. It never opens a camera to a visitor with no
// credential, and it never invents a stand-in one to look good on the front
// page. The NAS is the authority and already enforces this: /list with a grant
// returns only that grant's cameras and /ticket for any other camera is 403
// not-your-camera (cams_forwarder.py:4061 and its own self-test at :5255-5260).
// This file decides only WHICH camera stands in for a photograph of a front
// entry, and WHAT the door says to someone who holds nothing.
//
// The photograph stays the default. It is Darrell's own mock-up photo of the
// entryway ("This is the front page photo", PoePropertiesWelcome.jsx), not
// stock, so the live porch is an option BESIDE it — never a silent swap.

/**
 * WHICH CAMERA CAN STAND IN FOR THE ENTRYWAY PHOTOGRAPH, best first. Each tier
 * is a set of words that must ALL appear in the camera's name or id. An
 * allow-list on purpose: the frame it fills is a picture of a front entry, so a
 * back door, a hallway, a lot or a bedroom must never land in it by accident.
 * Darrell named the first tier himself — "the porch Floodlight cam".
 */
export const PORCH_PREFERENCE = Object.freeze([
  Object.freeze(['porch', 'floodlight']),
  Object.freeze(['porch']),
  Object.freeze(['front', 'door']),
  Object.freeze(['doorbell']),
  Object.freeze(['entry']),
  Object.freeze(['front']),
]);

const hay = (c) => `${String((c && c.name) || '')} ${String((c && c.id) || '')}`.toLowerCase();

/**
 * The camera this door's big picture would open, from the list the viewer's own
 * credential returned — or null when none of them is a front-of-house camera.
 * Null is a real answer: a grant that only opens the back lot gets the
 * photograph and the words, not a lot camera in the hero frame.
 */
export function porchCamera(cameras = []) {
  const list = (Array.isArray(cameras) ? cameras : []).filter((c) => c && c.id);
  for (const tier of PORCH_PREFERENCE) {
    const hit = list.find((c) => { const h = hay(c); return tier.every((w) => h.includes(w)); });
    if (hit) return hit;
  }
  return null;
}

/**
 * Is the live option offered, and on which camera? `status` is the camera
 * list's own state as the component read it, so an unknown road can never be
 * reported as "nothing to show" (DR-0076): it is reported as not-answered.
 */
export function heroOffer({ credential = null, cameras = [], status = 'loading' } = {}) {
  const kind = (credential && credential.kind) || 'none';
  if (kind === 'none' || !(credential && credential.token)) return { offered: false, camera: null, why: 'no-credential', kind: 'none' };
  if (status === 'loading') return { offered: false, camera: null, why: 'reading', kind };
  if (status !== 'ready') return { offered: false, camera: null, why: 'no-answer', kind };
  const cam = porchCamera(cameras);
  if (!cam) return { offered: false, camera: null, why: 'no-front-camera', kind };
  return { offered: true, camera: cam, why: '', kind };
}

/** The words on the option, and the line under it. Never a bare "Live". */
export function offerWords(offer) {
  const o = offer || {};
  if (o.offered && o.camera) {
    const name = String(o.camera.name || o.camera.id);
    return {
      button: 'Open the porch, live',
      note: o.kind === 'owner'
        ? `Your own camera key opens ${name} in this frame.`
        : `The access your landlord shared opens ${name} in this frame.`,
      alt: `${name}, live`,
    };
  }
  const why = o.why || 'no-credential';
  const note = why === 'reading' ? 'Checking which cameras your access opens…'
    : why === 'no-answer' ? 'The camera road did not answer, so this stays the photograph.'
    : why === 'no-front-camera' ? 'Your access opens cameras at this property, but none of them looks at a front entry, so this stays the photograph.'
    : '';
  return { button: '', note, alt: '' };
}

/**
 * HOW ACCESS WORKS, AND WHO GETS IT — the part a prospect reads (Darrell: "The
 * camera stream shows how access works... they will be able to see the level of
 * services that were provided by us... tenants and 1099 workers... so it
 * promotes"). Every line is traceable to shipped behaviour, not a brochure:
 *
 *  - the door's shared grant reaches the tenant and their household —
 *    whoSeesDoorCameras() in door-cameras.js, and model.js TENANT_TABS;
 *  - a 1099 worker or a short-stay guest is given access person by person —
 *    GIVE_ROLES in door-cameras.js (DR-0938), never by the door's grant;
 *  - for a length the owner chooses, or until taken back — ACCESS_DAYS;
 *  - taken back the moment the owner says so — revokeGrant(), and the NAS
 *    stops opening the camera, not just the tab;
 *  - the owner's own family key never leaves the owner's device — the grant is
 *    minted on the NAS and only names the cameras it names.
 */
export const ACCESS_STORY = Object.freeze([
  Object.freeze({ who: 'If you live here', line: 'the cameras your landlord shares with your door — the porch, the hallway, the lot — open on your phone, live, for you and your household.' }),
  Object.freeze({ who: 'If you do the work (1099)', line: 'you can ask for the camera you need for a job, and the owner grants it to you by name — not to everyone at the door.' }),
  Object.freeze({ who: 'Either way', line: 'the owner chooses which cameras and for how long, and can take it back at any time. Nothing opens a camera the grant does not name.' }),
]);

/** One line naming who is reading this, for the promoting card's heading. */
export function storyHeading(kind = 'none') {
  if (kind === 'owner') return 'Camera access you give at this door';
  if (kind === 'grant') return 'Camera access you were given';
  return 'Camera access at a Poe Properties door';
}
