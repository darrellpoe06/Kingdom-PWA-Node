// =============================================================================
// WorkOrderPictures — pictures on a work order and on its notes, and the name
// a picture is given (DR-1235)
// =============================================================================
// Darrell, 2026-10-27, from his phone on Big Picture → Work order triage:
// "Need to be able to upload pictures to the workorders and notes for images"
// and "when adding a new name for an image it should be automatically one of
// the options moving forward".
//
// Three pieces, each reachable in a test with no network:
//   <PictureNamePicker/>   the names on offer as chips (the defaults, then
//                          every name this instance has typed, A→Z) and an
//                          "Another name…" box; a new name is remembered on
//                          save, so it is a chip from then on, everywhere.
//   <PictureStrip/>        thumbnails (fetched by id when on screen, never in
//                          the list — DR-0303) on a note or on the work order;
//                          tap opens the full picture.
//   <AddPictures/>         the 44px control: the camera first (capture=
//                          environment), the phone's pictures second; a name;
//                          optional words that become the note the pictures
//                          ride. Nothing is claimed saved until the store took
//                          it (DR-0076): the line says how many landed.
//
// The record is property_photos (0153 + 0310), the same wall the door's
// move-out set hangs on; the thinking is in lib/work-order-pictures.js.
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import SharpPicture from '../modules/properties/SharpPicture.jsx';
import { compressImageFile, isLikelyImageFile } from '../lib/image.js';
import {
  PICTURE_NAME_DEFAULTS, NEW_NAME_LABEL, mergePictureNames, isNewPictureName,
  buildWorkOrderPhotoRow, pictureLine, savedLine, newNoteId,
} from '../lib/work-order-pictures.js';

const FOCUS_RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';
const MUTED = 'text-[#5A5751]';
/** Full picture and its thumbnail, the gallery's own sizes (DoorTabs). */
export const FULL_MAX_WIDTH = 1600;
export const FULL_QUALITY = 0.8;
export const THUMB_MAX_WIDTH = 320;
export const THUMB_QUALITY = 0.6;

/** The names on offer, with "Another name…" to type one. */
export function PictureNamePicker({ options = [], value = '', onChange, idBase = 'picture-name' }) {
  const [typing, setTyping] = useState(false);
  const offered = mergePictureNames(PICTURE_NAME_DEFAULTS, options);
  const isTyped = typing || (value && isNewPictureName(value, offered));
  const chip = (on) => `text-[0.6875rem] border px-2 min-h-[44px] rounded-full ${on ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#1A1815] border-[#B8B2A7]'} ${FOCUS_RING}`;
  return (
    <div className="space-y-1" data-testid="picture-name-picker">
      <span className="text-[0.625rem] uppercase tracking-wider block">What the pictures show</span>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="The name for these pictures">
        {offered.map((name) => (
          <button key={name} type="button" aria-pressed={!isTyped && value === name} onClick={() => { setTyping(false); onChange(name); }} className={chip(!isTyped && value === name)} data-testid="picture-name-option">{name}</button>
        ))}
        <button type="button" aria-pressed={!!isTyped} onClick={() => { setTyping(true); if (!isNewPictureName(value, offered)) onChange(''); }} className={chip(!!isTyped)} data-testid="picture-name-new">{NEW_NAME_LABEL}</button>
      </div>
      {isTyped && (
        <div>
          <label className="sr-only" htmlFor={`${idBase}-typed`}>Another name for these pictures</label>
          <input id={`${idBase}-typed`} value={value} onChange={(e) => onChange(e.target.value)} placeholder="e.g. Fan wiring" maxLength={80}
            className={`w-full text-xs border border-[#E8E4DC] px-2 min-h-[44px] ${FOCUS_RING}`} data-testid="picture-name-typed" />
          <span className={`block text-[0.625rem] ${MUTED}`}>A name typed once is one of the options from then on.</span>
        </div>
      )}
    </div>
  );
}

