// =============================================================================
// ResearchTry — ask the research road one question (DR-1101)
// =============================================================================
// Shown on the Infra Plan inside "Open-source tools, weighed", so the first
// tool DR-1099 brought home can be tried where it is weighed. Reads the road's
// own /health (never a painted status), and asks through lib/research.js with
// the family key this device already holds. The answer is plain text, every
// link is http(s), and the panel says in words that nothing in it is checked.
// =============================================================================
import React, { useEffect, useState } from 'react';
import { researchHealth, askResearch, queryProblem, MAX_QUERY_CHARS } from '../lib/research.js';
import { bridgeToken } from '../lib/nas-photos.js';
import { provisionBridgeToken } from '../lib/bridge-provision.js';
import { supabase } from '../lib/supabase.js';

const labelCls = 'text-[0.5625rem] uppercase tracking-wider text-[#5A5751]';

export default function ResearchTry({ fetchImpl, client = supabase }) {
  const [health, setHealth] = useState({ state: 'checking' });
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let live = true;
    researchHealth(fetchImpl ? { fetchImpl } : undefined).then((h) => { if (live) setHealth(h); });
    provisionBridgeToken(client);
    return () => { live = false; };
  }, [fetchImpl, client]);

  const problem = queryProblem(query);
  const canAsk = health.state === 'live' && !problem && !busy;

  async function onAsk(e) {
    e.preventDefault();
    if (!canAsk) return;
    setBusy(true);
    setResult(null);
    const r = await askResearch(query, { token: bridgeToken(), ...(fetchImpl ? { fetchImpl } : {}) });
    setResult(r);
    setBusy(false);
  }

  return (
    <div className="mt-3 border border-[#1A1815] p-3" aria-labelledby="research-try-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id="research-try-title" className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif' }}>Try Vane: ask the research road</h4>
        <span role="status" className="text-[0.6875rem] text-[#5A5751]">
          {health.state === 'checking' && 'Checking the road…'}
          {health.state === 'live' && `Live on the NAS · answering with ${health.chat}`}
          {health.state === 'dark' && `Not ready: ${health.reason}`}
          {health.state === 'unreachable' && health.reason}
        </span>
      </div>
      <form onSubmit={onAsk} className="mt-2">
        <label htmlFor="research-q" className={labelCls}>Your question</label>
        <textarea
          id="research-q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={2}
          maxLength={MAX_QUERY_CHARS + 50}
          className="mt-1 w-full border border-[#C9C2B6] bg-white p-2 text-[0.8125rem] text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#1A1815]"
          placeholder="Where were the Dead Sea Scrolls found, and when?"
        />
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={!canAsk}
            className="min-h-[36px] px-3 text-[0.6875rem] uppercase tracking-wider border border-[#1A1815] bg-[#1A1815] text-white disabled:bg-white disabled:text-[#5A5751] disabled:border-[#C9C2B6] focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#1A1815]"
          >
            {busy ? 'Searching and answering…' : 'Ask'}
          </button>
          {query && problem && <span className="text-[0.6875rem] text-[#B85838]">{problem}</span>}
        </div>
      </form>
      {result && !result.ok && <p role="alert" className="mt-2 text-[0.75rem] text-[#B85838]">{result.error}</p>}
      {result && result.ok && (
        <div className="mt-2 border-t border-[#E8E4DC] pt-2">
          <p className="text-[0.6875rem] text-[#B85838]">{result.note}</p>
          <p className="mt-1 whitespace-pre-wrap text-[0.8125rem] text-[#1A1815]">{result.answer}</p>
          <div className={`${labelCls} mt-2`}>Sources ({result.sources.length})</div>
          <ol className="mt-1 list-decimal pl-5 space-y-0.5 text-[0.75rem]">
            {result.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline text-[#1A1815] break-words">{s.title}</a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
