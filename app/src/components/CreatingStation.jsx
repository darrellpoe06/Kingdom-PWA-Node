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
// The device decides ORDER and LAYOUT, never access (lib/device-roles.js):
//   laptop — two columns across the width, Your lessons and the Governor's
//            queue full width, Alt+1..9 to jump between panels;
//   phone  — one column, the recorder first, then the quick decisions, and a
//            "continue on your laptop" link for the long review;
//   TV     — reading and listening first, large, one column;
//   every panel is on every device. Role gates (the Governor's queues) stay
//   the same gates they are on Projects → Decisions; the database is the wall.
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
import { ROLES, orderPanels, roleFor, shortcutTarget, handoffUrl, handoffTarget, panelFromSearch } from '../lib/device-roles.js';
import { consumeStationPanel } from '../lib/app-doors.js';
import { isNativeShell } from '../lib/native-shell.js';
import { POETECH_APP_URL } from '../lib/messages-invite.js';

const SERIF = { fontFamily: '"Fraunces", serif' };

// Where the two components from parallel work came from (pinned by the test).
export const PINNED_FROM = Object.freeze({
  decide: { file: './LessonReviewQueue.jsx', from: 'PR #1841 (DR-0672)', export: 'default' },
  towers: { file: './TowerParity.jsx', from: 'PR #1845 (DR-0671)', export: 'default' },
});

// Laptop: these read best at full width (side-by-side versions; a long queue).
const WIDE_ON_LAPTOP = new Set(['your-lessons', 'governor']);

function stationOrigin() {
  try {
    if (typeof window === 'undefined' || isNativeShell(window)) return { origin: POETECH_APP_URL, base: '' };
    return { origin: window.location.origin, base: (import.meta.env && import.meta.env.BASE_URL) || '/' };
  } catch { return { origin: POETECH_APP_URL, base: '' }; }
}

