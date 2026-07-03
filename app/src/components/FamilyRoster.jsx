// =============================================================================
// FamilyRoster — the household roster, in the steward seat (DR-0093)
// =============================================================================
// "I'll add my son and daughters so I can explain it to users." (Darrell,
// 2026-07-03.) The first surface wired to the child-safety rails that shipped
// in migrations 0055/0057: a guardian (owner/admin — RLS is the real wall)
// sees the family_member_profiles roster live and provisions a child through
// provision_child_member — role 'child', walled out of the family financials
// at the database layer, COPPA protection derived from the tier.
//
// THE BRIGHT LINE (DATA-AS-EMPOWERMENT): this surface NEVER touches the
// family email allowlist (isFamilyEmail) — that binary flag unlocks all
// family financials + the imported bank/Gmail PII feed and is exactly the
// wrong door for a minor. A guard test pins this file to zero allowlist
// imports. Linking a child's sign-in account is optional and can happen
// later: re-provisioning the same persona updates it (RPC upsert).
//
// Mounted in the Command, Control & Serve Center → Serve faculty (governor-
// gated there, no-leak). IO is injectable (`io` prop) so the card is fully
// testable without a network (DR-0076); defaults are the real sync layer.
import React, { useCallback, useEffect, useState } from 'react';
import UiIcon from './UiIcon.jsx';
import GuardianChildPanel from './GuardianChildPanel.jsx';
import { loadFamilyRoster, provisionChild } from '../lib/family-messaging-sync.js';
import { loadChildCapabilities, saveChildCapability, loadChildRequests, patchRow } from '../lib/relationships-sync.js';
import { setChildCapability, resolveApprovalRequest } from '../lib/guardian-child.js';
import { CHILD_CAPABILITY_POLICY } from '../lib/relationships.js';
import { MINOR_TIERS, TIER_META, personaSlug, validateProvision, rosterRowShape, configByPersona } from '../lib/family-roster.js';

const DEFAULT_IO = {
  loadRoster: loadFamilyRoster,
  provision: provisionChild,
  loadCaps: loadChildCapabilities,
  saveCap: saveChildCapability,
  loadRequests: loadChildRequests,
  patchRequest: patchRow,
};

