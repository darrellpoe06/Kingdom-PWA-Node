// =============================================================================
// AdminConsole — the real, in-app backend control surface (no IT degree needed)
// =============================================================================
// Darrell, 2026-06-30: "The admin area has never been used because it is not
// inside the app. Fix that so we can get into the backend etc without needing an
// IT degree."
//
// WHAT WAS WRONG: the old Admin() surface (in the monolith) was a dead-end — a
// list of external NAS/Tailscale URLs to COPY and open elsewhere. Nothing you
// could actually do. This replaces it with a genuine console: the four backend
// concerns a steward needs — People & Access, Data & Loops, System & Build,
// Internal Surfaces — each surfaced in the app, in plain language.
//
// EVERY action is a labeled button with a "what this does" line. Anything
// consequential PREVIEWS what will happen before a deliberate execute
// (preview-then-execute). NO SECRETS are shown — roles, hosts, and public
// identifiers only, never a key/token. Reads come from REAL sources (DR-0061):
//   • People & Access → the identity allowlist + the live user_role_in_instance
//     RPC + the real interest/invite list (RLS-gated).
//   • Data & Loops    → <LoopHealth/> over the real loop-health registry.
//   • System & Build  → <QualityProof/> (CI, build freshness, WCAG) + live facts.
//
// GATED (isGovernor / isFamilyEmail), no-leak: the nav entry is absent from the
// DOM for non-stewards; this component carries a defense-in-depth locked fallback
// for any deep-link. WCAG AA in every theme: accents are THEMEABLE text-[#…]
// classes (never inline color), icons are <UiIcon/> (bundled SVG, currentColor —
// contrast-correct in every theme), sizes are rem (scale with large-print). This
// keeps consistency-guard + contrast-guard green.
// =============================================================================
import React, { useState } from 'react';
import supabase from '../lib/supabase.js';
import { fetchInterest } from '../lib/interest-sync.js';
import UiIcon from './UiIcon.jsx';
import LoopHealth from './LoopHealth.jsx';
import QualityProof from './QualityProof.jsx';
import {
  ADMIN_PANELS,
  accessRoster,
  roleMeaning,
  systemFacts,
  INTERNAL_SURFACES,
  previewAction,
} from '../lib/admin-console.js';
import { N8N_DEVICE_TOKEN_KEY } from '../lib/n8n-base.js';
import { REVIEW_DEVICE_TOKEN_KEY } from './ReviewFeed.jsx';

// Device tokens (2026-07-03: close the shipped-bearer exposure). These live in
// THIS DEVICE's localStorage only — typed once by a steward, never present in
// the public bundle the way the old VITE_ vars were. The NAS bridges + the
// review feed resolve them at call time, so saving here takes effect at once.
const DEVICE_TOKENS = [
  { key: N8N_DEVICE_TOKEN_KEY, label: 'NAS bridge token', what: 'Authorizes this device to the NAS bridges (n8n webhooks, photo/history import, thought relay).' },
  { key: REVIEW_DEVICE_TOKEN_KEY, label: 'Review-feed token', what: 'Authorizes this device to the freshness review feed.' },
];

