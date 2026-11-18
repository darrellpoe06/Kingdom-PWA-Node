// =============================================================================
// GuideArt — the two approved guides and the artwork collection, on screen
// =============================================================================
// Darrell, 2026-11-13: the same girl and boy from his reference, everywhere,
// in different poses; repeated cutouts are never the final artwork; no drawn
// or generic stand-in. So every character appearance here is one of three
// honest things, decided by the registry (lib/kids/guides.js):
//   • a LANDED render from the artwork collection, shown as is;
//   • until it lands, the interim face cutout from the approved reference
//     (data-interim="true", so a grown-up or a test can tell), never a drawing;
//   • for a scene with no face to stand in, a labeled slot that says what is
//     coming and names the render (P15: a surface never goes blank).
// No name is shown for a guide until Darrell gives one (GUIDES[who].name).
import React from 'react';
import { GUIDES, KIDS_BRAND, SHOT_LIST, assetUrl, interimFor, landedFile } from '../../lib/kids/guides.js';

const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';

/** True when the registry says this shot's render is on disk. */
export function isLanded(id, list = SHOT_LIST) {
  const s = (list || []).find((x) => x.id === id);
  return !!s && s.status === 'landed';
}

/** The served URL of an asset file. */
/** The focus ring every kids control wears: the same orange ring kids-zone.css draws, carried on the tag itself. */
export const KZ_FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#FF7A00]';

export function kidsAsset(file) {
  return assetUrl(file, BASE);
}

/** A render by shot id when it has landed, else the honest fallback the caller chooses. */
export function Shot({ id, alt = '', className = '', fallback = null, list = SHOT_LIST }) {
  if (isLanded(id, list)) return <img className={`kz-shot ${className}`} src={kidsAsset(landedFile(id) || `${id}.png`)} alt={alt} data-shot={id} />;
  return fallback;
}

/**
 * The stand-in for a render that has not landed (Darrell, 2026-11-17: launch
 * v1 with no visible developer placeholder). When the approved reference can
 * stand in (a guide, the pair, a story page) it does, as a crop of the
 * reference with nothing written on it; the registry still knows the shot is
 * needed (data-needed) so the collection replaces it in place when it lands.
 * `who` names the narrator a story page shows beside its open Bible.
 */
export function ShotSlot({ id, what = '', className = '', who = null }) {
  const art = interimFor(id);
  if (!art) {
    // Nothing approved can stand in (the teens' own guides): a quiet gold emblem, no words.
    return (
      <div className={`kz-emblem ${className}`} data-shot={id} data-needed="true" aria-hidden="true">
        <KidsIcon name="flag" />
      </div>
    );
  }
  const narrator = art.kind === 'story' ? who : null;
  return (
    <div
      className={`kz-interim ${art.kind}${art.book ? ` ${art.book}` : ''} ${className}`}
      data-shot={id}
      data-needed="true"
      role="img"
      aria-label={what || id}
    >
      {art.kind === 'story' ? (
        <>
          <img className="kz-interim-bible" src={kidsAsset(art.file)} alt="" data-interim="true" />
          {narrator && GUIDES[narrator] ? <img className="kz-interim-narrator" src={kidsAsset(GUIDES[narrator].face)} alt="" data-interim="true" /> : null}
        </>
      ) : (
        <img className="kz-interim-img" src={kidsAsset(art.file)} alt="" data-who={art.who} data-interim="true" />
      )}
    </div>
  );
}

/** A guide's face: the interim cutout from the approved reference, until the pose lands. */
export function GuideFace({ who = 'girl', size = '', className = '' }) {
  const g = GUIDES[who] || GUIDES.girl;
  return <img className={`kz-face ${size} ${className}`} src={kidsAsset(g.face)} alt={g.name || 'Your guide'} data-guide={who} data-interim="true" />;
}

/**
 * A guide beside a speech bubble. `shot` names the posed render the bubble
 * waits for; until it lands the face cutout stands there.
 */
export function GuideBubble({ who = 'girl', shot = '', right = false, children, list = SHOT_LIST }) {
  return (
    <div className={`kz-bubble${right ? ' r' : ''}`} data-guide={who}>
      <span className="kz-who">
        <Shot id={shot} alt="" list={list} fallback={<GuideFace who={who} />} />
      </span>
      <p>{children}</p>
    </div>
  );
}

/** The approved logo lockup and the pair from the reference, as they are. */
export function KidsLogo({ className = 'kz-logo' }) {
  return <img className={className} src={kidsAsset(KIDS_BRAND.logo)} alt="The Love Corner Bible Adventures" />;
}
export function GuidesPair({ className = 'kz-heroimg' }) {
  return <img className={className} src={kidsAsset(KIDS_BRAND.pair)} alt="Your two guides at a table over an open Bible" data-interim="true" />;
}

/** Ari's mark: a gold star, never a face (Ari is not a child). */
export function AriStar({ className = 'kz-star' }) {
  return (
    <svg className={className} viewBox="0 0 60 60" aria-hidden="true">
      <path d="M30 4l6.4 17.2L54 22l-13.6 11 4.4 17.6L30 41 15.2 50.6 19.6 33 6 22l17.6-.8z" fill="#CFA63C" />
      <circle cx="23" cy="28" r="2.4" fill="#2A1A4D" />
      <circle cx="37" cy="28" r="2.4" fill="#2A1A4D" />
      <path d="M24 36q6 6 12 0" fill="none" stroke="#2A1A4D" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/** The dock's icons, plain line marks. */
export function KidsIcon({ name }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinejoin: 'round', strokeLinecap: 'round' };
  switch (name) {
    case 'map':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14 M15 6v14" {...common} />
        </svg>
      );
    case 'theater':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="7" width="18" height="12" rx="2" {...common} />
          <path d="M3 7l2-3h14l2 3M10 10.5v5l4-2.5z" {...common} />
        </svg>
      );
    case 'game':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="2" y="7" width="20" height="11" rx="5" {...common} />
          <path d="M7 10v5M4.5 12.5h5" {...common} />
          <circle cx="16" cy="11" r="1.3" fill="currentColor" />
          <circle cx="18.5" cy="13.5" r="1.3" fill="currentColor" />
        </svg>
      );
    case 'star':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" {...common} />
        </svg>
      );
    case 'adult':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="7" r="4" {...common} />
          <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" {...common} />
        </svg>
      );
    case 'read':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 6a8 8 0 0 1 8 0 8 8 0 0 1 8 0v13a8 8 0 0 0-8 0 8 8 0 0 0-8 0z M12 6v13" {...common} />
        </svg>
      );
    case 'flag':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 21V4h12l-3 4 3 4H5" {...common} />
        </svg>
      );
    case 'cal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" {...common} />
          <path d="M3 10h18M8 3v4M16 3v4" {...common} />
        </svg>
      );
    case 'speaker':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" />
          <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" {...common} />
        </svg>
      );
    case 'crayon':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 20l4-1 10-10-3-3L5 16z" {...common} />
          <path d="M14 6l3 3" {...common} />
        </svg>
      );
    case 'bulb':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5.9 1.1 1 1.9h5c.1-.8.4-1.4 1-1.9A6 6 0 0 0 12 3z" {...common} />
        </svg>
      );
    case 'starfill':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"
            fill="#CFA63C"
            stroke="#7A5C14"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'starline':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"
            fill="none"
            stroke="#C9A86A"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return null;
  }
}
