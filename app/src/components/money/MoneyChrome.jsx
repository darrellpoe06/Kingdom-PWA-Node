// =============================================================================
// MoneyChrome — the Money section's navigation: sidebar, strip, and tab row
// =============================================================================
// Christina, 2026-10-28: "Replace the crowded multi-row navigation inside Money
// with a cleaner, more intuitive navigation system." Nine sections (lib/money-nav.js)
// drawn three ways from ONE map, so they can never disagree:
//
//   · MoneyNavStrip — rides INSIDE the shell's existing Money header row (the
//     <TabScroll> that also carries the one Upload button, DR-0709). Between
//     `sm` and `lg` it is the section strip; on a phone (below `sm`) the ONE
//     bottom bar is the nav, so the strip shows only the section's name — never
//     two navigation rows on a phone; at `lg` and up the sidebar takes over and
//     the strip again shows only the name, so the header never repeats the rail.
//   · MoneySideNav — the collapsible left rail at `lg`+, in the Family Operating
//     Systems forest / ivory / gold of the app's own sidebar (components/shell/
//     SideNav.jsx), so Money reads as part of the house, not a second app.
//   · MoneyTabRow — the in-section row (Accounts · Entities · Legal ...), the
//     only place a legacy sub-tab is listed, one tap inside its section. Every
//     one of the twelve ids the shell has routed since v28 is listed by exactly
//     one section (lib/money-nav.js, held by __tests__/money-nav.test.js).
//
// On a phone the bottom bar (ChromeDock) shows Overview · Transactions ·
// Budget · Goals and More — the Money entries ride in the app's ONE bar
// (DR-0716), never a second bar over the content.
//
// A section never goes blank (P15): a section with a single surface draws no
// tab row, and an unknown id resolves to the Overview in lib/nav-history.js
// before it ever reaches here.
//
// COLORS ARE CLASSES, NEVER INLINE: every token here has a midnight twin in
// lib/theme-css.js, so contrast-guard and the legibility guard police this
// file like any other. The rail is chrome (.ts-chrome-region, DR-0438).
// =============================================================================
import React, { useState } from 'react';
import UiIcon from '../UiIcon.jsx';
import { MONEY_SECTIONS, sectionFor, sectionTabs } from '../../lib/money-nav.js';
import { isIsolatedPreview, PREVIEW_STORAGE_KEY } from '../../lib/preview-isolation.js';

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const RAIL_FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#C9A227]';
const RAIL_KEY = 'poe-money-rail-collapsed';

/** The header strip: sections below lg; the section's name at lg+. */
export function MoneyNavStrip({ booksView = 'overview' }) {
  // The sideways section strip is GONE (Christina 2026-10-28, on her Samsung:
  // the 640–1023px band showed it scrolling "like a desktop application").
  // Below the laptop rail the ONE bottom bar carries the sections
  // (ChromeDock, MONEY_PHONE_QUERY); at the rail the rail does. The header
  // keeps only the current-section label, at every width.
  const current = sectionFor(booksView) || MONEY_SECTIONS[0];
  return (
    <div data-testid="money-nav-strip" className="flex items-center" aria-label="Money section">
      <span data-testid="money-strip-current" aria-current="page" data-section={current.id} className="inline-flex items-center gap-2 px-3 py-2 text-[0.75rem] uppercase tracking-[0.2em] text-[#5A5751]">
        <span aria-hidden="true" className="text-[#B85838]"><UiIcon name="coins" /></span>
        Money <span aria-hidden="true">·</span> <span className="text-[#1A1815] font-semibold">{current.label}</span>
      </span>
    </div>
  );
}

