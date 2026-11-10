// =============================================================================
// LessonFigures — the chart, the steps, the quadrant or the picture a lesson
// talks about, drawn where the reader is (DR-1296)
// =============================================================================
// Everything here is drawn from data (lib/lesson-figures.js) in plain HTML,
// not a canvas or a baked image, so: the words are real text a screen reader,
// the TTS and Big Print all reach (rem sizes, Pattern 2b); the colors are the
// app's themed classes, so every theme, midnight included, repaints them; and
// nothing is wider than its column, so a 360px Fold cover screen never scrolls
// sideways. The bars and arrows are decoration (aria-hidden); every fact they
// show is also in the words beside them, which is the text alternative.
// Every reference a figure names opens the Word in place (Pattern 2h).
// =============================================================================

import React from 'react';
import { figuresFor, lessonTimelineFor, spanScale, spanTicks } from '../lib/lesson-figures.js';
import { bibleHref, requestBibleTimeline } from '../lib/bible-timeline-link.js';
import VerseChips from './VerseChips.jsx';

const SERIF = { fontFamily: '"Fraunces", serif' };

// Every timeline in a lesson opens the whole one in the Bible, where it lives
// for every reader with or without a lesson (Darrell 2026-11-03).
function TimelineLink({ book }) {
  return (
    <a
      href={bibleHref()}
      onClick={() => requestBibleTimeline(book)}
      className="mt-2 inline-flex items-center min-h-[44px] px-3 border border-[#5A6E3D] text-[#5A6E3D] text-xs font-semibold hover:bg-[#5A6E3D] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
      style={SERIF}
      data-testid="lesson-figure-bible-link"
    >
      See all 66 books on the timeline in the Bible
    </a>
  );
}

export function FigureFrame({ figure, children, link = null }) {
  const titleId = `fig-${figure.id}-title`;
  return (
    <figure
      className="mt-2 border border-[#E8E4DC] bg-white p-2 min-w-0"
      data-testid="lesson-figure"
      data-figure-kind={figure.kind}
      data-figure-id={figure.id}
      aria-labelledby={titleId}
    >
      <div id={titleId} className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold mb-1">
        {figure.title}
      </div>
      {children}
      <figcaption className="mt-2 text-[0.6875rem] text-[#5A5751]" style={SERIF}>
        {figure.caption && <span className="block">{figure.caption}</span>}
        <span className="block mt-1"><strong className="text-[#1A1815]">Source:</strong> {figure.source}</span>
        {figure.disclosure && <span className="block mt-1 italic" data-testid="lesson-figure-disclosure">{figure.disclosure}</span>}
      </figcaption>
      {link}
    </figure>
  );
}

function tickShift(t) {
  if (t.at < 0.08) return 'none';
  if (t.at > 0.92) return 'translateX(-100%)';
  return 'translateX(-50%)';
}

