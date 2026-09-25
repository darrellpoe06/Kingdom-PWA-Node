// =============================================================================
// FloatingReader — the reader popped out into a window you can move (DR-0641)
// =============================================================================
// Darrell 2026-09-24: "Maybe be a popout reader that floating around? Then can
// be reset back to normal?"
//
// A small window over the app: the paragraph being read, its spoken sentence
// lit and kept in view, back / play-pause / next, the speed, and Dock. Drag it
// by its title bar (touch or mouse), resize it from the corner, double-tap the
// title bar to put it back to its starting size and place. The app stays
// usable underneath, and because the reader lives in the app shell, the float
// stays through every tab change.
//
// It is a VIEW of the one reader: every button calls what the bar calls, and
// what it shows is the engine's real state. Where the browser offers a real
// always-on-top window (Document Picture-in-Picture, Chrome on a computer) it
// can go there too; everywhere else, including Android, it stays in the app.
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { clampRect } from '../lib/float-geometry.js';

const TAP_MS = 320;

function Controls({ isReading, isPaused, canJump, onPlayPause, onBack, onForward, rate, rateSteps, onRate }) {
  const playing = isReading && !isPaused;
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button type="button" className="min-h-[44px] min-w-[44px] px-2 flex items-center justify-center rounded border-2 border-[#1A1815] text-sm font-semibold text-[#1A1815] bg-white hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-40" onClick={onBack} disabled={!canJump} aria-label="Back a paragraph" data-testid="float-back">↩¶</button>
      <button type="button" className="min-h-[44px] min-w-[44px] px-2 flex items-center justify-center rounded border-2 border-[#1A1815] text-sm font-semibold text-white bg-[#1A1815] hover:bg-[#5A6E3D] focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-40" onClick={onPlayPause} aria-label={playing ? 'Pause' : 'Play'} data-testid="float-playpause">{playing ? '❚❚' : '▶'}</button>
      <button type="button" className="min-h-[44px] min-w-[44px] px-2 flex items-center justify-center rounded border-2 border-[#1A1815] text-sm font-semibold text-[#1A1815] bg-white hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-40" onClick={onForward} disabled={!canJump} aria-label="Forward a paragraph" data-testid="float-forward">↪¶</button>
      <label className="flex items-center">
        <span className="sr-only">Reading speed</span>
        <select value={String(rate)} onChange={(e) => onRate(Number(e.target.value))} aria-label="Reading speed" data-testid="float-speed"
          className="min-h-[44px] border-2 border-[#1A1815] rounded bg-white text-[#1A1815] text-sm px-1 focus:outline focus:outline-2 focus:outline-[#B85838]">
          {rateSteps.map((s) => <option key={s.value} value={String(s.value)}>{s.label}</option>)}
        </select>
      </label>
    </div>
  );
}

function Words({ sentences, placeholder }) {
  const boxRef = useRef(null);
  const current = sentences.findIndex((s) => s.current);
  // Keep the spoken sentence in view inside the float, gently.
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const el = box.querySelector('[data-current="true"]');
    if (!el) return;
    const top = el.offsetTop - box.offsetTop;
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = Math.max(0, top - 8);
    }
  }, [current, sentences.length]);
  return (
    <div ref={boxRef} data-testid="float-words" className="flex-1 min-h-0 overflow-y-auto px-3 py-2 text-[#1A1815] leading-relaxed" style={{ fontFamily: '"Fraunces", serif', fontSize: 'calc(1rem * var(--ts-chrome-scale, 1))' }}>
      {sentences.length ? sentences.map((s, i) => (
        <span key={i} data-current={s.current ? 'true' : undefined} className={s.current ? 'font-semibold underline decoration-[#5A6E3D] decoration-2 underline-offset-4' : ''}>{s.text} </span>
      )) : <span className="text-[#5A5751]">{placeholder}</span>}
    </div>
  );
}

