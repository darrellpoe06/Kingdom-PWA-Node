// =============================================================================
// CreateFromWords — tick what the words should become, press Create (DR-1200)
// =============================================================================
// The words on the card go straight down the ticked roads (lib/create-from-
// words.js); no box, no second Send. Every box is a real checkbox with its
// label; Create says why it is waiting when nothing is ticked (UX-PATTERNS
// 2f.3); the line under it says what was sent and what was not.
// =============================================================================
import React, { useState } from 'react';
import { CREATE_TARGETS, defaultTargets, createProblem, createFromWords, createdLine } from '../lib/create-from-words.js';
import { relayThought } from '../lib/agent-inbox-sync.js';
import { sendPoeTechRequest } from '../lib/poetech-request.js';

const SERIF = { fontFamily: '"Fraunces", serif' };
const LIVE = { relay: relayThought, poetech: sendPoeTechRequest };

export default function CreateFromWords({ body = '', destination = '', deps = LIVE, idBase = 'create' }) {
  const [targets, setTargets] = useState(() => defaultTargets(destination));
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState('');
  const problem = createProblem(body, targets);
  const toggle = (id) => setTargets((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const create = async () => {
    if (problem || busy) return;
    setBusy(true); setSaid('Sending…');
    const results = await createFromWords({ body, targets, relay: deps.relay, poetech: deps.poetech });
    setBusy(false);
    setSaid(createdLine(results));
  };
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="create-from-words">
      {CREATE_TARGETS.map((t) => (
        <label key={t.id} className="flex items-center gap-1.5 text-[0.75rem] text-[#1A1815] min-h-[36px] cursor-pointer" style={SERIF} title={`Goes ${t.goes}.`}>
          <input
            type="checkbox" checked={targets.includes(t.id)} onChange={() => toggle(t.id)}
            data-testid={`${idBase}-${t.id}`} className="accent-[#B85838]"
          />
          {t.label}
        </label>
      ))}
      <button
        type="button" onClick={create} disabled={!!problem || busy}
        data-testid={`${idBase}-go`}
        className="text-[0.625rem] uppercase tracking-wider px-3 min-h-[44px] border bg-[#1A1815] text-white border-[#1A1815] disabled:opacity-40 focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#B85838]"
      >Create</button>
      {problem && !said && <span className="text-[0.6875rem] text-[#5A5751]" style={SERIF} data-testid={`${idBase}-why`}>{problem}</span>}
      {said && <span className="text-[0.6875rem] text-[#5A6E3D] font-semibold" role="status" style={SERIF} data-testid={`${idBase}-said`}>{said}</span>}
    </div>
  );
}
