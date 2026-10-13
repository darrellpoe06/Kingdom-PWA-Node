// =============================================================================
// CreateSubNav — Create's second row, the same row Church has
// =============================================================================
// DR-0679, amending DR-0678. Darrell 2026-09-29: "Why take away my type
// texting place?!!!!!!!!!!!! Where is it?!!!!!!!!!!!!!!", then "Obviously give
// us a actual tabs like so we can know!!!!!!!!!!!!!!!!", then "Subtabs", then
// "Review how our tab structure works!!!".
//
// The app has three levels: the main nav; a SECOND row directly under it for a
// section's subs (Church · Ministries · The Word …); and SectionTabs inside a
// page. Create's subs are level 2, so this renders EXACTLY the Church row's
// mechanism: the header's `border-t bg-white` band, the shared <TabScroll
// chrome> primitive (its Show all / Less control, its gutters, its zoom cap),
// and the Church row's button classes (ink underline on the open sub). No new
// tab component.
//
// The subs are DERIVED from the registry (surfaces.js nav:'create', handed in
// by the shell), and each
// one's gate is read through lib/surface-access.js exactly as the shell's other
// gated tabs are: a 'lock' sub stays in the row, marked with the lock, and the
// page says what it is and who it is for. Workspace is first and the default
// on every device; the device orders only the subs after it (DR-0678's roles).
// The open sub lives in lib/create-sub.js, shared with the page.
//
// A Firestick remote is never caged here: the buttons own no arrow keys, so
// the app's remote navigation moves off the row into the page (DR-0679).
// =============================================================================
import React, { useMemo } from 'react';
import { TabScroll } from './shared.jsx';
import UiIcon from './UiIcon.jsx';
import { surfaceAccess } from '../lib/surface-access.js';
import { useDeviceClass } from '../lib/use-device-class.js';
import { orderPanels, WORKSPACE_TAB } from '../lib/device-roles.js';
import { useCreateSub, setCreateSub } from '../lib/create-sub.js';

/** The Create registry entries in the row's order for a device class. */
// The registry is shell-only (the module-boundary law): the shell hands the
// entries in, as it hands LockedSurface its surface.
export function createRow(cls, surfaces = []) {
  const bySub = new Map((surfaces || []).filter((s) => s && s.nav === 'create').map((s) => [s.sub, s]));
  const order = [WORKSPACE_TAB, ...orderPanels(cls)];
  return order.map((k) => bySub.get(k)).filter(Boolean);
}

export default function CreateSubNav({ viewer = {}, surfaces = [], deviceClass = null }) {
  const cls = useDeviceClass(deviceClass);
  const active = useCreateSub();
  const row = useMemo(() => createRow(cls, surfaces), [cls, surfaces]);
  return (
    <div className="border-t border-[#E8E4DC] bg-white" data-testid="create-subnav" data-device-class={cls}>
      {/* Create sub-nav rides <TabScroll>; chrome caps the row via zoom — the Church row's own mechanism. */}
      <TabScroll chrome className="px-1 sm:px-6 lg:px-8">
        {row.map((s) => {
          const a = surfaceAccess(s, viewer);
          if (!a.listed) return null;
          const on = active === s.sub;
          return (
            <button
              key={s.sub}
              type="button"
              data-create-sub={s.sub}
              aria-current={on ? 'page' : undefined}
              onClick={() => setCreateSub(s.sub)}
              className={`px-2.5 sm:px-3 py-2 whitespace-nowrap border-b-2 transition-colors focus:outline focus:outline-2 focus:outline-[#B85838] ${on ? 'border-[#1A1815] text-[#1A1815] font-medium' : 'border-transparent text-[#5A5751] hover:text-[#1A1815]'}`}
            >
              {a.locked ? <><UiIcon name="lock" /> {s.label}</> : s.label}
            </button>
          );
        })}
      </TabScroll>
    </div>
  );
}
