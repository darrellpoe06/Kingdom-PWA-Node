# DR-0124 — Property records read images-first and chronological; the valuation card sits at the bottom; every address pulls like the app's other addresses

- **Status:** accepted
- **Tier:** B (layout + write-path additions on the Real Estate records panel; rides the lane)
- **Scope:** the Real Estate property records panel (Rentals.jsx); every property's photo story and address entry
- **Date:** 2026-07-08
- **Principles:** APP-IS-PRIMARY, VERIFICATION-DOCTRINE, PERPETUAL-IMPROVEMENT, ANXIETY-CLARITY, DECISION-RECORDS

## Directive

Darrell, 2026-07-08, holding the 1003 Koehn Dr card (233 photos, coords unset, valuation leading the panel): *"The images for properties need to be first and chronological up until the latest images for each property and add the correct address for each property so it pulls like other addresses should."* Then, sharpening the order: *"put the property details at the bottom then from the top images then room details then tenant information etc."*

## Decision

1. **The records panel reads in the declared order:** 📷 Property Photos (first) → Rooms & Needed Work (open by default) → Lease & Tenant Contact → Mechanical & Equipment → unit management/maintenance/conversations → 🏠 Property Details (Market Valuation & Property Info) LAST. The valuation card was split out of PropertyDetails (`PropertyValuation`) so it truly closes the panel.
2. **The photo story is chronological, oldest → latest.** `PropertyGallery` combines every photo the property actually has — room-filed photos, maintenance shots, and the live NAS chat archive (the sovereign photo server serves newest-first; the gallery fetches the most recent page and sorts EVERYTHING ascending, so the story reads forward in time and ends at the latest picture; "Load earlier" pages deeper). Real dates only — an undated photo is labeled undated, never given an invented date (DR-0076). De-duped against room-filed copies.
3. **Every address entry pulls like the app's other addresses.** The quick-edit Address field now runs the same OpenStreetMap/Nominatim autocomplete as the full editor: one pick fills street/city/state/zip AND lat/lon — so "Set address" resolves, the lookup links (Zillow/Realtor/Redfin) light up, and the property pins on the map from a single pick. The data itself (each property's correct address) is the family's to pick — the field now makes one tap of it.

## Opportunities and constraints

- **Opportunity:** EXIF capture-date on upload would date the undated local photos properly (Layer-2 auto-sort already planned for new users). `re-review: 2026-07-22`.
- **Opportunity:** the gallery's "file to a room" affordance can move inline (today it points to the Photos-from-Chat browser below). `re-review: 2026-07-22`.
- **Constraint (verified):** the NAS photo server orders `create_at DESC` with offset paging — "chronological to the latest" is derived client-side by ascending sort of the fetched window; paging deeper extends the window backward in time.
- **Constraint (held):** the cloud agent cannot set the family's addresses (family-instance rows); the app now makes each one a single autocomplete pick by Darrell's hand.
