// =============================================================================
// Storefront — the apartments, shown the way a shop shows its goods
// =============================================================================
// Darrell, 2026-08-28: "It should have the Apartments shown in the Properties
// Tab... like the MooreDivahs App has except this is places to live... without
// an account!!!!!!!!!"
//
// ONE storefront, BOTH doors. The PoeTech Properties tab and the standalone
// poetech.us/properties door render the same card from the same rows, so a
// renter sees the same shelf whichever way they arrived and there is no second
// copy to drift. That is the module's whole posture (PropertiesDoor: "one
// library, two doors") applied to the public face.
//
// WITHOUT AN ACCOUNT IS STRUCTURAL, not a setting. Rows come from
// public_vacancies() and photographs from public_vacancy_photos() — both
// SECURITY DEFINER, both granted to anon, and both refuse on their own for a
// door that is unadvertised or occupied. The photo RPC returns ONLY
// kind='listing', so a move-out condition set of somebody's home cannot come
// through it whatever it is asked for. No street address is published either.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { loadVacancyPhotos } from './cloud.js';
import { applyUrl } from './apply-link.js';
import Lightbox from '../../components/Lightbox.jsx';

const ACCENT = '#2F5D50';
const serif = { fontFamily: '"Fraunces", serif' };

/**
 * One apartment on the shelf. Its photographs load per-card and independently:
 * a unit whose pictures fail or have none still shows everything else rather
 * than holding up the page or rendering a broken frame.
 */
export function VacancyCard({ unit }) {
  const [shots, setShots] = useState([]);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(null); // index being shown large, or null

  useEffect(() => {
    if (!unit.rentalId) return undefined;
    let on = true;
    loadVacancyPhotos(unit.rentalId).then((r) => { if (on && r.ok) setShots(r.photos || []); });
    return () => { on = false; };
  }, [unit.rentalId]);

  const shot = shots[i] || null;
  const size = [
    unit.beds ? `${unit.beds} bed` : null,
    unit.baths ? `${unit.baths} bath` : null,
  ].filter(Boolean).join(' · ');
  const shortStay = unit.offering === 'short-term' || unit.offering === 'both';

  return (
    <li className="border border-[#E8E4DC] bg-white overflow-hidden">
      <div className="aspect-[4/3] w-full bg-[#FAF8F4] flex items-center justify-center overflow-hidden">
        {shot?.storage_path ? (
          /* THE PICTURE OPENS. Darrell, 2026-10-10: "Applications can't review
             the pictures of the place... just a placeholder for one image...
             can't click to see all images" and "image doesn't get bigger...
             fix it so it's intuitive". The Lightbox this opens is the SAME one
             the owner-side photo grids and the Life Gallery already use —
             pinch-zoom, swipe, arrow keys, Esc. It existed; this card simply
             never called it. */
          <button
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`Open photo ${i + 1} of ${shots.length} larger`}
            data-testid="vacancy-photo-open"
            className="w-full h-full block cursor-zoom-in focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            <img
              src={shot.storage_path}
              alt={shot.caption || `${unit.label}${unit.unit ? ` ${unit.unit}` : ''}`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </button>
        ) : (
          /* Said plainly rather than shown as a broken frame or a stock photo of
             somewhere else — a stand-in picture of a different building is a
             lie a renter would only discover at the door. */
          <span className="text-[0.5625rem] uppercase tracking-wider text-[#8A867E] px-2 text-center">
            Photographs coming
          </span>
        )}
      </div>

      {/* CONTROLS A THUMB CAN HIT, AND EVERY PHOTO REACHABLE.
          What was here: ten-pixel dots, capped at `shots.slice(0, 6)` — so a
          door with ten listing photographs showed six circles and FOUR
          PICTURES NO APPLICANT COULD EVER REACH, however many circles they
          poked. Darrell, 2026-10-10: "Have to push the small circles... image
          doesn't get bigger... fix it so it's intuitive."
          Now: 44px arrows, the real count in words, and a button that opens
          the whole set. Nothing is capped. */}
      {shots.length > 1 && (
        <div className="flex items-center justify-between gap-2 px-1.5 py-1 border-b border-[#F0EDE6]">
          <button
            type="button"
            onClick={() => setI((n) => (n - 1 + shots.length) % shots.length)}
            aria-label="Previous photo"
            data-testid="vacancy-photo-prev"
            className="min-w-[44px] min-h-[44px] text-[#1A1815] hover:bg-[#F0EDE6] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setOpen(i)}
            data-testid="vacancy-photo-seeall"
            className="flex-1 min-h-[44px] text-[0.75rem] text-[#2F5D50] underline hover:bg-[#F0EDE6] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            {`See all ${shots.length} photos — ${i + 1} of ${shots.length}`}
          </button>
          <button
            type="button"
            onClick={() => setI((n) => (n + 1) % shots.length)}
            aria-label="Next photo"
            data-testid="vacancy-photo-next"
            className="min-w-[44px] min-h-[44px] text-[#1A1815] hover:bg-[#F0EDE6] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
          >
            ›
          </button>
        </div>
      )}
      {open != null && (
        <Lightbox
          items={shots.map((p) => ({
            src: p.storage_path,
            alt: p.caption || `${unit.label}${unit.unit ? ` ${unit.unit}` : ''}`,
            caption: p.caption || '',
          }))}
          index={open}
          onClose={() => setOpen(null)}
        />
      )}

      <div className="p-2.5">
        <div className="text-[0.875rem] text-[#1A1815] leading-snug" style={serif}>
          {unit.label}{unit.unit ? ` · ${unit.unit}` : ''}
        </div>
        {unit.where && <div className="text-[0.75rem] text-[#5A5751]">{unit.where}</div>}
        <div className="text-[0.8125rem] text-[#1A1815] mt-1">
          {unit.rent != null ? `$${unit.rent.toFixed(0)}/mo` : 'Rent on request'}
          {size ? ` · ${size}` : ''}
        </div>
        {shortStay && (
          <div className="text-[0.75rem] text-[#5A5751]">
            Short stay welcome{unit.nightly ? ` · $${unit.nightly.toFixed(0)}/night` : ''}
          </div>
        )}
        {unit.note && <p className="text-[0.75rem] text-[#5A5751] mt-1 leading-snug">{unit.note}</p>}
        {/* SAY WHICH IT IS (0158). Until 2026-08-28 every card printed "the exact
            address is given by a person, not published here" while the label
            above it WAS the street — display_name is the address on all twelve
            doors. A card now states the truth about itself: shown, or held
            until you ask. Neither sentence is decoration; one of them is always
            a claim the database is enforcing. */}
        {unit.addressShown === false && (
          <p className="text-[0.75rem] text-[#5A5751] mt-1 leading-snug">
            Address shared when you apply — nothing to sign up for.
          </p>
        )}
        <a
          href={applyUrl(unit.rentalId)}
          className="mt-2 inline-flex items-center text-[0.625rem] uppercase tracking-wider px-3 py-2 min-h-[36px] border text-[#2F5D50]"
          style={{ borderColor: ACCENT }}
        >Apply — no account needed</a>
      </div>
    </li>
  );
}
