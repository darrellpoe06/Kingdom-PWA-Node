// Rentals + PropertyDetails + EQUIPMENT_CATEGORIES — extracted from
// monolith (r34) per MODULAR-EXTENSIBILITY.md. Largest single extraction
// of the refactor pass. Includes RentCast prefill connector wiring.
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MetricCell, SectionTitle } from './shared.jsx';
import { RentCastPrefill } from './connectors/RentCast.jsx';
import { findRelatedAuto } from '../poe-financial-mvp-v28.jsx';

// Local helpers (avoid main-monolith dep).
const fmt = (n) => n == null || !isFinite(n) ? '—' : `${n < 0 ? '-' : ''}$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtCompact = (n) => { if (n == null || !isFinite(n)) return '—'; const a = Math.abs(n); const sign = n < 0 ? '-' : ''; if (a >= 1000000000) return `${sign}$${(a/1000000000).toFixed(2)}B`; if (a >= 1000000) return `${sign}$${(a/1000000).toFixed(1)}M`; if (a >= 1000) return `${sign}$${Math.round(a/1000)}k`; return `${sign}$${Math.round(a)}`; };
const MONTHS_ABBR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function monthLabel(d, offset) { const x = new Date(d.getFullYear(), d.getMonth() + offset, 1); return `${MONTHS_ABBR[x.getMonth()]} '${String(x.getFullYear()).slice(2)}`; }
function yearsAndMonths(months) { const y = Math.floor(months / 12); const m = months % 12; if (y === 0) return `${m}mo`; if (m === 0) return `${y}yr`; return `${y}yr ${m}mo`; }

// projectRentalSnowball — duplicated locally (also lives in monolith for the App-level computation).
// Pure function, no shared state, safe to duplicate per MODULAR-EXTENSIBILITY allowance for utility-style pure code.
function projectRentalSnowball(rentals, monthlyExtra, sortOrder, currentDate, maxMonths = 240) {
  let active = rentals.map(r => ({ id: r.id, name: r.name, rent: r.rent, currentBalance: r.mortgage.balance, originalBalance: r.mortgage.balance, rate: r.mortgage.rate, monthlyPI: r.mortgage.monthlyPI, escrow: r.mortgage.escrow, clearedAtMonth: null, interestPaid: 0 }));
  function sortQueue(list) { return [...list].filter(r => r.currentBalance > 0).sort((a, b) => { if (sortOrder === 'smallest-balance') return a.currentBalance - b.currentBalance; if (sortOrder === 'highest-rate') return b.rate - a.rate; if (sortOrder === 'best-cashflow') return (b.rent - b.monthlyPI - b.escrow) - (a.rent - a.monthlyPI - a.escrow); return a.currentBalance - b.currentBalance; }); }
  const monthlyHistory = []; let freedFromSnowball = 0;
  for (let m = 1; m <= maxMonths; m++) {
    active.forEach(r => { if (r.currentBalance > 0) { const interest = r.currentBalance * (r.rate / 100 / 12); r.currentBalance += interest; r.interestPaid += interest; } });
    active.forEach(r => { if (r.currentBalance > 0) { const pay = Math.min(r.monthlyPI, r.currentBalance); r.currentBalance -= pay; if (r.currentBalance <= 0.01 && !r.clearedAtMonth) { r.clearedAtMonth = m; r.currentBalance = 0; freedFromSnowball += r.monthlyPI; } } });
    let pool = monthlyExtra + freedFromSnowball; let safety = 0;
    while (pool > 0.01 && safety < 50) { safety++; const queue = sortQueue(active); if (queue.length === 0) break; const target = queue[0]; const pay = Math.min(pool, target.currentBalance); target.currentBalance -= pay; pool -= pay; if (target.currentBalance <= 0.01) { target.clearedAtMonth = m; target.currentBalance = 0; freedFromSnowball += target.monthlyPI; } }
    const totalBalance = active.reduce((s, r) => s + Math.max(r.currentBalance, 0), 0);
    monthlyHistory.push({ monthOffset: m, label: monthLabel(currentDate, m), totalBalance: Math.round(totalBalance) });
    if (totalBalance <= 1) break;
  }
  return { monthlyHistory, allClearedMonth: monthlyHistory.length, allClearedYears: monthlyHistory.length / 12, allClearedDate: monthLabel(currentDate, monthlyHistory.length), activeProperties: active, totalInterest: Math.round(active.reduce((s, r) => s + r.interestPaid, 0)), finalFreedCashFlow: Math.round(freedFromSnowball) };
}

const EQUIPMENT_CATEGORIES = ['HVAC','Furnace','AC Unit','Water Heater','Refrigerator','Stove / Oven','Dishwasher','Washer','Dryer','Microwave','Garbage Disposal','Sump Pump','Roof','Electrical Panel','Garage Door','Other'];

// Static — hoisted out of Rentals() so its useMemo doesn't have to depend on it.
const RENTAL_STRATEGY_OPTIONS = [
  { id: 'smallest-balance', label: 'Smallest balance', sub: 'Momentum' },
  { id: 'highest-rate',     label: 'Highest rate',     sub: 'Math optimum' },
  { id: 'best-cashflow',    label: 'Best cash flow',   sub: 'Strong earners' },
];

