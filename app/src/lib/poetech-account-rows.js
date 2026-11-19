// =============================================================================
// poetech-account-rows — what the picture's menu holds on the PoeTech door
// =============================================================================
// DR-1600. The Love Corner's menu (DR-1579) has ten rows; the PoeTech door
// gets the ones that have a real place on THIS door for THIS reader, and no
// row is wired to nothing. Each row names where it goes (`to`), and a view is
// only offered when the shell already draws it for the reader: it is in the
// reader's own top-level tab list (lib/nav-items.jsx, the same gated list the
// tab row and the sidebar draw), so the menu can never open a door the tab
// row would not. Nothing here stores anything: the menu reads the person's
// existing profile row and moves between surfaces that already exist.
//
// Left out on purpose, each with its reason (and a test that keeps it out):
//   Give, Contact the church  the church's own rows; this is not its door.
//   Notifications             the bell sits beside the picture in the open
//                             header and is the one notifications list.
//   Share · Install · Help    their controls sit in the open header (Share and
//                             Install as AppDoorControls, Help as the "?").
//
// `to` is one of:
//   { dialog: 'profile' }          My profile, in the quiet Modal
//   { view, churchView? }          a top-level view (and its sub-tab)
//   { sheet: 'personalize' }       Personalize My App
//   { signOut: true }              sign out
export const POETECH_ACCOUNT_ROWS = Object.freeze([
  { key: 'profile', label: 'My Profile', to: { dialog: 'profile' } },
  { key: 'church', label: 'My Church', to: { view: 'church', churchView: 'my-record' } },
  { key: 'messages', label: 'Messages', to: { view: 'messages' } },
  { key: 'subscription', label: 'Subscription', chipMuted: 'PoeTech+', to: { view: 'about' } },
  { key: 'personalize', label: 'Appearance & Accessibility', to: { sheet: 'personalize' } },
  { key: 'admin', label: 'Admin', to: { view: 'admin' } },
  { key: 'logout', label: 'Log Out', out: true, to: { signOut: true } },
]);

/** The places a row may name that are not views: each is opened by the account button itself. */
export const ACCOUNT_PLACES = Object.freeze({ dialog: Object.freeze(['profile']), sheet: Object.freeze(['personalize']) });

/** Pure. The view ids out of the shell's [id, label] tab list (separators dropped). */
export function viewIdsOf(navTabs) {
  const out = [];
  for (const t of Array.isArray(navTabs) ? navTabs : []) {
    const id = Array.isArray(t) ? t[0] : t;
    if (typeof id === 'string' && id && id !== '__sep__') out.push(id);
  }
  return out;
}

/** Pure. Whether a row's place is real for this reader. A row naming an unknown kind of place never is. */
export function rowHasPlace(row, viewIds = []) {
  const to = row && row.to;
  if (!to || typeof to !== 'object') return false;
  if (to.signOut === true) return true;
  if (to.dialog) return ACCOUNT_PLACES.dialog.includes(to.dialog);
  if (to.sheet) return ACCOUNT_PLACES.sheet.includes(to.sheet);
  if (to.view) return (Array.isArray(viewIds) ? viewIds : []).includes(to.view);
  return false;
}

/**
 * Pure. The rows the picture's menu shows on the PoeTech door, in order:
 * every row whose place this reader's shell draws. `viewIds` is the reader's
 * own top-level tab ids (viewIdsOf(navTabs)).
 */
export function poetechAccountRows(viewIds = [], rows = POETECH_ACCOUNT_ROWS) {
  return (rows || []).filter((r) => rowHasPlace(r, viewIds));
}
