// Inbound · 📞 Voice Ops UI — extracted from monolith (r33) per
// MODULAR-EXTENSIBILITY.md. TLC isolation enforced upstream at the Worker.
import React, { useState, useEffect } from 'react';
import { suggestTriage } from '../lib/inbound-triage.js';

// --- Pure helpers (exported for tests) ---

// Build the local record a converted voicemail becomes. Pure: no I/O, no state.
// `today` is injected so the mapping is deterministic under test.
export function buildConvertPayload(row, convertAs, convertNote, convertEntity, today) {
  const ent = convertEntity || (row.line === 'poe-properties' ? 'e-poeprops' : 'e-poetech');
  const desc = (row.transcript || `Voicemail from ${row.caller || 'unknown'}`) + (convertNote ? `\n\n${convertNote}` : '');
  if (convertAs === 'incident') {
    return { kind: 'incident', payload: {
      date: today,
      amount: 0,
      category: row.line === 'poe-properties' ? 'tenant-or-property' : 'business',
      entityId: ent,
      description: `📞 ${row.caller || 'unknown'} — ${desc.slice(0, 200)}`,
      urgency: 'incident',
      status: 'open',
      dueDate: '',
    } };
  }
  if (convertAs === 'inquiry') {
    return { kind: 'inquiry', payload: {
      firstName: '(from voicemail)',
      lastName: row.caller || '',
      phone: row.caller || '',
      email: '',
      source: 'inbound-voicemail',
      interest: 'voicemail-intake',
      bestTime: 'anytime',
      notes: desc,
    } };
  }
  if (convertAs === 'project') {
    return { kind: 'project', payload: {
      title: `Inbound: ${(row.caller || 'unknown')} · ${row.line}`,
      startDate: today,
      endDate: '',
      status: 'planning',
      domain: row.line === 'poe-properties' ? 'real-estate' : 'business-poetech',
      description: desc,
      hoursPerWeek: 2,
      entityId: ent,
      contractorIds: [],
      conversationLog: [{ id: `cv-${Date.now()}`, date: today, person: row.caller || 'inbound voicemail', summary: 'Origin voicemail', notes: row.transcript || '' }],
    } };
  }
  return { kind: null, payload: null };
}

// Mark-handled-FIRST ordering (fixes A2 double-convert). The local record is
// created ONLY after the backend confirms the voicemail is handled. If the
// PATCH fails, nothing is created — otherwise a failed mark-handled leaves the
// voicemail re-convertible and the next attempt double-creates the record (and
// a failed "discard" silently resurfaces). Pure orchestration; no React.
export async function convertInbound({ markHandled, createLocalRecord }) {
  const handled = await markHandled();
  if (!handled) return { handled: false, created: false };
  createLocalRecord();
  return { handled: true, created: true };
}

