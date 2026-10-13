// =============================================================================
// StayWall — "Life at 805": a picture of life at the property, handed to the
// family signed over, approved by them, shown to the world (DR-1010, 0289)
// =============================================================================
// Four surfaces, one table:
//   ShareStayPicture — the poster's form (a tenant or household member signed
//                      in, the family, or a guest through the door's card).
//                      It signs what the DATABASE handed it: the wording's
//                      version and fingerprint come from stay_wall_wording,
//                      and the form sends them back with the typed name, the
//                      three attestations, the two sentences, and the device
//                      clock. The server stamps its own instant.
//   MyStayPictures   — what I shared, where each stands, "Ask to take it down".
//   StayWallDesk     — the family's: pending first, approve / decline / remove,
//                      "Use in the listing" under the counsel rule, and the
//                      record that counsel reviewed the wording.
//   LifeWall         — the public wall on the shelf, per building, no account.
// =============================================================================
import React, { useCallback, useEffect, useState } from 'react';
import { boundedRead } from '../../lib/bounded-read.js';
import { compressImageFile, isLikelyImageFile } from '../../lib/image.js';
import { stampImage, stampFileName } from '../../lib/brand-stamp.js';
import Lightbox from '../../components/Lightbox.jsx';
import { applyUrl } from './apply-link.js';
import {
  loadStayWallWording, submitStayPicture, submitStayPictureAsGuest, loadMyStayPictures, loadDoorStayPictures,
  loadStayPictureImage, decideStayPicture, removeStayPicture, askStayPictureRemoval, askStayPictureRemovalAsGuest,
  putStayPictureInListing, attestStayWallWording, loadPublicStayWalls, loadPublicStayWallImage,
} from './cloud.js';
import {
  STAY_WALL_ATTESTATION, ESIGN_CONSENT, ATTESTATIONS, LIMITS, validateSubmission, statusLine,
  groupWalls, wallsForShelf, rememberGuestShare, guestShares,
  PICTURE_MAX_WIDTH, PICTURE_QUALITY, THUMB_MAX_WIDTH, THUMB_QUALITY,
} from './stay-wall.js';

const serif = { fontFamily: '"Fraunces", Georgia, serif' };
const READ_MS = 8000;
const field = 'text-sm border border-[#E8E4DC] px-2 py-2 bg-white text-[#1A1815]';
const stamp = (iso) => (iso ? new Date(iso).toLocaleString() : '');

