// =============================================================================
// ChurchObservation — the church's own observation board, room by room
// =============================================================================
// The surveillance/observation surface for The Church of the Living God's
// building: the main worship area (600-person capacity), the foyer, 7 rooms,
// and a bathroom at each corner (Darrell, 2026-06-16). STAFF-ONLY — gated to
// family/Governor + church-staff emails (e.g. Bishop Gwin); never shown to an
// anonymous visitor on poetech.us. This is the PWA view; a standalone
// always-on NAS observation page is the sibling (NAS-side wiring, follow-up).
//
// Storage (Darrell's call 2026-06-16): IN-APP NOW, NAS LATER. Photos are
// compressed client-side (lib/image.js) and held in the device-local app
// record as data URLs — the same path Life Gallery + rental room photos use.
// This device is the only copy until the sovereign NAS write-path lands; that
// migration is the Tier-C follow-up (photo-sovereignty: the church's own
// storage, never copied or extracted). No facial recognition / vision model is
// in scope here — the moment any recognition is added,
// VISION-FAIRNESS-STANDARD (skin-tone parity bar) governs that separate step.
//
// Each space holds MULTIPLE photos (coverage from several angles) — "images of
// each room all over the whole church." Legacy single-photo records (the first
// build's `photo` string) migrate transparently into the `photos` array.
import React, { useRef, useState } from 'react';
import { compressImageFile } from '../lib/image.js';
import {
  CAMERA_BRANDS, brandLabel, classifyStreamUrl, makeCamera, camerasOf,
  upsertCamera, removeCamera, streamStatus, pickLiveView,
} from '../lib/observation-cameras.js';

// Real building, from Darrell: the 600-person main worship area, a large foyer,
// 7 rooms, and a bathroom at each corner (NE/NW/SE/SW). Names + the set are
// editable in place — staff label each space as it really is, and add/remove to
// match the actual building (corner count is a starting point, not a claim).
export const OBSERVATION_SEED = {
  spaces: [
    { id: 'sp-main', name: 'Main Worship Area', capacity: 600, photos: [], note: '', updatedAt: '' },
    { id: 'sp-foyer', name: 'Foyer', photos: [], note: '', updatedAt: '' },
    { id: 'sp-1', name: 'Room 1', photos: [], note: '', updatedAt: '' },
    { id: 'sp-2', name: 'Room 2', photos: [], note: '', updatedAt: '' },
    { id: 'sp-3', name: 'Room 3', photos: [], note: '', updatedAt: '' },
    { id: 'sp-4', name: 'Room 4', photos: [], note: '', updatedAt: '' },
    { id: 'sp-5', name: 'Room 5', photos: [], note: '', updatedAt: '' },
    { id: 'sp-6', name: 'Room 6', photos: [], note: '', updatedAt: '' },
    { id: 'sp-7', name: 'Room 7', photos: [], note: '', updatedAt: '' },
    { id: 'sp-bath-ne', name: 'Bathroom — NE corner', photos: [], note: '', updatedAt: '' },
    { id: 'sp-bath-nw', name: 'Bathroom — NW corner', photos: [], note: '', updatedAt: '' },
    { id: 'sp-bath-se', name: 'Bathroom — SE corner', photos: [], note: '', updatedAt: '' },
    { id: 'sp-bath-sw', name: 'Bathroom — SW corner', photos: [], note: '', updatedAt: '' },
  ],
};

// Normalize a space's photos: prefer the photos[] array; fall back to the
// first build's single `photo` string so older records still display.
function photosOf(s) {
  if (Array.isArray(s.photos)) return s.photos;
  if (s.photo) return [{ id: `legacy-${s.id}`, src: s.photo, at: s.updatedAt || '' }];
  return [];
}

const card = 'bg-white border border-[#1A1815] p-4 sm:p-5';
const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';
const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
const btnDark = 'bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px]';
const btnGhost = 'text-[0.625rem] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]';

