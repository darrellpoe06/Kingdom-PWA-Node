// =============================================================================
// GameArt — dynamic, full-of-life illustrations for "our games"
// =============================================================================
// Graphics of Black / African American children and families inside the games
// (Darrell, 2026-07-06: "We also need graphics ... with black or African
// American looking children and families" — and, on the first pass, "that looks
// basic ... I want dynamic and full of life"). So these are SCENES in motion:
// a father lifting a laughing child overhead, children running up the road with
// their arms thrown open, a graduate tossing the cap in a burst of confetti —
// set against a living backdrop of sunrise, home and church steeple, hills,
// birds. Warm gradient shading gives the figures dimension; movement gives them
// life.
//
// Built as INLINE SVG so they are CSP-safe, offline, theme-independent (each
// sits on its own warm panel that reads on the cream light theme AND the
// midnight theme) and scale crisply from a phone to the church LED wall.
//
// DIGNITY IS A BINDING RULE, not a preference. The Generations header is explicit
// — "DIGNIFIED and true, never caricature" — and COMMUNITY-FIRST + VISION-
// FAIRNESS govern how this community is depicted. So: a RANGE of rich brown skin
// tones, natural hair worn with pride (afro, afro-puffs, cornrows/braids, locs,
// a fresh fade, a head wrap), joyful expressive faces, whole families in motion
// — and deliberately NONE of the exaggerated features that make caricature.
// COLOR THEOLOGY (DR-0099): true red is reserved for the Blood and is NOT used as
// a decorative color here — the warm accents are terracotta/coral, gold, green,
// indigo and plum. Framing is Darrell + Bishop's to govern; flagged for review.
//
// Accessibility: every illustration is role="img" with an aria-label + <title>.
// =============================================================================
import React from 'react';

// ---- palette (artwork colors, not theme tokens) -----------------------------
const SKIN = ['#5F4230', '#7A5237', '#8F5E3D', '#A56E45', '#BE855A']; // deep -> light, all rich brown
const SKIN_HI = ['#7A5941', '#96694A', '#AB7A52', '#C1885B', '#D6A074']; // matched highlights (lit side)
const SKIN_LO = ['#402C1D', '#553824', '#66442C', '#774E31', '#8E6440']; // matched shade side (form shadow)
const HAIR = '#231A15';
const HAIR2 = '#3B2A20';
const C = { terracotta: '#C15C3A', coral: '#E08A5B', olive: '#5E7A3A', green: '#4E7C4E', slate: '#54697C', indigo: '#3E4E86', gold: '#D6A63C', plum: '#7C4D66', cream: '#F5E9D8' };
// pattern-band colors — NO true red (Blood is reserved; DR-0099)
const BAND = [C.gold, C.green, C.indigo, C.coral, C.plum];

let _uid = 0;
const uid = (p) => `${p}${(_uid = (_uid + 1) % 100000)}`;

