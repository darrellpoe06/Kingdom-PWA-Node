// =============================================================================
// games/SpinnerWheel.jsx — the ACTUAL spinner (Christyn's ask, 2026-07-07)
// =============================================================================
// The game's spin was invisible: the engine's seeded spinWheel resolved
// instantly and the only trace was text ("Spin: 4"). This is the real wheel —
// six numbered wedges, a fixed pointer, and a decelerating turn that LANDS on
// the number the engine already spun. The animation is PRESENTATION ONLY over
// authoritative state (DR-0076): the value comes in as a prop from the engine's
// log; this component never rolls its own random.
//
// Shared across all three game surfaces: the single-player GamePlayer, the
// phone controller's spin overlay, and the big-screen board — one wheel,
// consistent everywhere (CONSISTENCY-STANDARD).
//
// Wedge colors are the game's token pastels with dark ink numbers (~10:1 on
// every wedge, past AA) — and NO true red: red is reserved for the Blood
// (Color Theology, DR-0099). Inline SVG so it is CSP-safe, offline, and scales
// crisply from a phone to the church LED wall. Respects prefers-reduced-motion
// (the wheel jumps straight to the result). role="img" + an aria-live
// announcement so the landing is heard, not just seen.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/gentle-motion.js';

const INK = '#12100E';
const CREAM = '#FAF8F4';

export const WHEEL_MIN = 1;
export const WHEEL_MAX = 6;
const WEDGE_COUNT = WHEEL_MAX - WHEEL_MIN + 1;
const WEDGE_DEG = 360 / WEDGE_COUNT;

// The token pastels (match.js TOKENS palette) — light grounds, dark ink numbers.
// No true red (DR-0099: the Blood's color marks nothing else).
export const WEDGE_COLORS = ['#f4b740', '#67e8f9', '#86efac', '#fb923c', '#c4b5fd', '#7dd3fc'];

// How long the wheel decelerates before it rests (ms). Exported so surfaces
// that veil a reveal behind the spin share the same clock.
export const SPIN_MS = 1800;

// Degrees clockwise from the pointer (12 o'clock) to the CENTER of a value's wedge.
export function wedgeAngle(value) {
  return (value - WHEEL_MIN) * WEDGE_DEG;
}

// Rotation (deg, clockwise) at which `value`'s wedge sits under the pointer.
function restRotation(value) {
  return ((360 - wedgeAngle(value)) % 360 + 360) % 360;
}

// Pure: the next accumulated rotation that lands `value` under the pointer,
// always spinning FORWARD at least three full turns from `current` — a real
// spin, never a twitch backwards. Deterministic, so the vitest suite pins it.
export function spinTargetRotation(current, value) {
  const targetMod = restRotation(value);
  const curMod = ((current % 360) + 360) % 360;
  const delta = ((targetMod - curMod) % 360 + 360) % 360;
  return current + 3 * 360 + delta;
}

// ---- geometry (precomputed once; pure trig, fixed precision) -----------------
function pt(angleDeg, r) {
  const a = (angleDeg * Math.PI) / 180;
  return [+(50 + r * Math.sin(a)).toFixed(3), +(50 - r * Math.cos(a)).toFixed(3)];
}

const WEDGES = Array.from({ length: WEDGE_COUNT }, (_, i) => {
  const value = WHEEL_MIN + i;
  const center = i * WEDGE_DEG;
  const [x1, y1] = pt(center - WEDGE_DEG / 2, 45);
  const [x2, y2] = pt(center + WEDGE_DEG / 2, 45);
  const [tx, ty] = pt(center, 29);
  return {
    value,
    color: WEDGE_COLORS[i % WEDGE_COLORS.length],
    path: `M50,50 L${x1},${y1} A45,45 0 0 1 ${x2},${y2} Z`,
    tx, ty,
    rotate: center,
  };
});

