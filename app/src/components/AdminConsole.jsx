// =============================================================================
// AdminConsole — ONE data-driven report: the users KPIs + the system controls
// =============================================================================
// Darrell, 2026-07-04 (looking at the Admin tab): "it should be one tab... a
// report of users like the books financial reports, just data-driven KPIs" — and
// "why does it have all this n8n information if I'm not using that." Chosen shape:
// MERGE Admin + Access into one report and retire the separate Access tab.
//
// So this surface now leads with the REAL users/usage report (AccessUsageMetrics,
// absorbed from the retired Access tab — who has access, roles, activity, signups,
// most-used tabs), then the essential System & Build controls a steward needs
// (live build + backend reachability, reload-to-latest, reset-to-seed, your live
// backend role, and the self-checking CI/quality proof). Everything reads REAL
// state (DR-0061/0076); anything consequential PREVIEWS before a deliberate execute.
//
// REMOVED per Darrell's direction (the n8n/NAS plumbing he doesn't use, and the
// sub-tab clutter): the four-panel tab nav, the "NAS bridge token" device-token
// card, the "Internal Surfaces" dispatch-status-page (an n8n webhook), and the
// n8n-sourced Data-&-Loops rows. The underlying libs stay on disk (reversible);
// they're just off this report.
//
// GATED (isGovernor / trusted host), no-leak: the nav entry is absent from the DOM
// for non-stewards; this component carries a defense-in-depth locked fallback for
// any deep-link. WCAG AA in every theme: accents are THEMEABLE text-[#…] classes
// (never inline color), icons are <UiIcon/> (bundled SVG, currentColor), sizes are
// rem. Keeps consistency-guard + contrast-guard green.
// =============================================================================
import React, { useState } from 'react';
import supabase from '../lib/supabase.js';
import { enterReviewerMode } from '../lib/reviewer-mode.jsx';
import UiIcon from './UiIcon.jsx';
import QualityProof from './QualityProof.jsx';
import AccessUsageMetrics from './AccessUsageMetrics.jsx';
import SectionTabs from './SectionTabs.jsx';
import {
  accessRoster,
  roleMeaning,
  systemFacts,
  previewAction,
} from '../lib/admin-console.js';

const BUILD_SHA = (typeof __BUILD_SHA__ !== 'undefined') ? __BUILD_SHA__ : 'dev';
const BUILD_TIME = (typeof __BUILD_TIME__ !== 'undefined') ? __BUILD_TIME__ : null;

const serif = { fontFamily: '"Fraunces", serif' };
const mono = { fontFamily: '"JetBrains Mono", monospace' };

// A consequential action: shows the plain "what this does" line, and on click
// PREVIEWS the exact consequences before a deliberate execute. `danger` styles the
// confirm in the warn palette. No action fires without the second, deliberate tap.
function GuardedAction({ actionId, onExecute, disabled = false, busy = false, result = null }) {
  const spec = previewAction(actionId);
  const [previewing, setPreviewing] = useState(false);
  if (!spec) return null;
  const confirmCls = spec.danger
    ? 'border-[#7A1F1F] text-[#7A1F1F] hover:bg-[#7A1F1F] hover:text-white'
    : 'border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white';
  return (
    <div className="border border-[#E8E4DC] p-3">
      <div className="text-sm font-semibold text-[#1A1815]" style={serif}>{spec.label}</div>
      <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>{spec.what}</p>

      {!previewing ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPreviewing(true)}
          className={`mt-2 inline-flex items-center text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60 ${confirmCls}`}
        >
          {spec.label} <span aria-hidden="true" className="ml-1">→</span>
        </button>
      ) : (
        <div className="mt-2 bg-[#FAF8F4] border border-[#B85838] p-3">
          <div className="text-[0.625rem] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Before you do this — here’s exactly what happens</div>
          <ul className="mt-1.5 space-y-1">
            {spec.preview.map((line, i) => (
              <li key={i} className="text-xs text-[#1A1815] leading-relaxed flex gap-1.5" style={serif}>
                <span aria-hidden="true" className="text-[#B85838]">›</span><span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => { setPreviewing(false); onExecute && onExecute(); }}
              className={`inline-flex items-center text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border focus:outline focus:outline-2 focus:outline-[#B85838] disabled:opacity-60 ${confirmCls}`}
            >
              {busy ? 'Working…' : spec.confirmLabel}
            </button>
            <button
              type="button"
              onClick={() => setPreviewing(false)}
              className="inline-flex items-center text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#5A5751] text-[#5A5751] hover:bg-[#5A5751] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {result && (
        <p className="text-xs text-[#5A6E3D] mt-2" style={serif}>{result}</p>
      )}
    </div>
  );
}