const chipCls = 'inline-block text-[0.5625rem] uppercase tracking-wider px-1.5 py-0.5 border';
const chipTone = {
  ok: `${chipCls} border-[#5A6E3D] text-[#5A6E3D] bg-[#5A6E3D]/5`,
  wait: `${chipCls} border-[#8A6E1F] text-[#8A6E1F] bg-[#8A6E1F]/5`,
  blocked: `${chipCls} border-[#B85838] text-[#B85838] bg-[#B85838]/5`,
  muted: `${chipCls} border-[#B8B4AC] text-[#5A5751] bg-white`,
};
// Map a streamStatus kind to a chip tone — honest colors: green only when this
// browser can actually render it, amber for registered-awaiting, rust for
// blocked, grey for the rest.
function chipToneFor(kind) {
  if (kind === 'mjpeg-or-snapshot' || kind === 'snapshot-only') return chipTone.ok;
  if (kind === 'rtsp' || kind === 'hls') return chipTone.wait;
  if (kind === 'mixed-blocked') return chipTone.blocked;
  return chipTone.muted;
}

const pageProtocol = () => (typeof window !== 'undefined' && window.location ? window.location.protocol : 'https:');

// Add/edit form for one camera. Pure local state; `onSave` receives the
// finished record built through makeCamera (timestamps generated here).
function CameraForm({ spaceId, cam, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: cam?.name || '', brand: cam?.brand || 'wyze', streamUrl: cam?.streamUrl || '',
    snapshotUrl: cam?.snapshotUrl || '', location: cam?.location || '', notes: cam?.notes || '',
  });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const hint = (CAMERA_BRANDS.find((b) => b.id === form.brand) || CAMERA_BRANDS[3]).hint;
  const canSave = form.name.trim().length > 0;
  const submit = () => {
    if (!canSave) return;
    onSave(makeCamera({
      ...form,
      id: cam?.id || `cam-${Date.now()}`,
      addedAt: cam?.addedAt || new Date().toISOString(),
    }));
  };
  const idp = `cam-${spaceId}-${cam?.id || 'new'}`;
  return (
    <div className="border border-[#E8E4DC] bg-white p-2 space-y-2">
      <div>
        <label className={labelCls} htmlFor={`${idp}-brand`}>Brand</label>
        <select id={`${idp}-brand`} className={fieldCls} value={form.brand} onChange={set('brand')}>
          {CAMERA_BRANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
        <p className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>{hint}</p>
      </div>
      <div>
        <label className={labelCls} htmlFor={`${idp}-name`}>Camera name</label>
        <input id={`${idp}-name`} className={fieldCls} placeholder="e.g. Foyer door cam" value={form.name} onChange={set('name')} />
      </div>
      <div>
        <label className={labelCls} htmlFor={`${idp}-stream`}>Stream URL · rtsp:// or http(s)://</label>
        <input id={`${idp}-stream`} className={fieldCls} placeholder="rtsp://user:pass@192.168.1.50/live" value={form.streamUrl} onChange={set('streamUrl')} />
      </div>
      <div>
        <label className={labelCls} htmlFor={`${idp}-snap`}>Snapshot URL · optional, a .jpg the camera serves</label>
        <input id={`${idp}-snap`} className={fieldCls} placeholder="optional" value={form.snapshotUrl} onChange={set('snapshotUrl')} />
      </div>
      <div>
        <label className={labelCls} htmlFor={`${idp}-loc`}>Location in this space</label>
        <input id={`${idp}-loc`} className={fieldCls} placeholder="optional · e.g. NE ceiling corner" value={form.location} onChange={set('location')} />
      </div>
      <div>
        <label className={labelCls} htmlFor={`${idp}-notes`}>Notes</label>
        <input id={`${idp}-notes`} className={fieldCls} placeholder="optional" value={form.notes} onChange={set('notes')} />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={submit} disabled={!canSave} className={`${btnDark} disabled:opacity-40`}>{cam ? 'Save camera' : 'Add camera'}</button>
        <button type="button" onClick={onCancel} className={btnGhost}>Cancel</button>
      </div>
    </div>
  );
}