// Pure data + pure function — duplicated locally to keep this module free of
// main-monolith deps (same pattern as projectRentalSnowball above, per
// MODULAR-EXTENSIBILITY.md's allowance for utility-style pure code).
const URGENCY_BANDS = [
  { key: 'change',   label: 'Change',   tagline: 'Broken now · same-day',  dueDays: 0, accent: '#B85838', symbol: '⚡', order: 1 },
  { key: 'incident', label: 'Incident', tagline: 'Resolve within 3 days',  dueDays: 3, accent: '#D97706', symbol: '!',  order: 2 },
  { key: 'project',  label: 'Project',  tagline: 'Multi-day planned work', dueDays: 14,accent: '#5A6E3D', symbol: '◆',  order: 3 },
];
const URGENCY_INDEX = Object.fromEntries(URGENCY_BANDS.map(u => [u.key, u]));
const dueDateFor = (urgencyKey, fromDate = new Date()) => {
  const days = URGENCY_INDEX[urgencyKey]?.dueDays ?? 3;
  const d = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const ROOM_PRESETS = ['Living Room','Kitchen','Dining Room','Bathroom','Master Bedroom','Bedroom 1','Bedroom 2','Bedroom 3','Garage','Basement','Attic','Laundry','Office','Outdoor'];
const ROOM_ITEM_PRESETS = ['Cabinets','Windows','Furnace','Plumbing — Toilet','Plumbing — Sink','Plumbing — Faucet','Plumbing — Bathtub','Plumbing — Shower','Flooring','Walls / Paint','Ceiling','Lighting','Outlets / Switches','Doors','Trim','Other'];
const ROOM_ITEM_STATUSES = [
  { key: 'good',       label: 'Good',           symbol: '✓' },
  { key: 'needs-work', label: 'Needs work',     symbol: '!' },
  { key: 'quoted',     label: 'Quoted',         symbol: '$' },
  { key: 'scheduled',  label: 'Scheduled',      symbol: '→' },
  { key: 'done',       label: 'Done',           symbol: '★' },
];

function PropertyDetails({ rental, updateRental, voiceOps = {} }) {
  // v28+ MVP v1.5 round 8 — Property valuation block (Zillow-style)
  // Characteristics + a market-value field + auto-built lookup links.
  // No paid API — links pre-fill each major site's search with the address,
  // user clicks, eyeballs the Zestimate, types it back into the manual field.
  // Estimated equity = market value − mortgage balance.
  const blankMarket = () => ({
    beds: rental.market?.beds || '',
    baths: rental.market?.baths || '',
    sqft: rental.market?.sqft || '',
    lotSize: rental.market?.lotSize || '',
    yearBuilt: rental.market?.yearBuilt || '',
    taxAssessedValue: rental.market?.taxAssessedValue || 0,
    marketValue: rental.market?.marketValue || rental.estimatedValue || 0,
    valueAsOf: rental.market?.valueAsOf || '',
    valueSource: rental.market?.valueSource || '', // Zillow / Realtor / Redfin / appraisal / county
  });
  const [marketForm, setMarketForm] = useState(blankMarket());
  const [editingMarket, setEditingMarket] = useState(false);
  const saveMarket = () => {
    updateRental(rental.id, {
      market: {
        ...marketForm,
        taxAssessedValue: parseFloat(marketForm.taxAssessedValue) || 0,
        marketValue: parseFloat(marketForm.marketValue) || 0,
      },
    });
    setEditingMarket(false);
  };
  // r26 fix — User report: Google-search fallback dumps users on a search results
  // page (ads + "people also ask" + 10 links) instead of the property's page.
  // New approach:
  //   - Zillow + Realtor.com: USE THEIR OWN URL CONVENTIONS for direct property
  //     pages. These land on the actual record ~80% of the time when the site
  //     has it indexed; the remaining 20% land on a tight Zillow/Realtor search
  //     that's still better UX than Google's ad page.
  //   - Redfin + Trulia: keep Google site-scoped fallback. Their direct URLs
  //     require internal IDs we can't construct without their (private) API.
  //   - County Records: keep Google "assessor parcel" search — each county
  //     uses a different system, no universal direct URL exists.
  const addressQuery = [rental.address, rental.city, rental.state, rental.zip].filter(Boolean).join(', ');
  const quoted = `"${addressQuery}"`;
  // Address slug for Zillow: lowercase, alphanumeric + dashes, all parts joined by dashes.
  // e.g., "1508 Holly Hill Dr, Champaign, IL 61821" -> "1508-holly-hill-dr-champaign-il-61821"
  const zillowSlug = [rental.address, rental.city, rental.state, rental.zip]
    .filter(Boolean).join(' ').toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  // Realtor uses underscores between address parts, dashes within each part.
  // e.g., "1508-Holly-Hill-Dr_Champaign_IL_61821"
  const slugifyPart = (s) => (s || '').trim().replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '-');
  const realtorSlug = [slugifyPart(rental.address), slugifyPart(rental.city), slugifyPart(rental.state), slugifyPart(rental.zip)]
    .filter(Boolean).join('_');
  const lookupLinks = addressQuery ? [
    { name: 'Zillow',        url: `https://www.zillow.com/homes/${zillowSlug}_rb/` },
    { name: 'Realtor.com',   url: `https://www.realtor.com/realestateandhomes-search/${realtorSlug}` },
    { name: 'Redfin',        url: `https://www.google.com/search?q=${encodeURIComponent(quoted + ' site:redfin.com')}` },
    { name: 'Trulia',        url: `https://www.google.com/search?q=${encodeURIComponent(quoted + ' site:trulia.com')}` },
    { name: 'County Records',url: `https://www.google.com/search?q=${encodeURIComponent(quoted + ' assessor parcel')}` },
  ] : [];
  // Round 10 fix — Two-step confirmation flow. Clicking a lookup link opens
  // the site in a new tab AND shows an inline ASK panel: "Save the value you
  // saw on [Site] as this property's market value?" The user types the number
  // they read and explicitly clicks "Save". Nothing changes until they confirm.
  // Skip closes the panel without touching the data.
  const [capturePrompt, setCapturePrompt] = useState(null); // { source, value, askPhase }
  const onLookupClick = (source) => {
    // Don't mutate any data on click — just open the prompt in ASK phase.
    setCapturePrompt({ source, value: '', askPhase: 'ask' });
  };
  const confirmSaveValue = () => {
    if (!capturePrompt || !capturePrompt.value) {
      alert('Enter the value you saw on the site, or tap Skip to close without saving.');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const newVal = parseFloat(capturePrompt.value) || 0;
    updateRental(rental.id, {
      market: {
        ...(rental.market || {}),
        marketValue: newVal,
        valueSource: capturePrompt.source,
        valueAsOf: today,
      },
    });
    setMarketForm(f => ({ ...f, marketValue: newVal, valueSource: capturePrompt.source, valueAsOf: today }));
    setCapturePrompt(null);
  };
  const skipCapture = () => setCapturePrompt(null);
  const currentMarketValue = parseFloat(rental.market?.marketValue) || 0;
  const mortgageBalance = parseFloat(rental.mortgage?.balance) || 0;
  const estimatedEquity = currentMarketValue > 0 ? currentMarketValue - mortgageBalance : null;

  // Lease + tenant — single edit form (collapsible).
  const blankLease = () => ({
    start: rental.lease?.start || '',
    end: rental.lease?.end || '',
    monthlyRent: rental.lease?.monthlyRent || rental.rent || 0,
    deposit: rental.lease?.deposit || 0,
    lateFeePolicy: rental.lease?.lateFeePolicy || '',
    signedDocURL: rental.lease?.signedDocURL || '',
  });
  const blankTenant = () => ({
    name: rental.tenant?.name || rental.tenantName || '',
    phone: rental.tenant?.phone || '',
    email: rental.tenant?.email || '',
    moveIn: rental.tenant?.moveIn || '',
    emergencyContactName: rental.tenant?.emergencyContactName || '',
    emergencyContactPhone: rental.tenant?.emergencyContactPhone || '',
  });
  const [leaseForm, setLeaseForm] = useState(blankLease());
  const [tenantForm, setTenantForm] = useState(blankTenant());
  const [editingLeaseTenant, setEditingLeaseTenant] = useState(false);

  const saveLeaseTenant = () => {
    updateRental(rental.id, {
      lease: {
        ...leaseForm,
        monthlyRent: parseFloat(leaseForm.monthlyRent) || 0,
        deposit: parseFloat(leaseForm.deposit) || 0,
      },
      tenant: { ...tenantForm },
      tenantName: tenantForm.name, // keep legacy field in sync so existing UI shows the name
    });
    setEditingLeaseTenant(false);
  };

  // Equipment list
  const blankEquip = () => ({ category: 'HVAC', make: '', model: '', serial: '', installDate: '', warrantyEnd: '', notes: '' });
  const [equipForm, setEquipForm] = useState(blankEquip());
  const [showEquipForm, setShowEquipForm] = useState(false);
  const addEquipment = () => {
    if (!equipForm.category) return;
    const entry = { ...equipForm, id: `eq-${Date.now()}` };
    updateRental(rental.id, { equipment: [...(rental.equipment || []), entry] });
    setEquipForm(blankEquip()); setShowEquipForm(false);
  };
  const deleteEquipment = (eqId) => {
    if (!confirm('Remove this piece of equipment? Warranty & serial data will be lost.')) return;
    updateRental(rental.id, { equipment: (rental.equipment || []).filter(e => e.id !== eqId) });
  };

  // Rooms & Needed Work
  const [roomName, setRoomName] = useState('');
  const [roomItem, setRoomItem] = useState({ roomId: '', name: '', status: 'needs-work', notes: '' });
  const [showRoomForm, setShowRoomForm] = useState(false);
  const addRoom = () => {
    const name = (roomName || '').trim();
    if (!name) return;
    const entry = { id: `rm-${Date.now()}`, name, items: [] };
    updateRental(rental.id, { rooms: [...(rental.rooms || []), entry] });
    setRoomName('');
  };
  const deleteRoom = (rmId) => {
    if (!confirm('Delete this room and all of its items?')) return;
    updateRental(rental.id, { rooms: (rental.rooms || []).filter(r => r.id !== rmId) });
  };
  const addRoomItem = () => {
    if (!roomItem.roomId || !roomItem.name) return;
    const rooms = (rental.rooms || []).map(rm => rm.id === roomItem.roomId
      ? { ...rm, items: [...(rm.items || []), { id: `it-${Date.now()}`, name: roomItem.name, status: roomItem.status, notes: roomItem.notes }] }
      : rm);
    updateRental(rental.id, { rooms });
    setRoomItem({ roomId: roomItem.roomId, name: '', status: 'needs-work', notes: '' });
    setShowRoomForm(false);
  };
  const updateRoomItemStatus = (rmId, itId, status) => {
    const rooms = (rental.rooms || []).map(rm => rm.id === rmId
      ? { ...rm, items: (rm.items || []).map(it => it.id === itId ? { ...it, status } : it) }
      : rm);
    updateRental(rental.id, { rooms });
  };
  const deleteRoomItem = (rmId, itId) => {
    const rooms = (rental.rooms || []).map(rm => rm.id === rmId
      ? { ...rm, items: (rm.items || []).filter(it => it.id !== itId) }
      : rm);
    updateRental(rental.id, { rooms });
  };

  const fieldCls = 'w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]';
  const labelCls = 'text-[9px] uppercase tracking-wider text-[#5A5751]';

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">🏠 Property Details</div>

      {/* MARKET VALUATION — round 8 */}
      <details className="bg-white border border-[#E8E4DC] p-3 mb-2" open>
        <summary className="cursor-pointer text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
          🏘 Market Valuation &amp; Property Info
          {currentMarketValue > 0 && (
            <span className="ml-2 text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              · est value {fmt(currentMarketValue)}
              {estimatedEquity != null && <> · equity {fmt(estimatedEquity)}</>}
            </span>
          )}
        </summary>
        <div className="mt-3 space-y-3">
          {/* Lookup links — auto-built from this property's address */}
          {addressQuery ? (
            <div>
              <div className={labelCls + ' mb-1.5'}>Look up market value (opens in new tab → asks to save)</div>
              {/* r27 — Auto-fill via RentCast BYOK. Each customer brings their
                  own free RentCast key (50 calls/mo per key, no credit card).
                  PoeTech central pays nothing. When the customer hits their
                  50/mo cap, this falls back gracefully to the manual links
                  below. Per MODULAR-EXTENSIBILITY.md + IDENTITY-ROLES-AUDIT
                  + the founder's "no paid tier" direction (r27). */}
              <div className="mb-2">
                <RentCastPrefill
                  rental={rental}
                  apiUrl={voiceOps.apiUrl || ''}
                  apiToken={voiceOps.apiToken || ''}
                  onConfirm={(updates) => {
                    const today = new Date().toISOString().slice(0, 10);
                    setMarketForm(f => ({ ...f, marketValue: updates.marketValue, valueSource: 'rentcast', valueAsOf: today }));
                    updateRental(rental.id, {
                      market: { ...(rental.market || {}), ...updates, valueAsOf: today },
                    });
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-1">
                {lookupLinks.map(l => (
                  <a
                    key={l.name}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => onLookupClick(l.name)}
                    className="text-[10px] uppercase tracking-wider px-2 py-1.5 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                  >{l.name} ↗</a>
                ))}
              </div>
              <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>
                Tap a link to open the property on that site via Google search (always finds the right address, even when site URLs change). When you come back, we'll ask if you want to save the value you saw — your call, nothing auto-stamps.
              </p>

              {/* Round 10 — Capture prompt. Opens after clicking any lookup link.
                  Asks explicitly whether to save the value the user saw. Nothing
                  in the data changes until they confirm. Skip closes without
                  touching anything. */}
              {capturePrompt && (
                <div className="mt-2 p-3 bg-[#FAF8F4] border-2 border-[#B85838]">
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">Save the value you saw on {capturePrompt.source}?</div>
                  <p className="text-xs text-[#5A5751] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
                    If {capturePrompt.source} shows a value for this property, type it here. We'll save it as the current market value and stamp <strong>{capturePrompt.source}</strong> as the source with today's date. Skip if you don't want to change anything.
                  </p>
                  <div className="flex items-end gap-2 flex-wrap">
                    <div className="flex-1 min-w-[140px]">
                      <label htmlFor={`cap-val-${rental.id}`} className={labelCls}>Value from {capturePrompt.source}</label>
                      <input
                        id={`cap-val-${rental.id}`}
                        type="number"
                        min="0"
                        step="100"
                        inputMode="decimal"
                        autoFocus
                        placeholder="e.g., 145000"
                        value={capturePrompt.value}
                        onChange={e => setCapturePrompt({ ...capturePrompt, value: e.target.value })}
                        className="w-full p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]"
                      />
                    </div>
                    <button type="button" onClick={confirmSaveValue} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✓ Yes, save it</button>
                    <button type="button" onClick={skipCapture} className="border border-[#1A1815] px-4 py-2 text-xs uppercase tracking-wider hover:bg-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Skip</button>
                  </div>
                  {currentMarketValue > 0 && (
                    <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                      Current saved value: {fmt(currentMarketValue)}{rental.market?.valueAsOf ? ` (as of ${rental.market.valueAsOf}${rental.market?.valueSource ? ` · ${rental.market.valueSource}` : ''})` : ''}. Confirming overwrites it.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>Add a street address to this property (Edit → Address) to enable Zillow / Realtor / Redfin lookup links.</p>
          )}

          {/* Display vs edit toggle */}
          {!editingMarket ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
              <div><div className={labelCls}>Beds</div><div>{rental.market?.beds || '—'}</div></div>
              <div><div className={labelCls}>Baths</div><div>{rental.market?.baths || '—'}</div></div>
              <div><div className={labelCls}>Sqft</div><div>{rental.market?.sqft ? Number(rental.market.sqft).toLocaleString() : '—'}</div></div>
              <div><div className={labelCls}>Lot</div><div>{rental.market?.lotSize || '—'}</div></div>
              <div><div className={labelCls}>Year built</div><div>{rental.market?.yearBuilt || '—'}</div></div>
              <div><div className={labelCls}>Tax-assessed</div><div style={{ fontFamily: '"JetBrains Mono", monospace' }}>{rental.market?.taxAssessedValue ? fmt(rental.market.taxAssessedValue) : '—'}</div></div>
              <div>
                <div className={labelCls}>Market value</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{currentMarketValue > 0 ? fmt(currentMarketValue) : '—'}</div>
                <div className="text-[9px] text-[#5A5751]">{rental.market?.valueAsOf ? `as of ${rental.market.valueAsOf}` : 'not set'}{rental.market?.valueSource ? ` · ${rental.market.valueSource}` : ''}</div>
              </div>
              <div>
                <div className={labelCls}>Estimated equity</div>
                <div className={`${estimatedEquity != null && estimatedEquity < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 600 }}>{estimatedEquity != null ? fmt(estimatedEquity) : '—'}</div>
                <div className="text-[9px] text-[#5A5751]">value − mortgage</div>
              </div>
              <div className="col-span-2 sm:col-span-4">
                <button type="button" onClick={() => { setMarketForm(blankMarket()); setEditingMarket(true); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">✎ Edit valuation &amp; characteristics</button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div><label htmlFor={`mk-beds-${rental.id}`} className={labelCls}>Beds</label><input id={`mk-beds-${rental.id}`} type="number" min="0" step="1" className={fieldCls} value={marketForm.beds} onChange={e => setMarketForm({ ...marketForm, beds: e.target.value })} /></div>
                <div><label htmlFor={`mk-baths-${rental.id}`} className={labelCls}>Baths</label><input id={`mk-baths-${rental.id}`} type="number" min="0" step="0.5" className={fieldCls} value={marketForm.baths} onChange={e => setMarketForm({ ...marketForm, baths: e.target.value })} /></div>
                <div><label htmlFor={`mk-sqft-${rental.id}`} className={labelCls}>Sqft</label><input id={`mk-sqft-${rental.id}`} type="number" min="0" step="10" className={fieldCls} value={marketForm.sqft} onChange={e => setMarketForm({ ...marketForm, sqft: e.target.value })} /></div>
                <div><label htmlFor={`mk-lot-${rental.id}`} className={labelCls}>Lot size</label><input id={`mk-lot-${rental.id}`} className={fieldCls} placeholder="e.g., 0.25 ac · 7,800 sqft" value={marketForm.lotSize} onChange={e => setMarketForm({ ...marketForm, lotSize: e.target.value })} /></div>
                <div><label htmlFor={`mk-year-${rental.id}`} className={labelCls}>Year built</label><input id={`mk-year-${rental.id}`} type="number" min="1800" max="2099" step="1" className={fieldCls} value={marketForm.yearBuilt} onChange={e => setMarketForm({ ...marketForm, yearBuilt: e.target.value })} /></div>
                <div><label htmlFor={`mk-tax-${rental.id}`} className={labelCls}>Tax-assessed value</label><input id={`mk-tax-${rental.id}`} type="number" min="0" step="100" inputMode="decimal" className={fieldCls} value={marketForm.taxAssessedValue} onChange={e => setMarketForm({ ...marketForm, taxAssessedValue: e.target.value })} /></div>
                <div><label htmlFor={`mk-val-${rental.id}`} className={labelCls}>Market value (manual)</label><input id={`mk-val-${rental.id}`} type="number" min="0" step="100" inputMode="decimal" className={fieldCls} value={marketForm.marketValue} onChange={e => setMarketForm({ ...marketForm, marketValue: e.target.value })} /></div>
                <div><label htmlFor={`mk-asof-${rental.id}`} className={labelCls}>Value as of</label><input id={`mk-asof-${rental.id}`} type="date" className={fieldCls} value={marketForm.valueAsOf} onChange={e => setMarketForm({ ...marketForm, valueAsOf: e.target.value })} /></div>
                <div className="col-span-2 sm:col-span-2"><label htmlFor={`mk-src-${rental.id}`} className={labelCls}>Source (where the number came from)</label><input id={`mk-src-${rental.id}`} className={fieldCls} placeholder="e.g., Zillow Zestimate · Redfin · 2024 appraisal · county records" value={marketForm.valueSource} onChange={e => setMarketForm({ ...marketForm, valueSource: e.target.value })} /></div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={saveMarket} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save</button>
                <button type="button" onClick={() => setEditingMarket(false)} className="bg-white border border-[#1A1815] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
              </div>
            </div>
          )}
        </div>
      </details>

      {/* LEASE + TENANT */}
      <details className="bg-white border border-[#E8E4DC] p-3 mb-2">
        <summary className="cursor-pointer text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
          Lease &amp; Tenant Contact
          {rental.lease?.end && <span className="ml-2 text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>· lease ends {rental.lease.end}</span>}
        </summary>
        {!editingLeaseTenant ? (
          <div className="mt-3 space-y-2 text-xs" style={{ fontFamily: '"Fraunces", serif' }}>
            {!rental.lease && !rental.tenant ? (
              <p className="text-[#5A5751] italic">No lease or tenant info saved yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div><span className="text-[#5A5751]">Lease term:</span> {rental.lease?.start || '—'} → {rental.lease?.end || '—'}</div>
                <div><span className="text-[#5A5751]">Monthly rent (lease):</span> {rental.lease?.monthlyRent ? fmt(rental.lease.monthlyRent) : '—'}</div>
                <div><span className="text-[#5A5751]">Deposit:</span> {rental.lease?.deposit ? fmt(rental.lease.deposit) : '—'}</div>
                <div><span className="text-[#5A5751]">Late-fee policy:</span> {rental.lease?.lateFeePolicy || '—'}</div>
                {rental.lease?.signedDocURL && <div className="sm:col-span-2"><span className="text-[#5A5751]">Signed lease:</span> <a href={rental.lease.signedDocURL} target="_blank" rel="noopener noreferrer" className="underline text-[#B85838]">open</a></div>}
                <div><span className="text-[#5A5751]">Tenant:</span> {rental.tenant?.name || '—'}</div>
                <div><span className="text-[#5A5751]">Move-in:</span> {rental.tenant?.moveIn || '—'}</div>
                <div><span className="text-[#5A5751]">Phone:</span> {rental.tenant?.phone ? <a href={`tel:${rental.tenant.phone}`} className="underline text-[#B85838]">{rental.tenant.phone}</a> : '—'}</div>
                <div><span className="text-[#5A5751]">Email:</span> {rental.tenant?.email ? <a href={`mailto:${rental.tenant.email}`} className="underline text-[#B85838]">{rental.tenant.email}</a> : '—'}</div>
                <div><span className="text-[#5A5751]">Emergency contact:</span> {rental.tenant?.emergencyContactName || '—'}{rental.tenant?.emergencyContactPhone ? ` · ${rental.tenant.emergencyContactPhone}` : ''}</div>
              </div>
            )}
            <button type="button" onClick={() => { setLeaseForm(blankLease()); setTenantForm(blankTenant()); setEditingLeaseTenant(true); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] mt-1">Edit lease &amp; tenant</button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] font-semibold">Lease</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div><label htmlFor={`ls-start-${rental.id}`} className={labelCls}>Lease start</label><input id={`ls-start-${rental.id}`} type="date" className={fieldCls} value={leaseForm.start} onChange={e => setLeaseForm({ ...leaseForm, start: e.target.value })} /></div>
              <div><label htmlFor={`ls-end-${rental.id}`} className={labelCls}>Lease end</label><input id={`ls-end-${rental.id}`} type="date" className={fieldCls} value={leaseForm.end} onChange={e => setLeaseForm({ ...leaseForm, end: e.target.value })} /></div>
              <div><label htmlFor={`ls-rent-${rental.id}`} className={labelCls}>Monthly rent</label><input id={`ls-rent-${rental.id}`} type="number" step="0.01" min="0" className={fieldCls} value={leaseForm.monthlyRent} onChange={e => setLeaseForm({ ...leaseForm, monthlyRent: e.target.value })} /></div>
              <div><label htmlFor={`ls-dep-${rental.id}`} className={labelCls}>Deposit held</label><input id={`ls-dep-${rental.id}`} type="number" step="0.01" min="0" className={fieldCls} value={leaseForm.deposit} onChange={e => setLeaseForm({ ...leaseForm, deposit: e.target.value })} /></div>
              <div className="sm:col-span-2"><label htmlFor={`ls-late-${rental.id}`} className={labelCls}>Late-fee policy</label><input id={`ls-late-${rental.id}`} className={fieldCls} placeholder="e.g., $50 after the 5th, then $10/day" value={leaseForm.lateFeePolicy} onChange={e => setLeaseForm({ ...leaseForm, lateFeePolicy: e.target.value })} /></div>
              <div className="sm:col-span-3"><label htmlFor={`ls-url-${rental.id}`} className={labelCls}>Signed-lease URL (Google Drive, Dropbox, etc.)</label><input id={`ls-url-${rental.id}`} type="url" className={fieldCls} placeholder="https://..." value={leaseForm.signedDocURL} onChange={e => setLeaseForm({ ...leaseForm, signedDocURL: e.target.value })} /></div>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#5A5751] font-semibold mt-2">Tenant</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div><label htmlFor={`tn-name-${rental.id}`} className={labelCls}>Name</label><input id={`tn-name-${rental.id}`} className={fieldCls} value={tenantForm.name} onChange={e => setTenantForm({ ...tenantForm, name: e.target.value })} /></div>
              <div><label htmlFor={`tn-phone-${rental.id}`} className={labelCls}>Phone</label><input id={`tn-phone-${rental.id}`} type="tel" className={fieldCls} placeholder="(217) 555-0100" value={tenantForm.phone} onChange={e => setTenantForm({ ...tenantForm, phone: e.target.value })} /></div>
              <div><label htmlFor={`tn-email-${rental.id}`} className={labelCls}>Email</label><input id={`tn-email-${rental.id}`} type="email" className={fieldCls} value={tenantForm.email} onChange={e => setTenantForm({ ...tenantForm, email: e.target.value })} /></div>
              <div><label htmlFor={`tn-movein-${rental.id}`} className={labelCls}>Move-in date</label><input id={`tn-movein-${rental.id}`} type="date" className={fieldCls} value={tenantForm.moveIn} onChange={e => setTenantForm({ ...tenantForm, moveIn: e.target.value })} /></div>
              <div><label htmlFor={`tn-ec-name-${rental.id}`} className={labelCls}>Emergency contact</label><input id={`tn-ec-name-${rental.id}`} className={fieldCls} value={tenantForm.emergencyContactName} onChange={e => setTenantForm({ ...tenantForm, emergencyContactName: e.target.value })} /></div>
              <div><label htmlFor={`tn-ec-phone-${rental.id}`} className={labelCls}>Emergency phone</label><input id={`tn-ec-phone-${rental.id}`} type="tel" className={fieldCls} value={tenantForm.emergencyContactPhone} onChange={e => setTenantForm({ ...tenantForm, emergencyContactPhone: e.target.value })} /></div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={saveLeaseTenant} className="bg-[#1A1815] text-white py-2 px-4 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save</button>
              <button type="button" onClick={() => setEditingLeaseTenant(false)} className="bg-white border border-[#1A1815] py-2 px-4 text-xs uppercase tracking-wider hover:bg-[#FAF8F4]">Cancel</button>
            </div>
          </div>
        )}
      </details>

      {/* EQUIPMENT */}
      <details className="bg-white border border-[#E8E4DC] p-3 mb-2">
        <summary className="cursor-pointer text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
          Mechanical &amp; Equipment <span className="text-[10px] text-[#5A5751] ml-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {(rental.equipment || []).length}</span>
        </summary>
        <div className="mt-3 space-y-2">
          <button type="button" onClick={() => { setShowEquipForm(!showEquipForm); setEquipForm(blankEquip()); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showEquipForm ? '× Cancel' : '+ Add equipment'}</button>
          {showEquipForm && (
            <div className="bg-[#FAF8F4] border border-[#B85838] p-3 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <div><label htmlFor={`eq-cat-${rental.id}`} className={labelCls}>Category</label><select id={`eq-cat-${rental.id}`} className={fieldCls} value={equipForm.category} onChange={e => setEquipForm({ ...equipForm, category: e.target.value })}>{EQUIPMENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div><label htmlFor={`eq-make-${rental.id}`} className={labelCls}>Make</label><input id={`eq-make-${rental.id}`} className={fieldCls} value={equipForm.make} onChange={e => setEquipForm({ ...equipForm, make: e.target.value })} /></div>
                <div><label htmlFor={`eq-model-${rental.id}`} className={labelCls}>Model</label><input id={`eq-model-${rental.id}`} className={fieldCls} value={equipForm.model} onChange={e => setEquipForm({ ...equipForm, model: e.target.value })} /></div>
                <div><label htmlFor={`eq-serial-${rental.id}`} className={labelCls}>Serial</label><input id={`eq-serial-${rental.id}`} className={fieldCls} value={equipForm.serial} onChange={e => setEquipForm({ ...equipForm, serial: e.target.value })} /></div>
                <div><label htmlFor={`eq-install-${rental.id}`} className={labelCls}>Installed</label><input id={`eq-install-${rental.id}`} type="date" className={fieldCls} value={equipForm.installDate} onChange={e => setEquipForm({ ...equipForm, installDate: e.target.value })} /></div>
                <div><label htmlFor={`eq-warr-${rental.id}`} className={labelCls}>Warranty end</label><input id={`eq-warr-${rental.id}`} type="date" className={fieldCls} value={equipForm.warrantyEnd} onChange={e => setEquipForm({ ...equipForm, warrantyEnd: e.target.value })} /></div>
              </div>
              <textarea className={fieldCls} rows="2" placeholder="Notes — manual link, last service date, quirks" value={equipForm.notes} onChange={e => setEquipForm({ ...equipForm, notes: e.target.value })} />
              <button type="button" onClick={addEquipment} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Equipment</button>
            </div>
          )}
          {(rental.equipment || []).length === 0 ? (
            <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No equipment recorded yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[9px] uppercase tracking-wider text-[#5A5751] border-b border-[#E8E4DC]">
                  <th scope="col" className="py-1 pr-2">Category</th>
                  <th scope="col" className="py-1 pr-2">Make / Model</th>
                  <th scope="col" className="py-1 pr-2">Serial</th>
                  <th scope="col" className="py-1 pr-2">Warranty</th>
                  <th scope="col" className="py-1"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {(rental.equipment || []).map(eq => (
                  <tr key={eq.id} className="border-b border-[#E8E4DC]" style={{ fontFamily: '"Fraunces", serif' }}>
                    <td className="py-1 pr-2">{eq.category}</td>
                    <td className="py-1 pr-2">{[eq.make, eq.model].filter(Boolean).join(' ') || '—'}</td>
                    <td className="py-1 pr-2" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{eq.serial || '—'}</td>
                    <td className="py-1 pr-2" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{eq.warrantyEnd || '—'}</td>
                    <td className="py-1 text-right"><button type="button" onClick={() => deleteEquipment(eq.id)} aria-label={`Delete ${eq.category} — ${eq.make || ''} ${eq.model || ''}`.trim()} className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </details>

      {/* ROOMS & NEEDED WORK */}
      <details className="bg-white border border-[#E8E4DC] p-3">
        <summary className="cursor-pointer text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>
          Rooms &amp; Needed Work <span className="text-[10px] text-[#5A5751] ml-1" style={{ fontFamily: '"JetBrains Mono", monospace' }}>· {(rental.rooms || []).length} rooms · {((rental.rooms || []).reduce((s, rm) => s + (rm.items || []).length, 0))} items</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[140px]">
              <label htmlFor={`rm-name-${rental.id}`} className={labelCls}>Add room</label>
              <input id={`rm-name-${rental.id}`} list={`rm-presets-${rental.id}`} className={fieldCls} placeholder="e.g., Kitchen" value={roomName} onChange={e => setRoomName(e.target.value)} />
              <datalist id={`rm-presets-${rental.id}`}>
                {ROOM_PRESETS.map(p => <option key={p} value={p} />)}
              </datalist>
            </div>
            <button type="button" onClick={addRoom} className="bg-[#1A1815] text-white py-2 px-3 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">+ Room</button>
          </div>
          {(rental.rooms || []).length === 0 ? (
            <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No rooms yet. Add a room above to start tracking needed work.</p>
          ) : (
            (rental.rooms || []).map(rm => (
              <div key={rm.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-2">
                {/* Primary action (+ Item) sits left-of-center; destructive (× Room)
                    is pushed right with a divider + larger tap target to prevent
                    accidental destructive taps next to the create action. */}
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="text-xs font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>{rm.name}</div>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => { setRoomItem({ roomId: rm.id, name: '', status: 'needs-work', notes: '' }); setShowRoomForm(true); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] px-3 py-2 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">+ Item</button>
                    <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] mx-1" />
                    <button type="button" onClick={() => deleteRoom(rm.id)} aria-label={`Delete room ${rm.name}`} className="text-[10px] uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-white px-3 py-2 min-h-[36px] border border-transparent hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">× Room</button>
                  </div>
                </div>
                {showRoomForm && roomItem.roomId === rm.id && (
                  <div className="bg-white border border-[#B85838] p-2 mb-2 space-y-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div><label htmlFor={`it-name-${rm.id}`} className={labelCls}>Item</label><input id={`it-name-${rm.id}`} list={`it-presets-${rm.id}`} className={fieldCls} placeholder="e.g., Plumbing — Sink" value={roomItem.name} onChange={e => setRoomItem({ ...roomItem, name: e.target.value })} /><datalist id={`it-presets-${rm.id}`}>{ROOM_ITEM_PRESETS.map(p => <option key={p} value={p} />)}</datalist></div>
                      <div><label htmlFor={`it-status-${rm.id}`} className={labelCls}>Status</label><select id={`it-status-${rm.id}`} className={fieldCls} value={roomItem.status} onChange={e => setRoomItem({ ...roomItem, status: e.target.value })}>{ROOM_ITEM_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
                      <div><label htmlFor={`it-notes-${rm.id}`} className={labelCls}>Notes (optional)</label><input id={`it-notes-${rm.id}`} className={fieldCls} value={roomItem.notes} onChange={e => setRoomItem({ ...roomItem, notes: e.target.value })} /></div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="button" onClick={addRoomItem} className="bg-[#1A1815] text-white py-1.5 px-3 text-[10px] uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Item</button>
                      <button type="button" onClick={() => setShowRoomForm(false)} className="bg-white border border-[#1A1815] py-1.5 px-3 text-[10px] uppercase tracking-wider hover:bg-[#FAF8F4]">Cancel</button>
                    </div>
                  </div>
                )}
                {(rm.items || []).length === 0 ? (
                  <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No items yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {(rm.items || []).map(it => {
                      const stat = ROOM_ITEM_STATUSES.find(s => s.key === it.status) || ROOM_ITEM_STATUSES[1];
                      return (
                        <li key={it.id} className="flex items-center gap-2 text-xs py-1" style={{ fontFamily: '"Fraunces", serif' }}>
                          <span aria-hidden="true" className="inline-block w-5 text-center font-bold" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{stat.symbol}</span>
                          <span className="flex-1 min-w-0">{it.name}{it.notes ? <span className="text-[#5A5751] italic"> — {it.notes}</span> : ''}</span>
                          <label className="sr-only" htmlFor={`it-sel-${it.id}`}>Status for {it.name}</label>
                          <select id={`it-sel-${it.id}`} className="text-xs border border-[#E8E4DC] bg-white px-2 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" value={it.status} onChange={e => updateRoomItemStatus(rm.id, it.id, e.target.value)}>{ROOM_ITEM_STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}</select>
                          <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] mx-1" />
                          <button type="button" onClick={() => { if (confirm(`Delete item "${it.name}"?`)) deleteRoomItem(rm.id, it.id); }} aria-label={`Delete ${it.name}`} className="text-xs text-[#5A5751] hover:text-[#B85838] hover:bg-white border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ))
          )}
        </div>
      </details>
    </div>
  );
}

function Rentals({ rentals, entities, totals, snowballSort, setSnowballSort, snowballExtra, setSnowballExtra, rentalSnowball, sevenYearTarget, currentDate, addRental, updateRental, deleteRental, readOnly = false, incidents = [], addIncident, resolveIncident, voiceOps = {} }) {
  // Round 10 — Tenant-late affordance helpers. Given a rental, find the open
  // incident already pointed at it (if any) so we don't double-track.
  const openIncidentFor = (r) => incidents.find(i => i.status !== 'resolved' && i.linkedTo?.type === 'rental' && i.linkedTo?.id === r.id);
  // CONNECTED-CONTEXT task #88 — per-rental selection of auto-link chip choices
  // before the user clicks an urgency button. Keyed by rental.id so multiple
  // late-rent prompts don't share state.
  const [tenantLateSelectedLinks, setTenantLateSelectedLinks] = useState({});
  const toggleTenantLink = (rentalId, link) => {
    setTenantLateSelectedLinks(prev => {
      const cur = prev[rentalId] || [];
      const next = cur.some(l => l.toEntityId === link.toEntityId)
        ? cur.filter(l => l.toEntityId !== link.toEntityId)
        : [...cur, link];
      return { ...prev, [rentalId]: next };
    });
  };
  const incidentDisplay = (id) => {
    const inc = (incidents || []).find(i => i.id === id);
    if (!inc) return id;
    const short = (inc.description || 'incident').slice(0, 40);
    return inc.date ? `${short} · ${inc.date}` : short;
  };
  const openTenantIssue = (r, urgencyKey) => {
    if (!addIncident) return;
    const band = URGENCY_INDEX[urgencyKey] || URGENCY_INDEX.incident;
    const links = tenantLateSelectedLinks[r.id] || [];
    addIncident({
      date: new Date().toISOString().slice(0, 10),
      amount: Math.max(0, (r.rent || 0) - (r.actual || 0)),
      category: 'tenant',
      entityId: r.entityId || 'e-poeprops',
      description: `Tenant at ${r.name} behind on rent (${fmt((r.rent || 0) - (r.actual || 0))} short)`,
      urgency: urgencyKey,
      status: 'open',
      dueDate: dueDateFor(urgencyKey),
      linkedTo: { type: 'rental', id: r.id },
      links,
    });
    setTenantLateSelectedLinks(prev => { const n = { ...prev }; delete n[r.id]; return n; });
    alert(`Opened as ${band.label}. Due ${dueDateFor(urgencyKey)}. Track from Big Picture → Action Queue.`);
  };
  const rentalsWithCleared = rentals.map(r => { const cleared = rentalSnowball.activeProperties.find(p => p.id === r.id); return { ...r, clearedAtMonth: cleared?.clearedAtMonth }; });
  const orderedByPayoff = rentalsWithCleared.filter(r => r.clearedAtMonth).sort((a, b) => a.clearedAtMonth - b.clearedAtMonth);
  const sevenYrFeasible = rentalSnowball.allClearedYears <= 7;
  const gapMonthly = sevenYearTarget - snowballExtra;
  // v28+ Rentals expansion: add/edit property + autocomplete + map + evaluator
  const [showPropForm, setShowPropForm] = useState(false);
  const [editingPropId, setEditingPropId] = useState(null);
  const blankProp = () => ({ name: '', address: '', city: '', state: '', zip: '', tenantName: '', lat: null, lon: null, propertyType: 'single-family', rent: 0, status: 'paying', entityId: 'e-poeprops', purchasePrice: 0, purchaseDate: '', estimatedValue: 0, mortgageBalance: 0, mortgageRate: 6.5, monthlyPI: 0, escrow: 0, notes: '' });
  const [propForm, setPropForm] = useState(blankProp());
  const [suggestions, setSuggestions] = useState([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const suggestTimer = useRef(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Nominatim autocomplete - debounced 400ms, US-only, max 5 suggestions
  const fetchSuggestions = (q) => {
    clearTimeout(suggestTimer.current);
    if (!q || q.length < 3) { setSuggestions([]); return; }
    suggestTimer.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&countrycodes=us&limit=5`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const json = await res.json();
        setSuggestions(Array.isArray(json) ? json : []);
      } catch (e) {
        console.warn('Nominatim error', e);
        setSuggestions([]);
      }
      setSuggestLoading(false);
    }, 400);
  };

  const pickSuggestion = (s) => {
    const a = s.address || {};
    const street = [a.house_number, a.road].filter(Boolean).join(' ');
    setPropForm(f => ({
      ...f,
      address: street || s.display_name.split(',')[0],
      city: a.city || a.town || a.village || a.hamlet || '',
      state: a.state || '',
      zip: a.postcode || '',
      lat: parseFloat(s.lat),
      lon: parseFloat(s.lon),
    }));
    setSuggestions([]);
  };

  // Leaflet map - lazy init when CDN loaded, refresh markers on rentals change
  useEffect(() => {
    if (typeof window === 'undefined' || !window.L || !mapRef.current) return;
    if (!mapInstanceRef.current) {
      const map = window.L.map(mapRef.current, { scrollWheelZoom: false }).setView([40.1164, -88.2434], 12);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap contributors', maxZoom: 19 }).addTo(map);
      mapInstanceRef.current = map;
    }
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    const withCoords = rentals.filter(r => typeof r.lat === 'number' && typeof r.lon === 'number');
    withCoords.forEach(r => {
      const marker = window.L.marker([r.lat, r.lon]).addTo(mapInstanceRef.current);
      marker.bindPopup(`<strong>${r.name}</strong><br/>${r.address || ''}${r.city ? ', ' + r.city : ''}<br/>Rent: $${r.rent}/mo · ${r.status}<br/>${r.mortgage?.balance ? 'Mortgage: $' + r.mortgage.balance.toLocaleString() : 'Paid off'}`);
      markersRef.current.push(marker);
    });
    if (withCoords.length > 0) {
      try { mapInstanceRef.current.fitBounds(window.L.featureGroup(markersRef.current).getBounds().pad(0.2)); } catch (e) {}
    }
  }, [rentals]);

  // Clean up map on unmount
  useEffect(() => () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } }, []);

  // Auto-evaluator - runs continuously off form inputs
  const evaluator = useMemo(() => {
    const price = parseFloat(propForm.purchasePrice) || 0;
    const rent = parseFloat(propForm.rent) || 0;
    const escrow = parseFloat(propForm.escrow) || 0;
    const monthlyPI = parseFloat(propForm.monthlyPI) || 0;
    const annualRent = rent * 12;
    const opex = (escrow * 12) + (annualRent * 0.10); // 10% maintenance/vacancy buffer
    const noi = annualRent - opex;
    const annualDS = monthlyPI * 12;
    const annualCF = noi - annualDS;
    const downPayment = price * 0.20; // assume 20% down
    return {
      annualRent, opex, noi, annualDS, annualCF, downPayment,
      capRate: price > 0 ? (noi / price) * 100 : 0,
      cashOnCash: downPayment > 0 ? (annualCF / downPayment) * 100 : 0,
      onePct: price > 0 ? (rent / price) * 100 : 0,
      grm: annualRent > 0 ? price / annualRent : 0,
      dscr: annualDS > 0 ? noi / annualDS : 0,
    };
  }, [propForm.purchasePrice, propForm.rent, propForm.escrow, propForm.monthlyPI]);

  // Round 7 fix: Edit no longer scrolls to top. The form renders inline under
  // the row being edited (drop-down style) — see renderPropertyRow's
  // {editingPropId === r.id && renderPropertyForm()} block below. Only "Add new"
  // uses the top form.
  const startAddProp = () => { setPropForm(blankProp()); setEditingPropId(null); setShowPropForm(true); setSuggestions([]); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {} };
  const startEditProp = (r) => {
    setPropForm({
      name: r.name || '', address: r.address || '', city: r.city || '', state: r.state || '', zip: r.zip || '',
      tenantName: r.tenantName || '',
      lat: r.lat ?? null, lon: r.lon ?? null,
      propertyType: r.propertyType || 'single-family',
      rent: r.rent || 0, status: r.status || 'paying', entityId: r.entityId || 'e-poeprops',
      purchasePrice: r.purchasePrice || 0, purchaseDate: r.purchaseDate || '', estimatedValue: r.estimatedValue || 0,
      mortgageBalance: r.mortgage?.balance || 0, mortgageRate: r.mortgage?.rate || 6.5,
      monthlyPI: r.mortgage?.monthlyPI || 0, escrow: r.mortgage?.escrow || 0,
      notes: r.notes || '',
    });
    setEditingPropId(r.id); setShowPropForm(false); setSuggestions([]);
    // NO scroll — inline form opens right under the row, eyes stay where you tapped.
  };
  const cancelPropForm = () => { setShowPropForm(false); setEditingPropId(null); setSuggestions([]); };

  const submitProp = () => {
    if (!propForm.name || !propForm.address) { alert('Property name and address are required.'); return; }
    const payload = {
      name: propForm.name,
      address: propForm.address, city: propForm.city, state: propForm.state, zip: propForm.zip,
      tenantName: propForm.tenantName,
      lat: propForm.lat, lon: propForm.lon,
      propertyType: propForm.propertyType,
      rent: parseFloat(propForm.rent) || 0,
      actual: parseFloat(propForm.rent) || 0,
      status: propForm.status,
      entityId: propForm.entityId,
      purchasePrice: parseFloat(propForm.purchasePrice) || 0,
      purchaseDate: propForm.purchaseDate,
      estimatedValue: parseFloat(propForm.estimatedValue) || 0,
      mortgage: {
        balance: parseFloat(propForm.mortgageBalance) || 0,
        rate: parseFloat(propForm.mortgageRate) || 0,
        monthlyPI: parseFloat(propForm.monthlyPI) || 0,
        escrow: parseFloat(propForm.escrow) || 0,
        estimated: false,
      },
      notes: propForm.notes,
    };
    if (editingPropId) updateRental(editingPropId, payload);
    else addRental(payload);
    cancelPropForm();
  };
  const confirmDeleteProp = (r) => { if (confirm(`Delete property "${r.name}"? Snowball math will recompute without it.`)) deleteRental(r.id); };

  // v28+ Maintenance trio: per-property records (maintenance log + conversations)
  // Stored on the rental record itself. All local, zero ongoing cost.
  const MAINT_CATEGORIES = ['roof','plumbing','hvac','electrical','appliance','exterior','interior','lawn','pest','flooring','windows','general','other'];
  const [openRecordsId, setOpenRecordsId] = useState(null); // which property's records are expanded
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [showConvForm, setShowConvForm] = useState(false);
  // Round 10 — Maintenance entries carry an ITSM urgency band so the family
  // can triage at a glance. Defaults to 'incident' (3-day window).
  const blankMaint = () => ({ date: new Date().toISOString().slice(0,10), category: 'general', urgency: 'incident', description: '', cost: 0, vendor: '', notes: '', photos: [] });
  const blankConv = () => ({ date: new Date().toISOString().slice(0,10), person: '', summary: '', notes: '' });
  const [maintForm, setMaintForm] = useState(blankMaint());
  const [convForm, setConvForm] = useState(blankConv());

  // Compress an image File to a JPEG data URL (max width 1200, quality 0.7).
  // Returns a Promise<string>. Typical receipt photo lands at 80-200 KB.
  const compressImageFile = (file, maxWidth = 1200, quality = 0.7) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const onMaintPhotoFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const compressed = [];
    for (const file of Array.from(fileList)) {
      try { compressed.push(await compressImageFile(file)); } catch (e) { console.warn('Image compress failed', e); }
    }
    setMaintForm(f => ({ ...f, photos: [...(f.photos || []), ...compressed] }));
  };

  const openRecords = (r) => { setOpenRecordsId(r.id === openRecordsId ? null : r.id); setShowMaintForm(false); setShowConvForm(false); setMaintForm(blankMaint()); setConvForm(blankConv()); };
  const addMaintEntry = (r) => {
    if (!maintForm.description) { alert('Description is required.'); return; }
    const entry = { ...maintForm, id: `mt-${Date.now()}`, cost: parseFloat(maintForm.cost) || 0 };
    updateRental(r.id, { maintenanceLog: [...(r.maintenanceLog || []), entry] });
    setMaintForm(blankMaint()); setShowMaintForm(false);
  };
  const addConvEntry = (r) => {
    if (!convForm.summary) { alert('Summary is required.'); return; }
    const entry = { ...convForm, id: `cv-${Date.now()}` };
    updateRental(r.id, { conversationLog: [...(r.conversationLog || []), entry] });
    setConvForm(blankConv()); setShowConvForm(false);
  };
  const deleteMaintEntry = (r, entryId) => {
    if (!confirm('Delete this maintenance entry? Photos and receipt info will be lost.')) return;
    updateRental(r.id, { maintenanceLog: (r.maintenanceLog || []).filter(e => e.id !== entryId) });
  };
  const deleteConvEntry = (r, entryId) => {
    if (!confirm('Delete this conversation note?')) return;
    updateRental(r.id, { conversationLog: (r.conversationLog || []).filter(e => e.id !== entryId) });
  };
  // v28+ Bug fix: side-by-side strategy comparison so user can see the delta even when small
  const strategyComparison = useMemo(() => {
    const runs = RENTAL_STRATEGY_OPTIONS.map(s => {
      const r = projectRentalSnowball(rentals, snowballExtra, s.id, currentDate, 240);
      return { ...s, totalInterest: r.totalInterest, allClearedYears: r.allClearedYears, allClearedMonth: r.allClearedMonth };
    });
    const cheapest = Math.min(...runs.map(r => r.totalInterest));
    return runs.map(r => ({ ...r, delta: r.totalInterest - cheapest, isCheapest: r.totalInterest === cheapest }));
  }, [rentals, snowballExtra, currentDate]);
  const allRatesEqual = rentals.length > 1 && rentals.every(r => r.mortgage.rate === rentals[0].mortgage.rate);
  return (
    <div className="space-y-8">
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-2 font-medium">The 7-Year Pattern</div>
        <h2 className="text-2xl mb-3" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>Six years to build. The seventh year to rest.</h2>
        <p className="text-base leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>Own each property outright within seven years, so the seventh year is real rest.</p>
      </section>
      <section>
        <SectionTitle>11 Doors · Poe Properties LLC</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC] mb-4">
          <MetricCell label="Mortgage debt" value={fmtCompact(totals.totalRentalDebt)} sub="est." small accent="rust" />
          <MetricCell label="Monthly P&I" value={fmt(totals.totalRentalPI)} small />
          <MetricCell label="Monthly rent" value={fmt(totals.rentalExpected)} sub={`${totals.collectionRate.toFixed(0)}%`} small accent="green" />
          <MetricCell label="Rent gap" value={fmt(totals.rentGap)} small accent={totals.rentGap > 0 ? 'rust' : 'green'} />
        </div>
      </section>
      <section>
        <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
          <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Properties · {rentals.length}</h2>
          <button type="button" onClick={() => showPropForm ? cancelPropForm() : startAddProp()} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showPropForm ? '× Cancel' : '+ Add property'}</button>
        </div>

        {/* Round 7 — Top form is for ADD only. When editing, the same form
            renders inline inside the row being edited via {propFormBlock} below. */}
        {showPropForm && !editingPropId && (
          <div className="bg-white border border-[#B85838] p-4 mb-3 space-y-3">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium">{editingPropId ? 'Edit property' : 'New property · address autocomplete via OpenStreetMap'}</div>

            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Address (start typing — suggestions appear)</label>
              <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="123 Main St, Champaign" value={propForm.address} onChange={e => { setPropForm({ ...propForm, address: e.target.value }); fetchSuggestions(e.target.value); }} />
              {suggestLoading && <div className="text-[10px] text-[#5A5751] italic mt-1">Searching...</div>}
              {suggestions.length > 0 && (
                <div className="border border-[#E8E4DC] bg-white mt-1 max-h-48 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button key={i} type="button" onClick={() => pickSuggestion(s)} className="block w-full text-left p-2 text-xs hover:bg-[#FAF8F4] border-b border-[#E8E4DC]" style={{ fontFamily: '"Fraunces", serif' }}>
                      {s.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Property name</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., 805 Apt 1" value={propForm.name} onChange={e => setPropForm({ ...propForm, name: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">City</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.city} onChange={e => setPropForm({ ...propForm, city: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">State</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.state} onChange={e => setPropForm({ ...propForm, state: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Zip</label>
                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.zip} onChange={e => setPropForm({ ...propForm, zip: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Current tenant name (optional)</label>
              <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Tracy Williams — leave blank for personal or vacant" value={propForm.tenantName} onChange={e => setPropForm({ ...propForm, tenantName: e.target.value })} />
              <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>If set, the tenant name shows on the property card. Property name (address) stays the property's primary label.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Property type</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.propertyType} onChange={e => setPropForm({ ...propForm, propertyType: e.target.value })}>
                  {['single-family','multi-family','commercial','condo','townhouse','duplex','primary-home','secondary-home','vacation','land','other'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly rent</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.rent} onChange={e => setPropForm({ ...propForm, rent: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.status} onChange={e => setPropForm({ ...propForm, status: e.target.value })}>
                  {['paying','late','vacant','rehab','for-sale','sold','owner-occupied','seasonal','unrented'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label>
                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.entityId} onChange={e => setPropForm({ ...propForm, entityId: e.target.value })}>
                  {entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Purchase price</label>
                <input type="number" step="100" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.purchasePrice} onChange={e => setPropForm({ ...propForm, purchasePrice: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Purchase date</label>
                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.purchaseDate} onChange={e => setPropForm({ ...propForm, purchaseDate: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Est. value (today)</label>
                <input type="number" step="100" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.estimatedValue} onChange={e => setPropForm({ ...propForm, estimatedValue: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Mortgage balance</label>
                <input type="number" step="100" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.mortgageBalance} onChange={e => setPropForm({ ...propForm, mortgageBalance: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Mortgage rate %</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.mortgageRate} onChange={e => setPropForm({ ...propForm, mortgageRate: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly P&I</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.monthlyPI} onChange={e => setPropForm({ ...propForm, monthlyPI: e.target.value })} />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Escrow / mo</label>
                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={propForm.escrow} onChange={e => setPropForm({ ...propForm, escrow: e.target.value })} />
              </div>
            </div>

            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Notes (tenant, history, repairs needed, etc.)" value={propForm.notes} onChange={e => setPropForm({ ...propForm, notes: e.target.value })} />

            {/* Auto-evaluator */}
            <div className="bg-[#FAF8F4] border border-[#1A1815] p-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">Auto-Evaluator · Live as you type</div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
                <div className="bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Cap rate</div>
                  <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{evaluator.capRate.toFixed(2)}%</div>
                  <div className={`text-[9px] ${evaluator.capRate >= 8 ? 'text-[#5A6E3D]' : evaluator.capRate >= 5 ? 'text-[#5A5751]' : 'text-[#B85838]'}`}>{evaluator.capRate >= 8 ? 'Strong' : evaluator.capRate >= 5 ? 'OK' : 'Weak'}</div>
                </div>
                <div className="bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Cash-on-cash</div>
                  <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{evaluator.cashOnCash.toFixed(2)}%</div>
                  <div className={`text-[9px] ${evaluator.cashOnCash >= 10 ? 'text-[#5A6E3D]' : evaluator.cashOnCash >= 6 ? 'text-[#5A5751]' : 'text-[#B85838]'}`}>{evaluator.cashOnCash >= 10 ? 'Strong' : evaluator.cashOnCash >= 6 ? 'OK' : 'Weak'}</div>
                </div>
                <div className="bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">1% rule</div>
                  <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{evaluator.onePct.toFixed(2)}%</div>
                  <div className={`text-[9px] ${evaluator.onePct >= 1 ? 'text-[#5A6E3D]' : 'text-[#B85838]'}`}>{evaluator.onePct >= 1 ? '✓ pass' : '✗ below 1%'}</div>
                </div>
                <div className="bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">DSCR</div>
                  <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{evaluator.dscr.toFixed(2)}</div>
                  <div className={`text-[9px] ${evaluator.dscr >= 1.25 ? 'text-[#5A6E3D]' : evaluator.dscr >= 1 ? 'text-[#5A5751]' : 'text-[#B85838]'}`}>{evaluator.dscr >= 1.25 ? 'Lender OK' : evaluator.dscr >= 1 ? 'Tight' : 'Below 1'}</div>
                </div>
                <div className="bg-white p-2">
                  <div className="text-[9px] uppercase tracking-wider text-[#5A5751]">GRM</div>
                  <div className="text-base" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{evaluator.grm.toFixed(1)}</div>
                  <div className="text-[9px] text-[#5A5751]">lower = better</div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#E8E4DC] border border-[#E8E4DC] mt-2">
                <div className="bg-white p-2"><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Annual rent</div><div className="text-sm" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(evaluator.annualRent)}</div></div>
                <div className="bg-white p-2"><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">NOI</div><div className="text-sm" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(evaluator.noi)}</div></div>
                <div className="bg-white p-2"><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Annual debt service</div><div className="text-sm" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(evaluator.annualDS)}</div></div>
                <div className="bg-white p-2"><div className="text-[9px] uppercase tracking-wider text-[#5A5751]">Annual cash flow</div><div className={`text-sm ${evaluator.annualCF < 0 ? 'text-[#B85838]' : 'text-[#5A6E3D]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(evaluator.annualCF)}</div></div>
              </div>
              <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                Cap rate = NOI ÷ purchase price. Cash-on-cash assumes 20% down. 1% rule = monthly rent ÷ purchase price. DSCR = NOI ÷ annual debt service (lenders want ≥ 1.25). GRM = price ÷ annual rent. NOI uses your escrow plus a 10% maintenance/vacancy buffer; refine the buffer in your head for the property type.
              </p>
            </div>

            <button type="button" onClick={submitProp} className="w-full bg-[#1A1815] text-[#FAF8F4] py-2 text-xs uppercase tracking-wider hover:bg-[#B85838]">{editingPropId ? 'Save Changes' : 'Save Property'}</button>
          </div>
        )}

        {(() => {
          const incomeProducing = rentals.filter(r => (r.rent || 0) > 0);
          const personal = rentals.filter(r => (r.rent || 0) === 0);
          const renderPropertyRow = (r, i, lastIdx) => {
            // Round 10 — Tenant-late surfacing. If status is 'late', show a
            // tenant-issue card with one-tap "Open as Change / Incident / Project"
            // buttons. If an open issue already exists, show its band + Resolve.
            const existingIssue = r.status === 'late' && !readOnly ? openIncidentFor(r) : null;
            const showLatePrompt = r.status === 'late' && !readOnly && !existingIssue;
            return (
                <div key={r.id} className={`p-4 ${i < lastIdx ? 'border-b border-[#E8E4DC]' : ''}`}>
                  {showLatePrompt && addIncident && (
                    <div className="mb-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838]">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
                        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">⚐ Tenant Not Paying · open this as</div>
                        <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"Fraunces", serif' }}>{fmt((r.rent || 0) - (r.actual || 0))} short</div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {URGENCY_BANDS.map(u => (
                          <button key={u.key} type="button" onClick={() => openTenantIssue(r, u.key)} className="text-[10px] uppercase tracking-wider px-3 py-2 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]" style={{ color: u.accent, borderColor: u.accent }}>
                            <span aria-hidden="true">{u.symbol}</span> {u.label} <span className="opacity-70 normal-case">· {u.tagline}</span>
                          </button>
                        ))}
                      </div>
                      {(() => {
                        // CONNECTED-CONTEXT task #88 — surface prior incidents at this
                        // same property. User pre-selects which ones to link before
                        // clicking an urgency button above. IN-PLACE-FIRST: no modal.
                        const draft = { linkedTo: { type: 'rental', id: r.id } };
                        const candidates = findRelatedAuto(draft, 'incident', { incidents }, 5);
                        if (candidates.length === 0) return null;
                        const selected = tenantLateSelectedLinks[r.id] || [];
                        return (
                          <div className="mt-3 pt-3 border-t border-[#B85838]/40" aria-labelledby={`auto-link-h-${r.id}`}>
                            <div id={`auto-link-h-${r.id}`} className="text-[10px] uppercase tracking-wider text-[#5A5751] mb-2 font-semibold">
                              🔗 Possibly related — tap to pre-link ({candidates.length})
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {candidates.map(link => {
                                const isSelected = selected.some(l => l.toEntityId === link.toEntityId);
                                return (
                                  <button
                                    key={link.toEntityId}
                                    type="button"
                                    onClick={() => toggleTenantLink(r.id, link)}
                                    aria-pressed={isSelected}
                                    className={`text-[10px] uppercase tracking-wider px-2.5 py-1.5 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838] ${isSelected ? 'bg-[#5A6E3D] text-white border-[#5A6E3D]' : 'border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] bg-white'}`}
                                  >
                                    <span aria-hidden="true">{isSelected ? '✓ ' : '+ '}</span>
                                    {incidentDisplay(link.toEntityId)} <span className="opacity-70 normal-case italic">· {link.kind}</span>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[9px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                              Prior incidents at this property. Selected chips get linked to the new incident when you tap a band above.
                            </p>
                          </div>
                        );
                      })()}
                      <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
                        Change = same-day action. Incident = 3-day resolution window. Project = formal eviction / multi-week plan. The chosen item shows on Big Picture → Action Queue with a due date.
                      </p>
                    </div>
                  )}
                  {existingIssue && (
                    <div className="mb-3 p-3 bg-white border border-[#B85838] flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-base" aria-hidden="true" style={{ color: URGENCY_INDEX[existingIssue.urgency]?.accent }}>{URGENCY_INDEX[existingIssue.urgency]?.symbol}</span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: URGENCY_INDEX[existingIssue.urgency]?.accent }}>{URGENCY_INDEX[existingIssue.urgency]?.label}</span>
                        <span className="text-xs" style={{ fontFamily: '"Fraunces", serif' }}>open · due {existingIssue.dueDate}</span>
                      </div>
                      {resolveIncident && (
                        <button type="button" onClick={() => resolveIncident(existingIssue.id)} className="text-xs uppercase tracking-wider px-3 py-1.5 border border-[#5A6E3D] text-[#5A6E3D] hover:bg-[#5A6E3D] hover:text-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">✓ Mark resolved</button>
                      )}
                    </div>
                  )}
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.name}</div>
                      <div className="text-xs text-[#5A5751]">
                        {[r.address, r.city, r.state, r.zip].filter(Boolean).join(', ') || 'no address yet'}
                        {r.propertyType && <span className="ml-2 uppercase tracking-wider text-[9px]">· {r.propertyType}</span>}
                      </div>
                      {r.tenantName && (
                        <div className="text-[11px] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>
                          👤 <strong>{r.tenantName}</strong>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {(r.rent || 0) > 0 ? (
                        <>
                          <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(r.rent)}<span className="text-xs text-[#5A5751]">/mo</span></div>
                          <div className={`text-[10px] uppercase tracking-wider ${r.status === 'late' ? 'text-[#B85838]' : r.status === 'vacant' ? 'text-[#B85838]' : 'text-[#5A5751]'}`}>{r.status}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">{r.status || 'personal'}</div>
                          {r.mortgage?.monthlyPI ? <div className="text-xs text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt((r.mortgage?.monthlyPI || 0) + (r.mortgage?.escrow || 0))}/mo PITI</div> : null}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 text-xs">
                    <div><span className="text-[#5A5751]">Mortgage:</span> <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.mortgage?.balance ? fmt(r.mortgage.balance) : 'paid off'}</span></div>
                    <div><span className="text-[#5A5751]">Rate:</span> <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.mortgage?.rate ? r.mortgage.rate + '%' : '—'}</span></div>
                    <div><span className="text-[#5A5751]">P&I:</span> <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.mortgage?.monthlyPI ? fmt(r.mortgage.monthlyPI) : '—'}</span></div>
                    <div><span className="text-[#5A5751]">Coords:</span> {typeof r.lat === 'number' ? <span className="text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{r.lat.toFixed(3)}, {r.lon.toFixed(3)}</span> : <button type="button" onClick={() => startEditProp(r)} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline">📍 Set address</button>}</div>
                  </div>
                  <div className="flex gap-2 mt-2 items-baseline flex-wrap">
                    <button type="button" onClick={() => editingPropId === r.id ? cancelPropForm() : startEditProp(r)} aria-expanded={editingPropId === r.id} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#1A1815] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">{editingPropId === r.id ? '× Cancel edit' : '✎ Edit'}</button>
                    <button type="button" onClick={() => openRecords(r)} className="text-xs uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">
                      {openRecordsId === r.id ? '× Close records' : `📋 Records (${(r.maintenanceLog || []).length} maint · ${(r.conversationLog || []).length} notes)`}
                    </button>
                    {(r.maintenanceLog || []).length > 0 && (
                      <span className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        Lifetime maint: {fmt((r.maintenanceLog || []).reduce((s, e) => s + (e.cost || 0), 0))}
                      </span>
                    )}
                    <span aria-hidden="true" className="h-5 w-px bg-[#E8E4DC] ml-auto" />
                    <button type="button" onClick={() => confirmDeleteProp(r)} aria-label={`Delete property ${r.name}`} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Delete</button>
                  </div>
                  {r.notes && <p className="text-[11px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>{r.notes}</p>}

                  {/* Round 7 — Inline quick-edit form drops down right under the property row.
                      Covers the common-edit fields (name · address · tenant · rent · status · notes
                      · monthly P&I · mortgage balance). For the full editor (purchase price,
                      cap-rate evaluator, address autocomplete) tap "Full editor ↗" — opens the
                      top form. Keeps the eye where it was, no jump-to-top. */}
                  {editingPropId === r.id && (
                    <div className="mt-3 p-3 bg-[#FAF8F4] border-2 border-[#B85838]">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[#B85838] font-medium mb-2">Quick edit · {r.name}</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div><label htmlFor={`qe-name-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Property name</label><input id={`qe-name-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.name} onChange={e => setPropForm({ ...propForm, name: e.target.value })} /></div>
                        <div><label htmlFor={`qe-addr-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Address</label><input id={`qe-addr-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.address} onChange={e => setPropForm({ ...propForm, address: e.target.value })} /></div>
                        <div><label htmlFor={`qe-tenant-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Tenant name</label><input id={`qe-tenant-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.tenantName} onChange={e => setPropForm({ ...propForm, tenantName: e.target.value })} /></div>
                        <div><label htmlFor={`qe-rent-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly rent</label><input id={`qe-rent-${r.id}`} type="number" step="0.01" min="0" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.rent} onChange={e => setPropForm({ ...propForm, rent: e.target.value })} /></div>
                        <div><label htmlFor={`qe-stat-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Status</label><select id={`qe-stat-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.status} onChange={e => setPropForm({ ...propForm, status: e.target.value })}>{['paying','late','vacant','rehab','for-sale','sold','owner-occupied','seasonal','unrented'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                        <div><label htmlFor={`qe-ent-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Entity</label><select id={`qe-ent-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.entityId} onChange={e => setPropForm({ ...propForm, entityId: e.target.value })}>{entities.map(en => <option key={en.id} value={en.id}>{en.name.split('(')[0].trim()}</option>)}</select></div>
                        <div><label htmlFor={`qe-mtg-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Mortgage balance</label><input id={`qe-mtg-${r.id}`} type="number" step="100" min="0" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.mortgageBalance} onChange={e => setPropForm({ ...propForm, mortgageBalance: e.target.value })} /></div>
                        <div><label htmlFor={`qe-pi-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751]">Monthly P&amp;I</label><input id={`qe-pi-${r.id}`} type="number" step="0.01" min="0" className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={propForm.monthlyPI} onChange={e => setPropForm({ ...propForm, monthlyPI: e.target.value })} /></div>
                      </div>
                      <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-white mt-2 focus:outline focus:outline-2 focus:outline-[#B85838]" rows="2" placeholder="Notes" value={propForm.notes} onChange={e => setPropForm({ ...propForm, notes: e.target.value })} />
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <button type="button" onClick={submitProp} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save changes</button>
                        <button type="button" onClick={cancelPropForm} className="border border-[#1A1815] px-4 py-2 text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                        <button type="button" onClick={() => { setShowPropForm(true); try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {} }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815] underline ml-auto focus:outline focus:outline-2 focus:outline-[#B85838]">Full editor ↗ (purchase price · evaluator · address autocomplete)</button>
                      </div>
                    </div>
                  )}

                  {openRecordsId === r.id && (
                    <div className="mt-3 pt-3 border-t border-[#E8E4DC] space-y-4">
                      {/* v28+ MVP v1.5: lease/tenant/equipment/rooms — Real Estate App carryover */}
                      <PropertyDetails rental={r} updateRental={updateRental} voiceOps={voiceOps} />
                      {/* MAINTENANCE LOG */}
                      <div>
                        <div className="flex items-baseline justify-between gap-2 mb-2">
                          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">🔧 Maintenance Log · {(r.maintenanceLog || []).length}</div>
                          <button type="button" onClick={() => { setShowMaintForm(!showMaintForm); setMaintForm(blankMaint()); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showMaintForm ? '× Cancel' : '+ Add entry'}</button>
                        </div>
                        {showMaintForm && (
                          <div className="bg-white border border-[#B85838] p-3 mb-2 space-y-2">
                            {/* Round 10 — Urgency band picker. Change / Incident / Project.
                                Defaults to Incident (3-day resolution window). Picking Change
                                stamps a same-day due. Picking Project surfaces a hint about
                                also opening a formal project record. */}
                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Urgency</label>
                              <div className="flex flex-wrap gap-1">
                                {URGENCY_BANDS.map(u => (
                                  <button key={u.key} type="button" onClick={() => setMaintForm({ ...maintForm, urgency: u.key })} className={`text-[10px] uppercase tracking-wider px-3 py-2 border min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]`} style={maintForm.urgency === u.key ? { backgroundColor: u.accent, color: 'white', borderColor: u.accent } : { color: u.accent, borderColor: u.accent }}>
                                    <span aria-hidden="true">{u.symbol}</span> {u.label} <span className="opacity-70 normal-case">· {u.tagline}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Date</label>
                                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={maintForm.date} onChange={e => setMaintForm({ ...maintForm, date: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Category</label>
                                <select className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={maintForm.category} onChange={e => setMaintForm({ ...maintForm, category: e.target.value })}>
                                  {MAINT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Cost</label>
                                <input type="number" step="0.01" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={maintForm.cost} onChange={e => setMaintForm({ ...maintForm, cost: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Vendor</label>
                                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., Reyes Roofing" value={maintForm.vendor} onChange={e => setMaintForm({ ...maintForm, vendor: e.target.value })} />
                              </div>
                            </div>
                            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="What was done? (required)" value={maintForm.description} onChange={e => setMaintForm({ ...maintForm, description: e.target.value })} />
                            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Notes · warranty · parts numbers" value={maintForm.notes} onChange={e => setMaintForm({ ...maintForm, notes: e.target.value })} />
                            <div>
                              <label className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">📷 Receipts / photos</label>
                              <input type="file" accept="image/*" multiple capture="environment" onChange={e => onMaintPhotoFiles(e.target.files)} className="block w-full text-xs file:mr-2 file:px-2 file:py-1 file:bg-[#1A1815] file:text-white file:border-0 file:uppercase file:tracking-wider file:text-[10px] file:cursor-pointer" />
                              {(maintForm.photos || []).length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {maintForm.photos.map((src, i) => (
                                    <div key={i} className="relative">
                                      <img src={src} alt={`Receipt ${i+1}`} className="w-20 h-20 object-cover border border-[#1A1815]" />
                                      <button type="button" onClick={() => setMaintForm(f => ({ ...f, photos: f.photos.filter((_, j) => j !== i) }))} className="absolute -top-1 -right-1 bg-[#B85838] text-white text-[10px] w-4 h-4 leading-4 text-center rounded-full">×</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-[10px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Images are compressed to ~1200px JPEG before saving locally. No upload, no server.</p>
                            </div>
                            <button type="button" onClick={() => addMaintEntry(r)} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Maintenance Entry</button>
                          </div>
                        )}
                        {(r.maintenanceLog || []).length === 0 && !showMaintForm ? (
                          <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No maintenance entries yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {[...(r.maintenanceLog || [])].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                              <div key={e.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-2">
                                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px] flex items-center gap-1.5 flex-wrap" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                                      {e.urgency && URGENCY_INDEX[e.urgency] && (
                                        <span className="px-1.5 py-0.5 border text-[9px] uppercase tracking-wider font-semibold" style={{ color: URGENCY_INDEX[e.urgency].accent, borderColor: URGENCY_INDEX[e.urgency].accent }} title={URGENCY_INDEX[e.urgency].tagline}>
                                          {URGENCY_INDEX[e.urgency].symbol} {URGENCY_INDEX[e.urgency].label}
                                        </span>
                                      )}
                                      <span>{e.date} · <span className="uppercase tracking-wider">{e.category}</span>{e.vendor ? ` · ${e.vendor}` : ''}</span>
                                    </div>
                                    <div className="text-xs mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.description}</div>
                                    {e.notes && <div className="text-[11px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.notes}</div>}
                                  </div>
                                  <div className="flex items-baseline gap-2 shrink-0">
                                    <div className="text-sm" style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 500 }}>{fmt(e.cost || 0)}</div>
                                    <button type="button" onClick={() => deleteMaintEntry(r, e.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                                  </div>
                                </div>
                                {(e.photos || []).length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {e.photos.map((src, i) => (
                                      <a key={i} href={src} target="_blank" rel="noopener noreferrer" title="Open full size">
                                        <img src={src} alt={`Photo ${i+1}`} className="w-16 h-16 object-cover border border-[#E8E4DC] hover:border-[#1A1815]" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* CONVERSATION LOG */}
                      <div>
                        <div className="flex items-baseline justify-between gap-2 mb-2">
                          <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">💬 Tenant & Vendor Conversations · {(r.conversationLog || []).length}</div>
                          <button type="button" onClick={() => { setShowConvForm(!showConvForm); setConvForm(blankConv()); }} className="text-[10px] uppercase tracking-wider text-[#B85838] hover:text-[#1A1815]">{showConvForm ? '× Cancel' : '+ Log a conversation'}</button>
                        </div>
                        {showConvForm && (
                          <div className="bg-white border border-[#B85838] p-3 mb-2 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Date</label>
                                <input type="date" className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" value={convForm.date} onChange={e => setConvForm({ ...convForm, date: e.target.value })} />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase tracking-wider text-[#5A5751]">Who</label>
                                <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="e.g., tenant Tracy, plumber Joe" value={convForm.person} onChange={e => setConvForm({ ...convForm, person: e.target.value })} />
                              </div>
                            </div>
                            <input className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" placeholder="Summary (required) — e.g., 'agreed to $200/mo payment plan on rent gap'" value={convForm.summary} onChange={e => setConvForm({ ...convForm, summary: e.target.value })} />
                            <textarea className="w-full p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4]" rows="2" placeholder="Notes · tone · next step · promises made" value={convForm.notes} onChange={e => setConvForm({ ...convForm, notes: e.target.value })} />
                            <button type="button" onClick={() => addConvEntry(r)} className="w-full bg-[#1A1815] text-white py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838]">Save Conversation Note</button>
                          </div>
                        )}
                        {(r.conversationLog || []).length === 0 && !showConvForm ? (
                          <p className="text-[11px] text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No conversation notes yet.</p>
                        ) : (
                          <div className="space-y-1">
                            {[...(r.conversationLog || [])].sort((a, b) => b.date.localeCompare(a.date)).map(e => (
                              <div key={e.id} className="bg-[#FAF8F4] border border-[#E8E4DC] p-2">
                                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{e.date}{e.person ? ` · ${e.person}` : ''}</div>
                                    <div className="text-xs mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.summary}</div>
                                    {e.notes && <div className="text-[11px] text-[#5A5751] italic mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{e.notes}</div>}
                                  </div>
                                  <button type="button" onClick={() => deleteConvEntry(r, e.id)} aria-label="Delete" className="text-sm text-[#5A5751] hover:text-[#B85838] hover:bg-[#FAF8F4] border border-transparent hover:border-[#B85838] px-3 py-1.5 min-h-[36px] min-w-[36px] shrink-0 focus:outline focus:outline-2 focus:outline-[#B85838]">×</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
          );
          };
          return (
            <div className="space-y-4">
              {rentals.length === 0 && (
                <div className="bg-white border border-[#E8E4DC] p-6 text-center">
                  <p className="text-sm text-[#5A5751] italic" style={{ fontFamily: '"Fraunces", serif' }}>No properties yet. Use + Add property above.</p>
                </div>
              )}
              {incomeProducing.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Income-Producing · {incomeProducing.length}</div>
                  <div className="bg-white border border-[#1A1815]">
                    {incomeProducing.map((r, i) => renderPropertyRow(r, i, incomeProducing.length - 1))}
                  </div>
                </div>
              )}
              {personal.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Personal & Non-Rental · {personal.length}</div>
                  <div className="bg-white border border-[#1A1815]">
                    {personal.map((r, i) => renderPropertyRow(r, i, personal.length - 1))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </section>

      <section>
        <SectionTitle>Snowball Strategy</SectionTitle>
        <div className="bg-white border border-[#1A1815] p-5 space-y-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751] mb-2">Payoff order</div>
            <div className="grid grid-cols-3 gap-1">
              {[['smallest-balance','Smallest','Momentum'],['highest-rate','Highest rate','Math optimum'],['best-cashflow','Best cash flow','Strong earners']].map(([id, label, sub]) => (
                <button key={id} onClick={() => setSnowballSort(id)} className={`px-2 py-2 text-left border ${snowballSort === id ? 'border-[#1A1815] bg-[#1A1815] text-white' : 'border-[#E8E4DC] text-[#5A5751]'}`}>
                  <div className="text-xs" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{label}</div>
                  <div className="text-[9px] uppercase tracking-wider opacity-75">{sub}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-2 flex-wrap gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Monthly snowball</div>
                <div className="text-[10px] text-[#5A5751] mt-0.5">Total mortgage debt: <strong>{fmtCompact(rentals.reduce((s, r) => s + r.mortgage.balance, 0))}</strong> across {rentals.length} properties · P&I: <strong>{fmt(rentals.reduce((s, r) => s + r.mortgage.monthlyPI, 0))}/mo</strong></div>
              </div>
              <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(snowballExtra)}</div>
            </div>
            <input type="range" min="0" max="20000" step="250" value={snowballExtra} onChange={(e) => setSnowballExtra(parseInt(e.target.value))} className="w-full accent-[#B85838]" />
            <details className="mt-2">
              <summary className="text-[10px] uppercase tracking-wider text-[#B85838] cursor-pointer hover:text-[#1A1815]">▸ Show individual property balances</summary>
              <div className="mt-2 space-y-1 text-xs">
                {[...rentals].sort((a, b) => b.mortgage.balance - a.mortgage.balance).slice(0, 11).map(r => (
                  <div key={r.id} className="flex justify-between border-b border-[#E8E4DC] pb-1">
                    <span style={{ fontFamily: '"Fraunces", serif' }}>{r.address} <span className="text-[#5A5751]">· {r.mortgage.rate}%</span></span>
                    <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{fmt(r.mortgage.balance)}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
          <div className="grid grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            <MetricCell label="All paid in" value={yearsAndMonths(rentalSnowball.allClearedMonth)} small />
            <MetricCell label="Interest" value={fmt(rentalSnowball.totalInterest)} small />
            <MetricCell label="Final freed" value={fmt(rentalSnowball.finalFreedCashFlow)} small accent="green" />
          </div>
        </div>
      </section>
      <section>
        <SectionTitle>7-Year Goal · Feasibility</SectionTitle>
        <div className="bg-white border border-[#1A1815] p-5">
          {sevenYrFeasible ? <p style={{ fontFamily: '"Fraunces", serif' }}>At {fmt(snowballExtra)}/mo snowball, all 11 doors pay off in <strong>{rentalSnowball.allClearedYears.toFixed(1)} years</strong>.</p> : <p style={{ fontFamily: '"Fraunces", serif' }}>At {fmt(snowballExtra)}/mo: cascade completes in <strong>{rentalSnowball.allClearedYears.toFixed(1)} years</strong>. 7-year goal needs <strong>{fmt(sevenYearTarget)}/mo</strong> — gap of <strong>{fmt(gapMonthly)}/mo</strong>.</p>}
        </div>
      </section>
      <section>
        <SectionTitle>Strategy Comparison</SectionTitle>
        <div className="bg-white border border-[#1A1815] p-5">
          <p className="text-xs text-[#5A5751] mb-4" style={{ fontFamily: '"Fraunces", serif' }}>
            All three strategies side by side at your current ${'{'}fmt(snowballExtra){'}'}/mo snowball. Differences show up most in <em>payoff order</em> (which property clears first) and <em>cash flow timing</em>, less so in total interest when mortgage rates are similar.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#E8E4DC] border border-[#E8E4DC]">
            {strategyComparison.map(s => (
              <div key={s.id} className={`p-4 ${s.id === snowballSort ? 'bg-[#FAF8F4]' : 'bg-white'}`}>
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">{s.label}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#5A5751] opacity-75">{s.sub}</div>
                  </div>
                  {s.id === snowballSort && <span className="text-[9px] uppercase tracking-wider text-[#B85838] font-semibold">Selected</span>}
                </div>
                <div className="text-xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>{fmt(s.totalInterest)}</div>
                <div className="text-[10px] text-[#5A5751] mt-0.5">total interest</div>
                <div className={`text-[10px] mt-1 ${s.isCheapest ? 'text-[#5A6E3D] font-semibold' : 'text-[#5A5751]'}`} style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {s.isCheapest ? '✓ cheapest' : `+${fmt(s.delta)}`}
                </div>
                <div className="text-[10px] text-[#5A5751] mt-2 pt-2 border-t border-[#E8E4DC]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  All clear: {s.allClearedYears.toFixed(1)} yrs
                </div>
              </div>
            ))}
          </div>
          {allRatesEqual && (
            <p className="text-[11px] text-[#5A5751] italic mt-3" style={{ fontFamily: '"Fraunces", serif' }}>
              All 11 rentals are seeded at the same mortgage rate ({rentals[0].mortgage.rate}%), so "Highest rate" doesn't differentiate from the others. Once you enter the actual per-property rates the spread widens — strategy choice will matter more.
            </p>
          )}
        </div>
      </section>
      <section>
        <SectionTitle>Payoff Cascade</SectionTitle>
        <div className="bg-white border border-[#1A1815]">
          {orderedByPayoff.map((r, i) => {
            const freedSoFar = orderedByPayoff.slice(0, i + 1).reduce((s, x) => s + x.mortgage.monthlyPI, 0);
            return (
              <div key={r.id} className={`p-4 ${i < orderedByPayoff.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="text-[#B85838] shrink-0 w-8 text-center" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <div style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.name}</div>
                      <div className="text-sm text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{monthLabel(currentDate, r.clearedAtMonth)}</div>
                    </div>
                    <div className="text-xs text-[#5A5751] mt-1">Paid in {yearsAndMonths(r.clearedAtMonth)} · {fmt(r.mortgage.balance)} · Frees {fmt(r.mortgage.monthlyPI)}/mo</div>
                    <div className="text-xs text-[#5A6E3D] mt-1">Snowball after: <strong>{fmt(snowballExtra + freedSoFar)}/mo</strong></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle>Property Map · Champaign-Urbana</SectionTitle>
        <div className="bg-white border border-[#1A1815] p-3">
          <div ref={mapRef} style={{ height: '360px', width: '100%' }} aria-label="Map of rental properties" />
          <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Pins appear for properties with saved coordinates. Use Edit on a property to add an address — the autocomplete fills coordinates automatically.
          </p>
        </div>
      </section>
    </div>
  );
}

export { Rentals, PropertyDetails, EQUIPMENT_CATEGORIES };
export default Rentals;
