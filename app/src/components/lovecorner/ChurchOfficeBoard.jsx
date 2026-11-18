// =============================================================================
// ChurchOfficeBoard — what the church office published on its website, shown
// in the app (DR-1550): the month's calendar, the latest Letter from BG and
// the current-events flyers, read through /api/church-site. Nothing here is
// typed by hand: every picture is the office's own, and the board says when
// it was read. No news read → the board renders nothing (never a guess).
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import { loadChurchSite, digestHasNews, siteIsTheChurchs } from '../../lib/church-site.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

/** The site's digest for a church record whose site IS the church's own website; null while loading, when disabled, or when nothing read. */
export function useChurchSite(site, loader = loadChurchSite) {
  const enabled = siteIsTheChurchs(site);
  const [digest, setDigest] = useState(null);
  useEffect(() => {
    if (!enabled) {
      setDigest(null);
      return undefined;
    }
    let cancelled = false;
    Promise.resolve()
      .then(() => loader())
      .then((d) => {
        if (!cancelled) setDigest(d);
      })
      .catch(() => {
        if (!cancelled) setDigest(null);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, loader]);
  return digest;
}

function readAt(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

function Picture({ item, alt, caption, onOpen, testid }) {
  return (
    <figure className="lc-office-fig" data-testid={testid}>
      <button type="button" className={`lc-office-pic ${FOCUS}`} onClick={() => onOpen({ src: item.src, alt })} aria-label={`${alt}: open full size`}>
        <img src={item.src} alt={alt} loading="lazy" decoding="async" />
      </button>
      <figcaption className="lc-office-cap">{caption}</figcaption>
    </figure>
  );
}

export default function ChurchOfficeBoard({ digest, heading = 'From the church office' }) {
  const [open, setOpen] = useState(null);
  const closeRef = useRef(null);
  useEffect(() => {
    if (open && closeRef.current) closeRef.current.focus();
  }, [open]);
  if (!digestHasNews(digest)) return null;
  const when = readAt(digest.fetchedAt);
  return (
    <section className="lc-sec lc-office" aria-labelledby="lc-office-h" data-testid="church-office-board">
      <div className="lc-sec-h">
        <h3 id="lc-office-h" className="lc-h2">
          {heading}
        </h3>
        {when && (
          <small className="lc-small" data-testid="church-office-read-at">
            Read from the church website · {when}
          </small>
        )}
      </div>
      <div className="lc-office-grid">
        {digest.calendar && (
          <Picture
            item={digest.calendar}
            alt={`${digest.calendar.label} church calendar`}
            caption={`${digest.calendar.label} · the month's calendar`}
            onOpen={setOpen}
            testid="church-office-calendar"
          />
        )}
        {digest.letter && (
          <Picture
            item={digest.letter}
            alt={`${digest.letter.label} from Bishop Gwin`}
            caption={`Letters from BG · ${digest.letter.label}`}
            onOpen={setOpen}
            testid="church-office-letter"
          />
        )}
      </div>
      {digest.events && (digest.events.flyers.length > 0 || digest.events.intro) && (
        <div className="lc-office-events" data-testid="church-office-events">
          <b className="lc-h3">Current events</b>
          {digest.events.intro && <p className="lc-p">{digest.events.intro}</p>}
          {digest.events.flyers.length > 0 && (
            <div className="lc-office-strip">
              {digest.events.flyers.map((f) => (
                <Picture key={f.path} item={f} alt={`${f.name} flyer`} caption={f.name} onOpen={setOpen} testid={`church-office-flyer`} />
              ))}
            </div>
          )}
        </div>
      )}
      {open && (
        <div
          className="lc-office-full"
          role="dialog"
          aria-modal="true"
          aria-label={open.alt}
          data-testid="church-office-full"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(null);
          }}
        >
          <button ref={closeRef} type="button" className={`lc-office-close ${FOCUS}`} onClick={() => setOpen(null)} data-testid="church-office-close">
            Close ×
          </button>
          <img src={open.src} alt={open.alt} />
        </div>
      )}
    </section>
  );
}