function Inbound({ voiceOps = {}, setVoiceOpsConfig, addIncident, addInquiry, addProject, entities = [], setView }) {
  const configured = !!(voiceOps.apiUrl && voiceOps.apiToken);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetched, setLastFetched] = useState(null);
  const [filterLine, setFilterLine] = useState('all');
  const [filterStatus, setFilterStatus] = useState('new');
  // Config form state (only shown when not configured yet, or via gear)
  const [showConfig, setShowConfig] = useState(!configured);
  const [cfgUrl, setCfgUrl] = useState(voiceOps.apiUrl || '');
  const [cfgToken, setCfgToken] = useState(voiceOps.apiToken || '');
  // Per-row "convert" form state (only one row open at a time)
  const [convertOpen, setConvertOpen] = useState(null); // row.id
  const [convertAs, setConvertAs] = useState('incident'); // 'incident' | 'inquiry' | 'project'
  const [convertNote, setConvertNote] = useState('');
  const [convertEntity, setConvertEntity] = useState(entities[0]?.id || 'e-personal');

  const apiUrl = (voiceOps.apiUrl || '').replace(/\/$/, '');
  const token = voiceOps.apiToken || '';

  const fetchInbound = async () => {
    if (!configured) return;
    setLoading(true); setError('');
    try {
      const url = `${apiUrl}/inbound?status=${encodeURIComponent(filterStatus)}${filterLine !== 'all' ? `&line=${encodeURIComponent(filterLine)}` : ''}&limit=100`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} — ${body.slice(0, 200) || 'no body'}`);
      }
      const data = await res.json();
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setLastFetched(new Date());
    } catch (e) {
      setError(e.message || 'network error');
    }
    setLoading(false);
  };
  // Auto-fetch on mount + when filters change, refresh every 5 minutes.
  useEffect(() => {
    if (!configured) return;
    fetchInbound();
    const id = setInterval(fetchInbound, 5 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, filterLine, filterStatus, apiUrl, token]);

  const saveConfig = () => {
    if (!cfgUrl.trim() || !cfgToken.trim()) { alert('Both API endpoint and token are required.'); return; }
    setVoiceOpsConfig({ apiUrl: cfgUrl.trim(), apiToken: cfgToken.trim() });
    setShowConfig(false);
  };

  // Mark a voicemail handled on the backend. Returns true only if the PATCH
  // succeeded (res.ok); surfaces failures through the existing `error` banner so
  // a silent failure can never leave a half-converted row (A2).
  const markHandled = async (row, handledAs) => {
    setError('');
    try {
      const res = await fetch(`${apiUrl}/inbound/${row.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'handled', handled_as: handledAs, handled_note: convertNote }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`HTTP ${res.status} — ${body.slice(0, 200) || 'no body'}`);
      }
    } catch (e) {
      setError(`Couldn't mark this voicemail handled (${e.message || 'network error'}). Nothing was changed — try again.`);
      return false;
    }
    fetchInbound();
    return true;
  };

  const submitConvert = async (row) => {
    const today = new Date().toISOString().slice(0, 10);
    const { kind, payload } = buildConvertPayload(row, convertAs, convertNote, convertEntity, today);
    // Mark handled FIRST; only create the local record if the backend confirms.
    const result = await convertInbound({
      markHandled: () => markHandled(row, convertAs),
      createLocalRecord: () => {
        if (kind === 'incident') addIncident && addIncident(payload);
        else if (kind === 'inquiry') addInquiry && addInquiry(payload);
        else if (kind === 'project') addProject && addProject(payload);
      },
    });
    if (!result.created) return; // markHandled failed; error already surfaced, form stays open to retry
    setConvertOpen(null); setConvertNote(''); setConvertAs('incident');
    if (setView) {
      const target = convertAs === 'inquiry' ? 'practice' : convertAs === 'project' ? 'projects' : 'overview';
      setView(target);
    }
  };

  // Discard only clears the form if the backend confirmed the discard — a failed
  // PATCH keeps the row open with the error visible instead of silently
  // resurfacing it as "new" on the next refresh (A2).
  const discardRow = async (row) => {
    const ok = await markHandled(row, 'discarded');
    if (ok) { setConvertOpen(null); setConvertNote(''); }
  };

  const lineLabel = (l) => l === 'poe-properties' ? 'Steward Real Estate' : l === 'poetech' ? 'Cornerstone Tech' : l || '—';

  return (
    <div className="space-y-6">
      <section className="bg-white border border-[#1A1815] p-5">
        <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] mb-1 font-medium">Inbound · Voicemails &amp; Call Notes</div>
        <h2 className="text-2xl" style={{ fontFamily: '"Fraunces", serif', fontWeight: 500 }}>What came in while you were busy.</h2>
        <p className="text-sm leading-relaxed mt-2 text-[#5A5751] max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
          Phase 1 routing for Steward Real Estate + Cornerstone Tech business lines. Each voicemail is auto-transcribed by Twilio, stored in your own Cloudflare Worker (free tier), and shown here for triage. Convert each one into an Incident, Practice Inquiry, or Project — the original recording stays archived. <strong>The clinical practice is not routed here</strong> — that line keeps its current setup until the Phase 3 HIPAA-clean stack ships. <a href="https://github.com/darrellpoe06/Kingdom-PWA-Node/blob/main/backend/voice-worker/README.md" target="_blank" rel="noopener noreferrer" className="underline text-[#B85838]">Setup runbook →</a>
        </p>
      </section>

      {/* CONFIG FORM */}
      {(!configured || showConfig) && (
        <section aria-labelledby="cfg-h" className="bg-[#FAF8F4] border-2 border-[#B85838] p-4">
          <h3 id="cfg-h" className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-2">{configured ? 'Edit endpoint &amp; token' : 'First-time setup'}</h3>
          <p className="text-xs text-[#5A5751] mb-3" style={{ fontFamily: '"Fraunces", serif' }}>
            Paste your Cloudflare Worker URL + the <code>PWA_API_TOKEN</code> you generated in the deploy runbook (steps 4b and 5). Both saved locally on this device — never sent anywhere except your own Worker.
          </p>
          <div className="space-y-2">
            <div>
              <label htmlFor="cfg-url" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">API endpoint URL</label>
              <input id="cfg-url" type="url" placeholder="https://api.poetech.us  or  https://poetech-voice-ops.YOUR-SUB.workers.dev" className="w-full p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={cfgUrl} onChange={e => setCfgUrl(e.target.value)} />
            </div>
            <div>
              <label htmlFor="cfg-token" className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">API token (PWA_API_TOKEN)</label>
              <input id="cfg-token" type="password" placeholder="Paste the token you set in wrangler secret put PWA_API_TOKEN" className="w-full p-2 border border-[#1A1815] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={cfgToken} onChange={e => setCfgToken(e.target.value)} />
            </div>
            <div className="flex gap-2 flex-wrap pt-1">
              <button type="button" onClick={saveConfig} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]">Save &amp; connect</button>
              {configured && <button type="button" onClick={() => setShowConfig(false)} className="border border-[#1A1815] px-4 py-2 text-xs uppercase tracking-wider hover:bg-white focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>}
            </div>
          </div>
        </section>
      )}

      {/* INBOUND LIST */}
      {configured && (
        <section aria-labelledby="ib-list-h">
          <div className="flex items-baseline justify-between mb-2 pb-2 border-b border-[#1A1815] gap-2 flex-wrap">
            <h3 id="ib-list-h" className="text-[10px] uppercase tracking-[0.25em] text-[#5A5751]">Inbox · {rows.length} {filterStatus === 'new' ? 'new' : filterStatus}</h3>
            <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-wider">
              <div className="flex gap-1">
                {[['all','All lines'],['poe-properties','Steward Real Estate'],['poetech','Cornerstone Tech']].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setFilterLine(k)} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${filterLine === k ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{l}</button>
                ))}
              </div>
              <span aria-hidden="true" className="h-4 w-px bg-[#E8E4DC]" />
              <div className="flex gap-1">
                {[['new','New'],['handled','Handled'],['all','All']].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setFilterStatus(k)} className={`px-2 py-1 border focus:outline focus:outline-2 focus:outline-[#B85838] ${filterStatus === k ? 'bg-[#1A1815] text-white border-[#1A1815]' : 'border-[#E8E4DC] text-[#5A5751]'}`}>{l}</button>
                ))}
              </div>
              <span aria-hidden="true" className="h-4 w-px bg-[#E8E4DC]" />
              {lastFetched && <span className="text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>updated {lastFetched.toLocaleTimeString()}</span>}
              <button type="button" onClick={fetchInbound} disabled={loading} aria-busy={loading} className="text-[#B85838] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]">{loading ? 'Refreshing…' : '↻ Refresh'}</button>
              <button type="button" onClick={() => setShowConfig(true)} className="text-[#5A5751] hover:text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]" title="Edit endpoint">⚙ Config</button>
            </div>
          </div>

          {error && (
            <div role="alert" className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 mb-3">
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold mb-1">⚠ Couldn't reach the Voice Ops backend</div>
              <p className="text-xs leading-relaxed" style={{ fontFamily: '"Fraunces", serif' }}>{error}</p>
              <p className="text-[10px] text-[#5A5751] italic mt-2" style={{ fontFamily: '"Fraunces", serif' }}>Common causes: wrong URL / token (⚙ Config), Worker not deployed, CORS blocked. Verify with <code>curl {apiUrl}/healthz</code>.</p>
            </div>
          )}

          {rows.length === 0 && !loading && !error && (
            <div className="bg-white border border-[#E8E4DC] p-6 text-center">
              <div className="text-2xl mb-1" aria-hidden="true">📭</div>
              <p className="text-sm text-[#5A6E3D] font-semibold" style={{ fontFamily: '"Fraunces", serif' }}>No {filterStatus === 'new' ? 'new' : filterStatus} voicemails.</p>
              <p className="text-xs text-[#5A5751] mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Live calls auto-appear here within ~5 minutes of the voicemail ending.</p>
            </div>
          )}

          {rows.length > 0 && (
            <div className="bg-white border border-[#1A1815]">
              {rows.map((r, i) => {
                const isOpen = convertOpen === r.id;
                const created = r.created_at ? new Date(r.created_at).toLocaleString() : '';
                // Deterministic triage assist (REV-0007): a SUGGESTION a human
                // still confirms — intent, urgency, a unit hint, likely target.
                const sug = suggestTriage({ line: r.line, transcript: r.transcript });
                return (
                  <div key={r.id} className={`p-4 ${i < rows.length - 1 ? 'border-b border-[#E8E4DC]' : ''}`}>
                    <div className="flex items-baseline justify-between gap-2 flex-wrap mb-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: r.line === 'poe-properties' ? '#B85838' : '#1F6FEB' }}>{lineLabel(r.line)}</span>
                        <span style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>{r.caller || 'unknown caller'}</span>
                        {r.caller_name && <span className="text-xs text-[#5A5751]">({r.caller_name})</span>}
                        {r.status === 'handled' && <span className="text-[10px] uppercase tracking-wider text-[#5A6E3D]">✓ {r.handled_as || 'handled'}{r.handled_at ? ` · ${new Date(r.handled_at).toLocaleDateString()}` : ''}</span>}
                      </div>
                      <div className="text-[10px] text-[#5A5751]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{created}{r.voicemail_dur_sec ? ` · ${r.voicemail_dur_sec}s` : ''}</div>
                    </div>
                    {r.transcript ? (
                      <p className="text-sm bg-[#FAF8F4] border-l-2 border-[#B85838] p-2 my-2" style={{ fontFamily: '"Fraunces", serif' }}>{r.transcript}</p>
                    ) : (
                      <p className="text-xs text-[#5A5751] italic my-2" style={{ fontFamily: '"Fraunces", serif' }}>No transcript available (audio only).</p>
                    )}
                    {r.transcript && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-2 text-xs uppercase tracking-wider" aria-label="Suggested triage">
                        {sug.urgent && (
                          <span className="px-1.5 py-0.5 bg-[#B85838] text-white font-semibold">Urgent</span>
                        )}
                        <span className="px-1.5 py-0.5 border border-[#E8E4DC] text-[#5A5751]">{sug.intent}</span>
                        {sug.unitHint && (
                          <span className="px-1.5 py-0.5 border border-[#E8E4DC] text-[#5A5751]">{sug.unitHint}? · confirm</span>
                        )}
                        <span className="text-[#5A5751] normal-case tracking-normal italic" style={{ fontFamily: '"Fraunces", serif' }}>Suggests: convert to {sug.suggestedConvertAs}</span>
                      </div>
                    )}
                    {r.voicemail_url && (
                      <audio controls preload="none" src={r.voicemail_url} className="w-full mt-1" />
                    )}
                    {r.handled_note && (
                      <p className="text-[11px] text-[#5A5751] italic mt-1" style={{ fontFamily: '"Fraunces", serif' }}>Handle note: {r.handled_note}</p>
                    )}
                    {r.status !== 'handled' && (
                      <div className="mt-3">
                        {!isOpen ? (
                          <button type="button" onClick={() => { setConvertOpen(r.id); setConvertAs(sug.suggestedConvertAs); }} className="text-xs uppercase tracking-wider px-3 py-2 border border-[#1A1815] hover:bg-[#1A1815] hover:text-white min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Convert this voicemail →</button>
                        ) : (
                          <div className="bg-[#FAF8F4] border-2 border-[#B85838] p-3 space-y-2">
                            <div className="text-[10px] uppercase tracking-[0.25em] text-[#B85838] font-semibold">Convert into what?</div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {[['incident','! Incident','3-day to-do · adds to Action Queue'],['inquiry','📋 Practice Inquiry','adds to Practice pipeline'],['project','◆ Project','multi-day · capacity-aware']].map(([k, label, hint]) => (
                                <button key={k} type="button" onClick={() => setConvertAs(k)} className="text-left p-2 border min-h-[56px] focus:outline focus:outline-2 focus:outline-[#B85838]" style={convertAs === k ? { backgroundColor: '#1A1815', color: 'white', borderColor: '#1A1815' } : { borderColor: '#E8E4DC' }}>
                                  <div className="text-xs uppercase tracking-wider font-semibold">{label}</div>
                                  <div className="text-[10px] opacity-90 mt-0.5" style={{ fontFamily: '"Fraunces", serif' }}>{hint}</div>
                                </button>
                              ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label htmlFor={`ib-ent-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Entity</label>
                                <select id={`ib-ent-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" value={convertEntity} onChange={e => setConvertEntity(e.target.value)}>
                                  {entities.map(e => <option key={e.id} value={e.id}>{e.name.split('(')[0].trim()}</option>)}
                                </select>
                              </div>
                              <div>
                                <label htmlFor={`ib-note-${r.id}`} className="text-[9px] uppercase tracking-wider text-[#5A5751] block mb-1">Additional note (optional)</label>
                                <input id={`ib-note-${r.id}`} className="w-full p-2 border border-[#E8E4DC] text-sm bg-white focus:outline focus:outline-2 focus:outline-[#B85838]" placeholder="Context the transcript missed" value={convertNote} onChange={e => setConvertNote(e.target.value)} />
                              </div>
                            </div>
                            <div className="flex gap-2 flex-wrap pt-1">
                              <button type="button" onClick={() => submitConvert(r)} className="bg-[#1A1815] text-white px-4 py-2 text-xs uppercase tracking-wider font-semibold hover:bg-[#B85838] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Convert + mark handled</button>
                              <button type="button" onClick={() => discardRow(r)} className="border border-[#5A5751] text-[#5A5751] px-4 py-2 text-xs uppercase tracking-wider hover:bg-[#FAF8F4] min-h-[36px] focus:outline focus:outline-2 focus:outline-[#B85838]">Discard (not actionable)</button>
                              <button type="button" onClick={() => { setConvertOpen(null); setConvertNote(''); }} className="text-xs uppercase tracking-wider text-[#5A5751] hover:text-[#1A1815] px-3 py-2 focus:outline focus:outline-2 focus:outline-[#B85838]">Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-[#5A5751] italic mt-3 max-w-prose" style={{ fontFamily: '"Fraunces", serif' }}>
            Auto-refreshes every 5 minutes when this tab is open. Raw recording + transcript stay in your Cloudflare D1 database after conversion — searchable for audit. TLC voicemails are never routed through this Worker; the Studio flow on the TLC line should post to a separate HIPAA-clean endpoint when Phase 3 ships.
          </p>
        </section>
      )}
    </div>
  );
}

export { Inbound };
export default Inbound;
