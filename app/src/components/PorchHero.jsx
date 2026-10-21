// =============================================================================
// PorchHero — the front door's big picture, with the real porch behind an option
// =============================================================================
// Darrell, 2026-10-21: "If a tenant or owner has access to the cameras make the
// big image have the option to open with the porch Floodlight cam... instead of
// the hero image make it a hero stream of the porch." Then why it matters:
// "The camera stream shows how access works... If a potential tenant uses the
// app they will be able to see the level of services that were provided by
// us." And: "Also... tenants and 1099 workers... so it promotes."
//
// THE REALITY TRACE (DR-0061), before a line of this was written:
//
//  - REAL DATA. The photograph is /properties/welcome-entry.jpg, a file in
//    app/public — Darrell's own mock-up entryway, not stock. The live picture
//    is the NAS camera road: listUrl() for which cameras this device's
//    credential opens, then TileLive's ticket + liveUrl() for the picture. The
//    credential is cameraCredential({bridge: bridgeToken()}) — the owner's
//    family key on a family device, or the grant TenantCamerasTab already
//    stores when a landlord shares a door's cameras. Nothing is painted and
//    nothing is seeded: with no credential there is no live option at all.
//  - END TO END. Both credential paths are shipped and live: bridgeToken()
//    (nas-photos.js) and saveGrantToken() from DoorCameras.jsx's tenant tab.
//  - THE SURFACE. WelcomeHero in PoePropertiesWelcome.jsx, rendered by
//    PropertiesDoor.jsx:504 whenever no portal is chosen — which is the first
//    screen every applicant, tenant, worker and owner meets. NOT OBSERVED
//    LIVE: this sandbox has no route to poetech.us (403 at the egress proxy),
//    so nobody has seen this rendered on the real site. Said, not assumed.
//  - THE ASSUMPTION, STATED. "The big image" and "the hero image" are the
//    .pp-photo frame in WelcomeHero. It is the only big hero photograph on the
//    Properties surface and the only asset named like one; HomeHero carries no
//    image at all.
//
// WHY THE PHOTOGRAPH STAYS THE DEFAULT, AND THE STREAM IS A PRESS AWAY. Three
// reasons, and all three are load-bearing:
//  1. He asked for an option — "the OPTION to open with the porch".
//  2. The NAS allows LIVE_PER_CAMERA = 3 live views of one camera
//     (cams_forwarder.py:448) and ends the oldest when a fourth opens. A hero
//     that autoplayed on every visit would spend the family's own slots on
//     people who are not watching.
//  3. The photograph is Darrell's choice of picture. A silent swap would
//     overrule him to show him something he already has in his cameras tab.
//
// PRIVACY IS THE NAS's, NOT THIS FILE'S. /list with a grant returns only that
// grant's cameras and /ticket for any other is 403 not-your-camera
// (cams_forwarder.py:4061, proven in its own self-test at :5255-5260). So this
// component cannot show a camera the viewer was not granted even if it asked
// for one, and a visitor holding nothing is never offered a picture.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TileLive } from './Cameras.jsx';
import { cameraCredential, listUrl, parseCameraList, authHeaders, fetchWithTimeout, FETCH_TIMEOUT_MS } from '../lib/cameras.js';
import { bridgeToken } from '../lib/nas-photos.js';
import { heroOffer, offerWords, ACCESS_STORY, storyHeading } from '../modules/properties/porch-hero.js';

/**
 * The big picture. `photo` is the <img> the door already drew — it is passed in
 * rather than rebuilt, so the photograph this replaces stays byte-for-byte the
 * one PoePropertiesWelcome owns.
 */