// The live-view attempt for one camera — only ever claims what this browser
// verifiably renders; everything else is an honest named state (DR-0076).
function CameraLiveView({ cam }) {
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const proto = pageProtocol();
  const view = pickLiveView(cam, proto);
  const direct = cam.streamUrl || cam.snapshotUrl || '';
  const rtspRegistered = classifyStreamUrl(cam.streamUrl) === 'rtsp';
  const copyRtsp = async () => {
    try {
      await navigator.clipboard.writeText(cam.streamUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) { /* clipboard unavailable — the URL is still visible below */ }
  };
  const unreachable = (
    <p className="text-[0.625rem] text-[#5A5751] p-2" style={{ fontFamily: '"Fraunces", serif' }}>
      Stream not reachable from this device/browser — try the direct link below.
    </p>
  );
  return (
    <div className="border border-[#E8E4DC] bg-white">
      {view.mode === 'img' && !failed && (
        <img src={view.url} alt={`${cam.name} — live view`} className="w-full max-h-48 object-contain bg-[#1A1815]" onError={() => setFailed(true)} />
      )}
      {view.mode === 'video' && !failed && (
        // HLS plays natively only in Safari's <video>; elsewhere onError lands
        // us in the honest unreachable state (no hls.js — no new dependencies).
        <video src={view.url} className="w-full max-h-48 bg-[#1A1815]" controls muted playsInline onError={() => setFailed(true)} />
      )}
      {(view.mode === 'img' || view.mode === 'video') && failed && unreachable}
      {view.mode === 'blocked' && (
        <p className="text-[0.625rem] text-[#B85838] p-2" style={{ fontFamily: '"Fraunces", serif' }}>
          This page is https and the camera URL is http — the browser blocks it here. Use the direct link (or open the app over the LAN).
        </p>
      )}
      {view.mode === 'bridge' && (
        <p className="text-[0.625rem] text-[#5A5751] p-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Registered — RTSP cannot play in a browser; live view arrives with the NAS restream bridge.
        </p>
      )}
      {view.mode === 'page' && (
        <p className="text-[0.625rem] text-[#5A5751] p-2" style={{ fontFamily: '"Fraunces", serif' }}>
          This URL is the camera&rsquo;s own web page — use the direct link below.
        </p>
      )}
      {view.mode === 'none' && (
        <p className="text-[0.625rem] text-[#5A5751] p-2" style={{ fontFamily: '"Fraunces", serif' }}>
          No viewable URL yet — add a stream or snapshot URL.
        </p>
      )}
      {rtspRegistered && view.mode !== 'bridge' && (
        <p className="text-[0.5625rem] text-[#8A6E1F] px-2 pb-1" style={{ fontFamily: '"Fraunces", serif' }}>
          RTSP stream registered — in-app live arrives with the NAS restream bridge; showing the snapshot URL meanwhile.
        </p>
      )}
      <div className="flex items-center gap-3 px-2 pb-2 flex-wrap">
        {direct && (
          <a href={direct} target="_blank" rel="noopener noreferrer" className={btnGhost}>Open direct ↗</a>
        )}
        {rtspRegistered && (
          <button type="button" onClick={copyRtsp} className={btnGhost}>{copied ? 'Copied' : 'Copy RTSP URL'}</button>
        )}
      </div>
    </div>
  );
}

function CameraRow({ spaceId, cam, onUpsert, onRemoveCam }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const status = streamStatus(cam, pageProtocol());
  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4] p-2 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold truncate">{cam.name || 'Unnamed camera'}</p>
          <p className="text-[0.625rem] text-[#5A5751] truncate" style={{ fontFamily: '"Fraunces", serif' }}>
            {brandLabel(cam.brand)}{cam.location ? ` · ${cam.location}` : ''}{cam.notes ? ` · ${cam.notes}` : ''}
          </p>
        </div>
        <span className={chipToneFor(status.kind)}>{status.label}</span>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <button type="button" onClick={() => { setOpen(v => !v); setEditing(false); }} className={btnGhost}>{open ? 'Hide view' : 'View'}</button>
        <button type="button" onClick={() => { setEditing(v => !v); setOpen(false); }} className={btnGhost}>{editing ? 'Close edit' : 'Edit'}</button>
        <button type="button" onClick={() => onRemoveCam(spaceId, cam.id)} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838]">Remove</button>
      </div>
      {open && <CameraLiveView key={`${cam.streamUrl}|${cam.snapshotUrl}`} cam={cam} />}
      {editing && (
        <CameraForm spaceId={spaceId} cam={cam} onCancel={() => setEditing(false)} onSave={(next) => { onUpsert(spaceId, next); setEditing(false); }} />
      )}
    </div>
  );
}

