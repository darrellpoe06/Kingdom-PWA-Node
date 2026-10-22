// =============================================================================
// DoorPictures — the pictures of the place a person lives in (DR-1199)
// =============================================================================
// Darrell, 2026-10-21: "We have images on multiple doors, and those images
// should be able to be seen by the people we are adding to the system, or if
// we decide we want them to."
//
// The tenant's and household member's Pictures tab. It reads exactly what the
// database lets this person read (0309: the door's listing pictures while the
// landlord's switch is on, and the pictures filed to their own tenancy) and
// draws nothing else — no upload, no caption editing, no arranging; those are
// the landlord's (GalleryTab). The room dropdown names THIS apartment's rooms
// (0309 opens them read-only) and nothing of any other door.
//
// Honest states (DR-0076, DR-0946): a door not known yet says so; a read that
// failed says the pictures could not be read, never "there are none"; a door
// with nothing shared says the landlord has not shared pictures yet. A tapped
// picture opens in place, under the grid, and closes on a second tap
// (UX-PATTERNS 2e). Every control clears the 36px floor and shows focus (2g).
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import SharpPicture from './SharpPicture.jsx';
import { loadDoorPhotos, loadRooms } from './cloud.js';
import { boundedRead } from '../../lib/bounded-read.js';

const serif = { fontFamily: '"Fraunces", serif' };
const FOCUS = 'focus:outline focus:outline-2 focus:outline-[#2F5D50]';
export const NO_ROOM = '__none__';
export const EVERY_ROOM = '';

export const WORDS = Object.freeze({
  title: 'Pictures',
  unknownDoor: 'Your door is not known on this device yet, so its pictures cannot be found. Open My place first, or try again in a moment.',
  unreachable: 'The pictures could not be read just now. What is missing is unknown rather than absent; try again before deciding anything from it.',
  none: 'Your landlord has not shared pictures of this place yet. When they do, they show here, room by room.',
  noneInRoom: 'No pictures of this room have been shared.',
  room: 'Which room',
  everyRoom: 'Every room',
  noRoom: 'Not a specific room',
  whatYouSee: 'These are the listing pictures your landlord shares of this place, and any pictures filed to your own tenancy. Condition pictures from before your time are not part of them.',
});

/** The pictures this person may see of a room: every room, one room, or the ones filed to none. */
export function picturesInRoom(photos = [], room = EVERY_ROOM) {
  const list = (Array.isArray(photos) ? photos : []).filter((p) => p && !p.archived_at);
  if (room === EVERY_ROOM) return list;
  if (room === NO_ROOM) return list.filter((p) => !p.room_id);
  return list.filter((p) => p.room_id === room);
}

/** One line that counts what is on the screen, by the room chosen. */
export function countLine(n, roomName = '') {
  const noun = n === 1 ? 'picture' : 'pictures';
  return roomName ? `${n} ${noun} · ${roomName}` : `${n} ${noun}`;
}

