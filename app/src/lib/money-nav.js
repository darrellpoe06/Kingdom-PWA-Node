// =============================================================================
// money-nav.js — the ONE map of the Money section's navigation (pure)
// =============================================================================
// Christina, 2026-10-28: "Replace the crowded multi-row navigation inside Money
// with a cleaner, more intuitive navigation system ... Preserve existing
// secondary features inside appropriate sections."
//
// Nine sections. Every one of the twelve legacy sub-tabs (the `booksView` ids
// the shell has routed since v28) keeps its id, its deep link and its component;
// it simply LIVES inside a section now. This module is the single source the
// sidebar, the header strip, the phone bar, the in-section tab row and the
// reachability test all read, so they cannot disagree about where a thing is.
//
// The `booksView` state stays the one router value (lib/nav-history.js writes
// it to the URL as ?sub=). A section's own id is a booksView too — so
// ?view=books&sub=overview opens the Overview and ?view=books&sub=accounts opens
// the Accounts section on its Accounts tab, exactly as the old link did.
// =============================================================================

export const MONEY_SECTIONS = [
  { id: 'overview',     label: 'Overview',      icon: 'chart',    tabs: [] },
  { id: 'accounts',     label: 'Accounts',      icon: 'landmark', tabs: ['accounts', 'entities', 'legal'] },
  { id: 'transactions', label: 'Transactions',  icon: 'coins',    tabs: ['transactions', 'imported'] },
  { id: 'budget',       label: 'Budget',        icon: 'sliders',  tabs: [] },
  { id: 'bills',        label: 'Bills',         icon: 'calendar', tabs: ['bills', 'calendar', 'cart', 'owed'] },
  { id: 'goals',        label: 'Goals',         icon: 'sparkle',  tabs: ['goals', 'plan'] },
  { id: 'debt-freedom', label: 'Debt Freedom',  icon: 'shield',   tabs: ['debt-freedom', 'debts'] },
  { id: 'reports',      label: 'Reports',       icon: 'folder',   tabs: ['reports', 'taxes', 'k1099'] },
  { id: 'settings',     label: 'Settings',      icon: 'tools',    tabs: [] },
];

// The words a tab shows inside its section. Legacy ids keep their meaning; the
// section's own id reads as the section's first tab.
export const TAB_WORDS = {
  overview: 'Overview',
  accounts: 'Accounts', entities: 'Entities', legal: 'Legal',
  transactions: 'Transactions', imported: 'Imported',
  budget: 'Budget',
  bills: 'Upcoming', calendar: 'Calendar', cart: 'Subscriptions', owed: 'Owed',
  goals: 'Goals', plan: 'Plan',
  'debt-freedom': 'Planner', debts: 'Debts',
  reports: 'Reports', taxes: 'Taxes', k1099: '1099s',
  settings: 'Settings',
};

// The ids the shell routed before this redesign. They are the ONLY ids that
// mount a legacy component; nothing here may drop one (the reachability test
// in __tests__/money-nav.test.js holds this list against the sections).
export const LEGACY_SUBS = ['entities', 'accounts', 'debts', 'owed', 'plan', 'transactions', 'imported', 'cart', 'k1099', 'taxes', 'calendar', 'legal'];

// The new ids this redesign adds. Each is both a section and its first tab.
export const NEW_SUBS = ['overview', 'budget', 'bills', 'goals', 'debt-freedom', 'reports', 'settings'];

export const ALL_SUBS = [...NEW_SUBS, ...LEGACY_SUBS];

export const DEFAULT_SUB = 'overview';

/** The section a booksView id belongs to (a section id belongs to itself). */
export function sectionFor(sub) {
  for (const s of MONEY_SECTIONS) {
    if (s.id === sub || s.tabs.includes(sub)) return s;
  }
  return null;
}

/** The tab row inside a section: [[id, words], ...]. A section with no tabs
 *  shows no row. Tabs gated away (the Imported tab outside a verified family
 *  session) are filtered by the caller's predicate. */
export function sectionTabs(sectionId, allowed = () => true) {
  const s = MONEY_SECTIONS.find((x) => x.id === sectionId);
  if (!s || !s.tabs.length) return [];
  return s.tabs.filter((id) => allowed(id)).map((id) => [id, TAB_WORDS[id] || id]);
}

/** The five the phone's bottom bar shows inside Money; the rest ride More. */
export const MONEY_BOTTOM_NAV = [
  { key: 'overview',     sub: 'overview',     icon: 'chart',    words: 'Overview' },
  { key: 'transactions', sub: 'transactions', icon: 'coins',    words: 'Transactions' },
  { key: 'budget',       sub: 'budget',       icon: 'sliders',  words: 'Budget' },
  { key: 'goals',        sub: 'goals',        icon: 'sparkle',  words: 'Goals' },
];

/** The sections More holds on a phone (every section not on the bar). */
export function moneyMoreSections() {
  const onBar = new Set(MONEY_BOTTOM_NAV.map((t) => t.sub));
  return MONEY_SECTIONS.filter((s) => !onBar.has(s.id));
}

/** Whether a booksView id is one the Money section knows (anything else routes
 *  to the default, never to a blank branch). */
export function isMoneySub(sub) {
  return ALL_SUBS.includes(sub);
}

/** The shortest path (in taps, from anywhere in Money) to a booksView id:
 *  1 for a section on the bar/sidebar, 2 for a tab inside a section, 3 via More
 *  on a phone. Every id must be reachable in 3 or fewer (the test holds it). */
export function tapsTo(sub, { phone = false } = {}) {
  const s = sectionFor(sub);
  if (!s) return Infinity;
  const onBar = MONEY_BOTTOM_NAV.some((t) => t.sub === s.id);
  const toSection = phone ? (onBar ? 1 : 2) : 1;
  const isFirstTab = s.id === sub || s.tabs[0] === sub;
  return toSection + (isFirstTab ? 0 : 1);
}
