// =============================================================================
// AreaMap — the area a place is in, and what is nearby; never the street (DR-0912)
// =============================================================================
// Darrell, 2026-10-10: "Just show the location without the address... make
// sense... map view..."
//
// AreaMap draws OpenStreetMap tiles around the door's ROUNDED area (area.js,
// 0270) with a 600 m circle. No pin, no exact point: the database only holds
// the rounded area, so there is nothing more exact to draw. No map library:
// a few <img> tiles and one SVG circle. OSM's tile policy asks for visible
// attribution, which is on the map.
//
// NearbyList prints the family's lines, straight-line, as the database holds them.
//
// AreaEditor is the family's: paste a point from any map app ("40.12, -88.25"
// or a Google Maps link). The exact point stays on this device: it is used
// once to work out the distances, then rounded before anything is saved.
// Nothing is looked up anywhere, so the street is never sent to a search
// service.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import {
  roundArea, parsePoint, nearbyFrom, cleanNearby, tileLayout, milesText,
  namesStreet, CIRCLE_METERS, NEARBY_MAX,
} from './area.js';
import { loadDoorArea } from './cloud.js';
import { boundedRead } from '../../lib/bounded-read.js';

const serif = { fontFamily: '"Fraunces", Georgia, serif' };
const field = 'text-sm border border-[#E8E4DC] px-2 py-2 bg-white text-[#1A1815]';
const lbl = 'block text-[0.625rem] uppercase tracking-wider text-[#6B665E] mb-1';

const Btn = ({ children, onClick, tone = 'ghost', disabled, ...rest }) => (
  <button
    type="button" onClick={onClick} disabled={disabled}
    className={`text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#2F5D50] disabled:opacity-40 ${
      tone === 'primary' ? 'bg-[#2F5D50] text-white border-[#2F5D50] hover:bg-[#1A1815] hover:border-[#1A1815]'
        : 'bg-white text-[#1A1815] border-[#E8E4DC] hover:border-[#1A1815]'}`}
    {...rest}
  >{children}</button>
);

// The circle is 2 x CIRCLE_METERS across: about 0.7 mi.
const acrossMiles = ((2 * CIRCLE_METERS) / 1609.344).toFixed(1);

/** The map. `area` is {lat, lng} already rounded; `where` names the town for the screen reader. */
export function AreaMap({ area, where = '', height = 200 }) {
  const L = useMemo(() => (area ? tileLayout(area) : null), [area]);
  if (!L) return null;
  const r = L.radiusPx;
  return (
    <div
      className="relative w-full overflow-hidden border border-[#E8E4DC]"
      style={{ height }}
      role="img"
      aria-label={`Map of the area${where ? ` in ${where}` : ''}. The place is inside the circle, about ${acrossMiles} miles across. The street is not shown.`}
      data-testid="area-map"
    >
      <div
        aria-hidden="true"
        className="absolute"
        style={{ width: L.width, height: L.height, left: `calc(50% - ${L.centerX}px)`, top: `calc(50% - ${L.centerY}px)` }}
      >
        {L.tiles.map((t) => (
          <img
            key={t.key} src={t.src} alt="" width={256} height={256} loading="lazy" decoding="async" draggable={false}
            className="absolute max-w-none select-none" style={{ left: t.left, top: t.top }}
            data-testid="area-map-tile"
          />
        ))}
      </div>
      <svg
        aria-hidden="true" className="absolute pointer-events-none"
        width={2 * r + 4} height={2 * r + 4}
        style={{ left: `calc(50% - ${r + 2}px)`, top: `calc(50% - ${r + 2}px)` }}
        data-testid="area-map-circle"
      >
        <circle cx={r + 2} cy={r + 2} r={r} fill="rgba(47,93,80,0.18)" stroke="#2F5D50" strokeWidth="2" />
      </svg>
      <a
        href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
        className="absolute right-0 bottom-0 bg-white/85 px-1 text-[0.625rem] text-[#1A1815] underline"
      >© OpenStreetMap contributors</a>
    </div>
  );
}

