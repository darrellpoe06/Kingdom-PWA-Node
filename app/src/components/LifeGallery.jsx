// =============================================================================
// LifeGallery — the biggest pictures of your life, on the Big Picture page
// =============================================================================
// A curated set of hero photos — family, business, projects, faith — so the
// person sees themselves and their loved ones every time they open the app,
// while they build and work. This is the SMALL, curated set (a handful of
// the photos that matter most), stored as compressed data URLs on the
// device-local record. HONEST DURABILITY: today these persist on THIS device
// (localStorage); the durable sovereign home is the family's own NAS —
// auto-backup is the next photo project (see 2026-06-11-room-memory-and-
// image-ingest.md). They are never sent to any PoeTech ad/training/sale
// pipeline — there is none. The large per-property archives (hundreds of
// images) reference the NAS in place rather than copy it.
import React, { useState, useEffect } from 'react';
import { compressImageFile } from '../lib/image.js';
import { fetchChannelPhotos, fetchFamilyPhotos, fetchAlbumPhotos, uploadPhoto, hasBridgeToken, chatChannelFor, bigPictureAlbum, setBigPictureAlbum } from '../lib/nas-photos.js';
import Lightbox from './Lightbox.jsx';

const CATEGORIES = ['Family', 'Business', 'Projects', 'Properties', 'Faith', 'Other'];

