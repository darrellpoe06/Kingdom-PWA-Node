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
// The pane is remembered per device. A deep link into the backend (?tab= or
// ?door=, DR-0901) opens Edit, since that is where the link points.
// =============================================================================
import React, { Suspense, lazy, useState } from 'react';
import PropertiesApp from './PropertiesApp.jsx';
import { addressNow } from './use-address.js';
import { WELCOME_CSS } from '../../components/PoePropertiesWelcome.jsx';
import { useThemePref } from '../../lib/theme-css.js';

const FrontDoor = lazy(() => import('../../components/PropertiesDoor.jsx').then((m) => ({ default: m.SignedOutDoor })));

export const PROPERTIES_PANE_KEY = 'poetech.properties.pane.v1';
export const PROPERTIES_PANES = Object.freeze([
  Object.freeze({ id: 'front', label: 'Front door', hint: 'What tenants and applicants see' }),
  Object.freeze({ id: 'edit', label: 'Edit', hint: 'The backend: doors, work, rent' }),
]);

/** The pane to open: a backend deep link wins, then this device's last choice, then the front door. */
export function initialPane({ address = { tab: null, door: null }, storage = null } = {}) {
  if (address && (address.tab || address.door)) return 'edit';
  try {
    const v = (storage || globalThis.localStorage).getItem(PROPERTIES_PANE_KEY);
    if (v === 'front' || v === 'edit') return v;
  } catch { /* private mode: the default */ }
  return 'front';
}

function savePane(id) {
  try { globalThis.localStorage.setItem(PROPERTIES_PANE_KEY, id); } catch { /* a per-device convenience only */ }
}

const FOCUS = 'focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]';

export default function PropertiesTab(props) {
  const [pane, setPaneRaw] = useState(() => initialPane({ address: addressNow() }));
  const setPane = (id) => { savePane(id); setPaneRaw(id); };
  const [theme] = useThemePref('cream');
  return (
    <div data-testid="properties-tab">
      <div className="flex flex-wrap items-center gap-2 mb-3" role="tablist" aria-label="Properties: front door or backend">
        {PROPERTIES_PANES.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={pane === p.id}
            onClick={() => setPane(p.id)}
            title={p.hint}
            data-testid={`properties-pane-${p.id}`}
            className={`min-h-[44px] px-4 border text-xs uppercase tracking-wider ${pane === p.id ? 'bg-[#2F5D50] border-[#2F5D50] text-white' : 'border-[#1A1815] text-[#1A1815]'} ${FOCUS}`}
          >{p.label}</button>
        ))}
        <span className="text-xs text-[#5A5751]">{pane === 'front' ? 'Your front door, exactly as your tenants and applicants see it' : 'The backend your tenants never see'}</span>
      </div>
      {pane === 'front' ? (
        <div data-theme={theme === 'cream' ? undefined : theme} className="pp-door rounded overflow-hidden px-3 sm:px-4" data-testid="properties-front-door">
          <style>{WELCOME_CSS}</style>
          <Suspense fallback={<p className="text-xs p-3">Opening the front door…</p>}>
            <FrontDoor preview onEdit={() => setPane('edit')} />
          </Suspense>
        </div>
      ) : (
        <PropertiesApp {...props} />
      )}
    </div>
  );
}
