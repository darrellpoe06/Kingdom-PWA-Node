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
const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';
const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
const btnDark = 'bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px]';
const btnGhost = 'text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]';

function SpaceTile({ space, photos, onAddPhotos, onRemovePhoto, onRename, onNote, onRemove }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
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
            <p className="text-[11px] text-[#B8B4AC] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>No photos yet</p>
          </div>
        )}
        {space.capacity ? (
          <span className="absolute top-1.5 left-1.5 text-[9px] uppercase tracking-wider bg-[#1A1815]/80 text-white px-1.5 py-0.5">Capacity {space.capacity}</span>
        ) : null}
        {photos.length > 0 && (
          <span className="absolute top-1.5 right-1.5 text-[9px] uppercase tracking-wider bg-[#1A1815]/80 text-white px-1.5 py-0.5">{photos.length} photo{photos.length > 1 ? 's' : ''}</span>
        )}
      </div>

      {photos.length > 0 && (
        <div className="flex gap-1 p-2 overflow-x-auto bg-white border-b border-[#E8E4DC]">
          {photos.map(p => (
            <div key={p.id} className="relative shrink-0">
              <img src={p.src} alt="" className="w-12 h-12 object-cover border border-[#E8E4DC]" />
              <button type="button" onClick={() => onRemovePhoto(space.id, p.id)} aria-label="Remove photo" className="absolute -top-1 -right-1 bg-[#1A1815] text-white w-4 h-4 leading-none text-[10px] flex items-center justify-center hover:bg-[#B85838]">×</button>
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
          {!space.capacity && <button type="button" onClick={() => onRemove(space.id)} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] ml-auto">Delete space</button>}
        </div>
        {err && <p className="text-[10px] text-[#B85838]" style={{ fontFamily: '"Fraunces", serif' }}>{err}</p>}
        {space.updatedAt && (
          <p className="text-[9px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>Updated {space.updatedAt.slice(0, 16).replace('T', ' ')}</p>
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

  const withPhotos = spaces.filter(s => photosOf(s).length).length;
  const totalPhotos = spaces.reduce((n, s) => n + photosOf(s).length, 0);

  return (
    <section className={card} aria-labelledby="observation-h">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">👁 Observation · 🔒 Staff only</div>
          <h2 id="observation-h" className="text-xl sm:text-2xl mt-1" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Church Spaces</h2>
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            The Church of the Living God · 312 E. Bradley Avenue, Champaign, IL · {spaces.length} spaces · {withPhotos} covered · {totalPhotos} photo{totalPhotos === 1 ? '' : 's'}
          </p>
        </div>
        <button type="button" onClick={addSpace} className={btnGhost}>+ Add space</button>
      </div>

      <div className="bg-[#FAF8F4] border-l-2 border-[#8A6E1F] px-3 py-2 mt-3">
        <p className="text-[11px] text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>
          Photos are saved on <strong>this device</strong> for now and only visible to church staff signed in here — they are not uploaded anywhere or shared. Sovereign NAS storage (the church’s own, never copied) is the next step. No face recognition is used.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
        {spaces.map(s => (
          <SpaceTile key={s.id} space={s} photos={photosOf(s)} onAddPhotos={onAddPhotos} onRemovePhoto={onRemovePhoto} onRename={onRename} onNote={onNote} onRemove={onRemove} />
        ))}
      </div>
    </section>
  );
}

export default ChurchObservation;
