// =============================================================================
// PropertyPhotoActions — add a photo to an address, and take one off it
// =============================================================================
// Christina 2026-10-06, relayed by Darrell: "I would like to be able to delete
// and add photos to the different addresses in Real Estate." These are the two
// controls that answer her, mounted on the surface she is already standing on:
// Real Estate → a property card → PHOTOS (components/Rentals.jsx, PropertyGallery).
//
//   <PropertyPhotoActions/>  the Add photos control under the strip, with a real
//                            per-file line while it works and after it lands.
//   <PhotoRemoveButton/>     one per tile the family owns, which CONFIRMS by name
//                            before it does anything.
//
// They live here, in their own file, rather than inside the 2,900-line Rentals
// shell, so the feature-presence gate (DR-0726) can render them and prove both
// controls still exist, and so every branch is reachable in a test.
//
// All the thinking — what is a photo, where it goes, what removal means for each
// store, the confirm copy, and the plain sentence for every refusal — is in
// lib/property-photo-edit.js with no React in it. This file is the screen.
// The road is the existing sovereign one (lib/nas-photos.js → /nas-photos);
// there is no second road and no new credential.
// =============================================================================
import React, { useRef, useState } from 'react';
import { compressImageFile, fileToDataUrl } from '../lib/image.js';
import {
  uploadPlan, validatePhotoPick, sendPropertyPhoto, removePropertyPhoto,
  removeConfirmMessage, photoFailureMessage, removalDoneMessage, addDoneMessage,
} from '../lib/property-photo-edit.js';

const BTN = 'text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838]';

/**
 * The Add photos control for ONE address.
 *
 * @param dest        the property's NAS folder / chat channel name
 * @param addressLabel what the person calls this address, for the copy
 * @param onAdded     called after at least one photo landed, so the strip reloads
 * @param deps        injected in tests: { send, plan, toDataUrl, compress }
 */
export default function PropertyPhotoActions({ dest, addressLabel = 'this address', onAdded, deps = {} }) {
  const send = deps.send || sendPropertyPhoto;
  const plan = deps.plan || uploadPlan;
  const toDataUrl = deps.toDataUrl || fileToDataUrl;
  const compress = deps.compress || ((f) => compressImageFile(f, 1600, 0.75));
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(null);     // { done, total, name }
  const [lines, setLines] = useState([]);     // [{ id, ok, text }]

  const pick = async (event) => {
    const files = Array.from((event.target && event.target.files) || []);
    if (event.target) event.target.value = '';
    if (files.length === 0) return;
    setLines([]);
    let landed = 0;
    const out = [];
    for (let i = 0; i < files.length; i += 1) {
      const file = files[i];
      setBusy({ done: i, total: files.length, name: file.name });
      const check = validatePhotoPick(file);
      if (!check.ok) {
        out.push({ id: `${file.name}-${i}`, ok: false, text: check.error });
        setLines([...out]);
        continue;
      }
      // The ORIGINAL when the NAS keeps it and it fits; the reduced copy
      // otherwise — and the line below says which happened (never silently).
      const chosen = plan(file);
      let dataUrl;
      try {
        dataUrl = chosen.mode === 'original' ? await toDataUrl(file) : await compress(file);
      } catch {
        dataUrl = null;
      }
      if (!dataUrl && chosen.mode === 'original') {
        chosen.mode = 'reduced';
        chosen.reason = 'unknown-size';
        try { dataUrl = await compress(file); } catch { dataUrl = null; }
      }
      const res = await send({ dataUrl, dest, filename: file.name });
      if (res && res.ok) {
        landed += 1;
        out.push({ id: `${file.name}-${i}`, ok: true, text: addDoneMessage(chosen, { name: file.name }) });
      } else {
        out.push({ id: `${file.name}-${i}`, ok: false, text: photoFailureMessage(res, { action: 'add', name: file.name }) });
      }
      setLines([...out]);
    }
    setBusy(null);
    if (landed > 0 && typeof onAdded === 'function') onAdded(landed);
  };

  return (
    <div className="mt-2" data-testid="property-photo-add">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          data-testid="property-photo-add-button"
          onClick={() => inputRef.current && inputRef.current.click()}
          disabled={!!busy}
          className={`${BTN} bg-transparent text-[#5A5751] border-[#E8E4DC] hover:border-[#B85838] hover:text-[#1A1815] disabled:opacity-50`}
        >
          + Add photos to {addressLabel}
        </button>
        {busy && (
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" data-testid="property-photo-add-progress">
            sending {busy.done + 1} of {busy.total} · {busy.name}
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        data-testid="property-photo-add-input"
        type="file"
        accept="image/*"
        multiple
        onChange={pick}
        className="sr-only"
        aria-label={`Add photos to ${addressLabel}`}
      />
      {lines.length > 0 && (
        <ul className="mt-1.5 space-y-1" data-testid="property-photo-add-results">
          {lines.map((l) => (
            <li
              key={l.id}
              className={`text-[0.625rem] ${l.ok ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}
              style={{ fontFamily: '"Fraunces", serif' }}
            >
              {l.text}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[0.5625rem] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
        Photos you add land in this address’s own folder on the family NAS — the original picture when it fits, and they show in the strip above straight away.
      </p>
    </div>
  );
}

/**
 * Take ONE photo off an address. It confirms by name first, and the confirm copy
 * promises what Cancel does — a test presses Cancel and checks the photo stayed
 * (DR-0691), so the promise cannot drift away from the behavior.
 *
 * @param photo  { id, kind:'added'|'archive', name, date, caption }
 * @param deps   injected in tests: { confirm, remove }
 */
export function PhotoRemoveButton({ photo, dest, addressLabel = 'this address', onRemoved, deps = {} }) {
  const ask = deps.confirm || ((message) => (typeof window !== 'undefined' && window.confirm ? window.confirm(message) : false));
  const remove = deps.remove || removePropertyPhoto;
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState(null);     // { ok, text }
  const p = photo || {};
  const label = p.name || p.caption || p.id || 'this photo';

  const click = async () => {
    if (busy) return;
    if (!ask(removeConfirmMessage(p, { addressLabel }))) return;   // Cancel: nothing happens
    setBusy(true);
    setSaid(null);
    const res = await remove({ dest, id: p.id, kind: p.kind });
    setBusy(false);
    if (res && res.ok) {
      setSaid({ ok: true, text: removalDoneMessage(res, { name: label }) });
      if (typeof onRemoved === 'function') onRemoved(p, res);
      return;
    }
    setSaid({ ok: false, text: photoFailureMessage(res, { action: 'remove', name: label }) });
  };

  return (
    <div data-testid="property-photo-remove">
      <button
        type="button"
        data-testid="property-photo-remove-button"
        onClick={click}
        disabled={busy}
        aria-label={`Remove ${label} from ${addressLabel}`}
        className="mt-0.5 w-full text-[0.5rem] uppercase tracking-wider px-1 py-1 min-h-[36px] border border-[#E8E4DC] text-[#5A5751] hover:border-[#B85838] hover:text-[#B85838] disabled:opacity-50 focus:outline focus:outline-2 focus:outline-[#B85838]"
      >
        {busy ? 'removing…' : 'Remove'}
      </button>
      {said && (
        <p
          data-testid="property-photo-remove-said"
          className={`text-[0.5625rem] mt-0.5 ${said.ok ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}
          style={{ fontFamily: '"Fraunces", serif' }}
        >
          {said.text}
        </p>
      )}
    </div>
  );
}