/** The full picture, opened on tap; Escape or the button closes it. */
function Opened({ photo, loadImage, onClose }) {
  const [src, setSrc] = useState(photo.storage_path || photo.thumb_path || '');
  const btn = useRef(null);
  useEffect(() => {
    let live = true;
    if (!photo.storage_path && typeof loadImage === 'function') {
      Promise.resolve(loadImage(photo.id)).then((full) => { if (live && full) setSrc(full); }).catch(() => {});
    }
    const key = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', key);
    if (btn.current) btn.current.focus();
    return () => { live = false; window.removeEventListener('keydown', key); };
  }, [photo.id, photo.storage_path, loadImage, onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-label={photo.caption || 'Picture'} className="fixed inset-0 z-50 bg-[#1A1815]/90 flex flex-col" data-testid="work-order-picture-open" onClick={onClose}>
      <div className="flex items-center justify-between p-2 text-white">
        <span className="text-xs">{photo.caption || 'Picture'}{photo.author_label ? ` · ${photo.author_label}` : ''}</span>
        <button ref={btn} type="button" onClick={onClose} className={`text-xs border border-white px-3 min-h-[44px] min-w-[44px] ${FOCUS_RING}`} data-testid="work-order-picture-close">Close</button>
      </div>
      {src ? <img src={src} alt={photo.caption || 'Picture'} className="flex-1 min-h-0 w-full object-contain" /> : <p className="text-white text-xs p-2">Fetching the picture…</p>}
    </div>
  );
}

/** Thumbnails for a set of pictures; tap to open. */
export function PictureStrip({ photos = [], loadThumb = null, loadImage = null, label = 'Pictures' }) {
  const [open, setOpen] = useState(null);
  if (!photos.length) return null;
  return (
    <div className="mt-1" data-testid="work-order-pictures">
      <ul className="flex flex-wrap gap-1.5" aria-label={`${label}: ${pictureLine(photos.length)}`}>
        {photos.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => setOpen(p)} aria-label={`Open ${p.caption || 'picture'}`} className={`block w-14 h-14 border border-[#E8E4DC] bg-[#F2EFE9] overflow-hidden ${FOCUS_RING}`} data-testid="work-order-picture">
              <SharpPicture photo={p} loadThumb={loadThumb} loadImage={loadImage} alt={p.caption || 'Picture'} className="w-full h-full object-cover" />
            </button>
            {p.caption && <span className={`block w-14 truncate text-[0.5625rem] ${MUTED}`}>{p.caption}</span>}
          </li>
        ))}
      </ul>
      {open && <Opened photo={open} loadImage={loadImage} onClose={() => setOpen(null)} />}
    </div>
  );
}

/**
 * The control. `save` is the one write the parent does with the rows this
 * builds: ({ rows, note }) → { ok, saved, lost, reason }. `compress` is
 * injected in tests (no canvas there).
 */
