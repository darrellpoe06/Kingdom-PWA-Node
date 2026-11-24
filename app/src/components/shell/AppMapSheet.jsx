// =============================================================================
// AppMapSheet — "where can I go?" in one sheet, for every app (DR-1627)
// =============================================================================
// Darrell 2026-11-24, with two screenshots of the Love Corner's menu: "I want
// this type of menu to be inside each app as a quick way to identify where the
// users can go... like the Love Corner App has currently... make sense?"
//
// The Love Corner's sheet (LoveCornerMenus.jsx AllFeaturesSheet) was written
// for the church's own tab list. This is the same sheet as a frame any app
// hands its own places to: a search box, the places grouped as tiles with the
// current one ringed, and a "This app" row the caller fills. It draws only
// what it is given: every tile is a place the caller has already gated for
// this reader, so the sheet can never show a door the reader may not open.
//
// It does not replace an app's tabs. A grouped nav was tried in place of the
// tab row and reverted on 2026-06-26 ("lost the tabs", TopNavRow.jsx); this
// is a map beside the tabs, one tap away, never instead of them.
// =============================================================================
import React, { useEffect, useRef, useState } from 'react';
import Modal from '../Modal.jsx';
import UiIcon from '../UiIcon.jsx';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#CFA63C]';

/** Pure. The places whose words or id contain the query, in the order given. */
export function searchPlaces(query, groups = []) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return [];
  const out = [];
  for (const g of groups || []) {
    for (const it of (g && g.items) || []) {
      if (!it || !it.id) continue;
      const words = `${it.label || ''} ${it.id} ${g.label || ''}`.toLowerCase();
      if (words.includes(q)) out.push({ ...it, group: g.label || '' });
    }
  }
  return out;
}

/** Pure. How many places a set of groups holds. */
export function countPlaces(groups = []) {
  return (groups || []).reduce((n, g) => n + ((g && g.items) || []).length, 0);
}

export default function AppMapSheet({
  open,
  onClose,
  groups = [],
  onGo,
  label = 'All features',
  placeholder = 'Search this app',
  thisApp = null,
  build = '',
  theme = null,
  testid = 'app-map',
}) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => {
    if (!open) setQ('');
  }, [open]);
  const hits = searchPlaces(q, groups);
  const go = (it) => {
    onClose();
    if (onGo) onGo(it);
  };
  return (
    <Modal open={open} onClose={onClose} label={label} maxWidthClass="max-w-md" variant="sheet" theme={theme}>
      <div className="lch-sheet" data-theme={theme || undefined} data-testid={testid}>
        <label className="lch-search">
          <span className="sr-only">{placeholder}</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={placeholder}
            className="lch-input"
            data-testid={`${testid}-search`}
            autoComplete="off"
          />
        </label>
        {q.trim() ? (
          <div className="lch-results" data-testid={`${testid}-results`}>
            {hits.length === 0 && <p className="lch-empty">Nothing by that name. Try another word.</p>}
            {hits.map((it) => (
              <button key={`h-${it.id}`} type="button" onClick={() => go(it)} className={`lch-result ${FOCUS}`} data-testid={`${testid}-hit-${it.id}`}>
                <span className="lch-result-kind">{it.group || 'Tab'}</span>
                {it.label}
              </button>
            ))}
          </div>
        ) : (
          <>
            {groups.map((g) => (
              <section key={g.key} className="lch-group" aria-labelledby={`${testid}-g-${g.key}`} data-testid={`${testid}-group-${g.key}`}>
                <h3 id={`${testid}-g-${g.key}`} className="lch-group-h">
                  {g.label}
                </h3>
                <div className="lch-grid">
                  {g.items.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => go(it)}
                      aria-current={it.on ? 'page' : undefined}
                      className={`lch-tile ${it.on ? 'lch-tile-on' : ''} ${FOCUS}`}
                      data-testid={`${testid}-tile-${it.id}`}
                    >
                      <UiIcon name={it.icon || 'home'} />
                      <span>{it.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
            {(thisApp || build) && (
              <section className="lch-group" aria-labelledby={`${testid}-g-this`}>
                <h3 id={`${testid}-g-this`} className="lch-group-h">
                  This app
                </h3>
                {thisApp && <div className="lch-row">{thisApp}</div>}
                {build && (
                  <p className="lch-build" data-testid={`${testid}-build`}>
                    build {build}
                  </p>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
