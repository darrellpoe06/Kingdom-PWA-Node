// =============================================================================
// CreatingStation — the Create workspace, ordered and laid out for the device
// =============================================================================
// Darrell 2026-09-29: "Laptop for creating... we need to be able to use the
// devices appropriately" (DR-0678).
//
// One place that gathers the creating tools: the lesson entry (speak or type,
// the Lesson chip already chosen), Your lessons (each lesson from arrival to
// live, and every writer's version to compare, merge and publish, DR-0672),
// the lessons waiting on a decision, the Governor's queue, and the towers.
//
// SUBS, WORKSPACE FIRST (DR-0679, amending DR-0678). Darrell 2026-09-29:
// "Why take away my type texting place?!!!!!!!!!!!! Where is it?!!!!!!!!!!!!!!"
// then "Obviously give us a actual tabs like so we can know!!!!!!!!!!!!!!!!"
// then "Subtabs". DR-0678 stacked seven panels ABOVE his writing canvas; on a
// phone that buried it. Now Create has a real second row under the main nav,
// the same row Church has (components/CreateSubNav.jsx, derived from the
// registry, surfaces.js nav:'create'), and this page shows ONE sub at a time:
//   Workspace — his Creation Workspace canvas, exactly as it was, FIRST and
//               the DEFAULT on every device. It stays mounted (hidden) while
//               another sub is open, so nothing he typed is lost by looking away;
//   then one sub per panel, labelled by the registry.
// The open sub lives in lib/create-sub.js (remembered per device; a handoff
// link, ?view=create&panel=, opens its sub). Alt+1 is the Workspace and
// Alt+2..8 the panels in this device's order (Alt+0 back to the Workspace).
//
// The device decides ORDER only, never access and never the default
// (lib/device-roles.js createTabs): the panels after the Workspace follow the
// role's `first` list. Every panel is on every device. Role gates (the
// Governor's queues) stay the same gates they are on Projects -> Decisions; the
// database is the wall.
//
// It IMPORTS the existing components and never rewrites them. The two that
// came from parallel work are on main now and mounted directly, exactly as
// Projects → Decisions mounts them:
//   LessonReviewQueue.jsx — PR #1841 (DR-0672), default export, no required props;
//   TowerParity.jsx       — PR #1845 (DR-0671), default export, { signedIn }.
// =============================================================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import OneVoiceInput from './OneVoiceInput.jsx';
import LessonInbox from './LessonInbox.jsx';
import MemberLessonQueue from './MemberLessonQueue.jsx';
import GovernanceQueue from './GovernanceQueue.jsx';
import LessonReviewQueue from './LessonReviewQueue.jsx';
import TowerParity from './TowerParity.jsx';
import { deriveAppDecisions } from '../lib/decisions.js';
import { useDeviceClass } from '../lib/use-device-class.js';
import { ROLES, orderPanels, roleFor, shortcutTarget, handoffUrl, handoffTarget, createTabs, tabLabel, WORKSPACE_TAB } from '../lib/device-roles.js';
import { useCreateSub, setCreateSub, takeOpenedFrom } from '../lib/create-sub.js';
import { isNativeShell } from '../lib/native-shell.js';
import { POETECH_APP_URL } from '../lib/messages-invite.js';

const SERIF = { fontFamily: '"Fraunces", serif' };

// Where the two components from parallel work came from (pinned by the test).
export const PINNED_FROM = Object.freeze({
  decide: { file: './LessonReviewQueue.jsx', from: 'PR #1841 (DR-0672)', export: 'default' },
  towers: { file: './TowerParity.jsx', from: 'PR #1845 (DR-0671)', export: 'default' },
});

function stationOrigin() {
  try {
    if (typeof window === 'undefined' || isNativeShell(window)) return { origin: POETECH_APP_URL, base: '' };
    return { origin: window.location.origin, base: (import.meta.env && import.meta.env.BASE_URL) || '/' };
  } catch { return { origin: POETECH_APP_URL, base: '' }; }
}

