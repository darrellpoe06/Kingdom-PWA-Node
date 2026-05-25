// =============================================================================
// QueueList — paginated compact-card list with per-item actions
// =============================================================================
// Reusable pattern: show N items at a time in compact card form (default 5),
// with pagination + page-size selector. Each item gets the same action row,
// so the caller can wire "promote to X" / "delete" / "open" / "resolve" /
// any verb without re-writing the surrounding chrome.
//
// Sibling of QueueSpotlight (which shows ONE item at a time with dropdown
// nav). Use QueueList when the user wants to SCAN many items quickly with
// per-card actions. Use QueueSpotlight when the user wants to FOCUS on one
// item fully.
//
// Both components are content-agnostic — caller provides items + getKey +
// renderItem + actions, the component handles the surrounding UI.
//
// Props:
//   - title          : header title (e.g. "Feedback Log")
//   - subtitle       : optional second line under the title
//   - emoji          : optional leading glyph (e.g. "💬")
//   - accent         : hex color for the header strip + primary action button
//   - items          : array of record objects (pre-sorted by caller)
//   - getKey         : (item) => unique stable id for React keys
//   - renderItem     : (item) => JSX rendered inside each card
//   - actions        : array of { label, onClick(item), color?, secondary? }
//   - defaultPageSize: starting page size (default 5)
//   - pageSizeOptions: dropdown options for page size (default [5, 25, 50])
//   - emptyState     : optional JSX to render when items is empty
// =============================================================================
import React, { useState, useEffect } from 'react';

export function QueueList({
  title,
  subtitle,
  emoji,
  accent = '#1A1815',
  items = [],
  getKey,
  renderItem,
  actions = [],
  defaultPageSize = 5,
  pageSizeOptions = [5, 25, 50],
  emptyState = null,
}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  // Clamp page if items shrink below current page boundary
  const total = items.length;
  const showingAll = pageSize === 'all';
  const effectivePageSize = showingAll ? total || 1 : pageSize;
  const totalPages = Math.max(1, Math.ceil(total / effectivePageSize));

  useEffect(() => {
    if (page >= totalPages) setPage(Math.max(0, totalPages - 1));
  }, [page, totalPages]);

  if (total === 0) return emptyState;

  const startIdx = page * effectivePageSize;
  const endIdx = Math.min(startIdx + effectivePageSize, total);
  const visibleItems = items.slice(startIdx, endIdx);

  const goPrev = () => { if (page > 0) setPage(p => p - 1); };
  const goNext = () => { if (page < totalPages - 1) setPage(p => p + 1); };

  return (
    <section className="bg-white border-2 p-5" style={{ borderColor: accent }}>
      {/* Header strip: title + total + page-size selector */}
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.3em] font-semibold"
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

        {/* Page-size selector */}
        <div className="flex items-center gap-2 text-xs">
          <label className="text-[10px] uppercase tracking-wider text-[#5A5751]">
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
      </div>

      {/* Card list */}
      <div className="space-y-3 mb-4">
        {visibleItems.map((item) => (
          <div key={getKey(item)} className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
            <div className="mb-2">
              {renderItem(item)}
            </div>
            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center justify-end pt-2 border-t border-[#E8E4DC]">
                {actions.map((a, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => a.onClick(item)}
                    className={
                      a.secondary
                        ? 'text-[10px] uppercase tracking-wider px-2.5 py-1 border border-[#E8E4DC] text-[#5A5751] hover:border-[#1A1815] hover:text-[#1A1815]'
                        : 'text-[10px] uppercase tracking-wider px-3 py-1.5 text-[#FAF8F4] font-semibold'
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
        ))}
      </div>

      {/* Pagination footer (only when more than one page) */}
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
          <div className="text-[10px] uppercase tracking-wider text-[#5A5751]">
            Page {page + 1} of {totalPages} · showing {startIdx + 1}–{endIdx} of {total}
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
    </section>
  );
}