// One testament / one era. A <details> that starts OPEN: the chart is the point
// of the lesson, so it is seen first; folding a long list away is the reader's
// choice. It holds no verse, so it keeps its own state (Pattern 2h §5).
// In the Bible, `onPick` makes each book a button that opens it, and `current`
// marks the book being read, so the chart is a way into the Word, not a picture
// beside it.
function SpanGroup({ group, onPick = null, current = null }) {
  const scale = spanScale(group);
  const ticks = spanTicks(scale, group.era);
  const fill = group.era === 'AD' ? 'bg-[#2A5A8E]' : 'bg-[#5A6E3D]';
  return (
    <details open className="mt-1" data-testid="lesson-figure-group" data-group={group.id}>
      <summary className="cursor-pointer text-xs font-semibold text-[#1A1815] min-h-[36px] flex items-center" style={SERIF}>{group.label}</summary>
      {ticks.length > 0 && (
        <div className="relative h-4 mb-1 mx-1" aria-hidden="true" data-testid="lesson-figure-ticks">
          {ticks.map((t) => (
            <span
              key={t.year}
              className="absolute top-0 text-[0.5625rem] text-[#5A5751] whitespace-nowrap"
              style={{ left: `${t.at * 100}%`, transform: tickShift(t) }}
            >
              {t.label}
            </span>
          ))}
        </div>
      )}
      <ol className="space-y-1.5" data-testid="lesson-figure-rows">
        {group.rows.map((r) => {
          const dated = scale && r.from != null && r.to != null;
          const left = dated ? scale.at(r.from) : 0;
          const right = dated ? scale.at(r.to) : 0;
          const here = current === r.label;
          const words = (
            <span className="block text-xs text-[#1A1815] leading-snug break-words" style={SERIF}>
              {r.n != null && <span className="text-[#5A5751]">{r.n}. </span>}
              <strong>{r.label}</strong>
              <span className="text-[#5A5751]"> · {r.dateText || 'no date'}</span>
              {r.detail && <span className="text-[#5A5751]"> · {r.detail}</span>}
              {r.place && <span className="text-[#5A5751]"> · {r.place}</span>}
              {here && <span className="text-[#5A6E3D] font-semibold"> · reading now</span>}
            </span>
          );
          const bar = (
            <span className="block relative h-1.5 mt-0.5 mx-1 bg-[#E8E4DC]" aria-hidden="true">
              {dated && (
                <span
                  className={`absolute top-0 h-1.5 ${fill}`}
                  style={{ left: `${left * 100}%`, width: `max(4px, ${(right - left) * 100}%)` }}
                />
              )}
            </span>
          );
          return (
            <li
              key={`${group.id}-${r.n}-${r.label}`}
              className={`min-w-0 ${here ? 'bg-[#FAF8F4] border-l-2 border-[#5A6E3D] pl-1' : ''}`}
              data-row={r.label}
              data-dated={dated ? 'true' : 'false'}
              data-current={here ? 'true' : undefined}
            >
              {onPick ? (
                <button
                  type="button"
                  onClick={() => onPick(r.label)}
                  aria-current={here ? 'true' : undefined}
                  className="block w-full text-left min-h-[44px] py-1 hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]"
                  data-testid="timeline-open-book"
                >
                  {words}
                  {bar}
                </button>
              ) : (
                <>
                  {words}
                  {bar}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

export function SpanChart({ figure, onPick = null, current = null }) {
  return figure.groups.map((g) => <SpanGroup key={g.id} group={g} onPick={onPick} current={current} />);
}

// A figure's references are chips, once each: the text form AND a chip row
// printed every reference twice in a 150px cell (measured on the 360px shot).
function Refs({ refs }) {
  const list = String(refs || '').split(';').map((r) => r.trim()).filter(Boolean);
  if (!list.length) return null;
  return <VerseChips refs={list} tone="word" className="mt-1" data-testid="lesson-figure-refs" />;
}

function Sequence({ figure }) {
  return (
    <>
      <ol data-testid="lesson-figure-steps">
        {figure.steps.map((s, i) => (
          <li key={`${i}-${s.label}`} className="min-w-0">
            <div className="border-l-4 border-[#5A6E3D] bg-[#FAF8F4] px-2 py-1.5">
              {s.date && <div className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">{s.date}</div>}
              <div className="text-sm text-[#1A1815] font-semibold break-words" style={SERIF}>{s.label}</div>
              {s.detail && <div className="text-xs text-[#5A5751] break-words" style={SERIF}>{s.detail}</div>}
              <Refs refs={s.refs} />
            </div>
            {i < figure.steps.length - 1 && (
              <div className="text-center text-[#5A6E3D] leading-none py-0.5" aria-hidden="true">↓</div>
            )}
          </li>
        ))}
      </ol>
      {figure.note && (
        <p className="mt-1.5 text-xs text-[#1A1815] border border-dashed border-[#5A5751] px-2 py-1" style={SERIF} data-testid="lesson-figure-note">{figure.note}</p>
      )}
    </>
  );
}

// Two columns even at 360px: each cell is about 150px, and every word in it
// wraps. Reading order is the visual order (top-left, top-right, bottom-left,
// bottom-right), and each cell says its own position on both axes in words.
function Quadrant({ figure }) {
  const { x, y } = figure.axes;
  const cell = (cx, cy) => figure.cells.find((c) => c.x === cx && c.y === cy);
  const order = [cell('low', 'high'), cell('high', 'high'), cell('low', 'low'), cell('high', 'low')];
  return (
    <div className="min-w-0">
      <div className="text-[0.625rem] text-[#5A5751] mb-1" style={SERIF}>
        <strong className="text-[#1A1815]">↑ {y.label}</strong> (top: {y.high}; bottom: {y.low})
      </div>
      <ul className="grid grid-cols-2 gap-1" data-testid="lesson-figure-cells">
        {order.map((c) => (
          <li key={c.label} className="min-w-0 border border-[#E8E4DC] bg-[#FAF8F4] p-1.5" data-cell={`${c.x}/${c.y}`}>
            <div className="text-xs font-semibold text-[#1A1815] break-words" style={SERIF}>{c.label}</div>
            <div className="text-[0.625rem] text-[#5A5751]" style={SERIF}>{c.x === 'high' ? x.high : x.low}, {c.y === 'high' ? y.high : y.low}</div>
            {c.detail && <div className="text-[0.6875rem] text-[#1A1815] break-words" style={SERIF}>{c.detail}</div>}
            <Refs refs={c.refs} />
          </li>
        ))}
      </ul>
      <div className="text-[0.625rem] text-[#5A5751] mt-1 text-right" style={SERIF}>
        <strong className="text-[#1A1815]">{x.label} →</strong> (left: {x.low}; right: {x.high})
      </div>
    </div>
  );
}

function ImageFigure({ figure }) {
  return (
    <img
      src={figure.src}
      alt={figure.alt}
      loading="lazy"
      width={figure.width || undefined}
      height={figure.height || undefined}
      className="block w-full h-auto"
    />
  );
}

const BODY = { 'span-chart': SpanChart, sequence: Sequence, quadrant: Quadrant, image: ImageFigure };

export default function LessonFigures({ module }) {
  const timeline = lessonTimelineFor(module);
  const figures = timeline ? [...figuresFor(module), timeline] : figuresFor(module);
  if (!figures.length) return null;
  // A DROPDOWN AT THE END, LIKE A STORY (DR-1372). Darrell, 2026-11-06, from
  // the reader on a tablet, scrolling the sixteen-book timeline inside a
  // lesson: "This list should be in a tab we can link to not in every lesson
  // it takes too long... maybe it can be a drop-down option for reading each
  // lesson hidden by default." Then: "The timelines should be a possible
  // drop-down like a story we add at the end to summarize the points." So the
  // figures fold CLOSED here (the whole timeline lives open in the Bible, one
  // tap away through the link inside), and the reader mounts them after the
  // stories. DR-1296's chart is still the chart; it is now an option, picked.
  return (
    <details className="mt-2" data-testid="lesson-figures" data-count={figures.length}>
      <summary className="cursor-pointer min-h-[44px] flex items-center text-xs font-semibold text-[#1A1815]" style={SERIF} data-testid="lesson-figures-summary">
        {(timeline ? timeline.title : figures[0].title) + (figures.length > 1 ? ` and ${figures.length - 1} more` : '')} — optional, open to review
      </summary>
      {figures.map((f) => {
        const Body = BODY[f.kind];
        return (
          <FigureFrame key={f.id} figure={f} link={f.timeline ? <TimelineLink /> : null}>
            <Body figure={f} />
          </FigureFrame>
        );
      })}
    </details>
  );
}
