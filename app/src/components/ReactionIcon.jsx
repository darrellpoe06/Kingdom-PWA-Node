import React from 'react';

const VIEWBOX = '0 0 24 24';

// name -> inner SVG geometry, drawn on a 24x24 grid. Stroked with currentColor
// (inherits surrounding text color -> correct in every theme). A node may opt into
// fill via fill="currentColor" stroke="none". Keep shapes simple, recognizable,
// reverent; they read at ~16-28px.
const ICONS = {
  // A thumbs-up hand: raised thumb with a folded-finger fist block.
  like: (
    <>
      <path d="M7 10v9H4v-9z" />
      <path d="M7 10l3-6a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2l-1.2 6a2 2 0 0 1-2 1.5H7" />
    </>
  ),
  // A solid heart.
  love: (
    <path
      d="M12 20s-6.5-4.3-8.6-8.3C1.9 8.6 3.4 5.5 6.4 5.5c1.8 0 3 1 3.6 2.2C10.6 6.5 11.8 5.5 13.6 5.5c3 0 4.5 3.1 3 6.2C14.5 15.7 12 20 12 20z"
      fill="currentColor"
      stroke="none"
    />
  ),
  // A simpler thumbs-up silhouette.
  'thumbs-up': (
    <>
      <rect x="4" y="10" width="3" height="9" rx="0.5" />
      <path d="M7 11l3-6c1.3 0 2 .9 2 2v3h4.5a1.8 1.8 0 0 1 1.8 2.1l-1 5.4A1.8 1.8 0 0 1 15.5 19H7z" />
    </>
  ),
  // A thumbs-down hand: lowered thumb, mirrored from thumbs-up.
  'thumbs-down': (
    <>
      <rect x="4" y="5" width="3" height="9" rx="0.5" />
      <path d="M7 13l3 6c1.3 0 2-.9 2-2v-3h4.5a1.8 1.8 0 0 0 1.8-2.1l-1-5.4A1.8 1.8 0 0 0 15.5 5H7z" />
    </>
  ),

  // A lion's head: round face with a radiating mane of short strokes.
  lion: (
    <>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 3.5v-1M12 21.5v1M4.5 12h-1M20.5 12h1M6.7 6.7l-.9-.9M17.3 6.7l.9-.9M6.7 17.3l-.9.9M17.3 17.3l.9.9" />
      <path d="M10.5 12v1M13.5 12v1M11 15.5c.6.5 1.4.5 2 0" />
    </>
  ),
  // A lamb's head: woolly scalloped top, two ears, simple face.
  lamb: (
    <>
      <path d="M7.5 9a2 2 0 0 1 0-2.6 2 2 0 0 1 2.4-1.5 2.2 2.2 0 0 1 4.2 0A2 2 0 0 1 16.5 6.4 2 2 0 0 1 16.5 9" />
      <path d="M8 9a4 4 0 0 0 8 0" />
      <path d="M8 10.5C6 11 5.5 13 6.5 14M16 10.5c2 .5 2.5 2.5 1.5 3.5" />
      <ellipse cx="12" cy="13.5" rx="3" ry="3.5" />
      <path d="M10.7 13v.6M13.3 13v.6M11 15.4c.6.4 1.4.4 2 0" />
    </>
  ),
  // A royal crown: five points on a base band.
  crown: (
    <>
      <path d="M4 17l1.4-8 3.6 4 3-5 3 5 3.6-4L20 17z" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </>
  ),
  // A loaf of bread: rounded-top loaf with two score lines.
  bread: (
    <>
      <path d="M4 15a8 8 0 0 1 16 0v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
      <path d="M9 9.5l-1.5 3M14 9l-1.5 3.5" />
    </>
  ),
  // A grapevine branch: stem, leaf, and a cluster of small grapes.
  vine: (
    <>
      <path d="M12 4v3M12 7c-3 0-4 1.5-4 4" />
      <path d="M14 5.5c2-.5 3 .5 3 2.5-2 .3-3-.5-3-2.5z" />
      <circle cx="9" cy="13" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="13" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="10.5" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="18.8" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  // A water droplet: teardrop shape.
  water: (
    <path d="M12 3.5c3 4 5 6.5 5 9.5a5 5 0 0 1-10 0c0-3 2-5.5 5-9.5z" />
  ),
  // A door: tall panel with a small round knob.
  door: (
    <>
      <rect x="6" y="3.5" width="12" height="17" rx="0.5" />
      <circle cx="14.5" cy="12" r="0.9" fill="currentColor" stroke="none" />
    </>
  ),
  // A rock: an irregular faceted boulder.
  rock: (
    <>
      <polygon points="5,15 8,9 14,8 19,13 17,19 8,19" />
      <path d="M8,9 L11,13 L14,8 M11,13 L8,19 M11,13 L17,19" />
    </>
  ),
  // A bright five-point star (filled).
  star: (
    <polygon
      points="12,3 14.3,9 20.5,9 15.5,13 17.5,19 12,15.3 6.5,19 8.5,13 3.5,9 9.7,9"
      fill="currentColor"
      stroke="none"
    />
  ),
  // A sun: circle with radiating rays.
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M18 6l-1.4 1.4M7.4 16.6L6 18" />
    </>
  ),
  // An upright sword: blade, crossguard, and hilt.
  sword: (
    <>
      <line x1="12" y1="3" x2="12" y2="16" />
      <line x1="8.5" y1="16" x2="15.5" y2="16" />
      <line x1="12" y1="16" x2="12" y2="20" />
      <path d="M10 20h4" />
    </>
  ),
  // A shepherd's crook: tall staff with a curved hook at the top.
  shepherd: (
    <path d="M9 20V9a4 4 0 0 1 8 0" fill="none" />
  ),

  // A dove in flight: rounded body, small head, upswept wing.
  dove: (
    <>
      <path d="M4 16c3 1 6 .5 8-2 1.5-2 3.5-3 6-3-1 2-1 3.5-2.5 5-2.5 2.5-6.5 3-11.5.5z" />
      <path d="M11 12c1-2 3-3.5 6-4" />
      <circle cx="18.5" cy="8.5" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  // A flame: a single tongue of fire.
  fire: (
    <path d="M12 3.5c1 3 4 4 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5 1.5-3.5C10 9 10 7 12 3.5z" />
  ),
  // Wind / breath: three flowing swoosh lines.
  wind: (
    <>
      <path d="M4 9h9a2.2 2.2 0 1 0-2.2-2.2" />
      <path d="M4 13h13a2.4 2.4 0 1 1-2.4 2.4" />
      <path d="M4 17h6a1.8 1.8 0 1 1-1.8 1.8" />
    </>
  ),
  // A horn of anointing oil: tilted flask with a drop falling out.
  oil: (
    <>
      <path d="M6 8l9 3a3 3 0 0 1 2 4l-1 2a3 3 0 0 1-4 1.5L6 15z" />
      <path d="M6 8l-1.5-1.5" />
      <path d="M17.5 9c.8 1 .8 2 0 3-.8-1-.8-2 0-3z" fill="currentColor" stroke="none" />
    </>
  ),

  // A cloud of glory: rounded cumulus outline.
  cloud: (
    <path d="M7 18a3.5 3.5 0 0 1 0-7 4.5 4.5 0 0 1 8.7-1.3A3.5 3.5 0 0 1 17 18z" />
  ),
  // God is light: small circle with radiating rays.
  light: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" />
    </>
  ),
  // El Roi, the God who sees: an open eye with an iris.
  eye: (
    <>
      <path d="M3 12c3-4.5 6-6.5 9-6.5s6 2 9 6.5c-3 4.5-6 6.5-9 6.5s-6-2-9-6.5z" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    </>
  ),
  // A heraldic shield with a vertical divider.
  shield: (
    <>
      <path d="M12 3.5l7 2.5v6c0 4-3 6.5-7 8-4-1.5-7-4-7-8v-6z" />
      <line x1="12" y1="4.5" x2="12" y2="19" />
    </>
  ),
  // An eagle with outstretched wings: spread wing shape with head and body.
  eagle: (
    <>
      <path d="M3 9c3 .5 5 2 7 4.5M21 9c-3 .5-5 2-7 4.5" />
      <path d="M12 8.5v8" />
      <circle cx="12" cy="7" r="1.4" />
      <path d="M11 15.5l1 3 1-3" />
    </>
  ),
  // Alpha and Omega: a capital A letterform beside an Omega horseshoe.
  'alpha-omega': (
    <>
      <path d="M4 18l3-11 3 11M5 14h4" />
      <path d="M14 18v-2c-1.5-.6-2.5-2-2.5-3.7A3.5 3.5 0 0 1 15 8.5 3.5 3.5 0 0 1 18.5 12c0 1.7-1 3.1-2.5 3.7v2z" />
      <path d="M13 18h2M17 18h2" />
    </>
  ),
};

export const REACTION_ICON_NAMES = Object.keys(ICONS);

export default function ReactionIcon({ name, className = '', strokeWidth = 1.8, title }) {
  const inner = ICONS[name];
  if (!inner) return null;
  return (
    <svg
      viewBox={VIEWBOX}
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      aria-label={title || undefined}
      focusable="false"
      className={`inline-block shrink-0 ${className}`}
      style={{ verticalAlign: '-0.125em' }}
    >
      {title ? <title>{title}</title> : null}
      {inner}
    </svg>
  );
}
