// =============================================================================
// AddressField — the ONE reusable type-an-address-get-suggestions field
// =============================================================================
// Darrell 2026-07-07: "Location should be a map that populates as soon as she
// starts typing an address — all things we have built with PoeTech." Correct:
// the pattern shipped inside Rentals (Nominatim autocomplete + Leaflet pins).
// This EXTRACTS the autocomplete as a shared component so every surface —
// Moore Divahs classes today, any future build tomorrow — gets the same
// type-ahead without re-implementing it. Same free OpenStreetMap/Nominatim
// service Rentals uses (no paid API, debounced 400ms, US-only, 5 results).
// On pick it hands back { label, lat, lon } — map-grade data, so any consumer
// can pin a Leaflet map or link straight to OpenStreetMap.
// =============================================================================
import React, { useRef, useState } from 'react';

// Pure: a Nominatim result → the location the consumer stores. Exported for tests.
export function pickToLocation(s) {
  const a = (s && s.address) || {};
  const street = [a.house_number, a.road].filter(Boolean).join(' ');
  const town = a.city || a.town || a.village || a.hamlet || '';
  const label = [street || String(s?.display_name || '').split(',')[0], town, a.state].filter(Boolean).join(', ');
  return {
    label,
    lat: s && s.lat != null ? parseFloat(s.lat) : null,
    lon: s && s.lon != null ? parseFloat(s.lon) : null,
  };
}

// The OpenStreetMap link for a picked location — the zero-weight map view any
// card can offer next to a located thing.
export function osmLink(lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number' || Number.isNaN(lat) || Number.isNaN(lon)) return null;
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
}

export default function AddressField({ value, onChange, onPick, placeholder = 'Start typing an address…', ariaLabel = 'Address', className = '' }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const fetchSuggestions = (q) => {
    clearTimeout(timer.current);
    if (!q || q.length < 3) { setSuggestions([]); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&countrycodes=us&limit=5`;
        const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
        const json = await res.json();
        setSuggestions(Array.isArray(json) ? json : []);
      } catch {
        setSuggestions([]);
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className={`relative ${className}`}>
      <input
        aria-label={ariaLabel}
        placeholder={placeholder}
        className="w-full rounded border border-[#E8E2D8] bg-white px-2 py-1"
        value={value}
        onChange={(e) => { onChange(e.target.value); fetchSuggestions(e.target.value); }}
      />
      {loading && <div className="absolute right-2 top-1.5 text-xs text-[#5A5751]">…</div>}
      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full rounded-lg border border-[#E8E2D8] bg-white shadow-sm">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                className="block w-full px-2 py-1.5 text-left text-xs text-[#1A1815] hover:bg-[#FAF8F4]"
                onClick={() => { const loc = pickToLocation(s); onChange(loc.label); onPick?.(loc); setSuggestions([]); }}
              >
                {s.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