function Panel({ k, label, why, tv, children }) {
  return (
    <section
      id={`station-${k}`}
      data-panel={k}
      aria-labelledby={`station-${k}-h`}
      className="bg-white border border-[#E8E4DC] p-3 sm:p-4 min-w-0"
    >
      <h2 id={`station-${k}-h`} tabIndex={-1} className={`${tv ? 'text-sm' : 'text-[0.6875rem]'} uppercase tracking-[0.25em] text-[#1A1815] font-semibold focus:outline focus:outline-2 focus:outline-[#B85838]`}>
        {label}
      </h2>
      <p className={`${tv ? 'text-sm' : 'text-[0.6875rem]'} text-[#5A5751] italic mt-0.5 mb-2`} style={SERIF}>{why}</p>
      {children}
    </section>
  );
}

function HandoffPanel({ cls }) {
  const target = handoffTarget(cls);
  const [panel, setPanel] = useState(target === 'laptop' ? 'your-lessons' : 'record');
  const [copied, setCopied] = useState('');
  const { origin, base } = stationOrigin();
  const url = handoffUrl({ origin, base, panel });
  const targetLabel = target === 'laptop' ? 'your laptop' : 'your phone';
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied('Copied.'); } catch { setCopied('Copy did not work here. The link is below to select.'); }
  };
  const share = async () => {
    try { await navigator.share({ title: 'Continue in PoeTech', url }); } catch { /* the person closed the sheet */ }
  };
  return (
    <div data-testid="station-handoff">
      <p className="text-xs text-[#1A1815]" style={SERIF}>
        {target === 'laptop'
          ? 'A lesson waiting on review reads best on a wide screen. Send this to your laptop: it opens the same lessons, because it is the same you signed in.'
          : 'Recording reads best in your hand. Scan this with your phone to open the recorder there.'}
      </p>
      <label className="block text-[0.625rem] uppercase tracking-wider text-[#5A5751] mt-2" htmlFor="station-handoff-panel">Open at</label>
      <select
        id="station-handoff-panel"
        value={panel}
        onChange={(e) => setPanel(e.target.value)}
        className="border border-[#1A1815] bg-white text-sm px-2 min-h-[44px] mt-1 w-full sm:w-auto"
      >
        {Object.entries(ROLES.panels).filter(([k]) => k !== 'handoff').map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
      </select>
      <div className="flex flex-wrap gap-2 mt-2">
        {canShare && (
          <button type="button" onClick={share} className="bg-[#1A1815] text-white text-xs uppercase tracking-wider px-3 min-h-[44px] hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">
            Continue on {targetLabel}
          </button>
        )}
        <button type="button" onClick={copy} className="border border-[#1A1815] text-[#1A1815] text-xs uppercase tracking-wider px-3 min-h-[44px] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838]">
          Copy the link
        </button>
      </div>
      {copied && <p className="text-xs text-[#5A5751] mt-1" role="status">{copied}</p>}
      {target === 'phone' && (
        <div className="mt-2 inline-block bg-white p-2 border border-[#E8E4DC]" data-testid="station-handoff-qr">
          <QRCodeSVG value={url} size={132} />
        </div>
      )}
      <p className="text-[0.6875rem] text-[#5A5751] mt-1 break-all" data-testid="station-handoff-url">{url}</p>
      <p className="text-[0.6875rem] text-[#5A5751] italic mt-1" style={SERIF}>
        Not signed in there yet? Choose Sign in with your phone on that device and approve it here.
      </p>
    </div>
  );
}

