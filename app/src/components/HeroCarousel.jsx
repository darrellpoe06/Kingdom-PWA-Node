// =============================================================================
// HeroCarousel — the big picture rotates the advertised apartments (DR-1236)
// =============================================================================
// Darrell, 2026-10-27: "The Poe Properties App does not advertise the images
// in the carousel of pictures... fix it."
//
// One slide at a time, the home's name on it, a segmented bar under it — one
// segment per slide, each a 44px tap — and autoplay that stops while a hand or
// a focus is on it and never starts for a reader who asked for reduced motion.
// The bytes come one picture at a time from the one public loader the cards
// use (loadVacancyPicture, DR-1016): the slide on screen and the next.
//
// With no slides the `fallback` (the door's own entryway photograph) is drawn
// EXACTLY as before, and `why` is said under it — never silently.
// =============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { loadVacancyPicture } from '../modules/properties/cloud.js';

export const HERO_EVERY_MS = 5000;

const reducedMotion = () => {
  try { return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

export default function HeroCarousel({ slides = [], fallback = null, why = '', autoplay = true, every = HERO_EVERY_MS }) {
  const [i, setI] = useState(0);
  const [held, setHeld] = useState(false);
  const [bytes, setBytes] = useState({}); // key -> src
  const asked = useRef(new Set());
  const n = slides.length;

  useEffect(() => { if (i >= n) setI(0); }, [i, n]);

  const ask = useCallback((s) => {
    if (!s || s.storagePath || asked.current.has(s.key)) return;
    asked.current.add(s.key);
    loadVacancyPicture(s.rentalId, s.photoId, 'thumb').then((r) => {
      if (r && r.ok && r.src) setBytes((cur) => ({ ...cur, [s.key]: r.src }));
    });
  }, []);
  useEffect(() => {
    if (!n) return;
    ask(slides[i % n]);
    if (n > 1) ask(slides[(i + 1) % n]);
  }, [slides, i, n, ask]);

  // Autoplay, paused by a hand or a focus, never for reduced motion.
  useEffect(() => {
    if (!autoplay || n < 2 || held || reducedMotion()) return undefined;
    const t = setInterval(() => setI((k) => (k + 1) % n), every);
    return () => clearInterval(t);
  }, [autoplay, n, held, every]);

  if (!n) {
    return (
      <>
        {fallback}
        {why ? <span className="pp-hero-why" data-testid="hero-fallback-why">{why}</span> : null}
      </>
    );
  }
  const s = slides[i % n];
  const src = s.storagePath || bytes[s.key] || '';
  return (
    <div
      className="pp-slides"
      data-testid="hero-carousel"
      data-slide={i % n}
      onPointerEnter={() => setHeld(true)}
      onPointerLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      aria-roledescription="carousel"
      aria-label={`${n} pictures of the advertised homes`}
    >
      {src ? (
        <img src={src} alt={s.alt} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" data-testid="hero-slide" />
      ) : (
        <span className="pp-slide-wait" role="status" data-testid="hero-slide-loading">{`Loading picture ${(i % n) + 1} of ${n}`}</span>
      )}
      <span className="pp-slide-cap" data-testid="hero-slide-title">
        <strong>{s.title}</strong>{s.caption ? ` · ${s.caption}` : ''}
      </span>
      <div className="pp-segments" role="tablist" aria-label="Pictures" data-testid="hero-segments">
        {slides.map((x, k) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={k === i % n}
            aria-label={`Picture ${k + 1} of ${n}: ${x.title}`}
            onClick={() => setI(k)}
            className={`pp-seg${k === i % n ? ' is-on' : ''}`}
          >
            <span className="pp-seg-bar" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}