function Panel({ k, label, why, wide, tv, children }) {
  return (
    <section
      id={`station-${k}`}
      data-panel={k}
      aria-labelledby={`station-${k}-h`}
      className="bg-white border border-[#E8E4DC] p-3 sm:p-4 min-w-0"
      style={wide ? { gridColumn: '1 / -1' } : undefined}
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
        className="border border-[#1A1815] bg-white text-sm px-2 min-h-[44px] mt-1 max-w-full"
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
}) {
  const cls = useDeviceClass(deviceClass);
  const role = roleFor(cls);
  const order = useMemo(() => orderPanels(cls), [cls]);
  const orderRef = useRef(order);
  orderRef.current = order;
  const [notice, setNotice] = useState('');
  const tv = cls === 'tv';
  const laptop = cls === 'laptop';

  const jump = (key) => {
    if (key === 'top') { try { document.getElementById('creating-station')?.scrollIntoView({ block: 'start' }); } catch { /* no scroll */ } return; }
    const h = typeof document !== 'undefined' ? document.getElementById(`station-${key}-h`) : null;
    if (!h) return;
    try { h.scrollIntoView({ block: 'start' }); } catch { /* no scroll */ }
    try { h.focus({ preventScroll: true }); } catch { /* no focus */ }
  };

  // Alt+1..9 jumps to a panel, Alt+0 to the top. Alt leaves every plain key to
  // the lesson being typed.
  useEffect(() => {
    const onKey = (e) => {
      const t = shortcutTarget(e, orderRef.current);
      if (!t) return;
      e.preventDefault();
      jump(t);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // A handoff link (?view=create&panel=…) opens at its panel, once.
  useEffect(() => {
    const p = panelFromSearch(`?panel=${consumeStationPanel()}`);
    if (!p) return undefined;
    setNotice(`Opened here from another device: ${ROLES.panels[p].label}.`);
    const t = setTimeout(() => jump(p), 300);
    return () => clearTimeout(t);
  }, []);

  const go = (view, sub) => { if (onNavigate) onNavigate(view, sub); };
  const signInLine = <p className="text-xs text-[#5A5751]" style={SERIF}>Sign in to see this. Every panel works the same on every device once you are in.</p>;
  const governorLine = <p className="text-xs text-[#5A5751]" style={SERIF} data-testid="station-governor-only">These are the Governor&rsquo;s to decide. Your own lessons and their versions are in Your lessons.</p>;

  const body = {
    record: (
      <OneVoiceInput
        surface="notes"
        surfaceConfig={{ defaultRoute: 'lesson' }}
        heading="📖 A lesson, spoken or typed"
        intro="The Lesson chip is already chosen. Speak it or type it; it goes to the lesson intake, and you can still pick another destination."
        placeholder="Lesson: what the Word showed you…"
        submitLabel="Send"
        {...voice}
      />
    ),
    'your-lessons': signedIn ? <LessonInbox /> : signInLine,
    decide: !signedIn ? signInLine : !isGovernor ? governorLine : (
      <div className="space-y-3">
        <LessonReviewQueue />
        <MemberLessonQueue signedIn={signedIn} />
      </div>
    ),
    governor: !signedIn ? signInLine : !isGovernor ? governorLine : (
      <GovernanceQueue
        appDecisions={deriveAppDecisions({ discussions: governance.discussions || [], concerns: governance.concerns || [] })}
        familyInstanceId={((governance.concerns || []).find((c) => c && c.tenantId) || {}).tenantId || null}
        signedIn={signedIn}
      />
    ),
    towers: signedIn ? <TowerParity signedIn={signedIn} /> : signInLine,
    'read-listen': (
      <div className="flex flex-wrap gap-2" data-testid="station-read-listen">
        <button type="button" onClick={() => go('church', 'learn')} className={`bg-[#1A1815] text-white uppercase tracking-wider px-4 min-h-[48px] hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838] ${tv ? 'text-base' : 'text-xs'}`}>
          Read the lessons
        </button>
        <button type="button" onClick={() => go('voice')} className={`border border-[#1A1815] text-[#1A1815] uppercase tracking-wider px-4 min-h-[48px] hover:bg-[#FAF8F4] focus:outline focus:outline-2 focus:outline-[#B85838] ${tv ? 'text-base' : 'text-xs'}`}>
          Listen in your voice
        </button>
      </div>
    ),
    handoff: <HandoffPanel cls={cls} />,
  };

  const gridStyle = laptop
    ? { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem', alignItems: 'start' }
    : { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: tv ? '1.25rem' : '0.75rem' };

  return (
    <div id="creating-station" data-testid="creating-station" data-device-class={cls} className="mb-6 min-w-0">
      <header className="mb-3">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Create · this device</div>
        <p className={`${tv ? 'text-base' : 'text-sm'} text-[#1A1815] mt-1`} style={SERIF} data-testid="station-role">
          <strong>{role.label}</strong>: {role.jobs.join(', ')}. {role.why}
        </p>
        <p className="text-[0.6875rem] text-[#5A5751] mt-1" style={SERIF}>
          Everything is here on every device; this one puts {ROLES.panels[order[0]].label.toLowerCase()} first.
        </p>
        {laptop && (
          <p className="text-[0.6875rem] text-[#5A5751] mt-1" data-testid="station-shortcuts">
            Keys: {order.slice(0, 9).map((k, i) => `Alt+${i + 1} ${ROLES.panels[k].label}`).join(' · ')} · Alt+0 top
          </p>
        )}
        {notice && <p className="text-xs text-[#5A6E3D] mt-1" role="status">{notice}</p>}
      </header>
      <div style={gridStyle} data-testid="station-grid">
        {order.map((k) => (
          <Panel key={k} k={k} label={ROLES.panels[k].label} why={ROLES.panels[k].why} wide={laptop && WIDE_ON_LAPTOP.has(k)} tv={tv}>
            {body[k]}
          </Panel>
        ))}
      </div>
    </div>
  );
}
