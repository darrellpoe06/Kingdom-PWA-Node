// =============================================================================
// EdgeGuard — see who is hitting poetech.us and block them, from the app
// (DR-1067; Darrell 2026-10-16, Cloudflare showing 930k requests in a day)
// =============================================================================
// Three cards, each read from Cloudflare through the same-origin /edge road and
// each honest when it cannot read (no Worker yet, no token, a token without
// the permission, a silent road): BOTS — Bot Fight Mode and AI-crawler
// blocking, the two switches that refuse automated traffic at the edge;
// TRAFFIC, LAST 24 HOURS — the paths, user agents, networks and addresses that
// made the requests, with our own witnesses named so "our own metrics" is a
// line you can read, and a Block beside every network and address; BLOCKS —
// what is refused now, each with its reason and a way back. Blocking is a
// two-step on the surface (never a browser dialog: no-prompt-guard), and
// nothing here is painted: a card with no answer says why.
import React, { useCallback, useEffect, useState } from 'react';
import { getBots, setBots, getTraffic, listBlocks, addBlock, removeBlock, compactCount, agentKind } from '../lib/edge-guard.js';

const H = 'text-[0.625rem] uppercase tracking-[0.25em] text-[#5A5751] font-semibold';
const CARD = 'bg-white border border-[#E8E4DC] rounded-2xl p-4';
const RING = 'focus:outline focus:outline-2 focus:outline-[#B85838]';
const BTN = 'text-[0.625rem] uppercase tracking-wider px-3 py-1.5 min-h-[36px] rounded-full border';
const PRIMARY = `${BTN} border-[#1A1815] bg-[#1A1815] text-white hover:bg-[#B85838] hover:border-[#B85838]`;
const QUIET = `${BTN} border-[#1A1815] text-[#1A1815] hover:bg-[#1A1815] hover:text-white`;
const WARN = `${BTN} border-[#B85838] text-[#B85838] hover:bg-[#B85838] hover:text-white`;

function Refusal({ r, what }) {
  if (!r || r.ok) return null;
  return (
    <p className="text-xs text-[#B85838] leading-relaxed" role="status" data-testid={`edge-refusal-${what}`}>
      {r.message || `${what} could not be read.`}
    </p>
  );
}

