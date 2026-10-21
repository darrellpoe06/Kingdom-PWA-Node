// =============================================================================
// PropertiesTab — PoeTech's Properties tab: the front door, then the backend
// =============================================================================
// Darrell, 2026-10-21: "Poe Properties should show the same front door that the
// Poe Properties Apps show our tenants... Owners should have an edit tab that
// lets them see the backend... PoeTech App owners... they will see the tenants
// version inside the PoeTech App on Properties tab... just like the other one."
//
// Two panes, one tab:
//   Front door -- SignedOutDoor from the Poe Properties door itself, in preview:
//                 the same welcome, portals, live listings and application a
//                 tenant or applicant meets (components/PropertiesDoor.jsx). It
//                 is the same component, lazily loaded, so the two cannot drift.
//   Edit       -- PropertiesApp, the backend this tab always was (Doors, Work
//                 Board, Rent, ...), with every prop the shell hands it.
// THE TAB OPENS ON THE FRONT DOOR EVERY TIME (Darrell 2026-10-21, the same
// day, from the tab sitting on Edit: "Default to the front door look in the
// properties tab!!!!!!!"). The first version remembered the last pane on the
// device, so one visit to Edit made Edit the door from then on; now only a deep
// link into the backend (?tab= or ?door=, DR-0901) opens Edit, since that is
// where the link points, and everything else opens the front door.
// =============================================================================
import React, { Suspense, lazy, useState } from 'react';
import PropertiesApp, { PREVIEW_ROLES } from './PropertiesApp.jsx';
import { addressNow } from './use-address.js';
import { WELCOME_CSS } from '../../components/PoePropertiesWelcome.jsx';
import { useThemePref } from '../../lib/theme-css.js';

const FrontDoor = lazy(() => import('../../components/PropertiesDoor.jsx').then((m) => ({ default: m.SignedOutDoor })));

export const PROPERTIES_PANES = Object.freeze([
  Object.freeze({ id: 'front', label: 'Front door', hint: 'What tenants and applicants see' }),
  Object.freeze({ id: 'edit', label: 'Edit', hint: 'The backend: doors, work, rent' }),
]);

/** The pane to open: a backend deep link opens Edit; everything else opens the front door. */
export function initialPane({ address = { tab: null, door: null } } = {}) {
  if (address && (address.tab || address.door)) return 'edit';
  return 'front';
}

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';
const SEEN_AS = Object.freeze({ tenant: 'a tenant', household: 'a household member', field_worker: 'a 1099 worker', manager: 'a manager' });

export default function PropertiesTab(props) {
  const [pane, setPane] = useState(() => initialPane({ address: addressNow() }));
  const [theme] = useThemePref('cream');
  // "See what they see after signing in": the same workspace with that role's
  // face, over the doors this owner reads (PropertiesApp viewAs). Not kept on
  // the device: a preview is a visit, the tab comes back to the door or Edit.
  const [viewAs, setViewAs] = useState(null);
  const pick = (id) => { setViewAs(null); setPane(id); };
  return (
    <div data-testid="properties-tab">
      <div className="flex flex-wrap items-center gap-2 mb-3" role="tablist" aria-label="Properties: front door or backend">
        {PROPERTIES_PANES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={!viewAs && pane === p.id}
            onClick={() => pick(p.id)}
            title={p.hint}
            data-testid={`properties-pane-${p.id}`}
            className={`min-h-[44px] px-4 border text-xs uppercase tracking-wider ${!viewAs && pane === p.id ? 'bg-[#2F5D50] border-[#2F5D50] text-white' : 'border-[#1A1815] text-[#1A1815]'} ${FOCUS}`}
          >{p.label}</button>
        ))}
        <span className="text-xs text-[#5A5751]">{viewAs ? `Seeing your doors as ${SEEN_AS[viewAs]} sees them` : pane === 'front' ? 'Your front door, exactly as your tenants and applicants see it' : 'The backend your tenants never see'}</span>
      </div>
      {viewAs ? (
        <div data-testid="properties-view-as" data-role={viewAs}>
          <div className="border-l-4 border-[#B85838] bg-white p-2 mb-3 text-xs text-[#1A1815]" role="status" data-testid="properties-view-as-banner">
            <strong>Seen as {SEEN_AS[viewAs]}.</strong> These are the screens they get after signing in, over your own doors. Anything you send from here is real and is recorded as you, the owner.
            <button type="button" onClick={() => setViewAs(null)} className={`ml-2 underline ${FOCUS}`} data-testid="properties-view-as-back">Back to the front door</button>
          </div>
          <PropertiesApp {...props} viewAs={viewAs} />
        </div>
      ) : pane === 'front' ? (
        <div data-theme={theme === 'cream' ? undefined : theme} className="pp-door rounded overflow-hidden px-3 sm:px-4" data-testid="properties-front-door">
          <style>{WELCOME_CSS}</style>
          <Suspense fallback={<p className="text-xs p-3">Opening the front door…</p>}>
            <FrontDoor preview onEdit={() => pick('edit')} onViewAs={(r) => setViewAs(PREVIEW_ROLES.includes(r) ? r : null)} />
          </Suspense>
        </div>
      ) : (
        <PropertiesApp {...props} />
      )}
    </div>
  );
}
