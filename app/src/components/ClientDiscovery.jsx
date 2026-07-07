// =============================================================================
// ClientDiscovery — recorded discovery review queue (cf-voice-discovery, DR-0117)
// =============================================================================
// The factory's step-1 human gate, in the app: paste the NAS extraction's
// requirements.json → preview what the client actually said (every item
// carries their source_quote) → save as status='extracted' → a steward
// confirms/edits/rejects → confirmed requirements import to the client's
// build board as REAL board_tasks rows (the same lane ProjectBoards renders).
// Nothing unreviewed is ever built — the extractor proposes, the steward
// decides, the quote is the receipt.
// =============================================================================
import React, { useMemo, useState } from 'react';
import { parseDiscoveryJson } from '../lib/client-engagements.js';
import { useDiscoveryItems, saveExtraction, reviewItem, importToBoard } from '../lib/use-discovery.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const KIND_MARK = { requirement: '◈', pricing: '◆', policy: '▦', 'pain-point': '◔' };

const kebab = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

function PasteIntake() {
  const [raw, setRaw] = useState('');
  const [preview, setPreview] = useState(null);
  const [err, setErr] = useState('');
  const [savedMsg, setSavedMsg] = useState('');
  const runPreview = () => {
    setSavedMsg('');
    try {
      const parsed = parseDiscoveryJson(raw, { extractedAt: new Date().toISOString() });
      if (!parsed.items.length) { setErr('Parsed, but no buildable items found.'); setPreview(null); return; }
      setErr('');
      setPreview(parsed);
    } catch {
      setErr('Not valid extraction JSON — paste the requirements.json the pipeline produced.');
      setPreview(null);
    }
  };
  const save = async () => {
    const n = await saveExtraction(preview);
    setSavedMsg(`${n} items saved to the review queue below.`);
    setPreview(null); setRaw('');
  };
  return (
    <div className="rounded-xl border border-[#E8E2D8] bg-white p-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#5A5751]">Paste an extraction (requirements.json)</div>
      <textarea
        aria-label="Extraction JSON"
        className="mt-2 h-28 w-full rounded border border-[#E8E2D8] bg-white p-2 font-mono text-xs text-[#1A1815]"
        placeholder='{"client":{"name":"...","business":"..."},"requirements":[...],...}'
        value={raw} onChange={(e) => setRaw(e.target.value)}
      />
      <div className="mt-2 flex items-center gap-2">
        <button type="button" className="rounded-lg border border-[#2A5A8E] px-3 py-1.5 text-sm font-semibold text-[#2A5A8E]" onClick={runPreview} disabled={!raw.trim()}>Preview</button>
        {preview && (
          <button type="button" className="rounded-lg bg-[#B85838] px-3 py-1.5 text-sm font-semibold text-white" onClick={save}>
            Save {preview.items.length} items for review
          </button>
        )}
      </div>
      {err && <p className="mt-2 text-xs text-[#B85838]">{err}</p>}
      {savedMsg && <p className="mt-2 text-xs text-[#5A6E3D]">{savedMsg}</p>}
      {preview && (
        <div className="mt-2 text-xs text-[#5A5751]">
          <span className="font-semibold text-[#1A1815]" style={SERIF}>{preview.client.business || preview.client.name || 'Unnamed client'}</span>
          {' '}— {preview.items.filter((i) => i.kind === 'requirement').length} requirements ·{' '}
          {preview.items.filter((i) => i.kind === 'pricing').length} pricing ·{' '}
          {preview.items.filter((i) => i.kind === 'policy').length} policies ·{' '}
          {preview.items.filter((i) => i.kind === 'pain-point').length} pain points
          {preview.unclear.length > 0 && (
            <div className="mt-1 text-[#B85838]">Flagged unclear by the extractor: {preview.unclear.join(' · ')}</div>
          )}
        </div>
      )}
    </div>
  );
}