export default function FloatingReader({
  rect, onMove, onCommit, onReset, onDock,
  title = 'Reading', sentences = [], placeholder = 'Press play to start reading.',
  pipSupported = false, onPip = null, pipWindow = null,
  ...controls
}) {
  const drag = useRef(null);
  const lastTap = useRef(0);

  // IN A REAL PICTURE-IN-PICTURE WINDOW: fill it, no dragging.
  if (pipWindow) {
    return createPortal(
      <div className="h-full flex flex-col bg-white" data-testid="float-pip">
        <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[#1A1815]">
          <span className="font-semibold truncate text-[#1A1815]">{title}</span>
          <button type="button" onClick={onDock} className="min-h-[44px] px-3 border-2 border-[#1A1815] rounded font-semibold text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" aria-label="Dock — back to the normal reader">⤓ Dock</button>
        </div>
        <Words sentences={sentences} placeholder={placeholder} />
        <div className="p-2 border-t border-[#E8E4DC]"><Controls {...controls} /></div>
      </div>,
      pipWindow.document.body,
    );
  }

  const vw = () => (typeof window !== 'undefined' ? window.innerWidth : 390);
  const vh = () => (typeof window !== 'undefined' ? window.innerHeight : 844);

  const start = (mode) => (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) { /* old browser */ }
    drag.current = { mode, sx: e.clientX, sy: e.clientY, r: { ...rect }, moved: false };
  };
  const move = (e) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx; const dy = e.clientY - d.sy;
    if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
    const next = d.mode === 'move'
      ? { ...d.r, x: d.r.x + dx, y: d.r.y + dy }
      : { ...d.r, w: d.r.w + dx, h: d.r.h + dy };
    onMove(clampRect(next, vw(), vh()));
  };
  const end = (e) => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    if (d.mode === 'move' && !d.moved) {
      // Double-tap the title bar: back to the starting size and place.
      const now = Date.now();
      if (now - lastTap.current < TAP_MS) { lastTap.current = 0; onReset(); return; }
      lastTap.current = now;
      return;
    }
    onCommit();
  };

  return createPortal(
    <div
      role="dialog" aria-label={`Floating reader — ${title}`} data-testid="floating-reader" data-read-skip=""
      className="tts-float fixed z-[85] flex flex-col bg-white border-2 border-[#1A1815] rounded-lg shadow-2xl print:hidden"
      style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
    >
      <div
        data-testid="float-titlebar"
        className="flex items-center gap-2 px-2 min-h-[44px] bg-[#1A1815] text-white rounded-t-md select-none cursor-move"
        style={{ touchAction: 'none' }}
        onPointerDown={start('move')} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
        onDoubleClick={onReset}
        title="Drag to move · double-tap to reset"
      >
        <span className="flex-1 truncate text-sm font-semibold" data-testid="float-title">{title}</span>
        {pipSupported && onPip && (
          <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={onPip} data-testid="float-pip-open" aria-label="Pop out of the app — a window that stays on top" className="min-h-[44px] px-2 text-xs uppercase tracking-wider font-semibold hover:text-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">Out of app</button>
        )}
        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={onDock} data-testid="float-dock" aria-label="Dock — back to the normal reader" className="min-h-[44px] px-2 text-xs uppercase tracking-wider font-semibold border border-white rounded hover:bg-white hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">⤓ Dock</button>
      </div>
      <Words sentences={sentences} placeholder={placeholder} />
      <div className="px-2 py-2 border-t border-[#E8E4DC]"><Controls {...controls} /></div>
      <div
        data-testid="float-resize" aria-hidden="true"
        className="absolute right-0 bottom-0 w-11 h-11 cursor-nwse-resize flex items-end justify-end p-1"
        style={{ touchAction: 'none' }}
        onPointerDown={start('size')} onPointerMove={move} onPointerUp={end} onPointerCancel={end}
      >
        <span className="block w-3 h-3 border-r-2 border-b-2 border-[#1A1815]" />
      </div>
    </div>,
    document.body,
  );
}