function BotsCard({ bots, onChange, busy }) {
  const r = bots;
  const on = r && r.ok ? r.bots : null;
  return (
    <section className={CARD} aria-labelledby="edge-bots-h" data-testid="edge-bots">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
        <h3 id="edge-bots-h" className={H}>Bots · refused at the edge</h3>
        {on && <span className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">{on.fightMode && on.aiBots === 'block' ? 'all on' : on.fightMode || on.aiBots === 'block' ? 'partly on' : 'off'}</span>}
      </div>
      <Refusal r={r} what="bots" />
      {on && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>Bot Fight Mode</div>
              <div className="text-[0.6875rem] text-[#5A5751]">Cloudflare challenges and slows known automated traffic before it reaches the site.</div>
            </div>
            <button type="button" disabled={busy} aria-pressed={on.fightMode} onClick={() => onChange({ fightMode: !on.fightMode })} className={`${on.fightMode ? PRIMARY : QUIET} ${RING}`} data-testid="edge-fight-mode">
              {on.fightMode ? 'On' : 'Off'} · {on.fightMode ? 'turn off' : 'turn on'}
            </button>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }}>AI crawlers</div>
              <div className="text-[0.6875rem] text-[#5A5751]">Refuses the crawlers that harvest pages to train models (GPTBot, ClaudeBot, Bytespider and the rest).</div>
            </div>
            <button type="button" disabled={busy} aria-pressed={on.aiBots === 'block'} onClick={() => onChange({ aiBots: on.aiBots === 'block' ? 'disabled' : 'block' })} className={`${on.aiBots === 'block' ? PRIMARY : QUIET} ${RING}`} data-testid="edge-ai-bots">
              {on.aiBots === 'block' ? 'Blocked' : on.aiBots === 'unknown' ? 'Unknown' : 'Allowed'} · {on.aiBots === 'block' ? 'allow' : 'block'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function TwoStep({ label, confirm, onConfirm, cls = WARN, testId }) {
  const [armed, setArmed] = useState(false);
  if (!armed) return <button type="button" onClick={() => setArmed(true)} className={`${cls} ${RING}`} data-testid={testId}>{label}</button>;
  return (
    <span className="inline-flex items-center gap-1.5">
      <button type="button" onClick={() => { setArmed(false); onConfirm(); }} className={`${PRIMARY} ${RING}`} data-testid={`${testId}-confirm`}>{confirm}</button>
      <button type="button" onClick={() => setArmed(false)} className={`${QUIET} ${RING}`} data-testid={`${testId}-keep`}>Keep</button>
    </span>
  );
}

function Rows({ title, rows, render, testId }) {
  return (
    <div data-testid={testId}>
      <div className={`${H} mb-1`}>{title}</div>
      {rows.length === 0 ? <p className="text-[0.6875rem] text-[#5A5751] italic">Nothing in this window.</p> : (
        <ul className="divide-y divide-[#F2EEE6]">
          {rows.map((row, i) => <li key={i} className="py-1.5 flex items-center justify-between gap-3">{render(row)}</li>)}
        </ul>
      )}
    </div>
  );
}

function TrafficCard({ traffic, onBlock }) {
  const r = traffic;
  const t = r && r.ok ? r.traffic : null;
  return (
    <section className={CARD} aria-labelledby="edge-traffic-h" data-testid="edge-traffic">
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
        <h3 id="edge-traffic-h" className={H}>Traffic · last 24 hours · who or what</h3>
        {t && <span className="text-sm text-[#1A1815]" style={{ fontFamily: '"Fraunces", serif', fontWeight: 600 }} data-testid="edge-total">{compactCount(t.total)} requests</span>}
      </div>
      <Refusal r={r} what="traffic" />
      {t && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Rows title="User agents" rows={t.agents} testId="edge-agents" render={(a) => (
            <>
              <span className="min-w-0 truncate text-[0.75rem] text-[#1A1815]" title={a.agent}>{a.agent || '(none)'} <span className="text-[#5A5751]">· {agentKind(a.agent)}</span></span>
              <span className="shrink-0 text-[0.75rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{compactCount(a.count)}</span>
            </>
          )} />
          <Rows title="Networks (ASN)" rows={t.networks} testId="edge-networks" render={(n) => (
            <>
              <span className="min-w-0 truncate text-[0.75rem] text-[#1A1815]">{n.name || 'unnamed'} <span className="text-[#5A5751]">· AS{n.asn}</span></span>
              <span className="shrink-0 inline-flex items-center gap-2">
                <span className="text-[0.75rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{compactCount(n.count)}</span>
                <TwoStep label="Block" confirm="Block this network" onConfirm={() => onBlock('asn', `AS${n.asn}`, n.name)} testId={`edge-block-asn-${n.asn}`} />
              </span>
            </>
          )} />
          <Rows title="Addresses" rows={t.addresses} testId="edge-addresses" render={(a) => (
            <>
              <span className="min-w-0 truncate text-[0.75rem] text-[#1A1815]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{a.ip}</span>
              <span className="shrink-0 inline-flex items-center gap-2">
                <span className="text-[0.75rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{compactCount(a.count)}</span>
                <TwoStep label="Block" confirm="Block this address" onConfirm={() => onBlock('ip', a.ip, '')} testId={`edge-block-ip-${a.ip}`} />
              </span>
            </>
          )} />
          <Rows title="Paths" rows={t.paths} testId="edge-paths" render={(p) => (
            <>
              <span className="min-w-0 truncate text-[0.75rem] text-[#1A1815]" style={{ fontFamily: '"JetBrains Mono", monospace' }} title={p.path}>{p.path}</span>
              <span className="shrink-0 text-[0.75rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{compactCount(p.count)}</span>
            </>
          )} />
          <Rows title="Countries" rows={t.countries} testId="edge-countries" render={(c) => (
            <>
              <span className="min-w-0 truncate text-[0.75rem] text-[#1A1815]">{c.country || 'unknown'}</span>
              <span className="shrink-0 inline-flex items-center gap-2">
                <span className="text-[0.75rem]" style={{ fontFamily: '"JetBrains Mono", monospace' }}>{compactCount(c.count)}</span>
              </span>
            </>
          )} />
        </div>
      )}
    </section>
  );
}

function BlocksCard({ blocks, onRemove, onAdd }) {
  const r = blocks;
  const list = r && r.ok ? r.blocks : null;
  const [target, setTarget] = useState('asn');
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  return (
    <section className={CARD} aria-labelledby="edge-blocks-h" data-testid="edge-blocks">
      <h3 id="edge-blocks-h" className={`${H} mb-2`}>Blocked now</h3>
      <Refusal r={r} what="blocks" />
      {list && (list.length === 0 ? <p className="text-[0.6875rem] text-[#5A5751] italic mb-3">No one is blocked at the edge yet.</p> : (
        <ul className="divide-y divide-[#F2EEE6] mb-3">
          {list.map((b) => (
            <li key={b.id} className="py-1.5 flex items-center justify-between gap-3" data-testid={`edge-block-row-${b.id}`}>
              <span className="min-w-0 truncate text-[0.75rem] text-[#1A1815]"><span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{b.target} {b.value}</span>{b.notes ? <span className="text-[#5A5751]"> · {b.notes}</span> : null}</span>
              <TwoStep label="Unblock" confirm="Unblock" cls={QUIET} onConfirm={() => onRemove(b.id)} testId={`edge-unblock-${b.id}`} />
            </li>
          ))}
        </ul>
      ))}
      {list && (
        <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => { e.preventDefault(); if (value.trim()) { onAdd(target, value.trim(), note.trim()); setValue(''); setNote(''); } }} data-testid="edge-add-block">
          <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Kind
            <select value={target} onChange={(e) => setTarget(e.target.value)} className={`block mt-1 border border-[#E8E4DC] bg-white text-sm px-2 py-1.5 ${RING}`} aria-label="What to block">
              <option value="asn">Network (AS number)</option>
              <option value="ip">Address</option>
              <option value="ip_range">Address range</option>
              <option value="country">Country</option>
            </select>
          </label>
          <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Value
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder={target === 'asn' ? 'AS13335' : target === 'country' ? 'US' : target === 'ip_range' ? '203.0.113.0/24' : '203.0.113.9'} className={`block mt-1 border border-[#E8E4DC] bg-white text-sm px-2 py-1.5 ${RING}`} aria-label="The value to block" />
          </label>
          <label className="text-[0.625rem] uppercase tracking-wider text-[#5A5751]">Why
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="scraper, 400k requests" className={`block mt-1 border border-[#E8E4DC] bg-white text-sm px-2 py-1.5 ${RING}`} aria-label="Why this is blocked" />
          </label>
          <button type="submit" className={`${WARN} ${RING}`} data-testid="edge-add-submit">Block</button>
        </form>
      )}
    </section>
  );
}

export default function EdgeGuard() {
  const [bots, setBotsState] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [blocks, setBlocks] = useState(null);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');

  const load = useCallback(async () => {
    const [b, t, k] = await Promise.all([getBots(), getTraffic(24), listBlocks()]);
    setBotsState(b); setTraffic(t); setBlocks(k);
  }, []);
  useEffect(() => { load(); }, [load]);

  const onBots = useCallback(async (patch) => {
    setBusy(true); setSaid('');
    const r = await setBots(patch);
    setBusy(false);
    if (r.ok) { setBotsState(r); setSaid(`Saved. Bot Fight Mode ${r.bots.fightMode ? 'on' : 'off'}; AI crawlers ${r.bots.aiBots === 'block' ? 'blocked' : 'allowed'}.`); }
    else setSaid(r.message || 'Cloudflare did not take the change.');
  }, []);
  const onBlock = useCallback(async (target, value, note) => {
    setSaid('');
    const r = await addBlock(target, value, note);
    if (r.ok) { setSaid(`Blocked ${target} ${value}.`); setBlocks(await listBlocks()); }
    else setSaid(r.message || 'The block was not made.');
  }, []);
  const onRemove = useCallback(async (id) => {
    setSaid('');
    const r = await removeBlock(id);
    if (r.ok) { setSaid('Unblocked.'); setBlocks(await listBlocks()); }
    else setSaid(r.message || 'The block was not removed.');
  }, []);

  const loading = !bots && !traffic && !blocks;
  return (
    <div className="space-y-3" data-testid="edge-guard">
      <p className="text-[0.6875rem] text-[#5A5751] leading-relaxed">
        Read live from Cloudflare through the app&apos;s own <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>/edge</span> road. Our own witnesses are named in the user-agent list so they are never mistaken for a stranger; the family&apos;s phones and TVs are browsers and are not told apart here.
      </p>
      {loading && <p className="text-xs text-[#5A5751]" aria-live="polite">Asking the edge…</p>}
      {said && <p className="text-xs text-[#1A1815]" role="status" data-testid="edge-said">{said}</p>}
      <BotsCard bots={bots} onChange={onBots} busy={busy} />
      <TrafficCard traffic={traffic} onBlock={onBlock} />
      <BlocksCard blocks={blocks} onRemove={onRemove} onAdd={onBlock} />
      <div><button type="button" onClick={load} className={`${QUIET} ${RING}`} data-testid="edge-refresh">Refresh</button></div>
    </div>
  );
}