function ItemCard({ item }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.text);
  const [importing, setImporting] = useState(false);
  const [boardSlug, setBoardSlug] = useState(item.businessName ? `board-${kebab(item.businessName)}` : '');
  const [boardTitle, setBoardTitle] = useState(item.businessName || '');
  const [importMsg, setImportMsg] = useState('');
  const statusTone = item.status === 'reviewed' ? 'border-[#5A6E3D] text-[#5A6E3D]'
    : item.status === 'rejected' ? 'border-[#5A5751] text-[#5A5751]'
    : 'border-[#B85838] text-[#B85838]';
  const doImport = async () => {
    const r = await importToBoard(item, { boardSlug: kebab(boardSlug), boardTitle: boardTitle.trim() });
    setImportMsg(r.ok ? 'On the board.' : r.reason);
    if (r.ok) setImporting(false);
  };
  return (
    <div className="rounded-xl border border-[#E8E2D8] bg-white p-3 text-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs text-[#5A5751]">
            <span aria-hidden="true">{KIND_MARK[item.kind] || '◈'}</span> {item.kind}
            {item.area ? ` · ${item.area}` : ''}
            {item.confidence ? ` · ${item.confidence} confidence` : ''}
            {item.businessName ? ` · ${item.businessName}` : ''}
          </div>
          {editing ? (
            <textarea aria-label="Buildable text" className="mt-1 w-full rounded border border-[#E8E2D8] p-2 text-sm" value={text} onChange={(e) => setText(e.target.value)} />
          ) : (
            <div className="mt-0.5 font-semibold text-[#1A1815]" style={SERIF}>{item.text}{item.amountText ? ` — ${item.amountText}` : ''}</div>
          )}
          {item.sourceQuote && (
            <blockquote className="mt-1 border-l-2 border-[#E8E2D8] pl-2 text-xs italic text-[#5A5751]">&ldquo;{item.sourceQuote}&rdquo;</blockquote>
          )}
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs ${statusTone}`}>{item.status}</span>
      </div>
      {item.status === 'extracted' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button type="button" className="rounded-lg bg-[#5A6E3D] px-3 py-1 text-xs font-semibold text-white"
            onClick={() => reviewItem(item, { status: 'reviewed', text: editing ? text : null })}>
            ✓ Confirm{editing ? ' with edits' : ''}
          </button>
          <button type="button" className="rounded-lg border border-[#E8E2D8] px-3 py-1 text-xs text-[#5A5751]" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Cancel edit' : 'Edit first'}
          </button>
          <button type="button" className="rounded-lg border border-[#5A5751] px-3 py-1 text-xs text-[#5A5751]" onClick={() => reviewItem(item, { status: 'rejected' })}>Reject</button>
        </div>
      )}
      {item.status === 'reviewed' && item.kind === 'requirement' && !item.importedTaskSlug && (
        <div className="mt-2">
          {importing ? (
            <div className="flex flex-wrap items-center gap-2">
              <input aria-label="Board slug" className="rounded border border-[#E8E2D8] px-2 py-1 text-xs" placeholder="board-slug" value={boardSlug} onChange={(e) => setBoardSlug(e.target.value)} />
              <input aria-label="Board title" className="rounded border border-[#E8E2D8] px-2 py-1 text-xs" placeholder="Board title" value={boardTitle} onChange={(e) => setBoardTitle(e.target.value)} />
              <button type="button" className="rounded-lg bg-[#B85838] px-3 py-1 text-xs font-semibold text-white" onClick={doImport} disabled={!boardSlug.trim() || !boardTitle.trim()}>Import</button>
            </div>
          ) : (
            <button type="button" className="rounded-lg border border-[#B85838] px-3 py-1 text-xs font-semibold text-[#B85838]" onClick={() => setImporting(true)}>→ Send to build board</button>
          )}
        </div>
      )}
      {item.importedTaskSlug && <div className="mt-1 text-xs text-[#5A6E3D]">On the board · {item.importedTaskSlug.split(':')[0]}</div>}
      {importMsg && <div className="mt-1 text-xs text-[#5A5751]">{importMsg}</div>}
    </div>
  );
}

export default function ClientDiscovery() {
  const items = useDiscoveryItems();
  const [filter, setFilter] = useState('extracted');
  const counts = useMemo(() => ({
    extracted: items.filter((i) => i.status === 'extracted').length,
    reviewed: items.filter((i) => i.status === 'reviewed').length,
    rejected: items.filter((i) => i.status === 'rejected').length,
  }), [items]);
  const shown = items.filter((i) => i.status === filter);
  return (
    <div className="mt-2 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#1A1815]" style={SERIF}>Client discovery — the review gate</h2>
        <p className="text-xs text-[#5A5751]">The client&rsquo;s recorded words become reviewable items; nothing unreviewed is built. Confirm what&rsquo;s right, edit what&rsquo;s close, reject what&rsquo;s wrong — confirmed requirements go straight onto their build board.</p>
      </div>
      <PasteIntake />
      <div className="flex gap-2">
        {(['extracted', 'reviewed', 'rejected']).map((k) => (
          <button key={k} type="button"
            className={`rounded-full border px-3 py-1 text-xs ${filter === k ? 'border-[#B85838] font-semibold text-[#B85838]' : 'border-[#E8E2D8] text-[#5A5751]'}`}
            onClick={() => setFilter(k)}>
            {k} ({counts[k]})
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="text-sm text-[#5A5751]">
          {filter === 'extracted'
            ? 'Nothing awaiting review — paste an extraction above when the next client conversation lands.'
            : `No ${filter} items yet.`}
        </p>
      ) : (
        <div className="space-y-1.5">{shown.map((i) => <ItemCard key={i.id} item={i} />)}</div>
      )}
    </div>
  );
}