function SpaceTile({ space, photos, onAddPhotos, onRemovePhoto, onRename, onNote, onRemove, onUpsertCamera, onRemoveCamera }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [addingCam, setAddingCam] = useState(false);
  const cameras = camerasOf(space);
  const cover = photos[0];

  const handleFile = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setErr('');
    setBusy(true);
    try {
      const urls = [];
      for (const file of files) urls.push(await compressImageFile(file));
      // One write for all selected files — avoids a stale-closure race where
      // per-file writes would each overwrite the last.
      if (urls.length) onAddPhotos(space.id, urls);
    } catch (_) {
      setErr('Could not read that image — try another.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="border border-[#E8E4DC] bg-[#FAF8F4]">
      <div className="relative aspect-[4/3] bg-[#1A1815] flex items-center justify-center overflow-hidden">
        {cover ? (
          <img src={cover.src} alt={`${space.name} — photo`} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-3">
            <div className="text-2xl" aria-hidden="true">📷</div>
            <p className="text-[0.6875rem] text-[#B8B4AC] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>No photos yet</p>
          </div>
        )}
        {space.capacity ? (
          <span className="absolute top-1.5 left-1.5 text-[0.5625rem] uppercase tracking-wider bg-[#1A1815]/80 text-white px-1.5 py-0.5">Capacity {space.capacity}</span>
        ) : null}
        {photos.length > 0 && (
          <span className="absolute top-1.5 right-1.5 text-[0.5625rem] uppercase tracking-wider bg-[#1A1815]/80 text-white px-1.5 py-0.5">{photos.length} photo{photos.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {photos.length > 0 && (
        <div className="flex gap-1 p-2 overflow-x-auto bg-white border-b border-[#E8E4DC]">
          {photos.map(p => (
            <div key={p.id} className="relative shrink-0">
              <img src={p.src} alt="" className="w-12 h-12 object-cover border border-[#E8E4DC]" />
              <button type="button" onClick={() => onRemovePhoto(space.id, p.id)} aria-label="Remove photo" className="absolute -top-1 -right-1 bg-[#1A1815] text-white w-4 h-4 leading-none text-[0.625rem] flex items-center justify-center hover:bg-[#B85838]">×</button>
            </div>
          ))}
        </div>
      )}

      <div className="p-2.5 space-y-2">
        <div>
          <label className={labelCls} htmlFor={`name-${space.id}`}>Space name</label>
          <input id={`name-${space.id}`} className={fieldCls} value={space.name} onChange={e => onRename(space.id, e.target.value)} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`note-${space.id}`}>Note · camera location, access, what to watch</label>
          <input id={`note-${space.id}`} className={fieldCls} placeholder="optional" value={space.note || ''} onChange={e => onNote(space.id, e.target.value)} />
        </div>

        <input ref={inputRef} type="file" accept="image/*" capture="environment" multiple onChange={handleFile} className="hidden" id={`file-${space.id}`} />
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor={`file-${space.id}`} className={`${btnDark} cursor-pointer inline-flex items-center`} aria-disabled={busy}>
            {busy ? 'Working…' : (photos.length ? '+ Add photos' : '📷 Add photos')}
          </label>
          {!space.capacity && <button type="button" onClick={() => onRemove(space.id)} className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] ml-auto">Delete space</button>}
        </div>
        {err && <p className="text-[0.625rem] text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{err}</p>}

        <div className="pt-2 border-t border-[#E8E4DC] space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className={labelCls}>Cameras{cameras.length ? ` · ${cameras.length}` : ''}</span>
            <button type="button" onClick={() => setAddingCam(v => !v)} className={btnGhost}>{addingCam ? 'Cancel' : '+ Add camera'}</button>
          </div>
          {addingCam && (
            <CameraForm
              spaceId={space.id}
              onCancel={() => setAddingCam(false)}
              onSave={(cam) => { onUpsertCamera(space.id, cam); setAddingCam(false); }}
            />
          )}
          {cameras.map(c => (
            <CameraRow key={c.id} spaceId={space.id} cam={c} onUpsert={onUpsertCamera} onRemoveCam={onRemoveCamera} />
          ))}
          {!cameras.length && !addingCam && (
            <p className="text-[0.625rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
              No cameras registered — Wyze and other IP cameras can be added here.
            </p>
          )}
        </div>

        {space.updatedAt && (
          <p className="text-[0.5625rem] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>Updated {space.updatedAt.slice(0, 16).replace('T', ' ')}</p>
        )}
      </div>
    </div>
  );
}

export function ChurchObservation({ observation, updateChurchObservation }) {
  const spaces = (observation && Array.isArray(observation.spaces) && observation.spaces.length)
    ? observation.spaces
    : OBSERVATION_SEED.spaces;

  const writeSpaces = (next) => updateChurchObservation({ spaces: next });
  const now = () => new Date().toISOString();
  // Strip the legacy single `photo` field whenever we write a photos[] array.
  const onAddPhotos = (id, dataUrls) => writeSpaces(spaces.map(s => {
    if (s.id !== id) return s;
    const next = [...photosOf(s), ...dataUrls.map((src, i) => ({ id: `ph-${Date.now()}-${i}`, src, at: now() }))];
    const { photo, ...rest } = s;
    return { ...rest, photos: next, updatedAt: now() };
  }));
  const onRemovePhoto = (spaceId, photoId) => {
    if (!window.confirm('Remove this photo?')) return;
    writeSpaces(spaces.map(s => {
      if (s.id !== spaceId) return s;
      const { photo, ...rest } = s;
      return { ...rest, photos: photosOf(s).filter(p => p.id !== photoId), updatedAt: now() };
    }));
  };
  const onRename = (id, name) => writeSpaces(spaces.map(s => s.id === id ? { ...s, name } : s));
  const onNote = (id, note) => writeSpaces(spaces.map(s => s.id === id ? { ...s, note } : s));
  const onRemove = (id) => {
    if (!window.confirm('Delete this space from the board?')) return;
    writeSpaces(spaces.filter(s => s.id !== id));
  };
  const addSpace = () => writeSpaces([...spaces, { id: `sp-${Date.now()}`, name: `Room ${spaces.filter(s => !s.capacity).length + 1}`, photos: [], note: '', updatedAt: '' }]);

  // Camera registry writes — metadata only (name/brand/URLs/notes), so unlike
  // the photo bytes these ride the family snapshot with the rest of the board.
  const onUpsertCamera = (spaceId, cam) => writeSpaces(spaces.map(s =>
    s.id === spaceId ? { ...s, cameras: upsertCamera(camerasOf(s), cam), updatedAt: now() } : s));
  const onRemoveCamera = (spaceId, camId) => {
    if (!window.confirm('Remove this camera from the space?')) return;
    writeSpaces(spaces.map(s =>
      s.id === spaceId ? { ...s, cameras: removeCamera(camerasOf(s), camId), updatedAt: now() } : s));
  };

  const withPhotos = spaces.filter(s => photosOf(s).length).length;
  const totalPhotos = spaces.reduce((n, s) => n + photosOf(s).length, 0);
  const totalCameras = spaces.reduce((n, s) => n + camerasOf(s).length, 0);

  return (
    <section className={card} aria-labelledby="observation-h">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">👁 Observation · 🔒 Staff only</div>
          <h2 id="observation-h" className="text-xl sm:text-2xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Church Spaces</h2>
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            The Church of the Living God · 312 E. Bradley Avenue, Champaign, IL · {spaces.length} spaces · {withPhotos} covered · {totalPhotos} photo{totalPhotos === 1 ? '' : 's'} · {totalCameras} camera{totalCameras === 1 ? '' : 's'}
          </p>
        </div>
        <button type="button" onClick={addSpace} className={btnGhost}>+ Add space</button>
      </div>

      <div className="bg-[#FAF8F4] border-l-2 border-[#8A6E1F] px-3 py-2 mt-3">
        <p className="text-[0.6875rem] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          Photos are saved on <strong>this device</strong> for now and only visible to church staff signed in here — they are not uploaded anywhere or shared. Sovereign NAS storage (the church’s own, never copied) is the next step. No face recognition is used.
        </p>
        <p className="text-[0.625rem] text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
          Camera stream URLs may embed credentials — they stay in the family’s own account snapshot, never public.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {spaces.map(s => (
          <SpaceTile key={s.id} space={s} photos={photosOf(s)} onAddPhotos={onAddPhotos} onRemovePhoto={onRemovePhoto} onRename={onRename} onNote={onNote} onRemove={onRemove} onUpsertCamera={onUpsertCamera} onRemoveCamera={onRemoveCamera} />
        ))}
      </div>
    </section>
  );
}

export default ChurchObservation;