export default function AdminConsole({
  isGovernor = false,
  email = null,
  instanceId = null,
  backendReachable = false,
  isPublicHost = true,
  onResetSeed = null,
}) {
  const [roleState, setRoleState] = useState({ status: 'idle', role: null, error: null });

  // No-leak defense-in-depth. The nav entry is already absent from the DOM for
  // non-stewards; this backstops any ?view=admin deep-link.
  if (!isGovernor) {
    return (
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#5A5751] font-semibold inline-flex items-center gap-1.5">
          <UiIcon name="lock" /> Admin
        </div>
        <p className="text-sm mt-1 text-[#1A1815]" style={serif}>
          Admin is a stewardship space. It opens for the family stewards — each serves only their own
          domain, and no one sees another’s people or private data. Sign in with a steward account to enter.
        </p>
      </section>
    );
  }

  const roster = accessRoster(email);

  // READ action: fetch this steward's live backend role from the database
  // (user_role_in_instance RPC). Real query, honest failure — never a painted role.
  const checkRole = async () => {
    if (!instanceId) { setRoleState({ status: 'no-instance', role: null, error: null }); return; }
    setRoleState({ status: 'loading', role: null, error: null });
    try {
      const { data: role, error } = await supabase.rpc('user_role_in_instance', { tenant_uuid: instanceId });
      if (error) { setRoleState({ status: 'error', role: null, error: error.message || 'query failed' }); return; }
      setRoleState({ status: 'ok', role: role || null, error: null });
    } catch (e) {
      setRoleState({ status: 'error', role: null, error: (e && e.message) || 'query failed' });
    }
  };

  const doReload = () => { try { window.location.reload(); } catch (e) { /* no-op */ } };
  const doResetSeed = () => { if (onResetSeed) onResetSeed(); };
  // The steward's "see it as a user" review lens (lib/reviewer-mode.jsx). Sets the
  // per-device flag and reloads into the exact signed-in-user boot; the pinned
  // banner's Exit brings this steward view back.
  const doReviewAsUser = () => enterReviewerMode();

  const facts = systemFacts({ isPublicHost, buildSha: BUILD_SHA, buildTime: BUILD_TIME, backendReachable });

  // The long report, broken into swipeable sections (Darrell 2026-07-04: "sliding
  // tabs instead of a long scroll"). Each section renders only when opened — so the
  // users report and the quality self-check do their fetching lazily, on the tab you
  // actually open. The intro card stays pinned above the strip for constant context.
  const sections = [
    {
      id: 'users',
      label: 'Users & usage',
      icon: 'users',
      // THE USERS REPORT — absorbed from the retired Access tab. Real KPIs, self-
      // fetching, fail-soft, family/governor-gated at the DB.
      render: () => <AccessUsageMetrics />,
    },
    {
      id: 'system',
      label: 'This device',
      icon: 'monitor',
      render: () => (
        <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">This device, right now</div>
          <ul className="mt-3 space-y-2.5">
            {facts.map((f) => (
              <li key={f.label} className="border-b border-[#E8E4DC] pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-wider text-[#5A5751]">{f.label}</span>
                  <span className="text-sm font-semibold text-[#1A1815] break-all" style={serif}>{f.value}</span>
                </div>
                <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>{f.note}</p>
              </li>
            ))}
          </ul>
        </section>
      ),
    },
    {
      id: 'actions',
      label: 'Actions',
      icon: 'tools',
      render: () => (
        <section className="bg-white border border-[#1A1815] p-4">
          <div className="text-sm font-semibold text-[#1A1815]" style={serif}>Actions</div>
          <div className="mt-2 space-y-2">
            <GuardedAction actionId="reload-latest" onExecute={doReload} />
            <GuardedAction actionId="review-as-user" onExecute={doReviewAsUser} />
            {onResetSeed && <GuardedAction actionId="reset-seed" onExecute={doResetSeed} />}
          </div>
        </section>
      ),
    },
    {
      id: 'role',
      label: 'Role & stewards',
      icon: 'lock',
      // Your live backend role (a real RPC self-check) + who can administer.
      render: () => (
        <section className="bg-white border border-[#1A1815] p-4">
          <div className="text-sm font-semibold text-[#1A1815]" style={serif}>Your live role in the backend</div>
          <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
            Ask the database what role your account actually holds in the family space, right now.
          </p>
          <button
            type="button"
            onClick={checkRole}
            className="mt-2 inline-flex items-center text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
          >
            {roleState.status === 'loading' ? 'Checking…' : 'Check my role'} <span aria-hidden="true" className="ml-1">→</span>
          </button>
          {roleState.status === 'ok' && (
            <p className="text-xs mt-2 text-[#1A1815]" style={serif}>
              <strong className="uppercase tracking-wider text-[#5A6E3D]">{roleState.role || 'no role on record'}</strong>
              {roleMeaning(roleState.role) && <> — {roleMeaning(roleState.role)}</>}
            </p>
          )}
          {roleState.status === 'no-instance' && (
            <p className="text-xs mt-2 text-[#5A5751]" style={serif}>Not connected to the backend on this device — sign in / reconnect to check.</p>
          )}
          {roleState.status === 'error' && (
            <p className="text-xs mt-2 text-[#7A1F1F]" style={serif}>Couldn’t read your role: {roleState.error}</p>
          )}
          <div className="mt-3 pt-3 border-t border-[#E8E4DC]">
            <div className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold">Who can administer</div>
            <ul className="mt-1.5 space-y-1">
              {roster.map((r) => (
                <li key={r.email} className="flex items-baseline gap-2 text-xs text-[#1A1815]" style={serif}>
                  <span aria-hidden="true" className="text-[#5A6E3D]">●</span>
                  <span className="break-all">{r.email}</span>
                  {r.isYou && <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">you</span>}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ),
    },
    {
      id: 'quality',
      label: 'Quality proof',
      icon: 'check',
      // The real, self-checking build + quality state (CI, deploy freshness,
      // per-theme WCAG contrast). Composed, not reimplemented.
      render: () => <QualityProof />,
    },
  ];

  return (
    <div className="space-y-4" data-talk-surface="admin">
      {/* Header — the steward at the helm, plain framing. Pinned above the strip. */}
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold inline-flex items-center gap-1.5">
            <UiIcon name="lock" /> Admin — your users &amp; system, in plain language
          </div>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" style={mono}>
            build {BUILD_SHA}{BUILD_TIME ? ` · ${String(BUILD_TIME).slice(0, 10)}` : ''}
          </div>
        </div>
        <p className="text-sm mt-1 text-[#1A1815]" style={serif}>
          One report: who’s using the app and how, then the live build and the controls to run it —
          without touching a database or a command line. Every number is real; anything with a real
          consequence shows you exactly what will happen before it does. Slide between the sections below.
        </p>
      </section>

      <SectionTabs sections={sections} ariaLabel="Admin sections" idBase="admin" defaultId="users" />

      <p className="text-[0.625rem] text-[#5A5751] italic" style={serif}>
        Every reading here is a live view of real system state. No secrets or keys are shown; anything with a
        real consequence previews first, then waits for your deliberate go.
      </p>
    </div>
  );
}