function DeviceTokensCard() {
  const read = (k) => { try { return (localStorage.getItem(k) || '').trim(); } catch { return ''; } };
  const [values, setValues] = useState(() => Object.fromEntries(DEVICE_TOKENS.map((t) => [t.key, read(t.key)])));
  const [drafts, setDrafts] = useState({});
  const save = (k) => {
    const v = (drafts[k] || '').trim();
    try { if (v) localStorage.setItem(k, v); else localStorage.removeItem(k); } catch { /* private mode — the status line stays honest */ }
    setValues((m) => ({ ...m, [k]: read(k) }));
    setDrafts((d) => ({ ...d, [k]: '' }));
  };
  return (
    <section className="bg-white border border-[#1A1815] p-4">
      <div className="text-sm font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Device tokens (this device only)</div>
      <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>
        These stay in this device&apos;s local storage — they never ship in the public app bundle, so a visitor
        can&apos;t extract them from the site&apos;s code. Paste each once per family device; saving an empty field removes it.
      </p>
      <ul className="mt-3 space-y-3">
        {DEVICE_TOKENS.map((t) => (
          <li key={t.key}>
            <div className="flex items-baseline justify-between gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>{t.label}</span>
              <span className={`text-[0.5625rem] uppercase tracking-wider font-semibold ${values[t.key] ? 'text-[#5A6E3D]' : 'text-[#5A5751]'}`}>
                {values[t.key] ? '● set on this device' : '○ not set'}
              </span>
            </div>
            <p className="text-[0.6875rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{t.what}</p>
            <div className="flex gap-2 mt-1">
              <input
                type="password"
                value={drafts[t.key] || ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [t.key]: e.target.value }))}
                placeholder={values[t.key] ? 'paste a new value to replace, or save empty to remove' : 'paste the token'}
                className="flex-1 p-2 border border-[#E8E4DC] text-sm bg-[#FAF8F4] min-h-[40px]"
                aria-label={`${t.label} value`}
              />
              <button
                type="button"
                onClick={() => save(t.key)}
                className="text-xs uppercase tracking-wider px-3 py-2 min-h-[40px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
              >
                Save
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
  data = {},
  isPublicHost = true,
  onResetSeed = null,
}) {
  const [panel, setPanel] = useState('access');
  const [roleState, setRoleState] = useState({ status: 'idle', role: null, error: null });
  const [interestState, setInterestState] = useState({ status: 'idle', count: 0, error: null });

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

  // READ action: how many people have asked for access (real, RLS-gated list).
  const checkInterest = async () => {
    setInterestState({ status: 'loading', count: 0, error: null });
    const res = await fetchInterest();
    if (!res.ok) { setInterestState({ status: 'error', count: 0, error: res.error === 'not-admin' ? 'not-admin' : 'query failed' }); return; }
    setInterestState({ status: 'ok', count: res.rows.length, error: null });
  };

  const doReload = () => { try { window.location.reload(); } catch (e) { /* no-op */ } };
  const doResetSeed = () => { if (onResetSeed) onResetSeed(); };

  const facts = systemFacts({ isPublicHost, buildSha: BUILD_SHA, buildTime: BUILD_TIME, backendReachable });
  const activePanel = ADMIN_PANELS.find((p) => p.id === panel) || ADMIN_PANELS[0];

  const copyUrl = (url) => { try { navigator.clipboard && navigator.clipboard.writeText(url); } catch (e) { /* no-op */ } };

  return (
    <div className="space-y-4" data-talk-surface="admin">
      {/* Header — the steward at the helm, plain framing. */}
      <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold inline-flex items-center gap-1.5">
            <UiIcon name="lock" /> Admin — the backend, in plain language
          </div>
          <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" style={mono}>
            build {BUILD_SHA}{BUILD_TIME ? ` · ${String(BUILD_TIME).slice(0, 10)}` : ''}
          </div>
        </div>
        <p className="text-sm mt-1 text-[#1A1815]" style={serif}>
          Everything you need to run the system — who has access, whether your data is flowing, the live
          build, and the internal surfaces — without touching a database or a command line. Anything with a
          real consequence shows you exactly what will happen before it does.
        </p>
      </section>

      {/* Panel tabs. */}
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Admin panels">
        {ADMIN_PANELS.map((p) => {
          const active = panel === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPanel(p.id)}
              className={`text-xs uppercase tracking-wider px-3 py-1.5 border min-h-[36px] inline-flex items-center gap-1.5 focus:outline focus:outline-2 focus:outline-[#B85838] border-[#1A1815] ${active ? 'bg-[#1A1815] text-white' : 'text-[#1A1815]'}`}
            >
              <UiIcon name={p.icon} /> {p.label}
            </button>
          );
        })}
      </div>

      {/* Active-panel blurb. */}
      <section className="bg-white border border-[#1A1815] p-3">
        <h2 className="text-[0.6875rem] uppercase tracking-[0.25em] font-semibold text-[#1A1815] inline-flex items-center gap-1.5">
          <UiIcon name={activePanel.icon} /> {activePanel.label}
        </h2>
        <p className="text-xs text-[#1A1815] mt-1" style={serif}>{activePanel.blurb}</p>
      </section>

      {/* PEOPLE & ACCESS ---------------------------------------------------- */}
      {panel === 'access' && (
        <div className="space-y-4">
          <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
            <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Who can get in</div>
            <p className="text-xs text-[#5A5751] mt-1 leading-relaxed" style={serif}>
              Access to Admin is by <strong>who you are</strong>, not a password you could share. These stewards
              can reach the backend; everyone else never even sees this space.
            </p>
            <ul className="mt-3 space-y-1.5">
              {roster.map((r) => (
                <li key={r.email} className="flex items-baseline gap-2 text-sm text-[#1A1815]" style={serif}>
                  <span aria-hidden="true" className="text-[#5A6E3D]">●</span>
                  <span className="break-all">{r.email}</span>
                  {r.isYou && <span className="text-[0.625rem] uppercase tracking-wider text-[#5A6E3D] font-semibold">you</span>}
                </li>
              ))}
            </ul>
          </section>

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
          </section>

          <DeviceTokensCard />

          <section className="bg-white border border-[#1A1815] p-4">
            <div className="text-sm font-semibold text-[#1A1815]" style={serif}>People who’ve asked for access</div>
            <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
              How many consented requests are waiting on the interest list (only you and Christina can see it).
            </p>
            <button
              type="button"
              onClick={checkInterest}
              className="mt-2 inline-flex items-center text-xs uppercase tracking-wider px-3 py-2 min-h-[36px] border border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              {interestState.status === 'loading' ? 'Checking…' : 'Check requests'} <span aria-hidden="true" className="ml-1">→</span>
            </button>
            {interestState.status === 'ok' && (
              <p className="text-xs mt-2 text-[#1A1815]" style={serif}>
                <strong>{interestState.count}</strong> {interestState.count === 1 ? 'person has' : 'people have'} asked for access.
              </p>
            )}
            {interestState.status === 'error' && (
              <p className="text-xs mt-2 text-[#7A1F1F]" style={serif}>
                {interestState.error === 'not-admin' ? 'This account isn’t on the interest-list allowlist.' : 'Couldn’t read the list right now.'}
              </p>
            )}
          </section>
        </div>
      )}

      {/* DATA & LOOPS ------------------------------------------------------- */}
      {panel === 'data' && (
        <div className="space-y-3">
          <LoopHealth data={data} />
          <p className="text-xs text-[#5A5751] italic" style={serif}>
            Each row is a real data loop and its last <strong>real</strong> update — never a painted number. A loop
            past its window asks to be kept or retired so nothing stagnates silently.
          </p>
        </div>
      )}

      {/* SYSTEM & BUILD ----------------------------------------------------- */}
      {panel === 'system' && (
        <div className="space-y-4">
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

          <section className="bg-white border border-[#1A1815] p-4">
            <div className="text-sm font-semibold text-[#1A1815]" style={serif}>Actions</div>
            <div className="mt-2 space-y-2">
              <GuardedAction actionId="reload-latest" onExecute={doReload} />
              {onResetSeed && <GuardedAction actionId="reset-seed" onExecute={doResetSeed} />}
            </div>
          </section>

          {/* The real, self-checking build + quality state (CI, deploy freshness,
              per-theme WCAG contrast). Composed, not reimplemented. */}
          <QualityProof />
        </div>
      )}

      {/* INTERNAL SURFACES ------------------------------------------------- */}
      {panel === 'internal' && (
        <div className="space-y-3">
          <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
            <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold">Family NAS surfaces</div>
            <p className="text-xs text-[#5A5751] mt-1 leading-relaxed" style={serif}>
              These live on the family NAS. You reach them over Tailscale, or on the home network. Being on the
              family network is itself the access control — no public attack surface.
            </p>
            <ul className="mt-3 space-y-3">
              {INTERNAL_SURFACES.map((s) => (
                <li key={s.key} className="border border-[#E8E4DC] p-3">
                  <div className="text-sm font-semibold text-[#1A1815]" style={serif}>{s.label}</div>
                  <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>{s.what}</p>
                  <div className="mt-2 space-y-1.5">
                    {[['Tailscale', s.tailscale], ['Home network', s.lan]].map(([kind, url]) => (
                      <div key={kind}>
                        <div className="text-[0.5625rem] uppercase tracking-[0.2em] text-[#5A5751]">{kind}</div>
                        <code className="block bg-[#FAF8F4] border border-[#E8E4DC] px-2 py-1 text-xs text-[#1A1815] break-all" style={mono}>{url}</code>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <a href={url} className="text-xs text-[#B85838] underline underline-offset-4 hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Open →</a>
                          <button type="button" onClick={() => copyUrl(url)} className="text-xs text-[#5A5751] underline underline-offset-4 hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">Copy</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <p className="text-[0.625rem] text-[#5A5751] italic" style={serif}>
        Every reading here is a live view of real system state. No secrets or keys are shown; anything with a
        real consequence previews first, then waits for your deliberate go.
      </p>
    </div>
  );
}
