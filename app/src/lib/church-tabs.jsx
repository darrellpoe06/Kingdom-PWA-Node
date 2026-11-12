// =============================================================================
// church-tabs — the ONE list of the Church tab's sub-tabs, and how the phone
// groups them (the Love Corner redesign, 2026-11-12).
// =============================================================================
// Until this file the gated list lived inline in the shell's JSX (one long
// line in poe-financial-mvp-v28.jsx) where only the sub-nav strip could read
// it. The redesign's bottom bar and its More sheet need the SAME list — gated
// the same way — so it moved here, pure, and the shell calls it. "Derived,
// not a second list" (DR-0677): the strip, the bar and the sheet all draw from
// this function, and a tab dropped here is dropped everywhere, which is what
// the preservation test pins (church-tabs.test.js).
//
// The brief's own rule: "Do not eliminate existing tabs or merge their
// underlying functionality." Every id below is a `churchView` the shell mounts
// (surface-mount-integrity.test.js) and a sub nav-history accepts.
import React from 'react';
import UiIcon from '../components/UiIcon.jsx';
import { isChurchOfficeRole } from './church-access-store.js';

/**
 * The gated [id, label] pairs the Church sub-nav strip shows, in its order.
 * Labels carry the strip's icons; `words` below carry the plain names.
 */
export function churchSubTabs({ signedIn = false, reviewerMode = false, officeRole = '', isChurchStaff = false } = {}) {
  return [
    ['home', 'Church'],
    ['ministries', <><UiIcon name="heart" /> Ministries</>],
    ['pulpit', <><UiIcon name="bookOpen" /> The Word</>],
    ['scripture', <><UiIcon name="book" /> Scripture</>],
    ['engagement', 'Engagement'],
    ['choir', 'Choir'],
    ['bus', <><UiIcon name="users" /> Bus Ministry</>],
    ['program', <><UiIcon name="bookOpen" /> Order of Service</>],
    ['learn', 'Learn'],
    ['institute', <><UiIcon name="landmark" /> Institute</>],
    ['conference', 'Conference'],
    ['events', 'Campus Rentals'],
    ['projects', <><UiIcon name="sliders" /> Projects</>],
    ...(signedIn ? [['my-record', <><UiIcon name="pencil" /> My Record</>], ['access', <><UiIcon name="lock" /> Access</>], ['members', <><UiIcon name="users" /> Members</>]] : []),
    ...(!reviewerMode && isChurchOfficeRole(officeRole) ? [['giving-book', <><UiIcon name="coins" /> Giving Book</>]] : []),
    ...(isChurchStaff ? [['harvest', <><UiIcon name="sparkle" /> Harvest</>], ['videowall', <><UiIcon name="monitor" /> Video Wall</>], ['devices', <><UiIcon name="tools" /> Devices</>], ['infra-plan', <><UiIcon name="sliders" /> Infra Plan</>], ['observe', <><UiIcon name="lock" /> Observation</>]] : []),
  ].map(([id, label]) => [id, label] /* church-sub-tabs */); // the marker feedback-area-guard reads, as nav-items' top-level-nav
}

/** Plain words for each sub-tab, for aria and the phone's sheet. */
export const CHURCH_TAB_WORDS = Object.freeze({
  home: 'Church', ministries: 'Ministries', pulpit: 'The Word', scripture: 'Scripture', engagement: 'Engagement',
  choir: 'Choir', bus: 'Bus Ministry', program: 'Order of Service', learn: 'Learn', institute: 'TLC Theological Institute',
  conference: 'Conference', events: 'Campus Rentals', projects: 'Projects', 'my-record': 'My Record', access: 'Access',
  members: 'Members', 'giving-book': 'Giving Book', harvest: 'Harvest', videowall: 'Video Wall', devices: 'Devices',
  'infra-plan': 'Infra Plan', observe: 'Observation', 'eternal-algorithms': 'Eternal Algorithms',
});

/** An icon per sub-tab for the sheet (UiIcon names). */
export const CHURCH_TAB_ICONS = Object.freeze({
  home: 'home', ministries: 'heart', pulpit: 'bookOpen', scripture: 'book', engagement: 'dice', choir: 'volume', bus: 'users',
  program: 'bookOpen', learn: 'pencil', institute: 'landmark', conference: 'calendar', events: 'calendar', projects: 'sliders',
  'my-record': 'pencil', access: 'lock', members: 'users', 'giving-book': 'coins', harvest: 'sparkle', videowall: 'monitor',
  devices: 'tools', 'infra-plan': 'sliders', observe: 'lock', 'eternal-algorithms': 'sparkle',
});

/**
 * How the phone's More sheet groups the sub-tabs. Every id churchSubTabs can
 * return belongs to exactly one group (the test proves it); an id this map
 * does not know lands in the first group so a tab added later is never hidden.
 */
export const CHURCH_TAB_GROUPS = Object.freeze([
  { key: 'worship',    label: 'Worship & the Word', ids: ['home', 'pulpit', 'scripture', 'program', 'engagement'] },
  { key: 'ministries', label: 'Ministries',         ids: ['ministries', 'choir', 'bus'] },
  { key: 'learning',   label: 'Learning',           ids: ['learn', 'institute', 'eternal-algorithms'] },
  { key: 'campus',     label: 'Events & the campus', ids: ['conference', 'events', 'projects'] },
  { key: 'mine',       label: 'My church',          ids: ['my-record', 'access', 'members'] },
  { key: 'office',     label: 'Church office',      ids: ['giving-book', 'harvest', 'videowall', 'devices', 'infra-plan', 'observe'] },
]);

/** Group the gated pairs for the sheet: [{ key, label, items: [[id, words]] }], empty groups omitted. */
export function churchTabGroups(pairs = []) {
  const ids = pairs.map(([id]) => id);
  const seen = new Set();
  const out = CHURCH_TAB_GROUPS.map((g) => {
    const items = g.ids.filter((id) => ids.includes(id) && !seen.has(id)).map((id) => { seen.add(id); return [id, CHURCH_TAB_WORDS[id] || id]; });
    return { key: g.key, label: g.label, items };
  });
  const strays = ids.filter((id) => !seen.has(id)).map((id) => [id, CHURCH_TAB_WORDS[id] || id]);
  if (strays.length) out[0].items.push(...strays);
  return out.filter((g) => g.items.length > 0);
}

/**
 * The phone's bottom bar on the church door (the brief's §10 "clean mobile
 * bottom navigation bar"): Home, Watch, Word, with Give and More already on
 * the bar (ChromeDock). Each opens a sub-tab the shell mounts; Watch opens the
 * Church home on its Worship section (lib/church-home-section.js).
 */
export const CHURCH_BOTTOM_NAV = Object.freeze([
  { key: 'church-home',  churchView: 'home',   section: null,      icon: 'home',     words: 'Home' },
  { key: 'church-watch', churchView: 'home',   section: 'worship', icon: 'monitor',  words: 'Watch' },
  { key: 'church-word',  churchView: 'pulpit', section: null,      icon: 'bookOpen', words: 'Word' },
]);
