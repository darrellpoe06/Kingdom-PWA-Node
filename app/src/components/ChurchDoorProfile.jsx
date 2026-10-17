// =============================================================================
// ChurchDoorProfile — the church office edits its own door; the steward adds
// a church (migration 0297, DR-1066)
// =============================================================================
// Darrell 2026-10-16, after the Pushpay research-review: a Bishop in Los
// Angeles wants what the Love Corner has, and a second church could not be
// onboarded without an engineer writing a migration. Two cards:
//
//   ChurchDoorProfile  the office (owner/admin of THIS church) writes the
//                      church's face — name, pastor, address, hours, links —
//                      and its PUBLISHED GIVING CHANNELS. Every link is https
//                      and is refused on the phone, in the wall's own words,
//                      before it is refused by the wall (church-profile.js
//                      mirrors 0297's trigger). "Public" lets the directory
//                      show it to people who are not yet members. Mounted on
//                      the church's Members tab — the control sits with the
//                      scope it governs (P68).
//   AddAChurch         the platform steward (owner/admin of the family space,
//                      is_platform_steward) adds a church in one call: its
//                      short name, its display name, its first leader's email.
//                      The leader gets in the next time they sign in with that
//                      address — no invite to expire, no migration to write.
//                      The remaining constraint (a church's OWN installable
//                      door is a build step) is stated on the card.
//
// A SURFACE NEVER GOES BLANK (P15, DR-0381): the editor says it is reading,
// says what it could not read and why, and once read shows every field even
// when the row does not exist yet. Nothing here paints a number or a URL:
// what is shown is the row the server returned, and what is saved is what
// the office typed. The database is the wall (0297 RLS + set_church_profile /
// provision_church_instance); these cards read it back and say plainly when
// it refuses (DR-0076). Copy and behaviour are tested together in
// church-door-profile-render.test.jsx (DR-0691).
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import {
  PROFILE_FIELDS, CHANNEL_KINDS, MAX_GIVING_CHANNELS, DOOR_CONSTRAINT,
  profileFromForm, formFromProfile, normalizeChannels, channelsProblem, profileProblem,
  provisionRequest, suggestSlug,
} from '../lib/church-profile.js';
import { loadChurchProfileFor, saveChurchProfile, provisionChurch } from '../lib/church-profile-sync.js';

const serif = { fontFamily: '"Fraunces", serif' };
const LABEL = 'text-[0.625rem] uppercase tracking-wider text-[#5A5751] font-semibold';
const FIELD_LABEL = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751] block mb-1';
const INPUT = 'w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]';
// The focus ring is written LITERALLY on each button below, not folded into
// these constants: ui-standards-guard reads the JSX and cannot see through an
// identifier, and neither can a reviewer reading the diff (DR-1059, DR-0314).
const CHIP_BTN = 'text-[0.625rem] uppercase tracking-wider px-2 py-1 min-h-[36px] border border-[#C9BFA8] text-[#5A5751] hover:text-[#1A1815]';
const PRIMARY_BTN = 'text-[0.625rem] uppercase tracking-wider px-3 py-1 min-h-[36px] border border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#5A6E3D] hover:border-[#5A6E3D] disabled:opacity-50';

function Card({ children, testId }) {
  return <section className="bg-white border border-[#1A1815] p-4" data-testid={testId}>{children}</section>;
}

const blankRow = () => ({ kind: '', label: '', url: '', display: '', how: '' });

function rowsFromChannels(channels = []) {
  return (channels || []).map((c) => ({ kind: CHANNEL_KINDS.some((k) => k.id === c.id) ? c.id : '', id: c.id, label: c.label || '', url: c.url || '', display: c.display || '', how: c.how || '' }));
}

