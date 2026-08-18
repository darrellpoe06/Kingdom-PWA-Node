// =============================================================================
// ChatPane — the unified pane: one input, three destinations, zero API calls
// =============================================================================
// Green-lit 2026-08-15 through the ensemble seam. STRICTLY visual mounting and
// state reflection over the tested core (lib/chat-bus.js) and the real bus
// (agent_tasks, migration 0137) — this component contains NO routing logic, NO
// vendor calls, and NO database schema knowledge beyond the row it inserts and
// reads. DR-0132's architecture: submit = INSERT a row; the (Cage-gated) box
// agent does the work; realtime + refetch reflect the row's status.
//
// The three honesty rules the tests pin:
//   * a REROUTE is SAID, never silent (private + @claude -> local, with a note)
//   * pending is an HONEST state (a cold local model loading is named)
//   * a vendor without keys renders OFF-with-why and cannot be submitted to
import React, { useEffect, useRef, useState } from 'react';
import supabase from '../lib/supabase.js';
import { getInstanceId } from '../lib/table-sync.js';
import {
  CHAT_TARGETS, TARGET_META, buildTaskRow, paneStateFor, targetAvailable, parsePrefix,
} from '../lib/chat-bus.js';

const serif = { fontFamily: 'Lora, Georgia, serif' };

export default function ChatPane({ isPrivate = false, vendorKeysPresent = {} }) {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState('');
  const [notice, setNotice] = useState(null);
  const [sendState, setSendState] = useState('idle'); // idle | sending | error
  const cancelled = useRef(false);

  // My rows, newest last. Owner-scoped RLS means this can only ever be mine.
  async function refresh() {
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('*')
      .eq('kind', 'chat')
      .order('created_at', { ascending: true })
      .range(0, 199);
    if (!error && data && !cancelled.current) setRows(data);
  }

  useEffect(() => {
    cancelled.current = false;
    refresh();
    const ch = supabase
      .channel('agent-tasks-chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_tasks' }, refresh)
      .subscribe();
    return () => { cancelled.current = true; supabase.removeChannel(ch); };
  }, []);

  async function submit(e) {
    e?.preventDefault?.();
    const parsed = parsePrefix(draft);
    if (!parsed.message) return;
    // Key gating BEFORE the insert: a dark vendor is not submittable, and the
    // refusal says why instead of silently downgrading the user's choice.
    if (!isPrivate && !targetAvailable(parsed.target, vendorKeysPresent)) {
      setNotice(`${TARGET_META[parsed.target].label} is off — no API key is provisioned yet. Remove the @${parsed.target} prefix to use the local model.`);
      return;
    }
    setSendState('sending');
    setNotice(null);
    try {
      const tenantId = await getInstanceId();
      const { data: sess } = await supabase.auth.getSession();
      const userId = sess?.session?.user?.id;
      const built = buildTaskRow(draft, { isPrivate, tenantId, userId });
      if (!built) { setSendState('idle'); return; }
      if (built.rerouted) {
        setNotice('Sent to the local model instead: this space is private, and private prompts never leave the building.');
      }
      const { error } = await supabase.from('agent_tasks').insert(built.row);
      if (error) {
        setSendState('error');
        setNotice(`Could not queue the prompt: ${error.message}`);
        return;
      }
      setDraft('');
      setSendState('idle');
      refresh();
    } catch (err) {
      setSendState('error');
      setNotice(`Could not queue the prompt: ${err?.message || 'unknown error'}`);
    }
  }

  return (
    <div style={serif}>
      <h2 className="ts-chrome-region text-2xl mb-2" style={{ fontWeight: 500 }}>
        Ask the models
      </h2>
      <p className="mb-4 leading-relaxed" style={{ fontSize: '1.0625rem', opacity: 0.85 }}>
        One box, three destinations. Plain text goes to the household&rsquo;s own local
        model — free and private. Start with <code>@claude</code> or <code>@gemini</code> to
        route to a vendor when those routes are lit.
      </p>

      {/* Vendor availability, said plainly (surface-says-truth) */}
      <div className="mb-4 flex flex-wrap gap-2">
        {CHAT_TARGETS.map((t) => {
          const on = targetAvailable(t, vendorKeysPresent);
          return (
            <span key={t} className="px-2 py-1 rounded border" style={{ fontSize: '0.9375rem', opacity: on ? 1 : 0.55 }}>
              {TARGET_META[t].label}: {on ? 'ready' : 'off — no key provisioned'}
            </span>
          );
        })}
      </div>

      <div className="mb-4">
        {rows.map((row) => {
          const st = paneStateFor(row);
          return (
            <div key={row.id} className="mb-3 border-b pb-2">
              <div style={{ fontSize: '1.0625rem', fontWeight: 600 }}>
                {row.message} <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>→ {TARGET_META[row.target]?.label || row.target}</span>
              </div>
              {st.phase === 'pending' && (
                <div style={{ fontSize: '1rem', opacity: 0.8 }} aria-live="polite">{st.note}</div>
              )}
              {st.phase === 'done' && (
                <div className="whitespace-pre-wrap" style={{ fontSize: '1.0625rem' }}>{row.result}</div>
              )}
              {(st.phase === 'failed' || st.phase === 'unknown') && (
                <div role="alert" style={{ fontSize: '1rem' }}>{st.note}</div>
              )}
            </div>
          );
        })}
        {rows.length === 0 && (
          <p style={{ fontSize: '1rem', opacity: 0.75 }}>
            Nothing asked yet. Your prompts and answers appear here — only yours,
            on every device you sign into.
          </p>
        )}
      </div>

      {notice && (
        <p role="status" className="mb-3" style={{ fontSize: '1rem' }}>{notice}</p>
      )}

      <form onSubmit={submit} className="flex gap-2">
        <label className="sr-only" htmlFor="chat-pane-input">Message the models</label>
        <input
          id="chat-pane-input"
          className="flex-1 border rounded px-3"
          style={{ fontSize: '1.0625rem', minHeight: '2.75rem' }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask… (@claude / @gemini / plain = local)"
        />
        <button
          type="submit"
          className="border rounded px-4"
          style={{ fontSize: '1.0625rem', minHeight: '2.75rem' }}
          disabled={sendState === 'sending'}
        >
          {sendState === 'sending' ? 'Queuing…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
