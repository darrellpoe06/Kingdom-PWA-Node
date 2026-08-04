// =============================================================================
// AdvocacyCases — the Advocacy Case Manager surface (pb-advocacy-outcomes made
// real; Darrell 2026-08-04). Students and families document situations AS THEY
// HAPPEN — dated entries, the institution's words verbatim, the family's
// witness labeled as witness, institution-held data named for records requests —
// so when they ask for help, the data supporting their perspective is already
// in hand and the context never has to be reconstructed from memory.
//
// Surface only. Model/transforms: ../lib/advocacy-cases.js (pure, tested).
// Sync: ../lib/advocacy-sync.js (advocacy_records, 0132, family-instance RLS).
// Local-first: works signed-out from localStorage; sync is the courier.
//
// NOT LEGAL ADVICE (the pb-advocacy-outcomes bright line): this surface manages
// the family's OWN documentation and drafts. It never claims legal authority.
// =============================================================================
import React, { useEffect, useMemo, useState } from 'react';
import UiIcon from './UiIcon.jsx';
import {
  ADVOCACY_VERSES, EVIDENCE_TIERS, ENTRY_TYPES, CASE_STATUSES, ESCALATION_LADDER,
  newCase, newEntry, casesOf, entriesOf, caseStats, ladderIndex, buildContextPack,
  loadAdvocacy, saveAdvocacy,
} from '../lib/advocacy-cases.js';
import { advocacySync, mergeRemoteAdvocacy } from '../lib/advocacy-sync.js';

const serif = { fontFamily: '"Fraunces", serif' };
const BTN = 'text-[0.6875rem] uppercase tracking-wider px-3 py-1.5 border focus:outline focus:outline-2 focus:outline-[#B85838]';
const FIELD = 'w-full border border-[#D8D4CC] bg-white px-2 py-1.5 text-sm text-[#1A1815] focus:outline focus:outline-2 focus:outline-[#B85838]';
const LABEL = 'block text-[0.6875rem] uppercase tracking-wider text-[#5A5751] mb-1';

function tierBadge(tierId) {
  const t = EVIDENCE_TIERS.find((x) => x.id === tierId);
  const tone = tierId === 'their-words' ? 'bg-[#1A1815] text-white'
    : tierId === 'their-data' ? 'bg-[#5A5751] text-white'
    : 'border border-[#5A5751] text-[#5A5751]';
  return <span className={`inline-block px-1.5 py-0.5 text-[0.625rem] uppercase tracking-wider ${tone}`}>{t ? t.label : tierId}</span>;
}