// ---- the wheel ----------------------------------------------------------------
// props:
//   value    — the engine's real spun number (null before the first spin)
//   spinSeq  — changes exactly when a NEW spin lands (e.g. the spin's log index);
//              the first value ever seen renders statically (a reloaded game
//              must not replay a historical spin)
//   spinning — indeterminate blur while waiting for the authoritative result
//              (the phone between "tap" and the host's snapshot)
//   animateFirst — animate even the FIRST value seen (for a surface that mounts
//              fresh per spin, like the phone's overlay, where the first value
//              genuinely is the new spin)
//   onRest   — called with the value once the wheel has settled
export default function SpinnerWheel({ value = null, spinSeq = null, spinning = false, animateFirst = false, size = '10rem', onRest, className = '' }) {
  const [rot, setRot] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [announce, setAnnounce] = useState('');
  const rotRef = useRef(0);
  const seqRef = useRef(undefined); // undefined = no value seen yet
  const restTimerRef = useRef(null);
  const onRestRef = useRef(onRest);
  onRestRef.current = onRest;

  const settle = useCallback((v) => {
    if (restTimerRef.current) { clearTimeout(restTimerRef.current); restTimerRef.current = null; }
    setAnimating(false);
    setAnnounce(`Spun ${v}`);
    if (onRestRef.current) onRestRef.current(v);
  }, []);

  useEffect(() => {
    if (value == null) return;
    const isFirst = seqRef.current === undefined;
    if (!isFirst && spinSeq === seqRef.current) return;
    seqRef.current = spinSeq;
    if (isFirst && !animateFirst) {
      // First value this mount: show it at rest, silently — a reloaded game
      // must not replay a historical spin.
      rotRef.current = restRotation(value);
      setRot(rotRef.current);
      return;
    }
    if (prefersReducedMotion()) {
      rotRef.current = restRotation(value);
      setRot(rotRef.current);
      settle(value);
      return;
    }
    rotRef.current = spinTargetRotation(rotRef.current, value);
    setRot(rotRef.current);
    setAnimating(true);
    // Fallback rest: transitionend can be swallowed (tab hidden, element
    // replaced) — the wheel must never leave a surface veiled forever.
    if (restTimerRef.current) clearTimeout(restTimerRef.current);
    restTimerRef.current = setTimeout(() => settle(value), SPIN_MS + 400);
  }, [value, spinSeq, animateFirst, settle]);

  useEffect(() => () => { if (restTimerRef.current) clearTimeout(restTimerRef.current); }, []);

  const label = value == null
    ? 'Spinner wheel, not yet spun'
    : `Spinner wheel showing ${value}`;

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }} role="img" aria-label={label}>
      <div
        className={`h-full w-full ${spinning ? 'animate-spin' : ''}`}
        style={spinning ? undefined : {
          transform: `rotate(${rot}deg)`,
          transition: animating ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.66, 0.15, 1)` : 'none',
          willChange: 'transform',
        }}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform' && animating && value != null) settle(value);
        }}
      >
        <svg viewBox="0 0 100 100" className="block h-full w-full">
          <circle cx="50" cy="50" r="47.5" fill={INK} />
          {WEDGES.map((w) => (
            <g key={w.value}>
              <path d={w.path} fill={w.color} stroke={INK} strokeWidth="1.5" />
              <text
                x={w.tx} y={w.ty}
                transform={`rotate(${w.rotate} ${w.tx} ${w.ty})`}
                textAnchor="middle" dominantBaseline="central"
                fontSize="13" fontWeight="700" fill={INK}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {w.value}
              </text>
            </g>
          ))}
          <circle cx="50" cy="50" r="9" fill={INK} stroke={CREAM} strokeWidth="1.5" />
          <circle cx="50" cy="50" r="2.4" fill={CREAM} />
        </svg>
      </div>
      {/* the fixed pointer — ink on a cream keel so it reads on dark AND light grounds */}
      <svg viewBox="0 0 20 14" aria-hidden="true" className="absolute left-1/2" style={{ top: '-0.35rem', width: '17%', transform: 'translateX(-50%)' }}>
        <polygon points="2,1 18,1 10,13" fill={INK} stroke={CREAM} strokeWidth="1.6" />
      </svg>
      <span className="sr-only" aria-live="polite">{announce}</span>
    </div>
  );
}