// ── This church's door ──────────────────────────────────────────────────────
export function ChurchDoorProfile({ gov, onSaved }) {
  const instanceId = gov && gov.governs && gov.space ? gov.space.instanceId : null;
  const [state, setState] = useState({ status: 'idle', row: null, slug: null, message: '' });
  const [form, setForm] = useState(() => formFromProfile({}));
  const [rows, setRows] = useState([blankRow()]);
  const [isPublic, setIsPublic] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!instanceId) { setState({ status: 'idle', row: null, slug: null, message: '' }); return undefined; }
    setState((p) => ({ ...p, status: 'loading' }));
    loadChurchProfileFor(instanceId).then((res) => {
      if (!alive) return;
      if (!res.ok) { setState({ status: 'error', row: null, slug: null, message: res.message || 'The door could not be read.' }); return; }
      const row = res.profile;
      setState({ status: 'ok', row, slug: res.slug, message: '' });
      setForm(formFromProfile((row && row.profile) || { name: res.displayName || '' }));
      const chRows = rowsFromChannels(row && row.giving_channels);
      setRows(chRows.length ? chRows : [blankRow()]);
      setIsPublic(!!(row && row.is_public));
    });
    return () => { alive = false; };
  }, [instanceId]);

  const channels = useMemo(() => normalizeChannels(rows), [rows]);
  const profile = useMemo(() => profileFromForm(form), [form]);
  const problem = useMemo(() => profileProblem(profile) || channelsProblem(channels) || (!profile.name ? 'A church name is needed.' : null), [profile, channels]);

  if (!instanceId) return null;

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setRow = (i, patch) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const pickKind = (i, kindId) => {
    const kind = CHANNEL_KINDS.find((k) => k.id === kindId);
    setRow(i, { kind: kindId, label: kind ? kind.label : rows[i].label, how: kind ? kind.how : rows[i].how });
  };
  const addRow = () => setRows((rs) => (rs.length >= MAX_GIVING_CHANNELS ? rs : [...rs, blankRow()]));
  const dropRow = (i) => setRows((rs) => (rs.length === 1 ? [blankRow()] : rs.filter((_, j) => j !== i)));

  const save = async () => {
    if (problem) { setNote(problem); return; }
    setSaving(true); setNote('Saving…');
    const res = await saveChurchProfile(instanceId, { profile, channels, isPublic });
    setSaving(false);
    if (!res.ok) {
      setNote(res.reason === 'forbidden' ? 'The server refused: only this church’s owner or admin may edit its door.'
        : res.reason === 'refused' ? `The server refused it: ${res.message}`
          : `That did not save (${res.reason}). ${res.message || ''}`.trim());
      return;
    }
    setState((p) => ({ ...p, row: res.profile }));
    setNote(`Saved. ${channels.length} giving channel${channels.length === 1 ? '' : 's'} published${isPublic ? ', and the door is public' : ''}.`);
    if (onSaved) onSaved(res.profile);
  };

  return (
    <Card testId="church-door-profile">
      <div className="text-sm font-semibold text-[#1A1815]" style={serif}>This church’s door</div>
      <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
        What the congregation reads about the church, and where it gives. Every link must be a complete https address the church itself publishes — the app only opens them, and never guesses one.
      </p>
      {state.status === 'loading' && <p className="text-xs mt-2 text-[#5A5751]" style={serif} data-door-reading>Reading the door…</p>}
      {state.status === 'error' && (
        <p className="text-xs mt-2 text-[#7A1F1F]" style={serif} role="alert" data-door-error>
          The door could not be read: {state.message} Try again from the Refresh button above; if it keeps failing, the church server is not answering and nothing here is lost.
        </p>
      )}
      {state.status === 'ok' && (
        <>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2" data-profile-fields>
            {PROFILE_FIELDS.map((f) => (
              <div key={f.key}>
                <label className={FIELD_LABEL} htmlFor={`cdp-${f.key}`}>{f.label}{f.required ? ' *' : ''}</label>
                <input id={`cdp-${f.key}`} type={f.kind === 'email' ? 'email' : f.kind === 'url' ? 'url' : 'text'} className={INPUT}
                  value={form[f.key] || ''} onChange={(e) => setField(f.key, e.target.value)} />
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className={LABEL}>Where the church receives gifts · {channels.length} of {MAX_GIVING_CHANNELS}</div>
            {!state.row && (
              <p className="text-[0.6875rem] text-[#5A5751] mt-1 leading-relaxed" style={serif} data-door-new>
                Nothing has been published for this church yet. Until the first save, the Give button shows an honest “not published yet” line instead of a borrowed list.
              </p>
            )}
            <ul className="mt-1.5 space-y-2" data-channel-rows>
              {rows.map((r, i) => (
                <li key={i} className="border border-[#E8E4DC] p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2" data-channel-row={i}>
                  <div>
                    <label className={FIELD_LABEL} htmlFor={`cdp-kind-${i}`}>Kind</label>
                    <select id={`cdp-kind-${i}`} className={INPUT} value={r.kind} onChange={(e) => pickKind(i, e.target.value)}>
                      <option value="">Choose…</option>
                      {CHANNEL_KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={FIELD_LABEL} htmlFor={`cdp-label-${i}`}>Button label</label>
                    <input id={`cdp-label-${i}`} className={INPUT} value={r.label} onChange={(e) => setRow(i, { label: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={FIELD_LABEL} htmlFor={`cdp-url-${i}`}>Link (https)</label>
                    <input id={`cdp-url-${i}`} type="url" className={INPUT} placeholder="https://" value={r.url} onChange={(e) => setRow(i, { url: e.target.value })} />
                  </div>
                  <div>
                    <label className={FIELD_LABEL} htmlFor={`cdp-display-${i}`}>Shown under the label (e.g. $CashTag)</label>
                    <input id={`cdp-display-${i}`} className={INPUT} value={r.display} onChange={(e) => setRow(i, { display: e.target.value })} />
                  </div>
                  <div>
                    <label className={FIELD_LABEL} htmlFor={`cdp-how-${i}`}>One line on how it works</label>
                    <input id={`cdp-how-${i}`} className={INPUT} value={r.how} onChange={(e) => setRow(i, { how: e.target.value })} />
                  </div>
                  <div className="sm:col-span-2 flex justify-end">
                    <button type="button" className={`${CHIP_BTN} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={() => dropRow(i)} data-drop-channel={i}>Remove this channel</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <button type="button" className={`${CHIP_BTN} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={addRow} disabled={rows.length >= MAX_GIVING_CHANNELS} data-add-channel>Add a channel</button>
              <label className="flex items-center gap-2 text-xs text-[#1A1815] cursor-pointer min-h-[36px]" style={serif}>
                <input type="checkbox" className="accent-[#5A6E3D] focus:outline focus:outline-2 focus:outline-[#B85838]" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} data-public />
                Show this door to people who are not members yet
              </label>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[0.6875rem] leading-relaxed" style={serif} role="status" data-door-note>
              {problem ? <span className="text-[#7A1F1F]">{problem}</span> : <span className="text-[#5A5751]">{note || 'Ready to save.'}</span>}
            </p>
            <button type="button" className={`${PRIMARY_BTN} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={save} disabled={saving || !!problem} data-save-door>{saving ? 'Saving…' : 'Save the door'}</button>
          </div>
          {state.row && state.row.updated_at && (
            <p className="text-[0.625rem] text-[#5A5751] mt-1" data-door-updated>Last saved {new Date(state.row.updated_at).toLocaleString()}.</p>
          )}
        </>
      )}
    </Card>
  );
}

// ── Add a church (the steward) ──────────────────────────────────────────────
export function AddAChurch({ onAdded }) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('owner');
  const [site, setSite] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [result, setResult] = useState(null);

  const effectiveSlug = slugTouched ? slug : suggestSlug(name);
  const req = provisionRequest({ slug: effectiveSlug, name, leaderEmail: email, leaderRole: role, site });

  const submit = async () => {
    if (!req.ok) { setNote(req.problem); return; }
    setBusy(true); setNote('Adding the church…'); setResult(null);
    const res = await provisionChurch(req.args);
    setBusy(false);
    if (!res.ok) {
      setNote(res.reason === 'forbidden' ? 'The server refused: only a platform steward (the family space’s owner or admin) may add a church.'
        : res.reason === 'refused' ? `The server refused it: ${res.message}`
          : `That did not go through (${res.reason}). ${res.message || ''}`.trim());
      return;
    }
    setResult(res);
    setNote(res.created
      ? `${name.trim()} is on the platform as “${res.slug}”. ${res.leaderEmail} is its ${res.leaderRole} and gets in the next time they sign in with that address.`
      : `“${res.slug}” already existed; ${res.leaderEmail} was added as its ${res.leaderRole}. Nothing else changed.`);
    if (onAdded) onAdded(res);
  };

  return (
    <Card testId="add-a-church">
      <div className="text-sm font-semibold text-[#1A1815]" style={serif}>Add a church to the platform</div>
      <p className="text-xs text-[#5A5751] mt-0.5 leading-relaxed" style={serif}>
        One call makes the church’s own space, names its first leader, and seats you as its PoeTech steward. The leader signs in with the email below and is its {role === 'owner' ? 'owner' : 'admin'} from that moment — no invite to expire. Calling it again for the same short name adds another leader and changes nothing else.
      </p>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className={FIELD_LABEL} htmlFor="aac-name">Church name *</label>
          <input id="aac-name" className={INPUT} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={FIELD_LABEL} htmlFor="aac-slug">Short name (its key) *</label>
          <input id="aac-slug" className={INPUT} value={effectiveSlug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} />
        </div>
        <div>
          <label className={FIELD_LABEL} htmlFor="aac-email">First leader’s email *</label>
          <input id="aac-email" type="email" className={INPUT} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className={FIELD_LABEL} htmlFor="aac-role">Their standing</label>
          <select id="aac-role" className={INPUT} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="owner">Owner — the pastor or the office</option>
            <option value="admin">Admin — a staff member</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={FIELD_LABEL} htmlFor="aac-site">Website (https, optional)</label>
          <input id="aac-site" type="url" className={INPUT} placeholder="https://" value={site} onChange={(e) => setSite(e.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[0.6875rem] leading-relaxed" style={serif} role="status" data-add-note>
          {!req.ok && (name || email || slugTouched) ? <span className="text-[#7A1F1F]">{req.problem}</span> : <span className="text-[#5A5751]">{note || 'Fill the three starred fields.'}</span>}
        </p>
        <button type="button" className={`${PRIMARY_BTN} focus:outline focus:outline-2 focus:outline-[#B85838]`} onClick={submit} disabled={busy || !req.ok} data-add-church>{busy ? 'Adding…' : 'Add the church'}</button>
      </div>
      {result && (
        <p className="text-[0.6875rem] text-[#1A1815] mt-2 border border-[#E8E4DC] bg-[#FAF8F4] p-2" style={serif} data-add-result>
          Space id <code className="text-[0.625rem]">{result.instanceId}</code> · key <strong>{result.slug}</strong> · {result.created ? 'created' : 'already existed'}.
        </p>
      )}
      <p className="text-[0.6875rem] text-[#5A5751] mt-2 leading-relaxed" style={serif} data-door-constraint>{DOOR_CONSTRAINT}</p>
    </Card>
  );
}

export default ChurchDoorProfile;
