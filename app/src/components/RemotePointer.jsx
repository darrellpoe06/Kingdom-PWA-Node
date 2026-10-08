// =============================================================================
// RemotePointer — the pointer a D-pad moves, drawn on the page (DR-0802)
// =============================================================================
// Darrell 2026-10-07: "Make sure the app has a hovering pointer option for
// devices that use a remote... make sense?"
//
// The arithmetic and the key names live in lib/remote-pointer.js and are
// tested with real numbers. This owns the clock, the document and the dot:
// it listens for arrow keys, moves the dot, ramps while a key is held, and
// clicks what is under it on Enter. It renders nothing at all when the
// option is off, so a phone and a laptop never pay for it.
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  TICK_MS, movePointer, readKey, startAt, targetAt,
} from '../lib/remote-pointer.js';

export default function RemotePointer({ on = false, doc = null }) {
  const d = doc || (typeof document !== 'undefined' ? document : null);
  const [at, setAt] = useState(() => startAt(
    typeof window !== 'undefined' ? window.innerWidth : 0,
    typeof window !== 'undefined' ? window.innerHeight : 0,
  ));
  const [awake, setAwake] = useState(false);
  const [pressing, setPressing] = useState(false);
  const atRef = useRef(at);
  atRef.current = at;
  // Which direction is held, how many ticks it has been held, and the timer.
  const heldRef = useRef(null);
  const ticksRef = useRef(0);
  const timerRef = useRef(null);

  const stopTravel = useCallback(() => {
    heldRef.current = null;
    ticksRef.current = 0;
    if (timerRef.current != null) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const bounds = () => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const travel = useCallback((dir) => {
    heldRef.current = dir;
    ticksRef.current = 0;
    setAwake(true);
    setAt((p) => movePointer(p, dir, 0, bounds()));
    if (timerRef.current != null) return;
    timerRef.current = setInterval(() => {
      const held = heldRef.current;
      if (!held) { stopTravel(); return; }
      ticksRef.current += 1;
      setAt((p) => movePointer(p, held, ticksRef.current, bounds()));
    }, TICK_MS);
  }, [stopTravel]);

  const press = useCallback(() => {
    const el = targetAt(d, atRef.current.x, atRef.current.y);
    setPressing(true);
    setTimeout(() => setPressing(false), 140);
    if (!el) return;
    // Focus first, so a control that reads its own focus (and the person
    // watching) both know what was pressed, then click it.
    try { if (typeof el.focus === 'function') el.focus({ preventScroll: true }); } catch { /* ignore */ }
    try { el.click(); } catch { /* ignore */ }
  }, [d]);

  useEffect(() => {
    if (!on || !d) return undefined;
    const onKeyDown = (e) => {
      const act = readKey(e.key, { target: d.activeElement, on: true });
      if (!act) return;
      if (act.kind === 'move') { e.preventDefault(); travel(act.dir); return; }
      if (act.kind === 'click') {
        if (!awake) return; // the pointer is not up yet: leave Enter to the page
        e.preventDefault(); press(); return;
      }
      if (act.kind === 'dismiss' && awake) { setAwake(false); stopTravel(); }
    };
    const onKeyUp = (e) => { if (readKey(e.key, { target: d.activeElement, on: true })?.kind === 'move') stopTravel(); };
    const onBlur = () => stopTravel();
    d.addEventListener('keydown', onKeyDown);
    d.addEventListener('keyup', onKeyUp);
    if (typeof window !== 'undefined') window.addEventListener('blur', onBlur);
    return () => {
      d.removeEventListener('keydown', onKeyDown);
      d.removeEventListener('keyup', onKeyUp);
      if (typeof window !== 'undefined') window.removeEventListener('blur', onBlur);
      stopTravel();
    };
  }, [on, d, awake, travel, press, stopTravel]);

  // Switched off, or not woken yet: nothing is drawn and nothing is listened
  // for beyond the one keydown that wakes it.
  if (!on || !d || !d.body || !awake) return null;
  return createPortal(
    <div
      data-testid="remote-pointer"
      aria-hidden="true"
      className="tts-controls print:hidden pointer-events-none fixed z-[2147483000]"
      style={{
        left: `${at.x}px`, top: `${at.y}px`, width: '28px', height: '28px',
        marginLeft: '-14px', marginTop: '-14px', borderRadius: '9999px',
        border: '3px solid #1A1815',
        background: pressing ? '#B85838' : 'rgba(255,255,255,0.65)',
        boxShadow: '0 0 0 2px rgba(255,255,255,0.9), 0 2px 10px rgba(0,0,0,0.45)',
        transition: 'background 90ms linear',
      }}
    />,
    d.body,
  );
}
