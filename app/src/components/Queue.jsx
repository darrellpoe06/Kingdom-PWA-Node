// =============================================================================
// Queue — focus pane + paginated card list (master-detail merger)
// =============================================================================
// The merged form of QueueSpotlight + QueueList. Top of the panel renders the
// currently-focused item in full detail (with the action row). Below that,
// the rest of the queue is shown as compact paginated cards (default 5 per
// page, configurable: 5 / 25 / 50 / all). Clicking any card brings that item
// into the focus pane.
//
// Pattern: focus AND scan, simultaneously. Used first on Projects → Feedback
// Log; reusable across incidents queue, projects queue, prayer requests,
// action queue, any queue surface where the user wants to focus on one item
// fully but also browse the rest quickly.
//
// Caller is content-agnostic — Queue handles the chrome (header, dropdown,
// pagination, action row); caller provides items + getKey + renderFocus +
// renderCard + actions.
//
// Props:
//   - title          : header title (e.g. "Feedback Log")
//   - subtitle       : optional second line under the title
//   - emoji          : optional leading glyph (e.g. "💬")
//   - accent         : hex color for the header strip + primary action button
//   - items          : array of records (pre-sorted by caller — newest first)
//   - getKey         : (item) => unique stable id
//   - renderFocus    : (item) => detailed JSX for the focus pane
//   - renderCard     : (item) => compact JSX for the card list
//   - actions        : array of { label, onClick(item), color?, secondary? }
//                      — rendered next to the focused item; each action is
//                      called with the currently-focused item
//   - defaultPageSize: initial page size (default 5)
//   - pageSizeOptions: choices in the page-size dropdown (default [5, 25, 50])
//   - emptyState     : JSX to render when items is empty
// =============================================================================
import React, { useState, useEffect, useMemo } from 'react';

export function Queue({
  title,
  subtitle,
  emoji,
  accent = '#1A1815',
  items = [],
  getKey,
  renderFocus,
  renderCard,
  actions = [],
  defaultPageSize = 5,
  pageSizeOptions = [5, 25, 50],
  emptyState = null,
}) {
  const [focusKey, setFocusKey] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const total = items.length;

  // Default focus to the first item (newest) when items first arrive or when
  // the currently-focused item disappears from the queue (e.g. it was deleted).
  useEffect(() => {
    if (total === 0) {
      if (focusKey !== null) setFocusKey(null);
      return;
    }
    const stillExists = focusKey != null && items.some((it) => getKey(it) === focusKey);
    if (!stillExists) {
      setFocusKey(getKey(items[0]));
      setPage(0);
    }
  }, [items, total, focusKey, getKey]);

  // The rest of the queue (cards) — everything except the focused item.
  const cards = useMemo(
    () => items.filter((it) => getKey(it) !== focusKey),
    [items, focusKey, getKey]
  );

  const showingAll = pageSize === 'all';
  const effectivePageSize = showingAll ? cards.length || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(cards.length / effectivePageSize));

  useEffect(() => {
    if (page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  if (total === 0) return emptyState;

  const focusItem = items.find((it) => getKey(it) === focusKey) || items[0];
  const startIdx = page * effectivePageSize;
  const endIdx = Math.min(startIdx + effectivePageSize, cards.length);
  const visibleCards = cards.slice(startIdx, endIdx);

  const goPrev = () => { if (page > 0) setPage((p) => p - 1); };
  const goNext = () => { if (page < totalPages - 1) setPage((p) => p + 1); };

  const focusOnCard = (item) => {
    setFocusKey(getKey(item));
    setPage(0);
    // Scroll the focus pane into view so the user sees the change land.
    // Defer to next tick so React has rendered the new focus first.
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const el = document.getElementById(`queue-focus-${title?.replace(/\s+/g, '-').toLowerCase() || 'pane'}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    }
  };

  const focusPaneId = `queue-focus-${title?.replace(/\s+/g, '-').toLowerCase() || 'pane'}`;

  return (
    <section className="bg-white border-2 p-5" style={{ borderColor: accent }}>
      {/* Header strip: title + total + page-size selector */}
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div>
          <div
            className="text-[0.625rem] uppercase tracking-[0.3em] font-semibold"
            style={{ color: accent }}
          >
            {emoji && <span className="mr-1">{emoji}</span>}{title}
            <span className="text-[#5A5751] font-normal ml-2">
              · {total} {total === 1 ? 'item' : 'items'}
            </span>
          </div>
          {subtitle && (
            <div
              className="text-xs text-[#5A5751] italic mt-1"
              style={{ fontFamily: '"Fraunces", serif' }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {cards.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
              Show
            </label>
            <select
              value={pageSize}
              onChange={(e) => {
                const v = e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10);
                setPageSize(v);
                setPage(0);
              }}
              aria-label="Items per page"
              className="text-xs px-2 py-1 border border-[#E8E4DC] bg-white hover:border-[#1A1815]"
            >
              {pageSizeOptions.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
              <option value="all">all</option>
            </select>
          </div>
        )}
      </div>

      {/* Focus pane — the currently-selected item, full detail + actions */}
      <div
        id={focusPaneId}
        className="bg-[#FAF8F4] border-2 p-4 mb-4"
        style={{ borderColor: accent }}
      >
        <div className="text-[0.5625rem] uppercase tracking-[0.25em] font-semibold mb-2" style={{ color: accent }}>
          ✦ Focused
        </div>
        {renderFocus(focusItem)}
        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center justify-end pt-3 mt-3 border-t border-[#E8E4DC]">
            {actions.map((a, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => a.onClick(focusItem)}
                className={
                  a.secondary
                    ? 'text-[0.625rem] uppercase tracking-wider px-2.5 py-1 border border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'
                    : 'text-[0.625rem] uppercase tracking-wider px-3 py-1.5 text-[#FAF8F4] font-semibold'
                }
                style={
                  a.secondary
                    ? undefined
                    : { backgroundColor: a.color || accent }
                }
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compact card list — "the rest" */}
      {cards.length > 0 && (
        <>
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold mb-2">
            More in this queue
          </div>
          <div className="space-y-2 mb-3">
            {visibleCards.map((item) => (
              <button
                key={getKey(item)}
                type="button"
                onClick={() => focusOnCard(item)}
                aria-label="Bring this item into focus"
                className="w-full text-left bg-white border border-[#E8E4DC] hover:border-[#1A1815] p-3 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                {renderCard(item)}
              </button>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 text-xs pt-2 border-t border-[#E8E4DC]">
              <button
                type="button"
                onClick={goPrev}
                disabled={page === 0}
                className="px-3 py-1.5 border border-[#E8E4DC] hover:border-[#1A1815] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#E8E4DC]"
              >
                ← Prev
              </button>
              <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">
                Page {page + 1} of {totalPages} · showing {startIdx + 1}–{endIdx} of {cards.length}
              </div>
              <button
                type="button"
                onClick={goNext}
                disabled={page === totalPages - 1}
                className="px-3 py-1.5 border border-[#E8E4DC] hover:border-[#1A1815] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#E8E4DC]"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