export default function AdvocacyCases() {
  const [records, setRecords] = useState(() => loadAdvocacy());
  const [openCase, setOpenCase] = useState(null); // caseSlug or null (list view)
  const [showNewCase, setShowNewCase] = useState(false);
  const [packOpen, setPackOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Persist locally on every change (local-first source of truth on-device).
  useEffect(() => { saveAdvocacy(records); }, [records]);

  // Cloud courier: stream the family's records; merge preserving local-only
  // rows whose INSERT hasn't landed yet. No-op signed out.
  useEffect(() => {
    const unsub = advocacySync.subscribe((items) => {
      setRecords((cur) => mergeRemoteAdvocacy(cur, items || []));
    });
    return unsub;
  }, []);

  const cases = useMemo(() => casesOf(records).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))), [records]);
  const current = useMemo(() => cases.find((c) => c.caseSlug === openCase) || null, [cases, openCase]);
  const currentEntries = useMemo(() => (current ? entriesOf(records, current.caseSlug) : []), [records, current]);

  const addRecord = (rec) => {
    setRecords((cur) => [...cur, rec]);
    advocacySync.upload(rec);
  };
  const patchRecord = (id, patch) => {
    setRecords((cur) => cur.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const target = records.find((r) => r.id === id);
    if (target && target.remoteUuid) advocacySync.updateRow(target.remoteUuid, patch);
  };
  const removeRecord = (id) => {
    const target = records.find((r) => r.id === id);
    setRecords((cur) => cur.filter((r) => r.id !== id));
    if (target && target.remoteUuid) advocacySync.deleteRow(target.remoteUuid);
  };

  const copyPack = async () => {
    const pack = buildContextPack(current, records);
    try {
      await navigator.clipboard.writeText(pack);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable — the pack stays visible for manual copy */ }
  };

  return (
    <div className="px-3 pb-16 text-[#1A1815]">
      <div className="pt-6 pb-4">
        <div className="text-[0.6875rem] uppercase tracking-[0.2em] text-[#5A5751]">Advocacy</div>
        <h1 className="text-2xl" style={serif}>The Case File</h1>
        <p className="text-sm mt-1 text-[#5A5751]">
          Document situations as they happen — dated, in order, with their words kept
          verbatim and yours labeled as your witness — so when you ask for help, the
          data supporting your perspective is already in hand.
        </p>
        <p className="text-[0.6875rem] mt-2 uppercase tracking-wider text-[#5A5751]">
          Your family&rsquo;s own documentation tool — not legal advice.
        </p>
      </div>

      {/* The Word's frame for the practice */}
      <div className="bg-white border border-[#E4E0D8] p-3 mb-4">
        <div className="text-[0.6875rem] uppercase tracking-wider mb-2 text-[#5A5751]">Why write it down</div>
        {ADVOCACY_VERSES.slice(0, 2).map((v) => (
          <p key={v.ref} className="text-sm mb-1.5">
            <strong>KJV — {v.ref}:</strong> <em>&ldquo;{v.text}&rdquo;</em>
          </p>
        ))}
      </div>

      {!current && (
        <>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg" style={serif}>Case files ({cases.length})</h2>
            <button type="button" className={`${BTN} border-[#B85838] text-[#B85838]`} onClick={() => setShowNewCase((s) => !s)}>
              <UiIcon name="pencil" /> New case
            </button>
          </div>

          {showNewCase && (
            <NewCaseForm
              onCreate={(fields) => {
                const c = newCase(fields);
                addRecord(c);
                setShowNewCase(false);
                setOpenCase(c.caseSlug);
              }}
              onCancel={() => setShowNewCase(false)}
            />
          )}

          {!cases.length && !showNewCase && (
            <div className="bg-white border border-[#E4E0D8] p-4 text-sm text-[#5A5751]">
              No case files yet. Start one the day something needs documenting — a class
              placement, a denied request, a pattern worth dating. The record you build
              at the time is the record that carries weight later.
            </div>
          )}

          <div className="space-y-2">
            {cases.map((c) => {
              const stats = caseStats(records, c.caseSlug);
              const status = CASE_STATUSES.find((s) => s.id === c.status);
              return (
                <button
                  key={c.id}
                  type="button"
                  className="w-full text-left bg-white border border-[#E4E0D8] p-3 hover:border-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
                  onClick={() => setOpenCase(c.caseSlug)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base" style={serif}>{c.title || '(untitled case)'}</span>
                    <span className="text-[0.625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#5A5751] text-[#5A5751]">{status ? status.label : c.status}</span>
                  </div>
                  <div className="text-xs mt-1 text-[#5A5751]">
                    {c.student ? `${c.student} · ` : ''}{c.institution || 'institution not set'}
                    {' · '}{stats.total} dated {stats.total === 1 ? 'entry' : 'entries'}
                    {stats.first ? ` · ${stats.first} → ${stats.last}` : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {current && (
        <CaseDetail
          caseRecord={current}
          entries={currentEntries}
          records={records}
          onBack={() => { setOpenCase(null); setPackOpen(false); }}
          onPatch={(patch) => patchRecord(current.id, patch)}
          onAddEntry={(fields) => addRecord(newEntry(current.caseSlug, fields))}
          onRemoveEntry={removeRecord}
          packOpen={packOpen}
          setPackOpen={setPackOpen}
          onCopyPack={copyPack}
          copied={copied}
        />
      )}
    </div>
  );
}

function NewCaseForm({ onCreate, onCancel }) {
  const [title, setTitle] = useState('');
  const [student, setStudent] = useState('');
  const [institution, setInstitution] = useState('');
  const [ask, setAsk] = useState('');
  return (
    <div className="bg-white border border-[#E4E0D8] p-3 mb-4">
      <div className="grid gap-2">
        <div>
          <label className={LABEL} htmlFor="ac-title">Case title</label>
          <input id="ac-title" className={FIELD} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. STEM class enrollment" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={LABEL} htmlFor="ac-student">Who this is for</label>
            <input id="ac-student" className={FIELD} value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Student / person" />
          </div>
          <div>
            <label className={LABEL} htmlFor="ac-inst">Institution</label>
            <input id="ac-inst" className={FIELD} value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="School / organization" />
          </div>
        </div>
        <div>
          <label className={LABEL} htmlFor="ac-ask">The specific ask</label>
          <input id="ac-ask" className={FIELD} value={ask} onChange={(e) => setAsk(e.target.value)} placeholder="What outcome are you requesting?" />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${BTN} border-[#B85838] bg-[#B85838] text-white disabled:opacity-40`}
            disabled={!title.trim()}
            onClick={() => onCreate({ title, student, institution, ask })}
          >
            Start the file
          </button>
          <button type="button" className={`${BTN} border-[#D8D4CC]`} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function CaseDetail({ caseRecord, entries, records, onBack, onPatch, onAddEntry, onRemoveEntry, packOpen, setPackOpen, onCopyPack, copied }) {
  const [showEntry, setShowEntry] = useState(false);
  const stats = caseStats(records, caseRecord.caseSlug);
  const stepIdx = ladderIndex(caseRecord.ladderStep);
  const pack = packOpen ? buildContextPack(caseRecord, records) : '';

  return (
    <div>
      <button type="button" className={`${BTN} border-[#D8D4CC] mb-3`} onClick={onBack}>
        All cases
      </button>

      <div className="bg-white border border-[#E4E0D8] p-3 mb-3">
        <h2 className="text-xl" style={serif}>{caseRecord.title || '(untitled case)'}</h2>
        <div className="text-xs mt-1 text-[#5A5751]">
          {caseRecord.student ? `${caseRecord.student} · ` : ''}{caseRecord.institution || 'institution not set'}
        </div>
        {caseRecord.ask ? <p className="text-sm mt-2"><strong>The ask:</strong> {caseRecord.ask}</p> : null}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <label className={LABEL} htmlFor="ac-status">Status</label>
            <select id="ac-status" className={FIELD} value={caseRecord.status} onChange={(e) => onPatch({ status: e.target.value })}>
              {CASE_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="ac-step">Current step</label>
            <select id="ac-step" className={FIELD} value={caseRecord.ladderStep} onChange={(e) => onPatch({ ladderStep: e.target.value })}>
              {ESCALATION_LADDER.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <p className="text-xs mt-2 text-[#5A5751]">{ESCALATION_LADDER[stepIdx].tip}</p>
      </div>

      {/* Evidence on hand — honest counts from real entries */}
      <div className="bg-white border border-[#E4E0D8] p-3 mb-3">
        <div className="text-[0.6875rem] uppercase tracking-wider mb-2 text-[#5A5751]">Evidence on hand</div>
        <div className="flex flex-wrap gap-3">
          {EVIDENCE_TIERS.map((t) => (
            <div key={t.id} className="text-sm">
              {tierBadge(t.id)} <strong className="ml-1">{stats.byTier[t.id]}</strong>
            </div>
          ))}
        </div>
        {!stats.byTier['their-data'] && (
          <p className="text-xs mt-2 text-[#5A5751]">
            No institution-held records logged yet — that gap is what a public records
            request fills. Name rosters, seat counts, criteria, and communications precisely.
          </p>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg" style={serif}>Dated record ({entries.length})</h3>
        <div className="flex gap-2">
          <button type="button" className={`${BTN} border-[#B85838] text-[#B85838]`} onClick={() => setShowEntry((s) => !s)}>
            <UiIcon name="pencil" /> Add entry
          </button>
          <button type="button" className={`${BTN} border-[#1A1815] text-[#1A1815]`} onClick={() => setPackOpen((s) => !s)}>
            <UiIcon name="mail" /> Context pack
          </button>
        </div>
      </div>

      {showEntry && <NewEntryForm onAdd={(f) => { onAddEntry(f); setShowEntry(false); }} onCancel={() => setShowEntry(false)} />}

      {packOpen && (
        <div className="bg-white border border-[#1A1815] p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[0.6875rem] uppercase tracking-wider text-[#5A5751]">
              The context pack — paste this when you ask for help
            </div>
            <button type="button" className={`${BTN} border-[#1A1815] bg-[#1A1815] text-white`} onClick={onCopyPack}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="text-xs whitespace-pre-wrap overflow-x-auto text-[#1A1815]">{pack}</pre>
        </div>
      )}

      {!entries.length && !showEntry && (
        <div className="bg-white border border-[#E4E0D8] p-4 text-sm text-[#5A5751]">
          The record starts with the first dated entry. Log what happened, who was
          involved, and — if the institution said something — their exact words.
        </div>
      )}

      <ol className="space-y-2">
        {entries.map((e) => {
          const type = ENTRY_TYPES.find((t) => t.id === e.entryType);
          return (
            <li key={e.id} className="bg-white border border-[#E4E0D8] p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <strong>{e.occurredAt}</strong>
                  <span className="ml-2 text-[0.625rem] uppercase tracking-wider px-1.5 py-0.5 border border-[#5A5751] text-[#5A5751]">{type ? type.label : e.entryType}</span>
                  <span className="ml-1">{tierBadge(e.evidenceTier)}</span>
                </div>
                <button
                  type="button"
                  className="text-[0.625rem] uppercase tracking-wider text-[#B85838] focus:outline focus:outline-2 focus:outline-[#B85838]"
                  onClick={() => onRemoveEntry(e.id)}
                  aria-label={`Remove entry dated ${e.occurredAt}`}
                >
                  Remove
                </button>
              </div>
              {e.parties ? <div className="text-xs mt-1 text-[#5A5751]">{e.parties}</div> : null}
              {e.summary ? <p className="text-sm mt-1 text-[#5A5751]">{e.summary}</p> : null}
              {e.theirWords ? (
                <blockquote className="text-sm mt-1 border-l-2 border-[#B85838] pl-2 italic">
                  &ldquo;{e.theirWords}&rdquo;
                  <span className="not-italic text-[0.625rem] uppercase tracking-wider ml-1 text-[#5A5751]">verbatim</span>
                </blockquote>
              ) : null}
              {e.followUp ? <p className="text-xs mt-1 text-[#5A5751]"><strong>Follow-up:</strong> {e.followUp}</p> : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function NewEntryForm({ onAdd, onCancel }) {
  const [entryType, setEntryType] = useState('incident');
  const [evidenceTier, setEvidenceTier] = useState('our-witness');
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [parties, setParties] = useState('');
  const [summary, setSummary] = useState('');
  const [theirWords, setTheirWords] = useState('');
  const [followUp, setFollowUp] = useState('');
  const tier = EVIDENCE_TIERS.find((t) => t.id === evidenceTier);

  return (
    <div className="bg-white border border-[#E4E0D8] p-3 mb-3">
      <div className="grid gap-2">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className={LABEL} htmlFor="ae-date">Date it happened</label>
            <input id="ae-date" type="date" className={FIELD} value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
          </div>
          <div>
            <label className={LABEL} htmlFor="ae-type">What kind</label>
            <select id="ae-type" className={FIELD} value={entryType} onChange={(e) => setEntryType(e.target.value)}>
              {ENTRY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className={LABEL} htmlFor="ae-tier">Evidence tier</label>
            <select id="ae-tier" className={FIELD} value={evidenceTier} onChange={(e) => setEvidenceTier(e.target.value)}>
              {EVIDENCE_TIERS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </div>
        </div>
        {tier ? <p className="text-xs text-[#5A5751]">{tier.detail}</p> : null}
        <div>
          <label className={LABEL} htmlFor="ae-parties">Who was involved (roles preferred)</label>
          <input id="ae-parties" className={FIELD} value={parties} onChange={(e) => setParties(e.target.value)} placeholder="e.g. the counselor, the assistant principal" />
        </div>
        <div>
          <label className={LABEL} htmlFor="ae-summary">What happened, in your words</label>
          <textarea id="ae-summary" className={FIELD} rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </div>
        <div>
          <label className={LABEL} htmlFor="ae-words">Their words, verbatim (if they said or wrote something)</label>
          <textarea id="ae-words" className={FIELD} rows={2} value={theirWords} onChange={(e) => setTheirWords(e.target.value)} placeholder="Copy exactly — do not paraphrase" />
        </div>
        <div>
          <label className={LABEL} htmlFor="ae-follow">Follow-up promised / needed</label>
          <input id="ae-follow" className={FIELD} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={`${BTN} border-[#B85838] bg-[#B85838] text-white disabled:opacity-40`}
            disabled={!summary.trim() && !theirWords.trim()}
            onClick={() => onAdd({ entryType, evidenceTier, occurredAt, parties, summary, theirWords, followUp })}
          >
            Log it
          </button>
          <button type="button" className={`${BTN} border-[#D8D4CC]`} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
