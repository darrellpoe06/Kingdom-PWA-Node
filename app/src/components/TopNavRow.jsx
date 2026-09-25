// =============================================================================
// TopNavRow: the family shell's top nav row, and the one-tab door's brand row
// =============================================================================
// Darrell 2026-09-24, on his Fold (1812 px) in The Love Corner with the header
// tucked away: "Why does the Church tab space need that? Can we save even more
// space if not... can we add another Love Corner etc tag in the space? Make
// sense?" And, asked whether the brand should then leave the collapsed row:
// "Both places are good... why not".
//
// MEASURED before the change, in Chromium, on /?lovecorner=1&view=church with
// the header collapsed: the top nav row held the back/forward pair, ONE tab
// ("Church"), and the chevron, with the rest of a full-width row empty. The
// Church sub-strip right under it already says where you are, so that row
// named the page twice and spent 39-43 px doing it.
//
// So when the tab list holds exactly ONE tab (the church door filters every
// other tab away, poe-financial-mvp-v28.jsx), the row stops being a tab row:
//   * back/forward stays on the left and the header chevron on the right;
//   * the lone tab is not drawn. Screen readers still hear where they are
//     (an sr-only "Church" marked aria-current="page");
//   * at Normal, Large and Larger the collapsed row (Show header, the brand
//     lockup, text size) sits INSIDE this row, so the two rows become one;
//   * at Largest and Big Print that collapsed row is the fixed bottom bar
//     (DR-0438, index.css) and leaves the row, so the row carries the brand
//     lockup of its own. That is the "both places": the top of the screen and
//     the bottom bar, each with the brand;
//   * with the header open, the header's own wordmark is right above, and the
//     row carries the lockup too, as he asked.
// Every other shell (many tabs) renders exactly the row it rendered before.
import React from 'react';
import { TabScroll, NavControls } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import { BrandLockup } from './TextSizeControl.jsx';

// The one tab, when the list holds exactly one (separators excluded); else null.
export function loneTab(children) {
  const tabs = React.Children.toArray(children).filter((c) => React.isValidElement(c) && c.key !== '.$sep');
  return tabs.length === 1 ? tabs[0] : null;
}

export default function TopNavRow({ hatch = null, navHistory = {}, collapsed = false, onToggleHeader, brandName = '', brandTagline = '', children }) {
  const lone = loneTab(children);
  // ONE WAY BACK PER PHONE ROW (DR-0640). When the collapsed row sits inside
  // the one-tab row, its "Show header" button and this chevron do the same
  // thing side by side. Measured at 320 px: with both, "Show header" and the
  // size dropdown could not share a line (220 px needed, 187 px free) and the
  // merged row came out TALLER than the two rows it replaced. Below 640 px, in
  // that one state and only while the collapsed row is IN the row (not at
  // Largest or Big Print, where it is the bottom bar), the chevron yields to
  // the words, the way back DR-0577 asked for (index.css). Everywhere else it
  // stays.
  const chevronYields = !!lone && collapsed;
  const chevron = (
    // HEADER HIDEAWAY toggle: pinned to the right of the row so it is ALWAYS
    // visible (it never scrolls with the tabs). One tap hides the whole top
    // chrome for max room; one tap brings it back. Points UP to tuck away and
    // DOWN to bring back. The color is a chrome token (#5A5751, 5.9:1 on the
    // bar, remapped to #888888 on midnight); the icon inherits it.
    <button
      type="button"
      onClick={onToggleHeader}
      aria-expanded={!collapsed}
      aria-label={collapsed ? 'Show the full header (date, account, voice, font, theme controls)' : 'Hide the top bar — keep only the tabs for more room'}
      title={collapsed ? 'Show the full header' : 'Hide the top bar (keep tabs)'}
      className={`${chevronYields ? 'one-tab-chevron-yields ' : ''}ts-chrome-region shrink-0 self-stretch px-2.5 sm:px-3 flex items-center justify-center border-l border-[#E8E4DC] text-[#5A5751] hover:text-[#1A1815] hover:bg-[#E8E4DC] focus:outline focus:outline-2 focus:outline-[#B85838]`}
    >
      <UiIcon name={collapsed ? 'chevronDown' : 'chevronUp'} className="text-base" />
      <span className="sr-only">{collapsed ? 'Show header' : 'Hide header'}</span>
    </button>
  );
  const back = (
    <div className="pl-1 sm:pl-6 lg:pl-8 flex items-stretch">
      <NavControls chrome {...navHistory} />
    </div>
  );

  if (!lone) {
    // THE reference tab row Darrell loves ("easy and fluid," "classy"): ONE
    // flat row of every top-level surface through the shared <TabScroll>
    // (`chrome` = .ts-chrome-region caps it while body text scales). A 6-area
    // cluster nav was tried (#381) and reverted 2026-06-26: grouping the
    // familiar tabs read as "lost the tabs". Back/Forward stay pinned left,
    // never scrolling away (lib/nav-history.js). Unchanged by DR-0640.
    return (
      <>
        {hatch}
        <nav className="border-t border-[#E8E4DC]">
          <div className="flex items-stretch">
            {back}
            <TabScroll chrome className="pr-1 sm:pr-6 lg:pr-8 min-w-0 flex-1" rowClassName="sm:text-sm items-stretch">
              {children}
            </TabScroll>
            {chevron}
          </div>
        </nav>
      </>
    );
  }

  const label = lone.props && lone.props.children;
  return (
    <nav className="border-t border-[#E8E4DC]" aria-label="Main">
      <div data-testid="one-tab-brand-row" className="flex items-stretch">
        {back}
        <span data-testid="one-tab-current" className="sr-only" aria-current="page">{label}</span>
        {/* The row's own lockup. With the collapsed row inside this row it
            would say the name twice side by side, so it yields to it there
            (.one-tab-brand--float, index.css) and returns at Largest and Big
            Print, when the collapsed row has moved to the bottom bar. */}
        <div data-testid="one-tab-brand" className={`${collapsed ? 'one-tab-brand--float ' : 'flex '}ts-chrome-region flex-1 min-w-0 items-center px-3 py-1`}>
          <BrandLockup name={brandName} tagline={brandTagline} nameTestId="top-brand-name" taglineTestId="top-brand-tagline" />
        </div>
        {collapsed && hatch && React.isValidElement(hatch) ? React.cloneElement(hatch, { inline: true }) : null}
        {chevron}
      </div>
    </nav>
  );
}