// 2026-06-13 — R15 sovereign photo write-path. When this device can reach the
// family NAS (has the bridge token), the shared family gallery loads LIVE from
// the NAS and "+ Add photos" writes there, so every family device sees the
// same backed-up pictures instead of one phone's localStorage. Fail-quiet:
// no token / offline → renders nothing here, and uploads fall back to
// device-local (handled in onFiles).
function FamilyNasGallery({ refreshKey, onOpen }) {
  const [photos, setPhotos] = useState(null);
  useEffect(() => {
    if (!hasBridgeToken()) { setPhotos([]); return; }
    let cancelled = false;
    (async () => {
      const res = await fetchFamilyPhotos({ limit: 24 });
      // Only photos the NAS actually has a thumbnail for — a null thumb (a
      // screenshot or non-camera image Synology never thumbnailed) would paint
      // a blank tile.
      if (!cancelled && res) setPhotos((res.photos || []).filter(p => p.thumb));
      else if (!cancelled) setPhotos([]);
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (!photos || photos.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#5A6E3D] font-semibold mb-1">🏠 Shared family gallery · live from your NAS</div>
      <p className="text-[10px] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        Everyone signed in to the family sees these — backed up on the NAS you own, not trapped on one phone.
      </p>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {photos.map(p => (
          <button key={p.id} type="button" onClick={() => onOpen && onOpen(p.thumb, p.text || 'Family photo')} className="block w-full">
            <img src={p.thumb} alt={p.text || 'Family photo'} className="w-full h-24 object-cover border border-[#E8E4DC] hover:opacity-90 cursor-zoom-in" loading="lazy" />
          </button>
        ))}
      </div>
    </div>
  );
}

// 2026-06-12 auto-populate (Darrell: "the images are already there for each
// rental and my home and the Big Picture tab — you can start it, I'll adjust
// after"). The strip fills ITSELF from the NAS photo bridge — a few shots
// per property, fetched live each visit, never copied into device storage
// (the NAS stays the sovereign home; quota untouched). "Adjust after" =
// ☆ Keep, which promotes a single shot into the curated gallery above.
// No bridge token on this device (visitors, demo) → renders nothing.
function NasPlacesStrip({ rentals = [], addLifePhotos, keptIds, onOpen }) {
  const [groups, setGroups] = useState(null);
  useEffect(() => {
    if (!hasBridgeToken() || rentals.length === 0) { setGroups([]); return; }
    let cancelled = false;
    (async () => {
      const out = [];
      for (const r of rentals.slice(0, 8)) {
        if (!r || !r.name) continue;
        // The photo bridge keys on the exact Synology Chat channel name, not the
        // property's display name — so map through chatChannelFor (e.g. "805 N
        // Prospect" -> "805NProspect"), or the channel never matches.
        const channel = chatChannelFor(r);
        if (!channel) continue;
        // Over-fetch, then keep only thumbnailed photos so the strip never shows
        // blank tiles, and cap at 3 for the hero strip.
        const res = await fetchChannelPhotos(channel, { limit: 8 });
        if (cancelled) return;
        const withThumb = res ? res.photos.filter(p => p.thumb) : [];
        if (withThumb.length) out.push({ id: r.id, name: r.name, photos: withThumb.slice(0, 3) });
      }
      if (!cancelled) setGroups(out);
    })();
    return () => { cancelled = true; };
    // Mount-once by design: one NAS sweep per Big Picture visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!groups || groups.length === 0) return null;
  return (
    <div className="mt-4 pt-3 border-t border-[#E8E4DC]">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">🏡 Your places · live from your NAS</div>
      <p className="text-[10px] text-[#5A5751] italic mt-0.5 mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
        Loaded straight from your NAS each visit — nothing copied to this device. ☆ Keep moves one into the gallery above.
      </p>
      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id}>
            <div className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-1">{g.name}</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {g.photos.map(p => {
                const keepId = `lp-nas-${p.id}`;
                const kept = keptIds.has(keepId);
                return (
                  <figure key={p.id} className="border border-[#E8E4DC] bg-[#FAF8F4] w-32 shrink-0">
                    <button type="button" onClick={() => onOpen && onOpen(p.thumb, p.text || g.name)} className="block w-32"><img src={p.thumb} alt={p.text || g.name} className="w-32 h-24 object-cover cursor-zoom-in" loading="lazy" /></button>
                    <figcaption className="p-1 flex items-center justify-between gap-1">
                      <span className="text-[9px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{p.date || ''}</span>
                      {addLifePhotos && (
                        <button
                          type="button"
                          disabled={kept}
                          onClick={() => addLifePhotos([{ id: keepId, src: p.thumb, caption: g.name, category: 'Properties', date: p.date || '' }])}
                          className={`text-[9px] uppercase tracking-wider ${kept ? 'text-[#5A6E3D]' : 'text-[#B85838] hover:text-[#1A1815]'}`}
                        >{kept ? '✓ kept' : '☆ keep'}</button>
                      )}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 2026-06-24 (Darrell: "can we use the Photos or Files app to populate the Big
// Picture page?"). YES — sovereignly. The OWNER designates ONE curated album
// (a Synology Photos album or NAS folder) to feed the Big Picture page; only
// that album is served, live from the NAS, never the raw personal camera roll.
// Privacy by default: no album chosen → nothing shown, and the picker only
// appears for the owner (not readOnly) on a device that can reach the NAS.
// Fail-quiet exactly like the other NAS reads — until wf-album-photos ships
// on the NAS this renders nothing, which is the correct honest state.
function CuratedAlbumGallery({ readOnly, onOpen }) {
  const [album, setAlbumState] = useState(() => bigPictureAlbum());
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState(false);
  const [photos, setPhotos] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hasBridgeToken() || !album) { setPhotos([]); return; }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const res = await fetchAlbumPhotos(album, { limit: 60 });
      if (cancelled) return;
      setLoading(false);
      // Only photos the NAS actually thumbnailed — a null thumb would paint a blank tile.
      setPhotos(res ? (res.photos || []).filter(p => p.thumb) : []);
    })();
    return () => { cancelled = true; };
  }, [album]);

  const saveAlbum = () => { const v = (draft || '').trim(); setBigPictureAlbum(v); setAlbumState(bigPictureAlbum()); setEditing(false); };
  const clearAlbum = () => { setBigPictureAlbum(''); setAlbumState(''); setEditing(false); setDraft(''); };

  // The owner-only picker. Only shown on a device that can reach the NAS — no
  // point offering an album when there's no bridge to serve it.
  const picker = (!readOnly && hasBridgeToken()) ? (
    <div className="mb-2">
      {editing ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveAlbum(); if (e.key === 'Escape') setEditing(false); }}
            placeholder="Synology Photos album or folder name"
            className="text-[11px] p-1.5 border border-[#E8E4DC] bg-white w-56"
          />
          <button type="button" onClick={saveAlbum} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838]">Use album</button>
          <button type="button" onClick={() => setEditing(false)} className="text-[9px] uppercase tracking-wider px-2 py-1 border border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815]">Cancel</button>
        </div>
      ) : album ? (
        <div className="flex items-center gap-2 flex-wrap text-[10px]">
          <span className="text-[#5A5751]">Feeding from album <span className="font-semibold text-[#1A1815]">{album}</span></span>
          <button type="button" onClick={() => { setDraft(album); setEditing(true); }} className="uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">change</button>
          <button type="button" onClick={clearAlbum} className="uppercase tracking-wider text-[#5A5751] hover:text-[#B85838]">× clear</button>
        </div>
      ) : (
        <button type="button" onClick={() => { setDraft(''); setEditing(true); }} className="text-[10px] uppercase tracking-wider px-3 py-1.5 min-h-[36px] inline-flex items-center border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4]">🖼️ Choose an album to feature</button>
      )}
    </div>
  ) : null;

  // Nothing to show and nothing to offer → render nothing (viewers, no token).
  if (!picker && (!photos || photos.length === 0)) return null;

  return (
    <div className="mb-4">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold mb-1">🖼️ Featured album · live from your NAS</div>
      {picker}
      {album && (
        <p className="text-[10px] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Only the one album you chose feeds this page — your camera roll stays private. Loaded straight from the NAS you own each visit, nothing copied to this device.
        </p>
      )}
      {loading && <div className="text-[10px] text-[#5A5751]">Loading from your NAS…</div>}
      {photos && photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {photos.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpen && onOpen(photos.map(x => ({ src: x.thumb, alt: x.text || 'Featured photo', caption: x.text || '', date: x.date || '' })), i)}
              className="block w-full"
            >
              <img src={p.thumb} alt={p.text || 'Featured photo'} className="w-full h-24 object-cover border border-[#E8E4DC] hover:opacity-90 cursor-zoom-in" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      {album && !loading && photos && photos.length === 0 && (
        <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>
          No photos loaded from <span className="font-semibold">{album}</span> yet — check the album name, or the NAS album feed may still be coming online.
        </p>
      )}
    </div>
  );
}

export function LifeGallery({ photos = [], addLifePhotos, updateLifePhoto, deleteLifePhoto, readOnly = false, rentals = [] }) {
  const [filter, setFilter] = useState('All');
  const [pendingCategory, setPendingCategory] = useState('Family');
  const [busy, setBusy] = useState(false);
  const [nasNote, setNasNote] = useState('');
  const [familyRefresh, setFamilyRefresh] = useState(0);
  const [lightbox, setLightbox] = useState(null);

  const onFiles = async (fileList) => {
    if (!fileList || fileList.length === 0 || !addLifePhotos) return;
    setBusy(true);
    setNasNote('');
    const today = new Date().toISOString().slice(0, 10);
    const shots = [];
    for (const file of Array.from(fileList)) {
      try {
        // Hero photos get a bit more resolution than thumbnails.
        shots.push({ id: `lp-${Date.now()}-${shots.length}`, src: await compressImageFile(file, 1600, 0.75), caption: '', category: pendingCategory, date: today, file });
      } catch (e) { console.warn('Life photo compress failed', e); }
    }
    // R15: when this device can reach the family NAS, write there so the photo
    // is SHARED + backed up; only fall back to device-local for shots the NAS
    // refused or when there's no token. The NAS is the better home; a photo is
    // never lost for lack of it.
    let toNas = 0;
    const localOnly = [];
    if (hasBridgeToken()) {
      for (const s of shots) {
        const res = await uploadPhoto(s.src, { filename: s.file?.name });
        if (res && res.ok) toNas += 1; else localOnly.push(s);
      }
    } else {
      localOnly.push(...shots);
    }
    setBusy(false);
    if (toNas) { setFamilyRefresh(k => k + 1); setNasNote(`${toNas} photo${toNas === 1 ? '' : 's'} saved to your NAS — shared with the family.`); }
    if (localOnly.length) addLifePhotos(localOnly.map(s => { const c = { ...s }; delete c.file; return c; }));
  };

  // Add straight from the phone's camera folder where the browser allows it
  // (Android Chrome/Edge: the File System Access API). You grant the folder
  // ONCE — the app never reaches into your gallery on its own (that's the
  // sovereignty line) — then it pulls the most recent shots in one tap. Every
  // other device falls back to the normal photo picker above.
  const supportsFolderPick = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const addFromCameraFolder = async () => {
    if (!supportsFolderPick) return;
    try {
      const dir = await window.showDirectoryPicker({ id: 'poetech-camera', startIn: 'pictures' });
      const handles = [];
      for await (const entry of dir.values()) {
        if (entry.kind === 'file' && /\.(jpe?g|png|webp|heic)$/i.test(entry.name)) handles.push(entry);
      }
      // Camera filenames sort by capture time, so newest-name-first ~= most recent.
      handles.sort((a, b) => b.name.localeCompare(a.name));
      const files = await Promise.all(handles.slice(0, 30).map(h => h.getFile()));
      await onFiles(files);
    } catch (e) { /* user cancelled the folder picker — no-op */ }
  };

  const shown = filter === 'All' ? photos : photos.filter(p => (p.category || 'Other') === filter);
  const chip = (active) => `text-[10px] uppercase tracking-wider px-2.5 py-1 border ${active ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'text-[#5A5751] border-[#E8E4DC] hover:border-[#1A1815]'}`;

  return (
    <section className="bg-white border border-[#1A1815] p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-[#B85838] font-semibold">📸 The Biggest Picture · Your Life in Photos</div>
          <p className="text-xs text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
            The people and work this is all for. Yours — never sold, never mined, never used to train anything.
          </p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2 flex-wrap">
            <label className={`${busy ? 'opacity-50 pointer-events-none ' : ''}text-[10px] uppercase tracking-wider px-3 py-1.5 min-h-[36px] inline-flex items-center border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] cursor-pointer`}>
              {busy ? 'Adding…' : '+ Add photos'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={e => { onFiles(e.target.files); e.target.value = ''; }} />
            </label>
            {supportsFolderPick && (
              <button type="button" disabled={busy} onClick={addFromCameraFolder} className={`${busy ? 'opacity-50 pointer-events-none ' : ''}text-[10px] uppercase tracking-wider px-3 py-1.5 min-h-[36px] inline-flex items-center border border-[#1A1815] text-[#1A1815] hover:bg-[#FAF8F4] cursor-pointer`}>📷 From camera folder</button>
            )}
          </div>
        )}
      </div>

      {!readOnly && nasNote && (
        <div className="mb-3 text-[11px] text-[#5A6E3D] bg-[#F2F5EC] border border-[#D6E0C4] px-3 py-2" style={{ fontFamily: '"Fraunces", serif' }}>✓ {nasNote}</div>
      )}

      <CuratedAlbumGallery readOnly={readOnly} onOpen={(items, index) => setLightbox({ items, index })} />

      {!readOnly && <FamilyNasGallery refreshKey={familyRefresh} onOpen={(src, alt) => setLightbox({ src, alt })} />}

      {!readOnly && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="text-[9px] uppercase tracking-wider text-[#5A5751] mr-1">New photo goes to:</span>
          {CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => setPendingCategory(c)} className={chip(pendingCategory === c)}>{c}</button>
          ))}
        </div>
      )}

      {photos.length === 0 ? (
        <div className="bg-[#FAF8F4] border border-dashed border-[#E8E4DC] p-6 text-center">
          <div className="text-2xl mb-1" aria-hidden="true">🖼️</div>
          <p className="text-sm text-[#1A1815] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>Put your people on the home screen.</p>
          <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Add a few photos of your family, your work, the properties you steward — so you see what this is for every time you open the app.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 mb-3 flex-wrap">
            {['All', ...CATEGORIES].map(c => {
              const n = c === 'All' ? photos.length : photos.filter(p => (p.category || 'Other') === c).length;
              if (c !== 'All' && n === 0) return null;
              return <button key={c} type="button" onClick={() => setFilter(c)} className={chip(filter === c)}>{c} · {n}</button>;
            })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {shown.map((p, i) => (
              <figure key={p.id} className="border border-[#E8E4DC] bg-[#FAF8F4]">
                <button type="button" onClick={() => setLightbox({ items: shown.map(x => ({ src: x.src, alt: x.caption || x.category || 'Life photo', caption: x.caption || '', date: x.date || '' })), index: i })} title="Open full size" className="block w-full">
                  <img src={p.src} alt={p.caption || p.category || 'Life photo'} className="w-full h-40 object-cover hover:opacity-90 cursor-zoom-in" />
                </button>
                <figcaption className="p-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold">{p.category || 'Other'}</span>
                    <span className="text-[9px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{p.date || ''}</span>
                  </div>
                  {readOnly ? (
                    p.caption ? <div className="text-[11px] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{p.caption}</div> : null
                  ) : (
                    <input
                      className="w-full text-[11px] p-1 border border-[#E8E4DC] bg-white mt-1"
                      placeholder="caption"
                      defaultValue={p.caption || ''}
                      onBlur={e => { if (updateLifePhoto && (e.target.value || '') !== (p.caption || '')) updateLifePhoto(p.id, { caption: e.target.value }); }}
                    />
                  )}
                  <div className="flex items-center justify-between gap-1 mt-1">
                    {/* Export — proof there's no lock-in. Your photo, downloadable
                        as a real file anytime; the opposite of a platform that
                        traps your images. */}
                    <a href={p.src} download={`poetech-${(p.category || 'photo').toLowerCase()}-${p.date || ''}.jpg`} className="text-[9px] uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815]">⬇ Save</a>
                    {!readOnly && (
                      <button type="button" onClick={() => { if (deleteLifePhoto && window.confirm('Remove this photo?')) deleteLifePhoto(p.id); }} className="text-[9px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838]">× remove</button>
                    )}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      )}
      {!readOnly && <NasPlacesStrip rentals={rentals} addLifePhotos={addLifePhotos} keptIds={new Set(photos.map(p => p.id))} onOpen={(src, alt) => setLightbox({ src, alt })} />}

      {/* The promise — true for EVERY user, NAS or not. The never-sold pledge
          is absolute (there is no ad/training/sale pipeline). Durability is
          stated honestly: photos added here persist on this device; families
          with their own NAS now have the Phone → NAS backup card (2026-07-05)
          for bulk photo+video backup; a private PoeTech space for everyone
          else is still the next project. Do NOT re-word "your NAS" as if
          everyone has one. */}
      <p className="text-[10px] text-[#5A5751] mt-3 pt-2 border-t border-[#E8E4DC]" style={{ fontFamily: '"Fraunces", serif' }}>
        🔒 Never sold, never mined, never used to train a model — there is no such pipeline here. Photos added here live on this device; if your family runs its own NAS, the Phone → NAS backup card on this page moves this phone&apos;s photos and videos there in bulk — verified — so a lost phone never loses them. A private PoeTech space you can export any time is coming next for everyone else. Save any photo above right now.
      </p>
      <Lightbox items={lightbox?.items} index={lightbox?.index || 0} src={lightbox?.src} alt={lightbox?.alt} onClose={() => setLightbox(null)} />
    </section>
  );
}

export default LifeGallery;