export default function FamilyRoster({ io = DEFAULT_IO, currentUserId = null }) {
  const [state, setState] = useState({ phase: 'loading', rows: [], error: null });
  const [form, setForm] = useState({ displayName: '', persona: '', minorTier: 'under13', childUserId: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  // The consolidated permission state (one home, DR-0095): per-persona config
  // from the real child_capabilities rows + the live approval queue.
  const [capsByPersona, setCapsByPersona] = useState({});
  const [requests, setRequests] = useState([]);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, phase: 'loading' }));
    const [res, caps, reqs] = await Promise.all([io.loadRoster(), io.loadCaps(), io.loadRequests()]);
    if (!res.ok) setState({ phase: 'error', rows: [], error: res.error });
    else setState({ phase: 'ready', rows: (res.data || []).map(rosterRowShape), error: null });
    if (caps && caps.ok) setCapsByPersona(configByPersona(caps.data, CHILD_CAPABILITY_POLICY));
    if (reqs && reqs.ok) setRequests(reqs.data || []);
  }, [io]);
  useEffect(() => { refresh(); }, [refresh]);

  // Set one child's capability: clamp to the safety ceiling (spending/security
  // stay locked; visibility is the guardian's free choice, DR-0094), write the
  // persona-scoped row, reflect optimistically.
  const onSetCapability = useCallback(async (persona, cap, choice) => {
    const current = capsByPersona[persona] || {};
    const { config, effective, locked } = setChildCapability(current, cap, choice);
    if (locked) { setNotice({ kind: 'error', text: 'That one is locked — it acts (spend / security), it does not just see.' }); return; }
    setCapsByPersona((m) => ({ ...m, [persona]: config }));
    setSaving(true);
    const res = await io.saveCap({ childPersona: persona, capability: cap, setting: effective });
    setSaving(false);
    setNotice(res.ok ? { kind: 'ok', text: 'Saved.' } : { kind: 'error', text: `Could not save: ${res.error}` });
  }, [capsByPersona, io]);

  const onResolve = useCallback(async (req, decision) => {
    const patch = resolveApprovalRequest(req, decision, new Date().toISOString());
    setRequests((rs) => rs.map((r) => (r.id === req.id ? { ...r, ...patch } : r)));
    const res = await io.patchRequest('child_action_requests', req.id, { ...patch, resolved_by: currentUserId });
    if (res && res.ok === false) setNotice({ kind: 'error', text: `Could not record the decision: ${res.error}` });
  }, [io, currentUserId]);

  const submit = async (e) => {
    e.preventDefault();
    setNotice(null);
    const v = validateProvision(form);
    if (!v.ok) { setNotice({ kind: 'error', text: v.error }); return; }
    setSaving(true);
    const res = await io.provision(v.value);
    setSaving(false);
    if (!res.ok) {
      // The honest failure states: not a guardian (RLS refused), or the
      // migration hasn't landed (RPC missing) — named, never a silent no-op.
      const raw = String(res.error || '');
      const text = /guardian|42501/i.test(raw)
        ? 'Only a guardian (owner/admin) can add a family member — this account is not one.'
        : /function|does not exist|404/i.test(raw)
          ? 'The family-roster migration (0057) is not applied on this database yet — check the Migration ledger row on the Quality & Throughput board.'
          : `Could not save: ${raw}`;
      setNotice({ kind: 'error', text });
      return;
    }
    setNotice({ kind: 'ok', text: `${v.value.displayName} is on the roster (${TIER_META[v.value.minorTier].label}).` });
    setForm({ displayName: '', persona: '', minorTier: 'under13', childUserId: '' });
    refresh();
  };

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#B85838] font-semibold inline-flex items-center gap-1.5"><UiIcon name="users" className="w-3.5 h-3.5" /> Family Roster — the household, on the safe rails</div>
        <button
          type="button"
          onClick={refresh}
          disabled={state.phase === 'loading'}
          className="text-[0.625rem] uppercase tracking-wider px-2 py-1 border border-[#1A1815] hover:bg-[#FAF8F4] disabled:opacity-50 min-h-[32px]"
        >
          {state.phase === 'loading' ? 'Reading…' : 'Refresh'}
        </button>
      </div>
      <p className="text-xs text-[#5A5751] mt-1 mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
        Add your children here and the database itself protects them: a child gets the <strong>child</strong> role — walled out of the family financials by row-level security — and an under-13 is COPPA-protected by a rule no one can un-set. Adding a child never touches the family sign-in allowlist, so a minor can never see the books or the bank feed.
      </p>

      {/* ----- the live roster ----- */}
      {state.phase === 'error' && (
        <p className="text-[0.6875rem] text-[#DC2626] mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          Could not read the roster: {state.error}
        </p>
      )}
      {state.phase === 'ready' && state.rows.length === 0 && (
        <p className="text-[0.6875rem] text-[#5A5751] italic mb-2" style={{ fontFamily: '"Fraunces", serif' }}>
          No family members on the roster yet — you are looking at the real table, not a placeholder. Add the first one below.
        </p>
      )}
      {state.rows.length > 0 && (
        <ul className="border border-[#E8E4DC] mb-3">
          {state.rows.map((r) => (
            <li key={r.persona} className="px-2.5 py-2 border-b border-[#F2EEE6] last:border-b-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.displayName}</span>
                <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
                  {r.tierLabel}{r.coppaProtected ? ' · COPPA-protected' : ''} · {r.linked ? 'account linked' : 'no sign-in account linked yet'}
                </span>
              </div>
              <p className="text-[0.625rem] text-[#5A5751] mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{r.tierNote}</p>
            </li>
          ))}
        </ul>
      )}

      {/* ----- add a member ----- */}
      <form onSubmit={submit} className="bg-[#FAF8F4] border border-[#E8E4DC] p-3">
        <div className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751] font-semibold mb-2">Add a family member (guardian only)</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <label className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            Name
            <input
              type="text"
              value={form.displayName}
              onChange={set('displayName')}
              placeholder="e.g. Christian"
              className="mt-0.5 w-full border border-[#1A1815] bg-white px-2 py-2 min-h-[44px] text-sm text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
            />
          </label>
          <label className="text-[0.6875rem] text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>
            Age band
            <select
              value={form.minorTier}
              onChange={set('minorTier')}
              className="mt-0.5 w-full border border-[#1A1815] bg-white px-2 py-2 min-h-[44px] text-sm text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
            >
              {MINOR_TIERS.map((t) => <option key={t} value={t}>{TIER_META[t].label}</option>)}
            </select>
          </label>
          <label className="text-[0.6875rem] text-[#1A1815] sm:col-span-2" style={{ fontFamily: '"Fraunces", serif' }}>
            Sign-in account UUID (optional — link later by re-adding the same name)
            <input
              type="text"
              value={form.childUserId}
              onChange={set('childUserId')}
              placeholder="from Supabase → Authentication → Users, after you create their account"
              className="mt-0.5 w-full border border-[#1A1815] bg-white px-2 py-2 min-h-[44px] text-sm text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]"
              style={{ fontFamily: '"JetBrains Mono", monospace' }}
            />
          </label>
        </div>
        <div className="flex items-center gap-3 flex-wrap mt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-[#1A1815] text-white px-4 py-2.5 min-h-[44px] text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Add to the roster'}
          </button>
          {form.displayName && (
            <span className="text-[0.5625rem] uppercase tracking-wider text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>
              persona key: {personaSlug(form.persona || form.displayName)}
            </span>
          )}
        </div>
        {notice && (
          <p role="status" className={`text-[0.6875rem] mt-2 ${notice.kind === 'error' ? 'text-[#DC2626]' : 'text-[#15803D]'}`} style={{ fontFamily: '"Fraunces", serif' }}>
            {notice.text}
          </p>
        )}
      </form>

      <details className="mt-3">
        <summary className="text-[0.625rem] uppercase tracking-wider text-[#5A5751] cursor-pointer hover:text-[#1A1815]">How a child gets their own sign-in (guardian steps)</summary>
        <ol className="mt-2 space-y-1 text-[0.6875rem] text-[#1A1815] list-decimal list-inside" style={{ fontFamily: '"Fraunces", serif' }}>
          <li>Add them to the roster above with just their name and age band — that part works right now.</li>
          <li>When they need their own sign-in: create their account as the guardian in the Supabase dashboard (Authentication → Users → Add user). There is no child self-signup, on purpose.</li>
          <li>Copy the new account&apos;s UUID and re-add the same name here with the UUID filled in — the roster row updates and the account gets the protected <strong>child</strong> role.</li>
          <li>What each child can see and do — including <strong>See family finances</strong> for money education — is decided by you, per child, <strong>right below on this page</strong> (DR-0094). Seeing is not spending: buy/spend stays locked off for a child no matter what you grant.</li>
          <li>Their email is never added to the family sign-in allowlist — that is the protection, not an omission.</li>
        </ol>
      </details>

      {/* ----- what each child can see & do (the ONE home, DR-0095) ----- */}
      {state.rows.length > 0 && (
        <div className="mt-4">
          <GuardianChildPanel
            personas={state.rows.map((r) => ({ id: r.persona, label: r.displayName }))}
            configByPersona={capsByPersona}
            onSetCapability={onSetCapability}
            requests={requests}
            onResolve={onResolve}
            saving={saving}
          />
        </div>
      )}
    </section>
  );
}