/** The family's nearby lines, as the shelf prints them. */
export function NearbyList({ lines }) {
  const list = cleanNearby(lines);
  if (!list.length) return null;
  return (
    <div className="mt-2" data-testid="nearby">
      <p className="text-[0.625rem] uppercase tracking-wider text-[#2F5D50] font-semibold">What's nearby · straight-line</p>
      <ul className="mt-1 space-y-0.5">
        {list.map((l) => (
          <li key={l.label} className="text-[0.75rem] text-[#1A1815] flex justify-between gap-3">
            <span>{l.label}</span><span className="text-[#5A5751] whitespace-nowrap">{milesText(l.miles)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The family sets a door's area and what is nearby. Saves through the door's
 * own edit path (onSave(patch, summary)), so the trace lands in the door's notes.
 */
export function AreaEditor({ rental, onSave, busy }) {
  const [loaded, setLoaded] = useState('loading'); // loading | ready | unavailable
  const [area, setArea] = useState(null);
  const [lines, setLines] = useState([]);
  const [paste, setPaste] = useState('');
  const [said, setSaid] = useState('');
  const [own, setOwn] = useState({ label: '', miles: '' });

  useEffect(() => {
    let on = true;
    boundedRead(loadDoorArea(rental.id), 8000, { ok: false }).then((r) => {
      if (!on) return;
      if (!r.ok) { setLoaded('unavailable'); return; }
      setArea(r.area); setLines(cleanNearby(r.nearby)); setLoaded('ready');
    });
    return () => { on = false; };
  }, [rental.id]);

  const usePoint = () => {
    const p = parsePoint(paste);
    if (!p) { setSaid('That is not a point. Paste it as "40.1234, -88.2583", or a Google Maps link.'); return; }
    // The exact point is used here, once, for the distances; only the area is kept.
    setArea(roundArea(p.lat, p.lng));
    setLines(nearbyFrom(p));
    setPaste('');
    setSaid('Area set and the distances worked out from the exact point. Only the area is saved.');
  };
  const addOwn = () => {
    const label = own.label.trim(); const miles = Number(own.miles);
    if (!label || !Number.isFinite(miles) || miles < 0 || miles > 100) { setSaid('A line needs words and miles from 0 to 100.'); return; }
    if (lines.length >= NEARBY_MAX) { setSaid(`At most ${NEARBY_MAX} lines; take one off first.`); return; }
    setLines((l) => [...l, { label, miles }]);
    setOwn({ label: '', miles: '' });
  };
  const streetLine = lines.find((l) => namesStreet(l.label, rental.address));

  if (loaded === 'loading') return <p className="text-xs text-[#5A5751] mt-2">Reading the area…</p>;
  if (loaded === 'unavailable') {
    return <p className="text-xs text-[#5A5751] mt-2" data-testid="area-editor-unavailable">The area on the map could not be read just now. Your door is untouched; try again in a minute.</p>;
  }
  return (
    <div className="sm:col-span-2 mt-1" data-testid="area-editor">
      <span className={lbl}>Area on the map, and what is nearby</span>
      <p className="text-[0.75rem] text-[#6B665E] leading-snug mb-2">
        Paste the point from any map app (long-press the house). Strangers see a circle about {acrossMiles} miles across, never the street.
      </p>
      <div className="flex flex-wrap gap-2 items-end">
        <input
          value={paste} onChange={(e) => setPaste(e.target.value)} aria-label="Point from a map app"
          placeholder="40.1234, -88.2583" className={`${field} flex-1 min-w-[12rem]`} style={serif}
        />
        <Btn onClick={usePoint} disabled={!paste.trim()}>Use this point</Btn>
      </div>
      {area && <div className="mt-2"><AreaMap area={area} where={[rental.city, rental.state].filter(Boolean).join(', ')} height={160} /></div>}
      {lines.length > 0 && (
        <ul className="mt-2 space-y-1" data-testid="area-editor-lines">
          {lines.map((l, i) => (
            <li key={`${l.label}-${i}`} className="flex items-center justify-between gap-2 text-[0.8125rem]">
              <span>{l.label} · {milesText(l.miles)}</span>
              <Btn onClick={() => setLines((x) => x.filter((_, j) => j !== i))} aria-label={`Take off ${l.label}`}>Take off</Btn>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2 items-end mt-2">
        <input value={own.label} onChange={(e) => setOwn((o) => ({ ...o, label: e.target.value }))} maxLength={80} aria-label="Your own nearby line" placeholder="e.g. Bus stop at the corner" className={`${field} flex-1 min-w-[10rem]`} />
        <input value={own.miles} onChange={(e) => setOwn((o) => ({ ...o, miles: e.target.value }))} inputMode="decimal" aria-label="Miles away" placeholder="miles" className={`${field} w-20`} />
        <Btn onClick={addOwn}>Add line</Btn>
      </div>
      {streetLine && <p className="text-xs text-[#B85838] mt-2" role="alert">"{streetLine.label}" names this door's street. The shelf never shows the street; take it off or reword it.</p>}
      {said && <p className="text-xs text-[#2F5D50] mt-2" role="status">{said}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <Btn
          tone="primary" disabled={busy || !area || Boolean(streetLine)}
          onClick={() => onSave({ area_lat: area.lat, area_lng: area.lng, nearby: lines.length ? lines : null }, `Area on the map${lines.length ? ` and ${lines.length} nearby line${lines.length === 1 ? '' : 's'}` : ''}`)}
        >Save the area</Btn>
        {area && <Btn disabled={busy} onClick={() => onSave({ area_lat: null, area_lng: null, nearby: null }, 'Area on the map taken off')}>Take the map off</Btn>}
      </div>
    </div>
  );
}