export default function PorchHero({ photo = null, credential = null, fetchImpl = null }) {
  const cred = credential || cameraCredential({ bridge: bridgeToken() });
  const [list, setList] = useState({ status: cred.token ? 'loading' : 'no-credential', cameras: [] });
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState('');
  const alive = useRef(true);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  // WHICH CAMERAS THIS DEVICE'S CREDENTIAL OPENS. Asked once, with the viewer's
  // own token, so the answer is the viewer's answer and not the family's.
  useEffect(() => {
    if (!cred.token) { setList({ status: 'no-credential', cameras: [] }); return undefined; }
    let on = true;
    const f = fetchImpl || globalThis.fetch;
    (async () => {
      try {
        const r = await fetchWithTimeout(listUrl(), { headers: authHeaders(cred.token) }, FETCH_TIMEOUT_MS, f);
        let body = null; try { body = await r.json(); } catch { body = null; }
        if (!on) return;
        // An unknown answer is NOT "no cameras" (DR-0076): the status carries
        // the HTTP code so the words can say the road did not answer.
        setList(r.status === 200 ? { status: 'ready', cameras: parseCameraList(body) } : { status: `http-${r.status}`, cameras: [] });
      } catch { if (on) setList({ status: 'unreachable', cameras: [] }); }
    })();
    return () => { on = false; };
  }, [cred.token, fetchImpl]);

  const offer = heroOffer({ credential: cred, cameras: list.cameras, status: list.status });
  const words = offerWords(offer);
  // A camera that goes away under a live hero closes it, so the frame falls
  // back to the photograph rather than holding a black box (DR-1153's lesson
  // in a smaller place).
  useEffect(() => { if (live && !offer.offered) setLive(false); }, [live, offer.offered]);
  const onFailed = useCallback((why) => { if (alive.current) setFailed(String(why || '')); }, []);
  const open = () => { setFailed(''); setLive(true); };
  // Closing UNMOUNTS TileLive, and its own cleanup pauses the element, clears
  // its src and closes any direct road (camera-video.js dropVideo, DR-1097).
  // That is what hands the NAS its slot back instead of leaving an orphan.
  const close = () => { setLive(false); setFailed(''); };

  return (
    <>
      <div className="pp-photo" data-testid="porch-hero" data-live={live ? 'true' : 'false'} data-offered={offer.offered ? 'true' : 'false'}>
        {live && offer.camera ? (
          <TileLive cam={offer.camera} token={cred.token} liveMax={0} onFailed={onFailed} />
        ) : photo}
        <span className="pp-photo-band" aria-hidden="true" />
        {offer.offered ? (
          <button type="button" onClick={live ? close : open} className="pp-cam-open" data-testid="porch-hero-toggle">
            {live ? 'Back to the photo' : words.button}
          </button>
        ) : null}
      </div>
      {offer.offered ? (
        <p className="pp-cam-note" data-testid="porch-hero-note">{live
          ? `${offer.camera.name || offer.camera.id}, live from the property${failed ? ` — ${failed}` : ''}.`
          : words.note}</p>
      ) : words.note ? (
        <p className="pp-cam-note" data-testid="porch-hero-why">{words.note}</p>
      ) : null}
      <AccessStory kind={cred.kind} />
    </>
  );
}

/**
 * HOW ACCESS WORKS — the promoting half, and the half an applicant reads. It
 * renders for EVERYONE, with or without a credential, because the person who
 * most needs to know what Poe Properties provides is the one who does not have
 * it yet. Every line is a statement about shipped behaviour (see ACCESS_STORY
 * in porch-hero.js for the file and line each one answers to), so this is a
 * description of the service, never a promise the system cannot keep.
 */
export function AccessStory({ kind = 'none' }) {
  return (
    <section className="pp-cam-story" data-testid="porch-hero-story" data-kind={kind}>
      <h3 className="pp-cam-story-h">{storyHeading(kind)}</h3>
      <dl className="pp-cam-story-list">
        {ACCESS_STORY.map((s) => (
          <div key={s.who} className="pp-cam-story-row">
            <dt className="pp-cam-story-who">{s.who}</dt>
            <dd className="pp-cam-story-line">{s.line}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