export function AddPictures({ w, instanceId = null, names = [], save, remember = null, busy = false, compress = null, authorLabel = '' }) {
  const [files, setFiles] = useState([]);     // [{ key, name, dataUrl, thumbUrl }]
  const [name, setName] = useState(PICTURE_NAME_DEFAULTS[0]);
  const [words, setWords] = useState('');
  const [working, setWorking] = useState(null);
  const [line, setLine] = useState(null);
  const shrink = compress || ((file, max, q) => compressImageFile(file, max, q));
  const lbl = `text-[0.6875rem] border border-[#B85838] text-[#B85838] px-2 min-h-[44px] inline-flex items-center cursor-pointer ${FOCUS_RING}`;

  const pick = async (list) => {
    const picked = Array.from(list || []);
    if (!picked.length) return;
    setLine(null);
    const out = [];
    for (let i = 0; i < picked.length; i += 1) {
      const f = picked[i];
      setWorking({ done: i, total: picked.length, name: f.name });
      if (!isLikelyImageFile(f)) { out.push({ key: `${Date.now()}-${i}`, name: f.name, error: 'not a picture' }); continue; }
      try {
        const dataUrl = await shrink(f, FULL_MAX_WIDTH, FULL_QUALITY);
        const thumbUrl = await shrink(f, THUMB_MAX_WIDTH, THUMB_QUALITY);
        out.push({ key: `${Date.now()}-${i}`, name: f.name, dataUrl, thumbUrl });
      } catch (e) {
        out.push({ key: `${Date.now()}-${i}`, name: f.name, error: (e && e.message) || 'could not be read' });
      }
    }
    setWorking(null);
    setFiles((q) => q.concat(out));
  };

  const ready = files.filter((f) => f.dataUrl);
  const submit = async (e) => {
    e.preventDefault();
    if (!ready.length || busy || working) return;
    const caption = String(name || '').trim();
    const said = words.trim();
    const noteId = said ? newNoteId() : null;
    const rows = ready.map((f) => buildWorkOrderPhotoRow({ record: w.record, instanceId, noteId, name: caption, dataUrl: f.dataUrl, thumbUrl: f.thumbUrl, authorLabel })).filter(Boolean);
    if (!rows.length) { setLine({ ok: false, text: 'Not saved: this work order cannot hold a picture yet.' }); return; }
    setWorking({ done: 0, total: rows.length, name: 'saving' });
    let res;
    try { res = await save({ rows, note: said ? { id: noteId, body: said } : null }); } catch (err) { res = { ok: false, saved: 0, lost: rows.length, reason: (err && err.message) || 'unexpected' }; }
    setWorking(null);
    const saved = (res && res.saved) || 0;
    const lost = res && typeof res.lost === 'number' ? res.lost : rows.length - saved;
    // The name is remembered only once a picture carrying it is on the record
    // — a name on a lost picture is not a name anyone gave a picture.
    const inst = rows[0].instance_id;
    if (saved > 0 && caption && typeof remember === 'function' && isNewPictureName(caption, mergePictureNames(PICTURE_NAME_DEFAULTS, names))) {
      try { await remember(inst, caption); } catch { /* the picture is saved; the name will be offered next read */ }
    }
    const text = res && res.ok === false && !saved ? `Not saved: ${res.reason || 'the store refused it'}.` : savedLine({ saved, lost, noted: !!said });
    setLine({ ok: saved > 0 && !lost, text });
    if (saved > 0) { setFiles(lost ? files.filter((f) => !f.dataUrl) : []); if (!lost) setWords(''); }
  };

  return (
    <form onSubmit={submit} className="border border-[#E8E4DC] rounded-md p-2 space-y-2" data-testid="work-order-add-pictures">
      <p className="text-[0.625rem] uppercase tracking-wider font-semibold">Add pictures</p>
      <div className="flex flex-wrap gap-1.5">
        <label className={lbl}>
          Take a picture
          {/* The camera returns one shot (the upload-inputs gate); the chooser
              beside it takes several, so no source is hidden (DR-0339). */}
          <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Take a picture with the camera" data-testid="work-order-picture-camera"
            onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
        </label>
        <label className={lbl}>
          Choose from this phone
          <input type="file" accept="image/*" multiple className="sr-only" aria-label="Choose pictures already on this device" data-testid="work-order-picture-choose"
            onChange={(e) => { pick(e.target.files); e.target.value = ''; }} />
        </label>
      </div>
      {working && <p role="status" className={`text-[0.625rem] ${MUTED}`}>{working.name === 'saving' ? `Saving ${working.total}…` : `Reading ${working.done + 1} of ${working.total}: ${working.name}`}</p>}
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" data-testid="work-order-picture-queue">
          {files.map((f) => (
            <li key={f.key} className="relative">
              {f.dataUrl
                ? <img src={f.thumbUrl || f.dataUrl} alt={f.name} className="w-14 h-14 object-cover border border-[#E8E4DC]" />
                : <span className="block w-14 h-14 border border-[#B45309] text-[0.5rem] text-[#B45309] p-1 overflow-hidden" title={f.error}>{f.name}: {f.error}</span>}
              <button type="button" onClick={() => setFiles((q) => q.filter((x) => x.key !== f.key))} aria-label={`Remove ${f.name}`} className={`absolute -top-1 -right-1 bg-white border border-[#B8B2A7] rounded-full w-6 h-6 text-[0.625rem] leading-none ${FOCUS_RING}`}>×</button>
            </li>
          ))}
        </ul>
      )}
      {files.length > 0 && (
        <>
          <PictureNamePicker options={names} value={name} onChange={setName} idBase={`wo-pic-${w.key}`} />
          <div>
            <label className="text-[0.625rem] uppercase tracking-wider block" htmlFor={`wo-pic-words-${w.key}`}>A note to go with them (optional)</label>
            <input id={`wo-pic-words-${w.key}`} value={words} onChange={(e) => setWords(e.target.value)} placeholder="e.g. Fan installed, microwave mounted; tested both" className={`w-full text-xs border border-[#E8E4DC] px-2 min-h-[44px] ${FOCUS_RING}`} data-testid="work-order-picture-words" />
          </div>
          <button type="submit" disabled={busy || !!working || !ready.length || !String(name || '').trim()} className={`text-[0.6875rem] bg-[#1A1815] text-white px-3 min-h-[44px] disabled:opacity-50 ${FOCUS_RING}`} data-testid="work-order-picture-save">
            Save {pictureLine(ready.length)}{words.trim() ? ' with the note' : ''}
          </button>
        </>
      )}
      {line && <p role="status" className={`text-[0.625rem] ${line.ok ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`} data-testid="work-order-picture-result">{line.text}</p>}
    </form>
  );
}