export default function CreatingStation({
  signedIn = false,
  isGovernor = false,
  voice = {},
  governance = {},          // { discussions, concerns } — the same inputs Projects → Decisions reads
  onNavigate = null,
  deviceClass = null,
  workspace = null,         // the Creation Workspace canvas: the first sub, the default
}) {
  const cls = useDeviceClass(deviceClass);
  const role = roleFor(cls);
  const order = useMemo(() => orderPanels(cls), [cls]);
  const tabs = useMemo(() => createTabs(cls), [cls]);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const active = useCreateSub();
  const [notice] = useState(() => {
    const p = takeOpenedFrom();
    return p ? `Opened here from another device: ${tabLabel(p)}.` : '';
  });
  const tv = cls === 'tv';
  const laptop = cls === 'laptop';

  // Alt+1 opens the Workspace, Alt+2..8 the panels in this device's order, and
  // Alt+0 goes back to the Workspace. Alt leaves every plain key to the lesson
  // or the document being typed.
  useEffect(() => {
    const onKey = (e) => {
      const t = shortcutTarget(e, tabsRef.current);
      if (!t) return;
      e.preventDefault();
      setCreateSub(t === 'top' ? WORKSPACE_TAB : t);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const go = (view, sub) => { if (onNavigate) onNavigate(view, sub); };
  const signInLine = <p className="text-xs text-[#5A5751]" style={SERIF}>Sign in to see this. Every panel works the same on every device once you are in.</p>;
  const governorLine = <p className="text-xs text-[#5A5751]" style={SERIF} data-testid="station-governor-only">These are the Governor&rsquo;s to decide. Your own lessons and their versions are in Your lessons.</p>;

  const body = {
    record: () => (
      <OneVoiceInput
        surface="notes"
        surfaceConfig={{ defaultRoute: 'lesson' }}
        heading="A lesson, spoken or typed"
        intro="The Lesson chip is already chosen. Speak it or type it; it goes to the lesson intake, and you can still pick another destination."
        placeholder="Lesson: what the Word showed you…"
        submitLabel="Send"
        {...voice}
      />
    ),
    'your-lessons': () => (signedIn ? <LessonInbox /> : signInLine),
    decide: () => (!signedIn ? signInLine : !isGovernor ? governorLine : (
      <div className="space-y-3">
        <LessonReviewQueue />
        <MemberLessonQueue signedIn={signedIn} />
      </div>
    )),
    governor: () => (!signedIn ? signInLine : !isGovernor ? governorLine : (
      <GovernanceQueue
        appDecisions={deriveAppDecisions({ discussions: governance.discussions || [], concerns: governance.concerns || [] })}
        familyInstanceId={((governance.concerns || []).find((c) => c && c.tenantId) || {}).tenantId || null}
        signedIn={signedIn}
      />
    )),
    towers: () => (signedIn ? <TowerParity signedIn={signedIn} /> : signInLine),
    'read-listen': () => (
      <div className="flex flex-wrap gap-2" data-testid="station-read-listen">
        <button type="button" onClick={() => go('church', 'learn')} className={`bg-[#1A1815] text-white uppercase tracking-wider px-4 min-h-[48px] hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] ${tv ? 'text-base' : 'text-xs'}`}>
          Read the lessons
        </button>
        <button type="button" onClick={() => go('voice')} className={`border border-[#1A1815] text-[#1A1815] uppercase tracking-wider px-4 min-h-[48px] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838] ${tv ? 'text-base' : 'text-xs'}`}>
          Listen in your voice
        </button>
      </div>
    ),
    handoff: () => <HandoffPanel cls={cls} />,
  };

  // What this device is for, and the keys: shown at the head of every panel
  // sub, never above the Workspace (his writing place opens clean).
  const deviceLine = (
    <div className="mb-3" data-testid="station-device">
      <p className={`${tv ? 'text-base' : 'text-sm'} text-[#1A1815]`} style={SERIF} data-testid="station-role">
        <strong>{role.label}</strong>: {role.jobs.join(', ')}. {role.why}
      </p>
      {laptop && (
        <p className="text-[0.6875rem] text-[#5A5751] mt-1" data-testid="station-shortcuts">
          Keys: {tabs.slice(0, 9).map((k, i) => `Alt+${i + 1} ${tabLabel(k)}`).join(' · ')}
        </p>
      )}
    </div>
  );

  // Exactly one sub shows. The Workspace is always mounted and only hidden, so
  // his canvas keeps what he typed; a panel mounts only while it is open.
  const onPanel = active !== WORKSPACE_TAB && order.includes(active) ? active : null;
  return (
    <div id="creating-station" data-testid="creating-station" data-device-class={cls} data-active-sub={active} className="min-w-0">
      {notice && <p className="text-xs text-[#5A6E3D] mb-2" role="status" data-testid="create-opened-from">{notice}</p>}
      <div id="create-sub-workspace" data-create-page="workspace" hidden={onPanel !== null}>
        {workspace}
      </div>
      {order.map((k) => (k === onPanel ? (
        <div key={k} id={`create-sub-${k}`} data-create-page={k}>
          {deviceLine}
          <Panel k={k} label={ROLES.panels[k].label} why={ROLES.panels[k].why} tv={tv}>
            {body[k]()}
          </Panel>
        </div>
      ) : null))}
    </div>
  );
}
