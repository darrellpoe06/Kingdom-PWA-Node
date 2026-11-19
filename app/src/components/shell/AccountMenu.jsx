// =============================================================================
// AccountMenu — the list under a person's picture, one frame for every door
// =============================================================================
// Darrell 2026-11-19, with the PoeTech app open on his tablet and the Love
// Corner open on his phone: "What happened to the image in the top right
// corner of PoeTech App for getting access like the Love Corner App?" and,
// earlier, "I also like the picture options in all apps especially PoeTech
// App". The Love Corner's menu (DR-1483, DR-1579) was written with its rows
// inline; this is its frame with the rows taken as DATA, so each door hands
// in only the rows that have a real place on it and nothing is copied
// (DR-1600).
//
// A row is { key, label, onSelect, out?, chip?, chipMuted? }. The frame owns
// what every door's menu must do the same way: Escape closes it, a tap
// outside the menu and its picture closes it (unless a dialog the menu opened
// is up, `hold`), the first row takes focus when it opens, and every row is a
// real button with role="menuitem". `look` picks the paint: 'lovecorner' is
// the church's .lch-* classes; 'poetech' is the shell's own palette classes,
// which every [data-theme] already recolors (lib/theme-css.js), so the menu
// follows cream, midnight and every other theme with no palette of its own.
import React, { useEffect, useRef } from 'react';

const LOOKS = {
  lovecorner: {
    menu: 'lch-menu',
    who: 'lch-menu-who',
    list: 'lch-menu-list',
    row: 'lch-menu-row',
    out: 'lch-menu-out',
    chip: 'lch-chip',
    chipMuted: 'lch-chip-muted',
    focus: 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#CFA63C]',
  },
  poetech: {
    menu: 'acct-menu bg-white text-[#1A1815] border border-[#1A1815]',
    who: 'acct-menu-who border-b border-[#E8E4DC]',
    list: 'acct-menu-list',
    row: 'acct-menu-row text-[#1A1815] hover:bg-[#E8E4DC]',
    out: 'acct-menu-out text-[#B85838] border-t border-[#E8E4DC]',
    chip: 'acct-chip bg-[#1A1815] text-white',
    chipMuted: 'acct-chip-muted text-[#5A5751]',
    focus: 'focus:outline focus:outline-2 focus:outline-[#B85838]',
  },
};

/** Pure. The paint for a look; an unknown look is the Love Corner's (the first door that had one). */
export function accountMenuLook(look) {
  return LOOKS[look] || LOOKS.lovecorner;
}

export default function AccountMenu({
  name,
  who,
  email,
  rows = [],
  anchorRef = null,
  onClose,
  hold = false,
  look = 'lovecorner',
  testid = 'account-menu',
  rowTestid = (key) => `account-menu-${key}`,
}) {
  const ref = useRef(null);
  const L = accountMenuLook(look);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = (e) => {
      const inMenu = ref.current && ref.current.contains(e.target);
      const onAnchor = anchorRef && anchorRef.current && anchorRef.current.contains(e.target);
      if (!inMenu && !onAnchor && !hold) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [onClose, anchorRef, hold]);
  useEffect(() => {
    const first = ref.current && ref.current.querySelector('button');
    if (first) first.focus();
  }, []);
  return (
    <div ref={ref} className={L.menu} role="menu" aria-label="My account" data-testid={testid}>
      <div className={L.who}>
        <b>{name}</b>
        <small>
          {who}
          {email ? ` · ${email}` : ''}
        </small>
      </div>
      <ul className={L.list}>
        {rows.map((r) => (
          <li role="none" key={r.key}>
            <button type="button" role="menuitem" onClick={r.onSelect} className={`${L.row} ${r.out ? L.out : ''} ${L.focus}`} data-testid={rowTestid(r.key)}>
              {r.label}
              {r.chip && <span className={L.chip}>{r.chip}</span>}
              {r.chipMuted && <span className={L.chipMuted}>{r.chipMuted}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