// `allow` is the preview's wall (DR-1199, preview.js): the owner reads every
// picture of the door, and a "seen as" view keeps only what that role would.
export default function DoorPictures({ rentalId = null, loadThumb = null, loadImage = null, allow = null }) {
  const [state, setState] = useState({ phase: rentalId ? 'reading' : 'no-door', photos: [], rooms: [], unread: [] });
  const [room, setRoom] = useState(EVERY_ROOM);
  const [open, setOpen] = useState(null);

  useEffect(() => {
    let live = true;
    if (!rentalId) { setState({ phase: 'no-door', photos: [], rooms: [], unread: [] }); return undefined; }
    setState((s) => ({ ...s, phase: 'reading' }));
    Promise.all([boundedRead(loadDoorPhotos(rentalId), 8000), boundedRead(loadRooms(rentalId), 8000)]).then(([ph, rm]) => {
      if (!live) return;
      const unread = [!ph.ok && 'pictures', !rm.ok && 'rooms'].filter(Boolean);
      setState({
        phase: ph.ok ? 'ready' : 'unreachable',
        photos: ph.ok ? ph.photos : [],
        rooms: rm.ok ? (rm.rooms || []).filter((r) => r && !r.archived_at) : [],
        unread,
      });
    });
    return () => { live = false; };
  }, [rentalId]);

  const mine = useMemo(() => (allow ? state.photos.filter((p) => allow(p)) : state.photos), [state.photos, allow]);
  const shown = useMemo(() => picturesInRoom(mine, room), [mine, room]);
  const roomName = room === EVERY_ROOM ? '' : room === NO_ROOM ? WORDS.noRoom : (state.rooms.find((r) => r.id === room)?.name || '');
  const openPhoto = open ? shown.find((p) => p.id === open) || null : null;

  return (
    <section className="bg-white border border-[#E8E4DC] p-3 sm:p-4 mb-3" data-testid="door-pictures" data-phase={state.phase}>
      <div className="flex items-baseline justify-between gap-3 mb-2">
        <h3 className="text-[0.625rem] uppercase tracking-[0.25em] font-semibold text-[#2F5D50]">{WORDS.title}</h3>
        {state.phase === 'ready' && (
          <span className="text-[0.75rem] text-[#6B665E]" style={serif} data-testid="door-pictures-count">{countLine(shown.length, roomName)}</span>
        )}
      </div>
      {state.phase === 'no-door' && <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed" data-testid="door-pictures-no-door">{WORDS.unknownDoor}</p>}
      {state.phase === 'reading' && <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed">Reading the pictures…</p>}
      {state.phase === 'unreachable' && <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed" role="status" data-testid="door-pictures-unreachable">{WORDS.unreachable}</p>}
      {state.phase === 'ready' && (
        <>
          <p className="text-[0.75rem] text-[#6B665E] leading-snug mb-2" style={serif}>{WORDS.whatYouSee}</p>
          {state.unread.includes('rooms') && (
            <p className="text-[0.75rem] text-[#6B665E] mb-2" role="status">The rooms could not be read just now, so the room list is incomplete rather than empty.</p>
          )}
          {mine.length === 0 ? (
            <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed" data-testid="door-pictures-none">{WORDS.none}</p>
          ) : (
            <>
              <label className="block text-[0.75rem] text-[#5A5751] mb-3">{WORDS.room}
                <select
                  className={`block border border-[#E8E4DC] bg-white px-2 py-2 text-sm min-h-[36px] ${FOCUS}`}
                  value={room}
                  onChange={(e) => { setRoom(e.target.value); setOpen(null); }}
                  data-testid="door-pictures-room"
                >
                  <option value={EVERY_ROOM}>{WORDS.everyRoom}</option>
                  {state.rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                  <option value={NO_ROOM}>{WORDS.noRoom}</option>
                </select>
              </label>
              {shown.length === 0 ? (
                <p className="text-[0.8125rem] text-[#6B665E] leading-relaxed" data-testid="door-pictures-none-in-room">{WORDS.noneInRoom}</p>
              ) : (
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2" data-testid="door-pictures-grid">
                  {shown.map((p) => (
                    <li key={p.id} className="relative">
                      <button
                        type="button"
                        onClick={() => setOpen((cur) => (cur === p.id ? null : p.id))}
                        aria-pressed={open === p.id}
                        aria-label={`${open === p.id ? 'Close' : 'Open'} ${p.caption || 'picture'}`}
                        className={`block w-full min-h-[36px] cursor-zoom-in ${FOCUS}`}
                        data-testid={`door-picture-${p.id}`}
                      >
                        <SharpPicture photo={p} loadImage={loadImage} loadThumb={loadThumb} alt={p.caption || 'A picture of this place'} className="aspect-square w-full object-cover" />
                      </button>
                      {p.caption && <span className="block text-[0.6875rem] text-[#5A5751] mt-1 truncate" style={serif}>{p.caption}</span>}
                    </li>
                  ))}
                </ul>
              )}
              {openPhoto && (
                <figure className="mt-3" data-testid="door-pictures-open">
                  <SharpPicture photo={openPhoto} loadImage={loadImage} loadThumb={loadThumb} alt={openPhoto.caption || 'A picture of this place'} className="w-full object-contain max-h-[70vh]" />
                  <figcaption className="text-[0.75rem] text-[#5A5751] mt-1" style={serif}>{openPhoto.caption || ''}</figcaption>
                </figure>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
