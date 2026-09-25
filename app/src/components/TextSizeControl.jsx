// =============================================================================
// TextSizeControl — the large-print control surface (WCAG 2.1 Resize Text 1.4.4)
// =============================================================================
// A simple, obvious A / A+ / A++ / A+++ / A44 stepper that drives the shared-core
// text-size primitive (lib/text-size.js). Big tap targets, plain labels, no
// jargon — built for a non-technical, elderly reader who just wants the words
// bigger. The active step is announced for screen readers (aria-pressed), and
// the whole group is keyboard reachable.
//
// Two variants from one component:
//   variant="header" — compact, lives beside the theme swatches in the header.
//   variant="panel"  — prominent labeled card for the reading-heavy areas
//                       (The Word, Learn, Conference) and the About/Settings page.
//   variant="compact" — ONE small dropdown holding all five sizes, for the
//                       collapsed row on a phone (Darrell 2026-09-24: "can the
//                       text sizes fit in the top right corner of smaller screen
//                       or a drop down with all options?" / "Keeping the screen
//                       real-estate as clear as possible?"). A native select: the
//                       phone's own picker, keyboard and screen-reader ready.
import React from 'react';
import { useTextSize } from '../lib/text-size.js';
import UiIcon from './UiIcon.jsx';

export default function TextSizeControl({ variant = 'header', className = '' }) {
  const [active, setSize, steps] = useTextSize();
  const isPanel = variant === 'panel';
  // THE FIXED COMFORT BAR PUBLISHES ITS HEIGHT (DR-0438). At Largest / Big
  // Print the header's comfort row becomes a fixed bottom bar (.ts-escape-hatch,
  // index.css) — and the floaters (reading pill, back-to-top, Feedback, Give)
  // sat ON it: measured 2026-09-16 at 360px, every floater overlapped the bar
  // at both sizes. The bar's real height goes out as --ts-hatch-h on <html> so
  // the floaters step above it by exactly that much; 0px whenever the row is in
  // the flow. Re-published on every size step (position flips at Largest) and
  // on every resize of the row (it wraps differently per width).
  const rootRef = React.useRef(null);
  React.useEffect(() => {
    if (isPanel || typeof document === 'undefined') return undefined;
    const bar = rootRef.current && rootRef.current.closest('.ts-escape-hatch');
    const doc = document.documentElement;
    if (!bar) return undefined;
    const publish = () => {
      const fixed = getComputedStyle(bar).position === 'fixed';
      doc.style.setProperty('--ts-hatch-h', fixed ? `${Math.round(bar.getBoundingClientRect().height)}px` : '0px');
    };
    publish();
    let ro = null;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(publish); ro.observe(bar); }
    return () => { if (ro) ro.disconnect(); doc.style.setProperty('--ts-hatch-h', '0px'); };
  }, [isPanel, active]);

  const buttons = (
    <div
      className="flex flex-wrap items-stretch gap-1"
      role="group"
      aria-label="Text size — make reading text larger"
    >
      {steps.map((s, i) => {
        const selected = active === s.key;
        // The label font is FIXED in px (a gentle step up per option, so "bigger =
        // more plusses" still reads at a glance) and deliberately does NOT scale
        // with the root multiplier — otherwise the control would compound with its
        // own setting and overflow at Largest. The page behind the control is what
        // previews the real effect; this control just stays a usable control.
        const labelPx = (isPanel ? [15, 17, 19, 21, 24] : [12, 13, 14, 15, 16])[i] || 15;
        // Header variant rides inside a `.ts-chrome-region` (the header controls
        // row, DR-0276) whose zoom would shrink a raw px label to ~6px at Big
        // Print. Dividing by --ts-chrome-scale cancels the zoom exactly — the
        // label renders at labelPx on screen at every step. Outside any capped
        // region the same formula grows the label gently with the chrome
        // multiplier (bounded ~1.9x at Big Print), never the full content scale.
        const labelSize = isPanel ? `${labelPx}px` : `calc(${labelPx}px / var(--ts-chrome-scale, 1))`;
        return (
          <button
            key={s.key}
            type="button"
            onClick={() => setSize(s.key)}
            aria-pressed={selected}
            aria-label={`${s.name} text size${selected ? ' (current)' : ''}`}
            title={`${s.name} text`}
            className={[
              'flex items-end justify-center font-semibold leading-none rounded-md transition-all whitespace-nowrap',
              'focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]',
              // The PANEL variant's box is fixed px too (Darrell 2026-09-15, Big
              // Print on a lesson: the chips were huge). The label was already fixed;
              // the box was rem and rode the 2.75x root — 48px min-height became
              // 132px. Pixel-identical at Normal, fixed at every step, like the label.
              // The header variant keeps rem: it lives inside a .ts-chrome-region
              // whose zoom already bounds it.
              isPanel ? 'flex-1 min-w-[52px] px-[8px] py-[12px] min-h-[48px]' : 'px-2 py-1.5 min-w-[2rem] min-h-[2rem]',
              selected
                ? 'bg-[#1A1815] text-white border-2 border-[#1A1815]'
                : 'bg-white text-[#1A1815] border-2 border-[#E8E4DC] hover:border-[#1A1815]',
            ].join(' ')}
            style={{ fontSize: labelSize }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );

  if (variant === 'compact') {
    const current = steps.find((s) => s.key === active) || steps[0];
    return (
      <label ref={rootRef} className={`flex items-center gap-1 text-[#1A1815] font-semibold ${className}`} style={{ fontSize: 'calc(12px / var(--ts-chrome-scale, 1))' }}>
        <span aria-hidden="true" className="text-[#5A5751] leading-none select-none">
          <span style={{ fontSize: '0.75em' }}>A</span>a
        </span>
        <select
          data-testid="text-size-compact"
          aria-label={`Text size — now ${current.name}`}
          value={active}
          onChange={(e) => setSize(e.target.value)}
          className="bg-white text-[#1A1815] border-2 border-[#1A1815] rounded-md px-1.5 py-1 min-h-[2rem] font-semibold focus:outline focus:outline-2 focus:outline-offset-1 focus:outline-[#B85838]"
          style={{ fontSize: 'calc(13px / var(--ts-chrome-scale, 1))' }}
        >
          {steps.map((s) => (
            <option key={s.key} value={s.key} aria-label={`${s.name} text size`}>{s.label}</option>
          ))}
        </select>
      </label>
    );
  }

  if (!isPanel) {
    // Header variant: an aA icon hint + the stepper, kept tight.
    return (
      <div ref={rootRef} className={`flex items-center gap-1.5 ${className}`}>
        <span aria-hidden="true" className="text-[#5A5751] leading-none select-none hidden sm:inline" style={{ fontSize: '0.95rem' }}>
          <span style={{ fontSize: '0.7em' }}>A</span>A
        </span>
        {buttons}
      </div>
    );
  }

  // Panel variant: a labeled, prominent card for reading areas + settings.
  const current = steps.find((s) => s.key === active);
  return (
    <div className={`bg-white border-2 border-[#E8E4DC] rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-[#1A1815]">Text size</div>
          <div className="text-xs text-[#5A5751]">Make the words bigger or smaller — your choice is saved on this device.</div>
        </div>
        <div className="text-xs font-semibold text-[#B85838] whitespace-nowrap">{current ? current.name : ''}</div>
      </div>
      {buttons}
    </div>
  );
}


// THE BRAND LOCKUP, ONE DEFINITION FOR BOTH PLACES IT RIDES (DR-0640). The
// collapsed row carries it, and on a one-tab door the top row carries it too
// (components/TopNavRow.jsx). Darrell 2026-09-24, asked whether the brand
// should move to the top row or stay on the collapsed row: "Both places are
// good... why not". One component, so the two places can never drift apart in
// face, size or wrap rule. Fixed px (divided by --ts-chrome-scale), so it
// never compounds with the text-size setting.
export function BrandLockup({ name = '', tagline = '', nameTestId = 'collapsed-site-name', taglineTestId = 'collapsed-site-tagline', className = '' }) {
  const n = String(name || '').trim();
  const t = String(tagline || '').trim();
  if (!n) return null;
  return (
    <span className={`brand-lockup min-w-0 flex flex-col leading-tight ${className}`}>
      <span
        data-testid={nameTestId}
        className="text-[#1A1815] font-semibold break-words"
        style={{ fontFamily: '"Fraunces", serif', fontSize: 'calc(15px / var(--ts-chrome-scale, 1))', letterSpacing: '-0.01em' }}
      >
        {n}
      </span>
      {t && (
        <span
          data-testid={taglineTestId}
          className="uppercase text-[#B85838] font-semibold break-words"
          style={{ fontSize: 'calc(9px / var(--ts-chrome-scale, 1))', letterSpacing: '0.2em' }}
        >
          {t}
        </span>
      )}
    </span>
  );
}

// =============================================================================
// TextSizeEscapeHatch — the way OUT of big text survives the header hideaway
// =============================================================================
// Darrell, 2026-08-30, at Big Print 44 on his phone: "large font block the
// ability to change it afterwards after selecting it...!!!!!!!!??????"
//
// MEASURED, not guessed (chrome-layout-probe, 360px + 412px, Big Print and
// Largest): with the header EXPANDED, five text-size controls render and all
// five are fully on screen — the DR-0276 escape hatch works. With the header
// COLLAPSED, the count is ZERO. The header hideaway unmounts the whole comfort
// row (account, voice, FONT, theme), so the escape hatch was not merely pushed
// off screen — it did not exist in the DOM. The only control left was the
// collapse chevron, which looks like a chevron, not like the way back to
// normal text.
//
// DR-0276 rule 3 says text-size controls are chrome so "big text is ALWAYS
// reversible." The hideaway broke that word: reversible only from a state the
// reader may have left. This restores it without taking the hideaway away —
// Darrell built that for dashboard room and it stays.
//
// IT USED TO RENDER NOTHING AT NORMAL, and that was a measured mistake
// (corrected 2026-09-19, DR-0524). The reasoning written here was "at 1x there
// is no trap, so a reader who tucked the top bar away for room gets exactly the
// clean surface they asked for." That is true of getting OUT of big text and
// FALSE of getting INTO it. Darrell, reading L179 on his phone with the header
// tucked away: "Can't change the text side nor etc on o cellphone reader fix
// it." Measured at 360px, mid-lesson, header collapsed, size Normal:
//
//     header EXPANDED   -> 5 text-size controls, all 5 on screen
//     header COLLAPSED  -> ZERO text-size controls in the DOM
//
// Zero is a trap whichever direction the reader wanted to go. DR-0276's rule is
// that text-size controls are chrome so the size is ALWAYS changeable; a reader
// who cannot make the words BIGGER is as stuck as one who cannot make them
// smaller. So the hatch now renders whenever the header is tucked away, at
// every size. The hideaway still hides what Darrell built it to hide — the
// account row, the voice picker, the theme swatches, the date and build lines —
// so the room he asked for is still there; one thin row is not the dashboard.
//
// At Normal it sits in the flow inside the .ts-safe-sticky header (the header
// is sticky, measured: position:sticky at top 0), and the existing index.css
// rules still take over at the sizes that trap harder — sticky at Larger, a
// fixed bottom bar at Largest and Big Print. No new layout mechanism.
// `inline` (DR-0640): on a one-tab door the row is mounted INSIDE the top nav
// row, between the back/forward pair and the header chevron, so the lone tab
// row and this row become ONE row. It then drops its own top border and takes
// the row's free width. At Largest and Big Print the index.css rule still
// lifts it out to the fixed bottom bar, exactly as before. On a phone the
// in-row order is set in index.css (.ts-hatch-inline), measured at 320 px.
export function TextSizeEscapeHatch({ collapsed, onShowHeader = null, siteName = '', siteTagline = '', inline = false }) {
  // Read so the row re-renders on every step, and so the ts-hatch-h publisher
  // inside TextSizeControl re-measures when the position flips.
  useTextSize();
  // Only when the header is tucked away — at ANY size (see above).
  if (!collapsed) return null;
  return (
    <div data-testid="collapsed-row" className={`ts-chrome-region ts-escape-hatch bg-[#FAF8F4] ${inline ? 'ts-hatch-inline flex-1 min-w-0' : 'border-t border-[#E8E4DC]'} px-3 py-1.5 flex items-center justify-end gap-2 flex-wrap`}>
      {/* THE WAY BACK FROM THE HIDEAWAY, IN WORDS, ON THE LEFT (Darrell
          2026-09-23, Fold: "Lost the whole header?!!!!!!!!!!!" / "What
          happened to the features?!"). The only control that brought the
          header back was a chevron pinned to the RIGHT of the tab row — and
          when the row overflowed the screen (DR-0577), it was off-screen.
          A way back that depends on an edge is not a way back. This row is
          the one thing that always renders while the header is tucked away,
          so the way back lives here too, as words a person can read, on the
          side the tab row never pushes off. */}
      {/* THE WAY BACK AND THE BRAND TRAVEL TOGETHER, ON THE LEFT (Darrell
          2026-09-24: "Hopefully it looks good on a smaller screen too...
          make sure"). Measured at 320 px: with the two as separate row items,
          the button wrapped alone to the RIGHT. One left-anchored group keeps
          the way back on the left at every width, the lockup beside it (or
          just under it on the narrowest phones). */}
      <div data-testid="collapsed-left-group" className="mr-auto flex-1 flex items-center gap-x-2 gap-y-1 flex-wrap min-w-0">
      {onShowHeader && (
        <button
          type="button"
          onClick={onShowHeader}
          data-testid="show-full-header"
          aria-label="Show the full header (name, account, voice, font, theme controls)"
          className={`flex items-center gap-1 px-2 py-1 border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white font-semibold whitespace-nowrap focus:outline focus:outline-2 focus:outline-[#B85838]`}
          style={{ fontSize: 'calc(11px / var(--ts-chrome-scale, 1))' }}
        >
          <UiIcon name="chevronDown" /> Show header
        </button>
      )}
      {/* THE DOOR'S NAME STAYS ON THE ROW (Darrell 2026-09-23, same sitting,
          with the header tucked away on the church door: "I believe we can
          still say the site's names when the header is hidden... still in the
          space available"). The wordmark left with the header; this row has
          the room, so the name the person opened rides here, in the same
          face the header uses for it. Fixed px like the row's other words,
          so it never compounds with the text-size setting. */}
      {/* THE WHOLE BRAND, NOT A BLAND WORD (Darrell 2026-09-24, a screenshot
          of this row beside the header lockup: "make the short tab fit this in
          that space... to promote what it is... Currently it shows a bland
          PoeTech" / "Next to show header"). The row carries the header's own
          lockup: the name in its display face, the tagline in its small
          uppercase accent beneath. The name WRAPS rather than cuts off mid-word
          (the 2026-07-06 rule for the header name). Fixed px like the row's
          other words, so it never compounds with the text-size setting. */}
      <BrandLockup name={siteName} tagline={siteTagline} />
      </div>
      {/* Plain words, not an icon: the reader who needs this is the reader who
          could not find it. Fixed px (like the control's own labels) so the
          way out never compounds with the setting it undoes. */}
      {/* ON A PHONE, ONE DROPDOWN IN THE CORNER (Darrell 2026-09-24: "can the
          text sizes fit in the top right corner of smaller screen or a drop
          down with all options?" / "Keeping the screen real-estate as clear as
          possible?"). Below 640 px the five buttons took a line of their own;
          the dropdown holds all five in one control beside the way back. From
          640 px up the full row fits and stays. */}
      <div className="sm:hidden">
        <TextSizeControl variant="compact" />
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <span className="text-[#5A5751] font-semibold whitespace-nowrap" style={{ fontSize: 'calc(11px / var(--ts-chrome-scale, 1))' }}>
          Text size
        </span>
        <TextSizeControl variant="header" />
      </div>
    </div>
  );
}
