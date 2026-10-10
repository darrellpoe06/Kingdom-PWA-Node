// =============================================================================
// SystemPictures — a system keeps its pictures (DR-0932, migration 0267)
// =============================================================================
// Darrell, 2026-10-10: "Should be able to add images etc of systems... all
// places that make sense... make sense?"
//
// The data plate, the rusted flue, the new water heater in the basement, the
// before and after of a service visit — filed ON the system (and optionally
// on the visit), as ordinary door pictures (property_photos, kind 'system'):
// the same thumbnails, sharp tiles (DR-0931), branded viewer (DR-0941), and
// walls as every other picture of the door.
// =============================================================================
import React, { useCallback, useMemo, useState } from 'react';
import Lightbox from '../../components/Lightbox.jsx';
import { compressImageFile, isLikelyImageFile } from '../../lib/image.js';
import { stampImage, stampFileName } from '../../lib/brand-stamp.js';
import SharpPicture, { sharpestKnown } from './SharpPicture.jsx';
import { applyUrl } from './apply-link.js';
import { THUMB_MAX_WIDTH, THUMB_QUALITY, FULL_MAX_WIDTH, FULL_QUALITY } from './DoorTabs.jsx';

const serif = { fontFamily: '"Fraunces", serif' };
const field = 'border border-[#E8E4DC] px-2 py-2 text-[0.8125rem] bg-white text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#2F5D50]';

/** The pictures of one system, newest first; those of one visit when asked. */
export function picturesOf(photos = [], systemId, eventId = null) {
  return (Array.isArray(photos) ? photos : [])
    .filter((p) => p && !p.archived_at && p.system_id === systemId && (!eventId || p.system_event_id === eventId))
    .sort((a, b) => String(b.taken_at || b.uploaded_at || '').localeCompare(String(a.taken_at || a.uploaded_at || '')));
}

/** The rows to file for the chosen pictures (pure, so it is tested without a canvas). */
export function systemPictureRows({ door, system, eventId = null, caption = '', pics = [] }) {
  const words = String(caption || '').trim().slice(0, 500);
  return pics.map((pic) => ({
    instance_id: door.instance_id,
    rental_ref: door.id,
    kind: 'system',
    caption: words || `${system.name}`,
    storage_path: pic.dataUrl,
    thumb_path: pic.thumbUrl,
    system_id: system.id,
    system_event_id: eventId || null,
    taken_at: null,
  }));
}

export default function SystemPictures({
  door, system, events = [], photos = [], canAdd = false, busy = false, onAdd, loadImage = null, doorLabel = '',
}) {
  const mine = useMemo(() => picturesOf(photos, system.id), [photos, system.id]);
  const [open, setOpen] = useState(null);
  const [eventId, setEventId] = useState('');
  const [caption, setCaption] = useState('');
  const [working, setWorking] = useState('');
  const doorId = door ? door.id : null;
  const stamp = useCallback((item) => stampImage({ src: item.src, door: doorLabel, link: applyUrl(doorId) }), [doorLabel, doorId]);
  const eventName = (id) => {
    const e = events.find((x) => x.id === id);
    return e ? `${e.event_date} ${e.summary}` : '';
  };

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length || typeof onAdd !== 'function') return;
    setWorking(`Preparing ${files.length} picture${files.length === 1 ? '' : 's'}…`);
    const pics = []; const refused = [];
    for (const file of files) {
      if (!isLikelyImageFile(file)) { refused.push(file.name); continue; }
      try {
        pics.push({ dataUrl: await compressImageFile(file, FULL_MAX_WIDTH, FULL_QUALITY), thumbUrl: await compressImageFile(file, THUMB_MAX_WIDTH, THUMB_QUALITY) });
      } catch { refused.push(file.name); }
    }
    const rows = systemPictureRows({ door, system, eventId: eventId || null, caption, pics });
    const r = rows.length ? await onAdd(rows) : { ok: true };
    setWorking(r && r.ok === false
      ? `Not saved: ${r.reason || 'try again'}.`
      : `Added ${rows.length} to ${system.name}${eventId ? ` (${eventName(eventId)})` : ''}.${refused.length ? ` Not pictures: ${refused.join(', ')}.` : ''}`);
    setCaption('');
  };

  return (
    <div className="mt-2" data-testid="system-pictures">
      <div className="text-[0.625rem] uppercase tracking-wider font-semibold text-[#2F5D50] mb-1">
        Pictures of {system.name} ({mine.length})
      </div>
      {mine.length === 0 ? (
        <p className="text-[0.75rem] text-[#6B665E]" style={serif}>No pictures yet. The data plate first: it holds the model, serial and date.</p>
      ) : (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-1">
          {mine.map((p, i) => (
            <li key={p.id}>
              <button type="button" onClick={() => setOpen(i)} className="w-full focus:outline focus:outline-2 focus:outline-[#2F5D50]" aria-label={`Open ${p.caption || 'picture'}`}>
                <SharpPicture photo={p} loadImage={loadImage} alt={p.caption || system.name} className="aspect-square w-full object-cover" />
              </button>
              {p.system_event_id && <div className="text-[0.625rem] text-[#6B665E] leading-tight">{eventName(p.system_event_id)}</div>}
            </li>
          ))}
        </ul>
      )}
      {canAdd && (
        <div className="flex flex-wrap items-end gap-2 mt-2">
          {events.length > 0 && (
            <label className="text-[0.6875rem] text-[#5A5751]">From a visit (optional)
              <select value={eventId} onChange={(e) => setEventId(e.target.value)} aria-label={`Which visit the ${system.name} pictures are from`} className={`${field} block`}>
                <option value="">Not a particular visit</option>
                {events.map((e) => <option key={e.id} value={e.id}>{e.event_date} · {e.summary}</option>)}
              </select>
            </label>
          )}
          <label className="text-[0.6875rem] text-[#5A5751]">What they show (optional)
            <input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} aria-label={`What the ${system.name} pictures show`} className={`${field} block`} style={serif} />
          </label>
          <label className="inline-flex items-center justify-center text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[44px] border cursor-pointer bg-white border-[#2F5D50] text-[#2F5D50] focus-within:outline focus-within:outline-2 focus-within:outline-[#2F5D50]">
            Add pictures
            <input type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={pick} aria-label={`Add pictures of ${system.name}`} />
          </label>
        </div>
      )}
      {working && <p className="text-[0.75rem] text-[#2F5D50] mt-1" role="status">{working}</p>}
      {open !== null && mine.length > 0 && (
        <Lightbox
          items={mine.map((p, n) => ({
            src: sharpestKnown(p),
            alt: p.caption || system.name,
            caption: [p.caption, p.system_event_id ? eventName(p.system_event_id) : ''].filter(Boolean).join(' · '),
            fileName: stampFileName(`${doorLabel} ${system.name}`, n + 1),
          }))}
          index={open}
          onClose={() => setOpen(null)}
          stamp={stamp}
        />
      )}
    </div>
  );
}
