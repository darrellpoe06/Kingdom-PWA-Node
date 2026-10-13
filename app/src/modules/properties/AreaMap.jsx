// =============================================================================
// AreaMap — where a place is, drawn only when somebody asks (DR-0935, DR-0977)
// =============================================================================
// Darrell, 2026-10-10: "Just show the location without the address... map
// view..." Then 2026-10-12: "Why would I ever need to add a Google maps link
// when you can do that as a standard for any address we add?!!!!!" and "I only
// want a map when I want it... don't want to spend time or data for the map if
// not required or requested... however... we want to use it when we want to".
//
// AreaMap draws OpenStreetMap tiles around a ROUNDED area (area.js) with a
// 600 m circle. No map library: a few <img> tiles and one SVG circle, with
// OSM's attribution on the map.
//
// MapOnRequest is what a card shows, and what it shows follows the street
// (DR-0994; Darrell, 2026-10-13: "Show on map is supposed to be giving the
// area without the address... when the address is not shown... however maps
// when the address is showing can be the direct link to the street view"):
//   * street HELD  -> "Show on map" draws the rounded area as a circle, and
//     nothing else: no pin, no point, no link to a maps app.
//   * street SHOWN -> "Show on map" looks the address up and puts a PIN on the
//     house; "Street view" opens Google's Street View standing at it.
// No tile and no lookup happens until somebody taps.
//
// AreaEditor is the family's: "Find it from the address" looks the door up
// from its own address and works out what is nearby from the exact point,
// which is used once and rounded before anything is saved. Pinning it by hand
// (a point pasted from any map app) stays as the fallback for an address the
// lookup misses.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import {
  roundArea, parsePoint, nearbyFrom, cleanNearby, tileLayout, milesText,
  namesStreet, CIRCLE_METERS, NEARBY_MAX, addressLine, mapsUrl, findPoint,
  streetViewUrl, PIN_ZOOM, nearbyAround,
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

/**
 * The map. `area` is {lat, lng} already rounded and is drawn as a circle;
 * `pin` is the exact point of a SHOWN street and is drawn as a pin on the
 * house at block zoom (DR-0994). A held door is only ever given `area`.
 * `where` names the town (or the street, when shown) for the screen reader.
 */