/** The left rail at lg+. Collapses to icons; the choice is remembered per device. */
export function MoneySideNav({ booksView = 'overview', setBooksView }) {
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem(RAIL_KEY) === '1'; } catch (_) { return false; } });
  const toggle = () => setCollapsed((v) => { const n = !v; try { localStorage.setItem(RAIL_KEY, n ? '1' : '0'); } catch (_) { /* private mode */ } return n; });
  const current = sectionFor(booksView) || MONEY_SECTIONS[0];
  return (
    <aside
      data-testid="money-side-nav"
      data-collapsed={collapsed ? 'true' : 'false'}
      aria-label="Money sections"
      data-read-skip
      className={`money-side-nav ts-chrome-region hidden lg:flex lg:flex-col shrink-0 sticky self-start bg-[#1F3A2E] text-[#F6F1E7] rounded-2xl mr-5 print:hidden ${collapsed ? 'w-[3.75rem]' : 'w-[13.5rem]'}`}
      style={{ top: 'calc(var(--lwb-h, 0px) + 0.75rem)', maxHeight: 'calc(100dvh - var(--lwb-h, 0px) - 1.5rem)', overflowY: 'auto' }}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 pt-3 pb-2`}>
        {!collapsed && <span className="text-[0.5625rem] uppercase tracking-[0.22em] text-[#C9A227] font-semibold">Money</span>}
        <button
          type="button"
          data-testid="money-rail-toggle"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expand the Money sections rail' : 'Collapse the Money sections rail to icons'}
          title={collapsed ? 'Expand' : 'Collapse'}
          className={`min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-lg text-[#F6F1E7] hover:bg-[#2B2F2D] ${RAIL_FOCUS}`}
        >
          <span aria-hidden="true" className="text-[1rem] leading-none"><UiIcon name={collapsed ? 'chevronDown' : 'chevronUp'} /></span>
        </button>
      </div>
      <nav aria-label="Money" className="px-2 pb-3 flex flex-col gap-0.5">
        {MONEY_SECTIONS.map((s) => {
          const active = current.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              data-testid={`money-rail-${s.id}`}
              onClick={() => setBooksView && setBooksView(s.id)}
              aria-current={active ? 'page' : undefined}
              aria-label={collapsed ? s.label : undefined}
              title={s.label}
              className={`min-h-[36px] w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-left text-[0.8125rem] transition-colors ${RAIL_FOCUS} ${active ? 'bg-[#F6F1E7] text-[#1F3A2E] font-semibold' : 'text-[#F6F1E7] hover:bg-[#2B2F2D]'} ${collapsed ? 'justify-center px-0' : ''}`}
            >
              <span aria-hidden="true" className="text-[1rem] leading-none shrink-0"><UiIcon name={s.icon} /></span>
              {!collapsed && <span className="min-w-0 flex-1 truncate">{s.label}</span>}
              {!collapsed && active && <span aria-hidden="true" className="w-2 h-2 rounded-full border-2 border-[#C9A227] shrink-0" />}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

/** The in-section tab row. Nothing is drawn for a section with one surface. */
export function MoneyTabRow({ booksView = 'overview', setBooksView, importedAllowed = true }) {
  const current = sectionFor(booksView) || MONEY_SECTIONS[0];
  const tabs = sectionTabs(current.id, (id) => id !== 'imported' || importedAllowed);
  if (tabs.length < 2) return null;
  const activeId = current.id === booksView ? (current.tabs[0] || current.id) : booksView;
  return (
    <div data-testid="money-tab-row" role="tablist" aria-label={`${current.label} tabs`} className="flex flex-wrap items-center gap-1.5 mb-4">
      {tabs.map(([id, words]) => {
        const active = id === activeId;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={`money-tab-${id}`}
            onClick={() => setBooksView && setBooksView(id)}
            className={`min-h-[36px] px-3 py-1.5 text-[0.75rem] font-medium rounded-full border transition-colors ${FOCUS} ${active ? 'poe-selected bg-[#1A1815] text-white border-[#1A1815]' : 'bg-white text-[#5A5751] border-[#E8E4DC] hover:bg-[#FAF8F4] hover:text-[#1A1815]'}`}
          >
            {words}
          </button>
        );
      })}
    </div>
  );
}

/** The body layout: rail beside the content at lg+, the tab row above the
 *  content on every width. The children are the shell's own render branches,
 *  mounted exactly as before. */
export default function MoneyLayout({ booksView = 'overview', setBooksView, importedAllowed = true, children }) {
  const current = sectionFor(booksView) || MONEY_SECTIONS[0];
  return (
    <div data-testid="money-layout" data-section={current.id} className="flex items-start w-full">
      <MoneySideNav booksView={booksView} setBooksView={setBooksView} />
      <div className="flex-1 min-w-0">
        {isIsolatedPreview() && <TestHouseholdBanner />}
        <MoneyTabRow booksView={booksView} setBooksView={setBooksView} importedAllowed={importedAllowed} />
        {children}
      </div>
    </div>
  );
}

/** The preview TEST HOUSEHOLD's own banner (lib/preview-isolation.js). On a
 *  preview host the household is fictional, what the tester enters is saved
 *  only on this device under the test key, no session exists and the data
 *  client reaches nothing — the banner says so, and offers the one control a
 *  tester needs: start the household over from the fictional seed. */
export function TestHouseholdBanner() {
  const [resetting, setResetting] = useState(false);
  const reset = async () => {
    setResetting(true);
    try { await window.storage?.remove?.(PREVIEW_STORAGE_KEY); } catch (_) { /* best effort */ }
    try { window.location.reload(); } catch (_) { setResetting(false); }
  };
  return (
    <section data-testid="preview-test-household" role="note" aria-label="Test household" className="mb-3 rounded-2xl border border-[#C9A227] bg-[#FBF7EC] px-4 py-3 text-[#1A1815]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[0.5625rem] uppercase tracking-[0.18em] text-[#B85838] font-semibold">Test household · fictional data</div>
          <p className="mt-0.5 text-[0.8125rem] leading-snug">Everything here is made up. What you enter is saved only on this device. Your family's real records are not connected, and nothing can sign in.</p>
        </div>
        <button type="button" onClick={reset} disabled={resetting} data-testid="preview-test-household-reset" className={`shrink-0 min-h-[44px] rounded-xl border border-[#1A1815] px-4 text-[0.8125rem] font-semibold ${FOCUS}`}>
          {resetting ? 'Starting over…' : 'Start over'}
        </button>
      </div>
    </section>
  );
}