// ---- shared gradient/pattern defs --------------------------------------------
function SceneDefs({ sky = ['#FCEBCF', '#F6D7AE'], id }) {
  return (
    <defs>
      <linearGradient id={`sky-${id}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={sky[0]} />
        <stop offset="1" stopColor={sky[1]} />
      </linearGradient>
      <radialGradient id={`sun-${id}`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FFF6DF" />
        <stop offset="0.6" stopColor="#FFDF9E" />
        <stop offset="1" stopColor="#FFDF9E" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}

// ---- hair (natural styles, with a little volume + shine) --------------------
function Hair({ style, cx, cy, r, color = HAIR }) {
  const shine = '#4A382C';
  switch (style) {
    case 'afro':
      return (
        <g>
          <circle cx={cx} cy={cy - r * 0.3} r={r * 1.32} fill={color} />
          <circle cx={cx - r * 0.45} cy={cy - r * 0.7} r={r * 0.4} fill={shine} opacity="0.5" />
        </g>
      );
    case 'puffs':
      return (
        <g>
          <path d={`M${cx - r} ${cy - r * 0.4} A${r} ${r} 0 0 1 ${cx + r} ${cy - r * 0.4} Z`} fill={color} />
          <circle cx={cx - r * 1.12} cy={cy - r * 0.85} r={r * 0.7} fill={color} />
          <circle cx={cx + r * 1.12} cy={cy - r * 0.85} r={r * 0.7} fill={color} />
          <circle cx={cx - r * 1.25} cy={cy - r * 1.0} r={r * 0.24} fill={shine} opacity="0.6" />
          <circle cx={cx + r * 1.0} cy={cy - r * 1.05} r={r * 0.24} fill={shine} opacity="0.6" />
        </g>
      );
    case 'fade':
      return <path d={`M${cx - r} ${cy - r * 0.05} A${r} ${r * 0.95} 0 0 1 ${cx + r} ${cy - r * 0.05} L${cx + r} ${cy - r * 0.5} A${r} ${r} 0 0 0 ${cx - r} ${cy - r * 0.5} Z`} fill={color} />;
    case 'locs':
      return (
        <g fill={color}>
          <path d={`M${cx - r} ${cy - r * 0.2} A${r} ${r} 0 0 1 ${cx + r} ${cy - r * 0.2} Z`} />
          {[-0.85, -0.5, -0.15, 0.2, 0.55, 0.85].map((f, i) => (
            <rect key={i} x={cx + f * r - r * 0.1} y={cy - r * 0.2} width={r * 0.2} height={r * (1.6 + (i % 2) * 0.3)} rx={r * 0.1} />
          ))}
        </g>
      );
    case 'braids':
      return (
        <g>
          <path d={`M${cx - r} ${cy - r * 0.15} A${r} ${r} 0 0 1 ${cx + r} ${cy - r * 0.15} Z`} fill={color} />
          {[-0.7, -0.4, -0.1, 0.2, 0.5, 0.78].map((f, i) => (
            <g key={i}>
              <rect x={cx + f * r - r * 0.06} y={cy - r * 0.15} width={r * 0.12} height={r * 1.3} rx={r * 0.06} fill={color} />
              <circle cx={cx + f * r} cy={cy + r * 1.15} r={r * 0.11} fill={C.gold} />
            </g>
          ))}
        </g>
      );
    case 'wrap':
      return (
        <g>
          <path d={`M${cx - r} ${cy - r * 0.05} A${r} ${r} 0 0 1 ${cx + r} ${cy - r * 0.05} Z`} fill={C.gold} />
          <path d={`M${cx - r} ${cy - r * 0.05} Q${cx} ${cy - r * 1.55} ${cx + r} ${cy - r * 0.05} Z`} fill={C.plum} />
          <path d={`M${cx - r * 0.2} ${cy - r * 1.15} q${r * 0.6} ${-r * 0.2} ${r * 0.95} ${r * 0.15}`} fill="none" stroke={C.gold} strokeWidth={r * 0.18} strokeLinecap="round" />
          <path d={`M${cx + r * 0.55} ${cy - r * 0.95} l${r * 0.55} ${-r * 0.35} l${r * 0.08} ${r * 0.5} Z`} fill={C.coral} />
        </g>
      );
    case 'coils':
      return (
        <g fill={color}>
          <circle cx={cx} cy={cy - r * 0.32} r={r * 1.16} />
          {[-0.7, -0.28, 0.28, 0.7].map((f, i) => <circle key={i} cx={cx + f * r} cy={cy - r * 1.18} r={r * 0.22} />)}
        </g>
      );
    default:
      return <circle cx={cx} cy={cy - r * 0.25} r={r * 1.2} fill={color} />;
  }
}

// ---- a limb (rounded capsule) ------------------------------------------------
const Limb = ({ x1, y1, x2, y2, w, color }) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round" />
);

// ---- a face with life (brows, bright open smile, cheeks) --------------------
function Face({ cx, cy, r, skin }) {
  return (
    <g>
      {/* soft cheeks */}
      <circle cx={cx - r * 0.5} cy={cy + r * 0.32} r={r * 0.16} fill="#C56A4A" opacity="0.28" />
      <circle cx={cx + r * 0.5} cy={cy + r * 0.32} r={r * 0.16} fill="#C56A4A" opacity="0.28" />
      {/* brows */}
      <path d={`M${cx - r * 0.55} ${cy - r * 0.2} q${r * 0.2} ${-r * 0.16} ${r * 0.38} 0`} fill="none" stroke="#231A15" strokeWidth={r * 0.08} strokeLinecap="round" />
      <path d={`M${cx + r * 0.17} ${cy - r * 0.2} q${r * 0.18} ${-r * 0.16} ${r * 0.38} 0`} fill="none" stroke="#231A15" strokeWidth={r * 0.08} strokeLinecap="round" />
      {/* eyes */}
      <circle cx={cx - r * 0.36} cy={cy + r * 0.02} r={r * 0.11} fill="#231A15" />
      <circle cx={cx + r * 0.36} cy={cy + r * 0.02} r={r * 0.11} fill="#231A15" />
      <circle cx={cx - r * 0.32} cy={cy - r * 0.02} r={r * 0.035} fill="#fff" />
      <circle cx={cx + r * 0.4} cy={cy - r * 0.02} r={r * 0.035} fill="#fff" />
      {/* bright open smile */}
      <path d={`M${cx - r * 0.38} ${cy + r * 0.4} Q${cx} ${cy + r * 0.9} ${cx + r * 0.38} ${cy + r * 0.4} Q${cx} ${cy + r * 0.62} ${cx - r * 0.38} ${cy + r * 0.4} Z`} fill="#3A2018" />
      <path d={`M${cx - r * 0.24} ${cy + r * 0.5} Q${cx} ${cy + r * 0.62} ${cx + r * 0.24} ${cy + r * 0.5} L${cx + r * 0.24} ${cy + r * 0.46} Q${cx} ${cy + r * 0.5} ${cx - r * 0.24} ${cy + r * 0.46} Z`} fill="#fff" opacity="0.92" />
    </g>
  );
}

// ---- a person in motion ------------------------------------------------------
// pose: 'cheer' | 'wave' | 'run' | 'jump' | 'lift' | 'reach' | 'clap' | 'stand'
function Person({ x = 0, y = 0, scale = 1, skin = SKIN[2], hi, hair = 'afro', hairColor = HAIR, cloth = C.terracotta, pose = 'stand', band = true }) {
  const r = 13 * scale;
  const cx = x, cy = y;
  const shHi = hi || SKIN_HI[SKIN.indexOf(skin)] || SKIN_HI[2];
  const shLo = SKIN_LO[SKIN.indexOf(skin)] || SKIN_LO[2];
  const armW = r * 0.42, legW = r * 0.5;
  const shoulderY = cy + r * 1.5;
  const hipY = cy + r * 3.0;
  const sx = r * 1.05; // shoulder half-width

  // arm + leg endpoints per pose
  let arms, legs, torsoLean = 0;
  const L = (x1, y1, x2, y2, w, color) => <Limb key={`${x1}${y1}${x2}${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} w={w} color={color} />;
  const hand = (hx, hy) => <circle key={`h${hx}${hy}`} cx={hx} cy={hy} r={armW * 0.6} fill={skin} />;

  switch (pose) {
    case 'cheer':
      arms = [L(cx - sx, shoulderY, cx - sx * 1.7, cy - r * 1.1, armW, skin), L(cx + sx, shoulderY, cx + sx * 1.7, cy - r * 1.1, armW, skin), hand(cx - sx * 1.7, cy - r * 1.1), hand(cx + sx * 1.7, cy - r * 1.1)];
      legs = [L(cx - r * 0.5, hipY, cx - r * 0.7, hipY + r * 1.7, legW, cloth), L(cx + r * 0.5, hipY, cx + r * 0.7, hipY + r * 1.7, legW, cloth)];
      break;
    case 'wave':
      arms = [L(cx - sx, shoulderY, cx - sx * 1.5, shoulderY + r * 1.1, armW, skin), L(cx + sx, shoulderY, cx + sx * 1.8, cy - r * 1.0, armW, skin), hand(cx - sx * 1.5, shoulderY + r * 1.1), hand(cx + sx * 1.8, cy - r * 1.0)];
      legs = [L(cx - r * 0.5, hipY, cx - r * 0.6, hipY + r * 1.7, legW, cloth), L(cx + r * 0.5, hipY, cx + r * 0.6, hipY + r * 1.7, legW, cloth)];
      break;
    case 'run':
      torsoLean = r * 0.5;
      arms = [L(cx - sx, shoulderY, cx - sx * 1.9, shoulderY + r * 0.4, armW, skin), L(cx + sx, shoulderY, cx + sx * 1.7, shoulderY - r * 0.6, armW, skin), hand(cx - sx * 1.9, shoulderY + r * 0.4), hand(cx + sx * 1.7, shoulderY - r * 0.6)];
      legs = [L(cx - r * 0.3, hipY, cx - r * 1.5, hipY + r * 1.5, legW, cloth), L(cx + r * 0.4, hipY, cx + r * 1.4, hipY + r * 1.2, legW, cloth), hand(cx - r * 1.5, hipY + r * 1.5), hand(cx + r * 1.4, hipY + r * 1.2)];
      break;
    case 'jump':
      arms = [L(cx - sx, shoulderY, cx - sx * 1.8, cy - r * 1.2, armW, skin), L(cx + sx, shoulderY, cx + sx * 1.8, cy - r * 1.2, armW, skin), hand(cx - sx * 1.8, cy - r * 1.2), hand(cx + sx * 1.8, cy - r * 1.2)];
      legs = [L(cx - r * 0.5, hipY, cx - r * 1.3, hipY + r * 1.0, legW, cloth), L(cx + r * 0.5, hipY, cx + r * 1.3, hipY + r * 1.0, legW, cloth)];
      break;
    case 'lift': // arms straight up (holding a child placed above by the scene)
      arms = [L(cx - sx * 0.7, shoulderY, cx - r * 0.6, cy - r * 1.6, armW, skin), L(cx + sx * 0.7, shoulderY, cx + r * 0.6, cy - r * 1.6, armW, skin), hand(cx - r * 0.6, cy - r * 1.6), hand(cx + r * 0.6, cy - r * 1.6)];
      legs = [L(cx - r * 0.5, hipY, cx - r * 0.7, hipY + r * 1.7, legW, cloth), L(cx + r * 0.5, hipY, cx + r * 0.7, hipY + r * 1.7, legW, cloth)];
      break;
    case 'reach':
      arms = [L(cx - sx, shoulderY, cx - sx * 2.0, shoulderY - r * 0.5, armW, skin), L(cx + sx, shoulderY, cx + sx * 2.0, shoulderY - r * 0.5, armW, skin), hand(cx - sx * 2.0, shoulderY - r * 0.5), hand(cx + sx * 2.0, shoulderY - r * 0.5)];
      legs = [L(cx - r * 0.5, hipY, cx - r * 0.7, hipY + r * 1.7, legW, cloth), L(cx + r * 0.5, hipY, cx + r * 0.7, hipY + r * 1.7, legW, cloth)];
      break;
    case 'clap':
      arms = [L(cx - sx, shoulderY, cx - r * 0.2, shoulderY + r * 0.6, armW, skin), L(cx + sx, shoulderY, cx + r * 0.2, shoulderY + r * 0.6, armW, skin), hand(cx, shoulderY + r * 0.65)];
      legs = [L(cx - r * 0.5, hipY, cx - r * 0.6, hipY + r * 1.7, legW, cloth), L(cx + r * 0.5, hipY, cx + r * 0.6, hipY + r * 1.7, legW, cloth)];
      break;
    default:
      arms = [L(cx - sx, shoulderY, cx - sx * 1.15, hipY, armW, skin), L(cx + sx, shoulderY, cx + sx * 1.15, hipY, armW, skin), hand(cx - sx * 1.15, hipY), hand(cx + sx * 1.15, hipY)];
      legs = [L(cx - r * 0.5, hipY, cx - r * 0.6, hipY + r * 1.7, legW, cloth), L(cx + r * 0.5, hipY, cx + r * 0.6, hipY + r * 1.7, legW, cloth)];
  }

  const gid = uid('sk');
  const airborne = pose === 'jump';
  return (
    <g>
      <defs>
        {/* directional light: a lit-sphere radial with the light up-and-left, so
            the head reads round (highlight -> midtone -> form shadow), not flat —
            the "baked directional light" step up from a flat fill. */}
        <radialGradient id={gid} cx="0.36" cy="0.3" r="0.85">
          <stop offset="0" stopColor={shHi} />
          <stop offset="0.55" stopColor={skin} />
          <stop offset="1" stopColor={shLo} />
        </radialGradient>
      </defs>
      {/* baked contact shadow — grounds the figure in the scene's light (the
          same "fake shadow under the character" trick the lighting video shows;
          baked light, no runtime cost). Fainter + lower when airborne. */}
      <ellipse cx={cx} cy={hipY + r * (airborne ? 2.6 : 2.05)} rx={r * (airborne ? 1.15 : 1.5)} ry={r * 0.4} fill="#2A1A10" opacity={airborne ? 0.12 : 0.22} />
      {legs}
      {/* torso */}
      <path d={`M${cx - sx + torsoLean} ${shoulderY} Q${cx + torsoLean} ${shoulderY - r * 0.4} ${cx + sx + torsoLean} ${shoulderY} L${cx + r * 0.85} ${hipY} Q${cx} ${hipY + r * 0.4} ${cx - r * 0.85} ${hipY} Z`} fill={cloth} />
      {band && <g>{[0, 1, 2, 3, 4].map((i) => <rect key={i} x={cx - r * 0.85 + i * (r * 1.7 / 5)} y={hipY - r * 0.55} width={r * 1.7 / 5 - 0.6} height={r * 0.5} fill={BAND[i % BAND.length]} opacity="0.9" />)}</g>}
      {arms}
      {/* neck */}
      <rect x={cx - r * 0.3} y={cy + r * 0.75} width={r * 0.6} height={r * 0.9} rx={r * 0.28} fill={skin} />
      <Hair style={hair} cx={cx} cy={cy} r={r} color={hairColor} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${gid})`} />
      {/* rim-light on the sun-facing (upper-left) edge — the catch of light that
          sells the direction of the source */}
      <path d={`M${cx - r * 0.92} ${cy - r * 0.38} A${r} ${r} 0 0 1 ${cx - r * 0.12} ${cy - r * 0.99}`} fill="none" stroke="#FFEBCB" strokeWidth={r * 0.15} strokeLinecap="round" opacity="0.5" />
      {(hair === 'afro' || hair === 'coils' || hair === 'puffs') && (
        <path d={`M${cx - r} ${cy - r * 0.1} A${r} ${r} 0 0 1 ${cx + r} ${cy - r * 0.1}`} fill="none" stroke={hairColor} strokeWidth={r * 0.45} strokeLinecap="round" />
      )}
      <Face cx={cx} cy={cy} r={r} skin={skin} />
    </g>
  );
}

// ---- scenery -----------------------------------------------------------------
const Sun = ({ cx, cy, r, id }) => (
  <g>
    {/* layered bloom — a wide soft halo under a brighter core (baked glow) */}
    <circle cx={cx} cy={cy} r={r * 3.6} fill={`url(#sun-${id})`} opacity="0.5" />
    <circle cx={cx} cy={cy} r={r * 2.2} fill={`url(#sun-${id})`} />
    {/* god-rays: long faint light shafts fanning out from the source */}
    {Array.from({ length: 9 }).map((_, i) => {
      const a = (i / 9) * Math.PI * 2 + 0.2;
      const len = r * (5 + (i % 3) * 2.2);
      return (
        <path key={`ray${i}`}
          d={`M${cx} ${cy} L${cx + Math.cos(a - 0.05) * len} ${cy + Math.sin(a - 0.05) * len} L${cx + Math.cos(a + 0.05) * len} ${cy + Math.sin(a + 0.05) * len} Z`}
          fill="#FFE6A6" opacity="0.14" />
      );
    })}
    {Array.from({ length: 12 }).map((_, i) => {
      const a = (i / 12) * Math.PI * 2;
      return <line key={i} x1={cx + Math.cos(a) * r * 1.25} y1={cy + Math.sin(a) * r * 1.25} x2={cx + Math.cos(a) * r * 1.75} y2={cy + Math.sin(a) * r * 1.75} stroke="#FFCF7A" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />;
    })}
    <circle cx={cx} cy={cy} r={r * 1.15} fill="#FFF3D0" opacity="0.7" />
    <circle cx={cx} cy={cy} r={r} fill="#FFE9B0" />
  </g>
);
// A faint atmospheric haze band at the horizon — distant things sit in light air.
const Haze = ({ w, h }) => <rect x="0" y={h * 0.58} width={w} height={h * 0.16} fill="#FFFCF4" opacity="0.28" />;
const Birds = ({ pts }) => (
  <g fill="none" stroke="#6B5A48" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
    {pts.map(([x, y, s], i) => <path key={i} d={`M${x} ${y} q${3 * s} ${-3 * s} ${6 * s} 0 q${3 * s} ${-3 * s} ${6 * s} 0`} />)}
  </g>
);
const Confetti = ({ items }) => (
  <g>{items.map(([x, y, c, r], i) => <rect key={i} x={x} y={y} width={r} height={r} rx={r * 0.25} fill={c} transform={`rotate(${(i * 47) % 360} ${x} ${y})`} />)}</g>
);
const Sparkle = ({ x, y, s = 4, c = '#FFF0C4' }) => (
  <path d={`M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`} fill={c} />
);
const Flowers = ({ pts }) => (
  <g>{pts.map(([x, y, c], i) => (
    <g key={i}>
      <line x1={x} y1={y} x2={x} y2={y - 8} stroke={C.green} strokeWidth="1.6" />
      {[0, 1, 2, 3, 4].map((k) => { const a = (k / 5) * Math.PI * 2; return <circle key={k} cx={x + Math.cos(a) * 2.6} cy={y - 8 + Math.sin(a) * 2.6} r="2.1" fill={c} />; })}
      <circle cx={x} cy={y - 8} r="1.6" fill={C.gold} />
    </g>
  ))}</g>
);

// A living backdrop shared across scenes: sky, sun, hills, home + church, birds.
function Village({ w, h, id, sunAt = [0.5, 0.72] }) {
  const [sxr, syr] = sunAt;
  return (
    <g>
      <rect x="0" y="0" width={w} height={h} fill={`url(#sky-${id})`} />
      <Sun cx={w * sxr} cy={h * syr} r={13} id={id} />
      <Haze w={w} h={h} />
      <Birds pts={[[w * 0.16, h * 0.2, 1], [w * 0.24, h * 0.16, 0.8], [w * 0.8, h * 0.22, 1]]} />
      {/* far hill */}
      <path d={`M0 ${h * 0.72} Q${w * 0.3} ${h * 0.58} ${w * 0.6} ${h * 0.7} T${w} ${h * 0.68} V${h} H0 Z`} fill={C.olive} opacity="0.55" />
      {/* home + church on the near hill */}
      <g>
        <rect x={w * 0.12} y={h * 0.6} width={w * 0.14} height={h * 0.2} fill={C.coral} />
        <path d={`M${w * 0.12} ${h * 0.6} L${w * 0.19} ${h * 0.5} L${w * 0.26} ${h * 0.6} Z`} fill={C.terracotta} />
        <rect x={w * 0.155} y={h * 0.66} width={w * 0.03} height={h * 0.14} fill={C.cream} opacity="0.8" />
        {/* church with steeple */}
        <rect x={w * 0.74} y={h * 0.58} width={w * 0.12} height={h * 0.22} fill={C.cream} />
        <path d={`M${w * 0.74} ${h * 0.58} L${w * 0.8} ${h * 0.49} L${w * 0.86} ${h * 0.58} Z`} fill={C.slate} />
        <rect x={w * 0.79} y={h * 0.4} width={w * 0.02} height={h * 0.12} fill={C.slate} />
        <line x1={w * 0.8} y1={h * 0.38} x2={w * 0.8} y2={h * 0.44} stroke={C.gold} strokeWidth="2" />
        <line x1={w * 0.785} y1={h * 0.405} x2={w * 0.815} y2={h * 0.405} stroke={C.gold} strokeWidth="2" />
      </g>
      {/* tree — tucked into a gap so it never sits behind a figure's head */}
      <g>
        <rect x={w * 0.44} y={h * 0.56} width="4" height={h * 0.16} fill="#6B4A2E" />
        <circle cx={w * 0.445} cy={h * 0.5} r={h * 0.085} fill={C.green} />
        <circle cx={w * 0.41} cy={h * 0.545} r={h * 0.06} fill={C.olive} />
        <circle cx={w * 0.48} cy={h * 0.545} r={h * 0.06} fill={C.olive} />
      </g>
      {/* near hill (baseline the figures stand on) */}
      <path d={`M0 ${h * 0.82} Q${w * 0.5} ${h * 0.74} ${w} ${h * 0.82} V${h} H0 Z`} fill={C.green} />
    </g>
  );
}

function Panel({ children, viewBox, label, className = '' }) {
  return (
    <div className={`overflow-hidden rounded-lg ${className}`} role="img" aria-label={label}>
      <svg viewBox={viewBox} width="100%" className="block" preserveAspectRatio="xMidYMid meet">
        <title>{label}</title>
        {children}
      </svg>
    </div>
  );
}

// ---- FamilyPortrait — three generations, alive and together -----------------
export function FamilyPortrait({ className = '' }) {
  const id = uid('fp');
  const base = 150; // near-hill baseline
  return (
    <Panel viewBox="0 0 320 185" label="A joyful Black family of three generations celebrating together outdoors" className={className}>
      <SceneDefs id={id} />
      <Village w={320} h={185} id={id} sunAt={[0.5, 0.62]} />
      <Confetti items={[[40, 40, C.gold, 5], [90, 28, C.coral, 4], [150, 22, C.indigo, 5], [210, 30, C.green, 4], [270, 42, C.plum, 5], [300, 60, C.gold, 4], [20, 70, C.coral, 4]]} />
      <Sparkle x={120} y={54} s={5} /><Sparkle x={235} y={60} s={4} />
      {/* grandmother clapping */}
      <Person x={44} y={base - 30} scale={1.05} skin={SKIN[0]} hair="wrap" cloth={C.plum} pose="clap" />
      {/* father lifting a laughing child overhead */}
      <Person x={112} y={base - 26} scale={1.3} skin={SKIN[1]} hair="fade" cloth={C.slate} pose="lift" />
      <Person x={112} y={base - 92} scale={0.72} skin={SKIN[4]} hair="coils" cloth={C.gold} pose="cheer" band={false} />
      {/* mother waving */}
      <Person x={196} y={base - 28} scale={1.24} skin={SKIN[3]} hair="braids" hairColor={HAIR2} cloth={C.terracotta} pose="wave" />
      {/* boy jumping for joy */}
      <Person x={250} y={base - 40} scale={0.9} skin={SKIN[2]} hair="afro" cloth={C.green} pose="jump" />
      {/* girl running in */}
      <Person x={294} y={base - 20} scale={0.82} skin={SKIN[4]} hair="puffs" cloth={C.coral} pose="run" />
      <Flowers pts={[[16, 178, C.coral], [70, 182, C.gold], [160, 181, C.plum], [232, 183, C.indigo], [300, 179, C.gold]]} />
    </Panel>
  );
}

// ---- JourneyStart — children running the road toward a rising sun -----------
export function JourneyStart({ className = '' }) {
  const id = uid('js');
  return (
    <Panel viewBox="0 0 320 150" label="Black children running joyfully up a road toward a rising sun" className={className}>
      <SceneDefs id={id} sky={['#FBE6C9', '#F7D3A0']} />
      <rect x="0" y="0" width="320" height="150" fill={`url(#sky-${id})`} />
      <Sun cx={168} cy={54} r={15} id={id} />
      <Birds pts={[[40, 26, 1], [58, 20, 0.8], [250, 30, 1], [266, 24, 0.8]]} />
      <path d="M0 150 Q120 132 150 92 T176 44" fill="none" stroke={C.green} strokeWidth="34" strokeLinecap="round" opacity="0.9" />
      <path d="M0 150 Q120 132 150 92 T176 44" fill="none" stroke="#EBCF98" strokeWidth="16" strokeLinecap="round" strokeDasharray="2 12" opacity="0.9" />
      {/* running children, staggered for depth; small motion lines behind */}
      <g stroke="#E7C88C" strokeWidth="2" strokeLinecap="round" opacity="0.7"><line x1="26" y1="120" x2="44" y2="120" /><line x1="20" y1="128" x2="40" y2="128" /></g>
      <Person x={70} y={96} scale={1.15} skin={SKIN[1]} hair="afro" cloth={C.terracotta} pose="run" />
      <Person x={126} y={86} scale={0.95} skin={SKIN[3]} hair="puffs" cloth={C.indigo} pose="run" />
      <Person x={176} y={72} scale={0.82} skin={SKIN[0]} hair="locs" cloth={C.gold} pose="cheer" />
      <Person x={214} y={64} scale={0.66} skin={SKIN[4]} hair="coils" cloth={C.green} pose="run" band={false} />
      <Sparkle x={150} y={44} s={5} /><Sparkle x={196} y={52} s={4} />
      <Flowers pts={[[30, 146, C.coral], [96, 148, C.gold], [240, 140, C.plum], [300, 146, C.gold]]} />
    </Panel>
  );
}

// ---- PathEmblem — a dynamic per-road badge ----------------------------------
const EMBLEM = {
  college: { hair: 'braids', skin: SKIN[3], cloth: C.slate, pose: 'cheer', label: 'A Black graduate tossing the cap in celebration' },
  trade: { hair: 'fade', skin: SKIN[1], cloth: C.olive, pose: 'wave', label: 'A Black tradesperson at work, tool raised' },
  entrepreneur: { hair: 'afro', skin: SKIN[0], cloth: C.terracotta, pose: 'reach', label: 'A Black business owner welcoming you to the shop' },
  ministry: { hair: 'wrap', skin: SKIN[2], cloth: C.plum, pose: 'cheer', label: 'A Black servant-leader with hands lifted, a dove above' },
};

export function PathEmblem({ pathId, size = 60 }) {
  const cfg = EMBLEM[pathId] || { hair: 'afro', skin: SKIN[2], cloth: C.terracotta, pose: 'wave', label: 'A figure on the road' };
  const id = uid('em');
  return (
    <div className="shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size }} role="img" aria-label={cfg.label}>
      <svg viewBox="0 0 68 68" width={size} height={size} className="block">
        <title>{cfg.label}</title>
        <SceneDefs id={id} sky={['#FCEBCF', '#F6D7AE']} />
        <circle cx="34" cy="34" r="34" fill={`url(#sky-${id})`} />
        <Sun cx="34" cy="30" r="8" id={id} />
        <path d="M2 52 Q34 44 66 52 V68 H2 Z" fill={C.green} />
        <g transform="translate(0,3)">
          <Person x={34} y={32} scale={0.98} skin={cfg.skin} hair={cfg.hair} cloth={cfg.cloth} pose={cfg.pose} />
          {pathId === 'college' && <><rect x="24" y="8" width="20" height="4" fill={HAIR} transform="rotate(-16 34 10)" /><path d="M28 9 L40 5 L46 9 L34 13 Z" fill={HAIR} transform="rotate(-16 34 10)" /><Confetti items={[[16, 16, C.gold, 3], [50, 14, C.coral, 3], [12, 30, C.indigo, 3], [54, 30, C.plum, 3]]} /></>}
          {pathId === 'trade' && <g stroke={HAIR} strokeWidth="3" strokeLinecap="round"><line x1="49" y1="12" x2="56" y2="20" /><rect x="52" y="8" width="7" height="6" rx="1" fill={C.gold} stroke="none" /><g stroke="#FFE9B0" strokeWidth="1.4"><line x1="58" y1="6" x2="61" y2="3" /><line x1="60" y1="9" x2="63" y2="8" /></g></g>}
          {pathId === 'entrepreneur' && <><rect x="8" y="10" width="52" height="7" rx="1" fill={C.terracotta} />{[12, 22, 32, 42, 52].map((x) => <rect key={x} x={x} y="10" width="5" height="7" fill={C.cream} opacity="0.55" />)}<text x="34" y="16" textAnchor="middle" fontSize="4" fill={C.cream} fontFamily="sans-serif">OPEN</text></>}
          {pathId === 'ministry' && <g><path d="M34 4 C31 9 25 10 25 14 C25 17 34 19 34 19 C34 19 43 17 43 14 C43 10 37 9 34 4 Z" fill={C.cream} stroke={C.gold} strokeWidth="1" /><path d="M46 10 q4 -2 7 1" fill="none" stroke={C.cream} strokeWidth="2" strokeLinecap="round" /></g>}
        </g>
      </svg>
    </div>
  );
}

export default { FamilyPortrait, JourneyStart, PathEmblem };
