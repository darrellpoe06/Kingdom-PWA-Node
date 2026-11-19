// =============================================================================
// ChurchArchive — every calendar, Letter from BG and flyer the church office
// posted, kept by year and month, in the calendar's Times area (DR-1596)
// =============================================================================
// Darrell 2026-11-19: "Why does the office only have today forward... because
// they don't want to need to archive it... we can inside the Love Corner App
// because it's automated!?!!!!!!!"
//
// Nothing here is typed by hand. The months are the rows the daily reader kept
// (church_site_archive, migration 0342) plus the calendar events the office
// archived; a month folds open to its pictures, each opening full size at the
// reader's own text-size step (FullPicture, DR-1575). The pictures sit in a
// private bucket, so a month's addresses are asked for only when it is opened.
// A read that failed says so; an archive with nothing yet says why and when it
// fills (DR-1053: unknown is never shown as empty).
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { archiveMonths, archiveYears, monthSummary } from '../../lib/church-archive.js';
import { signArchivePaths } from '../../lib/church-archive-sync.js';
import { whenLine } from '../../lib/church-calendar.js';
import { FullPicture } from './ChurchOfficeBoard.jsx';
import { motionBehavior } from '../../lib/gentle-motion.js';

export const ARCHIVE_ANCHOR = 'church-archive';
const FOCUS = 'focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2';
const STATUS = {
  'signed-out': 'Sign in to see what the church office has posted over the months.',
  'no-church': 'Join your church in the app to see what its office has posted over the months.',
  unavailable: 'The archive could not be read just now. Nothing in it is lost; try again in a moment.',
  loading: 'Reading the archive…',
};
const KIND_WORDS = { calendar: 'Calendar', letter: 'Letter from BG', flyer: 'Flyer' };

function day(iso) {
  const d = iso ? new Date(iso) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  try {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function Month({ m, sign, onOpen }) {
  const [urls, setUrls] = useState(null);
  const [asking, setAsking] = useState(false);
  const pictures = [...m.calendar, ...m.letter, ...m.flyers];
  // Asked for when the month opens, and again on a later opening if any picture could not be signed.
  const load = () => {
    if (asking || !pictures.length || (urls && pictures.every((p) => urls[p.path]))) return;
    setAsking(true);
    Promise.resolve()
      .then(() => sign(pictures.map((p) => p.path)))
      .then((got) => setUrls(got || {}))
      .catch(() => setUrls({}))
      .finally(() => setAsking(false));
  };
  return (
    <details className="ca-month" data-testid="church-archive-month" onToggle={(e) => e.currentTarget.open && load()}>
      <summary className={`ca-summary ${FOCUS}`} data-testid="church-archive-summary">
        {monthSummary(m)}
      </summary>
      {pictures.length > 0 && (
        <div className="ca-grid">
          {pictures.map((p) => {
            const src = urls && urls[p.path];
            const name = `${KIND_WORDS[p.kind]}: ${p.title || m.label}`;
            return (
              <figure key={p.id} className="lc-office-fig" data-testid="church-archive-picture" data-kind={p.kind}>
                {src ? (
                  <button type="button" className={`lc-office-pic ${FOCUS}`} onClick={() => onOpen({ src, alt: name })} aria-label={`${name}: open full size`}>
                    <img src={src} alt={name} loading="lazy" decoding="async" />
                  </button>
                ) : (
                  <p className="cc-empty ca-wait" data-testid="church-archive-picture-wait">
                    {urls && !asking ? 'This picture could not be opened just now. Close the month and open it again to retry.' : 'Opening…'}
                  </p>
                )}
                <figcaption className="lc-office-cap">
                  {name}
                  {p.firstSeenAt ? ` · kept ${day(p.firstSeenAt)}` : ''}
                </figcaption>
              </figure>
            );
          })}
        </div>
      )}
      {m.events.length > 0 && (
        <ul className="cc-list" data-testid="church-archive-events">
          {m.events.map((e) => (
            <li key={e.id} className="cc-item">
              <div className="cc-item-main">
                <b className="cc-item-name">{e.name}</b>
                <span className="cc-item-meta">{[whenLine(e), e.time, e.place].filter(Boolean).join(' · ')}</span>
                <span className="cc-item-detail">Taken off the calendar by the church office{e.archivedAt ? ` on ${day(e.archivedAt)}` : ''}; kept here.</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}

export default function ChurchArchive({ status = 'ok', rows = [], archivedEvents = [], sign = signArchivePaths }) {
  const years = useMemo(() => archiveYears(archiveMonths(rows, archivedEvents)), [rows, archivedEvents]);
  const [open, setOpen] = useState(null);
  const closeRef = useRef(null);
  useEffect(() => {
    if (open && closeRef.current) closeRef.current.focus();
  }, [open]);
  return (
    <div className="cc-tools" id={ARCHIVE_ANCHOR} data-testid="church-archive">
      <div className="cc-list-h">The archive: what the church office posted, month by month</div>
      <p className="cc-empty">
        Every month’s calendar, every Letter from BG and every flyer the office posts on the church website is kept here by the app, the first day it reads it.
        The office does nothing extra.
      </p>
      {status !== 'ok' ? (
        <p className="cc-empty" data-testid="church-archive-status">
          {STATUS[status] || STATUS.unavailable}
        </p>
      ) : years.length === 0 ? (
        <p className="cc-empty" data-testid="church-archive-empty">
          Nothing is kept yet. The app reads the church website once a day; the first month it keeps will show here.
        </p>
      ) : (
        years.map((y) => (
          <div key={y.year} className="ca-year" data-testid="church-archive-year">
            <b className="ca-year-h">{y.year}</b>
            {y.months.map((m) => (
              <Month key={m.key} m={m} sign={sign} onOpen={setOpen} />
            ))}
          </div>
        ))
      )}
      {open && <FullPicture open={open} onClose={() => setOpen(null)} closeRef={closeRef} />}
    </div>
  );
}

/** Scrolls the archive into view; true when it is on the page. */
export function goToArchive(doc = typeof document === 'undefined' ? null : document) {
  const el = doc && doc.getElementById(ARCHIVE_ANCHOR);
  if (!el) return false;
  try {
    el.scrollIntoView({ behavior: motionBehavior(), block: 'start' });
  } catch {
    el.scrollIntoView();
  }
  return true;
}
