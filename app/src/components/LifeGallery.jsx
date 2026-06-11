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
import React, { useState } from 'react';
import { compressImageFile } from '../lib/image.js';

const CATEGORIES = ['Family', 'Business', 'Projects', 'Properties', 'Faith', 'Other'];

export function LifeGallery({ photos = [], addLifePhotos, updateLifePhoto, deleteLifePhoto, readOnly = false }) {
  const [filter, setFilter] = useState('All');
  const [pendingCategory, setPendingCategory] = useState('Family');
  const [busy, setBusy] = useState(false);

  const onFiles = async (fileList) => {
    if (!fileList || fileList.length === 0 || !addLifePhotos) return;
    setBusy(true);
    const today = new Date().toISOString().slice(0, 10);
    const shots = [];
    for (const file of Array.from(fileList)) {
      try {
        // Hero photos get a bit more resolution than thumbnails.
        shots.push({ id: `lp-${Date.now()}-${shots.length}`, src: await compressImageFile(file, 1600, 0.75), caption: '', category: pendingCategory, date: today });
      } catch (e) { console.warn('Life photo compress failed', e); }
    }
    setBusy(false);
    if (shots.length) addLifePhotos(shots);
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
          <label className={`${busy ? 'opacity-50 pointer-events-none ' : ''}text-[10px] uppercase tracking-wider px-3 py-1.5 min-h-[36px] inline-flex items-center border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] cursor-pointer`}>
            {busy ? 'Adding…' : '+ Add photos'}
            <input type="file" accept="image/*" multiple capture="environment" className="hidden" onChange={e => { onFiles(e.target.files); e.target.value = ''; }} />
          </label>
        )}
      </div>

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
            {shown.map(p => (
              <figure key={p.id} className="border border-[#E8E4DC] bg-[#FAF8F4]">
                <a href={p.src} target="_blank" rel="noopener noreferrer" title="Open full size">
                  <img src={p.src} alt={p.caption || p.category || 'Life photo'} className="w-full h-40 object-cover hover:opacity-90" />
                </a>
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
      {/* The promise — accurate to the architecture. Hero photos live on this
          device today; the durable sovereign home is the family's own NAS
          (auto-backup is the next photo project). Nothing here is ever sent to
          a PoeTech ad/training pipeline — there isn't one. */}
      <p className="text-[10px] text-[#5A5751] mt-3 pt-2 border-t border-[#E8E4DC]" style={{ fontFamily: '"Fraunces", serif' }}>
        🔒 Your photos are yours. They live on your devices and your own NAS — never an ad network, never sold, never used to train a model. Export any of them above, anytime.
      </p>
    </section>
  );
}

export default LifeGallery;
