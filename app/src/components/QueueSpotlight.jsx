// =============================================================================
// QueueSpotlight — single-item-in-spotlight + dropdown-to-pick-another
// =============================================================================
// Reusable pattern: show ONE item at a time (newest first by default), with
// a dropdown that lets the user pick any other item from the queue to bring
// into the spotlight, plus Prev / Next arrow nav. Replaces long scrollable
// lists when the user wants to focus on one record at a time and step
// through.
//
// Designed to wrap any kind of record — feedback, incidents, projects,
// prayer requests, action-queue items. The component is content-agnostic:
// caller provides items + a getKey + a getLabel for the dropdown + a
// renderItem for the spotlight body + an actions array.
//
// Props:
//   - title       : header title (e.g. "Feedback Log")
//   - subtitle    : optional second line under the title
//   - emoji       : optional leading glyph (e.g. "💬")
//   - accent      : hex color for the header strip + primary action button
//   - items       : array of record objects (newest first per caller's sort)
//   - getKey      : (item) => unique stable id for React keys
//   - getLabel    : (item) => short string for the dropdown ("May 24 · UI")
//   - renderItem  : (item) => JSX rendered in the spotlight body
//   - actions     : array of { label, onClick(item), color?, secondary? }
//   - emptyState  : optional JSX to render when items is empty
//
// Caller manages the data itself; this component is presentation-only.
// =============================================================================
import React, { useState, useEffect } from 'react';

export function QueueSpotlight({
  title,
  subtitle,
  emoji,
  accent = '#1A1815',
  items = [],
  getKey,
  getLabel,
  renderItem,
  actions = [],
  emptyState = null,
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // If the queue size changes (item added/removed), keep the selected index
  // valid. New items show at top (newest first), so reset to 0 when a new
  // item arrives. Clamp on removal.
  useEffect(() => {
    if (items.length === 0) return;
    if (selectedIndex >= items.length) setSelectedIndex(items.length - 1);
  }, [items.length, selectedIndex]);

  if (items.length === 0) {
    return emptyState;
  }

  const current = items[selectedIndex];
  const total = items.length;
  const isFirst = selectedIndex === 0;
  const isLast = selectedIndex === total - 1;

  const goPrev = () => { if (!isFirst) setSelectedIndex(i => i - 1); };
  const goNext = () => { if (!isLast) setSelectedIndex(i => i + 1); };

  return (
    <section className="bg-white border-2 p-5" style={{ borderColor: accent }}>
      {/* Header strip: title + count + dropdown nav */}
      <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
        <div>
          <div
            className="text-[0.625rem] uppercase tracking-[0.3em] font-semibold"
            style={{ color: accent }}
          >
            {emoji && <span className="mr-1">{emoji}</span>}{title}
            <span className="text-[#5A5751] font-normal ml-2">
              · {selectedIndex + 1} of {total}
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

        {/* Nav cluster: prev / dropdown / next */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            aria-label="Previous item"
            className="text-xs px-2 py-1 border border-[#E8E4DC] hover:border-[#1A1815] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#E8E4DC]"
          >
            ←
          </button>
          <select
            value={selectedIndex}
            onChange={(e) => setSelectedIndex(parseInt(e.target.value, 10))}
            aria-label="Jump to item"
            className="text-xs px-2 py-1 border border-[#E8E4DC] bg-white hover:border-[#1A1815] max-w-[260px]"
          >
            {items.map((item, idx) => (
              <option key={getKey(item)} value={idx}>
                {getLabel(item)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={goNext}
            disabled={isLast}
            aria-label="Next item"
            className="text-xs px-2 py-1 border border-[#E8E4DC] hover:border-[#1A1815] disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-[#E8E4DC]"
          >
            →
          </button>
        </div>
      </div>

      {/* Spotlight body — renders the current item */}
      <div className="bg-[#FAF8F4] border border-[#E8E4DC] p-4 mb-3">
        {renderItem(current)}
      </div>

      {/* Action row */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center justify-end">
          {actions.map((a, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => a.onClick(current)}
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
    </section>
  );
}
