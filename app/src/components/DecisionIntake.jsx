// =============================================================================
// DecisionIntake — paste a transcript, notes or a status report; tick the
// candidates that are real; they become concern rows the board reads (DR-0610)
// =============================================================================
// Sits above the Decision Intelligence board on Projects → Governance. The
// pasted text lives only in this component's state and is never saved. Only
// the candidates a person ticks are written, through addConcern, the same path
// the Concerns board uses, each carrying its verbatim quote and line as the
// evidence. The extraction is deterministic (lib/decision-intake.js), so what
// is proposed can be checked against the words on the screen.
// =============================================================================
import React, { useState } from 'react';
import { INTAKE_KINDS, SIGNALS, extractCandidates, candidateToConcern } from '../lib/decision-intake.js';

const SIGNAL_LABEL = Object.fromEntries(SIGNALS.map((s) => [s.key, s.label]));
const SERIF = { fontFamily: '"Fraunces", serif' };
const MONO = { fontFamily: '"JetBrains Mono", monospace' };

export default function DecisionIntake({ addConcern = null, nowMs }) {
  const [kind, setKind] = useState('transcript');
  const [label, setLabel] = useState('');
  const [area, setArea] = useState('');
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [picked, setPicked] = useState({});
  const [edits, setEdits] = useState({});
  const [said, setSaid] = useState('');

  const find = () => {
    const r = extractCandidates(text, { kind, nowMs: Number.isFinite(nowMs) ? nowMs : Date.now() });
    setResult(r);
    setPicked({});
    setEdits({});
    setSaid('');
  };

  const edit = (id, field, value) => setEdits((e) => ({ ...e, [id]: { ...(e[id] || {}), [field]: value } }));
  const valueOf = (c, field) => (edits[c.id] && edits[c.id][field] !== undefined ? edits[c.id][field] : c[field]);

  const chosen = result && result.ok ? result.candidates.filter((c) => picked[c.id]) : [];

  const add = () => {
    if (!addConcern || !chosen.length) return;
    const pastedAt = new Date(Number.isFinite(nowMs) ? nowMs : Date.now()).toISOString();
    for (const c of chosen) {
      addConcern(candidateToConcern({ ...c, owner: valueOf(c, 'owner'), targetDate: valueOf(c, 'targetDate') }, { kind, label, area, pastedAt }));
    }
    setSaid(`Added ${chosen.length} ${chosen.length === 1 ? 'row' : 'rows'} to Concerns. The board below reads them now.`);
    setResult(null);
    setPicked({});
    setEdits({});
    setText('');
  };

  return (
    <section className="bg-white border-2 border-[#1A1815] p-4 sm:p-5 space-y-3" data-testid="decision-intake">
      <div>
        <div className="text-[0.625rem] uppercase tracking-[0.3em] text-[#2A5A8E] font-semibold">Governance · Intake</div>
        <h3 className="text-base text-[#1A1815] mt-1" style={{ ...SERIF, fontWeight: 600 }}>Paste what was said. Keep what is real.</h3>
        <p className="text-sm text-[#1A1815] mt-1" style={SERIF}>
          Paste a meeting transcript, notes or a status report. PoeTech lists every line that names a risk, a dependency, a stalled item, a date at risk, a decision or an action, with the line it came from. Tick the ones that are real and they become concerns, with the quote as their evidence. The pasted text stays on this screen and is not saved.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-xs text-[#5A5751]" style={SERIF}>
          What it is
          <select data-testid="intake-kind" value={kind} onChange={(e) => setKind(e.target.value)} className="mt-1 block w-full min-h-[44px] border border-[#E8E4DC] bg-white px-2 text-sm text-[#1A1815]">
            {INTAKE_KINDS.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
          </select>
        </label>
        <label className="text-xs text-[#5A5751]" style={SERIF}>
          Name it (optional)
          <input data-testid="intake-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Weekly sync, 9/24" className="mt-1 block w-full min-h-[44px] border border-[#E8E4DC] px-2 text-sm text-[#1A1815]" />
        </label>
        <label className="text-xs text-[#5A5751]" style={SERIF}>
          Project or area (optional)
          <input data-testid="intake-area" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Building fund" className="mt-1 block w-full min-h-[44px] border border-[#E8E4DC] px-2 text-sm text-[#1A1815]" />
        </label>
      </div>

      <label className="block text-xs text-[#5A5751]" style={SERIF}>
        The text
        <textarea data-testid="intake-text" value={text} onChange={(e) => setText(e.target.value)} rows={8} className="mt-1 block w-full border border-[#E8E4DC] p-2 text-sm text-[#1A1815]" style={MONO} />
      </label>

      <div className="flex flex-wrap gap-2">
        <button type="button" data-testid="intake-find" onClick={find} disabled={!text.trim()} className="min-h-[44px] px-4 border-2 border-[#1A1815] bg-[#1A1815] text-white text-sm disabled:opacity-50">Find what needs attention</button>
        {result && result.ok && result.candidates.length > 0 && (
          <button type="button" data-testid="intake-add" onClick={add} disabled={!chosen.length || !addConcern} className="min-h-[44px] px-4 border-2 border-[#2A5A8E] text-[#2A5A8E] text-sm disabled:opacity-50">
            Add {chosen.length} ticked to Concerns
          </button>
        )}
      </div>

      {!addConcern && <p className="text-xs text-[#B85838]" style={SERIF}>Adding rows needs a signed-in steward. You can still read what the text contains.</p>}
      {said && <p data-testid="intake-said" className="text-sm text-[#5A6E3D]" style={SERIF}>{said}</p>}

      {result && !result.ok && <p data-testid="intake-reason" className="text-sm text-[#B85838]" style={SERIF}>{result.reason}</p>}

      {result && result.ok && (
        <div className="space-y-2" data-testid="intake-result">
          <p className="text-[0.6875rem] text-[#5A5751]" style={MONO}>
            read {result.lines} lines · {result.candidates.length} to review · {result.quiet} named nothing to act on{result.truncated ? ' · more than 60 found, the first 60 are shown' : ''}
          </p>
          {result.candidates.length === 0 && <p className="text-sm text-[#5A5751]" style={SERIF}>No line names a risk, a dependency, a stall, a date at risk, a decision or an action.</p>}
          <ul className="space-y-2">
            {result.candidates.map((c) => (
              <li key={c.id} data-testid="intake-candidate" data-primary={c.primary} className="border border-[#E8E4DC] p-2">
                <label className="flex items-start gap-2 min-h-[44px]">
                  <input type="checkbox" data-testid="intake-pick" checked={!!picked[c.id]} onChange={(e) => setPicked((p) => ({ ...p, [c.id]: e.target.checked }))} className="mt-1 h-5 w-5" />
                  <span className="text-sm text-[#1A1815]" style={SERIF}>
                    {c.speaker && <span className="text-[#5A5751]">{c.speaker}: </span>}
                    {c.text}
                  </span>
                </label>
                <p className="text-[0.625rem] text-[#5A5751] mt-1" style={MONO}>
                  {c.signals.map((s) => SIGNAL_LABEL[s]).join(' · ')} · line {c.lines.join(', ')}{c.count > 1 ? ` · said ${c.count} times` : ''}
                </p>
                {c.waitsOn && <p className="text-[0.6875rem] text-[#8B6F47]" style={SERIF}>Waits on: {c.waitsOn}</p>}
                {c.decision && <p className="text-[0.6875rem] text-[#5A6E3D]" style={SERIF}>Decide: {c.decision}</p>}
                <div className="grid gap-2 sm:grid-cols-2 mt-1">
                  <label className="text-[0.6875rem] text-[#5A5751]" style={SERIF}>
                    Owner {c.owner ? '' : '(none named)'}
                    <input data-testid="intake-owner" value={valueOf(c, 'owner') || ''} onChange={(e) => edit(c.id, 'owner', e.target.value)} className="mt-0.5 block w-full min-h-[44px] border border-[#E8E4DC] px-2 text-sm text-[#1A1815]" />
                  </label>
                  <label className="text-[0.6875rem] text-[#5A5751]" style={SERIF}>
                    Target date {c.targetDate ? '' : '(none named)'}
                    <input type="date" data-testid="intake-date" value={valueOf(c, 'targetDate') || ''} onChange={(e) => edit(c.id, 'targetDate', e.target.value)} className="mt-0.5 block w-full min-h-[44px] border border-[#E8E4DC] px-2 text-sm text-[#1A1815]" />
                  </label>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