export function AreaMap({ area, pin = null, where = '', height = 200, streetShown = false }) {
  const at = pin || area;
  const L = useMemo(() => (at ? tileLayout(at, pin ? { z: PIN_ZOOM } : undefined) : null), [at, pin]);
  if (!L) return null;
  const r = L.radiusPx;
  const label = pin
    ? `Map of ${where || 'the address'}. The pin is on the house.`
    : `Map of the area${where ? ` in ${where}` : ''}. The place is inside the circle, about ${acrossMiles} miles across.${streetShown ? '' : ' The street is not shown.'}`;
  return (
    <div
      className="relative w-full overflow-hidden border border-[#E8E4DC]"
      style={{ height }}
      role="img"
      aria-label={label}
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
      {pin ? (
        // The pin's tip sits on the point: the SVG is 28 x 36 and its tip is
        // its bottom-center, so it is lifted by its full height.
        <svg
          aria-hidden="true" className="absolute pointer-events-none"
          width="28" height="36" viewBox="0 0 28 36"
          style={{ left: 'calc(50% - 14px)', top: 'calc(50% - 36px)' }}
          data-testid="area-map-pin"
        >
          <path d="M14 35C14 35 2 21 2 13a12 12 0 0 1 24 0c0 8-12 22-12 22z" fill="#2F5D50" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="14" cy="13" r="4.5" fill="#FFFFFF" />
        </svg>
      ) : (
        <svg
          aria-hidden="true" className="absolute pointer-events-none"
          width={2 * r + 4} height={2 * r + 4}
          style={{ left: `calc(50% - ${r + 2}px)`, top: `calc(50% - ${r + 2}px)` }}
          data-testid="area-map-circle"
        >
          <circle cx={r + 2} cy={r + 2} r={r} fill="rgba(47,93,80,0.18)" stroke="#2F5D50" strokeWidth="2" />
        </svg>
      )}
      {/* The tiles' licence asks for this on the map; it is not the listing,
          so the read-aloud passes over it (data-read-skip). */}
      <a
        href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"
        className="absolute right-0 bottom-0 bg-white/85 px-1 text-[0.625rem] text-[#1A1815] underline"
        aria-label="© OpenStreetMap contributors (opens in a new tab)" data-read-skip=""
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

const linkCls = 'inline-flex items-center text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#E8E4DC] bg-white text-[#1A1815] underline-offset-2 hover:border-[#1A1815] focus:outline focus:outline-2 focus:outline-[#2F5D50]';

/**
 * A map only when somebody asks for one (DR-0977), and the kind of map the
 * street allows (DR-0994). `area` is a rounded area or null (the door's own,
 * or its building's, from the shelf); `query` is the address line ONLY when
 * the family shows the street, and '' when they hold it. Nothing is fetched
 * until a tap.
 *
 *   held  (no query): "Show on map" -> the area circle. No link out: a pin
 *                     dropped in a maps app would read as the house.
 *   shown (query):    "Show on map" -> the address is looked up and a pin is
 *                     put on the house; if the lookup fails, the area is drawn
 *                     and the card says so. "Street view" -> Google's Street
 *                     View at the house. Before the point is known, its href is
 *                     the address in Google Maps; a tap opens a tab at once
 *                     (inside the tap, so no pop-up blocker refuses it), looks
 *                     the house up, and sends that tab into Street View.
 */
export function MapOnRequest({ area = null, query = '', where = '', streetShown = false, nearby = [], openTab = defaultOpenTab }) {
  const [open, setOpen] = useState(false);
  const [point, setPoint] = useState(null); // the exact point of a SHOWN street, once looked up
  const [lines, setLines] = useState([]);
  const [state, setState] = useState('idle'); // idle | finding
  const [said, setSaid] = useState('');
  const shownStreet = Boolean(query);
  if (!area && !shownStreet) return null;

  const lookUp = async () => {
    if (point) return { ok: true, point };
    const r = await findPoint(query);
    if (r.ok) { setPoint(r.point); setLines(nearbyFrom(r.point)); }
    return r;
  };
  const show = async () => {
    if (open) { setOpen(false); return; }
    if (!shownStreet || point) { setOpen(true); return; }
    setState('finding'); setSaid('');
    const r = await lookUp();
    setState('idle');
    if (r.ok) { setOpen(true); return; }
    if (area) { setSaid(`${r.reason} This is its area.`); setOpen(true); return; }
    setSaid(r.reason);
  };
  const streetView = async (e) => {
    if (point) return; // the href is already Street View
    e.preventDefault();
    const tab = openTab();
    const r = await lookUp();
    const url = r.ok ? streetViewUrl(r.point) : mapsUrl({ query });
    if (!r.ok) setSaid(`${r.reason} Opened the address in Maps instead.`);
    if (tab) { tab.location.href = url; return; }
    setSaid(r.ok ? 'Street view is ready: tap it again.' : `${r.reason}`);
  };
  const extra = cleanNearby(nearby).length ? [] : lines;
  return (
    <div className="mt-2" data-testid="map-on-request">
      <div className="flex flex-wrap gap-2">
        <Btn onClick={show} disabled={state === 'finding'} data-testid="show-map" aria-expanded={open}>
          {state === 'finding' ? 'Finding it…' : open ? 'Hide the map' : 'Show on map'}
        </Btn>
        {shownStreet && (
          <a
            href={point ? streetViewUrl(point) : mapsUrl({ query })}
            onClick={streetView}
            target="_blank" rel="noopener noreferrer" className={linkCls} data-testid="street-view"
            // WCAG 2.2 AA (DR-0315): the name starts with what the button says
            // (2.5.3) and says where it goes; a control is not read aloud as
            // part of the listing (data-read-skip, TTSControl).
            aria-label={`Street view of ${query}, opens Google Maps in a new tab`} data-read-skip=""
          >Street view</a>
        )}
      </div>
      {said && <p className="text-xs text-[#5A5751] mt-1" role="status">{said}</p>}
      {open && (point
        ? <div className="mt-2"><AreaMap pin={point} where={query} streetShown /></div>
        : area && <div className="mt-2"><AreaMap area={area} where={where} streetShown={streetShown} /></div>)}
      {open && extra.length > 0 && <NearbyList lines={extra} />}
    </div>
  );
}

/** A tab opened inside the tap, cut off from this page (no opener). */
function defaultOpenTab() {
  if (typeof window === 'undefined' || typeof window.open !== 'function') return null;
  const tab = window.open('', '_blank');
  if (tab) { try { tab.opener = null; } catch { /* a cross-origin tab already has none */ } }
  return tab;
}

/**
 * The family puts a door on the map, from its own address (DR-0977). Saves
 * through the door's own edit path (onSave(patch, summary)), so the trace lands
 * in the door's notes. No tile is drawn until the family finds the door or asks
 * to see the area already saved.
 */
export function AreaEditor({ rental, onSave, busy }) {
  const [loaded, setLoaded] = useState('loading'); // loading | ready | unavailable
  const [saved, setSaved] = useState(null);         // the area in the database
  const [area, setArea] = useState(null);           // the area being edited
  const [lines, setLines] = useState([]);
  const [seeMap, setSeeMap] = useState(false);
  const [finding, setFinding] = useState(false);
  const [paste, setPaste] = useState('');
  const [said, setSaid] = useState('');
  const [own, setOwn] = useState({ label: '', miles: '' });
  const query = addressLine(rental);

  useEffect(() => {
    let on = true;
    boundedRead(loadDoorArea(rental.id), 8000, { ok: false }).then((r) => {
      if (!on) return;
      if (!r.ok) { setLoaded('unavailable'); return; }
      setSaved(r.area); setArea(r.area); setLines(cleanNearby(r.nearby)); setLoaded('ready');
    });
    return () => { on = false; };
  }, [rental.id]);

  const place = async (p, how) => {
    // The exact point is used here, once, for the distances; only the area is
    // kept. What is nearby is asked around THIS point (DR-0995), so a door
    // anywhere gets its own places, not Champaign's.
    setArea(roundArea(p.lat, p.lng));
    setLines(nearbyFrom(p));
    setSeeMap(true);
    setSaid(`${how} Looking up what is nearby…`);
    const near = await nearbyAround(p);
    if (near.ok) {
      setLines(near.lines);
      setSaid(`${how} ${near.lines.length ? `${near.lines.length} nearby place${near.lines.length === 1 ? '' : 's'} measured from it.` : 'Nothing listed is within reach of it.'} Only the rounded area is saved.`);
    } else {
      setSaid(`${how} ${near.reason} The researched places are shown; only the rounded area is saved.`);
    }
  };
  const findIt = async () => {
    setFinding(true); setSaid('');
    const r = await findPoint(query);
    setFinding(false);
    if (!r.ok) { setSaid(`${r.reason} You can pin it by hand below.`); return; }
    await place(r.point, `Found${r.matched ? ` as "${r.matched}"` : ''}.`);
  };
  const usePoint = () => {
    const p = parsePoint(paste);
    if (!p) { setSaid('That is not a point. Paste it as "40.1234, -88.2583", or a map link.'); return; }
    setPaste('');
    place(p, 'Pinned by hand.');
  };
  const addOwn = () => {
    const label = own.label.trim(); const miles = Number(own.miles);
    if (!label || !Number.isFinite(miles) || miles < 0 || miles > 100) { setSaid('A line needs words and miles from 0 to 100.'); return; }
    if (lines.length >= NEARBY_MAX) { setSaid(`At most ${NEARBY_MAX} lines; take one off first.`); return; }
    setLines((l) => [...l, { label, miles }]);
    setOwn({ label: '', miles: '' });
  };
  const streetLine = lines.find((l) => namesStreet(l.label, rental.address));
  const out = mapsUrl({ query, area });

  if (loaded === 'loading') return <p className="text-xs text-[#5A5751] mt-2">Reading the area…</p>;
  if (loaded === 'unavailable') {
    return <p className="text-xs text-[#5A5751] mt-2" data-testid="area-editor-unavailable">The area on the map could not be read just now. Your door is untouched; try again in a minute.</p>;
  }
  return (
    <div className="sm:col-span-2 mt-1" data-testid="area-editor">
      <span className={lbl}>The map, and what is nearby</span>
      <p className="text-[0.75rem] text-[#6B665E] leading-snug mb-2" data-testid="area-status">
        {saved ? 'This door is on the map. ' : 'Not on the map yet: the app places it from its address on its own, or find it now. '}
        Visitors see what is nearby; they see a map only when they tap for one.
      </p>
      <div className="flex flex-wrap gap-2 items-center">
        <Btn onClick={findIt} disabled={finding || !query}>{finding ? 'Finding it…' : 'Find it from the address'}</Btn>
        {area && <Btn onClick={() => setSeeMap((v) => !v)} aria-expanded={seeMap}>{seeMap ? 'Hide the map' : 'Show on map'}</Btn>}
        {out && <a href={out} target="_blank" rel="noopener noreferrer" className={linkCls}>Open in Maps</a>}
      </div>
      {seeMap && area && <div className="mt-2"><AreaMap area={area} where={[rental.city, rental.state].filter(Boolean).join(', ')} height={160} streetShown /></div>}
      <details className="mt-2">
        <summary className="text-[0.75rem] text-[#2F5D50] cursor-pointer">Pin it by hand instead</summary>
        <div className="flex flex-wrap gap-2 items-end mt-2">
          <input
            value={paste} onChange={(e) => setPaste(e.target.value)} aria-label="Point from a map app"
            placeholder="40.1234, -88.2583" className={`${field} flex-1 min-w-[12rem]`} style={serif}
          />
          <Btn onClick={usePoint} disabled={!paste.trim()}>Use this point</Btn>
        </div>
      </details>
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
      {streetLine && <p className="text-xs text-[#B85838] mt-2" role="alert">"{streetLine.label}" names this door's street. A nearby line never names the street; take it off or reword it.</p>}
      {said && <p className="text-xs text-[#2F5D50] mt-2" role="status">{said}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        <Btn
          tone="primary" disabled={busy || !area || Boolean(streetLine)}
          onClick={() => onSave({ area_lat: area.lat, area_lng: area.lng, nearby: lines.length ? lines : null }, `Area on the map${lines.length ? ` and ${lines.length} nearby line${lines.length === 1 ? '' : 's'}` : ''}`)}
        >Save the area</Btn>
        {saved && <Btn disabled={busy} onClick={() => onSave({ area_lat: null, area_lng: null, nearby: null }, 'Area on the map taken off')}>Take the map off</Btn>}
      </div>
    </div>
  );
}