const Btn = ({ children, onClick, tone = 'ghost', disabled, ...rest }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] ${
      tone === 'primary' ? 'bg-[#2F5D50] text-white border-[#2F5D50]'
        : tone === 'danger' ? 'bg-white text-[#B85838] border-[#B85838]'
          : 'bg-white text-[#1A1815] border-[#E8E4DC]'
    } disabled:opacity-50`}
    {...rest}
  >{children}</button>
);

/** The words, read in place, with the draft notice when counsel has not attested. */
function WordingBlock({ wording }) {
  if (!wording) return null;
  return (
    <details className="mt-2 border border-[#E8E4DC] bg-[#FAF8F4] p-2" data-testid="stay-wall-wording">
      <summary className="text-xs text-[#2F5D50] cursor-pointer" style={serif}>
        Read the rights assignment ({wording.version})
      </summary>
      <pre className="whitespace-pre-wrap text-xs text-[#1A1815] mt-2" style={serif}>{wording.body}</pre>
      <p className="text-[0.6875rem] text-[#6B665E] mt-2">Fingerprint {String(wording.body_hash || '').slice(0, 12)}…</p>
    </details>
  );
}

/** The default shrink: the phone makes the picture and its thumbnail (DR-0908's road, HEIC included). */
async function shrinkFile(file) {
  const image = await compressImageFile(file, PICTURE_MAX_WIDTH, PICTURE_QUALITY);
  const thumb = await compressImageFile(file, THUMB_MAX_WIDTH, THUMB_QUALITY);
  return { image, thumb, name: file.name };
}

/**
 * The poster's form. `rentalId` for a signed-in poster; `token` for the door's
 * guest card. `shrink` is the picture road, replaceable in a test.
 */
export function ShareStayPicture({ rentalId = null, token = null, onDone = null, shrink = shrinkFile }) {
  const [wording, setWording] = useState(undefined); // undefined = asking; null = unreached
  const [pictures, setPictures] = useState([]);
  const [form, setForm] = useState({ caption: '', name: '', showName: false, own: false, consent: false, minors: false, read: false, sign: false });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');
  const [done, setDone] = useState(null);

  useEffect(() => {
    let live = true;
    boundedRead(loadStayWallWording(rentalId), READ_MS).then((r) => { if (live) setWording(r.ok ? r.wording : null); });
    return () => { live = false; };
  }, [rentalId, token]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const pick = async (e) => {
    const chosen = Array.from(e.target.files || []).filter(isLikelyImageFile);
    e.target.value = '';
    if (!chosen.length) return;
    setBusy(true); setSaid('');
    const made = [];
    for (const f of chosen) {
      try { made.push(await shrink(f)); } catch (err) { setSaid(`${f.name}: ${err && err.message ? err.message : 'could not be read'}`); }
    }
    setBusy(false);
    if (made.length) setPictures((p) => [...p, ...made].slice(0, LIMITS.pictures));
  };
  const send = async () => {
    const v = validateSubmission({ ...form, pictures });
    setErrors(v.errors);
    if (!v.ok || !wording) return;
    setBusy(true); setSaid('');
    const sent = []; let refused = '';
    for (const p of pictures) {
      const a = {
        rentalId, token, image: p.image, thumb: p.thumb, caption: form.caption, name: form.name, showName: form.showName,
        own: form.own, consent: form.consent, minors: form.minors,
        wordingVersion: wording.version, wordingHash: wording.body_hash,
        attestation: STAY_WALL_ATTESTATION, consentText: ESIGN_CONSENT, deviceAt: new Date().toISOString(),
      };
      const r = token ? await submitStayPictureAsGuest(a) : await submitStayPicture(a);
      if (r.ok) { sent.push(r.id); if (token) rememberGuestShare(token, r.id); } else { refused = r.reason || 'It did not send.'; break; }
    }
    setBusy(false);
    if (!sent.length) { setSaid(refused || 'It did not send. Please try again.'); return; }
    setPictures([]);
    setDone({ n: sent.length, at: new Date(), refused });
    if (onDone) onDone(sent);
  };

  if (done) {
    return (
      <div className="border border-[#E8E4DC] bg-white p-3" data-testid="share-stay-done">
        <p className="text-sm text-[#1A1815]" style={serif}>
          Thank you. {done.n === 1 ? 'Your picture is' : `Your ${done.n} pictures are`} with the family, signed {done.at.toLocaleString()}. They look at every picture before it goes on the wall.
        </p>
        {done.refused && <p className="text-xs text-[#B85838] mt-1" role="alert">One did not send: {done.refused}</p>}
        <div className="mt-2"><Btn onClick={() => setDone(null)}>Share another</Btn></div>
      </div>
    );
  }
  return (
    <div className="border border-[#E8E4DC] bg-white p-3" data-testid="share-stay-picture">
      <p className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-1">Share a picture from your stay</p>
      <p className="text-xs text-[#5A5751]" style={serif}>
        A picture of life here, for the community wall and the listing. The family looks at every one before it is shown.
      </p>
      <div className="flex flex-wrap gap-2 mt-2">
        <label className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#E8E4DC] bg-white text-[#1A1815] cursor-pointer">
          Take a picture
          <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={pick} aria-label="Take a picture" />
        </label>
        <label className="text-[0.625rem] uppercase tracking-wider px-3 py-2 border border-[#E8E4DC] bg-white text-[#1A1815] cursor-pointer">
          Choose pictures
          <input type="file" accept="image/*" multiple className="sr-only" onChange={pick} aria-label="Choose pictures" />
        </label>
      </div>
      {pictures.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-2" data-testid="share-stay-ready">
          {pictures.map((p, i) => (
            <li key={`${p.name}-${i}`} className="relative">
              <img src={p.thumb || p.image} alt={p.name} className="w-20 h-20 object-cover border border-[#E8E4DC]" />
              <button type="button" aria-label={`Remove ${p.name}`} onClick={() => setPictures((all) => all.filter((_, n) => n !== i))}
                className="absolute -top-1 -right-1 bg-white border border-[#E8E4DC] text-[0.625rem] px-1">×</button>
            </li>
          ))}
        </ul>
      )}
      {errors.pictures && <p className="text-xs text-[#B85838] mt-1">{errors.pictures}</p>}
      <label className="block text-xs text-[#5A5751] mt-2">A few words about it (optional)
        <input value={form.caption} onChange={set('caption')} maxLength={LIMITS.caption} aria-label="A few words about it" className={`${field} block w-full`} style={serif} />
      </label>
      <fieldset className="mt-3" data-testid="share-stay-attestations">
        <legend className="text-xs text-[#5A5751]">Three things you are saying are true</legend>
        {ATTESTATIONS.map((a) => (
          <label key={a.key} className="flex items-start gap-2 mt-1 text-sm text-[#1A1815]" style={serif}>
            <input type="checkbox" checked={form[a.key]} onChange={set(a.key)} aria-label={a.label} />
            <span>{a.label}{errors[a.key] && <span className="block text-xs text-[#B85838]">{errors[a.key]}</span>}</span>
          </label>
        ))}
      </fieldset>
      {wording === undefined && <p className="text-xs text-[#5A5751] mt-2" style={serif}>Reading the rights assignment…</p>}
      {wording === null && <p className="text-xs text-[#B85838] mt-2" role="alert" data-testid="share-stay-unreached">The rights assignment could not be read right now, so nothing can be signed. Try again in a moment.</p>}
      {wording && (
        <>
          <WordingBlock wording={wording} />
          {!wording.counsel_attested && (
            <p className="text-[0.6875rem] text-[#6B665E] mt-1" data-testid="share-stay-draft">
              This wording is a draft until the family's counsel has reviewed it. Signing it records exactly what you agreed to.
            </p>
          )}
          <label className="flex items-start gap-2 mt-2 text-sm text-[#1A1815]" style={serif}>
            <input type="checkbox" checked={form.read} onChange={set('read')} aria-label="I have read it" />
            <span>{STAY_WALL_ATTESTATION}{errors.read && <span className="block text-xs text-[#B85838]">{errors.read}</span>}</span>
          </label>
          <label className="flex items-start gap-2 mt-2 text-sm text-[#1A1815]" style={serif}>
            <input type="checkbox" checked={form.sign} onChange={set('sign')} aria-label="I agree to sign electronically" />
            <span>{ESIGN_CONSENT}{errors.sign && <span className="block text-xs text-[#B85838]">{errors.sign}</span>}</span>
          </label>
          <label className="block text-xs text-[#5A5751] mt-2">Your full legal name
            <input value={form.name} onChange={set('name')} maxLength={LIMITS.name} aria-label="Your full legal name" className={`${field} block w-full`} style={serif} />
            {errors.name && <span className="block text-xs text-[#B85838]">{errors.name}</span>}
          </label>
          <label className="flex items-center gap-2 mt-2 text-sm text-[#1A1815]" style={serif}>
            <input type="checkbox" checked={form.showName} onChange={set('showName')} aria-label="Show my name on the wall" />
            Show my name beside the picture
          </label>
          <div className="mt-3">
            <Btn tone="primary" disabled={busy} onClick={send} data-testid="share-stay-send">{busy ? 'Sending…' : 'Sign and send it to the family'}</Btn>
          </div>
        </>
      )}
      {said && <p className="text-xs text-[#B85838] mt-2" role="alert" data-testid="share-stay-said">{said}</p>}
    </div>
  );
}

/** What I shared and where each stands; a take-down is one tap. */
export function MyStayPictures({ token = null, refreshKey = 0 }) {
  const [rows, setRows] = useState([]);
  const [said, setSaid] = useState('');
  const load = useCallback(async () => {
    if (token) {
      setRows(guestShares(token).map((id) => ({ id, status: 'shared', caption: '' })));
      return;
    }
    const r = await boundedRead(loadMyStayPictures(), READ_MS, { ok: false });
    setRows(r.ok ? r.pictures : []);
  }, [token]);
  useEffect(() => { load(); }, [load, refreshKey]);
  const ask = async (id) => {
    const r = token ? await askStayPictureRemovalAsGuest(token, id) : await askStayPictureRemoval(id);
    setSaid(r.ok ? 'Asked. It is off the wall now; the family keeps the file as a record of your stay.' : `Not done: ${r.reason}`);
    if (r.ok) { if (token) setRows((all) => all.map((p) => (p.id === id ? { ...p, status: 'asked' } : p))); else load(); }
  };
  if (!rows.length) return null;
  return (
    <div className="mt-3" data-testid="my-stay-pictures">
      <p className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mb-1">What you shared</p>
      <ul>
        {rows.map((p) => (
          <li key={p.id} className="flex items-center gap-2 border-b border-[#F0EDE6] py-2" data-testid="my-stay-picture">
            {p.thumb && <img src={p.thumb} alt={p.caption || 'your picture'} className="w-12 h-12 object-cover border border-[#E8E4DC]" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#1A1815] truncate" style={serif}>{p.caption || (token ? `Picture ${String(p.id).slice(0, 8)}` : 'No caption')}</div>
              <div className="text-xs text-[#5A5751]">{token ? (p.status === 'asked' ? 'You asked for it to come down' : 'Shared from this device') : statusLine(p)}</div>
            </div>
            {(token ? p.status !== 'asked' : (p.status === 'approved' || p.status === 'pending') && !p.removal_asked_at) && (
              <Btn onClick={() => ask(p.id)} aria-label={`Ask to take down ${p.caption || 'this picture'}`}>Ask to take it down</Btn>
            )}
          </li>
        ))}
      </ul>
      {said && <p className="text-xs text-[#5A5751] mt-2" role="status">{said}</p>}
    </div>
  );
}

/** The poster's whole tab: share, then what was shared. */
export function StayWallMine({ rentalId = null, token = null }) {
  const [n, setN] = useState(0);
  return (
    <div>
      <ShareStayPicture rentalId={rentalId} token={token} onDone={() => setN((x) => x + 1)} />
      <MyStayPictures token={token} refreshKey={n} />
    </div>
  );
}

const WHO = { tenant: 'a tenant', household: 'a household member', guest: 'a guest', family: 'the family' };

/** One picture on the family's desk. */
function DeskRow({ p, onOpen, onDecide, onRemove, onListing, busy }) {
  const [reason, setReason] = useState('');
  const who = `${p.show_name ? p.poster_name : WHO[p.submitted_role] || p.submitted_role}${p.show_name ? '' : ` (signed ${p.poster_name})`}`;
  return (
    <li className="flex gap-3 border-b border-[#F0EDE6] py-2" data-testid="stay-desk-row" data-status={p.status}>
      <button type="button" onClick={() => onOpen(p)} aria-label={`Open ${p.caption || 'this picture'} larger`} className="shrink-0">
        {p.thumb ? <img src={p.thumb} alt={p.caption || 'picture'} className="w-20 h-20 object-cover border border-[#E8E4DC]" /> : <span className="block w-20 h-20 bg-[#FAF8F4]" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-[#1A1815]" style={serif}>{p.caption || 'No caption'}</div>
        <div className="text-xs text-[#5A5751]">From {who} · signed {stamp(p.signed_at)} under {p.wording_version}</div>
        <div className="text-xs text-[#5A5751]" data-testid="stay-desk-status">
          {statusLine(p)}{p.removal_asked_at ? ' · the poster asked for it to come down' : ''}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {p.status === 'pending' && <Btn tone="primary" disabled={busy} onClick={() => onDecide(p.id, 'approved')} aria-label={`Approve ${p.caption || 'this picture'}`}>Approve</Btn>}
          {(p.status === 'pending' || p.status === 'approved') && (
            <>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why not (optional)" aria-label="Why not" className={`${field} w-40`} style={serif} maxLength={300} />
              <Btn disabled={busy} onClick={() => onDecide(p.id, 'declined', reason)} aria-label={`Decline ${p.caption || 'this picture'}`}>Decline</Btn>
            </>
          )}
          {p.status === 'approved' && !p.removal_asked_at && (
            <Btn disabled={busy} onClick={() => onListing(p.id, !p.listing_photo_id)} aria-label={`${p.listing_photo_id ? 'Take out of' : 'Use in'} the listing: ${p.caption || 'this picture'}`}>
              {p.listing_photo_id ? 'Take it out of the listing' : 'Use it in the listing'}
            </Btn>
          )}
          {p.status !== 'removed' && <Btn tone="danger" disabled={busy} onClick={() => onRemove(p.id, reason)} aria-label={`Remove ${p.caption || 'this picture'}`}>Remove</Btn>}
        </div>
      </div>
    </li>
  );
}

/**
 * The family's desk for one door. `canAttest`: the owner or an admin records
 * counsel's review of the wording (the counsel rule; DR-0936 §3).
 */
export function StayWallDesk({ rentalId, instanceId = null, canAttest = false }) {
  const [rows, setRows] = useState(null);
  const [wording, setWording] = useState(null);
  const [open, setOpen] = useState(null); // { src, alt }
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');
  const [note, setNote] = useState('');
  const [sharing, setSharing] = useState(false);

  const load = useCallback(async () => {
    if (!rentalId) { setRows([]); return; }
    const [r, w] = await Promise.all([
      boundedRead(loadDoorStayPictures(rentalId), READ_MS, { ok: false }),
      boundedRead(loadStayWallWording(rentalId), READ_MS, { ok: false }),
    ]);
    setRows(r.ok ? r.pictures : null);
    setWording(w.ok ? w.wording : null);
  }, [rentalId]);
  useEffect(() => { load(); }, [load]);

  const act = async (fn, after) => {
    setBusy(true); setSaid('');
    const r = await fn();
    setBusy(false);
    setSaid(r.ok ? after : `Not done: ${r.reason}`);
    if (r.ok) load();
  };
  const openLarge = async (p) => {
    const r = await boundedRead(loadStayPictureImage(p.id), READ_MS, { ok: false });
    if (r.ok && r.image) setOpen({ src: r.image, alt: p.caption || 'picture' });
    else setSaid('The picture could not be read right now.');
  };

  if (!rentalId) return <p className="text-xs text-[#5A5751]" style={serif}>Pick a door first.</p>;
  const pending = (rows || []).filter((p) => p.status === 'pending');
  const onWall = (rows || []).filter((p) => p.status === 'approved');
  const rest = (rows || []).filter((p) => p.status === 'declined' || p.status === 'removed');
  return (
    <div data-testid="stay-wall-desk">
      <p className="text-xs text-[#5A5751]" style={serif}>
        Pictures tenants and guests shared of life here, signed over to you. Approved pictures go on the public wall for this building; the ones you pick go in the listing too.
      </p>
      {wording && (
        <div className="mt-2 border border-[#E8E4DC] bg-[#FAF8F4] p-2" data-testid="stay-wall-counsel">
          <div className="text-xs text-[#1A1815]" style={serif}>
            Wording {wording.version}: {wording.counsel_attested ? 'counsel reviewed it; approved pictures may be used in the listing.' : 'a draft until counsel reviews it. The wall runs; using a picture in the listing waits.'}
          </div>
          {!wording.counsel_attested && canAttest && instanceId && (
            <div className="flex flex-wrap gap-2 mt-2">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Who reviewed it, when (optional)" aria-label="Counsel's review, in a few words" className={`${field} w-64`} style={serif} maxLength={300} />
              <Btn tone="primary" disabled={busy} onClick={() => act(() => attestStayWallWording(instanceId, wording.version, note), 'Recorded.')} data-testid="stay-wall-attest">
                Record that counsel reviewed this wording
              </Btn>
            </div>
          )}
          <WordingBlock wording={wording} />
        </div>
      )}
      {rows === null && <p className="text-xs text-[#B85838] mt-2" role="alert">The wall could not be read right now.</p>}
      {rows && rows.length === 0 && <p className="text-xs text-[#5A5751] mt-2" style={serif} data-testid="stay-wall-empty">Nothing shared yet. Tenants find this under Life here; guests find it on the door's guest card.</p>}
      {pending.length > 0 && (
        <>
          <p className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#B85838] mt-3">Waiting for you ({pending.length})</p>
          <ul>{pending.map((p) => <DeskRow key={p.id} p={p} busy={busy} onOpen={openLarge}
            onDecide={(id, d, why) => act(() => decideStayPicture(id, d, why), d === 'approved' ? 'On the wall.' : 'Declined.')}
            onRemove={(id, why) => act(() => removeStayPicture(id, why), 'Removed.')}
            onListing={(id, on) => act(() => putStayPictureInListing(id, on), on ? 'In the listing.' : 'Out of the listing.')} />)}</ul>
        </>
      )}
      {onWall.length > 0 && (
        <>
          <p className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50] mt-3">On the wall ({onWall.length})</p>
          <ul>{onWall.map((p) => <DeskRow key={p.id} p={p} busy={busy} onOpen={openLarge}
            onDecide={(id, d, why) => act(() => decideStayPicture(id, d, why), 'Declined.')}
            onRemove={(id, why) => act(() => removeStayPicture(id, why), 'Removed.')}
            onListing={(id, on) => act(() => putStayPictureInListing(id, on), on ? 'In the listing.' : 'Out of the listing.')} />)}</ul>
        </>
      )}
      {rest.length > 0 && (
        <details className="mt-3">
          <summary className="text-xs text-[#5A5751] cursor-pointer">Declined and taken down ({rest.length})</summary>
          <ul>{rest.map((p) => <DeskRow key={p.id} p={p} busy={busy} onOpen={openLarge} onDecide={() => {}} onRemove={(id, why) => act(() => removeStayPicture(id, why), 'Removed.')} onListing={() => {}} />)}</ul>
        </details>
      )}
      <div className="mt-3">
        <Btn onClick={() => setSharing((s) => !s)}>{sharing ? 'Close' : 'Share a picture yourself'}</Btn>
        {sharing && <div className="mt-2"><ShareStayPicture rentalId={rentalId} onDone={() => { setSharing(false); load(); }} /></div>}
      </div>
      {said && <p className="text-xs text-[#5A5751] mt-2" role="status" data-testid="stay-wall-said">{said}</p>}
      {open && <Lightbox src={open.src} alt={open.alt} onClose={() => setOpen(null)} />}
    </div>
  );
}

/**
 * The public wall, under the shelf. `shelfIds`: the door ids on the shelf; a
 * wall shows under the shelf only when its building has a card there. A
 * read that fails, or a database that has no walls yet, shows nothing — never
 * a broken frame (DR-0076: nothing painted that is not real).
 */
export function LifeWall({ shelfIds = [] }) {
  const [walls, setWalls] = useState([]);
  const [open, setOpen] = useState(null); // { wall, index, items }
  const key = (shelfIds || []).map(String).sort().join(',');
  useEffect(() => {
    let live = true;
    if (!key) { setWalls([]); return undefined; }
    boundedRead(Promise.resolve().then(() => loadPublicStayWalls()), READ_MS, { ok: false }).then((r) => {
      if (!live) return;
      setWalls(r.ok ? wallsForShelf(groupWalls(r.rows), key.split(',')) : []);
    }).catch(() => { if (live) setWalls([]); });
    return () => { live = false; };
  }, [key]);

  const openAt = async (wall, index) => {
    const items = await Promise.all(wall.pictures.map(async (p) => {
      const r = await boundedRead(loadPublicStayWallImage(p.id), READ_MS, { ok: false });
      return { src: r.ok && r.image ? r.image : p.thumb, alt: p.caption || wall.label, caption: [p.caption, p.poster ? `— ${p.poster}` : ''].filter(Boolean).join(' '), fileName: stampFileName(wall.label, index + 1) };
    }));
    setOpen({ wall, index, items });
  };
  if (!walls.length) return null;
  return (
    <div className="mt-4" data-testid="life-walls">
      {walls.map((w) => {
        const link = applyUrl(w.doorIds[0]);
        return (
          <section key={w.key} className="border border-[#E8E4DC] bg-white p-3 mb-3" data-testid="life-wall" data-wall={w.key}>
            <h3 className="text-[1rem] text-[#1A1815]" style={serif} data-testid="life-wall-title">{w.label}</h3>
            <p className="text-[0.75rem] text-[#5A5751]">Pictures the people who live and stay here chose to share.</p>
            <ul className="grid grid-cols-3 sm:grid-cols-4 gap-1 mt-2">
              {w.pictures.map((p, i) => (
                <li key={p.id}>
                  <button type="button" onClick={() => openAt(w, i)} aria-label={`Open ${p.caption || 'picture'} larger`} className="block w-full aspect-square overflow-hidden border border-[#E8E4DC] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]">
                    {p.thumb ? <img src={p.thumb} alt={p.caption || w.label} loading="lazy" className="w-full h-full object-cover" /> : <span className="block w-full h-full bg-[#FAF8F4]" />}
                  </button>
                  {(p.caption || p.poster) && (
                    <div className="text-[0.625rem] text-[#5A5751] truncate" title={p.caption}>{p.caption}{p.poster ? ` — ${p.poster}` : ''}</div>
                  )}
                </li>
              ))}
            </ul>
            {open && open.wall.key === w.key && (
              <Lightbox items={open.items} index={open.index} onClose={() => setOpen(null)}
                stamp={(item) => stampImage({ src: item.src, door: w.label, link })} />
            )}
          </section>
        );
      })}
    </div>
  );
}
